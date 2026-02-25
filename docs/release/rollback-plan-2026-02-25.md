# Rollback Plan — 2026-02-25

## Trigger Conditions

- Production login failure rate 급증
- Search/API suggest 실패율 급증
- 저장(saveNote/saveFavorite) 경로 오류율 급증
- 배포 직후 build/runtime crash

## Fast Rollback Steps

1. **배포 단위 롤백**
   - 직전 안정 커밋/릴리즈 태그로 즉시 롤백.

2. **Environment revert 확인**
   - OAuth / AUTH / Edge Function 관련 env 변경이 있었다면 직전 값으로 복구.

3. **Smoke re-check (rollback 후)**
   - `/auth/signin`, `/auth/signup` 진입 가능
   - 장소 검색 제안 동작
   - 저장된 장소 목록 렌더링

## Data Safety Notes

- 이번 변경은 주로 타입/린트/검증/문서화 성격이며, 스키마 destructive migration은 포함하지 않음.
- note upsert는 기존 unique constraint 기준 경로를 사용함 (`user_id+place_id`, `user_id+unit_id`).

## Owner Checklist

- [ ] 롤백 수행자 지정
- [ ] 롤백 커밋/태그 식별
- [ ] 롤백 후 15분 모니터링
- [ ] 장애 회고(runbook)에 타임라인 기록

## Runbook Link

- `docs/operations/runbook-template.md`
