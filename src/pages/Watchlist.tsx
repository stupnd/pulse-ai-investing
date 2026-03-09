import { useState, useEffect } from "react";
import { Search, Pin, Trash2, TrendingUp, TrendingDown, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/contexts/SessionContext";

interface Quote {
  ticker: string;
  company: string;
  price: number;
  change: number;
  change_pct: number;
  sparkline: number[];
}

interface WatchlistItem {
  id: string;
  ticker: string;
  company: string;
}

export default function Watchlist() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ ticker: string; company: string }[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<{ [ticker: string]: Quote }>({});
  const [loadingQuotes, setLoadingQuotes] = useState<{ [ticker: string]: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) fetchWatchlist();
  }, [userId]);

  const fetchWatchlist = async () => {
    const { data } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", userId)
      .order("created_at");
    if (data) {
      setWatchlist(data);
      data.forEach((item) => fetchQuote(item.ticker));
    }
  };

  const fetchQuote = async (ticker: string) => {
    setLoadingQuotes((prev) => ({ ...prev, [ticker]: true }));
    try {
      const res = await fetch(`http://localhost:8000/stock/${ticker}/quote`);
      const data = await res.json();
      if (!data.error) setQuotes((prev) => ({ ...prev, [ticker]: data }));
    } catch {}
    setLoadingQuotes((prev) => ({ ...prev, [ticker]: false }));
  };

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 1) { setSearchResults([]); return; }
    try {
      const res = await fetch(`http://localhost:8000/stock/search?q=${val}`);
      const data = await res.json();
      setSearchResults(data);
    } catch {}
  };

  const pinTicker = async (ticker: string, company: string) => {
    const already = watchlist.find((w) => w.ticker === ticker);
    if (already) return;
    const { data, error } = await supabase
      .from("watchlist")
      .insert({ user_id: userId, ticker, company })
      .select()
      .single();
    if (!error && data) {
      setWatchlist((prev) => [...prev, data]);
      fetchQuote(ticker);
    }
    setQuery("");
    setSearchResults([]);
  };

  const removeTicker = async (id: string, ticker: string) => {
    await supabase.from("watchlist").delete().eq("id", id);
    setWatchlist((prev) => prev.filter((w) => w.id !== id));
    setQuotes((prev) => { const q = { ...prev }; delete q[ticker]; return q; });
  };

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-sm text-muted-foreground mt-1">Track stocks you're watching</p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <div className="flex items-center gap-2 border rounded-lg px-3 bg-card">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search and pin a ticker..."
            className="flex-1 bg-transparent py-2.5 text-sm outline-none"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
            {searchResults.map((r) => (
              <button
                key={r.ticker}
                onClick={() => pinTicker(r.ticker, r.company)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.ticker}</span>
                  <span className="text-muted-foreground text-xs truncate">{r.company}</span>
                </div>
                <Pin className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist cards */}
      {watchlist.length === 0 ? (
        <p className="text-sm text-muted-foreground">Search for a ticker above to start watching it.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((item) => {
            const quote = quotes[item.ticker];
            const loading = loadingQuotes[item.ticker];
            const isPositive = (quote?.change_pct ?? 0) >= 0;
            const sparkData = (quote?.sparkline ?? []).map((c) => ({ c }));

            return (
              <div key={item.id} className="bg-card border rounded-xl p-4 flex flex-col gap-3 cursor-pointer" onClick={() => navigate(`/stock/${item.ticker}`)}>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-base">${item.ticker}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">{item.company}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTicker(item.id, item.ticker); }}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Price */}
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : quote ? (
                  <>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold">${quote.price.toFixed(2)}</p>
                        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPositive ? "+" : ""}{quote.change.toFixed(2)} ({isPositive ? "+" : ""}{quote.change_pct.toFixed(2)}%)
                        </div>
                      </div>

                      {/* Sparkline */}
                      {sparkData.length > 1 && (
                        <div className="w-24 h-12">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparkData}>
                              <Line
                                type="monotone"
                                dataKey="c"
                                stroke={isPositive ? "#22c55e" : "#ef4444"}
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Ask Sage button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/chat?ticker=${item.ticker}`); }}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border rounded-lg px-3 py-2 hover:bg-muted transition-colors w-full"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Ask Sage about ${item.ticker}
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">No data available</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}