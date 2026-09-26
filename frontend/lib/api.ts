/** API helpers for AI Scam Shield */

const API_BASE = "http://localhost:8000";

export interface Transaction {
  transaction_id: string;
  amount: number;
  sender_name: string;
  sender_account_id: string;
  beneficiary_name: string;
  beneficiary_bank: string;
  is_new_beneficiary: boolean;
  velocity_1hr: number;
  time_since_account_creation_days: number;
  transaction_type: string;
  channel: string;
  risk_score: number;
  risk_level: "Safe" | "Medium" | "Critical";
}

export interface CopilotResult {
  transaction_id: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  flags: string[];
  recommended_action: string;
  confidence: string;
  regulatory_note: string;
  fraud_pattern_match: string;
  retrieved_context: { source: string; excerpt: string }[];
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  session_id: string;
}

export async function fetchCopilotSummary(tx: Transaction): Promise<CopilotResult> {
  const res = await fetch(`${API_BASE}/copilot_summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAnalystChat(
  sessionId: string,
  transaction: Transaction,
  message: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/analyst_chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, transaction, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function clearChatSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/analyst_chat/${sessionId}`, { method: "DELETE" });
}

export function subscribeToTransactions(
  onTransaction: (tx: Transaction) => void,
  onError: (err: Event) => void
): EventSource {
  const es = new EventSource(`${API_BASE}/transactions`);
  es.onmessage = (e) => {
    try {
      onTransaction(JSON.parse(e.data) as Transaction);
    } catch {
      // ignore malformed
    }
  };
  es.onerror = onError;
  return es;
}

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

export async function createCase(
  transaction: Transaction,
  action_taken: string,
  copilot_summary: string = ""
): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction, action_taken, copilot_summary }),
  });
  if (!res.ok) throw new Error("Failed to create case");
  return res.json();
}

export async function fetchCases(status?: string): Promise<Case[]> {
  const url = status ? `${API_BASE}/cases?status=${status}` : `${API_BASE}/cases`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function updateCase(
  caseId: string,
  updates: Partial<Case>
): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases/${caseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update case");
  return res.json();
}

export async function generateSar(
  transaction: Transaction,
  copilot_summary: string = ""
) {
  const res = await fetch(`${API_BASE}/generate_sar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction, copilot_summary }),
  });
  if (!res.ok) throw new Error("Failed to generate SAR");
  return res.json();
}
