# Secrets scan report — 2026-02-25

## 1) Scan command

```bash
npm run security:secrets-scan
```

## 2) Scope

- Working tree (tracked source files)
- Git history (`git rev-list --all` 대상)
- `.env`, `.env.local` 제외

## 3) Pattern set

- AWS access key
- Google API key
- Slack token
- PEM/OpenSSH private key header
- Generic secret assignment heuristic

## 4) Result

- Working tree matches: **0**
- Git history matches: **0**

## 5) Evidence

- Raw report: `docs/security/secrets-scan-latest.json`
- generatedAt: `docs/security/secrets-scan-latest.json.generatedAt` 참고
