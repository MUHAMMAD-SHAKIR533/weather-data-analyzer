# DESIGN.md — Visual Design System

This project uses a design language called **"Atmospheric Intelligence"** — a cool-toned, high-density, data-first aesthetic built for scientific/analytical products, not a generic AI-dashboard look. It was drafted as a Stitch design concept and is adopted here as the binding visual spec. If you (Codex) are building this in Tailwind, put these values in `tailwind.config.ts` as theme extensions and CSS variables — do not invent alternate colors, spacing, or type scales.

## 1. Brand direction

The interface should feel like a precision instrument: generous whitespace, a rigorous grid, cool grays, and confident typographic hierarchy for numbers. Complex datasets are the focal point — chrome and decoration stay out of the way. Avoid: gradients-as-decoration, glassmorphism, neon accents, playful illustration, rounded "bubbly" cards, anything that reads as a marketing landing page.

## 2. Color tokens

Define these as CSS variables (light theme values shown; see §7 for dark theme) and map them into Tailwind via `theme.extend.colors`.

```css
--color-background: #F8F9FB;
--color-surface: #FFFFFF;              /* cards */
--color-surface-container-low: #F3F4F6;
--color-surface-container: #EDEEF0;
--color-surface-container-high: #E7E8EA;
--color-outline: #737685;
--color-outline-variant: #C3C6D6;

--color-on-background: #191C1E;
--color-on-surface-variant: #434654;

--color-primary: #0052CC;              /* Meteorological Blue */
--color-primary-hover: #003D9B;
--color-on-primary: #FFFFFF;
--color-primary-fixed: #DAE2FF;        /* light chips/badges */

--color-secondary: #00687A;            /* Atmospheric Teal */
--color-secondary-container: #6AE1FF;
--color-on-secondary: #FFFFFF;

--color-tertiary: #7D5200;             /* Amber — caution/stormy */
--color-tertiary-container: #FFCA81;

--color-success: #1E7B34;              /* stable/clear */
--color-warning: #7D5200;              /* caution/stormy */
--color-error: #BA1A1A;                /* severe weather / error states */
--color-error-container: #FFDAD6;
```

Usage rules:
- **Primary (blue)** — nav active state, primary buttons, primary chart series (e.g. temperature line), links.
- **Secondary (teal)** — secondary chart series (e.g. humidity), supplemental interactive accents.
- **Amber/tertiary** — "stormy/caution" condition badges, warning banners.
- **Success green** — "clear/stable" condition badges only. Do not use for generic UI success toasts unless the message is genuinely about calm conditions.
- **Error red** — form validation errors, failed API-call states. Never use for anything else.
- Neutrals carry the vast majority of the UI. Color is a signal, used sparingly.

## 3. Typography

- **UI font:** Inter (via `next/font/google`), weights 400/500/600/700.
- **Monospace font:** JetBrains Mono, weights 400/500 — used exclusively for: table numeric cells that benefit from tabular alignment (optional), coordinates, weather codes, and code snippets on the About/NumPy pages.

| Token | Size / Line-height | Weight | Use |
|---|---|---|---|
| `display-lg` | 48px / 56px, -0.02em | 700 | Page hero numbers only (rare) |
| `headline-md` | 24px / 32px, -0.01em | 600 | Page titles |
| `headline-sm` | 18px / 24px | 600 | Card/section titles |
| `body-md` | 16px / 24px | 400 | Default body text |
| `body-sm` | 14px / 20px | 400 | Secondary text, table cells |
| `data-value` | 32px / 40px, -0.01em | 700 | Big stat numbers (temperature, mean, etc.) |
| `label-caps` | 12px / 16px, 0.05em, uppercase | 500 | Table headers, card eyebrow labels, chart axis labels |
| `code-sm` | 13px / 18px | 400 | Code/coordinate/monospace content |

Mobile rule: below 768px, `display-lg` scales to 32px/40px. All other tokens are unchanged (they're already conservative).

## 4. Spacing & grid

Strict 8px base unit. Never use an arbitrary pixel value outside this scale.

`4, 8, 12, 16, 24, 32` px = `xs, base, sm, md, lg, xl`. Page/container side margin: 24px (desktop), 16px (mobile "gutter").

- **Desktop (≥1024px):** left sidebar nav, fixed 260px, containing content in a fluid grid to its right with 24px margins.
- **Tablet (768–1023px):** sidebar collapses to a slim 72px icon-only rail.
- **Mobile (<768px):** sidebar becomes a bottom tab bar (see `UI.md §Responsive`) — this matches the reference mockup, which uses a bottom nav with Dashboard / Data / Analysis / Stats.

## 5. Elevation

| Level | Use | Style |
|---|---|---|
| 0 — Background | Page canvas | `#F8F9FB`, no shadow |
| 1 — Card/Surface | Data containers | White, `1px solid #EBECF0`, `box-shadow: 0px 4px 12px rgba(9,30,66,0.05)` |
| 2 — Dropdown/Modal/Tooltip | Transient overlays | `box-shadow: 0px 8px 24px rgba(9,30,66,0.15)` |

No inner shadows, no neomorphism. Hover/focus states are communicated via border-color or background-fill changes, not shadow changes.

## 6. Shape

- Cards: `rounded-lg` → 16px corner radius.
- Buttons, inputs, badges: 8px corner radius.
- Data markers (chart dots, status dots): fully circular (`rounded-full`).

## 7. Theme toggle (light/dark)

A theme toggle is included in the header (per the brief's "if useful" — it's useful here because the product's audience keeps dashboards open for long stretches). Implement with a `data-theme` attribute on `<html>` and CSS variable overrides; do not use Tailwind's `dark:` class variants scattered through every component — centralize the palette swap in the CSS variables instead so the same component code works in both themes.

Dark theme surface mapping (derived from the same design tokens, standard Material-style dark elevation):
```css
[data-theme="dark"] {
  --color-background: #101418;
  --color-surface: #171B20;
  --color-surface-container-low: #1B2025;
  --color-surface-container: #20252B;
  --color-on-background: #E3E5E8;
  --color-on-surface-variant: #C3C6D6;
  --color-outline: #8B8F9E;
  --color-outline-variant: #3A3E46;
  --color-primary: #B2C5FF;
  --color-on-primary: #001848;
}
```

## 8. Components

### Buttons
- **Primary:** solid `--color-primary`, white text, 8px radius, `body-sm` weight 600, 12px vertical / 16px horizontal padding. Hover darkens to `--color-primary-hover`.
- **Ghost/secondary:** transparent background, `1px solid outline-variant`, text in `on-surface-variant`. Used for "Export," "Filter," "Cancel."
- **Icon buttons:** 40x40px hit target minimum (touch target), circular hover fill in `surface-container`.

### Data Summary Card (used on Dashboard + Statistics)
Structure, top to bottom:
1. 24px outline-style icon, top-left, in `on-surface-variant` (or status color if condition-specific).
2. `label-caps` descriptor (e.g. "TEMPERATURE").
3. `data-value` — the number itself, with unit as a smaller trailing `body-sm` (e.g. "24.5°C").
4. Optional bottom row: small delta/trend text (e.g. "+1.2° vs yesterday") in `body-sm`, colored success/error/neutral by direction.

### Tables
- Header row: background `surface-container-low`, text `label-caps`, `on-surface-variant`.
- Body rows: `body-sm`, `1px solid` bottom border in `outline-variant`, hover background `surface-container-low`.
- Numeric columns right-aligned. Date column left-aligned. Condition column shows a small colored dot + label.

### Charts (Recharts)
- Axis lines/ticks: `outline-variant`, tick labels in `label-caps` at 11–12px.
- Line series: 2px stroke, primary/secondary/tertiary palette per series; area charts use a 10%-opacity gradient fill of the same stroke color fading to transparent.
- Tooltips: white/`surface` background, elevation level 2, **4px** corner radius (deliberately sharper than the 16px cards, so tooltips read as "transient" not "content").
- Donut/pie (Weather Conditions): condition→color mapping fixed as: Sunny = tertiary/amber, Cloudy = neutral gray (`outline`), Partly Cloudy = light blue (`primary-fixed`), Rain = secondary teal, Storm = error red, Fog = `surface-container-high` gray. Keep this mapping consistent everywhere a condition badge or chart appears.

### Inputs (search, date range, filters)
- 1px `outline-variant` border, 8px radius, `body-md` text, leading icon slot for search/calendar icons.
- Focus: 2px ring in `primary` at 20% opacity, border becomes solid `primary`.
- Error state: border + helper text in `error`.

### Badges (weather condition, status)
Pill-shaped (`rounded-full`), small colored dot + `label-caps` text, background is the condition color at ~12% opacity, text is the full-strength condition color.

## 9. Reference

A Stitch-generated mockup (`code.html`, `screen.png`) implementing this exact system for the mobile "Weather Data & Analysis" screen was supplied with the project brief and should be treated as the canonical visual reference for card style, chart style, and the Python-fundamentals callout card at the bottom of the Data page. Match its density and spacing when building the equivalent desktop layouts.
