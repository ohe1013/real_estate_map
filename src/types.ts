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
  userId?: string | null;
  createdAt: Date;
}

export interface ExternalLink {
  id: string;
  placeId: string;
  title: string;
  url: string;
  userId?: string | null;
  createdAt: Date;
}

export interface Unit {
  id: string;
  placeId: string;
  userId?: string | null;
  label: string;
  dong?: string | null;
  line?: string | null;
  ho?: string | null;
  floor?: number | null;
  direction?: string | null;
  viewDesc?: string | null;
  createdAt: Date;
  notes?: Note[];
}

export interface Note {
  id: string;
  userId?: string | null;
  placeId?: string | null;
  unitId?: string | null;
  templateId: string | null;
  answers: Record<string, unknown>;
  evaluation?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  templateId: string;
  text: string;
  type: string;
  options?: unknown;
  orderIdx: number;
  category?: string | null;
  criticalLevel: number;
  isBad: boolean;
  isActive: boolean;

  required: boolean;
  helpText?: string | null;
  createdAt: Date;
}

export interface Template {
  id: string;
  title: string;
  userId?: string | null;
  scope: "PLACE" | "UNIT" | "BOTH";
  questions?: Question[];
  createdAt: Date;
}

export interface Place {
  id: string;
  kakaoId: string;
  name: string;
  lat: number;
  lng: number;
  address?: string | null;
  roadAddress?: string | null;
  userId?: string | null;
  createdAt: Date;
  notes?: Note[];
  favorites?: Favorite | null;
  externalLinks?: ExternalLink[];
  units?: Unit[];
}
