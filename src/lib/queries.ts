"use server";

import { prisma } from "./db";
import { KakaoPlace, Place, Template } from "@/types";
import { Prisma } from "@prisma/client";
import { supabase } from "./supabaseClient";
import { auth } from "@/auth";
import {
  assertAuthUser,
  assertNonEmptyString,
  assertPlaceOwnership,
  assertPlainObject,
  assertUnitOwnership,
  throwCodeError,
  validateExternalUrl,
  validateFavoriteColor,
  validateLatLng,
} from "./guards";
import {
  ExternalProvider,
  getExternalLinkProviderKey,
  getExternalProviderTitle,
} from "./links";

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

function isAnswerProvided(answer: unknown, questionType?: string): boolean {
  if (answer === undefined || answer === null) return false;

  if (questionType === "multiselect") {
    return Array.isArray(answer) && answer.length > 0;
  }

  if (questionType === "rating") {
    return Number.isFinite(Number(answer));
  }

  if (typeof answer === "string") {
    return answer.trim().length > 0;
  }

  return true;
}

function getMissingRequiredQuestionIds(
  answers: Record<string, unknown>,
  questions: Array<{
    id: string;
    type?: string;
    required?: boolean;
    isActive?: boolean;
  }>
): string[] {
  return questions
    .filter((q) => q.required && q.isActive !== false)
    .filter((q) => !isAnswerProvided(answers[q.id], q.type))
    .map((q) => q.id);
}

type EvaluationQuestion = {
  id: string;
  type?: string | null;
  options?: unknown;
  criticalLevel?: number | null;
  isBad?: boolean | null;
  isActive?: boolean | null;
};

type SaveTemplateQuestionInput = {
  id?: string;
  text: string;
  type: string;
  options?: unknown;
  category?: string | null;
  criticalLevel?: number;
  isBad?: boolean;
  isActive?: boolean;
  required?: boolean;
  helpText?: string | null;
};

function toPrismaInputJson(
  value: unknown
): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

function getYesNoBaseScore(answer: unknown): number | null {
  if (answer === true || answer === "Yes" || answer === "yes") return 2;
  if (answer === false || answer === "No" || answer === "no") return -2;
  if (answer === "-") return 0;
  return null;
}

/**
 * Calculates Pass/Hold/Fail based on answers
 */
export async function calculateEvaluation(
  answers: Record<string, unknown>,
  questions: EvaluationQuestion[]
) {
  let totalScore = 0;

  for (const q of questions) {
    if (!q.isActive) continue;
    const ans = answers[q.id];
    if (ans === undefined || ans === null) continue;

    const multiplier = q.criticalLevel || 1;
    const polarity = q.isBad ? -1 : 1;
    let questionScore = 0;

    if (q.type === "rating") {
      // 1(-2), 2(-1), 3(0), 4(1), 5(2)
      const rating = Number(ans);
      if (!Number.isFinite(rating)) continue;
      const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));
      const baseScore = clampedRating - 3;
      questionScore = baseScore * multiplier * polarity;
    } else if (q.type === "yesno") {
      // Yes (2), No (-2), "-" (0)
      const baseScore = getYesNoBaseScore(ans);
      if (baseScore === null) continue;
      questionScore = baseScore * multiplier * polarity;
    } else if (q.type === "multiselect") {
      const options = Array.isArray(q.options) ? q.options : [];
      const selected = Array.isArray(ans) ? ans : [];
      if (options.length > 0) {
        const dedupedSelectedCount = new Set(selected).size;
        const ratio = Math.min(dedupedSelectedCount, options.length) / options.length;
        const baseScore = ratio * 2;
        questionScore = baseScore * multiplier * polarity;
      }
    }

    totalScore += questionScore;
  }

  if (totalScore >= 3) return "PASS";
  if (totalScore >= 0) return "HOLD";
  return "FAIL";
}

export async function upsertPlace(kakaoPlace: KakaoPlace): Promise<Place> {
  const session = await auth();
  const userId = assertAuthUser(session?.user?.id);

  const kakaoId = assertNonEmptyString(kakaoPlace?.id, "kakaoPlace.id");
  const placeName = assertNonEmptyString(
    kakaoPlace?.place_name,
    "kakaoPlace.place_name"
  );
  const latRaw = assertNonEmptyString(kakaoPlace?.y, "kakaoPlace.y");
  const lngRaw = assertNonEmptyString(kakaoPlace?.x, "kakaoPlace.x");
  const lat = parseFloat(latRaw);
  const lng = parseFloat(lngRaw);
  validateLatLng(lat, lng);

  // DB 리셋 등으로 인해 세션은 있으나 실제 유저 레코드가 없을 수 있음
  const userExists = await prisma.user.count({ where: { id: userId } });
  if (userExists === 0) {
    throwCodeError(
      "UNAUTHORIZED",
      "세션 정보가 유효하지 않습니다. 로그아웃 후 다시 로그인해 주세요."
    );
  }

  const place = await prisma.place.upsert({
    where: {
      userId_kakaoId: {
        userId,
        kakaoId,
      },
    },
    update: {
      name: placeName,
      lat,
      lng,
      address: kakaoPlace.address_name?.trim() || null,
      roadAddress: kakaoPlace.road_address_name?.trim() || null,
    },
    create: {
      userId,
      kakaoId,
      name: placeName,
      lat,
      lng,
      address: kakaoPlace.address_name?.trim() || null,
      roadAddress: kakaoPlace.road_address_name?.trim() || null,
    },
  });

  return place as Place;
}

export async function getPlaceByKakaoId(kakaoId: string): Promise<Place | null> {
  const normalizedKakaoId = assertNonEmptyString(kakaoId, "kakaoId");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const place = await prisma.place.findUnique({
    where: {
      userId_kakaoId: {
        userId,
        kakaoId: normalizedKakaoId,
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

  return place as Place | null;
}

export async function saveFavorite(placeId: string, color: string) {
  const session = await auth();
  const userId = assertAuthUser(session?.user?.id);
  const normalizedColor = validateFavoriteColor(color);
  const place = await assertPlaceOwnership(placeId, userId);

  return await prisma.favorite.upsert({
    where: {
      userId_placeId: {
        userId,
        placeId: place.id,
      },
    },
    update: { color: normalizedColor },
    create: { userId, placeId: place.id, color: normalizedColor },
  });
}

export async function saveExternalLink(
  placeId: string,
  title: string,
  url: string
) {
  const session = await auth();
  const userId = assertAuthUser(session?.user?.id);
  const place = await assertPlaceOwnership(placeId, userId);
  const normalizedTitle = assertNonEmptyString(title, "title");
  const normalizedUrl = validateExternalUrl(url);

  return await prisma.externalLink.create({
    data: {
      userId,
      placeId: place.id,
      title: normalizedTitle,
      url: normalizedUrl,
    },
  });
}

export async function updateExternalLink(
  linkId: string,
  title: string,
  url: string
) {
  const session = await auth();
  const userId = assertAuthUser(session?.user?.id);
  const normalizedLinkId = assertNonEmptyString(linkId, "linkId");
  const normalizedTitle = assertNonEmptyString(title, "title");
  const normalizedUrl = validateExternalUrl(url);

  const link = await prisma.externalLink.findUnique({
    where: { id: normalizedLinkId },
    select: { id: true, userId: true },
  });

  if (!link) {
    throwCodeError("VALIDATION_ERROR", "존재하지 않는 링크입니다.");
  }

  if (link.userId !== userId) {
    throwCodeError("FORBIDDEN", "해당 링크를 수정할 권한이 없습니다.");
  }

  return await prisma.externalLink.update({
    where: { id: normalizedLinkId },
    data: {
      title: normalizedTitle,
      url: normalizedUrl,
    },
  });
}

export async function deleteExternalLink(linkId: string) {
  const session = await auth();
  const userId = assertAuthUser(session?.user?.id);
  const normalizedLinkId = assertNonEmptyString(linkId, "linkId");

  const link = await prisma.externalLink.findUnique({
    where: { id: normalizedLinkId },
    select: { id: true, userId: true },
  });

  if (!link) {
    throwCodeError("VALIDATION_ERROR", "존재하지 않는 링크입니다.");
  }

  if (link.userId !== userId) {
    throwCodeError("FORBIDDEN", "해당 링크를 삭제할 권한이 없습니다.");
  }

  return await prisma.externalLink.delete({
    where: { id: normalizedLinkId },
  });
}

export async function saveProviderExternalLink(
  placeId: string,
  provider: ExternalProvider,
  url: string
) {
  const session = await auth();
  const userId = assertAuthUser(session?.user?.id);
  const place = await assertPlaceOwnership(placeId, userId);
  const normalizedInputUrl = url.trim();
  const providerTitle = getExternalProviderTitle(provider);

  const existingLinks = await prisma.externalLink.findMany({
    where: { userId, placeId: place.id },
    select: { id: true, title: true },
  });

  const existingProviderLink = existingLinks.find(
    (link) => getExternalLinkProviderKey(link.title) === provider
  );

  if (!normalizedInputUrl) {
    if (existingProviderLink) {
      await prisma.externalLink.delete({
        where: { id: existingProviderLink.id },
      });
    }
    return null;
  }

  const normalizedUrl = validateExternalUrl(normalizedInputUrl);

  if (existingProviderLink) {
    return await prisma.externalLink.update({
      where: { id: existingProviderLink.id },
      data: { title: providerTitle, url: normalizedUrl },
    });
  }

  return await prisma.externalLink.create({
    data: {
      userId,
      placeId: place.id,
      title: providerTitle,
      url: normalizedUrl,
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
  answers: Record<string, unknown>;
  templateId?: string;
}) {
  const session = await auth();
  const userId = assertAuthUser(session?.user?.id);
  const normalizedAnswersObject = assertPlainObject(answers, "answers");
  const normalizedTemplateId = templateId?.trim() || undefined;
  const normalizedPlaceId = placeId?.trim() || undefined;
  const normalizedUnitId = unitId?.trim() || undefined;

  if (!normalizedPlaceId && !normalizedUnitId) {
    throwCodeError(
      "VALIDATION_ERROR",
      "placeId 또는 unitId 중 하나는 반드시 필요합니다."
    );
  }

  let targetPlaceId: string | null = null;
  let targetUnitId: string | null = null;

  if (normalizedUnitId) {
    const unit = await assertUnitOwnership(normalizedUnitId, userId);
    targetUnitId = unit.id;
    targetPlaceId = unit.placeId;

    if (normalizedPlaceId && normalizedPlaceId !== unit.placeId) {
      throwCodeError(
        "VALIDATION_ERROR",
        "unitId와 placeId가 서로 다른 대상을 가리킵니다."
      );
    }
  }

  if (normalizedPlaceId) {
    const place = await assertPlaceOwnership(normalizedPlaceId, userId);

    if (!targetPlaceId) {
      targetPlaceId = place.id;
    }
  }

  let evaluation: string | null = null;

  if (normalizedTemplateId) {
    const template = await prisma.template.findUnique({
      where: { id: normalizedTemplateId },
      include: { questions: true },
    });

    if (!template) {
      throwCodeError(
        "VALIDATION_ERROR",
        `유효하지 않은 templateId 입니다. (${normalizedTemplateId})`
      );
    }

    if (template.userId && template.userId !== userId) {
      throwCodeError("FORBIDDEN", "해당 템플릿에 접근할 권한이 없습니다.");
    }

    const missingRequiredIds = getMissingRequiredQuestionIds(
      normalizedAnswersObject,
      template.questions
    );

    if (missingRequiredIds.length > 0) {
      throwCodeError(
        "VALIDATION_ERROR",
        `필수 질문이 누락되었습니다. missingQuestionIds=${missingRequiredIds.join(",")}`
      );
    }

    evaluation = await calculateEvaluation(normalizedAnswersObject, template.questions);
  }

  const answersJson = normalizedAnswersObject as Prisma.InputJsonValue;

  if (targetUnitId) {
    return await prisma.$transaction(async (tx) => {
      const data = {
        placeId: null,
        unitId: targetUnitId,
        templateId: normalizedTemplateId ?? null,
        answers: answersJson,
        evaluation,
      };

      const updated = await tx.note.updateMany({
        where: {
          userId,
          unitId: targetUnitId,
        },
        data,
      });

      if (updated.count === 0) {
        return await tx.note.create({
          data: {
            userId,
            ...data,
          },
        });
      }

      const existing = await tx.note.findFirst({
        where: {
          userId,
          unitId: targetUnitId,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      if (existing) return existing;

      return await tx.note.create({
        data: {
          userId,
          ...data,
        },
      });
    });
  }

  if (!targetPlaceId) {
    throwCodeError(
      "VALIDATION_ERROR",
      "저장할 placeId 또는 unitId 대상이 확인되지 않았습니다."
    );
  }

  return await prisma.$transaction(async (tx) => {
    const data = {
      placeId: targetPlaceId,
      unitId: null,
      templateId: normalizedTemplateId ?? null,
      answers: answersJson,
      evaluation,
    };

    const updated = await tx.note.updateMany({
      where: {
        userId,
        placeId: targetPlaceId,
        unitId: null,
      },
      data,
    });

    if (updated.count === 0) {
      return await tx.note.create({
        data: {
          userId,
          ...data,
        },
      });
    }

    const existing = await tx.note.findFirst({
      where: {
        userId,
        placeId: targetPlaceId,
        unitId: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (existing) return existing;

    return await tx.note.create({
      data: {
        userId,
        ...data,
      },
    });
  });
}

export async function getUserPlaces(): Promise<Place[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const places = await prisma.place.findMany({
    where: {
      userId,
      OR: [
        { favorites: { isNot: null } },
        { notes: { some: { unitId: null, userId } } },
        { units: { some: { notes: { some: { userId } } } } },
      ],
    },
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

  return places as Place[];
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
  const userId = assertAuthUser(session?.user?.id);
  const place = await assertPlaceOwnership(data.placeId, userId);
  const normalizedLabel = assertNonEmptyString(data.label, "label");

  const existing = await prisma.unit.findUnique({
    where: {
      placeId_label: {
        placeId: place.id,
        label: normalizedLabel,
      },
    },
    select: { id: true, userId: true },
  });

  if (existing && existing.userId !== userId) {
    throwCodeError("FORBIDDEN", "해당 세대를 수정할 권한이 없습니다.");
  }

  return await prisma.unit.upsert({
    where: {
      placeId_label: {
        placeId: place.id,
        label: normalizedLabel,
      },
    },
    update: {
      dong: data.dong?.trim() || null,
      ho: data.ho?.trim() || null,
      floor: data.floor,
      direction: data.direction?.trim() || null,
      viewDesc: data.viewDesc?.trim() || null,
    },
    create: {
      placeId: place.id,
      label: normalizedLabel,
      dong: data.dong?.trim() || null,
      ho: data.ho?.trim() || null,
      floor: data.floor,
      direction: data.direction?.trim() || null,
      viewDesc: data.viewDesc?.trim() || null,
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
  scope: Template["scope"];
  questions: SaveTemplateQuestionInput[];
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
            options: toPrismaInputJson(q.options),
            orderIdx: idx,
            category: q.category ?? null,
            criticalLevel: q.criticalLevel ?? 1,
            isBad: q.isBad ?? false,
            isActive: q.isActive ?? true,
            required: q.required ?? false,
            helpText: q.helpText ?? null,
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
            options: toPrismaInputJson(q.options),
            orderIdx: idx,
            category: q.category ?? null,
            criticalLevel: q.criticalLevel ?? 1,
            isBad: q.isBad ?? false,
            isActive: q.isActive ?? true,
            required: q.required ?? false,
            helpText: q.helpText ?? null,
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
