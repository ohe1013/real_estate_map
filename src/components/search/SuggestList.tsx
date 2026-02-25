import { KakaoPlace } from "@/types";
import { MapPin, Plus } from "lucide-react";

interface SuggestListProps {
  results: KakaoPlace[];
  onSelect: (place: KakaoPlace) => void;
  active: boolean;
  keyword?: string;
  onRequestManualPick?: () => void;
}

export default function SuggestList({
  results,
  onSelect,
  active,
  keyword,
  onRequestManualPick,
}: SuggestListProps) {
  if (!active) return null;

  const handleManualRegister = () => {
    onRequestManualPick?.();
  };

  return (
    <div className="absolute top-full left-0 w-full bg-white z-20 shadow-xl border border-gray-200 rounded-b-xl overflow-hidden max-h-[60vh] overflow-y-auto font-sans animate-in fade-in slide-in-from-top-2 duration-200">
      <ul>
        {results.map((place) => (
          <li key={place.id}>
            <button
              onClick={() => onSelect(place)}
              className="flex items-start w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 border-gray-50 group"
            >
              <div className="mt-1 mr-3 bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800 font-bold">
                    {place.place_name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal px-1.5 py-0.5 bg-gray-50 rounded">
                    {place.category_name.split(">").pop()?.trim()}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 truncate mt-0.5">
                  {place.road_address_name || place.address_name}
                </div>
              </div>
            </button>
          </li>
        ))}

        {/* Manual registration option */}
        <li>
          <button
            onClick={handleManualRegister}
            className="w-full text-left px-4 py-4 hover:bg-blue-50 transition-colors flex items-center gap-3 border-t border-gray-50 group"
          >
            <div className="bg-blue-100 p-2 rounded-xl group-hover:bg-blue-200 transition-colors">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-blue-600">
                “{keyword || "..."}” 직접 등록하기
              </div>
              <div className="text-[10px] text-blue-400 mt-0.5">
                원하는 위치를 지도에서 직접 선택할 수 있습니다
              </div>
            </div>
          </button>
        </li>
      </ul>
    </div>
  );
}
