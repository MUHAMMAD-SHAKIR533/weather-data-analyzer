# UI.md — Page-by-Page UI Specification

Design tokens referenced below are defined in `DESIGN.md`. All pages share the app shell described in §1.

## 1. App shell

**Header** (all viewports): app name "Weather Data Analyzer" with a simple weather-instrument-style mark (no external icon library required beyond `lucide-react`), primary nav, and a theme toggle icon button on the right.

**Navigation, desktop/tablet (≥768px):** fixed left sidebar, items: Dashboard, Weather Data, Analysis, Statistics, About Project. Active item: primary-colored text + left accent bar + `surface-container-low` background pill.

**Navigation, mobile (<768px):** header collapses to just logo + hamburger (opens a drawer with the same 5 items) **or**, matching the supplied reference mockup, a fixed **bottom tab bar** with 4 icons (Dashboard, Data, Analysis, Stats) — "About Project" lives inside the hamburger drawer only, since it's not a frequent-access page. Use the bottom-tab-bar pattern from the reference mockup; it's the better mobile pattern for a data app checked frequently.

**Global location context:** the currently-selected location (name + coordinates) persists across all pages via a small client-side context/hook (`useLocation()`), backed by the last successful search. Every page below operates on "whatever location is currently selected" plus, where relevant, a date range control.

## 2. Dashboard page (`/`)

**Purpose:** at-a-glance current conditions for the selected location.

**Layout:**
- Search bar at top: text input + "Search" button, placeholder "Search for a city…". As the user types (debounced ~300ms, min 2 chars), show a dropdown of up to 5 suggestions from `/api/locations/search` (name, admin1, country). Selecting one sets the global location and triggers `/api/weather/current`.
- Below search: a row/grid of **Data Summary Cards** (see `DESIGN.md`): Temperature, Condition, Humidity, Wind Speed, Rainfall. Each shows its current value; the Condition card shows an icon + label instead of a number.
- Location + "Last updated" line beneath the cards, `body-sm`, e.g. "Lahore, Pakistan · Updated 2 minutes ago."
- No location selected yet (first visit): show a friendly empty state ("Search for a city to see its current weather") instead of empty/zeroed cards.

**States:**
- Loading: skeleton cards (see §8).
- Error (upstream failure): a dismissible inline banner above the cards, "Couldn't load current weather. [Retry]" — cards keep their last-known values if any, rather than disappearing.

## 3. Weather Data page (`/data`)

**Purpose:** the historical record table plus a quick trend/condition overview, matching the reference mockup's density.

**Layout, top to bottom:**
1. Date range control (start/end date pickers, or preset buttons like 7 / 30 / 90 days — the reference mockup shows a "7 / 30" preset toggle on the Rainfall card; reuse that preset pattern here at the page level too).
2. A compact chart row: Humidity Trend (line/area) and a Weather Conditions donut, side by side on desktop, stacked on mobile — mirroring the reference mockup.
3. **Historical Data table**, full width, columns: Date, Temperature, Humidity, Rainfall, Wind Speed, Condition.
   - Search input (filters by date substring, e.g. "2026-05"), a Filter control (condition multi-select), Sort (click column header, toggles asc/desc, shown with a small arrow), pagination (10 rows/page, prev/next + page count text "Showing 1–10 of 124 records").
   - Condition column renders as a small colored dot + label using the fixed condition→color mapping from `DESIGN.md §8`.
   - All table interactions (search/sort/filter/pagination) are client-side over the array already fetched for the selected date range — no extra network calls.

**Empty state:** no records in range → table area shows "No weather records for this date range" with a suggestion to widen the range.

## 4. Analysis page (`/analysis`)

**Purpose:** the four analysis sections from the brief, one below another (desktop: 2-column card grid per section; mobile: stacked).

Each section = a headline-sm title, a row of small stat cards, then one chart.

- **Temperature Analysis** — stat cards: Average, Maximum, Minimum, Median, Std Dev. Charts: (a) Temperature trend (line, uses `temperature` daily mean), (b) Min vs Max (two-line or area-band chart using `temperature_min`/`temperature_max`), (c) Average temperature (bar chart, one bar per day, OR this can be folded into chart (a) as a reference line — implementer's call, but both metrics must be visible).
- **Humidity Analysis** — stat cards: Average, Maximum, Minimum. Chart: Humidity over time (area chart, matches the reference mockup style exactly).
- **Rainfall Analysis** — stat cards: Total, Average, Maximum. Chart: Rainfall by date (bar chart, matches reference mockup).
- **Wind Analysis** — stat cards: Average, Maximum, Minimum. Chart: Wind speed trend (line chart).

All four sections read from a single `/api/analysis` call (all metrics) plus the record array from `/api/weather/history` for the raw per-day chart data — do not make 4 separate analysis calls.

## 5. Statistics page (`/statistics`)

**Purpose:** a dedicated, plain-language stats reference for the currently selected location + date range, one card group per metric (Temperature, Humidity, Rainfall, Wind Speed).

**Layout:** for each metric, a card containing:
- The stat name as `label-caps` + its `data-value` number, for each of: Mean, Median, Min, Max, Range (`max - min`, computed client-side), Std Dev. (Mode is shown only where genuinely meaningful — see `PYTHON_NUMPY.md §Statistics glossary`; for continuous metrics like temperature, note in small text that mode is "not typically meaningful for continuous data" rather than fabricating a number.)
- A one-line plain-language explanation under each stat, using the exact tone from the brief, e.g.:
  - Mean: "The average value across the selected dataset."
  - Median: "The middle value when all readings are sorted — less affected by outliers than the mean."
  - Standard Deviation: "How much the values typically vary from the average."
  - Range: "The gap between the highest and lowest reading in this period."

## 6. NumPy Analysis page (`/numpy-analysis`)

**Purpose:** the educational centerpiece connecting the live dashboard to real NumPy code (see `PYTHON_NUMPY.md`).

**Layout:**
1. Intro paragraph: what this page shows and why (the production site uses TypeScript for speed/reliability; this page shows the equivalent real NumPy operations on the same kind of data).
2. For each metric (start with Temperature), show:
   - A monospace block showing a sample array, e.g. `Temperature Array\n[24.5, 26.2, 27.8, 25.1, 29.4, ...]` (from `sample-data.json`, truncated to ~10 values with a "…" and a note "(showing 10 of N)").
   - A small grid of result cards: Mean, Median, Minimum, Maximum, Standard Deviation — the actual computed values, precomputed by the Python script and checked into `python/output/*.json`, then imported as static content (NOT recomputed client-side — this page is illustrative of the Python pipeline's output, not a live calculator).
   - A short "How NumPy does this" code excerpt (`code-sm`, syntax-highlighted or plain monospace), e.g. `np.mean(temperatures)`.
3. Closing note linking to the About Project page for the broader Python-fundamentals explanation.

## 7. About Project page (`/about`)

**Purpose:** the Python-fundamentals walkthrough from the brief, kept separate from the main app flow so the main UI "focuses on the actual application" per the brief's instruction.

**Layout:** short project description, then a grid of small cards — one per concept (Lists, Dictionaries, Tuples, Sets, Loops, Functions, Conditional Statements) — each with a 1-sentence explanation of how it's used in this project's Python component, plus a 2–4 line code snippet. Content source: `PYTHON_NUMPY.md §Python fundamentals mapping`. This matches the "Data Engine: Python Fundamentals" card style shown at the bottom of the reference mockup, expanded into a full page.

## 8. Loading states

Use skeleton loaders (pulsing `surface-container` blocks matching the shape of the real content) for:
- Location search dropdown → 3 skeleton rows while awaiting results.
- Dashboard cards → skeleton card shapes on initial load and on location change.
- Charts → a skeleton rectangle matching the chart's aspect ratio.
- Statistics cards → skeleton value blocks.
- Table → 5 skeleton rows.

Never show a blank white page during any fetch — always at least a skeleton or the previous data with a subtle loading indicator (e.g. a thin top progress bar) on refetch.

## 9. Error handling (UI-level; see `API.md` for server-side error shapes)

| Situation | UI behavior |
|---|---|
| Invalid/empty location search | Inline helper text under the input: "Enter at least 2 characters." |
| No search results | Dropdown shows "No locations found for '{query}'." |
| Weather API failure | Inline banner with Retry button; never a raw error string or stack trace. |
| Database failure (cache write) | Silent — the user still sees fresh data; no error shown (per `API.md §3`). |
| Invalid date range | Inline validation message under the date picker before submission is even attempted. |
| Empty dataset (valid range, no data) | Friendly empty-state illustration/text, not an error banner. |
| Network offline | Global toast: "You're offline. Some data may be out of date." |

## 10. Responsive behavior summary

| Element | Desktop | Tablet | Mobile |
|---|---|---|---|
| Nav | Fixed 260px sidebar | 72px icon rail | Bottom tab bar (4 items) + drawer for About |
| Stat cards | 4–5 per row | 2–3 per row | 1–2 per row |
| Charts | Full card width, ~320px tall | Full card width, ~280px tall | Full width, ~220px tall, simplified tick density |
| Table | All 6 columns visible | All 6 columns, horizontal scroll if needed | Card-per-row layout OR horizontal scroll (implementer's choice; horizontal scroll is simpler and acceptable) |
| Search + date controls | Inline row | Inline row, wraps if needed | Stacked vertically |

## 11. Accessibility

- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>` (if used).
- All nav items and icon-only buttons have accessible names (`aria-label` where there's no visible text).
- Form inputs (search, date pickers, filters) have associated `<label>` elements (visually hidden where the design calls for placeholder-only appearance, using `sr-only`, never `label`-less placeholder-only inputs).
- Color contrast: body text and `on-surface-variant` combinations from `DESIGN.md` meet WCAG AA against their backgrounds in both themes; do not introduce new low-contrast color pairs.
- Charts: each chart card has a visually-hidden text summary (e.g. "Temperature trend from May 1 to May 7, ranging from 17.2°C to 26.2°C") for screen readers, since Recharts SVG output is not inherently accessible.
- All interactive elements reachable and operable via keyboard (Tab/Enter/Space); focus states use a visible 2px primary-colored ring (per `DESIGN.md §8`), never `outline: none` without a replacement.
- Table sort controls are real `<button>`s inside `<th>`, not clickable `<div>`s.
