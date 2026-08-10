import { useEffect, useState } from "react";
import { listTickets } from "@/lib/api";
import type { TicketRead } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function ReportsPage() {
  const token = getAccessToken()!;
  const [tickets, setTickets] = useState<TicketRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTickets(token, { limit: 100 }).then(setTickets).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "open").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;
  const closed = tickets.filter((t) => t.status === "closed").length;
  const urgent = tickets.filter((t) => t.priority === "urgent").length;

  const resolutionRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;

  const byPriority = (["urgent", "high", "normal", "low"] as const).map((p) => ({
    label: p,
    count: tickets.filter((t) => t.priority === p).length,
  }));

  const barColor: Record<string, string> = {
    urgent: "bg-red-500",
    high: "bg-orange-400",
    normal: "bg-yellow-400",
    low: "bg-slate-300",
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F1B2D] tracking-tight">Reports</h1>
        <p className="mt-0.5 text-sm text-slate-500">Ticket performance overview.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl border border-[#E2E8F0] bg-white animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Tickets", value: total, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Open", value: open, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
              { label: "Resolved", value: resolved + closed, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "Urgent", value: urgent, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl border border-[#E2E8F0] bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-medium text-slate-500">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-[#0F1B2D]">{value}</p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* Resolution rate */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-[#0F1B2D]">Resolution Rate</h2>
              <div className="flex items-center gap-6">
                <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                  <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="#3159E8" strokeWidth="3"
                      strokeDasharray={`${resolutionRate} ${100 - resolutionRate}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-2xl font-bold text-[#0F1B2D]">{resolutionRate}%</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Resolved", count: resolved, color: "bg-emerald-500" },
                    { label: "Closed", count: closed, color: "bg-slate-400" },
                    { label: "Open", count: open, color: "bg-blue-500" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                      <span className="text-[12px] text-slate-600">{label}</span>
                      <span className="ml-auto text-[12px] font-semibold text-[#0F1B2D]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* By priority */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-[#0F1B2D]">Tickets by Priority</h2>
              <div className="space-y-3">
                {byPriority.map(({ label, count }) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-slate-600 capitalize">{label}</span>
                        <span className="text-[12px] font-semibold text-[#0F1B2D]">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full transition-all ${barColor[label]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
