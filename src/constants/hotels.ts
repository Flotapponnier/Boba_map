import type { Place } from "@/types";

/**
 * Hardcoded hotels in Stuttgart for MVP demo
 * Mix of cheap and expensive options
 */
export const STUTTGART_HOTELS: Place[] = [
  // CHEAP HOTELS (< 50€)
  {
    id: "hotel-cheap-1",
    name: "Jugendherberge Stuttgart International",
    description: "Youth hostel in the heart of Stuttgart. Dorms from 25€/night. Free WiFi, breakfast included.",
    category: "accommodation",
    coordinates: { lat: 48.7823, lng: 9.1751 },
    price: 25,
    currency: "EUR",
    rating: 4.2,
    address: "Haußmannstraße 27, 70188 Stuttgart",
    tags: ["hostel", "budget", "cheap", "backpacker", "dorm", "wifi", "breakfast"],
  },
  {
    id: "hotel-cheap-2",
    name: "Alex 30 Hostel",
    description: "Modern hostel near city center. Private rooms from 35€. Great atmosphere for travelers.",
    category: "accommodation",
    coordinates: { lat: 48.7695, lng: 9.1707 },
    price: 35,
    currency: "EUR",
    rating: 4.5,
    address: "Alexanderstraße 30, 70184 Stuttgart",
    tags: ["hostel", "modern", "cheap", "budget", "private room"],
  },
  {
    id: "hotel-cheap-3",
    name: "A&O Stuttgart City",
    description: "Budget hotel chain. Clean rooms starting at 39€. Perfect for short stays.",
    category: "accommodation",
    coordinates: { lat: 48.7834, lng: 9.1823 },
    price: 39,
    currency: "EUR",
    rating: 3.8,
    address: "Rosensteinstraße 16, 70191 Stuttgart",
    tags: ["hotel", "budget", "cheap", "chain", "clean"],
  },
  {
    id: "hotel-cheap-4",
    name: "Ibis Budget Stuttgart City Nord",
    description: "No-frills hotel with essential comfort. Rooms from 42€. Near public transport.",
    category: "accommodation",
    coordinates: { lat: 48.7912, lng: 9.1789 },
    price: 42,
    currency: "EUR",
    rating: 3.6,
    address: "Heilbronner Straße 88, 70191 Stuttgart",
    tags: ["hotel", "budget", "cheap", "ibis", "transport"],
  },
  {
    id: "hotel-cheap-5",
    name: "B&B Hotel Stuttgart-Bad Cannstatt",
    description: "Simple and affordable. Double rooms from 49€. Free parking available.",
    category: "accommodation",
    coordinates: { lat: 48.8012, lng: 9.2134 },
    price: 49,
    currency: "EUR",
    rating: 4.0,
    address: "Wildunger Straße 2, 70372 Stuttgart",
    tags: ["hotel", "budget", "cheap", "parking", "simple"],
  },

  // EXPENSIVE HOTELS (> 150€)
  {
    id: "hotel-expensive-1",
    name: "Le Méridien Stuttgart",
    description: "5-star luxury in the city center. Rooftop bar with panoramic views. Spa & wellness.",
    category: "accommodation",
    coordinates: { lat: 48.78421, lng: 9.18894 },
    price: 189,
    currency: "EUR",
    rating: 4.7,
    address: "Willy-Brandt-Straße 30, 70173 Stuttgart",
    tags: ["hotel", "luxury", "expensive", "5-star", "spa", "rooftop", "premium"],
  },
  {
    id: "hotel-expensive-2",
    name: "Steigenberger Graf Zeppelin",
    description: "Historic grand hotel since 1931. Elegant rooms, Michelin restaurant, prime location.",
    category: "accommodation",
    coordinates: { lat: 48.7832, lng: 9.1812 },
    price: 215,
    currency: "EUR",
    rating: 4.8,
    address: "Arnulf-Klett-Platz 7, 70173 Stuttgart",
    tags: ["hotel", "luxury", "expensive", "historic", "restaurant", "premium", "5-star"],
  },
  {
    id: "hotel-expensive-3",
    name: "Waldhotel Stuttgart",
    description: "Tranquil forest retreat with city views. Gourmet dining, infinity pool, tennis courts.",
    category: "accommodation",
    coordinates: { lat: 48.7645, lng: 9.1534 },
    price: 245,
    currency: "EUR",
    rating: 4.9,
    address: "Guts-Muths-Weg 18, 70597 Stuttgart",
    tags: ["hotel", "luxury", "expensive", "forest", "pool", "gourmet", "premium"],
  },
  {
    id: "hotel-expensive-4",
    name: "Der Zauberlehrling",
    description: "Boutique design hotel. Each room uniquely themed. Award-winning architecture.",
    category: "accommodation",
    coordinates: { lat: 48.7712, lng: 9.1678 },
    price: 175,
    currency: "EUR",
    rating: 4.6,
    address: "Rosenstraße 38, 70182 Stuttgart",
    tags: ["hotel", "luxury", "expensive", "boutique", "design", "unique", "premium"],
  },
  {
    id: "hotel-expensive-5",
    name: "Althoff Hotel am Schlossgarten",
    description: "Elegant 5-star overlooking Schlossgarten park. Michelin-starred restaurant, spa.",
    category: "accommodation",
    coordinates: { lat: 48.7867, lng: 9.1856 },
    price: 265,
    currency: "EUR",
    rating: 4.8,
    address: "Schillerstraße 23, 70173 Stuttgart",
    tags: ["hotel", "luxury", "expensive", "5-star", "park", "michelin", "spa", "premium"],
  },
];

/**
 * Get cheap hotels (< 50€)
 */
export function getCheapHotels(): Place[] {
  return STUTTGART_HOTELS.filter((h) => h.price !== undefined && h.price < 50);
}

/**
 * Get expensive hotels (> 150€)
 */
export function getExpensiveHotels(): Place[] {
  return STUTTGART_HOTELS.filter((h) => h.price !== undefined && h.price >= 150);
}

