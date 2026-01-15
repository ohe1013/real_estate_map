import { KakaoPlace } from "@/types";
import { MapPin } from "lucide-react";

interface SearchListProps {
  results: KakaoPlace[];
  onSelect: (place: KakaoPlace) => void;
}

export default function SearchList({ results, onSelect }: SearchListProps) {
  if (results.length === 0) return null;

  return (
    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg max-h-[60vh] overflow-y-auto border border-gray-200 z-10">
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
                  {place.phone && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {place.phone}
                    </p>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
