# AI Scam Shield 🛡️

**AI-powered real-time fraud prevention for instant payments (FedNow / RTP)**

Built for hackathon demo — featuring LangChain RAG + Gemini 1.5 Flash + ChromaDB.

---

## Architecture

```
Frontend (Next.js 16 + Tailwind v4)     Backend (FastAPI + Python)
─────────────────────────────────        ──────────────────────────
SSE stream → live transaction table      /transactions   → SSE stream
Click row  → Copilot Panel opens         /score_risk     → rule engine
AI Summary → Gemini 1.5 Flash            /copilot_summary→ LangChain RAG
Analyst Chat → multi-turn memory         /analyst_chat   → ConversationalRetrievalChain
RAG Viewer → ChromaDB source docs        /health         → status check
```

## AI Stack

| Component | Technology |
|---|---|
| LLM | Gemini 1.5 Flash (`gemini-1.5-flash`) |
| Embeddings | Google `text-embedding-004` |
| Vector Store | ChromaDB (persistent local) |
| RAG Framework | LangChain `RetrievalQA` |
| Analyst Chat | LangChain `ConversationalRetrievalChain` |
| Knowledge Base | 5 documents (fraud patterns, FedNow rules, case studies, playbook, regulations) |

---

## Setup

### 1. Set your Gemini API key

```bash
cd backend
cp .env.template .env
# Edit .env and paste your GOOGLE_API_KEY from https://aistudio.google.com
```

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

On first run, ChromaDB will embed all 5 knowledge base documents (~15 seconds).

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Key Features

- **Live SSE stream** — new transaction every 1.5 seconds
- **Weighted risk scoring** — rule engine fires before AI
- **LangChain RAG copilot** — retrieves fraud knowledge before generating explanation
- **RAG Context Viewer** — shows exactly which documents were retrieved
- **Analyst Chat** — multi-turn conversational AI with memory
- **Action buttons** — Approve / Hold Funds / Escalate to Tier 2

---

## Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/health` | Backend + RAG status |
| GET | `/transactions` | SSE stream of synthetic transactions |
| POST | `/score_risk` | Rule-based risk score |
| POST | `/copilot_summary` | LangChain RAG + Gemini explainability |
| POST | `/analyst_chat` | Multi-turn conversational AI |
| DELETE | `/analyst_chat/{session_id}` | Clear chat memory |
