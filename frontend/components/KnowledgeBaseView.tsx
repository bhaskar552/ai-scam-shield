import { BookOpen, FileText, Database, ShieldAlert, Scale, RefreshCw } from "lucide-react";

export default function KnowledgeBaseView() {
  const documents = [
    {
      id: "fednow_risk_rules.txt",
      title: "FedNow & RTP Risk Guidelines",
      description: "Instant payment velocity limits and common APP (Authorized Push Payment) scam indicators.",
      icon: <ShieldAlert className="w-5 h-5 text-indigo-400" />,
      chunks: 12,
      lastUpdated: "2 days ago"
    },
    {
      id: "fraud_patterns.txt",
      title: "Known Fraud Patterns",
      description: "Signatures of account takeovers (ATO), mule networks, and synthetic identity fraud.",
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
      chunks: 18,
      lastUpdated: "5 hours ago"
    },
    {
      id: "regulatory_guidance.txt",
      title: "FinCEN & CFPB Regulations",
      description: "Regulatory requirements for SAR (Suspicious Activity Report) filing and liability frameworks.",
      icon: <Scale className="w-5 h-5 text-amber-400" />,
      chunks: 8,
      lastUpdated: "1 week ago"
    },
    {
      id: "scam_case_studies.txt",
      title: "Historical Scam Case Studies",
      description: "Real-world examples of romance scams, tech support scams, and pig butchering.",
      icon: <BookOpen className="w-5 h-5 text-rose-400" />,
      chunks: 14,
      lastUpdated: "Just now"
    },
    {
      id: "remediation_playbook.txt",
      title: "Analyst Remediation Playbook",
      description: "Standard operating procedures (SOP) for holding funds, contacting customers, and escalating.",
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      chunks: 5,
      lastUpdated: "3 days ago"
    }
  ];

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-text-main mb-1">AI Knowledge Base</h2>
          <p className="text-sm text-text-muted">
            These documents are currently embedded in ChromaDB. The AI Analyst Copilot uses these to generate RAG-based explanations.
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-panel-hover border border-border-main px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-400" />
          <span>Sync ChromaDB</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-panel-main border border-border-main rounded-xl p-5 hover:border-indigo-500/50 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-slate-800 transition-colors">
                {doc.icon}
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                {doc.id}
              </span>
            </div>
            <h3 className="font-semibold text-text-main text-base mb-2">{doc.title}</h3>
            <p className="text-xs text-text-muted mb-4 leading-relaxed line-clamp-2">
              {doc.description}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-border-main">
              <div className="flex items-center space-x-1">
                <Database className="w-3 h-3" />
                <span>{doc.chunks} Vector Chunks</span>
              </div>
              <span>Updated {doc.lastUpdated}</span>
            </div>
          </div>
        ))}

        {/* Upload new document placeholder */}
        <div className="bg-panel-main border border-dashed border-border-main rounded-xl p-5 flex flex-col items-center justify-center text-center hover:border-indigo-500/50 hover:bg-panel-hover transition-colors cursor-pointer min-h-[200px]">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3">
            <span className="text-xl text-slate-400">+</span>
          </div>
          <h3 className="font-semibold text-text-main text-sm mb-1">Upload Knowledge</h3>
          <p className="text-xs text-text-muted max-w-[200px]">
            Add new PDF or TXT files to expand the AI's fraud detection capabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
