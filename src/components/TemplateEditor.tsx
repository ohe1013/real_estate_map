"use client";
import React, { useState, useEffect } from "react";
import { Question, Template } from "@/types";
import { getTemplateByScope, saveTemplate } from "@/lib/queries";
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  Settings,
  Save,
  CheckCircle2,
  Layout,
  MessageSquare,
} from "lucide-react";

interface TemplateEditorProps {
  onClose: () => void;
}

export default function TemplateEditor({ onClose }: TemplateEditorProps) {
  const [scope, setScope] = useState<"PLACE" | "UNIT">("PLACE");
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    getTemplateByScope(scope).then((data) => {
      setTemplate(data);
      setQuestions(data?.questions || []);
      setLoading(false);
    });
  }, [scope]);

  const handleAddQuestion = () => {
    const newQ = {
      id: `temp-${Date.now()}`,
      text: "새 질문을 입력하세요",
      type: "rating",
      category: "일반",
      isCritical: false,
      isActive: true,
      options: ["항목 1", "항목 2"],
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSave = async () => {
    if (!template && questions.length === 0) return;
    setLoading(true);
    try {
      await saveTemplate({
        id: template?.id,
        title:
          template?.title ||
          (scope === "PLACE" ? "단지 평가 기본" : "세대 평가 기본"),
        scope: scope,
        questions: questions.map(({ id, ...rest }) => ({
          ...rest,
          // Remove temp IDs
          ...(id.startsWith("temp-") ? {} : { id }),
        })),
      });
      alert("템플릿이 성공적으로 저장되었습니다!");
      onClose();
    } catch (e: any) {
      alert("오류 발생: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">
                평가 템플릿 관리
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Customizable Appraisal System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scope Tabs */}
        <div className="px-6 py-2 bg-gray-50 flex gap-4 shrink-0 border-b border-gray-100">
          <button
            onClick={() => setScope("PLACE")}
            className={`flex items-center gap-2 py-2 text-xs font-black transition-all border-b-2 ${
              scope === "PLACE"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Layout className="w-4 h-4" /> 단지용 (Complex)
          </button>
          <button
            onClick={() => setScope("UNIT")}
            className={`flex items-center gap-2 py-2 text-xs font-black transition-all border-b-2 ${
              scope === "UNIT"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> 세대용 (Household)
          </button>
        </div>

        {/* Questions Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && questions.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="group relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex flex-col gap-2 items-center text-gray-300">
                      <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" />
                      <span className="text-[10px] font-black">{idx + 1}</span>
                    </div>

                    <div className="flex-1 space-y-4">
                      {/* Row 1: Category & Text */}
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                            질문 내용
                          </label>
                          <input
                            type="text"
                            value={q.text}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, {
                                text: e.target.value,
                              })
                            }
                            className="w-full text-sm font-bold text-gray-800 border-b-2 border-gray-50 focus:border-blue-400 outline-none pb-1 transition-colors bg-transparent"
                            placeholder="평가 질문을 입력하세요..."
                          />
                        </div>
                        <div className="w-32 space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                            카테고리
                          </label>
                          <input
                            type="text"
                            value={q.category || ""}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, {
                                category: e.target.value,
                              })
                            }
                            className="w-full text-xs font-bold text-gray-600 border-b-2 border-gray-50 focus:border-blue-400 outline-none pb-1 transition-colors bg-transparent"
                            placeholder="예: 소음, 일조..."
                          />
                        </div>
                      </div>

                      {/* Row 2: Type & Critical */}
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                            응답 타입
                          </label>
                          <select
                            value={q.type}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, {
                                type: e.target.value,
                              })
                            }
                            className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg outline-none appearance-none cursor-pointer hover:bg-blue-100 transition-colors"
                          >
                            <option value="rating">평점 (1-5)</option>
                            <option value="yesno">네/아니오</option>
                            <option value="multiselect">다중 선택</option>
                            <option value="select">단일 선택</option>
                            <option value="text">자유 텍스트</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id={`critical-${q.id}`}
                            checked={q.isCritical}
                            onChange={
                              () => {}
                              // handleUpdateQuestion(q.id, {
                              //   isCritical: e.target.checked,
                              // })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <label
                            htmlFor={`critical-${q.id}`}
                            className="text-xs font-black text-gray-500 cursor-pointer select-none"
                          >
                            최우선 항목 (치명적)
                          </label>
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id={`active-${q.id}`}
                            checked={q.isActive}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, {
                                isActive: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`active-${q.id}`}
                            className="text-xs font-black text-gray-500 cursor-pointer select-none"
                          >
                            활성화
                          </label>
                        </div>
                      </div>

                      {/* Options (if select/multiselect) */}
                      {(q.type === "select" || q.type === "multiselect") && (
                        <div className="pt-2 space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block">
                            선택학목 옵션 (쉼표로 구분)
                          </label>
                          <input
                            type="text"
                            value={
                              Array.isArray(q.options)
                                ? q.options.join(", ")
                                : ""
                            }
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, {
                                options: e.target.value
                                  .split(",")
                                  .map((o) => o.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-full text-xs font-medium border-2 border-gray-50 rounded-xl p-2 focus:border-blue-100 outline-none transition-all placeholder:text-gray-300"
                            placeholder="옵션1, 옵션2, 옵션3..."
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddQuestion}
                className="w-full py-6 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-black text-sm hover:border-blue-200 hover:bg-blue-50/30 hover:text-blue-500 transition-all group"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />{" "}
                질문 추가하기
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white text-gray-400 border-2 border-gray-50 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? "저장 중..." : "설정 저장 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
