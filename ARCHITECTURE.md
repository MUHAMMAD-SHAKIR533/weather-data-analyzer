# ARCHITECTURE.md — System Architecture

## 1. High-level shape

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
│   Next.js pages/components · Recharts · fetch() to /api/*        │
└───────────────────────────────┬──────────────────────────────────┘
                                 │ HTTPS
┌───────────────────────────────▼──────────────────────────────────┐
│              Vercel — Next.js Serverless API Routes (Node)        │
│  /api/locations/search  /api/weather/current  /api/weather/history│
│  /api/analysis          /api/locations (optional save)            │
│                                                                     │
│  lib/statistics.ts  — mean/median/mode/min/max/std (TS, no deps)  │
│  lib/openMeteo.ts   — typed fetch wrappers for Open-Meteo          │
│  lib/supabase.ts    — Supabase server client (service role)        │
└───────────┬───────────────────────────────────────────┬───────────┘
            │ HTTPS (no key)                             │ HTTPS
┌───────────▼───────────────┐                 ┌──────────▼───────────┐
│   Open-Meteo REST API      │                 │  Supabase PostgreSQL  │
│  - Geocoding API            │                │  - locations           │
│  - Forecast API (current)   │                │  - weather_records     │
│  - Archive API (historical)│                 │  (cache / history log) │
└─────────────────────────────┘                └───────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│        (Separate, NOT deployed) python/ — educational only        │
│  NumPy re-implementation of lib/statistics.ts, run locally on the │
│  sample dataset. Referenced by the "NumPy Analysis" page as       │
│  static code/output examples, never called at request time.      │
└─────────────────────────────────────────────────────────────────┘
```

There is exactly **one deployable runtime**: the Next.js app on Vercel. Everything the live site needs at request time — geocoding, weather retrieval, statistics, charting data — happens inside Next.js API routes written in TypeScript.

## 2. The Python/NumPy decision (read this before building anything)

The brief for this project is explicit that it must demonstrate Python fundamentals and NumPy, but also that it must deploy simply and reliably to Vercel on a free plan. These two goals are in tension, and the tension has to be resolved explicitly rather than left for the implementer to guess at. Here's the reasoning:

**Why Python should not be part of the live request path on Vercel:**
- Vercel's first-class runtime is Node.js. Python functions are supported through a separate community/runtime configuration, but they are a second build pipeline, with their own cold-start behavior, their own dependency install step (`numpy` is a compiled/binary package, not pure Python — this materially increases build time and function bundle size), and their own debugging surface.
- Running two runtimes for one small app roughly doubles the number of things that can break during deployment, for a project explicitly built around "limited/free AI coding credits" and "avoid unnecessary complexity."
- Every statistic actually needed here (mean, median, min, max, standard deviation) is a handful of lines of TypeScript with zero dependencies. There is no computational or capability reason to reach for Python in production.

**Decision:** the production statistics engine is a small, dependency-free TypeScript module (`lib/statistics.ts`). It is documented, and every function's docstring explicitly says which NumPy function it mirrors (e.g. `std()` mirrors `numpy.std(ddof=0)`), so the parallel is visible in the code itself, not just asserted in prose.

**Where does NumPy actually appear, then?** As a real, standalone, runnable Python project (`python/`) that is *not* part of the Vercel build. It:
- Loads the same shape of weather data (from `sample-data.json` or a CSV export).
- Performs the same analyses using actual `numpy` arrays, indexing, slicing, boolean masks, and aggregate functions.
- Prints/exports results that the "NumPy Analysis" page displays as static, pre-computed illustrative content (arrays, computed statistics, short code excerpts) — this is explicitly educational content about *how the analysis works conceptually*, not a live computation dependency.

This means: a student can `cd python && python main.py` and see real NumPy in action end-to-end, satisfying the course requirement, while the deployed product never depends on a Python runtime existing at all.

**Stretch option (do not do this unless Phase 1–9 are already complete and stable):** Vercel does support Python Serverless Functions (a file like `api/analysis.py` with `runtime = "python3.9"` in `vercel.json`, using the [Vercel Python Runtime](https://vercel.com/docs)). If the implementer wants to genuinely execute NumPy at request time for one endpoint, this is possible in principle. It is explicitly marked **optional/Phase-10-or-never** in `TODO.md` because it reintroduces exactly the complexity this document argues against, and the TypeScript module already produces identical numeric results. Verify current Vercel Python runtime support and constraints before attempting this — the underlying platform documentation for this changes over time.

## 3. Data flow for the core user journey

1. **User searches "Lahore"** → client calls `GET /api/locations/search?q=Lahore` → route calls Open-Meteo Geocoding API → returns a short list of `{name, country, latitude, longitude}` candidates → client shows them.
2. **User picks a result** → client calls `GET /api/weather/current?lat=..&lon=..` → route calls Open-Meteo Forecast API `current` block → route **upserts** a row into `locations` (if not already present) → returns current weather JSON → Dashboard renders it.
3. **User opens Weather Data / Analysis / Statistics pages** → client calls `GET /api/weather/history?lat=..&lon=..&start_date=..&end_date=..` → route checks Supabase for cached `weather_records` covering that location + date range → for any missing days, calls Open-Meteo Archive API, upserts the fetched rows into `weather_records`, and returns the combined series.
4. **Charts/Statistics/Analysis pages** → client calls `GET /api/analysis?lat=..&lon=..&start_date=..&end_date=..&metric=temperature` (or requests all metrics at once) → route pulls the array of values (reusing the same cache path as step 3) and runs `lib/statistics.ts` over it → returns `{mean, median, min, max, std, count}` per metric.
5. **Table / filtering / sorting / pagination** happen entirely client-side over the array already returned by `/api/weather/history` — no extra backend endpoint needed for table interactions.

## 4. Why Supabase is used narrowly, not as a full mirror

Caching is real value: it means a user revisiting Lahore's last-30-days doesn't re-hit Open-Meteo, and the app has *some* persistence beyond a single request. But storing every raw API response (including geocoding lookups, forecast metadata not used anywhere in the UI, etc.) adds schema surface with no product benefit. The rule applied throughout `DATABASE.md`: **a column exists only if a page in `UI.md` displays it or a computation in `API.md` consumes it.**

## 5. Rendering strategy

- Use the **App Router** (`app/`) with **Server Components** for static page shells (nav, layout, headings) and **Client Components** for anything interactive (search box, charts, table, theme toggle).
- API routes are standard **Route Handlers** (`app/api/.../route.ts`), running on the default Node.js serverless runtime (not Edge) — Edge runtime has a smaller allowed dependency surface and no benefit here since Open-Meteo calls are not latency-critical for this use case.
- No client-side state management library is needed. `useState`/`useEffect` (or a couple of small custom hooks like `useWeatherHistory(lat, lon, range)`) are sufficient given the app's size. Do not introduce Redux/Zustand/React Query unless the implementer judges the fetch/caching logic is genuinely getting unmanageable — for this scope, it won't.

## 6. Non-goals (explicitly out of scope)

- Authentication / user accounts.
- Multi-user "saved dashboards."
- Payments or subscriptions.
- Background jobs / cron-refreshed data (Vercel Cron could be added later for cache warming, but is not required for correctness — the cache-aside pattern in section 3 works without it).
- Real-time/websocket updates.
- Docker, AWS, Kubernetes, Redis.

## 7. Key architectural decisions at a glance

| Decision | Choice | Why |
|---|---|---|
| Statistics engine (production) | TypeScript, in `lib/statistics.ts` | Zero deploy risk, identical results to NumPy |
| Statistics engine (educational) | Python + NumPy, in `python/`, not deployed | Satisfies course requirement without touching Vercel build |
| Weather data source | Open-Meteo (Forecast + Archive + Geocoding APIs) | No API key, generous free usage, exactly the fields needed |
| Database | Supabase Postgres, 2 tables | Cache/history value only, minimal schema |
| Charting | Recharts | Lightweight, composes naturally with React, good free-tier fit (MIT license, no cost) |
| Auth | None | Not required by any stated feature |
| Deployment | Vercel, single Next.js project | One build pipeline, free Hobby tier is sufficient |
