import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSearchParams } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const HOLDINGS = [
  { ticker: "AAPL", company: "Apple Inc.", shares: 50, avg_cost: 145.00, current_price: 178.72 },
  { ticker: "NVDA", company: "NVIDIA Corp.", shares: 30, avg_cost: 220.00, current_price: 485.09 },
  { ticker: "MSFT", company: "Microsoft Corp.", shares: 25, avg_cost: 280.00, current_price: 378.91 },
  { ticker: "TSLA", company: "Tesla Inc.", shares: 15, avg_cost: 250.00, current_price: 237.49 },
  { ticker: "JNJ", company: "Johnson & Johnson", shares: 40, avg_cost: 160.00, current_price: 156.74 },
  { ticker: "JPM", company: "JPMorgan Chase", shares: 20, avg_cost: 135.00, current_price: 172.38 },
];

function InlineChart({ ticker, timeframe }: { ticker: string; timeframe: string }) {
  const [data, setData] = useState<{ t: number; c: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/stock/${ticker}/history?timeframe=${timeframe}`)
      .then((r) => r.json())
      .then((d) => { setData(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker, timeframe]);

  if (loading) return <div className="text-xs text-muted-foreground mt-2">Loading chart...</div>;
  if (!data.length) return null;

  const min = Math.min(...data.map((d) => d.c));
  const max = Math.max(...data.map((d) => d.c));
  const isPositive = data[data.length - 1].c >= data[0].c;

  return (
    <div className="mt-3 p-3 bg-background border rounded-xl">
      <div className="text-xs font-semibold mb-2">${ticker} · {timeframe}</div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis domain={[min * 0.995, max * 1.005]} hide />
          <Tooltip
            formatter={(val: number) => [`$${val.toFixed(2)}`, ticker]}
            labelFormatter={(t) => new Date((t as number) * 1000).toLocaleDateString()}
            contentStyle={{ fontSize: 11 }}
          />
          <Line type="monotone" dataKey="c" stroke={isPositive ? "#22c55e" : "#ef4444"} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function renderContent(content: string) {
  const parts = content.split(/(\[CHART:[A-Z]+:[a-z0-9]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/\[CHART:([A-Z]+):([a-z0-9]+)\]/);
    if (match) return <InlineChart key={i} ticker={match[1]} timeframe={match[2]} />;
    if (!part.trim()) return null;
    return (
      <ReactMarkdown
        key={i}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        }}
      >
        {part}
      </ReactMarkdown>
    );
  });
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hey! I'm Sage, your personal AI investing analyst. I have context on your current holdings. Ask me anything about your portfolio, market trends, or investment ideas." },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ticker = searchParams.get("ticker");
    const article = searchParams.get("article");
    if (ticker && article) {
      setInput(`What do you think about this news for $${ticker}: "${decodeURIComponent(article)}"?`);
    } else if (ticker) {
      setInput(`What's your take on $${ticker} right now?`);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const history = messages.filter((m) => m.id !== "1").map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, holdings: HOLDINGS, chat_history: history }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m));
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: "Something went wrong. Is the backend running?" } : m));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
        <p className="text-sm text-muted-foreground mt-1">Ask your AI analyst about your portfolio</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border rounded-bl-md"
            )}>
              {m.content === "" && m.role === "assistant" ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:200ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:400ms]" />
                </div>
              ) : (
                renderContent(m.content)
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t bg-card/50">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Context:</span>
          {HOLDINGS.map((h) => (
            <span key={h.ticker} className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full">${h.ticker}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about your portfolio..."
            className="flex-1 bg-background border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/20 transition-shadow"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}