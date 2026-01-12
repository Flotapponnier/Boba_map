"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@/types";
import { DEFAULT_MAP_CONFIG, OSM_TILE_URL, OSM_ATTRIBUTION } from "@/constants";

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

      {visiblePlaces.map((place) => (
        <Marker
          key={place.id}
          position={[place.coordinates.lat, place.coordinates.lng]}
          icon={createColoredIcon(CATEGORY_COLORS[place.category] || "#3B82F6")}
          eventHandlers={{
            click: () => onPlaceSelect?.(place),
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-bold text-gray-900">{place.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{place.description}</p>
              {place.price !== undefined && (
                <p className="text-sm font-medium text-green-600 mt-2">
                  {place.price === 0 ? "Free" : `${place.price}€`}
                </p>
              )}
              {place.rating && (
                <p className="text-sm text-yellow-600">
                  ⭐ {place.rating.toFixed(1)}
                </p>
              )}
              {place.address && (
                <p className="text-xs text-gray-500 mt-1">{place.address}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default Map;
