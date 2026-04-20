"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface MonthlyData {
  month: string;
  totalCarbonKg: number;
  scans: number;
}

interface CategoryData {
  category: string;
  totalCarbonKg: number;
  itemCount: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  meat: "#ef4444",
  dairy: "#f59e0b",
  seafood: "#f97316",
  produce: "#22c55e",
  grains: "#a3e635",
  beverages: "#06b6d4",
  snacks: "#8b5cf6",
  frozen: "#3b82f6",
  household: "#6b7280",
  other: "#9ca3af",
};

export function CarbonTrendChart({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        Scan some receipts to see your trend
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          className="text-xs fill-muted-foreground"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          className="text-xs fill-muted-foreground"
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `${v}kg`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "13px",
          }}
          formatter={(value) => [`${value} kg CO₂`, "Carbon"]}
        />
        <Bar dataKey="totalCarbonKg" radius={[6, 6, 0, 0]}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`oklch(0.696 0.17 162.48 / ${
                0.5 + (index / data.length) * 0.5
              })`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryBreakdownChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        No category data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="totalCarbonKg"
          nameKey="category"
          label={({ name, value }: { name?: string; value?: number }) =>
            `${name}: ${value}kg`
          }
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "13px",
          }}
          formatter={(value) => [`${value} kg CO₂`, "Carbon"]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
