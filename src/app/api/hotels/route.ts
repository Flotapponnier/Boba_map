import { NextRequest, NextResponse } from "next/server";
import { searchHotels, getCityCode } from "@/services/amadeus";

/**
 * GET /api/hotels
 * Search hotels via Amadeus API
 *
 * Query params:
 * - city: City name (e.g., "Stuttgart")
 * - checkIn: Check-in date (YYYY-MM-DD)
 * - checkOut: Check-out date (YYYY-MM-DD)
 * - maxPrice: Maximum price (optional)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const city = searchParams.get("city");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const maxPrice = searchParams.get("maxPrice");

  // Validate required params
  if (!city || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: "Missing required params: city, checkIn, checkOut" },
      { status: 400 }
    );
  }

  // Get city code
  const cityCode = getCityCode(city);
  if (!cityCode) {
    return NextResponse.json(
      { error: `Unknown city: ${city}. Supported: Stuttgart, Berlin, Paris, etc.` },
      { status: 400 }
    );
  }

  // Check API credentials
  const apiKey = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Amadeus API credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const hotels = await searchHotels(
      {
        cityCode,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        priceRange: maxPrice ? `1-${maxPrice}` : undefined,
        currency: "EUR",
      },
      apiKey,
      apiSecret
    );

    return NextResponse.json({
      city,
      cityCode,
      checkIn,
      checkOut,
      count: hotels.length,
      hotels,
    });
  } catch (error) {
    console.error("Amadeus API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotels" },
      { status: 500 }
    );
  }
}








