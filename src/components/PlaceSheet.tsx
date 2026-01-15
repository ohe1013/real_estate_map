"use client";
import React, { useState, useEffect } from "react";
import { KakaoPlace, Place } from "@/types";
import {
  upsertPlace,
  getPlaceByKakaoId,
  saveNote,
  saveFavorite,
  saveExternalLink,
  getDefaultTemplate,
} from "@/lib/queries";
import {
  X,
  Star,
  Save,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
} from "lucide-react";

interface PlaceSheetProps {
  place: KakaoPlace | null;
  onClose: () => void;
  onSave?: () => void;
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export default function PlaceSheet({
  place,
  onClose,
  onSave,
}: PlaceSheetProps) {
  const [dbPlace, setDbPlace] = useState<Place | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  useEffect(() => {
    getDefaultTemplate()
      .then(setTemplate)
      .catch((err) => {
        console.error("Prisma Client not ready?", err);
      });
  }, []);

  useEffect(() => {
    if (!place) return;
    setDbPlace(null);
    setAnswers({});
    setSelectedColor(null);

    getPlaceByKakaoId(place.id).then((data) => {
      if (data) {
        setDbPlace(data);
        if (data.notes && data.notes.length > 0) {
          setAnswers(data.notes[0].answers || {});
        }
        if (data.favorites) {
          setSelectedColor(data.favorites.color);
        }
      }
    });
  }, [place]);

  const handleAnswerChange = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleAddCustomLink = async () => {
    if (!place || !linkTitle || !linkUrl) return;
    setAddingLink(true);
    try {
      const savedPlace = await upsertPlace(place);
      await saveExternalLink(savedPlace.id, linkTitle, linkUrl);
      setLinkTitle("");
      setLinkUrl("");
      getPlaceByKakaoId(place.id).then(setDbPlace);
      onSave?.();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAddingLink(false);
    }
  };

  const handleSave = async () => {
    if (!place) return;
    setLoading(true);
    try {
      const savedPlace = await upsertPlace(place);
      if (selectedColor) {
        await saveFavorite(savedPlace.id, selectedColor);
      }
      await saveNote(savedPlace.id, answers, template?.id);
      alert("Appraisal Saved Successfully!");
      onSave?.();
      getPlaceByKakaoId(place.id).then(setDbPlace);
    } catch (e: any) {
      console.error(e);
      alert("Error saving: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!place) return null;

  const categories: Record<string, any[]> = {};
  template?.questions?.forEach((q: any) => {
    const cat = q.category || "General";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(q);
  });

  const evaluation = dbPlace?.notes?.[0]?.evaluation;

  return (
    <div className="fixed md:absolute bottom-0 md:top-0 right-0 h-full w-full md:w-[420px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-20 overflow-y-auto flex flex-col transition-all text-gray-900 font-sans border-t md:border-t-0 md:border-l border-gray-100 rounded-t-3xl md:rounded-none">
      {/* Mobile Handle */}
      <div className="md:hidden flex justify-center pt-3 pb-1">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
      </div>
      {/* Header */}
      <div className="p-6 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50 flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                {place?.place_name}
              </h2>

              {evaluation === "PASS" && (
                <span className="bg-green-100 text-green-700 p-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              )}
              {evaluation === "HOLD" && (
                <span className="bg-yellow-100 text-yellow-700 p-1 rounded-full">
                  <AlertCircle className="w-4 h-4" />
                </span>
              )}
              {evaluation === "FAIL" && (
                <span className="bg-red-100 text-red-700 p-1 rounded-full">
                  <XCircle className="w-4 h-4" />
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {place?.category_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <Info className="w-4 h-4 text-gray-400 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            {place?.road_address_name || place?.address_name}
            {place?.phone && (
              <span className="block mt-1 text-gray-400">{place.phone}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-10">
        {/* Quick Actions / External Links */}
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://hogangnono.com/search?q=${encodeURIComponent(
              place?.place_name || ""
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-black bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> HOGANGNONO
          </a>
          <a
            href={`https://m.land.naver.com/search/result/${encodeURIComponent(
              place?.place_name || ""
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-black bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> NAVER LAND
          </a>
          {dbPlace?.externalLinks?.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-black bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> {link.title.toUpperCase()}
            </a>
          ))}
        </div>

        {/* Favorite Marker */}
        <div className="space-y-3">
          <label className="text-xs font-black text-gray-400 uppercase tracking-tighter">
            마커 색상 설정
          </label>
          <div className="flex gap-2.5">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                  selectedColor === color
                    ? "border-gray-900 shadow-lg"
                    : "border-white"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              onClick={() => setSelectedColor(null)}
              className={`w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-300 ${
                selectedColor === null
                  ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                  : "bg-white"
              }`}
            >
              해제
            </button>
          </div>
        </div>

        {/* Dynamic Template Questions */}
        {!template ? (
          <div className="py-10 text-center space-y-3">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              템플릿 불러오는 중...
            </p>
            <div className="p-4 bg-red-50 text-red-500 text-xs rounded-xl border border-red-100 text-left font-medium">
              Prisma Client가 준비되지 않았습니다. 데브 서버를 중단하고 `npx
              prisma generate`를 실행해 주세요.
            </div>
          </div>
        ) : (
          <div className="space-y-12 pb-64">
            {Object.entries(categories).map(([catName, qs]) => (
              <div key={catName} className="space-y-5">
                <h3 className="text-sm font-black text-white bg-blue-600 inline-block px-3 py-1.5 rounded-lg shadow-md shadow-blue-100">
                  {catName}
                </h3>
                <div className="space-y-7 border-l-2 border-gray-50 pl-4">
                  {qs.map((q) => (
                    <div key={q.id} className="space-y-3">
                      <label className="text-[13px] font-bold text-gray-700 leading-snug flex items-start gap-1.5">
                        {q.text}
                        {q.isCritical && (
                          <span className="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-black border border-red-100 uppercase">
                            최우선 항목
                          </span>
                        )}
                      </label>

                      {q.type === "rating" && (
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              onClick={() => handleAnswerChange(q.id, num)}
                              className={`w-9 h-9 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center ${
                                answers[q.id] === num
                                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-105"
                                  : "bg-white border-gray-50 text-gray-300 hover:border-gray-200"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === "yesno" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAnswerChange(q.id, true)}
                            className={`flex-1 py-2.5 rounded-xl border-2 font-black text-xs transition-all ${
                              answers[q.id] === true
                                ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-100"
                                : "bg-white border-gray-50 text-gray-400"
                            }`}
                          >
                            네
                          </button>
                          <button
                            onClick={() => handleAnswerChange(q.id, false)}
                            className={`flex-1 py-2.5 rounded-xl border-2 font-black text-xs transition-all ${
                              answers[q.id] === false
                                ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-100"
                                : "bg-white border-gray-50 text-gray-400"
                            }`}
                          >
                            아니오
                          </button>
                        </div>
                      )}

                      {q.type === "multiselect" && Array.isArray(q.options) && (
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt: string) => {
                            const current = answers[q.id] || [];
                            const isSelected = current.includes(opt);
                            return (
                              <button
                                key={opt}
                                onClick={() => {
                                  const next = isSelected
                                    ? current.filter((i: string) => i !== opt)
                                    : [...current, opt];
                                  handleAnswerChange(q.id, next);
                                }}
                                className={`px-3 py-2 rounded-xl border-2 text-[11px] font-black transition-all ${
                                  isSelected
                                    ? "bg-gray-900 border-gray-900 text-white shadow-lg"
                                    : "bg-white border-gray-50 text-gray-400 hover:border-gray-200"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === "select" && Array.isArray(q.options) && (
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt: string) => {
                            const isSelected = answers[q.id] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => handleAnswerChange(q.id, opt)}
                                className={`px-3 py-2 rounded-xl border-2 text-[11px] font-black transition-all ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                                    : "bg-white border-gray-50 text-gray-400 hover:border-gray-200"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === "text" && (
                        <textarea
                          value={answers[q.id] || ""}
                          onChange={(e) =>
                            handleAnswerChange(q.id, e.target.value)
                          }
                          className="w-full h-24 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:outline-none bg-gray-50 text-gray-700 transition-all"
                          placeholder="Detailed notes..."
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Link Add Section (Collapsed) */}
      <div className="fixed md:absolute bottom-0 left-0 right-0 md:left-auto md:w-[420px] bg-white border-t border-gray-100 p-4 md:p-6 pt-4 flex flex-col gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40">
        {showLinkInput ? (
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100 overflow-hidden">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="제목 (예: 카카오맵, 블로그 리뷰)"
                className="block w-full text-xs bg-white border-2 border-gray-100 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 font-bold box-border outline-none"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
              <input
                type="text"
                placeholder="URL 주소 (https://...)"
                className="block w-full text-xs bg-white border-2 border-gray-100 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 font-bold box-border outline-none"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowLinkInput(false)}
                className="flex-1 bg-white text-gray-400 text-[11px] font-black py-2.5 rounded-xl border-2 border-gray-100 hover:bg-gray-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddCustomLink}
                disabled={addingLink}
                className="flex-[2] bg-gray-900 text-white text-[11px] font-black py-2.5 rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />{" "}
                {addingLink ? "추가 중..." : "확인"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLinkInput(true)}
            className="w-full bg-gray-50 text-gray-400 py-3 rounded-xl border-2 border-dashed border-gray-200 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-3 h-3" /> 참고 링크 추가하기
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <Save className="w-5 h-5" />
          {loading ? "저장 중..." : "평가 완료 및 저장"}
        </button>
      </div>
    </div>
  );
}
