/**
 * Amadeus API Service
 * Documentation: https://developers.amadeus.com/self-service/apis-docs
 *
 * Free tier: 2000 requests/month
 * 
 * Flow:
 * 1. Get hotel list by city (v1/reference-data/locations/hotels/by-city)
 * 2. Get offers for those hotels (v3/shopping/hotel-offers)
 */

// Types
interface AmadeusToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface AmadeusHotelBasic {
  chainCode?: string;
  iataCode?: string;
  dupeId?: number;
  name: string;
  hotelId: string;
  geoCode: {
    latitude: number;
    longitude: number;
  };
  address?: {
    countryCode?: string;
  };
}

interface AmadeusHotelOffer {
  type: string;
  hotel: {
    hotelId: string;
    name: string;
    cityCode?: string;
    latitude?: number;
    longitude?: number;
  };
  available: boolean;
  offers?: Array<{
    id: string;
    price: {
      total: string;
      currency: string;
    };
    room?: {
      type?: string;
      description?: {
        text?: string;
      };
    };
  }>;
}

// Configuration
// Use TEST environment by default (free tier)
const AMADEUS_BASE_URL = "https://test.api.amadeus.com";
const AMADEUS_AUTH_URL = `${AMADEUS_BASE_URL}/v1/security/oauth2/token`;

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Amadeus access token (cached for 30 min)
 */
async function getAccessToken(apiKey: string, apiSecret: string): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const response = await fetch(AMADEUS_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Amadeus auth failed: ${error}`);
  }

  const data: AmadeusToken = await response.json();

  // Cache token (expire 1 minute before actual expiry for safety)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

/**
 * Search hotels by city code
 */
export interface HotelSearchParams {
  cityCode: string; // IATA city code (e.g., "STR" for Stuttgart)
  checkInDate: string; // Format: YYYY-MM-DD
  checkOutDate: string; // Format: YYYY-MM-DD
  adults?: number;
  roomQuantity?: number;
  priceRange?: string; // e.g., "1-200" (min-max in EUR)
  currency?: string;
  ratings?: string[]; // e.g., ["3", "4", "5"] for 3-5 star hotels
}

export interface HotelResult {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  price: number | null;
  currency: string;
  rating: number | null;
  address: string | null;
  roomType: string | null;
  available: boolean;
}

/**
 * Step 1: Get list of hotels in a city
 */
async function getHotelsByCity(
  cityCode: string,
  token: string
): Promise<AmadeusHotelBasic[]> {
  const response = await fetch(
    `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=20&radiusUnit=KM&hotelSource=ALL`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Hotel list error:", error);
    return [];
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Step 2: Get offers for specific hotels
 */
async function getHotelOffers(
  hotelIds: string[],
  checkInDate: string,
  checkOutDate: string,
  token: string,
  currency = "EUR"
): Promise<AmadeusHotelOffer[]> {
  // API limits to 50 hotels per request
  const limitedIds = hotelIds.slice(0, 20);

  const queryParams = new URLSearchParams({
    hotelIds: limitedIds.join(","),
    checkInDate,
    checkOutDate,
    adults: "1",
    roomQuantity: "1",
    currency,
    bestRateOnly: "true",
  });

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v3/shopping/hotel-offers?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Hotel offers error:", error);
    return [];
  }

  const data = await response.json();
  return data.data || [];
}

export async function searchHotels(
  params: HotelSearchParams,
  apiKey: string,
  apiSecret: string
): Promise<HotelResult[]> {
  const token = await getAccessToken(apiKey, apiSecret);

  // Step 1: Get hotel list
  const hotelList = await getHotelsByCity(params.cityCode, token);

  if (hotelList.length === 0) {
    console.log("No hotels found in city");
    return [];
  }

  // Create a map of hotel details for coordinates
  const hotelDetailsMap = new Map<string, AmadeusHotelBasic>();
  hotelList.forEach((h) => hotelDetailsMap.set(h.hotelId, h));

  // Step 2: Get offers for these hotels
  const hotelIds = hotelList.map((h) => h.hotelId);
  const offers = await getHotelOffers(
    hotelIds,
    params.checkInDate,
    params.checkOutDate,
    token,
    params.currency
  );

  // Transform to our format
  const results: HotelResult[] = offers.map((item) => {
    const hotelDetails = hotelDetailsMap.get(item.hotel.hotelId);
    const offer = item.offers?.[0];
    const price = offer ? parseFloat(offer.price.total) : null;

    return {
      id: item.hotel.hotelId,
      name: item.hotel.name,
      coordinates: {
        lat: hotelDetails?.geoCode?.latitude || item.hotel.latitude || 0,
        lng: hotelDetails?.geoCode?.longitude || item.hotel.longitude || 0,
      },
      price,
      currency: offer?.price?.currency || "EUR",
      rating: null, // Not available in this endpoint
      address: hotelDetails?.address?.countryCode || null,
      roomType: offer?.room?.type || null,
      available: item.available,
    };
  });

  // Filter by price if specified
  let filtered = results.filter((h) => h.coordinates.lat !== 0);

  if (params.priceRange) {
    const [minStr, maxStr] = params.priceRange.split("-");
    const min = parseInt(minStr, 10);
    const max = parseInt(maxStr, 10);
    filtered = filtered.filter(
      (h) => h.price !== null && h.price >= min && h.price <= max
    );
  }

  // Sort by price
  filtered.sort((a, b) => (a.price || 999999) - (b.price || 999999));

  return filtered;
}

// City codes for common cities
export const CITY_CODES: Record<string, string> = {
  stuttgart: "STR",
  berlin: "BER",
  munich: "MUC",
  frankfurt: "FRA",
  hamburg: "HAM",
  paris: "PAR",
  london: "LON",
  barcelona: "BCN",
  rome: "ROM",
  amsterdam: "AMS",
  vienna: "VIE",
  prague: "PRG",
  lisbon: "LIS",
  madrid: "MAD",
  milan: "MIL",
  new_york: "NYC",
  los_angeles: "LAX",
  tokyo: "TYO",
  dubai: "DXB",
  singapore: "SIN",
};

/**
 * Get city code from city name
 */
export function getCityCode(cityName: string): string | null {
  const normalized = cityName.toLowerCase().trim().replace(/\s+/g, "_");
  return CITY_CODES[normalized] || null;
}
