"use server";

import { prisma } from "./db";
import { KakaoPlace, Place as MyPlaceType } from "@/types";
import { supabase } from "./supabaseClient";
import { auth } from "@/auth";

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
    where: { scope: { in: ["BOTH", "PLACE"] } },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { orderIdx: "asc" },
      },
    },
  });
}

export async function getTemplateByScope(scope: "PLACE" | "UNIT") {
  return await prisma.template.findFirst({
    where: { scope: { in: ["BOTH", scope] } },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { orderIdx: "asc" },
      },
    },
  });
}

/**
 * Calculates Pass/Hold/Fail based on answers
 */
export async function calculateEvaluation(
  answers: Record<string, any>,
  questions: any[]
) {
  let totalScore = 0;

  for (const q of questions) {
    if (!q.isActive) continue;
    const ans = answers[q.id];
    if (ans === undefined || ans === null) continue;

    const multiplier = q.criticalLevel || 1;
    let questionScore = 0;

    if (q.type === "rating") {
      // 1(-2), 2(-1), 3(0), 4(1), 5(2)
      questionScore = (Number(ans) - 3) * multiplier;
    } else if (q.type === "yesno") {
      // Yes (2), No (-2), "-" (0)
      if (ans === "Yes" || ans === true) questionScore = 2 * multiplier;
      else if (ans === "No" || ans === false) questionScore = -2 * multiplier;
      else if (ans === "-") questionScore = 0;
    } else if (q.type === "multiselect") {
      const options = Array.isArray(q.options) ? q.options : [];
      const selected = Array.isArray(ans) ? ans : [];
      if (options.length > 0) {
        const ratio = selected.length / options.length;
        if (q.isBad) {
          questionScore = ratio * -2;
        } else {
          questionScore = ratio * 2;
        }
      }
    }

    totalScore += questionScore;
  }

  console.log({ totalScore });
  if (totalScore >= 3) return "PASS";
  if (totalScore >= 0) return "HOLD";
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
      notes: {
        where: { unitId: null }, // Only place-level notes here
      },
      externalLinks: true,
      units: {
        include: {
          notes: true,
        },
      },
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

/**
 * Save appraisal note for Place or Unit
 */
export async function saveNote({
  placeId,
  unitId,
  answers,
  templateId,
}: {
  placeId?: string;
  unitId?: string;
  answers: any;
  templateId?: string;
}) {
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

  // Find existing note for this target
  const where = unitId ? { unitId } : { placeId, unitId: null };
  const existing = await prisma.note.findFirst({ where });

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
        placeId: unitId ? null : placeId,
        unitId,
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
        where: { unitId: null },
        select: { evaluation: true },
      },
    },
  });
}

// --- Unit Management ---

export async function upsertUnit(data: {
  placeId: string;
  label: string;
  dong?: string;
  ho?: string;
  floor?: number;
  direction?: string;
  viewDesc?: string;
}) {
  return await prisma.unit.upsert({
    where: {
      placeId_label: {
        placeId: data.placeId,
        label: data.label,
      },
    },
    update: {
      dong: data.dong,
      ho: data.ho,
      floor: data.floor,
      direction: data.direction,
      viewDesc: data.viewDesc,
    },
    create: data,
  });
}

export async function getUnitsByPlace(placeId: string) {
  return await prisma.unit.findMany({
    where: { placeId },
    include: {
      notes: true,
    },
    orderBy: { label: "asc" },
  });
}

// --- Template Management ---

export async function getTemplates() {
  const session = await auth();
  const userId = session?.user?.id;

  return await prisma.template.findMany({
    where: {
      OR: [
        { userId: null },
        userId
          ? { userId }
          : { userId: "00000000-0000-0000-0000-000000000000" }, // dummy uuid if no user
      ],
    },
    include: {
      questions: {
        orderBy: { orderIdx: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveTemplate(data: {
  id?: string;
  title: string;
  scope: string;
  questions: any[];
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  if (data.id) {
    // Check if it's the user's template
    const existing = await prisma.template.findUnique({
      where: { id: data.id },
    });
    if (existing?.userId !== userId) throw new Error("Permission denied");

    // Update
    return await prisma.template.update({
      where: { id: data.id },
      data: {
        title: data.title,
        scope: data.scope,
        questions: {
          deleteMany: {},
          create: data.questions.map((q, idx) => ({
            text: q.text,
            type: q.type,
            options: q.options,
            orderIdx: idx,
            category: q.category,
            criticalLevel: q.criticalLevel,
            isBad: q.isBad,
            isActive: q.isActive ?? true,
            helpText: q.helpText,
          })),
        },
      },
    });
  } else {
    // Create
    return await prisma.template.create({
      data: {
        userId,
        title: data.title,
        scope: data.scope,
        questions: {
          create: data.questions.map((q, idx) => ({
            text: q.text,
            type: q.type,
            options: q.options,
            orderIdx: idx,
            category: q.category,
            criticalLevel: q.criticalLevel,
            isBad: q.isBad,
            isActive: q.isActive ?? true,
            helpText: q.helpText,
          })),
        },
      },
    });
  }
}

export async function deleteTemplate(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.template.findUnique({
    where: { id },
  });
  if (existing?.userId !== userId) throw new Error("Permission denied");

  return await prisma.template.delete({
    where: { id },
  });
}
