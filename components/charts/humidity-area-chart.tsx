"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";

const axisLine = { stroke: "var(--color-outline-variant)" } as const;

export function HumidityAreaChart({
  data,
}: {
  data: Array<{ date: string; humidity: number | null }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="humidity-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.28} />
            <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Tooltip content={<ChartTooltip valueSuffix="%" labelFormatter={(value) => `Date ${value}`} />} />
        <Area
          type="monotone"
          dataKey="humidity"
          name="Humidity"
          stroke="var(--color-secondary)"
          strokeWidth={2}
          fill="url(#humidity-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
