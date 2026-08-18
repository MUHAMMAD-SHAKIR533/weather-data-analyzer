import { Card } from "@/components/ui/card";
import { formatStatValue } from "@/lib/format";

type TooltipEntry = {
  dataKey?: string | number;
  name?: string;
  value?: number | string | null;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  valueSuffix?: string;
  labelFormatter?: (value: string | number) => string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  valueSuffix = "",
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <Card className="border-outline-variant bg-surface p-3 shadow-overlay">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
        {labelFormatter ? labelFormatter(label as string | number) : label}
      </div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey?.toString()} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-on-surface-variant">{entry.name ?? "Value"}</span>
            <span className="font-semibold text-on-background">
              {formatStatValue(typeof entry.value === "number" ? entry.value : Number(entry.value ?? NaN), 1)}
              {valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
