import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "gain" | "loss" | "neutral";
  icon: LucideIcon;
  surface: "green" | "yellow" | "purple" | "red";
}

const surfaceMap = {
  green: "bg-surface-green text-surface-green-foreground",
  yellow: "bg-surface-yellow text-surface-yellow-foreground",
  purple: "bg-surface-purple text-surface-purple-foreground",
  red: "bg-surface-red text-surface-red-foreground",
};

export function StatCard({ label, value, change, changeType = "neutral", icon: Icon, surface }: StatCardProps) {
  return (
    <div className={cn("rounded-xl p-5 flex flex-col gap-3", surfaceMap[surface])}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-70">{label}</span>
        <Icon className="w-4 h-4 opacity-50" />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {change && (
        <span
          className={cn(
            "text-xs font-medium",
            changeType === "gain" && "text-gain",
            changeType === "loss" && "text-loss"
          )}
        >
          {change}
        </span>
      )}
    </div>
  );
}
