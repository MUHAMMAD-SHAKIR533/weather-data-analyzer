"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";

const axisLine = { stroke: "var(--color-outline-variant)" } as const;

export function MinMaxChart({
  data,
}: {
  data: Array<{ date: string; temperatureMin: number | null; temperatureMax: number | null }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid stroke="var(--color-outline-variant)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12, fontWeight: 500 }}
          tickFormatter={(value) => value.slice(5)}
          axisLine={axisLine}
          tickLine={axisLine}
        />
        <YAxis
          tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12, fontWeight: 500 }}
          axisLine={axisLine}
          tickLine={axisLine}
          width={44}
        />
        <Tooltip content={<ChartTooltip valueSuffix="°C" labelFormatter={(value) => `Date ${value}`} />} />
        <ReferenceArea y1="auto" y2="auto" fill="var(--color-primary-fixed)" fillOpacity={0.12} />
        <Line
          type="monotone"
          dataKey="temperatureMin"
          name="Minimum"
          stroke="var(--color-secondary)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="temperatureMax"
          name="Maximum"
          stroke="var(--color-error)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
