import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

const weekData = [
  { name: "Mon", value: 24500 },
  { name: "Tue", value: 26200 },
  { name: "Wed", value: 33567 },
  { name: "Thu", value: 29800 },
  { name: "Fri", value: 31200 },
  { name: "Sat", value: 28900 },
  { name: "Sun", value: 30100 },
];

const monthData = [
  { name: "Week 1", value: 142000 },
  { name: "Week 2", value: 156000 },
  { name: "Week 3", value: 148000 },
  { name: "Week 4", value: 167500 },
];

type Period = "7d" | "1m";

export function PerformanceChart() {
  const [period, setPeriod] = useState<Period>("7d");
  const data = period === "7d" ? weekData : monthData;

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Portfolio Performance</h3>
          <p className="text-xl font-bold mt-1">+3.2%</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {(["7d", "1m"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p === "7d" ? "7 Days" : "1 Month"}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(38 20% 85%)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(0 0% 45%)" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(0 0% 45%)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <Bar dataKey="value" fill="hsl(0 0% 12%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
