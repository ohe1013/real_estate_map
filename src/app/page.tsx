"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import SearchBox from "@/components/SearchBox";
import PlaceSheet from "@/components/PlaceSheet";
import { getUserPlaces } from "@/lib/queries";
import { KakaoPlace, Place } from "@/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-sans italic animate-pulse">
      지도를 불러오는 중...
    </div>
  ),
});

export default function Home() {
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);

  const fetchSavedPlaces = () => {
    getUserPlaces().then(setSavedPlaces);
  };

  useEffect(() => {
    fetchSavedPlaces();
  }, []);

  const handlePlaceSelect = (place: KakaoPlace) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    setSelectedLocation([lng, lat]);
    setSelectedPlace(place);
  };

  const handleSavedPlaceClick = (place: Place) => {
    const kp: KakaoPlace = {
      id: place.kakaoId,
      place_name: place.name,
      x: place.lng.toString(),
      y: place.lat.toString(),
      address_name: place.address || "",
      road_address_name: place.roadAddress || "",
      place_url: "",
      category_name: "",
      category_group_code: "",
      category_group_name: "",
      phone: "",
      distance: "",
    };
    handlePlaceSelect(kp);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <SearchBox onSelect={handlePlaceSelect} />
      <MapView
        selectedLocation={selectedLocation}
        savedPlaces={savedPlaces}
        onPlaceSelect={handleSavedPlaceClick}
      />
      {selectedPlace && (
        <PlaceSheet
          place={selectedPlace}
          onClose={() => {
            setSelectedPlace(null);
            setSelectedLocation(null);
          }}
          onSave={fetchSavedPlaces}
        />
      )}
    </main>
  );
}
