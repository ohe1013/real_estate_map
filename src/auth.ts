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
const kakaoClientId = process.env.AUTH_KAKAO_ID;
const kakaoClientSecret = process.env.AUTH_KAKAO_SECRET;

type KakaoProfilePayload = {
  id?: string | number;
  properties?: {
    nickname?: string | null;
    profile_image?: string | null;
  };
  kakao_account?: {
    profile?: {
      nickname?: string | null;
      profile_image_url?: string | null;
    };
    email?: string | null;
  };
};

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getKakaoIdentity(profile: unknown): {
  name: string | null;
  email: string | null;
  image: string | null;
} {
  if (!profile || typeof profile !== "object") {
    return { name: null, email: null, image: null };
  }

  const kakaoProfile = profile as KakaoProfilePayload;
  const name =
    normalizeOptionalString(kakaoProfile.properties?.nickname) ||
    normalizeOptionalString(kakaoProfile.kakao_account?.profile?.nickname);
  const email = normalizeOptionalString(kakaoProfile.kakao_account?.email);
  const image =
    normalizeOptionalString(kakaoProfile.properties?.profile_image) ||
    normalizeOptionalString(
      kakaoProfile.kakao_account?.profile?.profile_image_url,
    );

  return { name, email, image };
}

async function getKakaoIdentityByAccessToken(accessToken: string): Promise<{
  name: string | null;
  email: string | null;
  image: string | null;
}> {
  try {
    const response = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { name: null, email: null, image: null };
    }

    const data = (await response.json()) as unknown;
    return getKakaoIdentity(data);
  } catch {
    return { name: null, email: null, image: null };
  }
}

function normalizeEmail(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
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
        if (
          error instanceof Error &&
          error.message.startsWith("RATE_LIMITED")
        ) {
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
  ...(kakaoClientId
    ? [
        Kakao({
          clientId: kakaoClientId,
          ...(kakaoClientSecret
            ? { clientSecret: kakaoClientSecret }
            : { client: { token_endpoint_auth_method: "none" as const } }),
          allowDangerousEmailAccountLinking: false,
          profile(profile) {
            const baseProfile = profile as KakaoProfilePayload;
            const kakaoIdentity = getKakaoIdentity(profile);
            return {
              id: String(baseProfile.id),
              name: kakaoIdentity.name,
              email: kakaoIdentity.email,
              image: kakaoIdentity.image,
            };
          },
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
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = user.image ?? token.picture;
      }

      if (account?.provider === "kakao") {
        let kakaoIdentity = getKakaoIdentity(profile);

        const hasName =
          typeof token.name === "string" && token.name.trim().length > 0;
        const hasEmail =
          typeof token.email === "string" && token.email.trim().length > 0;
        const hasImage =
          typeof token.picture === "string" && token.picture.trim().length > 0;

        const accessToken =
          typeof account.access_token === "string"
            ? account.access_token
            : null;

        if ((!hasName || !hasEmail || !hasImage) && accessToken) {
          const tokenIdentity =
            await getKakaoIdentityByAccessToken(accessToken);
          kakaoIdentity = {
            name: kakaoIdentity.name || tokenIdentity.name,
            email: kakaoIdentity.email || tokenIdentity.email,
            image: kakaoIdentity.image || tokenIdentity.image,
          };
        }

        if (!hasName && kakaoIdentity.name) token.name = kakaoIdentity.name;
        if (!hasEmail && kakaoIdentity.email) token.email = kakaoIdentity.email;
        if (!hasImage && kakaoIdentity.image)
          token.picture = kakaoIdentity.image;
      }

      const tokenName = normalizeOptionalString(token.name);
      const tokenEmail = normalizeOptionalString(token.email);
      const tokenImage = normalizeOptionalString(token.picture);

      if (token.sub && (!tokenName || !tokenEmail || !tokenImage)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { name: true, email: true, image: true },
        });

        if (dbUser) {
          if (!tokenName && dbUser.name) token.name = dbUser.name;
          if (!tokenEmail && dbUser.email) token.email = dbUser.email;
          if (!tokenImage && dbUser.image) token.picture = dbUser.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        if (!session.user.name && typeof token.name === "string") {
          session.user.name = token.name;
        }
        if (!session.user.email && typeof token.email === "string") {
          session.user.email = token.email;
        }
        if (!session.user.image && typeof token.picture === "string") {
          session.user.image = token.picture;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
