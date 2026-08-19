---
name: epic-stack-catch-up
description: Implement Epic Stack catch-up child issues for patn-dev-stack (GitHub #23–#30, Playwright CI #33). Use when the task is an Epic Stack catch-up package, a cloud agent run of those issues, branching off origin/dev into a PR targeting dev, or Playwright CI browser-install hangs. Do not use for unrelated features.
---

# Epic Stack catch-up (Cloud Agents)

Read this skill **before coding**. Then treat the **child GitHub issue body as the spec**. Do not invent extra upgrades.

Parent: https://github.com/goodeats/patn-dev-stack/issues/23

## Order (do not skip ahead)

| Order | Issue | What |
|---|---|---|
| 1 | #24 | React Router 7.18+ CVE bump (PR #31). One-time typegen/`Info` and loader-arg fallout lives here. |
| **1b / next** | **#33** | **Cache Playwright browsers in CI.** Do this after #24 is on `dev`. Unblocks staging deploys. |
| 2 | #25 | Sentry hidden maps + event filters (not Sentry 10) |
| 3 | #26 | Small bugfix batch |
| 4 | #27 | LiteFS 2 + cache primary writes + asset fallthrough |
| 5 | #28 | Server `index.ts` / drop `server-build` / Express 5 |
| 6 | #29 | Vite 7 + Vitest 4 + remaining majors (Playwright bump must keep #33’s versioned cache key) |
| 7 | #30 | `react-router-auto-routes` + `dashboard+` rename (last; stronger model) |

Not blocking: #34 (research/improve this skill). Do not start #34 instead of #33 or 2/7–7/7. Iterate the skill as packages land.

## Git / PR

1. Branch off **current `origin/dev`**.
2. One issue per PR. Do not start the next package in the same PR.
3. PR **into `dev`**, never `main`.
4. Do **not** use PR #21 (`p/patn-dev-stack-updater`) as a base.
5. After merge to `dev`, staging auto-deploys. Human smokes staging, then closes the issue. Next agent, fresh context.

## Always keep (never wipe)

- `app/routes/dashboard+/**` behavior (package 7 may **rename/move** files only)
- Extra UI deps: `@dnd-kit/*`, `@tanstack/react-table`, `lucide-react`, `recharts`, `vaul`, `next-themes`, extra Radix, `@tabler/icons-react`
- Localtunnel: `LOCAL_TUNNEL_SUBDOMAIN`, `allowedHosts`, `localtunnel` script
- Custom `.env.example` keys; healthcheck `SELECT 1` (no self-HEAD)
- `fly.toml` `app = "patn-dev-stack"`, `primary_region = "bos"`
- `my-docs/`, `react-scan`, custom marketing, `README.md`
- Package `name` / `author`

## Files allowed

The child issue’s “Files allowed” list is the default. If compile/tests fail because of **this** issue’s change, you may edit extra files **only as required**, and **list them in the PR**. Do not expand scope “while we are here.”

Do not skip Playwright on dependency PRs.

## Already done in #24 (do not redo)

After #24 is merged to `dev`:

- `react-router` / `@react-router/*` **7.18.2**, `@remix-run/server-runtime` **2.17.5**
- Loader tests pass `url` + `pattern` on `LoaderFunctionArgs`
- Typegen no longer exports `Info` — use `Route.ComponentProps` loader/action data (one-time; not a later package)
- Playwright collection stub for Vite SVG imports: `playwright.config.ts` + `tests/svg-import-stub.cjs`. Keep it unless a later package replaces it properly.

## Playwright / CI

- Job timeout 60 minutes. If stuck on **Install Playwright Browsers**, that is **#33**, not a flake to ignore forever and not a reason to delete the Playwright `needs` gate.
- Do not poll a hung install for the full hour. Note it in the PR and move on if #33 is not merged yet.
- After #33: cache `~/.cache/ms-playwright` keyed by OS + `@playwright/test` version. Package 6/7 may bump Playwright; the cache key must change with the version.
- Collection `sprite.svg` SyntaxError: already handled in #24. Do not “fix” it by skipping e2e.

## Package-specific reminders

- **#25:** Do not bump Sentry 9 → 10. Keep localtunnel `allowedHosts`. Prefer #33 on `dev` first.
- **#27:** Do not migrate the server to Express 5 or drop `server-build` (that is #28). Keep `admin+` filenames.
- **#28:** After #24 and #27. Keep localtunnel and `dev:scan`. Node stays 22 (`^22.18.0` range is OK).
- **#29:** After #28. Keep extra UI packages. No Prisma 7, no Zod 4, no auto-routes.
- **#30:** Last. Convert `dashboard+` with auto-routes; do not delete dashboard or replace marketing with Epic Notes.

## Anti-hallucination

- Child issue body = entire spec.
- Epic Stack HEAD is **not** enough for RR CVEs (they stopped at 7.16.0; we needed 7.18.0+). That bump is done.
- Do not copy Epic Stack files that wipe the keep-list above.
