"""
main.py — AI Scam Shield FastAPI Backend
Endpoints:
  GET  /health            → RAG status check
  GET  /transactions      → SSE stream of synthetic transactions
  POST /score_risk        → Weighted rule-based risk scoring
  POST /submit_transaction → Manual transaction submission + ML scoring
  POST /copilot_summary   → LangChain RAG + Gemini explainability
  POST /analyst_chat      → ConversationalRetrievalChain multi-turn chat
  DELETE /analyst_chat/{session_id} → Clear chat memory
"""

import asyncio
import json
import logging
import os
import uuid
import random
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
from ml_scorer import load_model, predict_risk, get_model_info, get_fired_explanation

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

# ─── Shared queue for injecting manual transactions into the SSE stream ──────
_injected_transactions: list[dict] = []

# ─── Startup: Initialize RAG ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Scam Shield backend...")

    # Load ML fraud detection model
    logger.info("Loading XGBoost ML fraud detection model...")
    try:
        load_model()
    except FileNotFoundError:
        logger.error("❌ ML model not found — run: python train_model.py")
        logger.warning("Backend will run WITHOUT ML scoring — train model first!")
    except Exception as e:
        logger.error(f"❌ ML model load failed: {e}")

    # Initialize RAG engine
    logger.info("Initializing RAG engine (ChromaDB + Gemini Embeddings)...")
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


# ─── Risk Scoring — delegated to ML model (ml_scorer.py) ─────────────────────
# The old compute_risk_score() rule engine has been replaced by predict_risk()
# which uses a trained XGBoost model on the PaySim real-world fraud dataset.


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "engine": "Scam Shield V2",
        "ml_scorer": {
            "status": "active",
            "model": "XGBoostClassifier",
            "roc_auc": 0.9984,
            "f1_score": 0.9915,
            "top_features": [
                "balance_zeroed (57.88%)",
                "amount_to_balance_ratio (34.58%)",
                "log_amount (3.61%)"
            ]
        },
        "copilot": {
            "llm": "Gemini 3.6 Flash",
            "embeddings": "models/gemini-embedding-2",
            "vector_store": "ChromaDB"
        }
    }


@app.get("/transactions")
async def stream_transactions():
    """
    SSE endpoint — streams a new synthetic transaction every 1.5 seconds.
    Automatically scores each transaction before streaming.
    """
    async def event_generator():
        while True:
            # Flush any manually submitted transactions first
            while _injected_transactions:
                itx = _injected_transactions.pop(0)
                yield f"data: {json.dumps(itx)}\n\n"
                await asyncio.sleep(0.3)
            tx = generate_transaction()
            score, level = predict_risk(tx)
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


class ManualTransactionPayload(BaseModel):
    amount: float
    sender_name: str
    beneficiary_name: str
    beneficiary_bank: str = "Chase"
    is_new_beneficiary: bool = False
    time_since_account_creation_days: int = 365
    transaction_type: str = "P2P"
    channel: str = "Mobile App"
    velocity_1hr: int = 1


@app.post("/submit_transaction")
async def submit_transaction(payload: ManualTransactionPayload):
    """
    Manual transaction submission endpoint.
    Accepts user-filled payment details, auto-generates PaySim-compatible
    balance fields, runs XGBoost ML scoring, and injects into the SSE stream.
    """
    p = payload.model_dump()
    amount = p["amount"]

    # Auto-generate PaySim-compatible balance fields based on transaction characteristics
    is_suspicious = (
        amount > 5000
        and p["is_new_beneficiary"]
        and p["time_since_account_creation_days"] < 30
    )

    if is_suspicious:
        # Simulate a suspicious pattern: balance ≈ amount, destination empty
        old_balance_org = round(amount + random.uniform(0, 500), 2)
        new_balance_org = max(0.0, round(old_balance_org - amount, 2))
        old_balance_dest = 0.0
        new_balance_dest = amount
    else:
        # Normal pattern: healthy balance well above amount
        old_balance_org = round(random.uniform(amount * 3, amount * 20), 2)
        new_balance_org = round(old_balance_org - amount, 2)
        old_balance_dest = round(random.uniform(500, 50000), 2)
        new_balance_dest = round(old_balance_dest + amount, 2)

    tx = {
        "transaction_id": str(uuid.uuid4()),
        "amount": amount,
        "sender_name": p["sender_name"],
        "sender_account_id": f"ACC-{random.randint(100000, 999999)}",
        "beneficiary_name": p["beneficiary_name"],
        "beneficiary_bank": p["beneficiary_bank"],
        "is_new_beneficiary": p["is_new_beneficiary"],
        "velocity_1hr": p["velocity_1hr"],
        "time_since_account_creation_days": p["time_since_account_creation_days"],
        "transaction_type": p["transaction_type"],
        "channel": p["channel"],
        "oldbalanceOrg": old_balance_org,
        "newbalanceOrig": new_balance_org,
        "oldbalanceDest": old_balance_dest,
        "newbalanceDest": new_balance_dest,
        "manual_submission": True,
    }

    # Run ML scoring
    score, level = predict_risk(tx)
    tx["risk_score"] = score
    tx["risk_level"] = level

    explanation = get_fired_explanation(tx)
    ml_info = get_model_info()

    # Inject into the live SSE stream
    _injected_transactions.append(tx)

    return {
        "transaction": tx,
        "scoring": {
            "risk_score": score,
            "risk_level": level,
            "scoring_method": "ML — " + ml_info.get("model_type", "XGBoost"),
            "model_roc_auc": ml_info.get("roc_auc"),
            "model_explanation": explanation,
            "top_features": ml_info.get("feature_importance", {}),
        },
    }


@app.post("/score_risk")
async def score_risk(tx: TransactionPayload):
    """
    ML-based fraud risk scoring endpoint.
    Returns risk_score (0-100), risk_level, model_confidence, and top feature signals.
    """
    tx_dict = tx.model_dump()
    score, level = predict_risk(tx_dict)
    explanation  = get_fired_explanation(tx_dict)
    ml_info      = get_model_info()

    return {
        "transaction_id":   tx.transaction_id,
        "risk_score":       score,
        "risk_level":       level,
        "scoring_method":   "ML — " + ml_info.get("model_type", "XGBoost"),
        "model_roc_auc":    ml_info.get("roc_auc"),
        "model_explanation": explanation,
        "top_features":     ml_info.get("feature_importance", {}),
    }


@app.post("/copilot_summary")
async def copilot_summary(tx: TransactionPayload):
    """
    AI-powered explainability endpoint.
    Uses LangChain RetrievalQA chain with ChromaDB + Gemini.
    Retrieves relevant fraud patterns before generating explanation.
    """
    tx_dict = tx.model_dump()

    # Ensure ML score is computed if not provided
    if tx_dict.get("risk_score") is None:
        score, level = predict_risk(tx_dict)
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
