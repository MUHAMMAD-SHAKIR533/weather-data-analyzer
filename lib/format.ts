export function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatCompactDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTimeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function formatCoordinate(value: number) {
  return value.toFixed(2);
}

export function formatStatValue(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function formatLargeNumber(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatRange(start: string, end: string) {
  return `${formatDateLabel(start)} - ${formatDateLabel(end)}`;
}

export function clampDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function toISODate(date: Date) {
  return clampDate(date).toISOString().slice(0, 10);
}

export function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

export function getDefaultRange(days = 7) {
  const end = new Date();
  const start = subtractDays(end, days - 1);
  return { start: toISODate(start), end: toISODate(end) };
}

