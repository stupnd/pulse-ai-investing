import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { SectorDonut } from "@/components/dashboard/SectorDonut";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { supabase, type Holding } from "@/lib/supabase";

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    supabase
      .from("holdings")
      .select("*")
      .then(({ data }) => {
        if (data) setHoldings(data as Holding[]);
      });
  }, []);

  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.current_price, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avg_cost, 0);
  const allTimeChange = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const withReturn = holdings.map((h) => ({
    ...h,
    returnPct: h.avg_cost > 0 ? ((h.current_price - h.avg_cost) / h.avg_cost) * 100 : 0,
  }));

  const best = withReturn.reduce<(typeof withReturn)[0] | null>(
    (top, h) => (top === null || h.returnPct > top.returnPct ? h : top),
    null
  );
  const worst = withReturn.reduce<(typeof withReturn)[0] | null>(
    (bot, h) => (bot === null || h.returnPct < bot.returnPct ? h : bot),
    null
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const allTimeChangeLabel =
    allTimeChange >= 0 ? `+${allTimeChange.toFixed(2)}% all time` : `${allTimeChange.toFixed(2)}% all time`;

  const bestLabel = best ? `${best.returnPct >= 0 ? "+" : ""}${best.returnPct.toFixed(1)}% all time` : "—";
  const worstLabel = worst ? `${worst.returnPct >= 0 ? "+" : ""}${worst.returnPct.toFixed(1)}% all time` : "—";

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Portfolio overview & insights</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Value"
          value={holdings.length ? fmt(totalValue) : "—"}
          change={holdings.length ? allTimeChangeLabel : undefined}
          changeType={allTimeChange >= 0 ? "gain" : "loss"}
          icon={DollarSign}
          surface="green"
        />
        <StatCard
          label="All-Time P&L"
          value={holdings.length ? fmt(totalValue - totalCost) : "—"}
          change={holdings.length ? allTimeChangeLabel : undefined}
          changeType={allTimeChange >= 0 ? "gain" : "loss"}
          icon={Activity}
          surface="yellow"
        />
        <StatCard
          label="Best Performer"
          value={best ? best.ticker : "—"}
          change={best ? bestLabel : undefined}
          changeType="gain"
          icon={TrendingUp}
          surface="purple"
        />
        <StatCard
          label="Worst Performer"
          value={worst ? worst.ticker : "—"}
          change={worst ? worstLabel : undefined}
          changeType="loss"
          icon={TrendingDown}
          surface="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3">
          <PerformanceChart />
        </div>
        <div className="lg:col-span-2">
          <SectorDonut holdings={holdings} />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity holdings={holdings} />
    </div>
  );
}
