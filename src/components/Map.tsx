"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@/types";
import { DEFAULT_MAP_CONFIG, OSM_TILE_URL, OSM_ATTRIBUTION, getAvatarByIndex, getFeedback, getBookingLink } from "@/constants";

// Custom colored marker
function createColoredIcon(color: string) {
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

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "#3B82F6", // blue
  food: "#F97316", // orange
  event: "#8B5CF6", // purple
  service: "#10B981", // green
  activity: "#EC4899", // pink
  transport: "#6B7280", // gray
  nightlife: "#EF4444", // red
};

const BOOKING_LABELS: Record<string, string> = {
  accommodation: "Book now →",
  food: "See reviews →",
  event: "Join event →",
  service: "Learn more →",
  activity: "Sign up →",
  nightlife: "See more →",
};

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

interface MapProps {
  places: Place[];
  onPlaceSelect?: (place: Place) => void;
  isSearching: boolean;
  onSearchAnimationComplete?: () => void;
}

export function Map({
  places,
  onPlaceSelect,
  isSearching,
  onSearchAnimationComplete,
}: MapProps) {
  const [visiblePlaces, setVisiblePlaces] = useState<Place[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const prevPlacesRef = useRef<Place[]>([]);

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

    if (places.length === 0) {
      setIsShowingSequence(false);
      return;
    }

    setIsShowingSequence(true);

    const timeouts: NodeJS.Timeout[] = [];

    // Show each place one by one with camera focus
    places.forEach((place, index) => {
      const timeout = setTimeout(
        () => {
          setVisiblePlaces((prev) => [...prev, place]);
          setCurrentFocusIndex(index);
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
  }, [places]);

  // Get the index of a place in the original array
  const getPlaceIndex = (placeId: string): number => {
    return places.findIndex((p) => p.id === placeId);
  };

  return (
    <MapContainer
      center={[DEFAULT_MAP_CONFIG.center.lat, DEFAULT_MAP_CONFIG.center.lng]}
      zoom={DEFAULT_MAP_CONFIG.zoom}
      minZoom={DEFAULT_MAP_CONFIG.minZoom}
      maxZoom={DEFAULT_MAP_CONFIG.maxZoom}
      className="h-full w-full"
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />

      <MapController
        places={places}
        currentFocusIndex={currentFocusIndex}
        isShowingSequence={isShowingSequence}
        onSequenceComplete={handleSequenceComplete}
      />

      {visiblePlaces.map((place) => {
        const index = getPlaceIndex(place.id);
        const avatar = getAvatarByIndex(index);
        const feedback = getFeedback(place.category, place.price, index);
        const bookingLink = getBookingLink(place.name, place.category);

        return (
          <Marker
            key={place.id}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={createColoredIcon(CATEGORY_COLORS[place.category] || "#3B82F6")}
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
  );
}

export default Map;
