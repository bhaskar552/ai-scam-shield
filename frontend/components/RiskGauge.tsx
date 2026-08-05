"use client";
import { useEffect, useRef } from "react";

interface RiskGaugeProps {
  score: number;
  level: string;
}

export default function RiskGauge({ score, level }: RiskGaugeProps) {
  const arcRef = useRef<SVGPathElement>(null);
  const needleRef = useRef<SVGLineElement>(null);

  const size = 180;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = 70;
  const strokeWidth = 12;

  // Score color
  const color =
    score >= 70 ? "#ef4444" : score >= 40 ? "#eab308" : "#22c55e";

  const bgColor =
    score >= 70 ? "#ef44441a" : score >= 40 ? "#eab3081a" : "#22c55e1a";

  // Arc math (180° sweep from left to right)
  const startAngle = -180;
  const endAngle = 0;
  const totalArc = endAngle - startAngle;
  const scoreAngle = startAngle + (score / 100) * totalArc;
  const scoreRad = (scoreAngle * Math.PI) / 180;

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function describeArc(startAng: number, endAng: number) {
    const start = polarToCartesian(startAng);
    const end = polarToCartesian(endAng);
    const largeArc = endAng - startAng > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const needleTip = {
    x: cx + (r - 4) * Math.cos(scoreRad),
    y: cy + (r - 4) * Math.sin(scoreRad),
  };

  const levelLabel =
    score >= 70 ? "CRITICAL" : score >= 40 ? "MEDIUM" : "SAFE";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.6 + 20 }}>
        <svg width={size} height={size * 0.6 + 30} viewBox={`0 0 ${size} ${size * 0.6 + 20}`}>
          {/* Background track */}
          <path
            d={describeArc(-180, 0)}
            fill="none"
            stroke="var(--border-main)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored arc (score fill) */}
          {score > 0 && (
            <path
              d={describeArc(-180, scoreAngle)}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 6px ${color}88)`,
                transition: "all 0.8s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            />
          )}

          {/* Glow dot at tip */}
          <circle
            cx={needleTip.x}
            cy={needleTip.y}
            r={6}
            fill={color}
            style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "all 0.8s ease" }}
          />

          {/* Score text */}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fill="var(--text-main)"
            className="font-bold"
            style={{ fontSize: 28, fontFamily: "var(--font-inter, sans-serif)", fontWeight: 700 }}
          >
            {score}
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            style={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-inter, sans-serif)" }}
          >
            / 100
          </text>
        </svg>

        {/* Level label below center */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold tracking-widest"
          style={{ background: bgColor, color, border: `1px solid ${color}44` }}
        >
          {levelLabel}
        </div>
      </div>
    </div>
  );
}
