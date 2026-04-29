"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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

// ── Detect dark mode reactively ────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

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
    ctx.strokeStyle = "rgba(148,163,184,0.35)";
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
  const isDark = useDarkMode();
  const isWeekly = view === "weekly";

  // Memoize to prevent new array references on every render
  const labels = useMemo(
    () =>
      isWeekly
        ? (weeklyLabels ?? Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`))
        : Array.from({ length: 24 }, (_, h) =>
            h % 3 === 0 ? `${String(h).padStart(2, "0")}:00` : ""
          ),
    [isWeekly, weeklyLabels]
  );

  const chartData = useMemo(
    () => (isWeekly ? (weeklyRevenue ?? Array(7).fill(0)) : todayHourly),
    [isWeekly, weeklyRevenue, todayHourly]
  );

  const totalRevenue = chartData.reduce((a, b) => a + b, 0);
  const totalRides = weeklyRideCount ?? 0;
  const avgPerRide = totalRides > 0 ? totalRevenue / totalRides : 0;

  const animTotal = useCounter(Math.round(totalRevenue));
  const animRides = useCounter(totalRides);
  const animAvgRaw = useCounter(Math.round(avgPerRide * 10));

  const hasRealData = chartData.some((v) => v > 0);
  const maxVal = hasRealData ? Math.max(...chartData) : 0;
  const maxIdx = hasRealData ? chartData.indexOf(maxVal) : -1;

  const capturePeak = useCallback(() => {
    if (!chartRef.current) return;
    const meta = chartRef.current.getDatasetMeta(0);
    const el = meta.data[maxIdx] as { x: number; y: number } | undefined;
    if (el) setPeakPos({ x: el.x, y: el.y });
  }, [maxIdx]);

  useEffect(() => {
    const id = setTimeout(capturePeak, 750);
    return () => clearTimeout(id);
  }, [capturePeak, chartData]);

  // Re-render chart when dark mode toggles so grid colors update
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
      setTimeout(capturePeak, 300);
    }
  }, [isDark, capturePeak]);

  // Bail out of setState when tooltip values haven't changed to break the loop:
  // setTip → re-render → Chart.js prop change → tooltip fires → setTip → ...
  const externalTooltip = useCallback(
    (context: { chart: ChartJSType; tooltip: TooltipModel<"line"> }) => {
      const { tooltip } = context;
      if (tooltip.opacity === 0) {
        setTip((p) => (p.visible ? { ...p, visible: false } : p));
        return;
      }
      const dp = tooltip.dataPoints?.[0];
      if (!dp) return;
      const x = tooltip.caretX;
      const y = tooltip.caretY;
      const label = dp.label;
      const value = dp.parsed.y ?? 0;
      setTip((p) => {
        if (p.visible && p.x === x && p.y === y && p.label === label && p.value === value) return p;
        return { visible: true, x, y, label, value };
      });
    },
    []
  );

  const peakDateLabel =
    isWeekly && weeklyDates?.[maxIdx]
      ? `${labels[maxIdx]}, ${weeklyDates[maxIdx]}`
      : labels[maxIdx];

  // Dynamic chart colors based on theme
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(226,232,240,0.6)";
  const tickColor = isDark ? "#4b5563" : "#94a3b8";
  const dotBorderColor = isDark ? "#1a1a1a" : "#fff";

  // Memoize data to prevent Chart.js from detecting a prop change on every tip re-render
  const chartLineData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Revenue",
        data: chartData,
        borderColor: "#f97316",
        backgroundColor: (ctx: { chart: ChartJSType }) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = (chart as ChartJSType & { chartArea: { top: number; bottom: number } });
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
        pointRadius: 4,
        pointBackgroundColor: "#f97316",
        pointBorderColor: dotBorderColor,
        pointBorderWidth: 2,
        pointHoverRadius: 0,
      },
    ],
  }), [labels, chartData, dotBorderColor]);

  const chartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    layout: { padding: { top: 8, left: 8, right: 8, bottom: 0 } },
    animation: {
      duration: 700,
      easing: "easeInOutCubic" as const,
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
        ticks: { font: { size: 11 }, color: tickColor, maxRotation: 0 },
      },
      y: {
        position: "right" as const,
        grid: { color: gridColor },
        border: { display: false, dash: [4, 4] },
        ticks: {
          font: { size: 11 },
          color: tickColor,
          maxTicksLimit: 5,
          callback: (v: number | string) => {
            const n = typeof v === "number" ? v : Number(v);
            if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
            return n > 0 ? `₹${n}` : "";
          },
        },
      },
    },
  }), [gridColor, tickColor, capturePeak, externalTooltip]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-6 pb-0 pt-5">
        <div>
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-[#f3f4f6]">Ride Revenue</h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-[#6b7280]">
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
                  : "rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-400 transition-all hover:text-slate-600 dark:text-[#6b7280] dark:hover:text-[#9ca3af]"
              }
            >
              {v === "weekly" ? "Weekly" : "Today"}
            </button>
          ))}
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 dark:text-[#6b7280] dark:hover:bg-[#252525]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className="flex flex-wrap items-end gap-5 px-6 pb-3 pt-4">
        <div>
          <div className="text-[11px] font-medium text-slate-400 dark:text-[#6b7280]">Total</div>
          <div className="mt-0.5 text-xl font-bold text-slate-900 dark:text-[#f9fafb]">{fmt(animTotal)}</div>
        </div>
        {isWeekly && totalRides > 0 && (
          <>
            <div>
              <div className="text-[11px] font-medium text-slate-400 dark:text-[#6b7280]">Rides</div>
              <div className="mt-0.5 text-xl font-bold text-slate-900 dark:text-[#f9fafb]">
                {animRides.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 dark:text-[#6b7280]">Average per ride</div>
              <div className="mt-0.5 text-xl font-bold text-slate-900 dark:text-[#f9fafb]">
                ₹{(animAvgRaw / 10).toFixed(1)}
              </div>
            </div>
          </>
        )}
        {weeklyDelta !== null && weeklyDelta !== undefined && (
          <span
            className={`mb-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              weeklyDelta >= 0
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            {weeklyDelta >= 0 ? "↑" : "↓"} {Math.abs(weeklyDelta)}% vs last 7 days
          </span>
        )}
      </div>

      {/* ── Chart ── */}
      <div className="relative h-56">
        {/* Peak annotation */}
        {peakPos && hasRealData && (
          <div
            className="pointer-events-none absolute z-10 flex flex-col items-center"
            style={{ left: peakPos.x, top: Math.max(4, peakPos.y - 62), transform: "translateX(-50%)" }}
          >
            <div className="rounded-xl bg-slate-700/90 px-3 py-1.5 text-center shadow-lg backdrop-blur-sm dark:bg-[#2a2a2a]/95">
              <div className="text-[10px] font-medium text-slate-300 dark:text-[#9ca3af]">{peakDateLabel}</div>
              <div className="text-sm font-bold text-white">{fmt(maxVal)}</div>
            </div>
            <div className="h-2.5 w-px bg-slate-400/40" />
            <div className="h-2 w-2 rounded-full border-2 border-orange-500 bg-white dark:bg-[#1a1a1a]" />
          </div>
        )}

        {/* Hover tooltip */}
        {tip.visible && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-xl dark:border-[#2a2a2a] dark:bg-[#222222]"
            style={{ left: tip.x, top: Math.max(4, tip.y - 52) }}
          >
            <div className="text-[10px] font-medium text-slate-400 dark:text-[#6b7280]">{tip.label}</div>
            <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-[#f9fafb]">{fmt(tip.value)}</div>
          </div>
        )}

        <Line
          ref={chartRef}
          data={chartLineData}
          options={chartOptions}
        />
      </div>
    </div>
  );
}
