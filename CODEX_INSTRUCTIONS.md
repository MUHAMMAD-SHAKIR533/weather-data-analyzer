# CODEX_INSTRUCTIONS.md — Implementation Handoff

You are implementing **Weather Data Analyzer**, a weather analysis dashboard. All architectural decisions have already been made in the accompanying docs — do not re-decide them. This file is the prescriptive summary; the other files are the detailed reference. When in doubt, the more detailed file wins over this summary.

## 1. Technology stack (fixed — do not substitute)

- Next.js (App Router) + TypeScript + Tailwind CSS
- Recharts for all charts
- Supabase (PostgreSQL, accessed via the JS client / REST, server-side only)
- Open-Meteo REST API (Geocoding, Forecast, Archive) — no API key
- `lucide-react` for icons
- No auth library, no state-management library, no ORM, no Docker

## 2. Architecture (see `ARCHITECTURE.md` for full reasoning)

One deployable app: Next.js on Vercel. All weather data flows through Next.js API routes. Statistics are computed in a dependency-free TypeScript module (`lib/statistics.ts`), never by calling out to Python at request time. A separate, non-deployed `python/` folder contains real NumPy code for the educational `/numpy-analysis` and `/about` pages, whose output is pre-computed and checked in as static JSON — it is not a runtime dependency of the live app.

## 3. Folder structure

```
weather-data-analyzer/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard ("/")
│   ├── data/page.tsx                # Weather Data
│   ├── analysis/page.tsx            # Analysis
│   ├── statistics/page.tsx          # Statistics
│   ├── numpy-analysis/page.tsx      # NumPy Analysis
│   ├── about/page.tsx               # About Project
│   └── api/
│       ├── locations/search/route.ts
│       ├── weather/current/route.ts
│       ├── weather/history/route.ts
│       ├── analysis/route.ts
│       └── locations/route.ts       # optional, Phase 6 stretch
├── components/
│   ├── layout/ (Header, Sidebar, BottomNav, ThemeToggle)
│   ├── dashboard/ (SearchBar, LocationSuggestions, StatCard, ConditionBadge)
│   ├── charts/ (TemperatureTrendChart, MinMaxChart, HumidityAreaChart, RainfallBarChart, WindTrendChart, ConditionsDonutChart)
│   ├── table/ (WeatherTable, TableFilters, TablePagination)
│   └── ui/ (Button, Input, Card, Skeleton, Badge — small shared primitives)
├── lib/
│   ├── statistics.ts                 # mean/median/min/max/std — mirrors NumPy, see PYTHON_NUMPY.md
│   ├── openMeteo.ts                  # typed fetch wrappers, see API.md §6
│   ├── weatherCodes.ts               # WMO code → label/bucket lookup, see API.md §6
│   ├── supabase.ts                   # server-side Supabase client
│   └── getWeatherHistory.ts          # shared cache-aside logic used by /api/weather/history and /api/analysis
├── types/
│   └── weather.ts                    # shared TS types matching API.md response shapes
├── public/
│   └── python-output/                # copies of python/output/*.json for the /numpy-analysis page
├── database/
│   └── schema.sql                    # the SQL from DATABASE.md §3
├── python/                           # see PYTHON_NUMPY.md — not part of the Vercel build
├── docs/                             # this documentation set
├── .env.example
└── package.json
```

## 4. Database schema

Use exactly the schema in `DATABASE.md §3` — two tables, `locations` and `weather_records`. Do not add tables. Run the SQL against a Supabase project and save it at `database/schema.sql`.

## 5. API endpoints

Implement exactly the five (four required + one optional) endpoints in `API.md`, with the exact query params, response shapes, and error codes specified there. Extract the cache-aside logic used by both `/api/weather/history` and `/api/analysis` into `lib/getWeatherHistory.ts` — do not duplicate it.

## 6. UI pages

Six pages: Dashboard, Weather Data, Analysis, Statistics, NumPy Analysis, About Project — exact content and layout per `UI.md`. Follow the design system in `DESIGN.md` precisely (colors, type scale, spacing, card/chart styling) — this is not a "generic AI dashboard," match the specified "Atmospheric Intelligence" system, including the JetBrains Mono usage for data labels/code and the specific condition-color mapping.

## 7. Components

Build shared primitives once (`components/ui/`) and compose pages from them. Chart components each take a typed `data` prop and render one Recharts chart configured per `DESIGN.md §8`'s chart styling rules (axis colors, stroke widths, tooltip style). `StatCard` is used on both the Dashboard and Statistics pages — build it once, reuse it.

## 8. API integration

`lib/openMeteo.ts` should export three functions: `searchLocations(query, count)`, `getCurrentWeather(lat, lon)`, `getHistoricalWeather(lat, lon, startDate, endDate)`. Each wraps `fetch()` with a 5-second `AbortController` timeout, throws a typed `UpstreamError` on failure, and returns already-parsed/typed data — route handlers should be thin, calling these functions and `lib/statistics.ts`/`lib/supabase.ts`, not containing fetch/parsing logic inline.

## 9. NumPy/Python integration

Build `python/` per `PYTHON_NUMPY.md §2` as a genuinely standalone project. Run it locally, commit its `output/*.json` (copy into `public/python-output/` for the Next.js app to import/fetch). Do **not**: call Python from a Next.js API route, add a `vercel.json` Python runtime config, or make `next build` depend on `python/` in any way. The About Project page's code snippets and concept explanations come directly from `PYTHON_NUMPY.md §4`.

## 10. Environment variables

Exactly as listed in `DEPLOYMENT.md §3`: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (required, server-only, never `NEXT_PUBLIC_`-prefixed), optionally `NEXT_PUBLIC_APP_NAME`. Provide a `.env.example` with these keys (blank values). No Open-Meteo key, no auth secrets.

## 11. Error handling

Every API route returns the `{ error: { message, code } }` shape from `API.md §0` on failure, with the specific status codes and messages listed per-endpoint in `API.md`. Every corresponding UI state is specified in `UI.md §9` — implement all of them (invalid input, no results, upstream failure, DB failure, invalid date range, empty dataset, offline). Never surface a raw error message, stack trace, or upstream response body to the user.

## 12. Testing

Per `TODO.md` Phase 8: prioritize unit tests on `lib/statistics.ts` (pure, easy, high-value) and a manual pass against §14's acceptance criteria below. Full UI/e2e test coverage is not required for this project's scope.

## 13. Deployment

Follow `DEPLOYMENT.md` exactly — single Next.js project on Vercel, no `vercel.json` needed for the core app, Supabase accessed via REST/JS client (not raw Postgres connections), env vars set in the Vercel dashboard.

## 14. Acceptance criteria

The implementation is complete when all of the following are true:

1. Searching a real city name returns location suggestions and, on selection, real current weather on the Dashboard.
2. The Weather Data page shows a real historical table for the selected location with working search, sort, filter, and pagination, entirely client-side over one fetched dataset.
3. The Analysis page shows all four sections (Temperature, Humidity, Rainfall, Wind) with correct stat cards and charts, matching the metrics specified in `UI.md §4`.
4. The Statistics page shows Mean/Median/Min/Max/Range/Std Dev with the exact plain-language explanations from `PYTHON_NUMPY.md §5`, for each of the four metrics.
5. The NumPy Analysis page displays real, pre-computed NumPy output (not live-recomputed) alongside the array/code excerpts, and the `python/` project runs standalone and reproduces that output.
6. The About Project page covers all seven Python-fundamentals concepts from `PYTHON_NUMPY.md §4` with a snippet and one-line explanation each.
7. The app is visually consistent with `DESIGN.md` (colors, type, spacing, card/chart style) and responsive per `UI.md §10` at desktop/tablet/mobile widths.
8. Every error scenario in `UI.md §9` has been manually triggered and shows the specified friendly behavior, not a raw error or blank screen.
9. The two-table Supabase schema is live, and repeat requests for the same location/date-range are visibly served from cache (fewer/no Open-Meteo calls on the second request — verifiable via server logs).
10. `npm run build` succeeds with no type errors, and the app is deployed and reachable at a live Vercel URL with only the two required env vars configured.
11. No secrets are committed to the repository; `SUPABASE_SERVICE_ROLE_KEY` never appears in any client-side bundle or `NEXT_PUBLIC_` variable.
12. No table, endpoint, dependency, or feature exists in the codebase beyond what is specified in this documentation set.
