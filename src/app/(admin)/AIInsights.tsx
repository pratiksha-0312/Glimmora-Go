import { TrendingUp, TrendingDown, Clock, MapPin } from "lucide-react";

type Insight = {
  type: "positive" | "negative" | "info" | "warning";
  title: string;
  detail: string;
};

const iconMap = {
  positive: { Icon: TrendingUp, bg: "bg-green-50", text: "text-green-600" },
  negative: { Icon: TrendingDown, bg: "bg-red-50", text: "text-red-600" },
  info: { Icon: Clock, bg: "bg-orange-50", text: "text-orange-500" },
  warning: { Icon: MapPin, bg: "bg-blue-50", text: "text-blue-600" },
};

export function AIInsights({ insights }: { insights: Insight[] }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-violet-700">
            AI
          </span>
          <h2 className="text-base font-semibold text-slate-900">AI Insights</h2>
        </div>
        <span className="text-xs font-medium text-slate-400">This week</span>
      </div>

      <ul className="flex-1 divide-y divide-slate-50 px-4 py-2">
        {insights.length === 0 ? (
          <li className="flex items-center justify-center py-10 text-sm text-slate-400">
            No insights available yet
          </li>
        ) : (
          insights.map((ins, i) => {
            const { Icon, bg, text } = iconMap[ins.type];
            return (
              <li key={i} className="flex gap-3 py-4">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg} ${text}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 leading-snug">
                    {ins.title}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                    {ins.detail}
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className="border-t border-slate-100 px-6 py-3">
        <button className="text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1">
          View all insights
          <span aria-hidden>›</span>
        </button>
      </div>
    </div>
  );
}
