"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { LogIn, Github, Chrome, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
      });
    } catch (e) {
      alert("로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col p-8 md:p-12 border border-gray-100 italic-none">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            반갑습니다!
          </h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Sign in to continue
          </p>
        </div>

        <div className="space-y-4 mb-10">
          <button
            onClick={() => signIn("kakao", { callbackUrl: "/" })}
            className="w-full bg-[#FEE500] text-[#191919] py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-[#FADA0A] transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 fill-current" /> 카카오로 로그인
          </button>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <Chrome className="w-5 h-5" /> 구글로 로그인
          </button>
        </div>

        <div className="relative mb-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
            <span className="bg-white px-4 text-gray-300">OR</span>
          </div>
        </div>

        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 focus:bg-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 focus:bg-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200 mt-6 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" /> {loading ? "진행 중..." : "로그인"}
          </button>
        </form>

        <p className="text-center mt-10 text-xs font-bold text-gray-400">
          계정이 없으신가요?{" "}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
