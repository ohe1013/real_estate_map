import { prisma } from "./db";

type GuardErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR";

export function throwCodeError(code: GuardErrorCode, message: string): never {
  throw new Error(`${code}: ${message}`);
}

export function assertAuthUser(userId?: string | null): string {
  if (!userId) {
    throwCodeError("UNAUTHORIZED", "로그인이 필요합니다.");
  }
  return userId;
}

export function assertNonEmptyString(
  value: string | null | undefined,
  fieldName: string
): string {
  const normalized = value?.trim();
  if (!normalized) {
    throwCodeError("VALIDATION_ERROR", `${fieldName} 값이 필요합니다.`);
  }
  return normalized;
}

export function assertPlainObject(
  value: unknown,
  fieldName: string
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throwCodeError(
      "VALIDATION_ERROR",
      `${fieldName} 값은 객체(JSON) 형태여야 합니다.`
    );
  }
  return value as Record<string, unknown>;
}

export function validateLatLng(lat: number, lng: number) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throwCodeError("VALIDATION_ERROR", "유효하지 않은 좌표입니다.");
  }
}

export function validateFavoriteColor(color: string): string {
  const normalized = assertNonEmptyString(color, "color");
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    throwCodeError("VALIDATION_ERROR", "color는 #RRGGBB 형식이어야 합니다.");
  }
  return normalized;
}

export function validateExternalUrl(url: string): string {
  const normalized = assertNonEmptyString(url, "url");

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throwCodeError("VALIDATION_ERROR", "유효한 URL이 아닙니다.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throwCodeError("VALIDATION_ERROR", "http/https URL만 허용됩니다.");
  }

  return parsed.toString();
}

export async function assertPlaceOwnership(placeId: string, userId: string) {
  const normalizedPlaceId = assertNonEmptyString(placeId, "placeId");

  const place = await prisma.place.findUnique({
    where: { id: normalizedPlaceId },
    select: { id: true, userId: true },
  });

  if (!place) {
    throwCodeError("VALIDATION_ERROR", "존재하지 않는 placeId 입니다.");
  }

  if (place.userId !== userId) {
    throwCodeError("FORBIDDEN", "해당 장소에 접근할 권한이 없습니다.");
  }

  return place;
}

export async function assertUnitOwnership(unitId: string, userId: string) {
  const normalizedUnitId = assertNonEmptyString(unitId, "unitId");

  const unit = await prisma.unit.findUnique({
    where: { id: normalizedUnitId },
    select: { id: true, userId: true, placeId: true },
  });

  if (!unit) {
    throwCodeError("VALIDATION_ERROR", "존재하지 않는 unitId 입니다.");
  }

  if (unit.userId !== userId) {
    throwCodeError("FORBIDDEN", "해당 세대에 접근할 권한이 없습니다.");
  }

  return unit;
}
