"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function RevenueChart({
  todayHourly,
  yesterdayHourly,
}: {
  todayHourly: number[];
  yesterdayHourly: number[];
}) {
  const labels = Array.from({ length: 24 }, (_, h) =>
    h % 3 === 0 ? `${String(h).padStart(2, "0")}h` : ""
  );

  return (
    <div className="h-40">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Yesterday",
              data: yesterdayHourly,
              backgroundColor: "#e2e8f0",
              borderRadius: 3,
            },
            {
              label: "Today",
              data: todayHourly,
              backgroundColor: "#f16c1e",
              borderRadius: 3,
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: { boxWidth: 10, font: { size: 10 } },
            },
            tooltip: {
              callbacks: {
                title: (items) => `${String(items[0].dataIndex).padStart(2, "0")}:00`,
                label: (ctx) => {
                  const v = ctx.parsed.y ?? 0;
                  return ` ${ctx.dataset.label}: ₹${Math.round(v).toLocaleString("en-IN")}`;
                },
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: {
              grid: { color: "#f1f5f9" },
              ticks: {
                font: { size: 10 },
                callback: (v) => {
                  const n = typeof v === "number" ? v : Number(v);
                  return `₹${(n / 1000).toFixed(0)}k`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
