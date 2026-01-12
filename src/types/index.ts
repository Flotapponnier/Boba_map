/**
 * Core types for the Boba map application
 */

export type PlaceCategory =
  | "accommodation"
  | "food"
  | "event"
  | "service"
  | "activity"
  | "transport"
  | "nightlife";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  coordinates: Coordinates;
  price?: number;
  currency?: string;
  rating?: number;
  address?: string;
  tags?: string[];
  imageUrl?: string;
  // For user-created posts
  isUserPost?: boolean;
  postData?: unknown;
}

export interface SearchQuery {
  raw: string;
  keywords: string[];
  maxPrice?: number;
  category?: PlaceCategory;
}

export interface MapConfig {
  center: Coordinates;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}


