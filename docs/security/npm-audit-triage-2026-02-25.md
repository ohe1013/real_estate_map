# npm audit triage — 2026-02-25

## 1) Scan command

```bash
npm audit --json
```

## 2) Initial result (before patch update)

- `total`: 3
- `moderate`: 1 (`ajv`)
- `high`: 2 (`minimatch`, `next`)
- `critical`: 0

### High items

1. `next@16.1.2`
   - advisories:
     - GHSA-9g9p-9gw9-jx7f
     - GHSA-h25m-26qc-wcjf
     - GHSA-5f7q-jpqc-wp7h
2. `minimatch`
   - advisory: GHSA-3ppc-4f35-3m26

## 3) Mitigation applied

- `next` upgraded: `16.1.2 -> 16.1.6`
- `eslint-config-next` upgraded: `16.1.2 -> 16.1.6`
- lockfile refreshed via:

```bash
npm install --package-lock-only
```

## 4) Result after mitigation

- `total`: 0
- `moderate`: 0
- `high`: 0
- `critical`: 0

## 5) Notes

- Local CLI runtime is Node 18.x, while Next.js 16 requires Node 20.9+.
- CI/runtime Node version should be pinned to Node 20+.
