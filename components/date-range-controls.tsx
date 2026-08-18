"use client";

import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export function DateRangeControls({
  start,
  end,
  onStartChange,
  onEndChange,
  onPreset,
  selectedPreset,
}: {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onPreset: (preset: "7" | "30" | "90") => void;
  selectedPreset: "7" | "30" | "90" | "custom";
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Start date
          </label>
          <Input type="date" value={start} onChange={(event) => onStartChange(event.target.value)} />
        </div>
        <div className="grid flex-1 gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            End date
          </label>
          <Input type="date" value={end} onChange={(event) => onEndChange(event.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CalendarRange className="h-4 w-4 text-on-surface-variant" />
        {(["7", "30", "90"] as const).map((preset) => (
          <Button
            key={preset}
            variant={selectedPreset === preset ? "primary" : "secondary"}
            className={cn("px-4 py-2", selectedPreset === preset && "shadow-surface")}
            onClick={() => onPreset(preset)}
          >
            {preset}
          </Button>
        ))}
      </div>
    </div>
  );
}

