# TODO.md — Phased Implementation Plan

Build strictly in this order. Each phase should leave the app in a runnable, demoable state. Do not start a phase's Supabase/Open-Meteo work before Phase 1–4 prove the UI on static sample data.

## Phase 1 — Basic UI and navigation
- Next.js (App Router) + TypeScript + Tailwind project scaffold.
- Design tokens from `DESIGN.md` wired into `tailwind.config.ts` and CSS variables (light + dark).
- App shell: header, sidebar nav (desktop/tablet), bottom tab bar (mobile), theme toggle (functional, no persistence needed beyond a React state / `localStorage` toggle).
- Five route stubs: `/`, `/data`, `/analysis`, `/statistics`, `/about`, plus `/numpy-analysis`. Each renders its title and layout only — no real data yet.
- **Deliverable:** navigable, responsive shell with correct visual system, no backend calls.

## Phase 2 — Weather API integration
- Implement `GET /api/locations/search` and `GET /api/weather/current` per `API.md §1–2`, calling Open-Meteo directly (no Supabase yet — that's Phase 6).
- Dashboard page: working search box with suggestions, current-weather cards wired to real data.
- **Deliverable:** search "Lahore" → see real current weather on the Dashboard.

## Phase 3 — Weather data table
- Implement `GET /api/weather/history` per `API.md §3`, but **without** the Supabase cache step for now — fetch straight from Open-Meteo Archive API each time (the cache layer is added cleanly in Phase 6 without changing the route's external contract).
- Build the Weather Data page table: search/sort/filter/pagination, all client-side, per `UI.md §3`.
- **Deliverable:** real historical data browsable in a working table.

## Phase 4 — Charts and analysis
- Build `lib/statistics.ts` (mean/median/min/max/std, no dependencies) per `ARCHITECTURE.md §2`.
- Implement `GET /api/analysis` per `API.md §4`.
- Build the Analysis page (all four sections + charts) and Statistics page per `UI.md §4–5`, using Recharts.
- **Deliverable:** full Analysis + Statistics pages working against live Open-Meteo data.

## Phase 5 — NumPy/Python analysis
- Build the `python/` project per `PYTHON_NUMPY.md §2`, run it locally against `docs/sample-data.json`, produce `python/output/*.json`.
- Build the `/numpy-analysis` page consuming those static JSON files per `UI.md §6`.
- Build the `/about` page content per `PYTHON_NUMPY.md §4`.
- **Deliverable:** NumPy Analysis and About Project pages complete; Python code is real, runnable, and documented, but not part of the deployed app's request path.

## Phase 6 — Supabase database
- Create the Supabase project, run the SQL from `DATABASE.md §3`.
- Add `lib/supabase.ts` (service-role server client).
- Wire the cache-aside logic into `/api/weather/history` and `/api/analysis` per `API.md §3` (find-or-create location, check cache, fetch-and-upsert on miss).
- *(Optional stretch, only if time remains)* implement `POST /api/locations` and a simple "favorites" affordance in the search UI.
- **Deliverable:** repeat lookups of the same location/date-range are visibly faster (served from cache); confirm rows appear in Supabase.

## Phase 7 — Error handling and responsive design
- Implement every row of `UI.md §9` (error states) and `API.md §0/§6` (upstream timeouts, typed error responses).
- Audit every page against `UI.md §10` responsive table and `DESIGN.md` breakpoints on real device widths (or browser devtools device emulation) — desktop, tablet, mobile.
- Add all skeleton loading states per `UI.md §8`.
- **Deliverable:** no page shows a raw error, a blank screen during load, or a broken layout at 375px/768px/1440px widths.

## Phase 8 — Testing
- Manual test pass against the acceptance criteria in `CODEX_INSTRUCTIONS.md §14`.
- Spot-check statistics correctness: pick one date range, compute mean/median/std by hand (or in a Python REPL with NumPy) for one metric, confirm the API and UI numbers match.
- Verify accessibility basics from `UI.md §11` (keyboard nav through search → results → nav → table sort; screen reader spot-check on at least the Dashboard and one chart).
- Automated tests are optional given project scope; if added, prefer a handful of unit tests on `lib/statistics.ts` (pure functions, easy to test, highest-value target) over broad UI test coverage.
- **Deliverable:** confidence the numbers are correct and the app doesn't break under normal use (empty search, no results, invalid date range, offline).

## Phase 9 — Vercel deployment
- Follow `DEPLOYMENT.md` end to end: env vars, build check, deploy, smoke test.
- **Deliverable:** a live Vercel URL demoing the full app.

## Explicitly out of scope / do not build unless asked
- Authentication or user accounts.
- Payments.
- A live Python serverless function on Vercel (see `ARCHITECTURE.md §2` "stretch option" — only revisit after Phase 9 is stable and only if there's a genuine reason).
- Docker, AWS, Kubernetes, Redis, background workers/cron.
- Any database table beyond `locations` and `weather_records` unless a specific new UI requirement justifies it.
