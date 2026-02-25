import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_LOCK_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

type RateLimitEntry = {
  attempts: number;
  windowStartAt: number;
  lockUntil: number | null;
};

const credentialRateLimitStore = new Map<string, RateLimitEntry>();

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getClientIp(request?: Request) {
  if (!request) return "unknown";
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function getRateLimitKey(email: string, request?: Request) {
  return `${email}|${getClientIp(request)}`;
}

function readRateLimit(key: string): RateLimitEntry {
  const now = Date.now();
  const current = credentialRateLimitStore.get(key);

  if (!current) {
    const initial: RateLimitEntry = {
      attempts: 0,
      windowStartAt: now,
      lockUntil: null,
    };
    credentialRateLimitStore.set(key, initial);
    return initial;
  }

  if (current.lockUntil && current.lockUntil <= now) {
    current.lockUntil = null;
    current.attempts = 0;
    current.windowStartAt = now;
  }

  if (now - current.windowStartAt > RATE_LIMIT_WINDOW_MS) {
    current.attempts = 0;
    current.windowStartAt = now;
  }

  return current;
}

function registerRateLimitFailure(key: string) {
  const entry = readRateLimit(key);
  entry.attempts += 1;
  if (entry.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    entry.lockUntil = Date.now() + RATE_LIMIT_LOCK_MS;
  }
}

function clearRateLimit(key: string) {
  credentialRateLimitStore.delete(key);
}

function getCredentialsProvider() {
  return Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      try {
        const email = normalizeEmail(credentials?.email);
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const rateLimitKey = getRateLimitKey(email, request);
        const limitState = readRateLimit(rateLimitKey);
        const now = Date.now();

        if (limitState.lockUntil && limitState.lockUntil > now) {
          throw new Error("RATE_LIMITED: 로그인 시도가 너무 많습니다.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          registerRateLimitFailure(rateLimitKey);
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          registerRateLimitFailure(rateLimitKey);
          return null;
        }

        clearRateLimit(rateLimitKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("RATE_LIMITED")) {
          throw error;
        }
        console.error("Auth authorize error:", error);
        return null;
      }
    },
  });
}

const providers = [
  getCredentialsProvider(),
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : []),
  ...(process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET
    ? [
        Kakao({
          clientId: process.env.AUTH_KAKAO_ID,
          clientSecret: process.env.AUTH_KAKAO_SECRET,
          allowDangerousEmailAccountLinking: false,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
