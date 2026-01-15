import { KakaoPlace } from "@/types";
import { Search, MapPin } from "lucide-react";

interface SuggestListProps {
  results: KakaoPlace[];
  onSelect: (place: KakaoPlace) => void;
  active: boolean;
}

export default function SuggestList({
  results,
  onSelect,
  active,
}: SuggestListProps) {
  if (!active || results.length === 0) return null;

  return (
    <div className="absolute top-full left-0 w-full bg-white z-20 shadow-lg border border-gray-200 rounded-b-lg overflow-hidden max-h-[60vh] overflow-y-auto font-sans">
      <ul>
        {results.map((place) => (
          <li key={place.id}>
            <button
              onClick={() => onSelect(place)}
              className="flex items-start w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b last:border-b-0 border-gray-50"
            >
              <div className="mt-1 mr-3">
                <MapPin className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800 font-bold">
                    {place.place_name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {place.category_name.split(">").pop()?.trim()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {place.road_address_name || place.address_name}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
