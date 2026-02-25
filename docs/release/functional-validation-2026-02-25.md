# Functional Validation — 2026-02-25

> 범위: P3 baseline 기능 게이트 항목

## 1) Search latest-query-wins behavior

- 상태: **검증 완료 (코드 경로 검증)**
- 근거:
  - `requestSeqRef` 기반 요청 시퀀스 증가: `src/components/SearchBox.tsx:37,47`
  - 최신 요청이 아닌 응답 무시: `src/components/SearchBox.tsx:59`
  - stale 응답의 loading/result 반영 차단: `src/components/SearchBox.tsx:72-77`
  - 수동등록/입력초기화 시 시퀀스 무효화: `src/components/SearchBox.tsx:88,120`

## 2) Manual map-pick registration flow

- 상태: **검증 완료 (코드 경로 검증)**
- 근거:
  - 검색 박스에서 수동 등록 요청 콜백 전달: `src/app/page.tsx:114`
  - 수동 지도 클릭 핸들러가 KakaoPlace 생성 후 기존 선택 플로우 재사용: `src/app/page.tsx:86-106`
  - 지도 클릭 이벤트에서 pick mode일 때만 콜백 실행: `src/components/MapView.tsx:67-77`

## 3) Required-question save blocking

- 상태: **검증 완료 (클라이언트+서버 이중 검증)**
- 근거:
  - 클라이언트 저장 전 필수 누락 탐지: `src/components/PlaceSheet.tsx:65,181`
  - 서버 저장 시 필수 질문 누락 시 예외 처리: `src/lib/queries.ts:381-389`

## 4) Note upsert/uniqueness path vs DB constraints

- 상태: **검증 완료 (스키마+쿼리 정합성 검증)**
- 근거:
  - DB 유니크 제약: `prisma/schema.prisma:112` (`@@unique([userId, placeId])`)
  - DB 유니크 제약: `prisma/schema.prisma:113` (`@@unique([userId, unitId])`)
  - unit note upsert conflict target: `src/lib/queries.ts:422` (`ON CONFLICT ("user_id", "unit_id")`)
  - place note upsert conflict target: `src/lib/queries.ts:470` (`ON CONFLICT ("user_id", "place_id")`)

## Notes

- 이번 검증은 코드 경로/정합성 검증 중심이며, 실제 브라우저 수동 QA 시나리오는 별도 회차에서 추가 권장.
