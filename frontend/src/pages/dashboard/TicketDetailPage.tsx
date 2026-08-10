import { useEffect, useState } from "react";
import { useParams, useOutletContext, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, Lock } from "lucide-react";
import { getTicket, updateTicket, listUsers, listTickets as _lt } from "@/lib/api";
import type { TicketRead, UserRead, TicketStatus, TicketPriority } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

// Comments API
const BASE = import.meta.env.VITE_API_URL ?? "";

async function fetchComments(token: string, ticketId: number) {
  const res = await fetch(`${BASE}/tickets/${ticketId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load comments");
  return res.json();
}

async function postComment(token: string, ticketId: number, body: string, is_internal: boolean) {
  const res = await fetch(`${BASE}/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ body, is_internal }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Failed to post comment");
  }
  return res.json();
}

interface Comment {
  id: number;
  body: string;
  is_internal: boolean;
  author_user_id: number | null;
  author_customer_id: number | null;
  author_name: string;
  author_initials: string;
  created_at: string;
}

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

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useOutletContext<Context>();
  const token = getAccessToken()!;
  const navigate = useNavigate();
  const ticketId = parseInt(id ?? "0");

  const [ticket, setTicket] = useState<TicketRead | null>(null);
  const [agents, setAgents] = useState<UserRead[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Comment form
  const [commentBody, setCommentBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [posting, setPosting] = useState(false);

  // Inline edit
  const [saving, setSaving] = useState(false);

  const isOwnerOrAdmin = user.role === "owner" || user.role === "admin";

  useEffect(() => {
    Promise.all([
      getTicket(token, ticketId),
      fetchComments(token, ticketId),
      isOwnerOrAdmin ? listUsers(token) : Promise.resolve([]),
    ])
      .then(([t, c, u]) => {
        setTicket(t as TicketRead);
        setComments(c as Comment[]);
        setAgents((u as UserRead[]).filter((x: UserRead) => x.role === "agent" || x.role === "admin" || x.role === "owner"));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load ticket"))
      .finally(() => setLoading(false));
  }, [ticketId, token, isOwnerOrAdmin]);

  async function handlePatch(patch: Partial<{ status: TicketStatus; priority: TicketPriority; assigned_agent_id: number }>) {
    if (!ticket) return;
    setSaving(true);
    try {
      const updated = await updateTicket(token, ticket.id, patch);
      setTicket(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setPosting(true);
    try {
      const c = await postComment(token, ticketId, commentBody, isInternal);
      setComments((prev) => [...prev, c]);
      setCommentBody("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#3159E8] border-t-transparent" />
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="max-w-[900px] mx-auto text-center pt-16">
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-[#3159E8] hover:underline">← Go back</button>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-[1100px] mx-auto">

      {/* Back */}
      <Link to="/dashboard/tickets" className="mb-5 inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-[#3159E8] transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
      </Link>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-[12px] text-red-600">{error}</div>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">

        {/* ── Left: ticket info + comments ── */}
        <div className="space-y-5">

          {/* Header card */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] text-slate-400 mb-1">Ticket #{ticket.id}</p>
                <h1 className="text-xl font-bold text-[#0F1B2D] leading-snug">{ticket.subject}</h1>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLOR[ticket.status]}`}>{ticket.status}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${PRIORITY_COLOR[ticket.priority]}`}>{ticket.priority}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            <p className="mt-4 text-[11px] text-slate-400">Opened {ago(ticket.created_at)}</p>
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white">
            <div className="border-b border-[#E2E8F0] px-5 py-4">
              <h2 className="text-sm font-semibold text-[#0F1B2D]">Comments ({comments.length})</h2>
            </div>

            <div className="divide-y divide-[#E2E8F0]">
              {comments.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-400">No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className={`px-5 py-4 ${c.is_internal ? "bg-amber-50" : ""}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF3FF] text-[10px] font-bold text-[#3159E8]">
                        {c.author_initials || (c.author_user_id ? "U" : "C")}
                      </div>
                      <span className="text-[11px] font-medium text-slate-600">
                        {c.author_name || (c.author_user_id ? `User #${c.author_user_id}` : `Customer #${c.author_customer_id}`)}
                      </span>
                      {c.is_internal && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">
                          <Lock className="h-2.5 w-2.5" /> Internal
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-slate-400">{ago(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed pl-9 whitespace-pre-wrap">{c.body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add comment */}
            <form onSubmit={handleComment} className="border-t border-[#E2E8F0] p-5">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={3}
                placeholder="Add a comment…"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8] resize-none"
              />
              <div className="mt-3 flex items-center justify-between">
                {isOwnerOrAdmin && (
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-500">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="accent-[#3159E8]"
                    />
                    Internal note (hidden from customer)
                  </label>
                )}
                <button
                  type="submit"
                  disabled={posting || !commentBody.trim()}
                  className="ml-auto flex items-center gap-2 rounded-full bg-[#3159E8] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#284DD1] transition disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right: controls ── */}
        <div className="space-y-4">

          {/* Status */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
            <select
              value={ticket.status}
              onChange={(e) => handlePatch({ status: e.target.value as TicketStatus })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8] disabled:opacity-50"
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority — owner/admin only */}
          {isOwnerOrAdmin && (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Priority</p>
              <select
                value={ticket.priority}
                onChange={(e) => handlePatch({ priority: e.target.value as TicketPriority })}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8] disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          )}

          {/* Assign agent — owner/admin only */}
          {isOwnerOrAdmin && (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned To</p>
              <select
                value={ticket.assigned_agent_id ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handlePatch({ assigned_agent_id: val ? parseInt(val) : undefined });
                }}
                disabled={saving}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8] disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.first_name} {a.last_name} ({a.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Meta */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Details</p>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Ticket ID</span>
              <span className="font-mono text-[#0F1B2D]">#{ticket.id}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Customer ID</span>
              <span className="font-mono text-[#0F1B2D]">#{ticket.customer_id}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Created</span>
              <span className="text-[#0F1B2D]">{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
            {ticket.closed_at && (
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Closed</span>
                <span className="text-[#0F1B2D]">{new Date(ticket.closed_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
