# PYTHON_NUMPY.md — Educational Python + NumPy Component

Read `ARCHITECTURE.md §2` first for *why* this component exists separately from the deployed app. This file specifies *what* to build in `python/`.

## 1. Purpose

`python/` is a small, real, runnable Python project that performs the same statistical analysis as the production TypeScript app, using actual `numpy` arrays and idiomatic Python. It is:
- **Not deployed.** It never runs on Vercel, is never called by an API route, and has no runtime dependency relationship with the Next.js app.
- **Run once (or on demand) locally**, and its output (`python/output/*.json`) is checked into the repo and imported as static content by the `/numpy-analysis` page (see `UI.md §6`).
- The single source of truth for the **About Project** page's Python-fundamentals code snippets.

## 2. Python project structure

```
python/
├── data/
│   └── sample_weather.py       # loads docs/sample-data.json into Python lists/dicts
├── analysis/
│   ├── __init__.py
│   ├── numpy_stats.py          # NumPy-based statistics functions (the "real analysis")
│   └── conditions.py           # frequency counting of weather conditions (Python fundamentals: sets, dicts, loops)
├── utils/
│   ├── __init__.py
│   └── formatting.py           # small helpers to round/format numbers for output JSON
├── output/
│   ├── temperature_stats.json  # generated — checked in for the /numpy-analysis page
│   ├── humidity_stats.json     # generated
│   ├── rainfall_stats.json     # generated
│   └── wind_stats.json         # generated
├── main.py                     # entry point: loads data, runs analysis, writes output/
└── requirements.txt            # numpy only
```

### What each file does

- **`data/sample_weather.py`** — reads `../docs/sample-data.json` (or a local copy), returns a `list[dict]` of records. This is where **lists** and **dictionaries** (Python fundamentals) are first exercised: each record is a dict; the full dataset is a list of dicts.
- **`analysis/numpy_stats.py`** — converts a chosen field (e.g. all `temperature` values) into a `numpy.ndarray` and exposes one function per statistic:
  ```python
  import numpy as np

  def compute_stats(values: list[float]) -> dict:
      """Mirrors lib/statistics.ts on the production TS app."""
      arr = np.array(values, dtype=float)
      return {
          "mean": float(np.mean(arr)),
          "median": float(np.median(arr)),
          "minimum": float(np.min(arr)),
          "maximum": float(np.max(arr)),
          "std_dev": float(np.std(arr)),   # population std, ddof=0 — matches lib/statistics.ts
      }
  ```
  Also demonstrate **indexing, slicing, and boolean indexing** explicitly (this is a stated learning goal, not incidental):
  ```python
  # Indexing / slicing
  first_week = arr[0:7]

  # Boolean indexing: days above the mean
  above_average = arr[arr > np.mean(arr)]

  # Boolean indexing: rainy-day temperatures only, using a mask built from another array
  is_rainy = np.array([r["weather_condition"] == "Rain" for r in records])
  rainy_day_temps = arr[is_rainy]
  ```
- **`analysis/conditions.py`** — pure Python (no NumPy needed here on purpose, to keep the NumPy vs. plain-Python distinction visible): uses a **set** to find unique conditions present, a **dictionary** to count frequency, a **for loop** to iterate records, and a **function** to encapsulate the operation:
  ```python
  def condition_frequencies(records: list[dict]) -> dict:
      unique_conditions = {r["weather_condition"] for r in records}   # set
      counts = {c: 0 for c in unique_conditions}                       # dict
      for r in records:                                                # loop
          counts[r["weather_condition"] += 1
      return counts
  ```
  *(Note: the snippet above is illustrative for docs purposes — the real file should read `counts[r["weather_condition"]] += 1` with correctly matched brackets.)*
- **`utils/formatting.py`** — small rounding/serialization helpers (e.g. round to 2 decimal places before writing JSON) — nothing NumPy-specific.
- **`main.py`** — orchestrates: load data → for each of `temperature`, `humidity`, `rainfall`, `wind_speed`, compute stats + a sample array excerpt → write each to `output/{metric}_stats.json` → print a human-readable summary to the console.
- **`requirements.txt`** — just `numpy`. Nothing else is needed; do not add pandas/scipy — the brief's stated NumPy learning goal doesn't need them and they'd be one more thing to explain.

## 3. Output JSON shape (consumed by the `/numpy-analysis` page)

```json
{
  "metric": "temperature",
  "unit": "°C",
  "sample_array": [28.4, 29.1, 30.6, 27.9, 25.2, 22.8, 21.4, 24.3, 26.1, 27.5],
  "sample_array_note": "showing 10 of 26 values",
  "statistics": { "mean": 24.67, "median": 24.55, "minimum": 17.2, "maximum": 30.6, "std_dev": 3.42 },
  "numpy_snippet": "np.mean(arr), np.median(arr), np.min(arr), np.max(arr), np.std(arr)"
}
```

The frontend imports these four JSON files directly (e.g. `import temperatureStats from '@/python-output/temperature_stats.json'` after copying `python/output/*.json` into the Next.js project, or fetching them as static assets from `public/`) — no server-side Python execution is ever triggered.

## 4. Python fundamentals mapping (source for the About Project page)

| Concept | Where it's used in `python/` | One-line explanation for the UI |
|---|---|---|
| **Variables & data types** | Every module — `float`, `int`, `str`, `bool` values for temperature, counts, condition names, flags | Used to hold each individual weather reading and label. |
| **Strings** | Condition labels (`"Rain"`, `"Sunny"`), date strings | Used to represent weather conditions and dates. |
| **Lists** | `data/sample_weather.py` — the full dataset as `list[dict]`; `numpy_stats.py` — raw value lists before conversion to arrays | Used to store the collection of daily weather observations. |
| **Tuples** | A `(latitude, longitude)` pair for the sample location | Used for fixed, order-meaningful values like coordinates. |
| **Sets** | `conditions.py` — `{r["weather_condition"] for r in records}` | Used to find the unique weather conditions present in the dataset. |
| **Dictionaries** | Every record itself, plus the `counts` frequency map | Used to represent one structured weather record, and to tally conditions. |
| **Conditional statements** | Classifying a day (e.g. `if rainfall > 10: "Heavy rain"` style logic in `conditions.py` or a small classifier helper) | Used to classify or label days based on their values. |
| **Loops** | `for r in records` throughout `conditions.py` and data loading | Used to process every record in the dataset. |
| **Functions** | `compute_stats()`, `condition_frequencies()`, `format_value()` | Used to separate each analysis operation into a reusable, testable unit. |
| **Arrays (NumPy)** | `numpy_stats.py` | Used to run fast, vectorized statistical operations instead of manual loops. |

This table is the content source for the About Project page's per-concept cards (`UI.md §7`) — keep the explanations this short and concrete; do not expand them into paragraphs in the UI.

## 5. Statistics glossary (source for the Statistics page)

| Term | Plain-language explanation |
|---|---|
| Mean | The average value across the selected dataset. |
| Median | The middle value when all readings are sorted — less affected by outliers than the mean. |
| Mode | The most frequently occurring value. Only shown where meaningful — e.g. for weather condition frequency, not usually for continuous metrics like temperature. |
| Minimum | The lowest recorded value in the selected period. |
| Maximum | The highest recorded value in the selected period. |
| Range | The gap between the highest and lowest reading (`max − min`). |
| Standard Deviation | How much the values typically vary from the average. A small number means the weather was consistent; a large number means it varied a lot. |

## 6. Running it locally

```bash
cd python
pip install -r requirements.txt
python main.py
# writes output/*.json and prints a summary table to the console
```

No environment variables, no network access, no database — deliberately fully offline and self-contained, since its only job is to produce the static output the `/numpy-analysis` page displays.

## 7. Explicit non-goal

Do not wire `python/` into `next build`, `vercel.json`, or any API route. If the output JSON needs to be refreshed (e.g. after editing `sample-data.json`), that's a manual, local step (`python main.py`, then copy `output/*.json` into the Next.js project's static assets and commit) — not a build-time or request-time dependency.
