"use client";
import React, { useState } from "react";
import { signUpUser } from "@/lib/auth-actions";
import { signIn } from "next-auth/react";
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Chrome,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("name", name);

      const resultSignup = await signUpUser(formData);

      if (!resultSignup.success) {
        alert(resultSignup.error);
        return;
      }

      // Auto sign in after signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        alert(
          "회원가입은 완료됐지만 로그인에 실패했습니다. 직접 로그인해 주세요."
        );
        router.push("/auth/signin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col p-8 md:p-12 border border-gray-100">
        <div className="mb-8">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">
              Back to Login
            </span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            계정 만들기
          </h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Create your account
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <button
            onClick={() => signIn("kakao", { callbackUrl: "/" })}
            className="w-full bg-[#FEE500] text-[#191919] py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-3 hover:bg-[#FADA0A] transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-current" /> 카카오로 시작하기
          </button>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-white border-2 border-gray-100 text-gray-700 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <Chrome className="w-4 h-4" /> 구글로 시작하기
          </button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
            <span className="bg-white px-4 text-gray-300">OR</span>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 focus:bg-white transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
              placeholder="********"
              className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 focus:bg-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            {loading ? "처리 중..." : "가입하기"}
          </button>
        </form>

        <p className="text-center mt-10 text-xs font-bold text-gray-400">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
