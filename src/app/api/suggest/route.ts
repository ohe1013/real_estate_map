import { NextResponse } from "next/server";
import { logServerError } from "@/lib/observability";

const KAKAO_SUGGEST_URL =
  "https://suggest-bar.kakao.com/suggest?id=merchant_ui&cnt=10&name=suggest&q=";
const MAX_KEYWORD_LENGTH = 80;
const REQUEST_TIMEOUT_MS = 4000;

type SuggestResponseItem = {
  key: string;
};

function normalizeKeyword(keyword: string | null) {
  const trimmed = keyword?.trim() || "";
  if (!trimmed) return "";
  return trimmed.slice(0, MAX_KEYWORD_LENGTH);
}

function parseSuggestPayload(text: string): unknown {
  const payload = text.trim();
  if (!payload) return null;

  try {
    return JSON.parse(payload);
  } catch {
    const jsonpMatch = payload.match(/^suggest\(([\s\S]*)\)\s*;?$/);
    if (!jsonpMatch) return null;
    try {
      return JSON.parse(jsonpMatch[1]);
    } catch {
      return null;
    }
  }
}

function toSuggestItems(parsed: unknown): SuggestResponseItem[] {
  if (!parsed || typeof parsed !== "object") return [];

  const candidateArrays: unknown[] = [];
  const json = parsed as Record<string, unknown>;

  if (Array.isArray(json.items)) candidateArrays.push(json.items);
  if (Array.isArray(json.suggest)) candidateArrays.push(json.suggest);
  if (json.suggest && typeof json.suggest === "object") {
    const nested = json.suggest as Record<string, unknown>;
    if (Array.isArray(nested.items)) candidateArrays.push(nested.items);
  }
  if (Array.isArray(json.result)) candidateArrays.push(json.result);

  for (const candidate of candidateArrays) {
    const normalized = (candidate as unknown[])
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          if (typeof obj.key === "string") return obj.key.trim();
          if (typeof obj.value === "string") return obj.value.trim();
          if (typeof obj.text === "string") return obj.text.trim();
          if (typeof obj.name === "string") return obj.name.trim();
        }
        return "";
      })
      .filter((item) => item.length > 0)
      .slice(0, 10)
      .map((key) => ({ key }));

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = normalizeKeyword(searchParams.get("keyword"));

  if (!keyword) {
    return NextResponse.json({ items: [] });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(
      `${KAKAO_SUGGEST_URL}${encodeURIComponent(keyword)}`,
      {
        signal: controller.signal,
        headers: {
          accept: "application/json, text/plain, */*",
        },
        cache: "no-store",
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ items: [] }, { status: response.status });
    }

    const rawPayload = await response.text();
    const parsedPayload = parseSuggestPayload(rawPayload);
    const items = toSuggestItems(parsedPayload);
    return NextResponse.json({ items });
  } catch (error) {
    logServerError("api.suggest.fetch_failed", error, { keyword });
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
