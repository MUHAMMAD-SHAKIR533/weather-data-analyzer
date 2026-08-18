"use client";

import { useEffect, useState } from "react";
import { CloudSun, Droplets, Thermometer, Wind, Umbrella, RefreshCcw, AlertTriangle, MapPin } from "lucide-react";
import { LocationSearch } from "@/components/location-search";
import { Card, CardBody } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { useLocation } from "@/components/providers";
import { fetchJson } from "@/lib/client-api";
import type { CurrentWeatherResponse, LocationOption } from "@/types/weather";
import { formatCoordinate, formatTimeAgo } from "@/lib/format";
import { getConditionInfo } from "@/lib/weatherCodes";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { location, setLocation } = useLocation();
  const [current, setCurrent] = useState<CurrentWeatherResponse["current"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const activeLocation = location;
    if (!activeLocation) {
      return;
    }
    const { latitude, longitude, name, country, admin1 } = activeLocation;

    let cancelled = false;
    async function loadCurrent() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("/api/weather/current", window.location.origin);
        url.searchParams.set("lat", String(latitude));
        url.searchParams.set("lon", String(longitude));
        url.searchParams.set("name", name);
        url.searchParams.set("country", country);
        if (admin1) {
          url.searchParams.set("admin1", admin1);
        }

        const data = await fetchJson<CurrentWeatherResponse>(url.toString());
        if (cancelled) return;
        setCurrent(data.current);
        setUpdatedAt(new Date().toISOString());
      } catch (requestError) {
        if (cancelled) return;
        const message =
          typeof requestError === "object" && requestError && "error" in requestError
            ? (requestError as { error?: { message?: string } }).error?.message ?? "Couldn't load current weather."
            : "Couldn't load current weather.";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCurrent();

    return () => {
      cancelled = true;
    };
  }, [location, setLocation]);

  const condition = current ? getConditionInfo(current.condition.key) : null;

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-on-background">
            Current weather for the selected location
          </h1>
          <p className="max-w-2xl text-sm text-on-surface-variant">
            Search for a city, select a result, and the dashboard will load live current conditions.
          </p>
        </div>

        <LocationSearch
          onSelect={async (nextLocation: LocationOption) => {
            setLocation(nextLocation);
          }}
          onSelectLoading={loading}
        />
      </section>

      {!location ? (
        <Card>
          <CardBody className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <MapPin className="h-8 w-8 text-primary" />
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold text-on-background">
                Search for a city to see its current weather
              </h2>
              <p className="text-sm text-on-surface-variant">
                The selected location will persist across pages once you choose a result.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <section className="space-y-4">
          {error ? (
            <div className="flex items-center gap-3 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-background">
              <AlertTriangle className="h-4 w-4 text-error" />
              <span>{error}</span>
              <Button
                variant="secondary"
                className="ml-auto"
                onClick={() => setLocation({ ...location })}
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Temperature"
              value={current ? current.temperature?.toFixed(1) ?? "—" : "—"}
              unit="°C"
              icon={<Thermometer className="h-5 w-5" />}
            />
            <StatCard
              label="Condition"
              value={current ? current.condition.label : "—"}
              helper={current ? current.condition.description : "Select a location to load conditions."}
              icon={<CloudSun className="h-5 w-5" />}
              accentClassName={current ? "text-primary" : undefined}
            />
            <StatCard
              label="Humidity"
              value={current ? current.humidity?.toFixed(0) ?? "—" : "—"}
              unit="%"
              icon={<Droplets className="h-5 w-5" />}
            />
            <StatCard
              label="Wind Speed"
              value={current ? current.windSpeed?.toFixed(1) ?? "—" : "—"}
              unit="km/h"
              icon={<Wind className="h-5 w-5" />}
            />
            <StatCard
              label="Rainfall"
              value={current ? current.rainfall?.toFixed(1) ?? "—" : "—"}
              unit="mm"
              icon={<Umbrella className="h-5 w-5" />}
            />
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface px-5 py-4 shadow-surface">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-on-background">
                  {location.name}
                  {location.country ? `, ${location.country}` : ""}
                </div>
                <div className="font-mono text-xs text-on-surface-variant">
                  {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
                </div>
              </div>
              <div className="text-sm text-on-surface-variant">
                {updatedAt ? `Updated ${formatTimeAgo(updatedAt)}` : loading ? "Loading..." : "Ready"}
              </div>
            </div>
            {condition ? (
              <div className="mt-3 text-xs text-on-surface-variant">
                Condition color: <span className="font-semibold text-on-background">{condition.label}</span>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
