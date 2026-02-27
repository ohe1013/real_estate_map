"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, UserRound } from "lucide-react";
import { updateMyNickname } from "@/lib/auth-actions";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasName = useMemo(() => {
    return Boolean(session?.user?.name && session.user.name.trim().length > 0);
  }, [session?.user?.name]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/auth/signin?callbackUrl=%2Fauth%2Fcomplete-profile");
      return;
    }

    if (hasName) {
      router.replace("/");
      return;
    }

    setName(session.user?.name ?? "");
  }, [hasName, router, session, status]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      const result = await updateMyNickname(formData);

      if (!result.success) {
        setError(result.error || "닉네임 저장에 실패했습니다.");
        return;
      }

      await update();
      router.replace("/");
    } catch {
      setError("닉네임 저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !session || hasName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">닉네임 설정</h1>
            <p className="text-xs text-gray-500 font-bold">
              계정에서 사용할 이름을 입력해 주세요.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
              Nickname
            </label>
            <input
              type="text"
              required
              maxLength={30}
              placeholder="닉네임"
              className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 focus:bg-white transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {saving ? "저장 중..." : "완료"}
          </button>
        </form>
      </div>
    </div>
  );
}
