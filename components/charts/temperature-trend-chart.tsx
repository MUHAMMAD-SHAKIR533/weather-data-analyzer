"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";

const axisLine = { stroke: "var(--color-outline-variant)" } as const;

export function TemperatureTrendChart({
  data,
}: {
  data: Array<{ date: string; temperature: number | null }>;
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
        <Line
          type="monotone"
          dataKey="temperature"
          name="Temperature"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
