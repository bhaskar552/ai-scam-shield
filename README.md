# AI Scam Shield 🛡️

**AI-powered real-time fraud prevention for instant payments (FedNow / RTP)**

Built for modern fraud operations — featuring **XGBoost ML** for live scoring and **LangChain RAG** + **OpenAI** for Analyst Copilot explainability.

---

## 🏗️ Architecture Flow

```mermaid
graph TD
    %% Define Styles
    classDef client fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef api fill:#0f172a,stroke:#8b5cf6,stroke-width:2px,color:#fff
    classDef ml fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    classDef ai fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#fff
    classDef db fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff

    subgraph Frontend [Next.js React Dashboard]
        UI[Live Operations Center]:::client
        CopilotUI[AI Analyst Copilot]:::client
    end

    subgraph Backend [FastAPI Server]
        Stream[SSE Transaction Stream]:::api
        Risk[ML Risk Scorer API]:::api
        Copilot[LangChain RAG Copilot API]:::api
    end

    subgraph Intelligence [Models & Storage]
        XGBoost[(XGBoost Classifier)]:::ml
        Chroma[(ChromaDB Vector Store)]:::db
        Gateway((Custom AI Gateway)):::ai
    end

    %% Flow
    Stream -- 1. Generate & Stream --> UI
    UI -- 2. Request Risk Score --> Risk
    Risk -- 3. Feature Extraction & Predict --> XGBoost
    XGBoost -.-> Risk
    Risk -.-> UI
    
    UI -- 4. Analyst Opens Transaction --> CopilotUI
    CopilotUI -- 5. Request AI Summary --> Copilot
    Copilot -- 6. Similarity Search --> Chroma
    Chroma -.-> Copilot
    Copilot -- 7. RAG Prompt (gpt-5-mini) --> Gateway
    Gateway -.-> Copilot
    Copilot -.-> CopilotUI
```

## 🧠 Technology Stack

### Core Engine
| Component | Technology | Description |
|---|---|---|
| **ML Model** | XGBoost (`xgboost`) | Real-time transaction scoring trained on Kaggle PaySim data. |
| **LLM** | OpenAI `gpt-5-mini` | Powers the Analyst Copilot and Chat. Routed via custom AI Gateway. |
| **Embeddings** | OpenAI `text-embedding-3-small` | Vectorizes the internal knowledge base documents. |
| **Vector Store** | ChromaDB | Persistent local database storing 57 RAG knowledge chunks. |
| **RAG Framework**| LangChain LCEL | Orchestrates `RetrievalQA` and `ConversationalRetrievalChain`. |

### Infrastructure
| Layer | Tech |
|---|---|
| **Frontend** | Next.js 16, Tailwind CSS, Lucide Icons |
| **Backend** | FastAPI, Uvicorn, Pydantic |
| **Streaming** | Server-Sent Events (SSE) |

---

## 🚀 Setup & Installation

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
*On the first run, ChromaDB will automatically embed the 5 knowledge base documents.*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000**

---

## 🔍 Key Features

- **Live SSE Stream** — Mock transaction generator streaming real-world PaySim fraud patterns.
- **XGBoost Scoring Engine** — Transactions are scored instantly using on-the-fly feature engineering.
- **LangChain RAG Copilot** — Retrieves FinCEN/FedNow rules, fraud patterns, and case studies before generating an explanation.
- **RAG Context Viewer** — See exactly which documents the AI used for its conclusion.
- **Multi-turn Analyst Chat** — Conversational AI with memory to drill down into a transaction.
- **Interactive Triage Queue** — Dynamic alerts for Critical-tier transactions.

---

## 📡 API Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/health` | Backend, ML Model, and RAG status |
| GET | `/transactions` | SSE stream of synthetic transactions |
| POST | `/score_risk` | XGBoost ML risk score & feature importances |
| POST | `/copilot_summary` | LangChain RAG AI explainability |
| POST | `/analyst_chat` | Multi-turn conversational AI |
| DELETE | `/analyst_chat/{session_id}` | Clear chat memory |
