"use client";
import { useState, useMemo } from "react";
import {
  Briefcase, Clock, CheckCircle, AlertTriangle, Search,
  ChevronDown, ChevronUp, MessageSquare, Shield
} from "lucide-react";

export interface Case {
  case_id: string;
  transaction: any;
  action_taken: string;
  status: "open" | "investigating" | "resolved";
  resolution: string | null;
  analyst_notes: string;
  copilot_summary: string;
  created_at: string;
  updated_at: string;
}

interface CaseManagementViewProps {
  cases: Case[];
  onUpdateCase: (caseId: string, updates: Partial<Case>) => void;
}

const STATUS_STYLES = {
  open:          { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",    icon: Clock,          label: "Open" },
  investigating: { bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: AlertTriangle, label: "Investigating" },
  resolved:      { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle, label: "Resolved" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CaseManagementView({ cases, onUpdateCase }: CaseManagementViewProps) {
  const [filter, setFilter]       = useState<"all" | "open" | "investigating" | "resolved">("all");
  const [search, setSearch]       = useState("");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return cases
      .filter(c => filter === "all" || c.status === filter)
      .filter(c =>
        c.case_id.toLowerCase().includes(search.toLowerCase()) ||
        c.transaction?.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.transaction?.beneficiary_name?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [cases, filter, search]);

  const counts = useMemo(() => ({
    all: cases.length,
    open: cases.filter(c => c.status === "open").length,
    investigating: cases.filter(c => c.status === "investigating").length,
    resolved: cases.filter(c => c.status === "resolved").length,
  }), [cases]);

  function handleSaveNotes(caseId: string) {
    if (editNotes[caseId] !== undefined) {
      onUpdateCase(caseId, { analyst_notes: editNotes[caseId] });
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-border-main bg-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-text-main">Investigation Cases</h2>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
              {counts.open} Open
            </span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-background border border-border-main rounded-lg text-xs text-text-main w-60 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "open", "investigating", "resolved"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-text-muted hover:text-text-main hover:bg-panel-hover"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
            </button>
          ))}
        </div>
      </div>

      {/* Case list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Briefcase className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No cases found</p>
            <p className="text-xs mt-1">Click &quot;Hold Funds&quot; or &quot;Escalate&quot; on a transaction to create a case</p>
          </div>
        )}

        {filtered.map(c => {
          const isExpanded = expanded === c.case_id;
          const style = STATUS_STYLES[c.status];
          const StatusIcon = style.icon;
          const riskColor = c.transaction?.risk_level === "Critical" ? "text-red-500" : "text-yellow-500";

          return (
            <div
              key={c.case_id}
              className={`bg-panel border rounded-xl transition-all ${isExpanded ? "border-indigo-500/40" : "border-border-main hover:border-border-main/80"}`}
            >
              {/* Card header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : c.case_id)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-text-main">{c.case_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {style.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-panel-hover ${riskColor}`}>
                      Score: {c.transaction?.risk_score}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span>{c.transaction?.sender_name} → {c.transaction?.beneficiary_name}</span>
                    <span>${c.transaction?.amount?.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    <span className="text-[10px]">Action: {c.action_taken}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-text-muted">
                  <span className="text-[10px]">{timeAgo(c.created_at)}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-border-main space-y-4">
                  {/* AI Summary */}
                  {c.copilot_summary && (
                    <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">AI Copilot Summary</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{c.copilot_summary}</p>
                    </div>
                  )}

                  {/* Analyst Notes */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Analyst Notes
                    </p>
                    <textarea
                      className="w-full bg-background border border-border-main rounded-lg p-3 text-xs text-text-main resize-none focus:outline-none focus:border-indigo-500 min-h-[80px]"
                      placeholder="Add investigation notes..."
                      value={editNotes[c.case_id] ?? c.analyst_notes}
                      onChange={e => setEditNotes(prev => ({ ...prev, [c.case_id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleSaveNotes(c.case_id)}
                      className="mt-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Save Notes
                    </button>
                  </div>

                  {/* Resolution */}
                  {c.status !== "resolved" && (
                    <div className="flex items-center gap-3">
                      <select
                        className="bg-background border border-border-main rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-indigo-500"
                        value={c.resolution ?? ""}
                        onChange={e => onUpdateCase(c.case_id, { resolution: e.target.value || null })}
                      >
                        <option value="">Select Resolution...</option>
                        <option value="confirmed_fraud">Confirmed Fraud</option>
                        <option value="false_positive">False Positive</option>
                        <option value="needs_more_info">Needs More Info</option>
                      </select>
                      {c.status === "open" && (
                        <button
                          onClick={() => onUpdateCase(c.case_id, { status: "investigating" })}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Start Investigation
                        </button>
                      )}
                      {c.resolution && (
                        <button
                          onClick={() => onUpdateCase(c.case_id, { status: "resolved" })}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  )}

                  {c.status === "resolved" && c.resolution && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-400">
                        ✓ Resolved: {c.resolution.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
