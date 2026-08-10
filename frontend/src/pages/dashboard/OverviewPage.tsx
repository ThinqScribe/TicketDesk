import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Ticket, Clock, CheckCircle2, Users, UserCog } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { getTicketStats, listTickets, listCustomers, listUsers } from "@/lib/api";
import type { TicketStats, TicketRead, CustomerRead, UserRead } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Context = { user: UserRead };

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-100 text-red-600",
  high: "bg-orange-100 text-orange-600",
  normal: "bg-yellow-100 text-yellow-700",
  low: "bg-slate-100 text-slate-500",
};

const STATUS_DOT: Record<string, string> = {
  open: "bg-blue-500",
  pending: "bg-amber-500",
  resolved: "bg-emerald-500",
  closed: "bg-slate-400",
};

const PRIORITY_BAR: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  normal: "bg-yellow-400",
  low: "bg-slate-300",
};

function ago(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function OverviewPage() {
  const { user } = useOutletContext<Context>();
  const token = getAccessToken()!;
  const canSeeAll = user.role !== "agent";

  const [stats, setStats] = useState<TicketStats | null>(null);
  const [recent, setRecent] = useState<TicketRead[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [agentCount, setAgentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTicketStats(token),
      listTickets(token, { limit: 5 }),
      canSeeAll ? listCustomers(token, 0, 1) : Promise.resolve([]),
      canSeeAll ? listUsers(token) : Promise.resolve([]),
    ])
      .then(([s, t, c, u]) => {
        setStats(s as TicketStats);
        setRecent(t as TicketRead[]);
        setCustomerCount((c as CustomerRead[]).length);
        setAgentCount(
          ((u as UserRead[]).filter((x) => x.role === "agent" && x.is_active)).length
        );
      })
      .catch((err) => console.error("Overview fetch error:", err))
      .finally(() => setLoading(false));
  }, [token, canSeeAll]);

  const open = stats?.by_status.open ?? 0;

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F1B2D] tracking-tight">Overview</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Welcome back, {user.first_name}! Here's what's happening.
        </p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[100px] rounded-xl border border-[#E2E8F0] bg-white animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard label="Open Tickets"  value={stats?.by_status.open ?? 0}     icon={Ticket}       iconBg="bg-blue-50"    iconColor="text-blue-500"    />
          <StatCard label="Pending"       value={stats?.by_status.pending ?? 0}  icon={Clock}        iconBg="bg-amber-50"   iconColor="text-amber-500"   />
          <StatCard label="Resolved"      value={stats?.by_status.resolved ?? 0} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
          {canSeeAll && (
            <StatCard label="Customers"   value={customerCount}                  icon={Users}        iconBg="bg-violet-50"  iconColor="text-violet-500"  />
          )}
          {canSeeAll && (
            <StatCard label="Active Agents" value={agentCount}                   icon={UserCog}      iconBg="bg-orange-50"  iconColor="text-orange-500"  />
          )}
        </div>
      )}

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

        {/* Recent tickets */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-sm font-semibold text-[#0F1B2D]">Recent Tickets</h2>
            <Link to="/dashboard/tickets" className="text-[11px] font-medium text-[#3159E8] hover:underline flex items-center gap-1">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse bg-slate-50 mx-4 my-2 rounded" />
              ))
            ) : recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No tickets yet</p>
            ) : (
              recent.map((t) => (
                <Link
                  key={t.id}
                  to={`/dashboard/tickets/${t.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition"
                >
                  <div className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[t.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-[#0F1B2D]">{t.subject}</p>
                    <p className="text-[11px] text-slate-400">#{t.id}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${PRIORITY_COLOR[t.priority]}`}>
                    {t.priority}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">{ago(t.created_at)}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Priority + status breakdown */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-sm font-semibold text-[#0F1B2D]">Open by Priority</h2>
          </div>
          <div className="p-5 space-y-4">
            {(["urgent", "high", "normal", "low"] as const).map((p) => {
              const count = stats?.by_priority[p] ?? 0;
              const pct = open > 0 ? Math.round((count / open) * 100) : 0;
              return (
                <div key={p}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-slate-600 capitalize">{p}</span>
                    <span className="text-[12px] font-semibold text-[#0F1B2D]">
                      {count} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full transition-all ${PRIORITY_BAR[p]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status breakdown */}
          <div className="border-t border-[#E2E8F0] px-5 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">By Status</p>
            <div className="space-y-2">
              {(["open", "pending", "resolved", "closed"] as const).map((s) => {
                const count = stats?.by_status[s] ?? 0;
                return (
                  <div key={s} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} />
                      <span className="text-[12px] text-slate-600 capitalize">{s}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-[#0F1B2D]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
