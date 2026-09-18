"use client";
import { Transaction } from "@/lib/api";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";
import { ShieldAlert, Zap, ShieldCheck, TrendingUp } from "lucide-react";

interface AnalyticsViewProps {
  transactions: Transaction[];
}

export default function AnalyticsView({ transactions }: AnalyticsViewProps) {
  // Aggregate data for risk distribution (Donut chart)
  const riskData = useMemo(() => {
    let safe = 0, medium = 0, critical = 0;
    transactions.forEach((tx) => {
      if (tx.risk_level === "Safe") safe++;
      else if (tx.risk_level === "Medium") medium++;
      else critical++;
    });
    return [
      { name: "Safe (Score < 40)", value: safe, color: "#22c55e" },
      { name: "Medium (Score 40-70)", value: medium, color: "#eab308" },
      { name: "Critical (Score > 70)", value: critical, color: "#ef4444" },
    ];
  }, [transactions]);

  // Aggregate data for risk score timeline (Smooth Area Chart)
  // We'll take the last 50 transactions to avoid cluttering the graph too much
  const timelineData = useMemo(() => {
    return [...transactions].reverse().slice(-50).map((tx, i) => ({
      index: i + 1,
      id: tx.transaction_id.slice(0, 6),
      score: tx.risk_score,
      amount: tx.amount,
      level: tx.risk_level,
    }));
  }, [transactions]);

  // Bar chart data (Volume by Channel)
  const channelData = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((tx) => {
      const ch = tx.channel || "Unknown";
      counts[ch] = (counts[ch] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      volume: count,
    }));
  }, [transactions]);

  const avgScore = transactions.length 
    ? Math.round(transactions.reduce((acc, tx) => acc + tx.risk_score, 0) / transactions.length) 
    : 0;
    
  const criticalVolume = transactions.filter(t => t.risk_level === "Critical").reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="flex flex-col h-full bg-background p-6 overflow-y-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-main tracking-tight">Fraud Analytics Overview</h2>
        <p className="text-sm text-text-muted mt-1">A simplified view of network health and emerging threats.</p>
      </div>

      {/* 1. KEY METRICS (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-panel border border-border-main p-5 rounded-xl shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Processed Txns</p>
            <p className="text-2xl font-bold text-text-main">{transactions.length}</p>
          </div>
        </div>
        <div className="bg-panel border border-border-main p-5 rounded-xl shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Avg Risk Score</p>
            <p className="text-2xl font-bold text-text-main">{avgScore} <span className="text-sm font-normal text-text-muted">/ 100</span></p>
          </div>
        </div>
        <div className="bg-panel border border-border-main p-5 rounded-xl shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Safe Ratio</p>
            <p className="text-2xl font-bold text-text-main">
              {transactions.length ? Math.round((riskData[0].value / transactions.length) * 100) : 0}%
            </p>
          </div>
        </div>
        <div className="bg-panel border border-border-main p-5 rounded-xl shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Critical Volume</p>
            <p className="text-2xl font-bold text-text-main">${criticalVolume.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 2. MAIN TREND CHART (Middle Row) */}
      <div className="bg-panel border border-border-main p-6 rounded-xl shadow-sm mb-8">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h3 className="text-base font-bold text-text-main">Recent Fraud Activity Trend</h3>
            <p className="text-sm text-text-muted mt-1">Tracking the risk scores of the last 50 transactions in real-time. Spikes indicate potential coordinated attacks.</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
              <XAxis 
                dataKey="index" 
                stroke="var(--text-muted)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `Tx #${val}`} 
              />
              <YAxis 
                domain={[0, 100]} 
                ticks={[0, 25, 50, 75, 100]}
                stroke="var(--text-muted)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border-main)', borderRadius: 12, color: 'var(--text-main)', fontSize: 13, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
                labelFormatter={(val) => `Transaction #${val}`}
              />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Critical Threat Zone', fill: '#ef4444', fontSize: 12, fontWeight: 600 }} />
              <Area
                type="monotone"
                dataKey="score"
                name="Risk Score"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorScore)"
                animationDuration={800}
                activeDot={{ r: 6, fill: "#8b5cf6", stroke: "var(--background)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. SECONDARY METRICS (Bottom Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Simplified Donut Chart */}
        <div className="bg-panel border border-border-main p-6 rounded-xl shadow-sm flex flex-col items-center">
          <div className="self-start mb-6">
            <h3 className="text-base font-bold text-text-main">Threat Breakdown</h3>
            <p className="text-sm text-text-muted mt-1">What percentage of traffic is risky?</p>
          </div>
          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={800}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border-main)', borderRadius: 12, color: 'var(--text-main)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom clean legend */}
          <div className="flex flex-col gap-3 w-full mt-2 bg-background p-4 rounded-lg border border-border-main">
            {riskData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                  <span className="font-medium text-text-main">{d.name}</span>
                </div>
                <span className="font-bold text-text-muted">{d.value} txns</span>
              </div>
            ))}
          </div>
        </div>

        {/* Simplified Bar Chart */}
        <div className="bg-panel border border-border-main p-6 rounded-xl shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-text-main">Network Utilization</h3>
            <p className="text-sm text-text-muted mt-1">Where are transactions originating?</p>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip
                  cursor={{ fill: 'var(--panel-hover)' }}
                  contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border-main)', borderRadius: 12, color: 'var(--text-main)', fontSize: 13 }}
                />
                <Bar dataKey="volume" name="Transactions" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
