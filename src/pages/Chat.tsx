import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const holdingsTags = ["AAPL", "NVDA", "MSFT", "TSLA", "JNJ", "JPM"];

const placeholderResponses = [
  "Based on your portfolio, NVDA has been your strongest performer with a 120% gain. It's heavily weighted in tech — consider rebalancing into healthcare or energy for diversification.",
  "Looking at your holdings, your portfolio is up 12.4% overall. TSLA is dragging performance down slightly — you might want to evaluate your thesis there.",
  "Your sector allocation is 45% tech. That's concentrated but not unusual for a growth portfolio. JNJ provides some defensive balance. Want me to suggest some diversification plays?",
  "I'd recommend watching the upcoming NVDA earnings report. Given your 30-share position, any guidance revision could significantly impact your portfolio value.",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hey! I'm your AI investing analyst. I have context on your current holdings. Ask me anything about your portfolio, market trends, or investment ideas." },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = () => {
    if (!input.trim() || isThinking) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      const response = placeholderResponses[Math.floor(Math.random() * placeholderResponses.length)];
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: response }]);
      setIsThinking(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
        <p className="text-sm text-muted-foreground mt-1">Ask your AI analyst about your portfolio</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border rounded-bl-md"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot [animation-delay:200ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot [animation-delay:400ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Holdings context + Input */}
      <div className="p-4 border-t bg-card/50">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Context:</span>
          {holdingsTags.map((t) => (
            <span key={t} className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full">${t}</span>
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
            disabled={!input.trim() || isThinking}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
