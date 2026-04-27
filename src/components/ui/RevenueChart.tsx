"use client";

import { useState, useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const WEEKLY_DATA = [
  { date: "Mon", revenue: 12400, rides: 84 },
  { date: "Tue", revenue: 18700, rides: 126 },
  { date: "Wed", revenue: 15200, rides: 103 },
  { date: "Thu", revenue: 21300, rides: 144 },
  { date: "Fri", revenue: 26800, rides: 181 },
  { date: "Sat", revenue: 31500, rides: 213 },
  { date: "Sun", revenue: 24600, rides: 166 },
];

const MONTHLY_DATA = [
  { date: "Jan", revenue: 342000, rides: 2310 },
  { date: "Feb", revenue: 298000, rides: 2015 },
  { date: "Mar", revenue: 415000, rides: 2803 },
  { date: "Apr", revenue: 387000, rides: 2614 },
  { date: "May", revenue: 462000, rides: 3121 },
  { date: "Jun", revenue: 510000, rides: 3445 },
  { date: "Jul", revenue: 489000, rides: 3302 },
  { date: "Aug", revenue: 534000, rides: 3607 },
  { date: "Sep", revenue: 498000, rides: 3363 },
  { date: "Oct", revenue: 571000, rides: 3856 },
  { date: "Nov", revenue: 612000, rides: 4131 },
  { date: "Dec", revenue: 683000, rides: 4612 },
];

type View = "weekly" | "monthly";

function formatRevenue(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
}

export function RevenueChart() {
  const [view, setView] = useState<View>("weekly");
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const data = view === "weekly" ? WEEKLY_DATA : MONTHLY_DATA;

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalRides = data.reduce((s, d) => s + d.rides, 0);
  const peak = data.reduce((a, b) => (b.revenue > a.revenue ? b : a));

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, "rgba(217,119,6,0.25)");
    gradient.addColorStop(1, "rgba(217,119,6,0.00)");
    chart.data.datasets[0].backgroundColor = gradient;
    chart.update("none");
  }, [view]);

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Revenue",
        data: data.map((d) => d.revenue),
        borderColor: "#d97706",
        borderWidth: 2.5,
        backgroundColor: "rgba(217,119,6,0.15)",
        fill: true,
        tension: 0.45,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: "#d97706",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: "#d97706",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options: Parameters<typeof Line>[0]["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeInOutQuart" },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#94a3b8",
        bodyColor: "#f1f5f9",
        borderColor: "#334155",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items) => items[0].label,
          label: (item) => {
            const idx = item.dataIndex;
            const d = data[idx];
            return [
              `Revenue : ${formatRevenue(d.revenue)}`,
              `Rides    : ${d.rides.toLocaleString()}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 12 },
        },
      },
      y: {
        position: "right",
        grid: {
          color: "rgba(148,163,184,0.10)",
        },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: "#94a3b8",
          font: { size: 12 },
          callback: (v) => formatRevenue(Number(v)),
          maxTicksLimit: 5,
        },
      },
    },
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#21262d] dark:bg-[#161b27]">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Ride Revenue
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {view === "weekly" ? "Last 7 days" : "Last 12 months"}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-[#30363d]">
          {(["weekly", "monthly"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === v
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {v === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-4 px-5 pb-4">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100">
            {formatRevenue(totalRevenue)}
          </p>
        </div>
        <div className="w-px bg-slate-100 dark:bg-[#21262d]" />
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Rides</span>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100">
            {totalRides.toLocaleString()}
          </p>
        </div>
        <div className="w-px bg-slate-100 dark:bg-[#21262d]" />
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Peak</span>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100">
            {peak.date} · {formatRevenue(peak.revenue)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 px-2 pb-4">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
