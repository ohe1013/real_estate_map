"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const NAME_MAX_LENGTH = 30;

function normalizeName(input: FormDataEntryValue | null): string {
  if (typeof input !== "string") return "";
  return input.trim();
}

export async function signUpUser(formData: FormData) {
  try {
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");
    const name = normalizeName(formData.get("name"));

    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    if (!name) {
      return { success: false, error: "닉네임을 입력해 주세요." };
    }

    if (name.length > NAME_MAX_LENGTH) {
      return {
        success: false,
        error: `닉네임은 ${NAME_MAX_LENGTH}자 이하로 입력해 주세요.`,
      };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "이미 존재하는 이메일입니다." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return { success: true, user: { id: user.id, email: user.email } };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "회원가입 중 서버 오류가 발생했습니다.";
    console.error("Signup error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

export async function updateMyNickname(formData: FormData) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const name = normalizeName(formData.get("name"));

    if (!name) {
      return { success: false, error: "닉네임을 입력해 주세요." };
    }

    if (name.length > NAME_MAX_LENGTH) {
      return {
        success: false,
        error: `닉네임은 ${NAME_MAX_LENGTH}자 이하로 입력해 주세요.`,
      };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true, email: true },
    });

    return { success: true, user };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "닉네임 저장 중 서버 오류가 발생했습니다.";
    console.error("Update nickname error:", error);
    return {
      success: false,
      error: message,
    };
  }
}
