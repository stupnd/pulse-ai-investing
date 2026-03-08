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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
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
    return f"""You are Sage, a personal AI investing analyst. You are sharp, concise, and direct — like a smart friend who works in finance, not a corporate chatbot.

The user's current portfolio:
{holdings_text}

Rules:
- Always reference their actual holdings when relevant
- Be direct, no fluff
- Flag risks honestly
- Never give generic advice — make it specific to their portfolio
- Keep responses concise unless they ask for detail
- You can search for news and market context when needed"""

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