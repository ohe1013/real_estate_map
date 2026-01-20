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
    where: {
      userId: null,
      scope: { in: ["BOTH", "PLACE"] },
    },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { orderIdx: "asc" },
      },
    },
  });
}

export async function getTemplateByScope(scope: "PLACE" | "UNIT") {
  const session = await auth();
  const userId = session?.user?.id;

  return await prisma.template.findFirst({
    where: {
      OR: [{ userId: null }, userId ? { userId } : { id: "never" }],
      scope: { in: ["BOTH", scope] },
    },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { orderIdx: "asc" },
      },
    },
    orderBy: { userId: "desc" }, // Prioritize user-specific over null
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  // DB 리셋 등으로 인해 세션은 있으나 실제 유저 레코드가 없을 수 있음
  const userExists = await prisma.user.count({ where: { id: userId } });
  if (userExists === 0) {
    throw new Error(
      "세션 정보가 유효하지 않습니다. 로그아웃 후 다시 로그인해 주세요."
    );
  }

  const lat = parseFloat(kakaoPlace.y);
  const lng = parseFloat(kakaoPlace.x);

  return await prisma.place.upsert({
    where: {
      userId_kakaoId: {
        userId,
        kakaoId: kakaoPlace.id,
      },
    },
    update: {
      name: kakaoPlace.place_name,
      lat,
      lng,
      address: kakaoPlace.address_name,
      roadAddress: kakaoPlace.road_address_name,
    },
    create: {
      userId,
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return await prisma.place.findUnique({
    where: {
      userId_kakaoId: {
        userId,
        kakaoId,
      },
    },
    include: {
      favorites: true,
      notes: {
        where: { unitId: null, userId }, // Only place-level notes for this user
      },
      externalLinks: {
        where: { userId },
      },
      units: {
        where: { userId },
        include: {
          notes: {
            where: { userId },
          },
        },
      },
    },
  });
}

export async function saveFavorite(placeId: string, color: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  return await prisma.favorite.upsert({
    where: {
      userId_placeId: {
        userId,
        placeId,
      },
    },
    update: { color },
    create: { userId, placeId, color },
  });
}

export async function saveExternalLink(
  placeId: string,
  title: string,
  url: string
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  return await prisma.externalLink.create({
    data: {
      userId,
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

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

  // Find existing note for this target AND user
  const where = unitId ? { unitId, userId } : { placeId, unitId: null, userId };

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
        userId,
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return await prisma.place.findMany({
    where: { userId },
    include: {
      favorites: {
        where: { userId },
      },
      notes: {
        where: { unitId: null, userId },
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

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
    create: {
      ...data,
      userId,
    },
  });
}

export async function getUnitsByPlace(placeId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return await prisma.unit.findMany({
    where: { placeId, userId },
    include: {
      notes: {
        where: { userId },
      },
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

export async function deletePlace(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.place.findUnique({
    where: { id },
  });

  if (!existing) return;

  // Note: Place might not have a userId if it's "global" but currently we link them.
  // If we want to allow deleting any place that the user has saved:
  // We should check if the user has a "note" or "favorite" on this place.
  // For simplicity, let's assume the user can delete it if it's in the system and they are logged in.
  // In a multi-user environment, we'd only let them delete "their" link to it.
  // But our schema has Place.userId.

  if (existing.userId && existing.userId !== userId)
    throw new Error("Permission denied");

  return await prisma.place.delete({
    where: { id },
  });
}

export async function deleteUnit(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.unit.findUnique({
    where: { id },
  });

  if (!existing) return;
  if (existing.userId && existing.userId !== userId)
    throw new Error("Permission denied");

  return await prisma.unit.delete({
    where: { id },
  });
}
