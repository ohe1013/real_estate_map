"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { searchAddresses, searchPlacesByKeyword } from "@/lib/kakaoSearch";
import { KakaoPlace } from "@/types";
import { Search, Loader2 } from "lucide-react";
import SuggestList from "./search/SuggestList";
import SearchList from "./search/SearchList";
import { logClientError } from "@/lib/observability";

interface SearchBoxProps {
  onSelect: (place: KakaoPlace) => void;
  onRequestManualPick?: (name: string) => void;
}

function dedupeResults(results: KakaoPlace[]) {
  const seen = new Set<string>();

  return results.filter((item) => {
    const key = `${item.id}::${item.address_name}::${item.x}::${item.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function SearchBox({
  onSelect,
  onRequestManualPick,
}: SearchBoxProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const requestSeqRef = useRef(0);

  const executeSearch = useCallback(async (searchKeyword: string) => {
    const normalizedKeyword = searchKeyword.trim();
    if (!normalizedKeyword) {
      setResults([]);
      setLoading(false);
      return;
    }

    const requestSeq = ++requestSeqRef.current;
    setLoading(true);

    try {
      const [placesResult, addressesResult] = await Promise.allSettled([
        searchPlacesByKeyword({
          keyword: normalizedKeyword,
          mapInstance: null,
        }),
        searchAddresses(normalizedKeyword),
      ]);

      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      const places = placesResult.status === "fulfilled" ? placesResult.value : [];
      const addresses =
        addressesResult.status === "fulfilled" ? addressesResult.value : [];

      setResults(dedupeResults([...places, ...addresses]));
    } catch (error) {
      logClientError("searchbox.execute_search_failed", error, {
        keyword: normalizedKeyword,
      });
      if (requestSeq === requestSeqRef.current) {
        setResults([]);
      }
    } finally {
      if (requestSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = keyword.trim();
      if (trimmed.length > 1 && isFocused) {
        void executeSearch(trimmed);
      } else if (trimmed.length === 0) {
        requestSeqRef.current += 1;
        setResults([]);
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [keyword, isFocused, executeSearch]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void executeSearch(keyword);
      inputRef.current?.blur();
      setIsFocused(false);
    },
    [executeSearch, keyword]
  );

  const handlePlaceSelect = useCallback(
    (place: KakaoPlace) => {
      onSelect(place);
      setResults([]);
      setKeyword(place.place_name);
      setIsFocused(false);
      setLoading(false);
    },
    [onSelect]
  );

  const handleRequestManualPick = useCallback(() => {
    const manualName = keyword.trim() || "새 장소";
    requestSeqRef.current += 1;
    setResults([]);
    setLoading(false);
    setIsFocused(false);
    onRequestManualPick?.(manualName);
  }, [keyword, onRequestManualPick]);

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
        />
        <div className="absolute left-3 top-3 text-gray-400">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
      </form>

      {isFocused && (
        <SuggestList
          results={results}
          active={isFocused}
          onSelect={handlePlaceSelect}
          keyword={keyword}
          onRequestManualPick={handleRequestManualPick}
        />
      )}

      {!isFocused && results.length > 0 && (
        <SearchList
          results={results}
          onSelect={handlePlaceSelect}
          keyword={keyword}
          onRequestManualPick={handleRequestManualPick}
        />
      )}
    </div>
  );
}
