# OWASP Top 10 Checklist — 2026-02-25

기준: OWASP Top 10 (2021) 관점으로 현재 코드베이스를 점검한 체크리스트.

| 항목 | 상태 | 메모 |
|---|---|---|
| A01 Broken Access Control | **부분 완화** | `src/lib/queries.ts` write 경로 소유권/인증 가드 강화. 추가 회귀 테스트 보강 필요. |
| A02 Cryptographic Failures | **주의** | 비밀번호 bcrypt 해시 사용. 비밀키는 env 기반으로 전환(`AUTH_SECRET`, `AUTH_KAKAO_SECRET`). |
| A03 Injection | **부분 완화** | Prisma 파라미터/`$executeRaw` 템플릿 사용. raw SQL 경로에 대한 테스트/검증 계속 필요. |
| A04 Insecure Design | **부분 완화** | 로그인 rate-limit 정책 코드 반영(10분 5회 실패 시 15분 잠금). |
| A05 Security Misconfiguration | **완화** | Supabase Edge Function CORS wildcard 제거, allowlist + optional token 적용. |
| A06 Vulnerable and Outdated Components | **완화** | `npm audit` high 이슈 조치(Next 16.1.6). 보고서 참조. |
| A07 Identification and Authentication Failures | **부분 완화** | Dangerous account linking 비활성화, credentials 시도 제한 적용. |
| A08 Software and Data Integrity Failures | **주의** | CI 자동검증(보안 워크플로우) 추가. 서명/공급망 심화는 후속 과제. |
| A09 Security Logging and Monitoring Failures | **부분 완화** | `src/lib/observability.ts` 이벤트/오류 로깅 도입. 중앙집중 모니터링은 후속. |
| A10 SSRF | **주의** | 외부 호출 경로 존재(Kakao APIs). allowlist/timeout 적용됐으나 egress 정책은 인프라 레벨 보강 필요. |

## High 이상 이슈 처리 상태

- `npm audit` 기준 high 취약점: 조치 완료 (0건)
- CORS wildcard 구성: 제거 완료
- 인증 기본값 하드닝: 반영 완료

## 후속 권장

1. Node 20+ 런타임 강제
2. 보안 테스트 자동화(OWASP 항목별 smoke checks)
3. 중앙 로그 수집/알림 채널 연동
