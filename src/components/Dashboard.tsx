"use client";
import React, { useState } from "react";
import { Place } from "@/types";
import {
  X,
  Search,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";

interface DashboardProps {
  places: Place[];
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
}

export default function Dashboard({
  places,
  onClose,
  onSelectPlace,
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlaces = places.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.roadAddress || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: places.length,
    pass: places.filter((p) => p.notes?.some((n) => n.evaluation === "PASS"))
      .length,
    hold: places.filter((p) => p.notes?.some((n) => n.evaluation === "HOLD"))
      .length,
    fail: places.filter((p) => p.notes?.some((n) => n.evaluation === "FAIL"))
      .length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/20">
        {/* Header */}
        <div className="p-8 pb-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                저장한 장소 목록
              </h1>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-0.5">
                Appraisal Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Section */}
        <div className="px-8 pb-8 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-tight">
              전체
            </div>
            <div className="text-2xl font-black text-gray-900">
              {stats.total} <span className="text-xs font-bold text-gray-400">개</span>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-3xl border border-green-100">
            <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1 leading-tight">
              PASS (합격)
            </div>
            <div className="text-2xl font-black text-green-600">
              {stats.pass} <span className="text-xs font-bold text-green-400">개</span>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-3xl border border-yellow-100">
            <div className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1 leading-tight">
              HOLD (보류)
            </div>
            <div className="text-2xl font-black text-yellow-600">
              {stats.hold} <span className="text-xs font-bold text-yellow-400">개</span>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-3xl border border-red-100">
            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 leading-tight">
              FAIL (불합격)
            </div>
            <div className="text-2xl font-black text-red-600">
              {stats.fail} <span className="text-xs font-bold text-red-400">개</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-8 pb-4 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="장소명 또는 주소로 검색..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-sm font-bold shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5 ml-1" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="space-y-3">
            {filteredPlaces.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed border-gray-100 rounded-[32px]">
                <div className="text-gray-300 bg-gray-50 p-6 rounded-full">
                  <Search className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-lg font-black text-gray-900 tracking-tight">
                    검색 결과가 없습니다
                  </p>
                  <p className="text-sm font-bold text-gray-400">
                    다른 키워드로 검색해 보세요
                  </p>
                </div>
              </div>
            ) : (
              filteredPlaces.map((place) => {
                const evalStatus = place.notes?.[0]?.evaluation;
                const favColor = place.favorites?.color;

                return (
                  <button
                    key={place.id}
                    onClick={() => onSelectPlace(place)}
                    className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[24px] hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all group active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden"
                        style={{ backgroundColor: favColor || "#f3f4f6" }}
                      >
                        <MapPin
                          className={`w-6 h-6 ${
                            favColor ? "text-white" : "text-gray-400"
                          }`}
                        />
                        {evalStatus === "PASS" && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="w-4 h-4 text-green-500 bg-white rounded-full p-0.5" />
                          </div>
                        )}
                        {evalStatus === "FAIL" && (
                          <div className="absolute top-1 right-1">
                            <XCircle className="w-4 h-4 text-red-500 bg-white rounded-full p-0.5" />
                          </div>
                        )}
                        {evalStatus === "HOLD" && (
                          <div className="absolute top-1 right-1">
                            <AlertCircle className="w-4 h-4 text-yellow-500 bg-white rounded-full p-0.5" />
                          </div>
                        )}
                      </div>
                      <div className="text-left overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-gray-900 tracking-tight truncate">
                            {place.name}
                          </h3>
                          {evalStatus && (
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${
                                evalStatus === "PASS"
                                  ? "bg-green-100 text-green-600"
                                  : evalStatus === "FAIL"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-yellow-100 text-yellow-600"
                              }`}
                            >
                              {evalStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-500 mt-0.5 truncate max-w-[200px] md:max-w-md">
                          {place.roadAddress || place.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">
                        상세보기
                      </span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
