"use client";

import React, { useEffect, useRef, useState } from "react";
import { Place } from "@/types";

interface MapViewProps {
  selectedLocation?: [number, number] | null; // lng, lat
  savedPlaces?: Place[];
  onPlaceSelect?: (place: Place) => void;
}

export default function MapView({
  selectedLocation,
  savedPlaces,
  onPlaceSelect,
}: MapViewProps) {
  console.log("test");
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null); // kakao.maps.Map
  const selectedMarker = useRef<any>(null); // kakao.maps.Marker
  const savedMarkers = useRef<any[]>([]); // kakao.maps.CustomOverlay[] or Marker[]

  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (mapInstance.current) return;
    if (!mapContainer.current) return;

    if (!window.kakao || !window.kakao.maps) {
      // Wait for SDK load if not ready (though layout script should handle it)
      const checkKakao = setInterval(() => {
        console.log("test");
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkKakao);
          initMap();
        }
      }, 100);
      return;
    }

    initMap();

    function initMap() {
      if (!mapContainer.current) return;
      window.kakao.maps.load(() => {
        const options = {
          center: new window.kakao.maps.LatLng(37.5326, 127.024612), // Gangnam
          level: 3,
        };
        mapInstance.current = new window.kakao.maps.Map(
          mapContainer.current,
          options
        );
        setIsMapReady(true);
      });
    }

    return () => {
      // cleanup?
    };
  }, []);

  // Handle Saved Places
  useEffect(() => {
    console.log("Handle Saved Places");
    if (!isMapReady || !mapInstance.current || !savedPlaces) return;

    // Clear
    savedMarkers.current.forEach((m) => m.setMap(null));
    savedMarkers.current = [];

    savedPlaces.forEach((place) => {
      const evaluation = place.notes?.[0]?.evaluation;
      let color = place.favorites?.color || "#6b7280";
      let filter = "";

      if (evaluation === "FAIL") {
        color = "#9ca3af"; // Gray
        filter = "grayscale(1) opacity(0.6)";
      } else if (evaluation === "HOLD") {
        filter = "opacity(0.8)";
      } else if (evaluation === "PASS") {
        // Boost color or add border?
      }

      // Use CustomOverlay for colored circle
      const content = document.createElement("div");
      content.className =
        "w-6 h-6 rounded-full border-2 border-white cursor-pointer shadow-md transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125";
      content.style.backgroundColor = color;
      if (filter) content.style.filter = filter;

      if (evaluation === "PASS") {
        content.classList.add("ring-4", "ring-blue-400", "ring-opacity-50");
      }

      content.onclick = (e) => {
        e.stopPropagation();
        onPlaceSelect?.(place);
      };

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(place.lat, place.lng),
        content: content,
        map: mapInstance.current,
        clickable: true,
      });

      savedMarkers.current.push(overlay);
    });
  }, [savedPlaces, isMapReady]);

  // Handle Selected Location
  useEffect(() => {
    console.log("Handle Selected Location");
    if (!isMapReady || !mapInstance.current || !selectedLocation) return;

    const [lng, lat] = selectedLocation;
    const moveLatLon = new window.kakao.maps.LatLng(lat, lng);

    mapInstance.current.panTo(moveLatLon);

    if (selectedMarker.current) {
      selectedMarker.current.setMap(null);
    }

    selectedMarker.current = new window.kakao.maps.Marker({
      position: moveLatLon,
      map: mapInstance.current,
    });
  }, [selectedLocation, isMapReady]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
