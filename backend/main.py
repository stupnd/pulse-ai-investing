from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import anthropic
import os
import httpx
import yfinance as yf
import finnhub
from dotenv import load_dotenv


load_dotenv()

finnhub_client = finnhub.Client(api_key=os.getenv("FINNHUB_API_KEY"))

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
- When asked about recent news, current prices, or market events, use the web search tool to find real current information before answering
- Always cite your sources when you use search results
- Place the chart tag on its own line where it makes sense in the response
- Only include a chart when it genuinely adds value, not on every message""")

async def stream_response(request: ChatRequest):
    system = build_system_prompt(request.holdings)
    
    # Extract tickers mentioned in the message
    holding_tickers = [h.ticker for h in request.holdings]
    mentioned = [t for t in holding_tickers if t.lower() in request.message.lower()]
    
    # Fetch real news for mentioned tickers
    news_context = ""
    if mentioned:
        try:
            import time
            for ticker in mentioned[:2]:
                news = finnhub_client.company_news(
                    ticker,
                    _from=(datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
                    to=datetime.now().strftime("%Y-%m-%d")
                )
                if news:
                    news_context += f"\nRecent news for {ticker}:\n"
                    for article in news[:10]:
                        news_context += f"- [{article['headline']}]({article['url']}) ({article['source']}, {datetime.fromtimestamp(article['datetime']).strftime('%b %d')})\n"
                        if article.get('summary'):
                            news_context += f"  {article['summary'][:200]}...\n"
        except Exception as e:
            print(f"News fetch error: {e}")

    # Inject news into system prompt if we found any
    full_system = system
    if news_context:
        full_system += f"\n\nLIVE NEWS CONTEXT (use this to answer, cite the headlines and sources):\n{news_context}"

    messages = request.chat_history + [
        {"role": "user", "content": request.message}
    ]

    with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=full_system,
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

@app.get("/stock/search")
async def search_stocks(q: str):
    async with httpx.AsyncClient() as http:
        res = await http.get(
            "https://query2.finance.yahoo.com/v1/finance/search",
            params={"q": q, "quotesCount": 8, "newsCount": 0},
            headers={"User-Agent": "Mozilla/5.0"}
        )
        data = res.json()

    results = []
    for r in data.get("quotes", []):
        if r.get("quoteType") == "EQUITY" and "." not in r.get("symbol", ""):
            results.append({
                "ticker": r["symbol"],
                "company": r.get("longname") or r.get("shortname", "")
            })

    return results[:8]

@app.get("/stock/{ticker}/current-price")
async def current_price(ticker: str):
    stock = yf.Ticker(ticker)
    hist = stock.history(period="1d", interval="1m")
    if hist.empty:
        hist = stock.history(period="2d", interval="1d")
    if hist.empty:
        return {"error": "No data"}
    price = round(float(hist["Close"].iloc[-1]), 2)
    return {"ticker": ticker, "price": price}

@app.get("/stock/{ticker}/price-on-date")
async def price_on_date(ticker: str, date: str):
    stock = yf.Ticker(ticker)
    hist = stock.history(start=date, end=date, interval="1d")

    if hist.empty:
        d = datetime.strptime(date, "%Y-%m-%d")
        hist = stock.history(
            start=(d - timedelta(days=5)).strftime("%Y-%m-%d"),
            end=(d + timedelta(days=1)).strftime("%Y-%m-%d"),
            interval="1d"
        )

    if hist.empty:
        return {"error": "No price data"}

    price = round(float(hist["Close"].iloc[-1]), 2)
    return {"ticker": ticker, "date": date, "price": price}

@app.get("/stock/{ticker}/history")
async def stock_history(ticker: str, timeframe: str = "1m"):
    timeframe_map = {
        "1d": ("1d", "5m"),
        "7d": ("7d", "1h"),
        "1m": ("1mo", "1d"),
        "3m": ("3mo", "1d"),
        "1y": ("1y", "1wk"),
        "5y": ("5y", "1mo"),
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


@app.get("/news")
async def get_portfolio_news(tickers: str):
    ticker_list = tickers.split(",")
    result = {}
    
    for ticker in ticker_list:
        try:
            news = finnhub_client.company_news(
                ticker.strip(),
                _from=(datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
                to=datetime.now().strftime("%Y-%m-%d")
            )
            result[ticker.strip()] = [
                {
                    "headline": a["headline"],
                    "summary": a.get("summary", ""),
                    "source": a.get("source", ""),
                    "url": a.get("url", ""),
                    "image": a.get("image", ""),
                    "datetime": a.get("datetime", 0),
                }
                for a in news[:10]
            ]
        except:
            result[ticker.strip()] = []
    
    return result

@app.get("/stock/{ticker}/quote")
async def get_quote(ticker: str):
    stock = yf.Ticker(ticker)
    info = stock.info
    hist = stock.history(period="2d", interval="1d")
    
    if hist.empty:
        return {"error": "No data"}
    
    current = round(float(hist["Close"].iloc[-1]), 2)
    prev = round(float(hist["Close"].iloc[-2]), 2) if len(hist) > 1 else current
    change = round(current - prev, 2)
    change_pct = round((change / prev) * 100, 2)
    
    # sparkline - last 7 days
    spark = stock.history(period="7d", interval="1d")
    sparkline = [round(float(p), 2) for p in spark["Close"].tolist()]
    
    return {
        "ticker": ticker,
        "company": info.get("longName", ticker),
        "price": current,
        "change": change,
        "change_pct": change_pct,
        "sparkline": sparkline,
        "market_cap": info.get("marketCap", 0),
        "volume": info.get("volume", 0),
    }

@app.get("/stock/{ticker}/detail")
async def stock_detail(ticker: str):
    stock = yf.Ticker(ticker)
    info = stock.info
    
    return {
        "ticker": ticker,
        "company": info.get("longName", ticker),
        "sector": info.get("sector", ""),
        "industry": info.get("industry", ""),
        "market_cap": info.get("marketCap", 0),
        "volume": info.get("volume", 0),
        "avg_volume": info.get("averageVolume", 0),
        "pe_ratio": info.get("trailingPE", 0),
        "eps": info.get("trailingEps", 0),
        "week_52_high": info.get("fiftyTwoWeekHigh", 0),
        "week_52_low": info.get("fiftyTwoWeekLow", 0),
        "dividend_yield": info.get("dividendYield", 0),
        "description": info.get("longBusinessSummary", ""),
    }