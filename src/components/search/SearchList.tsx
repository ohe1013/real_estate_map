import { KakaoPlace } from "@/types";
import { MapPin, Plus } from "lucide-react";

interface SearchListProps {
  results: KakaoPlace[];
  onSelect: (place: KakaoPlace) => void;
  keyword?: string;
  onRequestManualPick?: () => void;
}

export default function SearchList({
  results,
  onSelect,
  keyword,
  onRequestManualPick,
}: SearchListProps) {
  const handleManualRegister = () => {
    onRequestManualPick?.();
  };

  return (
    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg max-h-[60vh] overflow-y-auto border border-gray-200 z-10 transition-all">
      <ul>
        {results.map((place, idx) => (
          <li key={place.id + idx}>
            <button
              onClick={() => onSelect(place)}
              className="w-full text-left px-5 py-3 hover:bg-gray-100 transition-colors border-b last:border-b-0 border-gray-100"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    {place.place_name}
                    <span className="text-xs font-normal text-gray-400">
                      {place.category_name.split(">").pop()?.trim()}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {place.road_address_name || place.address_name}
                  </p>
                </div>
              </div>
            </button>
          </li>
        ))}
        {/* Manual registration button */}
        <li>
          <button
            onClick={handleManualRegister}
            className="w-full text-left px-5 py-4 hover:bg-blue-50 transition-colors border-t border-blue-100 flex items-center gap-3 group"
          >
            <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-blue-600">
                “{keyword || "새 장소"}” 위치 직접 등록하기
              </div>
              <div className="text-[10px] text-blue-400 mt-0.5">
                검색 결과에 없다면 직접 위치를 지정하세요
              </div>
            </div>
          </button>
        </li>
      </ul>
    </div>
  );
}
