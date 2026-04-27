"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

type DayPoint = { date: string; rides: number; revenue: number };

export function ReportsCharts({
  days,
  channels,
}: {
  days: DayPoint[];
  channels: Record<string, number>;
}) {
  const barData = {
    labels: days.map((d) => d.date),
    datasets: [
      {
        label: "Rides",
        data: days.map((d) => d.rides),
        backgroundColor: "#f16c1e",
        borderRadius: 4,
      },
    ],
  };

  const lineData = {
    labels: days.map((d) => d.date),
    datasets: [
      {
        label: "Revenue (₹)",
        data: days.map((d) => d.revenue),
        borderColor: "#059669",
        backgroundColor: "rgba(5,150,105,0.12)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const channelLabels = Object.keys(channels);
  const channelData = {
    labels: channelLabels,
    datasets: [
      {
        data: channelLabels.map((k) => channels[k]),
        backgroundColor: [
          "#f16c1e",
          "#2563eb",
          "#059669",
          "#d97706",
          "#9333ea",
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Rides per day
        </h3>
        <div className="h-64">
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Revenue trend
        </h3>
        <div className="h-64">
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Booking channels
        </h3>
        {channelLabels.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No rides yet
          </div>
        ) : (
          <div className="mx-auto h-64 max-w-md">
            <Doughnut
              data={channelData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "right" as const } },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
