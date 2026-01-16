"use client";
import React, { useState, useEffect } from "react";
import { Template, Question } from "@/types";
import { getTemplates, saveTemplate, deleteTemplate } from "@/lib/queries";
import {
  Plus,
  Trash2,
  Save,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TemplateManagerProps {
  onClose: () => void;
}

export default function TemplateManager({ onClose }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState<Question[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data as any);
      if (data.length > 0 && !activeTemplate) {
        // Find first user template or first default
        const first = data.find((t: any) => t.userId) || data[0];
        selectTemplate(first as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (t: Template) => {
    setActiveTemplate(t);
    setEditingQuestions(t.questions?.map((q) => ({ ...q })) || []);
  };

  const handleCreateNew = () => {
    const newT: Partial<Template> = {
      title: "새 템플릿",
      scope: "BOTH",
      questions: [],
    };
    setActiveTemplate(newT as Template);
    setEditingQuestions([]);
  };

  const handleAddQuestion = () => {
    const newQ: Partial<Question> = {
      id: "temp-" + Math.random().toString(), // temp id
      text: "",
      category: "기본 항목",
      type: "rating",
      criticalLevel: 1,
      isBad: false,
      isActive: true,
      options: [],
    };

    setEditingQuestions([...editingQuestions, newQ as Question]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setEditingQuestions(editingQuestions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (
    idx: number,
    field: keyof Question,
    value: any
  ) => {
    const next = [...editingQuestions];
    next[idx] = { ...next[idx], [field]: value };
    setEditingQuestions(next);
  };

  const handleSave = async () => {
    if (!activeTemplate) return;
    setLoading(true);
    try {
      await saveTemplate({
        id: activeTemplate.id,
        title: activeTemplate.title,
        scope: activeTemplate.scope,
        questions: editingQuestions,
      });
      alert("템플릿이 저장되었습니다.");
      await loadTemplates();
    } catch (e: any) {
      alert("저장 실패: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeTemplate?.id) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      await deleteTemplate(activeTemplate.id);
      setActiveTemplate(null);
      await loadTemplates();
    } catch (e: any) {
      alert("삭제 실패: " + e.message);
    } finally {
      setLoading(false);
    }
  };
  const isReadOnly = !!(activeTemplate?.id && !activeTemplate.userId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900">템플릿 관리</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Template Management
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-100 flex flex-col bg-gray-50/30">
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-xs font-black shadow-lg shadow-blue-100 hover:bg-blue-500 transition-all active:scale-[0.98] mb-4"
              >
                <Plus className="w-4 h-4" /> 템플릿 추가
              </button>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter px-2 mb-2">
                  저장된 템플릿
                </p>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all ${
                      activeTemplate?.id === t.id
                        ? "bg-white border-2 border-blue-100 text-blue-600 shadow-sm"
                        : "hover:bg-white border-2 border-transparent text-gray-500"
                    }`}
                  >
                    {t.title}{" "}
                    {!t.userId && (
                      <span className="text-[9px] bg-gray-100 text-gray-400 px-1 rounded ml-1">
                        기본
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 p-8 overflow-y-auto bg-white">
            {activeTemplate ? (
              <div className="space-y-8 max-w-2xl mx-auto">
                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      템플릿 제목
                    </label>
                    <input
                      type="text"
                      disabled={!!isReadOnly}
                      className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-300 focus:bg-white transition-all disabled:opacity-50"
                      value={activeTemplate.title}
                      onChange={(e) =>
                        setActiveTemplate({
                          ...activeTemplate,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      적용 대상
                    </label>
                    <select
                      disabled={!!isReadOnly}
                      className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-300 focus:bg-white transition-all disabled:opacity-50 appearance-none"
                      value={activeTemplate.scope}
                      onChange={(e) =>
                        setActiveTemplate({
                          ...activeTemplate,
                          scope: e.target.value as any,
                        })
                      }
                    >
                      <option value="BOTH">전체 (단지 & 세대)</option>
                      <option value="PLACE">단지 전용</option>
                      <option value="UNIT">세대 전용</option>
                    </select>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-gray-800">
                      평가 항목 목록 ({editingQuestions.length})
                    </h3>
                    {!isReadOnly && (
                      <button
                        onClick={handleAddQuestion}
                        className="text-blue-600 text-xs font-black hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> 항목 추가
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {editingQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-100 hover:border-gray-200 transition-all space-y-4 relative group"
                      >
                        <div className="flex gap-3">
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="분류 (예: 단지 환경, 세대 내부)"
                            className="w-40 bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-300 disabled:opacity-50"
                            value={q.category || ""}
                            onChange={(e) =>
                              handleQuestionChange(
                                idx,
                                "category",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="질문 내용을 입력하세요"
                            className="flex-1 bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-300 disabled:opacity-50"
                            value={q.text}
                            onChange={(e) =>
                              handleQuestionChange(idx, "text", e.target.value)
                            }
                          />
                          <select
                            disabled={!!isReadOnly}
                            className="w-32 bg-white border border-gray-200 px-3 rounded-xl text-xs font-bold outline-none focus:border-blue-300 disabled:opacity-50 cursor-pointer"
                            value={q.type}
                            onChange={(e) =>
                              handleQuestionChange(idx, "type", e.target.value)
                            }
                          >
                            <option value="rating">점수 (1-5)</option>
                            <option value="yesno">예/아니오</option>
                            <option value="multiselect">다중 선택</option>
                            <option value="text">자유 입력</option>
                          </select>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleRemoveQuestion(idx)}
                              className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-4 items-center pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                              중요도
                            </span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((v) => (
                                <button
                                  key={v}
                                  disabled={!!isReadOnly}
                                  onClick={() =>
                                    handleQuestionChange(
                                      idx,
                                      "criticalLevel",
                                      v
                                    )
                                  }
                                  className={`w-7 h-7 rounded-lg text-[10px] font-black border-2 transition-all ${
                                    q.criticalLevel === v
                                      ? "bg-red-500 border-red-500 text-white shadow-sm"
                                      : "bg-white border-gray-100 text-gray-300 hover:border-gray-200"
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer group/bad">
                            <input
                              type="checkbox"
                              disabled={!!isReadOnly}
                              className="hidden"
                              checked={q.isBad}
                              onChange={(e) =>
                                handleQuestionChange(
                                  idx,
                                  "isBad",
                                  e.target.checked
                                )
                              }
                            />
                            <div
                              className={`w-10 h-6 rounded-full transition-all relative ${
                                q.isBad
                                  ? "bg-red-500 shadow-inner"
                                  : "bg-gray-200"
                              }`}
                            >
                              <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                                  q.isBad ? "translate-x-4" : ""
                                }`}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-black uppercase tracking-tighter ${
                                q.isBad ? "text-red-500" : "text-gray-400"
                              }`}
                            >
                              악재 레이블
                            </span>
                          </label>

                          <div className="flex-1 min-w-[200px]">
                            <input
                              type="text"
                              disabled={!!isReadOnly}
                              placeholder="도움말 (부가 설명)"
                              className="w-full bg-white border border-gray-200 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-blue-300 disabled:opacity-50"
                              value={q.helpText || ""}
                              onChange={(e) =>
                                handleQuestionChange(
                                  idx,
                                  "helpText",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          {(q.type === "multiselect" ||
                            q.type === "select") && (
                            <div className="w-full">
                              <input
                                type="text"
                                disabled={!!isReadOnly}
                                placeholder="옵션 (쉼표로 구분: 예, 아니오, 몰라요)"
                                className="w-full bg-white border border-gray-200 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-blue-300 disabled:opacity-50 mt-1"
                                value={
                                  Array.isArray(q.options)
                                    ? q.options.join(", ")
                                    : ""
                                }
                                onChange={(e) =>
                                  handleQuestionChange(
                                    idx,
                                    "options",
                                    e.target.value
                                      .split(",")
                                      .map((v) => v.trim())
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {editingQuestions.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                        <p className="text-xs text-gray-300 font-bold uppercase tracking-widest">
                          평가 항목이 없습니다. 항목을 추가해 주세요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-200" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-800">
                    선택된 템플릿이 없습니다
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium mt-1">
                    왼쪽 목록에서 선택하거나 새로운 템플릿을 추가하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex gap-3">
            {activeTemplate?.id && !isReadOnly && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3.5 rounded-2xl bg-white border-2 border-red-50 text-red-500 text-xs font-black hover:bg-red-50 transition-all flex items-center gap-2 group shadow-sm active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />{" "}
                템플릿 삭제
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-2xl bg-white border-2 border-gray-100 text-gray-400 text-xs font-black hover:bg-gray-100 transition-all"
            >
              취소
            </button>
            {!isReadOnly && activeTemplate && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-12 py-3.5 rounded-2xl bg-blue-600 text-white text-xs font-black shadow-xl shadow-blue-100 hover:bg-blue-500 transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />{" "}
                {loading ? "저장 중..." : "설정 저장하기"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
