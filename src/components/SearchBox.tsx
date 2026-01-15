"use client";
import React, { useState, useRef } from "react";
import { getSearchList } from "@/lib/kakaoSearch";
import { KakaoPlace } from "@/types";
import { Search, Loader2 } from "lucide-react";
import SuggestList from "./search/SuggestList";
import SearchList from "./search/SearchList";

interface SearchBoxProps {
  onSelect: (place: KakaoPlace) => void;
}

export default function SearchBox({ onSelect }: SearchBoxProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time search as user types
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (keyword.trim().length > 1 && isFocused) {
        executeSearch(keyword);
      } else if (keyword.trim().length === 0) {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [keyword, isFocused]);

  // We should ideally get mapInstance from context or props to pass to getSearchList for location-biased search
  // For MVP without context, we'll rely on global kakao or pass null (default sort)
  // Or we can assume the MapView puts the map instance in window.mapInstance (hacky)
  // Better: Page.tsx manages map instance?
  // For now: pass null mapInstance, just keyword search.

  const executeSearch = (searchKeyword: string) => {
    setLoading(true);
    setResults([]);

    getSearchList({
      keyword: searchKeyword,
      mapInstance: null, // MVP: Global search or sort by distance if possible
      onResults: (data, status) => {
        setLoading(false);
        if (window.kakao && status === window.kakao.maps.services.Status.OK) {
          // data types match KakaoPlace mostly
          setResults(data as unknown as KakaoPlace[]);
        } else {
          setResults([]);
        }
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(keyword);
    inputRef.current?.blur();
    setIsFocused(false);
  };

  const handlePlaceSelect = (place: KakaoPlace) => {
    onSelect(place);
    setResults([]);
    setKeyword(place.place_name);
    setIsFocused(false);
  };

  return (
    <div className="absolute top-4 left-4 right-4 md:right-auto z-10 md:w-80 font-sans">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full pl-10 pr-4 py-3 rounded-lg shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black text-sm"
          placeholder="장소나 아파트 이름을 검색하세요..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setIsFocused(true)}
          // onBlur delayed to allow click events on lists
        />
        <div className="absolute left-3 top-3 text-gray-400">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
      </form>

      {/* Suggest List now shows real place results in real-time */}
      {isFocused && (
        <SuggestList
          results={results}
          active={isFocused}
          onSelect={handlePlaceSelect}
        />
      )}

      {/* Result List (SearchList can be used as a fallback or for a persistent sidebar, but here we merge under input) */}
      {!isFocused && results.length > 0 && (
        <SearchList results={results} onSelect={handlePlaceSelect} />
      )}
    </div>
  );
}
