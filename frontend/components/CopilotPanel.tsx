"use client";
import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle, AlertTriangle, ArrowUpRight, Bot, Clock, DollarSign, Activity } from "lucide-react";
import { Transaction, CopilotResult, fetchCopilotSummary } from "@/lib/api";
import RiskGauge from "./RiskGauge";
import ExplainabilityCards from "./ExplainabilityCards";
import RagContextViewer from "./RagContextViewer";
import AnalystChat from "./AnalystChat";

interface CopilotPanelProps {
  transaction: Transaction | null;
  onClose: () => void;
}

type ActionType = "Approve" | "Hold Funds" | "Escalate to Tier 2" | null;

const ACTION_STYLES = {
  Approve: { bg: "bg-emerald-600 hover:bg-emerald-500", text: "text-white", icon: CheckCircle },
  "Hold Funds": { bg: "bg-yellow-600 hover:bg-yellow-500", text: "text-white", icon: Clock },
  "Escalate to Tier 2": { bg: "bg-red-600 hover:bg-red-500", text: "text-white", icon: AlertTriangle },
};

// Typewriter hook
function useTypewriter(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active || !text) { setDisplayed(text); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [text, active]);
  return displayed;
}

export default function CopilotPanel({ transaction, onClose }: CopilotPanelProps) {
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionTaken, setActionTaken] = useState<ActionType>(null);
  const [toast, setToast] = useState<string | null>(null);
  const sessionId = transaction ? `session-${transaction.transaction_id.slice(0, 8)}` : "";
  const summaryText = useTypewriter(result?.summary ?? "", !loading && !!result);

  const analyze = useCallback(async (tx: Transaction) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setActionTaken(null);
    try {
      const data = await fetchCopilotSummary(tx);
      setResult(data);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (transaction) analyze(transaction);
  }, [transaction, analyze]);

  function handleAction(action: ActionType) {
    setActionTaken(action);
    setToast(`✓ Action taken: ${action}`);
    setTimeout(() => setToast(null), 3000);
  }

  if (!transaction) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-panel border-l border-border-main z-50 flex flex-col overflow-hidden shadow-2xl shadow-black/60"
        style={{ animation: "slideIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-main bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-text-main text-sm">AI Analyst Copilot</h2>
              <p className="text-[10px] text-slate-500">Gemini 1.5 Flash · LangChain RAG · ChromaDB</p>
            </div>
          </div>
          <button
            id="copilot-close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-panel-hover text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transaction Quick Info */}
        <div className="grid grid-cols-2 gap-3 px-5 py-3 border-b border-border-main bg-panel">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500">Amount</p>
              <p className="text-sm font-bold text-text-main">${transaction.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500">Velocity</p>
              <p className="text-sm font-bold text-text-main">{transaction.velocity_1hr}/hr</p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-text-main">{transaction.sender_name}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
            <span>{transaction.beneficiary_name}</span>
            {transaction.is_new_beneficiary && (
              <span className="ml-auto text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                NEW BENEFICIARY
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Risk Gauge */}
          <div className="flex flex-col items-center py-4 bg-panel-hover rounded-2xl border border-border-main">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Risk Score</p>
            <RiskGauge score={transaction.risk_score} level={transaction.risk_level} />
          </div>

          {/* AI Analysis */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-300">Querying knowledge base...</p>
                <p className="text-xs text-slate-600 mt-1">ChromaDB → text-embedding-004 → Gemini 1.5 Flash</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-xs font-semibold text-red-400 mb-1">AI Analysis Error</p>
              <p className="text-xs text-red-300">{error}</p>
              <p className="text-[10px] text-slate-500 mt-2">Make sure GOOGLE_API_KEY is set in backend/.env</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* AI Summary box */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">AI Analysis</p>
                  <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                    {result.confidence} confidence
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">{summaryText}</p>
                {result.fraud_pattern_match && (
                  <div className="mt-2 pt-2 border-t border-indigo-500/20">
                    <span className="text-[10px] text-indigo-500 font-semibold">Matched: </span>
                    <span className="text-[10px] text-indigo-400">{result.fraud_pattern_match}</span>
                  </div>
                )}
              </div>

              {/* Explainability flags */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Risk Indicators</p>
                <ExplainabilityCards flags={result.flags} patternMatch={result.fraud_pattern_match} />
              </div>

              {/* Regulatory note */}
              {result.regulatory_note && (
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-violet-500 mb-1">Regulatory Note</p>
                  <p className="text-[11px] text-violet-300 leading-relaxed">{result.regulatory_note}</p>
                </div>
              )}

              {/* RAG Context Viewer */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Retrieved Knowledge</p>
                <RagContextViewer docs={result.retrieved_context} />
              </div>

              {/* Analyst Chat */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Ask the AI</p>
                <AnalystChat transaction={transaction} sessionId={sessionId} />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-4 border-t border-border-main bg-background">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Recommended Action</p>
          {result && (
            <p className="text-[11px] text-slate-400 mb-3">
              AI suggests: <span className="font-bold text-text-main">{result.recommended_action}</span>
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {(["Approve", "Hold Funds", "Escalate to Tier 2"] as ActionType[]).map((action) => {
              const cfg = ACTION_STYLES[action!];
              const Icon = cfg.icon;
              const isActive = actionTaken === action;
              return (
                <button
                  key={action}
                  id={`action-${action?.toLowerCase().replace(/ /g, "-")}`}
                  onClick={() => handleAction(action)}
                  disabled={!!actionTaken}
                  className={`
                    flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200
                    ${isActive ? cfg.bg + " ring-2 ring-offset-2 ring-offset-[#0a0f1e] ring-current scale-95" : cfg.bg}
                    ${actionTaken && !isActive ? "opacity-40 cursor-not-allowed" : ""}
                    ${cfg.text}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="leading-tight text-center">{action}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-[#1a2540] border border-[#1e2d4a] text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease; }
      `}</style>
    </>
  );
}
