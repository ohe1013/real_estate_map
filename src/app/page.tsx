"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import SearchBox from "@/components/SearchBox";
import PlaceSheet from "@/components/PlaceSheet";
import { getUserPlaces } from "@/lib/queries";
import { KakaoPlace, Place } from "@/types";
import { useSession, signOut } from "next-auth/react";
import TemplateManager from "@/components/TemplateManager";
import { Settings, LogOut, User as UserIcon, LogIn } from "lucide-react";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-sans italic animate-pulse">
      지도를 불러오는 중...
    </div>
  ),
});

export default function Home() {
  const { data: session } = useSession();
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  const fetchSavedPlaces = () => {
    getUserPlaces().then(setSavedPlaces);
  };

  useEffect(() => {
    fetchSavedPlaces();
  }, [session]);

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
  console.log(session);
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <SearchBox onSelect={handlePlaceSelect} />

      <MapView
        selectedLocation={selectedLocation}
        savedPlaces={savedPlaces}
        onPlaceSelect={handleSavedPlaceClick}
      />

      {/* Top Right Actions */}
      <div className="fixed top-4 right-4 z-10 flex flex-col gap-3">
        {session ? (
          <>
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 pl-4 pr-1.5 rounded-2xl shadow-xl border border-white/20">
              <span className="text-xs font-black text-gray-700">
                {session.user?.name || session.user?.email}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                {session.user?.image ? (
                  <img
                    loading="lazy"
                    src={session.user.image}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowTemplateManager(true)}
                className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/20 text-gray-700 hover:text-blue-600 transition-all active:scale-95 group"
                title="Templates"
              >
                <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
              </button>
              <button
                onClick={() => signOut()}
                className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/20 text-gray-700 hover:text-red-500 transition-all active:scale-95"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <a
            href="/auth/signin"
            className="bg-gray-900 text-white p-3 px-6 rounded-2xl shadow-xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" /> Login
          </a>
        )}
      </div>

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

      {showTemplateManager && (
        <TemplateManager onClose={() => setShowTemplateManager(false)} />
      )}
    </main>
  );
}
