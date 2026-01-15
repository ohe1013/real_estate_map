export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

export interface KakaoSearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
    same_name: {
      region: string[];
      keyword: string;
      selected_region: string;
    };
  };
  documents: KakaoPlace[];
}

export interface Favorite {
  id: string;
  placeId: string;
  color: string;
  createdAt: Date;
}

export interface ExternalLink {
  id: string;
  placeId: string;
  title: string;
  url: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  placeId: string;
  answers: any;
  evaluation?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Place {
  id: string;
  kakaoId: string;
  name: string;
  lat: number;
  lng: number;
  address?: string | null;
  roadAddress?: string | null;
  createdAt: Date;
  notes?: Note[];
  favorites?: Favorite | null; // Prisma Favorite?
  externalLinks?: ExternalLink[];
}
