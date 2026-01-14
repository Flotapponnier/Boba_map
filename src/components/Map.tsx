"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@/types";
import { DEFAULT_MAP_CONFIG, OSM_TILE_URL, OSM_ATTRIBUTION, getAvatarByIndex, getFeedback, getBookingLink } from "@/constants";
import { useBubbleSound } from "@/hooks";

// Category colors - distinct and visible
export const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "#1E293B", // dark slate (hotel)
  food: "#EA580C", // orange (restaurant)
  event: "#EAB308", // yellow (events)
  service: "#10B981", // emerald green
  activity: "#3B82F6", // blue
  transport: "#6B7280", // gray
  nightlife: "#9333EA", // purple (clubs/bars)
};

// Category labels for legend
export const CATEGORY_LABELS: Record<string, string> = {
  accommodation: "🏨 Hotels",
  food: "🍽️ Restaurants",
  event: "🎉 Events",
  service: "🛠️ Services",
  activity: "🎯 Activities",
  transport: "🚌 Transport",
  nightlife: "🎵 Nightlife",
};

const BOOKING_LABELS: Record<string, string> = {
  accommodation: "Book now →",
  food: "See reviews →",
  event: "Join event →",
  service: "Learn more →",
  activity: "Sign up →",
  nightlife: "See more →",
};

// Create custom marker with Boba avatar and feedback bubble
function createBobaMarker(
  color: string,
  avatarUrl: string,
  feedback: string,
  price: number | undefined
) {
  // Truncate feedback for bubble
  const shortFeedback = feedback.length > 40 ? feedback.slice(0, 37) + "..." : feedback;
  const priceText = price !== undefined ? (price === 0 ? "Free" : `${price}€`) : "";
  
  return L.divIcon({
    className: "boba-marker",
    html: `
      <div style="position: relative; width: 200px; height: 80px;">
        <!-- Feedback bubble -->
        <div style="
          position: absolute;
          left: 35px;
          top: 0;
          background: white;
          border-radius: 12px;
          padding: 6px 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          max-width: 160px;
          font-size: 11px;
          line-height: 1.3;
          color: #374151;
          border: 1px solid #f3f4f6;
        ">
          <div style="font-weight: 600; color: ${color}; margin-bottom: 2px;">
            ${priceText}
          </div>
          <div style="color: #6b7280;">
            ${shortFeedback}
          </div>
          <!-- Triangle pointer -->
          <div style="
            position: absolute;
            left: -6px;
            top: 12px;
            width: 0;
            height: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-right: 6px solid white;
          "></div>
        </div>
        
        <!-- Avatar circle -->
        <div style="
          position: absolute;
          left: 0;
          top: 5px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: white;
          border: 2px solid ${color};
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img src="${avatarUrl}" style="width: 28px; height: 28px; object-fit: contain;" />
        </div>
        
        <!-- Pin point -->
        <div style="
          position: absolute;
          left: 12px;
          top: 38px;
          width: 8px;
          height: 8px;
          background: ${color};
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          left: 15px;
          top: 46px;
          width: 2px;
          height: 12px;
          background: ${color};
          border-radius: 1px;
        "></div>
      </div>
    `,
    iconSize: [200, 80],
    iconAnchor: [16, 58],
    popupAnchor: [80, -50],
  });
}

// User post marker with username bubble
function createUserPostMarker(color: string, avatarUrl: string, username: string, title: string) {
  // Truncate title for bubble
  const shortTitle = title.length > 25 ? title.slice(0, 22) + "..." : title;
  
  return L.divIcon({
    className: "user-post-marker",
    html: `
      <div style="position: relative; width: 200px; height: 80px;">
        <!-- Username and title bubble -->
        <div style="
          position: absolute;
          left: 45px;
          top: 0;
          background: white;
          border-radius: 12px;
          padding: 6px 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          max-width: 150px;
          font-size: 11px;
          line-height: 1.3;
          border: 2px solid ${color};
        ">
          <div style="font-weight: 700; color: ${color}; margin-bottom: 2px; font-size: 10px;">
            @${username}
          </div>
          <div style="color: #374151; font-weight: 500;">
            ${shortTitle}
          </div>
          <!-- Triangle pointer -->
          <div style="
            position: absolute;
            left: -8px;
            top: 12px;
            width: 0;
            height: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-right: 6px solid ${color};
          "></div>
          <div style="
            position: absolute;
            left: -5px;
            top: 13px;
            width: 0;
            height: 0;
            border-top: 5px solid transparent;
            border-bottom: 5px solid transparent;
            border-right: 5px solid white;
          "></div>
        </div>
        
        <!-- Avatar circle -->
        <div style="
          position: absolute;
          left: 0;
          top: 5px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${color};
          box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img src="${avatarUrl}" style="width: 34px; height: 34px; object-fit: contain;" />
        </div>
        
        <!-- Pin point -->
        <div style="
          position: absolute;
          left: 16px;
          top: 43px;
          width: 8px;
          height: 8px;
          background: ${color};
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          left: 19px;
          top: 49px;
          width: 2px;
          height: 10px;
          background: ${color};
          border-radius: 1px;
        "></div>
      </div>
    `,
    iconSize: [200, 80],
    iconAnchor: [20, 59],
    popupAnchor: [80, -55],
  });
}

// Simple marker for when we don't want the bubble
function createSimpleMarker(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

// Selection marker for creating posts
function createSelectionMarker() {
  return L.divIcon({
    className: "selection-marker",
    html: `
      <div style="position: relative; width: 40px; height: 50px;">
        <div style="
          position: absolute;
          left: 0;
          top: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #ea580c);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          animation: pulse 1.5s ease-in-out infinite;
        ">📍</div>
        <div style="
          position: absolute;
          left: 16px;
          top: 38px;
          width: 8px;
          height: 8px;
          background: #ea580c;
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          left: 19px;
          top: 44px;
          width: 2px;
          height: 8px;
          background: #ea580c;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
  });
}

interface MapControllerProps {
  places: Place[];
  currentFocusIndex: number;
  isShowingSequence: boolean;
  onSequenceComplete: () => void;
}

function MapController({
  places,
  currentFocusIndex,
  isShowingSequence,
  onSequenceComplete,
}: MapControllerProps) {
  const map = useMap();
  const sequenceCompleteRef = useRef(false);

  useEffect(() => {
    if (!isShowingSequence || places.length === 0) return;

    // Focus on current place in sequence
    if (currentFocusIndex >= 0 && currentFocusIndex < places.length) {
      const place = places[currentFocusIndex];
      map.flyTo([place.coordinates.lat, place.coordinates.lng], 15, {
        duration: 0.8,
      });
    }

    // When sequence is done, fit all bounds
    if (currentFocusIndex >= places.length && !sequenceCompleteRef.current) {
      sequenceCompleteRef.current = true;
      const bounds = L.latLngBounds(
        places.map((p) => [p.coordinates.lat, p.coordinates.lng])
      );
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1 });
      onSequenceComplete();
    }
  }, [map, places, currentFocusIndex, isShowingSequence, onSequenceComplete]);

  // Reset ref when places change
  useEffect(() => {
    sequenceCompleteRef.current = false;
  }, [places]);

  return null;
}

// Map click handler component
interface MapClickHandlerProps {
  onMapClick?: (lat: number, lng: number) => void;
  isSelectingPosition: boolean;
}

function MapClickHandler({ onMapClick, isSelectingPosition }: MapClickHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (!isSelectingPosition || !onMapClick) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      console.log("Map clicked:", e.latlng);
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, isSelectingPosition, onMapClick]);

  return null;
}

// Map Legend Component
function MapLegend({ visibleCategories }: { visibleCategories: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (visibleCategories.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>🗺️ Legend</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-gray-100 pt-2">
          {visibleCategories.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: CATEGORY_COLORS[category] || "#6B7280" }}
              />
              <span className="text-xs text-gray-600">
                {CATEGORY_LABELS[category] || category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MapProps {
  places: Place[];
  onPlaceSelect?: (place: Place) => void;
  isSearching: boolean;
  onSearchAnimationComplete?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  isSelectingPosition?: boolean;
  selectedPosition?: { lat: number; lng: number } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPostClick?: (post: any) => void;
}

export function Map({
  places,
  onPlaceSelect,
  isSearching,
  onSearchAnimationComplete,
  onMapClick,
  isSelectingPosition = false,
  selectedPosition,
  onPostClick,
}: MapProps) {
  const [visiblePlaces, setVisiblePlaces] = useState<Place[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [showBubbles, setShowBubbles] = useState(true);
  const prevPlacesRef = useRef<Place[]>([]);
  const { playSound } = useBubbleSound();

  const handleSequenceComplete = useCallback(() => {
    setIsShowingSequence(false);
    onSearchAnimationComplete?.();
  }, [onSearchAnimationComplete]);

  // Animate places appearing one by one with camera movement
  useEffect(() => {
    // Only trigger animation when places actually change
    const placesChanged =
      JSON.stringify(places.map((p) => p.id)) !==
      JSON.stringify(prevPlacesRef.current.map((p) => p.id));

    if (!placesChanged) return;

    prevPlacesRef.current = places;
    setVisiblePlaces([]);
    setCurrentFocusIndex(-1);
    setShowBubbles(true);

    if (places.length === 0) {
      setIsShowingSequence(false);
      onSearchAnimationComplete?.();
      return;
    }

    setIsShowingSequence(true);

    const timeouts: NodeJS.Timeout[] = [];

    // Show each place one by one with camera focus and sound (including user posts!)
    places.forEach((place, index) => {
      const timeout = setTimeout(
        () => {
          setVisiblePlaces((prev) => [...prev, place]);
          setCurrentFocusIndex(index);
          playSound(); // Play bubble pop sound! 🧋
        },
        index * 1000 + 500
      ); // 1 second per place, 500ms initial delay
      timeouts.push(timeout);
    });

    // Final timeout to trigger bounds fit
    const finalTimeout = setTimeout(
      () => {
        setCurrentFocusIndex(places.length);
      },
      places.length * 1000 + 1500
    );
    timeouts.push(finalTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [places, onSearchAnimationComplete, playSound]);

  // Get the index of a place in the original array
  const getPlaceIndex = (placeId: string): number => {
    return places.findIndex((p) => p.id === placeId);
  };

  // Get unique categories from visible places
  const visibleCategories = [...new Set(visiblePlaces.map((p) => p.category))];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[DEFAULT_MAP_CONFIG.center.lat, DEFAULT_MAP_CONFIG.center.lng]}
        zoom={DEFAULT_MAP_CONFIG.zoom}
        minZoom={DEFAULT_MAP_CONFIG.minZoom}
        maxZoom={DEFAULT_MAP_CONFIG.maxZoom}
        className={`h-full w-full ${isSelectingPosition ? "cursor-crosshair" : ""}`}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />

      <MapController
        places={places.filter((p) => !p.isUserPost)}
        currentFocusIndex={currentFocusIndex}
        isShowingSequence={isShowingSequence}
        onSequenceComplete={handleSequenceComplete}
      />

      <MapClickHandler 
        onMapClick={onMapClick} 
        isSelectingPosition={isSelectingPosition} 
      />

      {/* Selected position marker */}
      {selectedPosition && (
        <Marker
          position={[selectedPosition.lat, selectedPosition.lng]}
          icon={createSelectionMarker()}
        />
      )}

      {visiblePlaces.map((place) => {
        const index = getPlaceIndex(place.id);
        const color = CATEGORY_COLORS[place.category] || "#3B82F6";

        // Check if this is a user post
        if (place.isUserPost && place.postData) {
          const postData = place.postData as {
            user?: { avatarUrl?: string | null; username?: string };
            title?: string;
          };
          const avatarUrl = postData.user?.avatarUrl || "/avatars/golden.png";
          const username = postData.user?.username || "user";
          const title = postData.title || place.name;
          const icon = createUserPostMarker(color, avatarUrl, username, title);

          return (
            <Marker
              key={place.id}
              position={[place.coordinates.lat, place.coordinates.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onPostClick && place.postData) {
                    onPostClick(place.postData);
                  }
                },
              }}
            >
              <Popup maxWidth={280} minWidth={240}>
                <div className="p-1">
                  <h3 className="font-bold text-gray-900 text-base mb-1">
                    {place.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                  {place.price !== undefined && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      place.price === 0
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {place.price === 0 ? "Free" : `${place.price}€`}
                    </span>
                  )}
                  <button
                    onClick={() => onPostClick && place.postData && onPostClick(place.postData)}
                    className="mt-2 w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg text-center transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        }

        // Regular place marker
        const avatar = getAvatarByIndex(index);
        const feedback = getFeedback(place.category, place.price, index);
        const bookingLink = getBookingLink(place.name, place.category);

        // Use bubble marker with avatar and feedback
        const icon = showBubbles
          ? createBobaMarker(color, avatar.image, feedback, place.price)
          : createSimpleMarker(color);

        return (
          <Marker
            key={place.id}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onPlaceSelect?.(place),
            }}
          >
            <Popup maxWidth={320} minWidth={280}>
              <div className="p-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-base leading-tight">
                    {place.name}
                  </h3>
                  {place.price !== undefined && (
                    <span
                      className={`text-lg font-bold shrink-0 ${
                        place.price === 0
                          ? "text-green-600"
                          : place.price < 50
                            ? "text-blue-600"
                            : "text-amber-600"
                      }`}
                    >
                      {place.price === 0 ? "Free" : `${place.price}€`}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-3">{place.description}</p>

                {/* Rating */}
                {place.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < Math.round(place.rating!) ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-xs text-gray-500 ml-1">
                      {place.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Boba feedback */}
                <div className="flex items-start gap-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg mb-3">
                  <img
                    src={avatar.image}
                    alt={avatar.name}
                    className="w-8 h-8 object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-700">{avatar.name}</p>
                    <p className="text-xs text-gray-600 leading-tight">{feedback}</p>
                  </div>
                </div>

                {/* Address */}
                {place.address && (
                  <p className="text-xs text-gray-500 mb-3">📍 {place.address}</p>
                )}

                {/* Booking link */}
                {bookingLink && (
                  <a
                    href={bookingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg text-center transition-colors"
                  >
                    {BOOKING_LABELS[place.category] || "Learn more →"}
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      </MapContainer>
      
      {/* Legend overlay */}
      <MapLegend visibleCategories={visibleCategories} />
    </div>
  );
}

export default Map;
