# real_estate_map

지도 기반 부동산/장소 평가 웹앱입니다.

## Current Stack (source of truth)

- **Frontend/App:** Next.js App Router, React, TypeScript
- **Auth:** NextAuth + Prisma Adapter
- **DB:** PostgreSQL + Prisma
- **Map/Search:** Kakao Maps SDK + Kakao Local API
- **Supabase Edge Function:** `supabase/functions/search-kakao` (호환용 서버 프록시)

> 현재 사이클 기준 canonical 검색 경로는 `src/lib/kakaoSearch.ts` + `src/app/api/suggest/route.ts` 입니다.
> Supabase Edge Function 경로는 보안 강화된 fallback/proxy 용도로 유지합니다.

---

## Environment Variables

필수/권장 환경 변수:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (Google 로그인 사용 시)
- `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET` (Kakao 로그인 사용 시)

Supabase Edge Function(`supabase/functions/search-kakao`)용:

- `KAKAO_REST_API_KEY` (필수)
- `ALLOWED_ORIGINS` (필수 권장, 쉼표 구분 allowlist)
- `EDGE_SHARED_TOKEN` (선택, 설정 시 요청 토큰 필수)

초기 설정:

```bash
cp .env.example .env.local
```

---

## Security Baseline

### Auth hardening

- Kakao provider hardcoded secret 제거 (env 기반)
- `allowDangerousEmailAccountLinking = false`
- Credentials 로그인 rate-limit 적용
  - 정책: **동일 email+IP 기준 10분 내 5회 실패 시 15분 잠금**

### Search proxy hardening

- Edge Function CORS wildcard(`*`) 제거
- origin allowlist 기반 허용
- optional shared token 검증(`EDGE_SHARED_TOKEN`)

---

## Quality Gate Policy (phase-based)

- **Phase A (현재):**
  - `npm run lint:changed`
- **Phase B (목표):**
  - repo-wide lint debt 정리 후 `npm run lint`

관련 스크립트:

```bash
npm run lint:changed
npm run quality:phase-a
npm run quality:phase-b
```

---

## Security Checks

```bash
# High 이상 취약점 확인
npm run security:audit

# 코드 + git history regex 기반 secrets scan
npm run security:secrets-scan
```

결과 문서 위치:

- `docs/security/npm-audit-triage-2026-02-25.md`
- `docs/security/owasp-top10-checklist-2026-02-25.md`
- `docs/security/secrets-scan-2026-02-25.md`

---

## Development

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

---

## MVP Phase Status (Spec)

- ✅ **Phase 4 (Auto render)**: 초기 로드 시 메모/즐겨찾기 대상 place 자동 fetch + 지도 마커 렌더, 저장 장소 리스트 패널에서 클릭 시 지도 이동/선택 지원
- ✅ **Phase 5 (External links)**: 호갱노노/리치고/KB부동산/네이버부동산 자동 링크 생성 + provider별 저장/수정 UI + 기존 사용자 커스텀 링크 병행 지원
