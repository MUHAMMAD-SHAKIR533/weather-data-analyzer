# DEPLOYMENT.md — Vercel Deployment & Environment

## 1. What gets deployed

Only the Next.js app (repository root, or a subfolder if the implementer nests it — recommend repository root for simplicity). `python/` is **not** included in the Vercel build; it can stay in the repo for transparency/grading purposes but has no build step association. If desired, add it to `.vercelignore` to keep it fully out of the deployment bundle (not required, but tidy).

## 2. Build requirements

- Node.js: use the version Vercel's current Next.js runtime defaults to (Vercel auto-selects a compatible LTS Node version for the detected Next.js version — do not manually pin an old Node version in `package.json` `engines` unless a specific dependency requires it).
- Framework preset: **Next.js** (auto-detected by Vercel from `next.config.js`/`package.json`).
- Build command: default (`next build`). Output: default (`.next`).
- No custom `vercel.json` is required for the core app. (Only add one if implementing the optional Phase-10 Python-serverless-function stretch goal from `ARCHITECTURE.md §2` — not expected for this project.)

## 3. Environment variables

### Required

| Variable | Where used | Notes |
|---|---|---|
| `SUPABASE_URL` | Server-side (`lib/supabase.ts`) | Your Supabase project's REST URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only | **Never** prefix with `NEXT_PUBLIC_` — this key must never reach the browser bundle |

### Optional

| Variable | Where used | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Client, header | Defaults to "Weather Data Analyzer" in code if unset — only add if you want it configurable without a redeploy |

### Explicitly not needed

- No Open-Meteo API key (the endpoints used in `API.md` are key-free for this project's usage level).
- No auth provider secrets (no auth in scope).
- No third-party chart-service keys (Recharts is a client-side library, not a hosted service).

## 4. Configuring in Vercel

1. Create the Supabase project first (free tier), run the SQL in `DATABASE.md §3` in the Supabase SQL editor.
2. Copy the project's URL and **service role key** (Project Settings → API) into Vercel: Project → Settings → Environment Variables → add both, scoped to Production (and Preview if you want preview deployments to hit the same database — acceptable for a project this size; a separate preview database is unnecessary complexity here).
3. Redeploy after adding env vars (Vercel does not hot-reload existing deployments when env vars change).

## 5. Production considerations

- **Serverless function timeout:** Vercel's Hobby plan default function timeout is generous enough for the Open-Meteo calls used here (each call is a simple JSON fetch, typically well under a second). No special timeout configuration is expected to be necessary; if it ever is, that's a signal something upstream is misbehaving, not a reason to raise the timeout preemptively.
- **Cold starts:** acceptable for this project's traffic profile (a small dashboard, not a high-traffic production service). No warming strategy needed.
- **Node runtime, not Edge:** API routes use the default Node.js serverless runtime. Do not switch to Edge runtime — it has a restricted set of allowed Node APIs and no benefit for this workload.
- **Database connections:** the Supabase JS client over its REST/PostgREST interface (not a raw Postgres connection pool) is used from serverless functions — this avoids the classic "serverless exhausts a small connection pool" problem entirely, because each request is a stateless HTTPS call, not a persistent DB connection. Do not use a raw `pg`/connection-pooling client unless there's a specific reason to.

## 6. Free-tier fit check

| Service | Free tier | Fit for this project |
|---|---|---|
| Vercel Hobby | Unlimited personal projects, generous serverless invocation limits | Comfortably sufficient — low traffic, small functions |
| Supabase Free | 500MB database, generous API request allowance | Two tiny tables, low write volume — comfortably sufficient |
| Open-Meteo | No key, documented free non-commercial usage limits (~10,000 req/day/IP) | Comfortably sufficient given the Supabase cache reduces repeat calls |

If the project ever needs to scale beyond a student demo (real users, high traffic), revisit these limits — but that is explicitly out of scope for this brief.

## 7. Local development

```bash
npm install
cp .env.example .env.local   # fill in SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Before Supabase is wired up (Phase 1–4 per `TODO.md`), the app should run entirely against `docs/sample-data.json` with no environment variables required at all — this lets UI/chart work proceed independently of external service setup.

## 8. Deployment checklist (final)

- [ ] `npm run build` succeeds locally with no TypeScript errors.
- [ ] All required env vars set in Vercel (Production).
- [ ] Supabase tables created via the SQL in `DATABASE.md`.
- [ ] A manual smoke test after deploy: search a city → dashboard loads → Weather Data table loads → Analysis charts render → Statistics page renders → NumPy Analysis page renders static content → About Project page renders.
- [ ] No secrets committed to the repo (`.env.local` gitignored, only `.env.example` checked in).
