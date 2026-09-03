"use client";
import { useState } from "react";
import {
  Send,
  User,
  Building2,
  DollarSign,
  CreditCard,
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  UserPlus,
} from "lucide-react";
import {
  submitTransaction,
  ManualTransactionPayload,
  SubmitTransactionResult,
  Transaction,
} from "@/lib/api";
import RiskGauge from "./RiskGauge";

const BANKS = ["Chase", "BofA", "Wells Fargo", "Citi", "US Bank", "Chime", "CashApp Bank", "Varo", "Unknown Routing"];
const TX_TYPES = ["P2P", "Wire", "Bill Payment", "Business", "Payroll"];
const CHANNELS = ["Mobile App", "Web", "API"];

// Quick-fill presets for demo purposes
const PRESETS: { label: string; emoji: string; desc: string; values: Partial<ManualTransactionPayload> }[] = [
  {
    label: "Normal Payment",
    emoji: "✅",
    desc: "Safe everyday transfer",
    values: {
      amount: 150,
      sender_name: "Alice Johnson",
      beneficiary_name: "Bob Martinez",
      beneficiary_bank: "Chase",
      is_new_beneficiary: false,
      time_since_account_creation_days: 730,
      transaction_type: "P2P",
      channel: "Mobile App",
      velocity_1hr: 1,
    },
  },
  {
    label: "Suspicious Transfer",
    emoji: "⚠️",
    desc: "High amount to new beneficiary",
    values: {
      amount: 8500,
      sender_name: "Michael Chen",
      beneficiary_name: "Unknown Recipient",
      beneficiary_bank: "CashApp Bank",
      is_new_beneficiary: true,
      time_since_account_creation_days: 45,
      transaction_type: "Wire",
      channel: "API",
      velocity_1hr: 6,
    },
  },
  {
    label: "Account Drain",
    emoji: "🚨",
    desc: "Full balance drain to mule account",
    values: {
      amount: 42000,
      sender_name: "Patricia Hall",
      beneficiary_name: "Shell Corp LLC",
      beneficiary_bank: "Unknown Routing",
      is_new_beneficiary: true,
      time_since_account_creation_days: 3,
      transaction_type: "Wire",
      channel: "API",
      velocity_1hr: 18,
    },
  },
];

const DEFAULT_FORM: ManualTransactionPayload = {
  amount: 0,
  sender_name: "",
  beneficiary_name: "",
  beneficiary_bank: "Chase",
  is_new_beneficiary: false,
  time_since_account_creation_days: 365,
  transaction_type: "P2P",
  channel: "Mobile App",
  velocity_1hr: 1,
};

interface SendPaymentViewProps {
  onTransactionScored: (tx: Transaction) => void;
}

export default function SendPaymentView({ onTransactionScored }: SendPaymentViewProps) {
  const [form, setForm] = useState<ManualTransactionPayload>({ ...DEFAULT_FORM });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitTransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof ManualTransactionPayload>(key: K, value: ManualTransactionPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: Partial<ManualTransactionPayload>) => {
    setForm({ ...DEFAULT_FORM, ...preset });
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!form.sender_name || !form.beneficiary_name || form.amount <= 0) {
      setError("Please fill in sender name, beneficiary name, and a valid amount.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await submitTransaction(form);
      setResult(res);
      onTransactionScored(res.transaction);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_FORM });
    setResult(null);
    setError(null);
  };

  const riskColor = result
    ? result.scoring.risk_level === "Critical"
      ? "red"
      : result.scoring.risk_level === "Medium"
      ? "yellow"
      : "emerald"
    : "slate";

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Quick Presets */}
        <div className="flex flex-col sm:flex-row gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.values)}
              className="flex-1 group relative p-4 rounded-2xl border border-border-main bg-panel hover:bg-panel-hover hover:border-blue-500/40 transition-all duration-300 text-left"
            >
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl">{preset.emoji}</span>
                <span className="text-sm font-semibold text-text-main group-hover:text-blue-400 transition-colors">{preset.label}</span>
              </div>
              <p className="text-[11px] text-text-muted pl-9">{preset.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Payment Form — 3 columns */}
          <div className="lg:col-span-3 space-y-5">
            {/* Sender Section */}
            <div className="rounded-2xl border border-border-main bg-panel p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-bold text-text-main">Sender Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-text-muted mb-1 block">Sender Name</label>
                  <input
                    type="text"
                    value={form.sender_name}
                    onChange={(e) => updateField("sender_name", e.target.value)}
                    placeholder="e.g. Alice Johnson"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border-main text-sm text-text-main placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Account Age (days)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={1800}
                      value={form.time_since_account_creation_days}
                      onChange={(e) => updateField("time_since_account_creation_days", Number(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-xs font-mono font-bold text-text-main w-14 text-right">
                      {form.time_since_account_creation_days}d
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-text-muted mb-1 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Velocity (txns in last 1hr)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={25}
                      value={form.velocity_1hr}
                      onChange={(e) => updateField("velocity_1hr", Number(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-xs font-mono font-bold text-text-main w-8 text-right">
                      {form.velocity_1hr}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Beneficiary Section */}
            <div className="rounded-2xl border border-border-main bg-panel p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="text-sm font-bold text-text-main">Beneficiary Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-text-muted mb-1 block">Beneficiary Name</label>
                  <input
                    type="text"
                    value={form.beneficiary_name}
                    onChange={(e) => updateField("beneficiary_name", e.target.value)}
                    placeholder="e.g. Bob Martinez"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border-main text-sm text-text-main placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-text-muted mb-1 block">Beneficiary Bank</label>
                  <select
                    value={form.beneficiary_bank}
                    onChange={(e) => updateField("beneficiary_bank", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border-main text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
                  >
                    {BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border-main cursor-pointer hover:border-violet-500/40 transition-all">
                  <input
                    type="checkbox"
                    checked={form.is_new_beneficiary}
                    onChange={(e) => updateField("is_new_beneficiary", e.target.checked)}
                    className="accent-violet-500 w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-medium text-text-main">New Beneficiary (first-time recipient)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Section */}
            <div className="rounded-2xl border border-border-main bg-panel p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-text-main">Payment Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-text-muted mb-1 block">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input
                      type="number"
                      value={form.amount || ""}
                      onChange={(e) => updateField("amount", Number(e.target.value))}
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-background border border-border-main text-sm text-text-main placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-text-muted mb-1 flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3" /> Transaction Type
                    </label>
                    <select
                      value={form.transaction_type}
                      onChange={(e) => updateField("transaction_type", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-border-main text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    >
                      {TX_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-muted mb-1 flex items-center gap-1.5">
                      <Smartphone className="w-3 h-3" /> Channel
                    </label>
                    <select
                      value={form.channel}
                      onChange={(e) => updateField("channel", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-border-main text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    >
                      {CHANNELS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/40"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Payment
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-3 rounded-2xl text-sm font-medium text-text-muted border border-border-main hover:bg-panel-hover hover:text-text-main transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                <p className="text-xs font-semibold text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* RIGHT: Result Panel — 2 columns */}
          <div className="lg:col-span-2">
            {!result && !loading && (
              <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-border-main bg-panel/50 p-8">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/5 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-blue-500/30" />
                  </div>
                  <p className="text-sm text-text-muted">Submit a payment to see the<br />ML fraud prediction result</p>
                  <p className="text-[10px] text-slate-600">Try the quick-fill presets above ↑</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="h-full flex items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-blue-400 font-medium">Running XGBoost Inference...</p>
                  <p className="text-[10px] text-slate-500">Feature extraction → Model prediction</p>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                {/* Verdict Card */}
                <div className={`rounded-2xl border bg-panel overflow-hidden ${
                  riskColor === "red" ? "border-red-500/40" : riskColor === "yellow" ? "border-yellow-500/40" : "border-emerald-500/40"
                }`}>
                  {/* Verdict Header */}
                  <div className={`px-5 py-4 ${
                    riskColor === "red" ? "bg-gradient-to-r from-red-500/10 to-transparent" 
                    : riskColor === "yellow" ? "bg-gradient-to-r from-yellow-500/10 to-transparent" 
                    : "bg-gradient-to-r from-emerald-500/10 to-transparent"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {riskColor === "red" ? (
                          <ShieldAlert className="w-6 h-6 text-red-400" />
                        ) : riskColor === "yellow" ? (
                          <AlertTriangle className="w-6 h-6 text-yellow-400" />
                        ) : (
                          <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-text-main">ML Prediction Result</p>
                          <p className="text-[10px] text-text-muted">{result.scoring.scoring_method}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        riskColor === "red" ? "bg-red-500/20 text-red-400"
                        : riskColor === "yellow" ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {result.scoring.risk_level}
                      </span>
                    </div>
                  </div>

                  {/* Risk Gauge */}
                  <div className="flex justify-center py-4">
                    <RiskGauge score={result.scoring.risk_score} size={160} />
                  </div>

                  {/* Score Details */}
                  <div className="px-5 pb-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-background border border-border-main text-center">
                        <p className="text-lg font-bold text-text-main">{result.scoring.risk_score}</p>
                        <p className="text-[9px] text-text-muted">Risk Score</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border-main text-center">
                        <p className="text-lg font-bold text-text-main">{(result.scoring.model_roc_auc * 100).toFixed(1)}%</p>
                        <p className="text-[9px] text-text-muted">Model Accuracy</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ML Feature Signals */}
                {result.scoring.model_explanation && result.scoring.model_explanation.length > 0 && (
                  <div className="rounded-2xl border border-border-main bg-panel p-5">
                    <h4 className="text-xs font-bold text-text-main mb-3 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      ML Feature Signals
                    </h4>
                    <div className="space-y-2">
                      {result.scoring.model_explanation.map((signal, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background">
                          <span className="text-yellow-400 text-xs mt-0.5">▸</span>
                          <p className="text-[11px] text-text-muted">{signal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transaction ID */}
                <div className="rounded-2xl border border-border-main bg-panel p-4">
                  <p className="text-[10px] text-text-muted mb-1">Transaction ID</p>
                  <p className="text-xs font-mono text-text-main break-all">{result.transaction.transaction_id}</p>
                </div>

                {/* Open Copilot hint */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-center">
                  <p className="text-xs text-indigo-300 font-medium">
                    💡 This transaction is now in the Live Monitor.<br />
                    Click it there to open the AI Copilot for full analysis.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
