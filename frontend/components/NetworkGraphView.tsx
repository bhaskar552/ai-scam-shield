"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Network, Info, ZoomIn, ZoomOut } from "lucide-react";
import { Transaction } from "@/lib/api";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  volume: number;
  riskMax: number;
  txCount: number;
}

interface Edge {
  source: string;
  target: string;
  amount: number;
  riskLevel: string;
  riskScore: number;
}

interface NetworkGraphViewProps {
  transactions: Transaction[];
}

function getRiskColor(score: number): string {
  if (score >= 70) return "#ef4444";
  if (score >= 40) return "#eab308";
  return "#22c55e";
}

export default function NetworkGraphView({ transactions }: NetworkGraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ w: 900, h: 600 });

  // Build graph data from transactions
  const graphData = useMemo(() => {
    const nodeMap = new Map<string, { volume: number; riskMax: number; txCount: number }>();
    const edgeList: Edge[] = [];

    transactions.forEach(tx => {
      const s = tx.sender_name;
      const t = tx.beneficiary_name;

      const sData = nodeMap.get(s) || { volume: 0, riskMax: 0, txCount: 0 };
      sData.volume += tx.amount;
      sData.riskMax = Math.max(sData.riskMax, tx.risk_score);
      sData.txCount += 1;
      nodeMap.set(s, sData);

      const tData = nodeMap.get(t) || { volume: 0, riskMax: 0, txCount: 0 };
      tData.volume += tx.amount;
      tData.riskMax = Math.max(tData.riskMax, tx.risk_score);
      tData.txCount += 1;
      nodeMap.set(t, tData);

      edgeList.push({
        source: s,
        target: t,
        amount: tx.amount,
        riskLevel: tx.risk_level,
        riskScore: tx.risk_score,
      });
    });

    // Filter to nodes with 2+ transactions, cap at 50
    const filteredEntries = Array.from(nodeMap.entries())
      .filter(([, d]) => d.txCount >= 2)
      .sort((a, b) => b[1].txCount - a[1].txCount)
      .slice(0, 50);

    const nodeIds = new Set(filteredEntries.map(([id]) => id));

    const graphNodes: Node[] = filteredEntries.map(([id, d], i) => ({
      id,
      label: id.split(" ")[0],
      x: dimensions.w / 2 + (Math.random() - 0.5) * 300,
      y: dimensions.h / 2 + (Math.random() - 0.5) * 300,
      vx: 0,
      vy: 0,
      volume: d.volume,
      riskMax: d.riskMax,
      txCount: d.txCount,
    }));

    const graphEdges = edgeList.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    return { nodes: graphNodes, edges: graphEdges };
  }, [transactions, dimensions]);

  // Initialize and run force simulation
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    nodesRef.current = graphData.nodes.map(n => ({ ...n }));
    setEdges(graphData.edges);

    let frame = 0;
    const maxFrames = 200;
    const cx = dimensions.w / 2;
    const cy = dimensions.h / 2;

    function simulate() {
      const ns = nodesRef.current;
      const damping = 0.85;

      // Repulsion
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          let dx = ns[i].x - ns[j].x;
          let dy = ns[i].y - ns[j].y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          let force = 8000 / (dist * dist);
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;
          ns[i].vx += fx;
          ns[i].vy += fy;
          ns[j].vx -= fx;
          ns[j].vy -= fy;
        }
      }

      // Attraction along edges
      const nodeIdx = new Map(ns.map((n, i) => [n.id, i]));
      for (const e of graphData.edges) {
        const si = nodeIdx.get(e.source);
        const ti = nodeIdx.get(e.target);
        if (si === undefined || ti === undefined) continue;
        let dx = ns[ti].x - ns[si].x;
        let dy = ns[ti].y - ns[si].y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let force = (dist - 120) * 0.02;
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        ns[si].vx += fx;
        ns[si].vy += fy;
        ns[ti].vx -= fx;
        ns[ti].vy -= fy;
      }

      // Center gravity + apply velocity
      for (const n of ns) {
        n.vx += (cx - n.x) * 0.005;
        n.vy += (cy - n.y) * 0.005;
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
        // Bounds
        n.x = Math.max(40, Math.min(dimensions.w - 40, n.x));
        n.y = Math.max(40, Math.min(dimensions.h - 40, n.y));
      }

      setNodes([...ns]);
      frame++;
      if (frame < maxFrames) {
        animRef.current = requestAnimationFrame(simulate);
      }
    }

    animRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animRef.current);
  }, [graphData, dimensions]);

  // Resize observer
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDimensions({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const suspiciousCount = useMemo(() => nodes.filter(n => n.riskMax >= 70).length, [nodes]);

  const selectedEdges = useMemo(() => {
    if (!selected) return [];
    return edges.filter(e => e.source === selected.id || e.target === selected.id);
  }, [selected, edges]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-3 border-b border-border-main bg-panel flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-text-main">Transaction Network Analysis</h2>
          <div className="flex items-center gap-4 ml-4 text-[10px] text-text-muted">
            <span><span className="font-bold text-text-main">{nodes.length}</span> nodes</span>
            <span><span className="font-bold text-text-main">{edges.length}</span> edges</span>
            <span className="text-red-400"><span className="font-bold">{suspiciousCount}</span> suspicious</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="p-1.5 rounded-lg hover:bg-panel-hover text-text-muted">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.3))} className="p-1.5 rounded-lg hover:bg-panel-hover text-text-muted">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-text-muted w-10 text-center">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* Graph area */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <Network className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Waiting for transactions...</p>
            <p className="text-xs mt-1">The network graph builds as transactions stream in</p>
          </div>
        )}

        <svg
          ref={svgRef}
          width={dimensions.w}
          height={dimensions.h}
          className="w-full h-full"
          style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
        >
          {/* Edges */}
          {edges.map((e, i) => {
            const s = nodeMap.get(e.source);
            const t = nodeMap.get(e.target);
            if (!s || !t) return null;
            const isHighlighted = selected && (e.source === selected.id || e.target === selected.id);
            return (
              <line
                key={i}
                x1={s.x} y1={s.y}
                x2={t.x} y2={t.y}
                stroke={getRiskColor(e.riskScore)}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={isHighlighted ? 0.8 : 0.15}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const radius = Math.max(6, Math.min(20, Math.sqrt(n.txCount) * 5));
            const isSelected = selected?.id === n.id;
            return (
              <g key={n.id} onClick={() => setSelected(isSelected ? null : n)} className="cursor-pointer">
                <circle
                  cx={n.x} cy={n.y} r={radius}
                  fill={getRiskColor(n.riskMax)}
                  fillOpacity={0.7}
                  stroke={isSelected ? "#fff" : getRiskColor(n.riskMax)}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeOpacity={isSelected ? 1 : 0.5}
                />
                <text
                  x={n.x} y={n.y + radius + 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={9}
                  fontWeight={500}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected node info panel */}
        {selected && (
          <div className="absolute top-4 right-4 w-72 bg-panel border border-border-main rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-text-main">{selected.id}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted text-xs hover:text-text-main">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-panel-hover rounded-lg p-2">
                <p className="text-[9px] text-slate-500">Total Volume</p>
                <p className="text-xs font-bold text-text-main">${selected.volume.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-panel-hover rounded-lg p-2">
                <p className="text-[9px] text-slate-500">Transactions</p>
                <p className="text-xs font-bold text-text-main">{selected.txCount}</p>
              </div>
              <div className="bg-panel-hover rounded-lg p-2">
                <p className="text-[9px] text-slate-500">Max Risk</p>
                <p className={`text-xs font-bold ${selected.riskMax >= 70 ? "text-red-500" : selected.riskMax >= 40 ? "text-yellow-500" : "text-emerald-500"}`}>
                  {selected.riskMax}
                </p>
              </div>
              <div className="bg-panel-hover rounded-lg p-2">
                <p className="text-[9px] text-slate-500">Connections</p>
                <p className="text-xs font-bold text-text-main">{selectedEdges.length}</p>
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Connected Accounts</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedEdges.map((e, i) => {
                const other = e.source === selected.id ? e.target : e.source;
                return (
                  <div key={i} className="flex items-center justify-between text-xs bg-panel-hover rounded p-1.5">
                    <span className="text-text-muted truncate max-w-[120px]">{other}</span>
                    <span className={`font-bold ${e.riskScore >= 70 ? "text-red-400" : e.riskScore >= 40 ? "text-yellow-400" : "text-emerald-400"}`}>
                      ${e.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-panel/80 backdrop-blur border border-border-main rounded-lg px-3 py-2 flex items-center gap-4">
          {[{ color: "#22c55e", label: "Safe" }, { color: "#eab308", label: "Medium" }, { color: "#ef4444", label: "Critical" }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] text-text-muted">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
