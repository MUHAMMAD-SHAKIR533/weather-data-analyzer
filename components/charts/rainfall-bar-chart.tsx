"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";

const axisLine = { stroke: "var(--color-outline-variant)" } as const;

export function RainfallBarChart({
  data,
}: {
  data: Array<{ date: string; rainfall: number | null }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
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
        <Tooltip content={<ChartTooltip valueSuffix=" mm" labelFormatter={(value) => `Date ${value}`} />} />
        <Bar dataKey="rainfall" name="Rainfall" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
