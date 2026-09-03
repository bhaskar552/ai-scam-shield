"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import TransactionTable from "@/components/TransactionTable";
import CopilotPanel from "@/components/CopilotPanel";
import AlertQueueView from "@/components/AlertQueueView";
import AnalyticsView from "@/components/AnalyticsView";
import NotificationsView from "@/components/NotificationsView";
import SettingsView from "@/components/SettingsView";
import { Transaction, subscribeToTransactions } from "@/lib/api";

const MAX_ROWS = 500; // rolling window — keeps last 500 txns, stream never stops

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentView, setCurrentView] = useState("monitor");
  const esRef = useRef<EventSource | null>(null);

  const criticalCount = transactions.filter((t) => t.risk_level === "Critical").length;

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();
    const es = subscribeToTransactions(
      (tx) => {
        setConnected(true);
        setTransactions((prev) => {
          const updated = [tx, ...prev];
          // Keep a rolling window so memory stays bounded on long-running sessions
          return updated.length > MAX_ROWS ? updated.slice(0, MAX_ROWS) : updated;
        });
      },
      () => {
        setConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      }
    );
    esRef.current = es;
  }, []);

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, [connect]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        connected={connected} 
        txCount={transactions.length} 
        criticalCount={criticalCount} 
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border-main bg-background">
          <div>
            <h1 className="text-base font-bold text-text-main">
              {currentView === "monitor" && "Fraud Operations Center"}
              {currentView === "alerts" && "Alert Queue"}
              {currentView === "analytics" && "Live Analytics"}
              {currentView === "notifications" && "Notifications"}
              {currentView === "settings" && "Settings"}
            </h1>
            <p className="text-[11px] text-slate-500">
              Click any <span className="text-yellow-400 font-semibold">Medium</span> or{" "}
              <span className="text-red-400 font-semibold">Critical</span> transaction to open the AI Copilot
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Risk legend */}
            {[
              { color: "bg-emerald-500", label: "Safe" },
              { color: "bg-yellow-500", label: "Medium" },
              { color: "bg-red-500", label: "Critical" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs text-text-muted">{label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Views */}
        <div className="flex-1 overflow-hidden">
          {currentView === "monitor" && (
            <TransactionTable
              transactions={transactions}
              selectedId={selected?.transaction_id ?? null}
              onSelect={(tx) => setSelected(tx)}
            />
          )}
          {currentView === "alerts" && (
            <AlertQueueView transactions={transactions} onSelect={(tx) => setSelected(tx)} />
          )}
          {currentView === "analytics" && (
            <AnalyticsView transactions={transactions} />
          )}
          {currentView === "notifications" && <NotificationsView />}
          {currentView === "settings" && <SettingsView />}
        </div>
      </main>

      {/* Copilot Panel (slide-over) */}
      {selected && (
        <CopilotPanel
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
