import { useState, useEffect } from "react";
import { ExternalLink, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/contexts/SessionContext";

interface Article {
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
}

interface NewsFeed {
  [ticker: string]: Article[];
}

export default function News() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const [news, setNews] = useState<NewsFeed>({});
  const [loading, setLoading] = useState(true);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) fetchNews();
  }, [userId]);

  const fetchNews = async () => {
    const { data } = await supabase.from("holdings").select("ticker").eq("user_id", userId);
    if (!data || data.length === 0) { setLoading(false); return; }
    const tickers = data.map((h) => h.ticker).join(",");
    const res = await fetch(`https://pulse-ai-investing.onrender.com/news?tickers=${tickers}`);
    const result = await res.json();
    setNews(result);
    setActiveTicker(Object.keys(result)[0] || null);
    setLoading(false);
  };

  const tickers = Object.keys(news);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading news...</div>;
  if (tickers.length === 0) return <div className="p-8 text-sm text-muted-foreground">Add holdings to see news.</div>;

  const articles = activeTicker ? (news[activeTicker] || []) : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-24 border-r flex flex-col gap-1 p-2 pt-6 shrink-0">
        {tickers.map((ticker) => (
          <button
            key={ticker}
            onClick={() => setActiveTicker(ticker)}
            className={`text-xs font-semibold px-2 py-2 rounded-lg transition-colors ${
              activeTicker === ticker
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            ${ticker}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTicker && (
          <>
            <h1 className="text-2xl font-bold tracking-tight mb-1">${activeTicker}</h1>
            <p className="text-sm text-muted-foreground mb-6">Latest news · last 7 days</p>
            {articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent news found.</p>
            ) : (
              <div className="grid gap-4">
                {articles.map((article, i) => (
                  <div
                    key={i}
                    className="group bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex cursor-pointer"
                    onClick={() => window.open(article.url, "_blank")}
                  >
                    {article.image && (
                      <div className="w-48 shrink-0">
                        <img
                          src={article.image}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    )}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                          {article.headline}
                        </h3>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                      </div>
                      {article.summary && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded-full">
                          {article.source}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(article.datetime * 1000).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat?ticker=${activeTicker}&article=${encodeURIComponent(article.headline)}`);
                          }}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Ask Sage about this
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}