import { useEffect, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { UserPlus, Mail, Shield, ShieldCheck, Trash2 } from "lucide-react";
import { listUsers, inviteUser, updateUser, removeUser } from "@/lib/api";
import type { UserRead, UserRole } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Context = { user: UserRead };

const ROLE_BADGE: Record<UserRole, string> = {
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-violet-100 text-violet-700",
  agent: "bg-blue-100 text-blue-700",
};

export default function AgentsPage() {
  const { user } = useOutletContext<Context>();
  const token = getAccessToken()!;
  const isOwner = user.role === "owner";
  const isAdmin = user.role === "admin";
  const canInvite = isOwner || isAdmin;

  const [users, setUsers] = useState<UserRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", role: "agent" as UserRole });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<UserRead | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    listUsers(token)
      .then(setUsers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load team"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviting(true); setError(""); setSuccess("");

    if (!form.email.trim()) { setError("Email is required"); setInviting(false); return; }
    if (!form.first_name.trim()) { setError("First name is required"); setInviting(false); return; }
    if (!form.last_name.trim()) { setError("Last name is required"); setInviting(false); return; }

    try {
      const cleanForm = {
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role as UserRole,
      };
      const newUser = await inviteUser(token, cleanForm);
      setUsers((prev) => [...prev, newUser]);
      setSuccess(`Invite sent to ${cleanForm.email}`);
      setShowInvite(false);
      setForm({ email: "", first_name: "", last_name: "", role: "agent" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  async function toggleActive(u: UserRead) {
    try {
      const updated = await updateUser(token, u.id, { is_active: !u.is_active });
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch { /* swallow */ }
  }

  async function handleRemove() {
    if (!confirmRemove) return;
    setRemoving(true);
    try {
      await removeUser(token, confirmRemove.id);
      setUsers((prev) => prev.filter((x) => x.id !== confirmRemove.id));
      setSuccess(`${confirmRemove.first_name} ${confirmRemove.last_name} has been removed.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove user");
    } finally {
      setRemoving(false);
      setConfirmRemove(null);
    }
  }

  const invitableRoles: UserRole[] = isOwner ? ["admin", "agent"] : ["agent"];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D] tracking-tight">Team</h1>
          <p className="mt-0.5 text-sm text-slate-500">{users.length} members</p>
        </div>
        {canInvite && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-full bg-[#3159E8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#284DD1] transition"
          >
            <UserPlus className="h-4 w-4" /> Invite Member
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          ✓ {success}
        </div>
      )}

      {error && !showInvite && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Role explanation */}
      <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { role: "Owner", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", desc: "Full access. Manages billing, invites admins and agents, and configures the workspace." },
          { role: "Admin", icon: Shield, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100", desc: "Can invite agents, manage tickets and customers. Cannot access billing." },
          { role: "Agent", icon: Mail, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", desc: "Handles assigned tickets and can add comments. Cannot manage users or customers." },
        ].map(({ role, icon: Icon, color, bg, border, desc }) => (
          <div key={role} className={`rounded-xl border ${border} ${bg} p-4`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className={`text-sm font-semibold ${color}`}>{role}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Member</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Role</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Verified</th>
              {isOwner && <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-5 animate-pulse rounded bg-slate-100" /></td></tr>
              ))
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F8FAFC] transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-[11px] font-bold text-[#3159E8]">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-[#0F1B2D]">{u.first_name} {u.last_name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${ROLE_BADGE[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${u.is_active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] ${u.is_verified ? "text-emerald-600" : "text-slate-400"}`}>
                      {u.is_verified ? "✓ Verified" : "Pending"}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-5 py-3.5">
                      {u.id !== user.id ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleActive(u)}
                            className={`text-[11px] font-medium transition ${u.is_active ? "text-amber-500 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-800"}`}
                          >
                            {u.is_active ? "Deactivate" : "Reactivate"}
                          </button>
                          <span className="text-slate-200">|</span>
                          <button
                            onClick={() => setConfirmRemove(u)}
                            className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-700 transition"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[480px] rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#0F1B2D] mb-1">Invite Team Member</h2>
            <p className="text-[12px] text-slate-500 mb-5">
              They'll receive an email with a temporary password to log in.
            </p>
            <form onSubmit={handleInvite} className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-600">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">First name</label>
                  <input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} required placeholder="Jane" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Last name</label>
                  <input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} required placeholder="Smith" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Work email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required placeholder="jane@company.com" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]">
                  {invitableRoles.map((r) => (
                    <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  {form.role === "admin" ? "Admins can manage tickets, customers, and invite agents." : "Agents handle assigned tickets and cannot manage users."}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowInvite(false); setError(""); }} className="flex-1 rounded-full border border-[#E2E8F0] py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={inviting} className="flex-1 rounded-full bg-[#3159E8] py-2.5 text-sm font-semibold text-white hover:bg-[#284DD1] transition disabled:opacity-60">
                  {inviting ? "Sending invite…" : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[400px] rounded-xl bg-white p-6 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-base font-bold text-[#0F1B2D] mb-1">Remove team member?</h2>
            <p className="text-[13px] text-slate-500 mb-5">
              <strong>{confirmRemove.first_name} {confirmRemove.last_name}</strong> will be permanently removed and immediately logged out. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                disabled={removing}
                className="flex-1 rounded-full border border-[#E2E8F0] py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
