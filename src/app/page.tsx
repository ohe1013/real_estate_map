"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import PlaceSheet from "@/components/PlaceSheet";
import { getUserPlaces } from "@/lib/queries";
import { KakaoPlace, Place } from "@/types";
import { useSession, signOut } from "next-auth/react";
import {
  Settings,
  LogOut,
  User as UserIcon,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import Dashboard from "@/components/Dashboard";
import TemplateManager from "@/components/TemplateManager";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-sans italic animate-pulse">
      지도를 불러오는 중...
    </div>
  ),
});

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);
  const [isPickMode, setIsPickMode] = useState(false);
  const [pendingManualName, setPendingManualName] = useState<string | null>(
    null,
  );
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const fetchSavedPlaces = () => {
    getUserPlaces().then(setSavedPlaces);
  };

  useEffect(() => {
    fetchSavedPlaces();
  }, [session]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const hasName =
      typeof session?.user?.name === "string" &&
      session.user.name.trim().length > 0;
    if (!hasName) {
      router.replace("/auth/complete-profile");
    }
  }, [router, session?.user?.name, status]);

  const handlePlaceSelect = (place: KakaoPlace) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    setIsPickMode(false);
    setPendingManualName(null);
    setSelectedLocation([lng, lat]);
    setSelectedPlace(place);
  };

  const handleSavedPlaceClick = (place: Place) => {
    setIsPickMode(false);
    setPendingManualName(null);
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

  const handleRequestManualPick = (name: string) => {
    setSelectedPlace(null);
    setSelectedLocation(null);
    setPendingManualName(name.trim() || "직접 등록 장소");
    setIsPickMode(true);
  };

  const handleMapPick = (lng: number, lat: number) => {
    if (!isPickMode) return;

    const placeName = pendingManualName?.trim() || "직접 등록 장소";
    const manualPlace: KakaoPlace = {
      id: `manual:${Date.now()}`,
      place_name: placeName,
      x: lng.toString(),
      y: lat.toString(),
      address_name: "지도에서 직접 선택한 위치",
      road_address_name: "",
      place_url: "",
      category_name: "직접 등록",
      category_group_code: "",
      category_group_name: "",
      phone: "",
      distance: "",
    };

    handlePlaceSelect(manualPlace);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <SearchBox
        onSelect={handlePlaceSelect}
        onRequestManualPick={handleRequestManualPick}
      />

      <MapView
        selectedLocation={selectedLocation}
        savedPlaces={savedPlaces}
        onPlaceSelect={handleSavedPlaceClick}
        pickMode={isPickMode}
        onMapPick={handleMapPick}
      />

      {isPickMode && (
        <div className="absolute top-20 left-4 right-4 md:right-auto z-10 md:w-96 rounded-xl border border-blue-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg text-xs font-bold text-blue-700">
          지도에서 위치를 클릭해{" "}
          <span className="font-black">“{pendingManualName || "새 장소"}”</span>
          를 등록하세요.
        </div>
      )}

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
                  setShowDashboard(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 px-5 rounded-2xl shadow-xl border border-white/20 text-gray-700 hover:text-blue-600 transition-all hover:pr-8 group/item"
              >
                <LayoutDashboard className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                <span className="text-sm font-bold">저장한 장소 목록</span>
              </button>
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
                {session.user?.name || session.user?.email || "내 계정"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner">
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt="프로필 이미지"
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

      {showDashboard && (
        <Dashboard
          places={savedPlaces}
          onClose={() => setShowDashboard(false)}
          onSelectPlace={(place) => {
            handleSavedPlaceClick(place);
            setShowDashboard(false);
          }}
        />
      )}
    </main>
  );
}
