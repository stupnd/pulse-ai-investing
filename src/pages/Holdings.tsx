import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Holding {
  id: string;
  ticker: string;
  company: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  sector: string;
}

const initialHoldings: Holding[] = [
  { id: "1", ticker: "AAPL", company: "Apple Inc.", shares: 50, avgCost: 145.0, currentPrice: 178.72, sector: "Technology" },
  { id: "2", ticker: "NVDA", company: "NVIDIA Corp.", shares: 30, avgCost: 220.0, currentPrice: 485.09, sector: "Technology" },
  { id: "3", ticker: "MSFT", company: "Microsoft Corp.", shares: 25, avgCost: 280.0, currentPrice: 378.91, sector: "Technology" },
  { id: "4", ticker: "TSLA", company: "Tesla Inc.", shares: 15, avgCost: 250.0, currentPrice: 237.49, sector: "Auto" },
  { id: "5", ticker: "JNJ", company: "Johnson & Johnson", shares: 40, avgCost: 160.0, currentPrice: 156.74, sector: "Healthcare" },
  { id: "6", ticker: "JPM", company: "JPMorgan Chase", shares: 20, avgCost: 135.0, currentPrice: 172.38, sector: "Finance" },
];

export default function Holdings() {
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ticker: "", company: "", shares: "", avgCost: "" });

  const addHolding = () => {
    if (!form.ticker || !form.shares || !form.avgCost) return;
    const newHolding: Holding = {
      id: Date.now().toString(),
      ticker: form.ticker.toUpperCase(),
      company: form.company || form.ticker.toUpperCase(),
      shares: Number(form.shares),
      avgCost: Number(form.avgCost),
      currentPrice: Number(form.avgCost) * (0.9 + Math.random() * 0.3),
      sector: "Other",
    };
    setHoldings([...holdings, newHolding]);
    setForm({ ticker: "", company: "", shares: "", avgCost: "" });
    setOpen(false);
  };

  const removeHolding = (id: string) => setHoldings(holdings.filter((h) => h.id !== id));

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holdings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your portfolio positions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Holding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Holding</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>Ticker</Label>
                <Input placeholder="AAPL" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Company Name</Label>
                <Input placeholder="Apple Inc." value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Shares</Label>
                  <Input type="number" placeholder="10" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Avg Cost ($)</Label>
                  <Input type="number" placeholder="150.00" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })} />
                </div>
              </div>
              <Button onClick={addHolding}>Add to Portfolio</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticker</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Shares</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Cost</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Value</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Gain/Loss</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const totalValue = h.shares * h.currentPrice;
                const totalCost = h.shares * h.avgCost;
                const gainLoss = ((totalValue - totalCost) / totalCost) * 100;
                return (
                  <tr key={h.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-semibold">{h.ticker}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{h.company}</td>
                    <td className="px-5 py-3.5 text-right">{h.shares}</td>
                    <td className="px-5 py-3.5 text-right">${h.avgCost.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right">${h.currentPrice.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-medium">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className={cn("px-5 py-3.5 text-right font-semibold", gainLoss >= 0 ? "text-gain" : "text-loss")}>
                      {gainLoss >= 0 ? "+" : ""}{gainLoss.toFixed(2)}%
                    </td>
                    <td className="px-2 py-3.5">
                      <button onClick={() => removeHolding(h.id)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
