"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Line } from "react-chartjs-2";
import type { Chart as ChartJSType, TooltipModel } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { MoreHorizontal } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// ── Vertical crosshair on hover ───────────────────────────────────────────────
const crosshairPlugin = {
  id: "crosshair",
  afterDraw(chart: ChartJSType) {
    const els = chart.tooltip?.getActiveElements();
    if (!els?.length) return;
    const { ctx, chartArea } = chart;
    const x = els[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  },
};

// ── Glowing dot on hover ──────────────────────────────────────────────────────
const pointGlowPlugin = {
  id: "pointGlow",
  afterDatasetsDraw(chart: ChartJSType) {
    const els = chart.tooltip?.getActiveElements();
    if (!els?.length) return;
    const el = els[0].element as { x: number; y: number };
    const { ctx } = chart;
    ctx.save();
    ctx.shadowColor = "#f97316";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(el.x, el.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#f97316";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  },
};

ChartJS.register(crosshairPlugin as Parameters<typeof ChartJS.register>[0]);
ChartJS.register(pointGlowPlugin as Parameters<typeof ChartJS.register>[0]);

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.round(v)}`;
}

function useCounter(target: number, ms = 650) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / ms, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * ease));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, ms]);
  return val;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type TipState = { visible: boolean; x: number; y: number; label: string; value: number };

// ── Component ─────────────────────────────────────────────────────────────────
export function RevenueChart({
  todayHourly,
  weeklyRevenue,
  weeklyLabels,
  weeklyDates,
  weeklyRideCount,
  weeklyDelta,
}: {
  todayHourly: number[];
  weeklyRevenue?: number[];
  weeklyLabels?: string[];
  weeklyDates?: string[];
  weeklyRideCount?: number;
  weeklyDelta?: number | null;
}) {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const [tip, setTip] = useState<TipState>({ visible: false, x: 0, y: 0, label: "", value: 0 });
  const [peakPos, setPeakPos] = useState<{ x: number; y: number } | null>(null);
  const chartRef = useRef<ChartJSType<"line"> | null>(null);
  const isWeekly = view === "weekly";

  const labels = isWeekly
    ? (weeklyLabels ?? Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`))
    : Array.from({ length: 24 }, (_, h) =>
        h % 3 === 0 ? `${String(h).padStart(2, "0")}:00` : ""
      );

  const chartData = isWeekly ? (weeklyRevenue ?? Array(7).fill(0)) : todayHourly;
  const totalRevenue = chartData.reduce((a, b) => a + b, 0);
  const totalRides = weeklyRideCount ?? 0;
  const avgPerRide = totalRides > 0 ? totalRevenue / totalRides : 0;

  const animTotal = useCounter(Math.round(totalRevenue));
  const animRides = useCounter(totalRides);
  const animAvgRaw = useCounter(Math.round(avgPerRide * 10));

  const hasRealData = chartData.some((v) => v > 0);
  const maxVal = hasRealData ? Math.max(...chartData) : 0;
  const maxIdx = hasRealData ? chartData.indexOf(maxVal) : -1;

  // After chart animates, capture the peak point's pixel position
  const capturePeak = useCallback(() => {
    if (!chartRef.current) return;
    const meta = chartRef.current.getDatasetMeta(0);
    const el = meta.data[maxIdx] as { x: number; y: number } | undefined;
    if (el) setPeakPos({ x: el.x, y: el.y });
  }, [maxIdx]);

  // Recapture whenever view or data changes
  useEffect(() => {
    const id = setTimeout(capturePeak, 750);
    return () => clearTimeout(id);
  }, [capturePeak, chartData]);

  // Custom HTML tooltip
  const externalTooltip = useCallback(
    (context: { chart: ChartJSType; tooltip: TooltipModel<"line"> }) => {
      const { tooltip } = context;
      if (tooltip.opacity === 0) {
        setTip((p) => ({ ...p, visible: false }));
        return;
      }
      const dp = tooltip.dataPoints?.[0];
      if (!dp) return;
      setTip({
        visible: true,
        x: tooltip.caretX,
        y: tooltip.caretY,
        label: dp.label,
        value: dp.parsed.y ?? 0,
      });
    },
    []
  );

  const peakDateLabel =
    isWeekly && weeklyDates?.[maxIdx]
      ? `${labels[maxIdx]}, ${weeklyDates[maxIdx]}`
      : labels[maxIdx];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-6 pt-5 pb-0">
        <div>
          <h2 className="text-[15px] font-bold text-slate-800">Ride Revenue</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {isWeekly ? "Last 7 days" : "Today hourly"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {(["weekly", "monthly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setPeakPos(null); }}
              className={
                view === v
                  ? "rounded-lg border border-orange-400 px-3.5 py-1.5 text-xs font-semibold text-orange-500 transition-all"
                  : "rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-all"
              }
            >
              {v === "weekly" ? "Weekly" : "Today"}
            </button>
          ))}
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className="flex flex-wrap items-end gap-5 px-6 pt-4 pb-3">
        <div>
          <div className="text-[11px] font-medium text-slate-400">Total</div>
          <div className="mt-0.5 text-xl font-bold text-slate-900">{fmt(animTotal)}</div>
        </div>
        {isWeekly && totalRides > 0 && (
          <>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Rides</div>
              <div className="mt-0.5 text-xl font-bold text-slate-900">
                {animRides.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Average per ride</div>
              <div className="mt-0.5 text-xl font-bold text-slate-900">
                ₹{(animAvgRaw / 10).toFixed(1)}
              </div>
            </div>
          </>
        )}
        {weeklyDelta !== null && weeklyDelta !== undefined && (
          <span
            className={`mb-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              weeklyDelta >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {weeklyDelta >= 0 ? "↑" : "↓"} {Math.abs(weeklyDelta)}% vs last 7 days
          </span>
        )}
      </div>

      {/* ── Chart ── */}
      <div className="relative h-56">
        {/* Peak annotation – anchored to actual chart point */}
        {peakPos && hasRealData && (
          <div
            className="pointer-events-none absolute z-10 flex flex-col items-center"
            style={{ left: peakPos.x, top: Math.max(4, peakPos.y - 62), transform: "translateX(-50%)" }}
          >
            <div className="rounded-xl bg-slate-700/90 px-3 py-1.5 text-center shadow-lg backdrop-blur-sm">
              <div className="text-[10px] font-medium text-slate-300">{peakDateLabel}</div>
              <div className="text-sm font-bold text-white">{fmt(maxVal)}</div>
            </div>
            {/* connector dot + line */}
            <div className="h-2.5 w-px bg-slate-400/40" />
            <div className="h-2 w-2 rounded-full border-2 border-orange-500 bg-white" />
          </div>
        )}

        {/* Hover tooltip */}
        {tip.visible && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-xl"
            style={{ left: tip.x, top: Math.max(4, tip.y - 52) }}
          >
            <div className="text-[10px] font-medium text-slate-400">{tip.label}</div>
            <div className="mt-0.5 text-sm font-bold text-slate-900">{fmt(tip.value)}</div>
          </div>
        )}

        <Line
          ref={chartRef}
          data={{
            labels,
            datasets: [
              {
                label: "Revenue",
                data: chartData,
                borderColor: "#f97316",
                backgroundColor: (ctx) => {
                  const chart = ctx.chart;
                  const { ctx: c, chartArea } = chart;
                  if (!chartArea) return "transparent";
                  const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                  grad.addColorStop(0, "rgba(249,115,22,0.20)");
                  grad.addColorStop(0.55, "rgba(249,115,22,0.08)");
                  grad.addColorStop(1, "rgba(249,115,22,0.01)");
                  return grad;
                },
                borderWidth: 2.5,
                fill: true,
                tension: 0.42,
                // Always show dots on each data point
                pointRadius: 4,
                pointBackgroundColor: "#f97316",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointHoverRadius: 0, // glow plugin takes over on hover
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            interaction: { mode: "index", intersect: false },
            layout: { padding: { top: 8, left: 8, right: 8, bottom: 0 } },
            animation: {
              duration: 700,
              easing: "easeInOutCubic",
              onComplete: capturePeak,
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: false,
                external: externalTooltip as (ctx: {
                  chart: ChartJSType;
                  tooltip: TooltipModel<"line">;
                }) => void,
              },
            },
            scales: {
              x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                  font: { size: 11 },
                  color: "#94a3b8",
                  maxRotation: 0,
                },
              },
              y: {
                position: "right",          // ← Y-axis on the right
                grid: {
                  color: "rgba(226,232,240,0.6)",
                },
                border: { display: false, dash: [4, 4] },
                ticks: {
                  font: { size: 11 },
                  color: "#94a3b8",
                  maxTicksLimit: 5,
                  callback: (v) => {
                    const n = typeof v === "number" ? v : Number(v);
                    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
                    return n > 0 ? `₹${n}` : "";
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
