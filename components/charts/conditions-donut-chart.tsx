"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { getConditionInfo } from "@/lib/weatherCodes";
import type { WeatherConditionKey } from "@/types/weather";

export function ConditionsDonutChart({
  data,
}: {
  data: Array<{ label: WeatherConditionKey; count: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="label" innerRadius={58} outerRadius={96} paddingAngle={3}>
          {data.map((entry) => {
            const info = getConditionInfo(entry.label);
            return <Cell key={entry.label} fill={info.displayColor} />;
          })}
        </Pie>
        <Tooltip content={<ChartTooltip labelFormatter={(value) => String(value)} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

