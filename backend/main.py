"""
main.py — AI Scam Shield FastAPI Backend
Endpoints:
  GET  /health            → RAG status check
  GET  /transactions      → SSE stream of synthetic transactions
  POST /score_risk        → Weighted rule-based risk scoring
  POST /copilot_summary   → LangChain RAG + Gemini explainability
  POST /analyst_chat      → ConversationalRetrievalChain multi-turn chat
  DELETE /analyst_chat/{session_id} → Clear chat memory
"""

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from mock_stream import generate_transaction
from rag_engine import initialize_rag, get_doc_count
from ai_chain import run_copilot_chain, run_analyst_chat, clear_session

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

# ─── Startup: Initialize RAG ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Scam Shield backend...")
    logger.info("Initializing RAG engine (ChromaDB + text-embedding-004)...")
    try:
        count = initialize_rag()
        logger.info(f"✅ RAG engine ready — {count} chunks embedded in ChromaDB")
    except Exception as e:
        logger.error(f"❌ RAG engine initialization failed: {e}")
        logger.warning("Backend will run with limited AI capabilities")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="AI Scam Shield",
    description="Real-time AI fraud prevention for instant payments (FedNow/RTP)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class TransactionPayload(BaseModel):
    transaction_id: str
    amount: float
    sender_name: str
    sender_account_id: str | None = None
    beneficiary_name: str
    beneficiary_bank: str | None = None
    is_new_beneficiary: bool
    velocity_1hr: int
    time_since_account_creation_days: int
    transaction_type: str | None = None
    channel: str | None = None
    risk_score: int | None = None
    risk_level: str | None = None


class AnalystChatRequest(BaseModel):
    session_id: str
    transaction: dict[str, Any]
    message: str


# ─── Risk Scoring Logic ───────────────────────────────────────────────────────

def compute_risk_score(tx: dict) -> tuple[int, str]:
    """
    Weighted rule engine for risk scoring.
    Returns (score: int, level: str)
    """
    score = 0

    # New beneficiary is the single strongest indicator
    if tx.get("is_new_beneficiary"):
        score += 40

    # Amount tiers
    amount = tx.get("amount", 0)
    if amount > 25000:
        score += 35
    elif amount > 15000:
        score += 25
    elif amount > 5000:
        score += 15
    elif amount > 2000:
        score += 5

    # Velocity tiers
    velocity = tx.get("velocity_1hr", 0)
    if velocity >= 15:
        score += 30
    elif velocity >= 10:
        score += 20
    elif velocity >= 5:
        score += 10

    # Account age tiers
    account_age = tx.get("time_since_account_creation_days", 999)
    if account_age <= 7:
        score += 25
    elif account_age <= 14:
        score += 20
    elif account_age <= 30:
        score += 10

    # Cap at 100
    score = min(score, 100)

    # Derive level
    if score >= 70:
        level = "Critical"
    elif score >= 40:
        level = "Medium"
    else:
        level = "Safe"

    return score, level


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Check backend and RAG engine status."""
    doc_count = get_doc_count()
    return {
        "status": "ok",
        "rag_status": "ready" if doc_count > 0 else "not_initialized",
        "doc_count": doc_count,
        "model": "gemini-1.5-flash",
        "embeddings": "text-embedding-004",
        "vectorstore": "ChromaDB",
    }


@app.get("/transactions")
async def stream_transactions():
    """
    SSE endpoint — streams a new synthetic transaction every 1.5 seconds.
    Automatically scores each transaction before streaming.
    """
    async def event_generator():
        while True:
            tx = generate_transaction()
            score, level = compute_risk_score(tx)
            tx["risk_score"] = score
            tx["risk_level"] = level
            payload = json.dumps(tx)
            yield f"data: {payload}\n\n"
            await asyncio.sleep(1.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/score_risk")
async def score_risk(tx: TransactionPayload):
    """
    Rule-based weighted risk scoring endpoint.
    Returns risk_score (0-100) and risk_level.
    """
    score, level = compute_risk_score(tx.model_dump())

    # Identify which rules fired
    fired_rules = []
    if tx.is_new_beneficiary:
        fired_rules.append("New beneficiary (+40)")
    if tx.amount > 25000:
        fired_rules.append(f"Amount ${tx.amount:,.2f} > $25,000 (+35)")
    elif tx.amount > 15000:
        fired_rules.append(f"Amount ${tx.amount:,.2f} > $15,000 (+25)")
    elif tx.amount > 5000:
        fired_rules.append(f"Amount ${tx.amount:,.2f} > $5,000 (+15)")
    if tx.velocity_1hr >= 15:
        fired_rules.append(f"Velocity {tx.velocity_1hr}/hr ≥ 15 (+30)")
    elif tx.velocity_1hr >= 10:
        fired_rules.append(f"Velocity {tx.velocity_1hr}/hr ≥ 10 (+20)")
    elif tx.velocity_1hr >= 5:
        fired_rules.append(f"Velocity {tx.velocity_1hr}/hr ≥ 5 (+10)")
    if tx.time_since_account_creation_days <= 7:
        fired_rules.append(f"Account only {tx.time_since_account_creation_days} days old (+25)")
    elif tx.time_since_account_creation_days <= 14:
        fired_rules.append(f"Account only {tx.time_since_account_creation_days} days old (+20)")
    elif tx.time_since_account_creation_days <= 30:
        fired_rules.append(f"Account only {tx.time_since_account_creation_days} days old (+10)")

    return {
        "transaction_id": tx.transaction_id,
        "risk_score": score,
        "risk_level": level,
        "fired_rules": fired_rules,
    }


@app.post("/copilot_summary")
async def copilot_summary(tx: TransactionPayload):
    """
    AI-powered explainability endpoint.
    Uses LangChain RetrievalQA chain with ChromaDB + Gemini 1.5 Flash.
    Retrieves relevant fraud patterns before generating explanation.
    """
    tx_dict = tx.model_dump()

    # Ensure score is computed if not provided
    if tx_dict.get("risk_score") is None:
        score, level = compute_risk_score(tx_dict)
        tx_dict["risk_score"] = score
        tx_dict["risk_level"] = level

    try:
        result = run_copilot_chain(tx_dict)
        result["transaction_id"] = tx.transaction_id
        result["risk_score"] = tx_dict["risk_score"]
        result["risk_level"] = tx_dict["risk_level"]
        return result
    except Exception as e:
        logger.error(f"Copilot chain error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}. Ensure GOOGLE_API_KEY is set in .env",
        )


@app.post("/analyst_chat")
async def analyst_chat(request: AnalystChatRequest):
    """
    Conversational AI endpoint using LangChain ConversationalRetrievalChain.
    Maintains per-session chat history for multi-turn analysis.
    """
    try:
        result = run_analyst_chat(
            session_id=request.session_id,
            transaction=request.transaction,
            message=request.message,
        )
        return result
    except Exception as e:
        logger.error(f"Analyst chat error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}. Ensure GOOGLE_API_KEY is set in .env",
        )


@app.delete("/analyst_chat/{session_id}")
async def clear_chat_session(session_id: str):
    """Clear the chat memory for a given session."""
    clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
