import { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/contexts/SessionContext";

interface Holding {
  id: string;
  ticker: string;
  company: string;
  shares: number;
  avg_cost: number;
  current_price: number;
}

interface SearchResult {
  ticker: string;
  company: string;
}

export default function Holdings() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    ticker: "",
    company: "",
    shares: "",
    avg_cost: "",
    date: "",
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (userId) fetchHoldings(); }, [userId]);

  const fetchHoldings = async () => {
    const { data, error } = await supabase
      .from("holdings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (!error && data) setHoldings(data);
    setLoading(false);
  };

  const handleTickerSearch = async (val: string) => {
    setForm({ ...form, ticker: val, company: "" });
    if (val.length < 1) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`http://localhost:8000/stock/search?q=${val}`);
      const data = await res.json();
      setSearchResults(data);
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  const selectTicker = (result: SearchResult) => {
    setForm({ ...form, ticker: result.ticker, company: result.company });
    setSearchResults([]);
  };

  const handleDateChange = async (date: string) => {
    setForm({ ...form, date, avg_cost: "" });
    if (!form.ticker || !date) return;
    setFetchingPrice(true);
    try {
      const res = await fetch(`http://localhost:8000/stock/${form.ticker}/price-on-date?date=${date}`);
      const data = await res.json();
      if (data.price) setForm((prev) => ({ ...prev, date, avg_cost: data.price.toString() }));
    } catch {}
    setFetchingPrice(false);
  };

  const addHolding = async () => {
    if (!form.ticker || !form.shares || !form.avg_cost) return;

    let currentPrice = Number(form.avg_cost);
    try {
      const res = await fetch(`http://localhost:8000/stock/${form.ticker}/current-price`);
      const data = await res.json();
      if (data.price) currentPrice = data.price;
    } catch {}

    const { data, error } = await supabase
      .from("holdings")
      .insert({
        user_id: userId,
        ticker: form.ticker.toUpperCase(),
        company: form.company || form.ticker.toUpperCase(),
        shares: Number(form.shares),
        avg_cost: Number(form.avg_cost),
        current_price: currentPrice,
      })
      .select()
      .single();
    if (!error && data) {
      setHoldings([...holdings, data]);
      setForm({ ticker: "", company: "", shares: "", avg_cost: "", date: "" });
      setOpen(false);
    }
  };

  const removeHolding = async (id: string) => {
    await supabase.from("holdings").delete().eq("id", id);
    setHoldings(holdings.filter((h) => h.id !== id));
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading holdings...</div>;

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holdings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your portfolio positions</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setSearchResults([]); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Add Holding</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Holding</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">

              {/* Ticker search */}
              <div className="grid gap-1.5 relative" ref={searchRef}>
                <Label>Ticker</Label>
                <Input
                  placeholder="Search AAPL, NVDA..."
                  value={form.ticker}
                  onChange={(e) => handleTickerSearch(e.target.value)}
                  autoComplete="off"
                />
                {form.company && (
                  <p className="text-xs text-muted-foreground">{form.company}</p>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
                    {searching && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
                    )}
                    {searchResults.map((r) => (
                      <button
                        key={r.ticker}
                        onClick={() => selectTicker(r)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <span className="font-semibold">{r.ticker}</span>
                        <span className="text-muted-foreground text-xs truncate">{r.company}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date picker */}
              <div className="grid gap-1.5">
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Shares</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={form.shares}
                    onChange={(e) => setForm({ ...form, shares: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>
                    Avg Cost ($)
                    {fetchingPrice && <span className="text-xs text-muted-foreground ml-1">fetching...</span>}
                  </Label>
                  <Input
                    type="number"
                    placeholder="150.00"
                    value={form.avg_cost}
                    onChange={(e) => setForm({ ...form, avg_cost: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={addHolding} disabled={!form.ticker || !form.shares || !form.avg_cost}>
                Add to Portfolio
              </Button>
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
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground text-sm">
                    No holdings yet. Add your first position.
                  </td>
                </tr>
              ) : (
                holdings.map((h) => {
                  const totalValue = h.shares * h.current_price;
                  const totalCost = h.shares * h.avg_cost;
                  const gainLoss = ((totalValue - totalCost) / totalCost) * 100;
                  return (
                    <tr key={h.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-semibold">{h.ticker}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{h.company}</td>
                      <td className="px-5 py-3.5 text-right">{h.shares}</td>
                      <td className="px-5 py-3.5 text-right">${h.avg_cost.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right">${h.current_price.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right font-medium">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={cn("px-5 py-3.5 text-right font-semibold", gainLoss >= 0 ? "text-green-500" : "text-red-500")}>
                        {gainLoss >= 0 ? "+" : ""}{gainLoss.toFixed(2)}%
                      </td>
                      <td className="px-2 py-3.5">
                        <button onClick={() => removeHolding(h.id)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}