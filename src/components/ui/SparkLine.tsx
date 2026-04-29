"use client";

import { useState, useRef } from "react";

export function SparkLine({
  data,
  color,
  gradId,
}: {
  data: number[];
  color: string;
  gradId: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const w = 84, h = 36;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - 4 - ((v - min) / range) * (h - 10),
  ]);

  // Smooth cubic bezier path
  const line = pts
    .map((p, i) => {
      if (i === 0) return `M${p[0].toFixed(1)},${p[1].toFixed(1)}`;
      const prev = pts[i - 1];
      const cpX = (prev[0] + p[0]) / 2;
      return `C${cpX.toFixed(1)},${prev[1].toFixed(1)} ${cpX.toFixed(1)},${p[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    })
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  const hoveredPt = hoverIdx !== null ? pts[hoverIdx] : null;
  const hoveredVal = hoverIdx !== null ? data[hoverIdx] : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(frac * (data.length - 1))));
    setHoverIdx(idx);
  };

  return (
    <div className="relative select-none">
      <svg
        ref={svgRef}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="cursor-crosshair overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {hoveredPt && (
          <>
            <line
              x1={hoveredPt[0].toFixed(1)}
              y1="0"
              x2={hoveredPt[0].toFixed(1)}
              y2={h}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
            <circle cx={hoveredPt[0]} cy={hoveredPt[1]} r={5} fill={color} opacity="0.15" />
            <circle
              cx={hoveredPt[0]}
              cy={hoveredPt[1]}
              r={3}
              fill={color}
              stroke="white"
              strokeWidth="1.5"
            />
          </>
        )}
      </svg>

      {hoveredPt && hoveredVal !== null && (
        <div
          className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg whitespace-nowrap"
          style={{ left: hoveredPt[0] }}
        >
          {hoveredVal > 0
            ? `₹${Math.round(hoveredVal).toLocaleString("en-IN")}`
            : "0"}
        </div>
      )}
    </div>
  );
}
