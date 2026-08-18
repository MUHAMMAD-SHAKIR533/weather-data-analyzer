# API.md — Application API & Open-Meteo Integration

All endpoints live under `app/api/` as Next.js Route Handlers, Node runtime, JSON in/out. None require an API key from the client. None require authentication.

## 0. Conventions

- All error responses use this shape:
  ```json
  { "error": { "message": "Human-readable message", "code": "SHORT_CODE" } }
  ```
- Dates are `YYYY-MM-DD` strings (ISO 8601 date, no time component) everywhere in query params and responses.
- Temperatures: °C. Wind speed: km/h. Rainfall: mm. Humidity: %.
- Every route validates its inputs before calling Open-Meteo or Supabase and returns `400` with `code: "INVALID_INPUT"` on failure — never lets a malformed request reach an upstream call.

---

## 1. `GET /api/locations/search`

**Purpose:** autocomplete/search a place name into coordinates, via Open-Meteo Geocoding.

**Query params:**
| Param | Type | Required | Notes |
|---|---|---|---|
| `q` | string | yes | 1–100 chars, trimmed. Reject empty/whitespace-only. |
| `count` | number | no | default 5, max 10 |

**Upstream call:** `GET https://geocoding-api.open-meteo.com/v1/search?name={q}&count={count}&language=en&format=json`

**Response `200`:**
```json
{
  "results": [
    {
      "name": "Lahore",
      "country": "Pakistan",
      "admin1": "Punjab",
      "latitude": 31.55,
      "longitude": 74.34
    }
  ]
}
```

**Response `200` (no matches):** `{ "results": [] }` — not an error; the client shows a "no locations found" empty state.

**Errors:**
- `400 INVALID_INPUT` — missing/empty `q`.
- `502 UPSTREAM_ERROR` — Open-Meteo unreachable or non-2xx. Message: "Location search is temporarily unavailable. Please try again."

---

## 2. `GET /api/weather/current`

**Purpose:** current conditions for a specific coordinate pair, for the Dashboard.

**Query params:**
| Param | Type | Required | Notes |
|---|---|---|---|
| `lat` | number | yes | -90..90 |
| `lon` | number | yes | -180..180 |
| `name` | string | no | display name, passed through from the search result so it can be upserted into `locations` |
| `country` | string | no | " |
| `admin1` | string | no | " |

**Upstream call:**
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code
  &timezone=auto
```

**Side effect:** upsert into `locations` (see `DATABASE.md §5`) if `name` was provided. This is the *only* write on this route — no `weather_records` write here (current weather is a live snapshot, not a historical record).

**Response `200`:**
```json
{
  "location": { "name": "Lahore", "country": "Pakistan", "latitude": 31.55, "longitude": 74.34 },
  "current": {
    "temperature": 34.2,
    "humidity": 41,
    "rainfall": 0,
    "wind_speed": 12.4,
    "weather_code": 1,
    "condition": "Mainly Clear",
    "observed_at": "2026-08-18T14:00:00+05:00"
  }
}
```

**Errors:**
- `400 INVALID_INPUT` — missing/out-of-range `lat`/`lon`.
- `502 UPSTREAM_ERROR` — Open-Meteo failure. Message: "Couldn't load current weather. Please try again in a moment."

---

## 3. `GET /api/weather/history`

**Purpose:** the daily time series behind Weather Data table, all Analysis charts, and Statistics — implements the cache-aside pattern against Supabase.

**Query params:**
| Param | Type | Required | Notes |
|---|---|---|---|
| `lat` | number | yes | |
| `lon` | number | yes | |
| `start_date` | string | yes | `YYYY-MM-DD` |
| `end_date` | string | yes | `YYYY-MM-DD`, must be ≥ `start_date`, range ≤ 366 days |
| `name`/`country`/`admin1` | string | no | for upserting `locations` on cache miss |

**Logic:**
1. Find or create the `locations` row for `(lat, lon)`.
2. Query `weather_records` for that `location_id` between `start_date` and `end_date`.
3. Determine which dates in the requested range are **missing**.
4. If any are missing, call Open-Meteo Archive API for the full requested range (simplest correct approach — a single ranged call, not per-missing-day calls) and upsert all returned rows.
5. Re-query `weather_records` for the full range and return it, sorted ascending by `recorded_at`.

**Upstream call (Archive API):**
```
GET https://archive-api.open-meteo.com/v1/archive
  ?latitude={lat}&longitude={lon}
  &start_date={start_date}&end_date={end_date}
  &daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum,wind_speed_10m_max,weather_code
  &timezone=auto
```

Note: Open-Meteo's free Archive API has a short reporting lag (typically the last ~5 days may not yet be available). If `end_date` is very recent, gracefully return whatever days *are* available rather than erroring — annotate the response with `"partial": true` when this happens.

**Response `200`:**
```json
{
  "location": { "name": "Lahore", "country": "Pakistan", "latitude": 31.55, "longitude": 74.34 },
  "range": { "start_date": "2026-05-01", "end_date": "2026-05-07" },
  "partial": false,
  "records": [
    {
      "date": "2026-05-01",
      "temperature": 22.4,
      "temperature_max": 27.1,
      "temperature_min": 18.0,
      "humidity": 65,
      "rainfall": 0.4,
      "wind_speed": 14.2,
      "weather_code": 1,
      "condition": "Mainly Clear"
    }
  ]
}
```

**Errors:**
- `400 INVALID_INPUT` — bad/missing params, `end_date < start_date`, or range > 366 days ("Please choose a date range of one year or less.").
- `502 UPSTREAM_ERROR` — Open-Meteo failure on a cache miss with no cached data to fall back to.
- `200` with `"records": []` — valid request, genuinely no data (e.g. a date range entirely in the future) — treated as an empty state in the UI, not an error.
- Supabase failure on the write path (upsert) should **not** fail the request — log it, and still return the freshly-fetched Open-Meteo data to the user. Caching is a nice-to-have; showing the user's requested data is the actual requirement. Supabase failure on the *read* path should fall back to fetching fresh from Open-Meteo for the whole range.

---

## 4. `GET /api/analysis`

**Purpose:** statistical summary for one or more metrics over a date range, powering the Analysis and Statistics pages. Internally reuses the exact same cache-aside logic as `/api/weather/history` (extract it into a shared `lib/getWeatherHistory.ts` function used by both routes — do not duplicate the fetch/cache logic).

**Query params:**
| Param | Type | Required | Notes |
|---|---|---|---|
| `lat` | number | yes | |
| `lon` | number | yes | |
| `start_date` | string | yes | |
| `end_date` | string | yes | |
| `metrics` | string | no | comma-separated subset of `temperature,humidity,rainfall,wind_speed`; default = all four |

**Response `200`:**
```json
{
  "range": { "start_date": "2026-05-01", "end_date": "2026-05-07" },
  "count": 7,
  "statistics": {
    "temperature": { "mean": 21.4, "median": 21.0, "min": 17.2, "max": 26.2, "std": 3.1 },
    "humidity":    { "mean": 74.6, "median": 76.0, "min": 60.0, "max": 92.0, "std": 10.8 },
    "rainfall":    { "total": 43.4, "mean": 6.2, "max": 27.8 },
    "wind_speed":  { "mean": 13.9, "median": 13.8, "min": 8.0, "max": 21.0, "std": 3.9 }
  },
  "conditions": { "Sunny": 3, "Cloudy": 2, "Rain": 1, "Fog": 1 }
}
```

Note the intentional asymmetry: rainfall reports `total`/`mean`/`max` (not median/std) because "total rainfall" is the meaningful headline number per the brief's Rainfall Analysis section; temperature/humidity/wind report the full mean/median/min/max/std set per their sections. `conditions` is a frequency count of `weather_code`-derived condition labels across the range, feeding the donut chart directly.

**Errors:** same as `/api/weather/history`, plus:
- `400 INVALID_INPUT` — unknown value in `metrics`.
- `200` with all-null statistics and `"count": 0` when the range has no data — the Statistics page shows an empty state, not an error banner.

---

## 5. `POST /api/locations` *(optional — Phase 6 stretch, see `TODO.md`)*

**Purpose:** explicitly "save" a location as a favorite for quick access. **Not required** by any core Dashboard/Analysis/Statistics feature — only build this if implementing the optional favorites list.

**Request body:**
```json
{ "name": "Lahore", "country": "Pakistan", "admin1": "Punjab", "latitude": 31.55, "longitude": 74.34 }
```

**Response `201`:** the upserted `locations` row.

**Errors:** `400 INVALID_INPUT` for missing/out-of-range fields.

---

## 6. Open-Meteo integration reference

**Base URLs (no API key required for the free tier used here):**
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast/current: `https://api.open-meteo.com/v1/forecast`
- Historical/archive: `https://archive-api.open-meteo.com/v1/archive`

**Units:** always pass/expect metric defaults (°C, km/h, mm) — do not request imperial units; the UI is metric-only for this scope.

**Weather code → condition label/icon mapping** (WMO codes, the subset Open-Meteo actually returns — implement as a single lookup table in `lib/weatherCodes.ts`):

| Code(s) | Label | Bucket used in donut chart |
|---|---|---|
| 0 | Clear sky | Sunny |
| 1 | Mainly clear | Sunny |
| 2 | Partly cloudy | Partly Cloudy |
| 3 | Overcast | Cloudy |
| 45, 48 | Fog / depositing rime fog | Fog |
| 51, 53, 55 | Drizzle (light/moderate/dense) | Rain |
| 56, 57 | Freezing drizzle | Rain |
| 61, 63, 65 | Rain (slight/moderate/heavy) | Rain |
| 66, 67 | Freezing rain | Rain |
| 71, 73, 75, 77 | Snow | Other |
| 80, 81, 82 | Rain showers | Rain |
| 85, 86 | Snow showers | Other |
| 95 | Thunderstorm | Storm |
| 96, 99 | Thunderstorm with hail | Storm |

**Rate limits:** Open-Meteo's free, non-commercial tier is documented as roughly 10,000 requests/day per IP, which is generous for this project's traffic. Still: the Supabase cache in `/api/weather/history` and `/api/analysis` exists specifically to reduce repeat calls — don't bypass it. If Open-Meteo ever returns a `429`, surface it as `502 UPSTREAM_ERROR` with a message asking the user to retry shortly; do not build custom retry/backoff logic for this project's scope, a single retry-once is sufficient.

**Error handling for upstream calls (all routes):**
- Wrap every `fetch()` to Open-Meteo in a try/catch with a **5-second timeout** (`AbortController`).
- Non-2xx or timeout → throw a typed `UpstreamError`, caught at the route handler level and turned into the `502 UPSTREAM_ERROR` shape from §0.
- Never forward Open-Meteo's raw error body or a stack trace to the client.

## 7. Validation requirements summary

| Field | Rule |
|---|---|
| `lat` | number, -90 to 90 |
| `lon` | number, -180 to 180 |
| `q` (search) | non-empty after trim, ≤ 100 chars |
| `start_date`/`end_date` | valid `YYYY-MM-DD`, `end_date ≥ start_date`, range ≤ 366 days, not more than ~1 day in the future |
| `metrics` | subset of the four known metric keys |
