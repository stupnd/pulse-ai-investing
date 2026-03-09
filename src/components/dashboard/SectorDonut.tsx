import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { type Holding } from "@/lib/supabase";

const SECTOR_MAP: Record<string, string> = {
  AAPL: "Tech", MSFT: "Tech", NVDA: "Tech", META: "Tech", GOOGL: "Tech", AMD: "Tech",
  JPM: "Finance", BAC: "Finance", GS: "Finance", WFC: "Finance",
  JNJ: "Healthcare", PFE: "Healthcare", UNH: "Healthcare",
  TSLA: "Auto", F: "Auto", GM: "Auto",
};

const SECTOR_COLORS: Record<string, string> = {
  Tech: "hsl(270 40% 65%)",
  Finance: "hsl(0 0% 70%)",
  Healthcare: "hsl(45 70% 60%)",
  Auto: "hsl(80 40% 55%)",
  Other: "hsl(0 0% 85%)",
};

interface SectorDonutProps {
  holdings: Holding[];
}

export function SectorDonut({ holdings }: SectorDonutProps) {
  const sectorTotals: Record<string, number> = {};

  for (const h of holdings) {
    const sector = SECTOR_MAP[h.ticker] ?? "Other";
    sectorTotals[sector] = (sectorTotals[sector] ?? 0) + h.shares * h.current_price;
  }

  const totalValue = Object.values(sectorTotals).reduce((s, v) => s + v, 0);

  const data = Object.entries(sectorTotals).map(([name, value]) => ({
    name,
    value: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0,
    color: SECTOR_COLORS[name] ?? SECTOR_COLORS.Other,
  }));

  const displayData = data.length > 0 ? data : [{ name: "No data", value: 100, color: "hsl(0 0% 85%)" }];

  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Sector Allocation</h3>
      <div className="flex items-center gap-6">
        <div className="w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={displayData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="hsl(38 30% 97%)">
                {displayData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {displayData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-semibold ml-auto">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
