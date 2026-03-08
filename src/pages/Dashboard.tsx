import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { SectorDonut } from "@/components/dashboard/SectorDonut";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function Dashboard() {
  return (
    <div className="p-8 max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Portfolio overview & insights</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Value" value="$167,542" change="+12.4% all time" changeType="gain" icon={DollarSign} surface="green" />
        <StatCard label="Today's Change" value="+$1,243" change="+0.75%" changeType="gain" icon={Activity} surface="yellow" />
        <StatCard label="Best Performer" value="NVDA" change="+4.2% today" changeType="gain" icon={TrendingUp} surface="purple" />
        <StatCard label="Worst Performer" value="TSLA" change="-2.1% today" changeType="loss" icon={TrendingDown} surface="red" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3">
          <PerformanceChart />
        </div>
        <div className="lg:col-span-2">
          <SectorDonut />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
