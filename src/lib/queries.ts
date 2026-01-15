"use server";

import { prisma } from "./db";
import { KakaoPlace, Place as MyPlaceType } from "@/types";
import { supabase } from "./supabaseClient";

// searchPlaces still uses Supabase Edge Function because it's already set up and works as a proxy
export const searchPlaces = async (query: string) => {
  const { data, error } = await supabase.functions.invoke("search-kakao", {
    body: { query },
  });

  if (error) throw error;
  return data;
};

export async function getDefaultTemplate() {
  return await prisma.template.findFirst({
    include: {
      questions: {
        orderBy: { orderIdx: "asc" },
      },
    },
  });
}

/**
 * Calculates Pass/Hold/Fail based on answers
 * Logic:
 * 1. If any isCritical question is failed -> FAIL
 * 2. Average rating score -> PASS (>4), HOLD (2-4), FAIL (<2)
 */
export async function calculateEvaluation(
  answers: Record<string, any>,
  questions: any[]
) {
  let isFail = false;
  let totalScore = 0;
  let ratingCount = 0;

  for (const q of questions) {
    const ans = answers[q.id];
    if (ans === undefined || ans === null) continue;

    // Critical Check
    if (q.isCritical) {
      if (q.type === "yesno" && ans === true) {
        // Assuming TRUE means "Yes, it is noisy/bad" for some, but user said "치명적이면 탈락"
        // For Q1 (rating), if > 3 -> Fail?
        // Let's refine based on user hints: Q1(rating), Q2(yesno), Q3(multiselect), Q4(yesno)
        // Q1-Q4 are noise related.
      }
      if (q.type === "rating" && ans >= 4) isFail = true; // Very noisy
      if (q.type === "yesno" && ans === true) {
        // For Q2 (Repeat noise), Q4 (Night noise), Q6 (Blocked view) etc.
        // User: Q1~Q4 are Noise related. Q2, Q4 are yesno.
        // If yes -> Fail.
        isFail = true;
      }
      if (
        q.type === "multiselect" &&
        Array.isArray(ans) &&
        ans.length > 0 &&
        !ans.includes("없음")
      ) {
        isFail = true;
      }
    }

    if (q.type === "rating") {
      totalScore += ans;
      ratingCount++;
    }
  }

  const avg = ratingCount > 0 ? totalScore / ratingCount : 3;

  if (isFail) return "FAIL";
  if (avg >= 3.5) return "PASS";
  if (avg >= 2.5) return "HOLD";
  return "FAIL";
}

export async function upsertPlace(kakaoPlace: KakaoPlace): Promise<any> {
  const lat = parseFloat(kakaoPlace.y);
  const lng = parseFloat(kakaoPlace.x);

  return await prisma.place.upsert({
    where: { kakaoId: kakaoPlace.id },
    update: {
      name: kakaoPlace.place_name,
      lat,
      lng,
      address: kakaoPlace.address_name,
      roadAddress: kakaoPlace.road_address_name,
    },
    create: {
      kakaoId: kakaoPlace.id,
      name: kakaoPlace.place_name,
      lat,
      lng,
      address: kakaoPlace.address_name,
      roadAddress: kakaoPlace.road_address_name,
    },
  });
}

export async function getPlaceByKakaoId(kakaoId: string): Promise<any> {
  return await prisma.place.findUnique({
    where: { kakaoId },
    include: {
      favorites: true,
      notes: true,
      externalLinks: true,
    },
  });
}

export async function saveFavorite(placeId: string, color: string) {
  return await prisma.favorite.upsert({
    where: { placeId },
    update: { color },
    create: { placeId, color },
  });
}

export async function saveExternalLink(
  placeId: string,
  title: string,
  url: string
) {
  return await prisma.externalLink.create({
    data: {
      placeId,
      title,
      url,
    },
  });
}

export async function saveNote(
  placeId: string,
  answers: any,
  templateId?: string
) {
  let evaluation: string | null = null;

  if (templateId) {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { questions: true },
    });
    if (template) {
      evaluation = await calculateEvaluation(answers, template.questions);
    }
  }

  const existing = await prisma.note.findFirst({
    where: { placeId },
  });

  if (existing) {
    return await prisma.note.update({
      where: { id: existing.id },
      data: {
        answers,
        templateId,
        evaluation,
        updatedAt: new Date(),
      },
    });
  } else {
    return await prisma.note.create({
      data: {
        placeId,
        answers,
        templateId,
        evaluation,
      },
    });
  }
}

export async function getUserPlaces(): Promise<any[]> {
  return await prisma.place.findMany({
    include: {
      favorites: true,
      notes: {
        select: {
          evaluation: true,
        },
      },
    },
  });
}
