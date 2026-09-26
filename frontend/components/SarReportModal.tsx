"use client";
import { X, Copy, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { useState } from "react";

export interface SarReport {
  filing_type: string;
  subject: {
    name: string;
    account_id: string;
    institution: string;
  };
  suspicious_activity: {
    description: string;
    date: string;
    amount: string;
    instrument_type: string;
  };
  narrative: string;
  regulatory_citations: string[];
  risk_indicators: string[];
  recommended_actions: string[];
}

interface SarReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SarReport | null;
  loading: boolean;
}

export default function SarReportModal({ isOpen, onClose, report, loading }: SarReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  function handleCopy() {
    if (!report) return;
    const text = `
FinCEN SAR — AI Generated Draft
================================

FILING TYPE: ${report.filing_type}

PART I — SUBJECT INFORMATION
Name: ${report.subject.name}
Account ID: ${report.subject.account_id}
Financial Institution: ${report.subject.institution}

PART II — SUSPICIOUS ACTIVITY
Description: ${report.suspicious_activity.description}
Date: ${report.suspicious_activity.date}
Amount: ${report.suspicious_activity.amount}
Instrument: ${report.suspicious_activity.instrument_type}

PART III — NARRATIVE
${report.narrative}

RISK INDICATORS:
${report.risk_indicators.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}

REGULATORY CITATIONS:
${report.regulatory_citations.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}

RECOMMENDED ACTIONS:
${report.recommended_actions.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div
        className="fixed inset-4 md:inset-10 bg-panel border border-border-main rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl"
        style={{ animation: "fadeIn 0.3s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-main bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-bold text-text-main text-sm">FinCEN SAR — AI Generated Draft</h2>
              <p className="text-[10px] text-slate-500">Suspicious Activity Report</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-panel-hover text-text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warning banner */}
        <div className="px-6 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <p className="text-xs text-yellow-400 font-medium">AI-Generated Draft — Requires Human Review Before Filing with FinCEN</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Generating SAR report...</p>
              <p className="text-xs mt-1">Querying knowledge base for regulatory citations</p>
            </div>
          )}

          {report && !loading && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Filing Type */}
              <div className="p-4 rounded-xl bg-panel-hover border border-border-main">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Filing Type</p>
                <p className="text-sm font-semibold text-text-main">{report.filing_type}</p>
              </div>

              {/* Part I: Subject */}
              <div className="p-4 rounded-xl bg-panel-hover border border-border-main">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Part I — Subject Information</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[9px] text-slate-500">Name</p>
                    <p className="text-xs font-bold text-text-main">{report.subject.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500">Account ID</p>
                    <p className="text-xs font-bold font-mono text-text-main">{report.subject.account_id}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500">Institution</p>
                    <p className="text-xs font-bold text-text-main">{report.subject.institution}</p>
                  </div>
                </div>
              </div>

              {/* Part II: Suspicious Activity */}
              <div className="p-4 rounded-xl bg-panel-hover border border-border-main">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Part II — Suspicious Activity</p>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{report.suspicious_activity.description}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[9px] text-slate-500">Date</p>
                    <p className="text-xs font-bold text-text-main">{report.suspicious_activity.date}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500">Amount</p>
                    <p className="text-xs font-bold text-text-main">{report.suspicious_activity.amount}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500">Instrument</p>
                    <p className="text-xs font-bold text-text-main">{report.suspicious_activity.instrument_type}</p>
                  </div>
                </div>
              </div>

              {/* Part III: Narrative */}
              <div className="p-4 rounded-xl bg-panel-hover border border-border-main">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Part III — Narrative</p>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{report.narrative}</p>
              </div>

              {/* Risk Indicators */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">Risk Indicators</p>
                <ul className="space-y-1">
                  {report.risk_indicators.map((r, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Regulatory Citations */}
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2">Regulatory Citations</p>
                <ul className="space-y-1">
                  {report.regulatory_citations.map((r, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5">§</span> {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Actions */}
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2">Recommended Actions</p>
                <ul className="space-y-1">
                  {report.recommended_actions.map((r, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">{i + 1}.</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
