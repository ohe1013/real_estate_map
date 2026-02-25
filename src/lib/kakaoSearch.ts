import { KakaoPlace } from "@/types";
import { logClientError } from "./observability";

export type SuggestItem = {
  key: string;
};

type KakaoSearchStatus = string;
type KakaoPagination = unknown;

type SearchResultsCallback = (
  data: KakaoPlace[],
  status: KakaoSearchStatus,
  pagination: KakaoPagination
) => void;

type AddressResultsCallback = (
  data: KakaoPlace[],
  status: KakaoSearchStatus
) => void;

export type SearchProps = {
  keyword: string;
  mapInstance: { getCenter?: () => unknown } | null;
  onResults: SearchResultsCallback;
};

function isKakaoReady() {
  return Boolean(
    typeof window !== "undefined" &&
      window.kakao?.maps?.services &&
      window.kakao?.maps?.services?.Status
  );
}

function isKakaoStatusOk(status: unknown) {
  if (!isKakaoReady()) return false;
  return status === window.kakao.maps.services.Status.OK;
}

function toAddressPlace(item: {
  address_name: string;
  road_address?: { address_name?: string };
  x: string;
  y: string;
}): KakaoPlace {
  return {
    id: `address:${item.address_name}:${item.x}:${item.y}`,
    place_name: item.road_address?.address_name || item.address_name,
    address_name: item.address_name,
    road_address_name: item.road_address?.address_name || "",
    x: item.x,
    y: item.y,
    category_name: "주소",
    category_group_code: "",
    category_group_name: "",
    phone: "",
    place_url: "",
    distance: "",
  };
}

export const getSuggestList = async (
  keyword: string
): Promise<SuggestItem[]> => {
  if (!keyword.trim()) return [];
  try {
    const res = await fetch(
      `/api/suggest?keyword=${encodeURIComponent(keyword.trim())}`
    );
    if (!res.ok) return [];

    const data = (await res.json()) as { items?: Array<{ key?: string } | string> };
    const items = data.items || [];
    return items
      .map((item) => ({ key: typeof item === "string" ? item : item.key || "" }))
      .filter((item) => item.key.trim().length > 0);
  } catch (error) {
    logClientError("kakao.suggest.fetch_failed", error, { keyword });
    return [];
  }
};

export const getSearchList = ({ keyword, mapInstance, onResults }: SearchProps) => {
  if (!isKakaoReady()) {
    onResults([], "SDK_UNAVAILABLE", null);
    return;
  }

  const ps = new window.kakao.maps.services.Places();
  const options: Record<string, unknown> = {
    size: 15,
  };

  if (mapInstance?.getCenter) {
    options.location = mapInstance.getCenter();
    options.useMapCenter = true;
    options.sort = window.kakao.maps.services.SortBy.DISTANCE;
  }

  ps.keywordSearch(
    keyword,
    (
      data: KakaoPlace[],
      status: KakaoSearchStatus,
      pagination: KakaoPagination
    ) => {
      onResults(data || [], status, pagination);
    },
    options
  );
};

export const getAddressSearch = (
  keyword: string,
  onResults: AddressResultsCallback
) => {
  if (!isKakaoReady()) {
    onResults([], "SDK_UNAVAILABLE");
    return;
  }

  const geocoder = new window.kakao.maps.services.Geocoder();
  geocoder.addressSearch(
    keyword,
    (
      data: Array<{
        address_name: string;
        road_address?: { address_name?: string };
        x: string;
        y: string;
      }>,
      status: KakaoSearchStatus
    ) => {
      const formattedData = Array.isArray(data) ? data.map(toAddressPlace) : [];
      onResults(formattedData, status);
    }
  );
};

export async function searchPlacesByKeyword({
  keyword,
  mapInstance,
}: {
  keyword: string;
  mapInstance: { getCenter?: () => unknown } | null;
}): Promise<KakaoPlace[]> {
  return await new Promise((resolve) => {
    getSearchList({
      keyword,
      mapInstance,
      onResults: (data, status) => {
        if (isKakaoStatusOk(status)) {
          resolve(data);
        } else {
          resolve([]);
        }
      },
    });
  });
}

export async function searchAddresses(keyword: string): Promise<KakaoPlace[]> {
  return await new Promise((resolve) => {
    getAddressSearch(keyword, (data, status) => {
      if (isKakaoStatusOk(status)) {
        resolve(data);
      } else {
        resolve([]);
      }
    });
  });
}
