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
  postData?: PostWithUser;
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

/**
 * User types
 */
export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export interface PostUser {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface PostCommunity {
  id: number;
  name: string;
  isPublic: boolean;
}

export interface PostWithUser {
  id: number;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  address: string | null;
  price: number | null;
  user: PostUser | null;
  community: PostCommunity | null;
  communityId: number | null;
  rating: number | null;
  feedbackCount: number;
  imageUrl?: string | null;
  createdAt?: Date | null;
  // Event fields
  eventDate?: string | null;
  eventTime?: string | null;
  eventRecurrence?: "once" | "daily" | "weekly" | "monthly" | null;
}

export interface Feedback {
  id: number;
  postId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: Date | null;
  user?: PostUser;
}

export interface PostWithFeedbacks extends PostWithUser {
  feedbacks: Feedback[];
}

