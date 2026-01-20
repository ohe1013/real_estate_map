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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <SearchBox onSelect={handlePlaceSelect} />

      <MapView
        selectedLocation={selectedLocation}
        savedPlaces={savedPlaces}
        onPlaceSelect={handleSavedPlaceClick}
      />

      {/* User Actions - Toggleable Menu */}
      <div className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-3 group">
        {session ? (
          <div className="relative flex flex-col items-end gap-3">
            {/* Toggleable Menu Items */}
            <div
              className={`flex flex-col gap-2 transition-all duration-300 origin-bottom ${
                isMenuOpen
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-90 translate-y-4 pointer-events-none"
              }`}
            >
              <button
                onClick={() => {
                  setShowTemplateManager(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 px-5 rounded-2xl shadow-xl border border-white/20 text-gray-700 hover:text-blue-600 transition-all hover:pr-8 group/item"
              >
                <Settings className="w-5 h-5 group-hover/item:rotate-45 transition-transform duration-500" />
                <span className="text-sm font-bold">템플릿 설정</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 px-5 rounded-2xl shadow-xl border border-white/20 text-gray-700 hover:text-red-500 transition-all hover:pr-8"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-bold">로그아웃</span>
              </button>
            </div>

            {/* User Profile Button (Toggle) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 pl-4 pr-1.5 rounded-2xl shadow-2xl border transition-all active:scale-95 ${
                isMenuOpen
                  ? "border-blue-500 ring-4 ring-blue-500/10"
                  : "border-white/20"
              }`}
            >
              <span className="text-xs font-black text-gray-700">
                {session.user?.name || session.user?.email}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner">
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
            </button>
          </div>
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
