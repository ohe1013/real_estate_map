"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function signUpUser(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
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
        name: name || email.split("@")[0],
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
