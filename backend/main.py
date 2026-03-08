from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class Holding(BaseModel):
    ticker: str
    company: str
    shares: float
    avg_cost: float
    current_price: float

class ChatRequest(BaseModel):
    message: str
    holdings: List[Holding]
    chat_history: List[dict] = []

def build_system_prompt(holdings: List[Holding]) -> str:
    holdings_text = "\n".join([
        f"- {h.ticker} ({h.company}): {h.shares} shares, avg cost ${h.avg_cost}, current price ${h.current_price}, gain/loss: {((h.current_price - h.avg_cost) / h.avg_cost * 100):.2f}%"
        for h in holdings
    ])
    return (f"""You are Sage, a personal AI investing analyst. You are sharp, concise, and direct — like a smart friend who works in finance, not a corporate chatbot.

The user's current portfolio:
{holdings_text}

Rules:
- Always reference their actual holdings when relevant
- Be direct, no fluff
- Flag risks honestly
- Never give generic advice — make it specific to their portfolio
- Keep responses concise unless they ask for detail
- When your response discusses price performance, historical trends, or compares stocks over time, you MUST include a chart tag in your response
- Chart tag format: [CHART:TICKER:TIMEFRAME] where TIMEFRAME is 1d, 7d, 1m, 3m, 1y
- Example: [CHART:NVDA:1y] or [CHART:AAPL:3m]
- Place the chart tag on its own line where it makes sense in the response
- Only include a chart when it genuinely adds value, not on every message""")

async def stream_response(request: ChatRequest):
    system = build_system_prompt(request.holdings)
    
    messages = request.chat_history + [
        {"role": "user", "content": request.message}
    ]

    with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text

@app.post("/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        stream_response(request),
        media_type="text/plain"
    )

@app.get("/health")
async def health():
    return {"status": "ok"}

import yfinance as yf

@app.get("/stock/{ticker}/history")
async def stock_history(ticker: str, timeframe: str = "1m"):
    timeframe_map = {
        "1d": ("1d", "5m"),
        "7d": ("7d", "1h"),
        "1m": ("1mo", "1d"),
        "3m": ("3mo", "1d"),
        "1y": ("1y", "1wk"),
    }
    period, interval = timeframe_map.get(timeframe, ("1mo", "1d"))
    
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period, interval=interval)
    
    if hist.empty:
        return {"error": "No data"}
    
    data = [
        {"t": int(row.Index.timestamp()), "c": round(row.Close, 2)}
        for row in hist.itertuples()
    ]
    
    return {"ticker": ticker, "timeframe": timeframe, "data": data}