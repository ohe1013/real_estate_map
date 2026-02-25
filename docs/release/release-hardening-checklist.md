# Release Hardening Checklist (P3 baseline)

## Runtime / Environment

- [x] Production runtime uses **Node 20.9+** (`node v24.14.0`)
- [x] `AUTH_SECRET` configured (key presence verified; value masked)
- [ ] OAuth secrets configured via env only (`AUTH_GOOGLE_*`, `AUTH_KAKAO_*`) — `AUTH_KAKAO_SECRET` 미확인 (`docs/release/env-presence-2026-02-25.json`)
- [ ] Edge Function env configured (`KAKAO_REST_API_KEY`, `ALLOWED_ORIGINS`, optional `EDGE_SHARED_TOKEN`) — local env key 미확인 (`docs/release/env-presence-2026-02-25.json`)

## Quality Gate

- [x] `npm run quality:phase-a` passes (changed-file lint)
- [x] Type check passes (`npx tsc --noEmit`)
- [x] Repo-wide lint debt tracked for Phase B (`docs/release/lint-debt-phase-b-2026-02-25.md`)

## Security Gate

- [x] `npm run security:audit` reports no high/critical
- [x] `npm run security:secrets-scan` reviewed
- [x] OWASP checklist reviewed (`docs/security/owasp-top10-checklist-2026-02-25.md`)

## Functional Gate

- [x] Search latest-query-wins behavior validated (`docs/release/functional-validation-2026-02-25.md`)
- [x] Manual map-pick registration flow validated (`docs/release/functional-validation-2026-02-25.md`)
- [x] Required-question save blocking validated (`docs/release/functional-validation-2026-02-25.md`)
- [x] Note upsert/uniqueness path validated against actual DB constraints (`docs/release/functional-validation-2026-02-25.md`)

## Release Notes / Ops

- [x] Risk notes documented (`docs/release/release-notes-2026-02-25.md`)
- [x] Rollback plan documented (`docs/release/rollback-plan-2026-02-25.md`)
- [x] On-call/runbook link attached (`docs/operations/runbook-template.md`)
