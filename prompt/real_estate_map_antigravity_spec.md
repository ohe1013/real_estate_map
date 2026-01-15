# Real Estate Map Memo App (MVP) — Antigravity Workspace Rules / Spec

> 목적: 지도에서 지역/단지를 검색하고, **템플릿 기반 메모**와 **색상 즐겨찾기**를 저장/표시하는 초간단 부동산 지도 앱을 만든다.
> DB는 **Supabase(Postgres)** 를 사용한다.  
> 이 문서는 Antigravity(에이전트 IDE)가 따라야 할 작업 규칙 + MVP 스펙 + 체크리스트를 한 파일로 정리한 것이다.

---

## 0) 범위 (MVP에서 반드시 되는 것)

1. **지도 검색 기능**
   - 검색창에서 주소/지역/단지명을 검색 → 결과 선택 시 지도 이동/핀 표시
2. **검색된 곳에 대한 메모 기능**
   - 장소(place) 선택 → 템플릿 선택 → 질문 폼에 답만 입력 → 저장
3. **지역/장소 즐겨찾기 + 사용자 지정 색상**
   - MVP는 **place 단위 즐겨찾기**로 구현 (확장: 폴리곤/행정동 레이어)
4. **메모/즐겨찾기 된 장소는 지도에 자동 표시**
   - 앱 로드 시 저장된 place를 불러와 자동으로 마커 렌더
5. **DB는 Supabase**
6. **메모는 질문 템플릿 기반**
   - 사용자는 질문을 새로 만들지 않고 답만 입력하도록
7. **템플릿 선택 가능**
   - 템플릿 리스트 + 템플릿별 문항 관리 (CRUD는 최소 구현)
8. **외부 서비스 링크 연결**
   - 호갱노노 / 리치고 / KB부동산 / 네이버부동산 링크 버튼 제공
   - MVP는 “검색 링크 자동 생성 + 사용자가 직접 링크 저장” 혼합을 허용

---

## 1) 기술 스택 결정 (고정)

- Front: **Next.js (React) + TypeScript**
- UI: Tailwind + (옵션) shadcn/ui
- Map: **MapLibre GL JS**
- Search Provider: **Kakao Local Search API** (권장)  
  - *주의*: API 키는 클라이언트에 직접 노출하지 말고 **Supabase Edge Function**으로 프록시한다.
- Auth/DB: **Supabase (Auth + Postgres + RLS)**

---

## 2) 핵심 UX 플로우

### 2.1 장소 검색 → 저장
1) 검색창 입력 → 결과 리스트 표시  
2) 결과 클릭 → 지도 이동(flyTo) + 임시 마커  
3) “저장/메모/즐겨찾기” 액션 수행 시 `places`에 upsert

### 2.2 템플릿 기반 메모 작성
1) place 선택 → [메모 작성] 클릭  
2) 템플릿 선택 (dropdown)  
3) 템플릿 문항이 폼으로 렌더 → 답 입력  
4) 저장 시 `notes.answers`에 JSON 저장

### 2.3 즐겨찾기(색상)
1) place 선택 → [즐겨찾기] 클릭  
2) 컬러 피커/프리셋 선택 → 저장  
3) 지도 마커 색상 반영

### 2.4 자동 표시
- 앱 시작 시: `notes` 또는 `favorites`가 존재하는 place들을 불러와 마커로 표시
- 지도 이동 시: (옵션) viewport(BBOX) 필터로 lazy-load

---

## 3) DB (Supabase) — 테이블 설계 요약

### 3.1 Tables
- `places`: 검색 결과/선택된 장소 저장 (lat/lng 필수)
- `templates`: 템플릿 메타
- `template_questions`: 템플릿 문항
- `notes`: place + template 기반 메모 (answers jsonb)
- `favorites`: place 즐겨찾기 (color hex)
- `external_links`: place별 외부 링크 저장

### 3.2 RLS 원칙
- 모든 테이블에 `user_id`를 두고 **auth.uid() = user_id** 만 접근 가능
- `template_questions`는 `templates.user_id` 기반으로 간접 제어

> DB SQL과 RLS 정책은 별도 `supabase/schema.sql` 로 관리하고, 마이그레이션 방식으로 적용한다.

---

## 4) 외부 링크 정책 (호갱노노/리치고/KB/네이버부동산)

### 4.1 자동 생성(안전한 방식)
- 호갱노노: **검색 링크** (단지명 query)
- 네이버부동산: 지도(좌표) 링크 or 검색 링크

### 4.2 사용자가 저장(정확한 deep link)
- 리치고/KB 등은 단지 ID 기반 URL이 안정적인 편이라,
  사용자가 한 번만 “링크 저장” 해두면 이후 원클릭 이동.

### 4.3 UI
- [호갱노노 열기] [리치고 열기] [KB부동산 열기] [네이버부동산 열기]
- 각 버튼은:
  - 저장된 링크가 있으면 그것을 사용
  - 없으면 자동 생성 링크(검색/좌표 기반)로 열기
  - 옆에 “링크 저장/수정” 버튼 제공

---

## 5) 프로젝트 구조 (권장)

```
/app
  /(auth)        # 로그인/가입
  /(main)
    page.tsx     # 지도 화면
/components
  MapView.tsx
  SearchBox.tsx
  PlaceSheet.tsx
  TemplateForm.tsx
/lib
  supabaseClient.ts
  queries.ts
  links.ts
/supabase
  schema.sql
  seed.sql
  functions/
    search-kakao/   # Edge Function 프록시
```

---

## 6) 구현 체크리스트 (Antigravity가 순서대로 수행)

### Phase 1 — Skeleton
- [ ] Next.js + TS 프로젝트 생성
- [ ] Supabase 프로젝트 연결 (env: SUPABASE_URL, ANON_KEY)
- [ ] Auth(구글 or 이메일) 최소 구현
- [ ] MapLibre 지도 렌더링 + 기본 마커

### Phase 2 — Search
- [ ] Supabase Edge Function으로 Kakao 검색 프록시 구현
- [ ] SearchBox → 결과 리스트 → 클릭 시 지도 이동

### Phase 3 — Persist
- [ ] `places` upsert 구현
- [ ] `favorites` CRUD + color 저장/표시
- [ ] `templates`, `template_questions` CRUD 최소 구현
- [ ] `notes` 생성/수정 + answers json 저장

### Phase 4 — Auto render
- [ ] 초기 로드 시 저장된 place fetch → 마커로 표시
- [ ] 리스트(메모/즐겨찾기) 패널 표시 + 클릭 시 지도 이동

### Phase 5 — External links
- [ ] links.ts에 자동 생성 로직
- [ ] external_links 저장/수정 UI

---

## 7) 코딩 규칙 (에이전트 작업 규약)

- **작게 쪼개기**: Map / Search / Sheet / Form 컴포넌트 분리
- **단방향 데이터 흐름**: 지도 상태(선택 place, markers)는 상위에서 관리
- **쿼리 함수 분리**: DB 접근은 `/lib/queries.ts`로 모으기
- **타입 정의**: Supabase row 타입은 별도 types 파일로 정리
- **에러 처리**: 검색/저장 실패 시 사용자에게 toast/alert 최소 제공
- **보안**: Kakao API 키는 Edge Function에서만 사용 (클라 노출 금지)
- **RLS 필수**: 개발 중에도 RLS 켜고 정책으로 해결

---

## 8) Acceptance Criteria (완료 조건)

- 사용자가 검색으로 장소를 찾고 선택할 수 있다.
- 선택된 장소에 템플릿 기반 메모를 작성/저장/조회할 수 있다.
- 선택된 장소를 색상 즐겨찾기로 저장하고 지도 마커 색이 반영된다.
- 메모/즐겨찾기된 모든 장소가 앱 진입 시 자동으로 지도에 표시된다.
- 외부 링크 버튼이 동작하고, 사용자가 링크를 저장해 재사용할 수 있다.
- Supabase RLS로 사용자 데이터가 분리된다.

---

## 9) (선택) 확장 아이디어

- 행정동/자치구 경계 레이어 + 폴리곤 즐겨찾기(색상 채우기)
- 지도 BBOX 기반 lazy-load + 클러스터링
- Realtime 협업(부부 계정 공유) / 공유 링크
- 템플릿 공유/복제
- 사진/문서 첨부 (Supabase Storage)

