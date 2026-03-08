const activities = [
  { id: 1, action: "Bought", ticker: "NVDA", amount: "+10 shares", time: "2 min ago", type: "buy" as const },
  { id: 2, action: "Sold", ticker: "TSLA", amount: "-5 shares", time: "1 hr ago", type: "sell" as const },
  { id: 3, action: "Dividend", ticker: "AAPL", amount: "+$32.50", time: "3 hrs ago", type: "dividend" as const },
  { id: 4, action: "Bought", ticker: "MSFT", amount: "+3 shares", time: "5 hrs ago", type: "buy" as const },
  { id: 5, action: "Sold", ticker: "AMD", amount: "-8 shares", time: "1 day ago", type: "sell" as const },
];

const typeBadge = {
  buy: "bg-surface-green text-surface-green-foreground",
  sell: "bg-surface-red text-surface-red-foreground",
  dividend: "bg-surface-yellow text-surface-yellow-foreground",
};

export function RecentActivity() {
  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
        <span className="text-xs text-muted-foreground">See All</span>
      </div>
      <div className="flex flex-col gap-3">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center gap-3">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadge[a.type]}`}>
              {a.action}
            </span>
            <span className="font-semibold text-sm">${a.ticker}</span>
            <span className="text-sm text-muted-foreground">{a.amount}</span>
            <span className="text-xs text-muted-foreground ml-auto">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
