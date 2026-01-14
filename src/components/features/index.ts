// Auth features
export { AuthModal, UserMenu } from "./auth";

// Posts features
export { CreatePostModal, FeedbackModal } from "./posts";

// Places features
export { PlaceReviewModal, ResultsList } from "./places";

// Search features
export { SearchBar } from "./search";

// Communities features
export { CommunityModal } from "./communities";

// Map is NOT exported here due to SSR issues with Leaflet
// Import directly with dynamic(): import("@/components/features/map").then(m => m.Map)

