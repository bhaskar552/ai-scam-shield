"use client";
import { Key, Webhook, Link2, Shield, Settings2, Code, Plus, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function IntegrationsView() {
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background p-8 overflow-y-auto animate-fade-in">
      <div className="max-w-4xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-main tracking-tight flex items-center gap-2">
            <Link2 className="w-6 h-6 text-indigo-500" />
            Integrations & APIs
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Connect AI Scam Shield to your existing SOC workflows, banking core, and case management systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* API Keys */}
          <div className="bg-panel border border-border-main p-6 rounded-xl flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-main">API Access</h3>
                <p className="text-xs text-text-muted">Manage your REST API keys</p>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Production Key</label>
                <div className="flex items-center gap-2 bg-background border border-border-main p-2 rounded-lg">
                  <code className="text-xs text-slate-300 font-mono flex-1 px-2">sk_live_59d8...f82a</code>
                  <button onClick={copyKey} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 transition-colors">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors mt-2">
              <Plus className="w-4 h-4" /> Generate New Key
            </button>
          </div>

          {/* Webhooks */}
          <div className="bg-panel border border-border-main p-6 rounded-xl flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-main">Webhooks</h3>
                <p className="text-xs text-text-muted">Push critical alerts to your systems</p>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Endpoint URL</label>
                <input 
                  type="text" 
                  defaultValue="https://soc.bank.com/api/v1/fraud-alerts"
                  className="w-full bg-background border border-border-main rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border-main">
                <span className="text-xs font-medium text-text-main">Trigger on Critical Alerts</span>
                <div className="w-8 h-4 bg-indigo-500 rounded-full relative cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Party Connectors */}
        <h3 className="text-lg font-bold text-text-main mb-4">Case Management Connectors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-panel border border-border-main p-5 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col items-start gap-4">
            <div className="flex w-full items-start justify-between">
              <div className="w-12 h-12 rounded-lg bg-[#0052CC]/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#0052CC]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                Active
              </span>
            </div>
            <div>
              <h4 className="font-bold text-text-main group-hover:text-indigo-400 transition-colors">Jira Service Desk</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">Automatically create Jira tickets for Medium and Critical risk transactions.</p>
            </div>
          </div>

          <div className="bg-panel border border-border-main p-5 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col items-start gap-4 opacity-75">
            <div className="flex w-full items-start justify-between">
              <div className="w-12 h-12 rounded-lg bg-[#81B5A1]/10 flex items-center justify-center">
                <Settings2 className="w-6 h-6 text-[#81B5A1]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-slate-500/10 text-slate-400 rounded-full border border-slate-500/20">
                Configure
              </span>
            </div>
            <div>
              <h4 className="font-bold text-text-main group-hover:text-indigo-400 transition-colors">ServiceNow</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">Export investigations and Copilot summaries to ServiceNow Incidents.</p>
            </div>
          </div>

          <div className="bg-panel border border-border-main p-5 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col items-start gap-4 opacity-75">
            <div className="flex w-full items-start justify-between">
              <div className="w-12 h-12 rounded-lg bg-[#4A154B]/10 flex items-center justify-center">
                <Code className="w-6 h-6 text-[#4A154B]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-slate-500/10 text-slate-400 rounded-full border border-slate-500/20">
                Configure
              </span>
            </div>
            <div>
              <h4 className="font-bold text-text-main group-hover:text-indigo-400 transition-colors">Slack SOC Channel</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">Push real-time critical fraud alerts to your security operations channel.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
