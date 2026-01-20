export type SuggestItem = {
  key: string;
};

export const getSuggestList = async (
  keyword: string
): Promise<SuggestItem[]> => {
  if (!keyword.trim()) return [];
  try {
    const res = await fetch(
      `/api/suggest?keyword=${encodeURIComponent(keyword)}`
    );
    const data = await res.json();
    const items = data.items || [];
    // items might be strings or objects depending on API version.
    // Adapting to reference: { key: string }
    return items.map((item: any) => ({ key: item.key || item }));
  } catch (e) {
    console.error(e);
    return [];
  }
};

export type SearchProps = {
  keyword: string;
  mapInstance: any; // kakao.maps.Map
  onResults: (data: any[], status: any, pagination: any) => void;
};

export const getSearchList = ({
  keyword,
  mapInstance,
  onResults,
}: SearchProps) => {
  if (!window.kakao || !window.kakao.maps) return;

  const ps = new window.kakao.maps.services.Places();
  const options: any = {
    size: 15,
  };

  if (mapInstance) {
    options.location = mapInstance.getCenter();
    options.useMapCenter = true;
    options.sort = window.kakao.maps.services.SortBy.DISTANCE;
  }

  ps.keywordSearch(keyword, onResults, options);
};

export const getAddressSearch = (
  keyword: string,
  onResults: (data: any[], status: any) => void
) => {
  if (!window.kakao || !window.kakao.maps) return;

  const geocoder = new window.kakao.maps.services.Geocoder();
  geocoder.addressSearch(keyword, (data: any[], status: any) => {
    // Convert Geocoder results to match KakaoPlace structure as much as possible
    const formattedData = data.map((item: any) => ({
      id: item.address_name, // Geocoder doesn't provide a unique ID like Places
      place_name: item.road_address?.address_name || item.address_name,
      address_name: item.address_name,
      road_address_name: item.road_address?.address_name || "",
      x: item.x,
      y: item.y,
      category_name: "주소", // Identify as address
      category_group_name: "",
      phone: "",
      place_url: "",
      distance: "",
    }));
    onResults(formattedData, status);
  });
};
