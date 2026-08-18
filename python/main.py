from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parent.parent
SAMPLE_DATA = ROOT / "sample-data.json"
OUTPUT_DIR = ROOT / "public" / "python-output"
OUTPUT_FILE = OUTPUT_DIR / "numpy-output.json"


def load_sample_data() -> dict:
    with SAMPLE_DATA.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def summarize(values: list[float]) -> dict:
    array = np.array(values, dtype=float)
    return {
        "mean": float(np.mean(array)),
        "median": float(np.median(array)),
        "min": float(np.min(array)),
        "max": float(np.max(array)),
        "standardDeviation": float(np.std(array, ddof=0)),
    }


def build_metric(label: str, unit: str, values: list[float], code: str, explanation: str) -> dict:
    stats = summarize(values)
    return {
        "label": label,
        "unit": unit,
        "sample": values[:10],
        "count": len(values),
        "statistics": stats,
        "code": code,
        "explanation": explanation,
    }


def build_concepts(records: list[dict]) -> list[dict]:
    temperatures = [record["temperature"] for record in records]
    humidity = [record["humidity"] for record in records]
    rainfall = [record["rainfall"] for record in records]
    wind_speed = [record["wind_speed"] for record in records]

    condition_counts = Counter()
    for record in records:
        condition_counts[record["weather_condition"]] += 1

    return [
        {
            "name": "Lists",
            "description": "Lists hold the daily weather values before they are converted into NumPy arrays.",
            "snippet": [
                f"temperatures = {temperatures[:5]}",
                "temperatures.append(29.4)",
            ],
        },
        {
            "name": "Dictionaries",
            "description": "Dictionaries store the final metric names, units, and output fields.",
            "snippet": [
                "{",
                '  "temperature": {"mean": 24.7, "max": 30.6}',
                "}",
            ],
        },
        {
            "name": "Tuples",
            "description": "Tuples keep small, fixed pairs such as a metric label and its unit.",
            "snippet": [
                'metric = ("Temperature", "°C")',
                "label, unit = metric",
            ],
        },
        {
            "name": "Sets",
            "description": "Sets help remove duplicate weather conditions when building summaries.",
            "snippet": [
                "unique_conditions = set(condition_counts.keys())",
                "sorted(unique_conditions)",
            ],
        },
        {
            "name": "Loops",
            "description": "Loops walk through every record to prepare data for the calculations.",
            "snippet": [
                "for record in records:",
                '    rainfall.append(record["rainfall"])',
            ],
        },
        {
            "name": "Functions",
            "description": "Functions package the repeated NumPy calculations into a reusable block.",
            "snippet": [
                "def summarize(values):",
                "    return np.mean(values), np.std(values)",
            ],
        },
        {
            "name": "Conditionals",
            "description": "Conditionals decide which weather bucket a record belongs to when counting conditions.",
            "snippet": [
                'if record["weather_condition"] == "Rain":',
                '    condition_counts["Rain"] += 1',
            ],
        },
    ]


def main() -> None:
    sample = load_sample_data()
    records = sample["records"]

    metrics = {
        "temperature": build_metric(
            "Temperature",
            "°C",
            [record["temperature"] for record in records],
            "np.mean(temperatures)",
            "NumPy can average an array of temperatures in one fast operation.",
        ),
        "humidity": build_metric(
            "Humidity",
            "%",
            [record["humidity"] for record in records],
            "np.median(humidity)",
            "NumPy can find the middle humidity value after sorting the array.",
        ),
        "rainfall": build_metric(
            "Rainfall",
            "mm",
            [record["rainfall"] for record in records],
            "np.max(rainfall)",
            "NumPy can quickly identify the wettest day in the range.",
        ),
        "wind": build_metric(
            "Wind Speed",
            "km/h",
            [record["wind_speed"] for record in records],
            "np.std(wind_speed)",
            "NumPy can measure how much wind speed varies across the period.",
        ),
    }

    output = {
        "location": sample["location"],
        "metrics": metrics,
        "concepts": build_concepts(records),
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


if __name__ == "__main__":
    main()
