import { type Holding } from "@/lib/supabase";

interface RecentActivityProps {
  holdings: Holding[];
}

export function RecentActivity({ holdings }: RecentActivityProps) {
  const sorted = [...holdings].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
        <span className="text-xs text-muted-foreground">See All</span>
      </div>
      <div className="flex flex-col gap-3">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">No holdings yet.</p>
        )}
        {sorted.map((h) => (
          <div key={h.id} className="flex items-center gap-3">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-green text-surface-green-foreground">
              Added
            </span>
            <span className="font-semibold text-sm">${h.ticker}</span>
            <span className="text-sm text-muted-foreground">· {h.shares} shares</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(h.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
