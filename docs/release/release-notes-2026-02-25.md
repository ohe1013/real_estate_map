# Release Notes / Risk Notes — 2026-02-25

## Scope

- Node runtime 정렬 및 빌드 체인 안정화
- Phase A 품질 게이트 통과를 위한 타입/린트 정리
- 보안 점검 재실행 및 최신 결과 반영
- P3 baseline 체크리스트 증빙 문서화

## Verification Snapshot

- `npm run quality:phase-a` ✅ pass
- `npx tsc --noEmit --pretty false` ✅ pass
- `npm run build` ✅ pass
- `npm run security:audit` ✅ `found 0 vulnerabilities`
- `npm run security:secrets-scan` ✅ working-tree 0 / git-history 0

## Known Risks / Follow-ups

1. **OAuth provider completeness**
   - 현재 `.env/.env.local` 기준 `AUTH_KAKAO_SECRET` 미확인.
   - 영향: Kakao OAuth provider 활성화 조건 미충족 가능.

2. **Edge Function environment completeness**
   - 현재 local env 기준 `KAKAO_REST_API_KEY`, `ALLOWED_ORIGINS`, `EDGE_SHARED_TOKEN` 미확인.
   - 영향: Supabase Edge Function 배포 환경에서 미설정 시 검색 프록시 실패/차단 가능.

3. **Repo-wide lint debt**
   - Snapshot 기준 errors/warnings 0건.
   - 영향: 현재 Phase B lint debt 없음 (신규 변경 유입 시 재측정 필요).

## Linked Evidence

- Functional validation: `docs/release/functional-validation-2026-02-25.md`
- Lint debt snapshot: `docs/release/lint-debt-phase-b-2026-02-25.md`
- Env presence (keys only): `docs/release/env-presence-2026-02-25.json`
- Security checklist: `docs/security/owasp-top10-checklist-2026-02-25.md`
