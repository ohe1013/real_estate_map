import { ExternalLink, KakaoPlace, Place } from "@/types";

export type ExternalProvider = "hogangnono" | "richgo" | "kb" | "naver";

type ProviderConfig = {
  key: ExternalProvider;
  title: string;
  aliases: string[];
  buildAutoUrl: (query: string) => string;
};

const PROVIDERS: ProviderConfig[] = [
  {
    key: "hogangnono",
    title: "호갱노노",
    aliases: ["hogangnono", "호갱노노"],
    buildAutoUrl: (query) =>
      `https://hogangnono.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    key: "richgo",
    title: "리치고",
    aliases: ["richgo", "리치고"],
    buildAutoUrl: (query) =>
      `https://richgo.ai/search?keyword=${encodeURIComponent(query)}`,
  },
  {
    key: "kb",
    title: "KB부동산",
    aliases: ["kb", "kbland", "kb부동산"],
    buildAutoUrl: (query) =>
      `https://kbland.kr/search?keyword=${encodeURIComponent(query)}`,
  },
  {
    key: "naver",
    title: "네이버부동산",
    aliases: ["naver", "네이버부동산", "네이버 부동산"],
    buildAutoUrl: (query) =>
      `https://m.land.naver.com/search/result/${encodeURIComponent(query)}`,
  },
];

const PROVIDER_MAP = new Map(
  PROVIDERS.map((provider) => [provider.key, provider])
);

function normalizeProviderTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function getPlaceQuery(place: KakaoPlace | Place): string {
  if ("place_name" in place) return place.place_name || "";
  return place.name || "";
}

export function getExternalProviderTitle(provider: ExternalProvider): string {
  return PROVIDER_MAP.get(provider)?.title || provider;
}

export function getExternalLinkProviderKey(
  title: string
): ExternalProvider | null {
  const normalized = normalizeProviderTitle(title);
  const found = PROVIDERS.find((provider) =>
    provider.aliases.some((alias) => normalizeProviderTitle(alias) === normalized)
  );
  return found?.key ?? null;
}

export function buildAutoExternalLink(
  provider: ExternalProvider,
  place: KakaoPlace | Place
): string {
  const config = PROVIDER_MAP.get(provider);
  if (!config) return "";
  return config.buildAutoUrl(getPlaceQuery(place));
}

export function resolveExternalProviderLink(
  provider: ExternalProvider,
  place: KakaoPlace | Place,
  externalLinks: ExternalLink[]
): { url: string; isSaved: boolean } {
  const savedLink = externalLinks.find(
    (link) => getExternalLinkProviderKey(link.title) === provider
  );
  if (savedLink?.url) {
    return { url: savedLink.url, isSaved: true };
  }
  return { url: buildAutoExternalLink(provider, place), isSaved: false };
}

export const EXTERNAL_PROVIDER_KEYS = PROVIDERS.map((provider) => provider.key);
