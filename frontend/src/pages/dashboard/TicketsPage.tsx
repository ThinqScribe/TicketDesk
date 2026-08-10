import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Plus, Filter } from "lucide-react";
import { listTickets, createTicket, listCustomers } from "@/lib/api";
import type { TicketRead, CustomerRead, UserRead, TicketStatus, TicketPriority } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Context = { user: UserRead };

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-100 text-red-600",
  high: "bg-orange-100 text-orange-600",
  normal: "bg-yellow-100 text-yellow-700",
  low: "bg-slate-100 text-slate-500",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-100 text-blue-600",
  pending: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-600",
  closed: "bg-slate-100 text-slate-500",
};

function ago(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TicketsPage() {
  const { user } = useOutletContext<Context>();
  const token = getAccessToken()!;
  const canCreate = user.role !== "agent";

  const [tickets, setTickets] = useState<TicketRead[]>([]);
  const [customers, setCustomers] = useState<CustomerRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "">("");

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", customer_id: "", priority: "normal" as TicketPriority });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    setLoading(true);
    setFetchError("");
    Promise.all([
      listTickets(token, {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
        limit: 100,
      }),
      canCreate ? listCustomers(token) : Promise.resolve([]),
    ])
      .then(([t, c]) => { setTickets(t); setCustomers(c); })
      .catch((err: unknown) => setFetchError(err instanceof Error ? err.message : "Failed to load tickets"))
      .finally(() => setLoading(false));
  }, [token, statusFilter, priorityFilter, canCreate]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_id) { setCreateError("Please select a customer"); return; }
    setCreating(true); setCreateError("");
    try {
      const t = await createTicket(token, {
        subject: form.subject,
        description: form.description,
        customer_id: parseInt(form.customer_id),
        priority: form.priority,
      });
      setTickets((prev) => [t, ...prev]);
      setShowCreate(false);
      setForm({ subject: "", description: "", customer_id: "", priority: "normal" });
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D] tracking-tight">Tickets</h1>
          <p className="mt-0.5 text-sm text-slate-500">{tickets.length} total</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-full bg-[#3159E8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#284DD1] transition"
          >
            <Plus className="h-4 w-4" /> New Ticket
          </button>
        )}
      </div>

      {/* Filters */}
      {fetchError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-[12px] text-red-600">{fetchError}</div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Filter className="h-4 w-4" /> Filter:
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "")}
          className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-slate-700 outline-none focus:border-[#3159E8]"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | "")}
          className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-slate-700 outline-none focus:border-[#3159E8]"
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">#</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Subject</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Priority</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-5 animate-pulse rounded bg-slate-100" /></td></tr>
              ))
            ) : tickets.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No tickets found</td></tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-[#F8FAFC] transition">
                  <td className="px-5 py-3.5 text-[12px] text-slate-400 font-mono">#{t.id}</td>
                  <td className="px-5 py-3.5">
                    <Link to={`/dashboard/tickets/${t.id}`} className="font-medium text-[#0F1B2D] hover:text-[#3159E8] transition">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLOR[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${PRIORITY_COLOR[t.priority]}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-400">{ago(t.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create ticket modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[520px] rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#0F1B2D] mb-5">New Ticket</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-600">{createError}</div>
              )}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Customer</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]"
                >
                  <option value="">Select customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  required
                  placeholder="Brief summary of the issue"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Describe the issue in detail…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8] resize-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-full border border-[#E2E8F0] py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 rounded-full bg-[#3159E8] py-2.5 text-sm font-semibold text-white hover:bg-[#284DD1] transition disabled:opacity-60">
                  {creating ? "Creating…" : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
