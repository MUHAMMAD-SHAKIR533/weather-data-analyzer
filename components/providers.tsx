"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { LocationOption } from "@/types/weather";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

interface LocationContextValue {
  location: LocationOption | null;
  setLocation: (location: LocationOption | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const LocationContext = createContext<LocationContextValue | null>(null);

const THEME_KEY = "wda-theme";
const LOCATION_KEY = "wda-location";
let locationSnapshot: LocationOption | null = null;
const locationListeners = new Set<() => void>();

function notifyLocationListeners() {
  for (const listener of locationListeners) {
    listener();
  }
}

function subscribeLocation(listener: () => void) {
  locationListeners.add(listener);
  return () => {
    locationListeners.delete(listener);
  };
}

function readLocationSnapshot() {
  return locationSnapshot;
}

function loadLocationFromStorage() {
  const stored = window.localStorage.getItem(LOCATION_KEY);
  if (!stored) {
    locationSnapshot = null;
    return;
  }

  try {
    locationSnapshot = JSON.parse(stored) as LocationOption;
  } catch {
    window.localStorage.removeItem(LOCATION_KEY);
    locationSnapshot = null;
  }
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocationProvider>{children}</LocationProvider>
    </ThemeProvider>
  );
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
    return stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function LocationProvider({ children }: { children: ReactNode }) {
  const location = useSyncExternalStore(subscribeLocation, readLocationSnapshot, () => null);

  useEffect(() => {
    loadLocationFromStorage();
    notifyLocationListeners();
  }, []);

  const setLocation = (next: LocationOption | null) => {
    locationSnapshot = next;
    if (next) {
      window.localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(LOCATION_KEY);
    }
    notifyLocationListeners();
  };

  const value = useMemo<LocationContextValue>(
    () => ({
      location,
      setLocation,
    }),
    [location],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within AppProviders.");
  }
  return context;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within AppProviders.");
  }
  return context;
}
