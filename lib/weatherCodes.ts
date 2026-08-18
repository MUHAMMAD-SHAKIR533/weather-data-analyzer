import type { WeatherConditionInfo, WeatherConditionKey } from "@/types/weather";

const FALLBACK_CONDITION: WeatherConditionInfo = {
  key: "Unknown",
  label: "Unknown",
  displayColor: "var(--color-outline-variant)",
  accentColor: "var(--color-on-surface-variant)",
  description: "Weather conditions are not available.",
};

const conditions: Record<WeatherConditionKey, WeatherConditionInfo> = {
  Sunny: {
    key: "Sunny",
    label: "Sunny",
    displayColor: "var(--color-tertiary)",
    accentColor: "var(--color-tertiary)",
    description: "Clear or mostly clear sky.",
  },
  "Partly Cloudy": {
    key: "Partly Cloudy",
    label: "Partly Cloudy",
    displayColor: "var(--color-primary-fixed)",
    accentColor: "var(--color-primary)",
    description: "Some cloud cover with bright intervals.",
  },
  Cloudy: {
    key: "Cloudy",
    label: "Cloudy",
    displayColor: "var(--color-outline)",
    accentColor: "var(--color-on-surface-variant)",
    description: "Overcast or mostly cloudy conditions.",
  },
  Rain: {
    key: "Rain",
    label: "Rain",
    displayColor: "var(--color-secondary)",
    accentColor: "var(--color-secondary)",
    description: "Rain or precipitation is present.",
  },
  Storm: {
    key: "Storm",
    label: "Storm",
    displayColor: "var(--color-error)",
    accentColor: "var(--color-error)",
    description: "Severe weather or storm conditions.",
  },
  Fog: {
    key: "Fog",
    label: "Fog",
    displayColor: "var(--color-surface-container-high)",
    accentColor: "var(--color-on-surface-variant)",
    description: "Visibility is reduced by fog or haze.",
  },
  Snow: {
    key: "Snow",
    label: "Snow",
    displayColor: "var(--color-primary-fixed)",
    accentColor: "var(--color-primary)",
    description: "Snow or sleet is present.",
  },
  Unknown: FALLBACK_CONDITION,
};

export function getConditionInfoFromCode(code: number): WeatherConditionInfo {
  if (code === 0) return conditions.Sunny;
  if (code === 1 || code === 2) return conditions["Partly Cloudy"];
  if (code === 3) return conditions.Cloudy;
  if (code === 45 || code === 48) return conditions.Fog;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return conditions.Rain;
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return conditions.Snow;
  }
  if ([95, 96, 99].includes(code)) {
    return conditions.Storm;
  }
  return FALLBACK_CONDITION;
}

export function getConditionKeyFromCode(code: number): WeatherConditionKey {
  return getConditionInfoFromCode(code).key;
}

export function getConditionInfo(key: WeatherConditionKey) {
  return conditions[key] ?? FALLBACK_CONDITION;
}

export function getConditionPalette(key: WeatherConditionKey) {
  return getConditionInfo(key);
}

export function getConditionOpacityColor(key: WeatherConditionKey, opacity = 0.12) {
  const info = getConditionInfo(key);
  return `color-mix(in srgb, ${info.displayColor} ${Math.round(opacity * 100)}%, transparent)`;
}

export function getConditionLabelFromCode(code: number) {
  return getConditionInfoFromCode(code).label;
}

