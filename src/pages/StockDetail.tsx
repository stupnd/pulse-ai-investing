import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ChartPoint { t: number; c: number; }
interface Detail {
  ticker: string; company: string; sector: string; industry: string;
  market_cap: number; volume: number; avg_volume: number; pe_ratio: number;
  eps: number; week_52_high: number; week_52_low: number;
  dividend_yield: number; description: string;
}

const TIMEFRAMES = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "7d" },
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
];

function formatLargeNumber(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("1y");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    fetchDetail();
  }, [ticker]);

  useEffect(() => {
    if (!ticker) return;
    fetchChart();
  }, [ticker, timeframe]);

  const fetchDetail = async () => {
    const res = await fetch(`https://pulse-ai-investing.onrender.com/stock/${ticker}/detail`);
    const data = await res.json();
    setDetail(data);
  };

  const fetchChart = async () => {
    setLoadingChart(true);
    const res = await fetch(`https://pulse-ai-investing.onrender.com/stock/${ticker}/history?timeframe=${timeframe}`);
    const data = await res.json();
    setChartData(data.data || []);
    setLoadingChart(false);
  };

  const isPositive = chartData.length > 1 && chartData[chartData.length - 1].c >= chartData[0].c;
  const currentPrice = chartData.length ? chartData[chartData.length - 1].c : 0;
  const startPrice = chartData.length ? chartData[0].c : 0;
  const priceChange = currentPrice - startPrice;
  const pctChange = startPrice ? (priceChange / startPrice) * 100 : 0;

  return (
    <div className="p-8 max-w-[1000px]">
      {/* Back */}
      <button
        onClick={() => navigate("/watchlist")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Watchlist
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">${ticker}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{detail?.company}</p>
          {detail?.sector && (
            <span className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded-full mt-2 inline-block">
              {detail.sector} · {detail.industry}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate(`/chat?ticker=${ticker}`)}
          className="flex items-center gap-2 text-sm border rounded-lg px-4 py-2 hover:bg-muted transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Ask Sage
        </button>
      </div>

      {/* Price + change */}
      <div className="mb-6">
        <p className="text-4xl font-bold">${currentPrice.toFixed(2)}</p>
        <div className={`flex items-center gap-1.5 mt-1 text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isPositive ? "+" : ""}{priceChange.toFixed(2)} ({isPositive ? "+" : ""}{pctChange.toFixed(2)}%) · {TIMEFRAMES.find(t => t.value === timeframe)?.label}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border rounded-xl p-4 mb-4">
        {/* Timeframe toggles */}
        <div className="flex gap-1 mb-4">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                timeframe === tf.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {loadingChart ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Loading chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="t"
                tickFormatter={(t) => new Date(t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                formatter={(val: number) => [`$${val.toFixed(2)}`, ticker]}
                labelFormatter={(t) => new Date((t as number) * 1000).toLocaleDateString()}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="c"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Key stats */}
      {detail && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Market Cap", value: formatLargeNumber(detail.market_cap) },
            { label: "Volume", value: detail.volume.toLocaleString() },
            { label: "Avg Volume", value: detail.avg_volume.toLocaleString() },
            { label: "P/E Ratio", value: detail.pe_ratio ? detail.pe_ratio.toFixed(2) : "N/A" },
            { label: "EPS", value: detail.eps ? `$${detail.eps.toFixed(2)}` : "N/A" },
            { label: "52W High", value: `$${detail.week_52_high.toFixed(2)}` },
            { label: "52W Low", value: `$${detail.week_52_low.toFixed(2)}` },
            { label: "Dividend Yield", value: detail.dividend_yield ? `${(detail.dividend_yield * 100).toFixed(2)}%` : "None" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="font-semibold text-sm">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {detail?.description && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-2">About</h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{detail.description}</p>
        </div>
      )}
    </div>
  );
}