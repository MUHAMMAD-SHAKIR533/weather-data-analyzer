# Weather Data Analyzer — Design & Technical Specification

This `docs/` folder is the **complete blueprint** for the Weather Data Analyzer project. It is written for a coding agent (Codex) to implement without needing to make architectural decisions. Nothing in here should be treated as optional interpretation — where a choice had to be made, it has already been made and justified.

## What this project is

A web-based weather analysis dashboard where a user searches a location, pulls real weather data (current + historical) from Open-Meteo, and explores it through statistics and charts. It doubles as an applied demonstration of **Python fundamentals** and **NumPy** — but the production site itself is a plain Next.js + TypeScript application, for reasons explained in `ARCHITECTURE.md` and `PYTHON_NUMPY.md`.

## What this project is NOT

- Not a portfolio site.
- Not an auth-gated multi-tenant SaaS product.
- Not a microservices system.
- Not dependent on paid infrastructure, Docker, AWS, or Kubernetes.

## Document map

| File | Contents |
|---|---|
| `README.md` | This file — index and quick orientation. |
| `DESIGN.md` | Visual design system: colors, type, spacing, components ("Atmospheric Intelligence" design language). |
| `ARCHITECTURE.md` | System architecture, data flow, and the Python-on-Vercel decision. |
| `DATABASE.md` | Supabase PostgreSQL schema — tables, columns, indexes, and what was deliberately left out. |
| `API.md` | Every Next.js API route: method, params, request/response shape, errors. |
| `UI.md` | Page-by-page UI spec: layout, states, responsive behavior, accessibility. |
| `PYTHON_NUMPY.md` | The standalone Python/NumPy educational component, its structure, and how it maps to the TypeScript production code. |
| `DEPLOYMENT.md` | Vercel deployment steps, environment variables, free-tier limits. |
| `CODEX_INSTRUCTIONS.md` | The direct, prescriptive handoff brief for the implementing agent. |
| `TODO.md` | Phased build plan (Phase 1–9) with per-phase deliverables. |
| `sample-data.json` | ~25 realistic sample weather records for building UI before the API/DB are wired up. |

## How to use this with Codex

Give Codex `CODEX_INSTRUCTIONS.md` first — it references the other files by name and tells Codex when to consult each one. Build in the order defined in `TODO.md`. Do not let Codex skip ahead to Supabase or Python before Phases 1–4 (UI + API + charts on sample data) are working — the app must be demoable on static sample data alone before any external dependency is wired in.

## One-paragraph architecture summary

Next.js (App Router, TypeScript, Tailwind) is deployed to Vercel as a single app. Its API routes call the Open-Meteo REST API (no key required) for geocoding, current weather, and historical weather, and use a small hand-written TypeScript statistics module (mean/median/std/min/max — a NumPy-equivalent) to compute analysis. Supabase Postgres is used narrowly, as a cache/history log of locations and daily weather records a user has actually looked up — not as a mirror of every API call. A separate, non-deployed `python/` project re-implements the same statistics using real NumPy on the sample dataset, satisfying the course's Python/NumPy learning objective without adding a second runtime to the Vercel deployment.
