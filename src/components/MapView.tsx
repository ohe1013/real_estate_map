"use client";

import React, { useEffect, useRef, useState } from "react";
import { Place } from "@/types";
import { logClientError, logClientEvent } from "@/lib/observability";

interface MapViewProps {
  selectedLocation?: [number, number] | null; // lng, lat
  savedPlaces?: Place[];
  onPlaceSelect?: (place: Place) => void;
  pickMode?: boolean;
  onMapPick?: (lng: number, lat: number) => void;
}

type OverlayEntry = {
  overlay: { setMap: (map: unknown) => void };
  signature: string;
};

type KakaoLatLngLike = {
  getLat: () => number;
  getLng: () => number;
};

export default function MapView({
  selectedLocation,
  savedPlaces,
  onPlaceSelect,
  pickMode = false,
  onMapPick,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<{ panTo: (latLng: unknown) => void } | null>(null);
  const selectedMarker = useRef<{ setMap: (map: unknown) => void } | null>(null);
  const savedOverlayMap = useRef<Map<string, OverlayEntry>>(new Map());
  const pickModeRef = useRef(pickMode);
  const onMapPickRef = useRef(onMapPick);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    pickModeRef.current = pickMode;
  }, [pickMode]);

  useEffect(() => {
    onMapPickRef.current = onMapPick;
  }, [onMapPick]);

  useEffect(() => {
    if (mapInstance.current) return;
    if (!mapContainer.current) return;

    const initialize = () => {
      if (!mapContainer.current || !window.kakao?.maps?.load) return;

      window.kakao.maps.load(() => {
        try {
          const options = {
            center: new window.kakao.maps.LatLng(37.5326, 127.024612),
            level: 3,
          };

          const map = new window.kakao.maps.Map(mapContainer.current, options);
          mapInstance.current = map as unknown as {
            panTo: (latLng: unknown) => void;
          };

          window.kakao.maps.event.addListener(
            map,
            "click",
            (mouseEvent: { latLng: KakaoLatLngLike }) => {
              if (!pickModeRef.current || !onMapPickRef.current) return;

              const latLng = mouseEvent?.latLng;
              if (!latLng) return;
              const lat = latLng.getLat();
              const lng = latLng.getLng();
              onMapPickRef.current(lng, lat);
              logClientEvent("map.manual_pick", { lat, lng });
            }
          );

          setIsMapReady(true);
        } catch (error) {
          logClientError("map.init_failed", error);
        }
      });
    };

    if (!window.kakao?.maps) {
      const checkKakao = window.setInterval(() => {
        if (window.kakao?.maps) {
          window.clearInterval(checkKakao);
          initialize();
        }
      }, 100);

      return () => {
        window.clearInterval(checkKakao);
      };
    }

    initialize();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    mapContainer.current.style.cursor = pickMode ? "crosshair" : "";
  }, [pickMode]);

  useEffect(() => {
    if (!isMapReady || !mapInstance.current) return;

    const nextPlaces = savedPlaces || [];
    const overlayMap = savedOverlayMap.current;
    const nextIds = new Set(nextPlaces.map((place) => place.id));

    for (const [placeId, entry] of overlayMap.entries()) {
      if (!nextIds.has(placeId)) {
        entry.overlay.setMap(null);
        overlayMap.delete(placeId);
      }
    }

    nextPlaces.forEach((place) => {
      const evaluation = place.notes?.[0]?.evaluation;
      let color = place.favorites?.color || "#6b7280";
      let filter = "";

      if (evaluation === "FAIL") {
        color = "#9ca3af";
        filter = "grayscale(1) opacity(0.6)";
      } else if (evaluation === "HOLD") {
        filter = "opacity(0.8)";
      }

      const signature = `${place.lat}:${place.lng}:${color}:${filter}:${evaluation || ""}`;
      const existing = overlayMap.get(place.id);
      if (existing?.signature === signature) {
        return;
      }

      if (existing) {
        existing.overlay.setMap(null);
      }

      const content = document.createElement("div");
      content.className =
        "w-6 h-6 rounded-full border-2 border-white cursor-pointer shadow-md transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125";
      content.style.backgroundColor = color;
      if (filter) content.style.filter = filter;

      if (evaluation === "PASS") {
        content.classList.add("ring-4", "ring-blue-400", "ring-opacity-50");
      }

      content.onclick = (event) => {
        event.stopPropagation();
        onPlaceSelect?.(place);
      };

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(place.lat, place.lng),
        content,
        map: mapInstance.current,
        clickable: true,
      }) as unknown as { setMap: (map: unknown) => void };

      overlayMap.set(place.id, { overlay, signature });
    });
  }, [savedPlaces, isMapReady, onPlaceSelect]);

  useEffect(() => {
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
    }) as unknown as { setMap: (map: unknown) => void };
  }, [selectedLocation, isMapReady]);

  useEffect(() => {
    const overlayMap = savedOverlayMap.current;
    return () => {
      if (selectedMarker.current) {
        selectedMarker.current.setMap(null);
      }
      for (const entry of overlayMap.values()) {
        entry.overlay.setMap(null);
      }
      overlayMap.clear();
    };
  }, []);

  return <div ref={mapContainer} className="w-full h-full" />;
}
