// Feature components (organized by domain)
export {
  AuthModal,
  UserMenu,
  CreatePostModal,
  FeedbackModal,
  PlaceReviewModal,
  ResultsList,
  SearchBar,
  CommunityModal,
} from "./features";

// Standalone components
export { BobaMascot } from "./BobaMascot";
export { BobaFeedback } from "./BobaFeedback";
export { PWAInstallPrompt } from "./PWAInstallPrompt";
export { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";

// Map is exported separately due to dynamic import requirement
// Use: import dynamic from "next/dynamic";
//      const Map = dynamic(() => import("@/components/features/map").then(m => m.Map), { ssr: false });
