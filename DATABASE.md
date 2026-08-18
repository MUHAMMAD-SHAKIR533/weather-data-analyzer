# DATABASE.md — Supabase PostgreSQL Schema

## 1. Guiding rule

Two tables. A column or table is added only if a page in `UI.md` displays it or a computation in `API.md` consumes it. This is a **cache/history log**, not a data warehouse — do not store every raw Open-Meteo response.

## 2. Why only two tables

- `locations` — every place a user has looked up, so repeat lookups don't need to re-geocode, and so `weather_records` has something to reference.
- `weather_records` — daily weather observations for a location, populated lazily (cache-aside) when a user actually requests history/analysis for a date range not already cached.

**No `analysis_records` table.** Statistics (mean/median/min/max/std) are cheap to compute from `weather_records` on every request — persisting them would just be a cache of a cache, adding write complexity and staleness risk for a computation that takes microseconds. If profiling later shows this is genuinely a bottleneck, revisit; it will not be a bottleneck at this project's scale.

**No `users` / `favorites` / `sessions` table.** No authentication is in scope (see `ARCHITECTURE.md §6`).

## 3. Schema

```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- locations
-- One row per distinct place a user has looked up.
-- ─────────────────────────────────────────────
create table locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,               -- e.g. "Lahore"
  country     text,                        -- e.g. "Pakistan"
  admin1      text,                        -- e.g. "Punjab" (state/region, from Open-Meteo geocoding)
  latitude    numeric(8,5) not null,
  longitude   numeric(8,5) not null,
  created_at  timestamptz not null default now(),

  constraint locations_lat_range check (latitude between -90 and 90),
  constraint locations_lon_range check (longitude between -180 and 180)
);

-- Prevent duplicate rows for the same coordinates (rounded to ~1m precision)
create unique index locations_lat_lon_uidx on locations (latitude, longitude);

-- Fast lookup for the search-autocomplete-into-cache path
create index locations_name_idx on locations using btree (lower(name));


-- ─────────────────────────────────────────────
-- weather_records
-- One row per (location, day). Populated lazily from Open-Meteo.
-- ─────────────────────────────────────────────
create table weather_records (
  id              bigserial primary key,
  location_id     uuid not null references locations(id) on delete cascade,
  recorded_at     date not null,              -- the calendar day this record represents
  temperature     numeric(5,2),               -- °C, mean/observed daily temperature
  temperature_max numeric(5,2),                -- °C
  temperature_min numeric(5,2),                -- °C
  humidity        numeric(5,2),               -- % relative humidity (daily mean)
  rainfall        numeric(6,2),                -- mm, daily precipitation sum
  wind_speed      numeric(5,2),                -- km/h, daily max wind speed
  weather_code    smallint,                    -- Open-Meteo WMO weather code (see API.md)
  created_at      timestamptz not null default now(),

  constraint weather_records_unique_day unique (location_id, recorded_at)
);

create index weather_records_location_date_idx
  on weather_records (location_id, recorded_at);
```

## 4. Column notes

- `weather_code` is stored as the raw **WMO code** integer returned by Open-Meteo, not a pre-translated string. The condition label ("Rain", "Fog", etc.) and its color/icon are derived at the API/UI layer from a fixed lookup table (see `API.md §Open-Meteo Integration` for the code table) — this keeps the database decoupled from display concerns and avoids a migration if the label wording changes.
- `temperature` (daily mean) is kept in addition to `temperature_max`/`temperature_min` because the Temperature Analysis screen needs an "average temperature" series independent of computing `(max+min)/2` on the client — Open-Meteo's archive API provides the daily mean directly.
- All numeric columns are nullable at the column level (a given day might be missing one field from the upstream API) but the API layer should still validate that a record isn't *entirely* null before inserting it.

## 5. Upsert pattern (used by API routes)

```sql
-- Locations: insert if not already present at these coordinates
insert into locations (name, country, admin1, latitude, longitude)
values ($1, $2, $3, $4, $5)
on conflict (latitude, longitude) do update set name = excluded.name
returning id;

-- Weather records: insert or refresh a day's data
insert into weather_records
  (location_id, recorded_at, temperature, temperature_max, temperature_min,
   humidity, rainfall, wind_speed, weather_code)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
on conflict (location_id, recorded_at) do update set
  temperature = excluded.temperature,
  temperature_max = excluded.temperature_max,
  temperature_min = excluded.temperature_min,
  humidity = excluded.humidity,
  rainfall = excluded.rainfall,
  wind_speed = excluded.wind_speed,
  weather_code = excluded.weather_code;
```

## 6. Access pattern

- All Supabase access happens **server-side only**, inside Next.js API routes, using the Supabase **service role key** (never exposed to the client). There is no client-side Supabase SDK usage and no Row Level Security policy is required *because the client never talks to Supabase directly* — but RLS should still be left in its default (enabled, deny-all) state on both tables since no anonymous/public access path is intended. If a future feature needs client-side reads, add explicit RLS policies at that time rather than opening the tables now.
- Free tier fit: Supabase's free project tier easily accommodates this — two small tables, tiny row sizes, no heavy write volume (writes only happen on cache misses).

## 7. What was deliberately left out

| Considered | Decision | Reason |
|---|---|---|
| `analysis_records` table | Omitted | Computed on the fly from `weather_records`; persisting is redundant |
| `users` / auth tables | Omitted | No auth in scope |
| `favorites` table | Omitted (optional stretch — see `TODO.md` Phase 6) | Not required by any core page |
| Storing raw current-weather API responses | Omitted | Current weather is transient/live; only historical daily records have caching value |
| JSONB "raw payload" column | Omitted | Adds no queryable value; typed columns are sufficient and match exactly what the UI needs |
