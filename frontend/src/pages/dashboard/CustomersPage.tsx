import { useEffect, useState } from "react";
import { Plus, Mail, Search } from "lucide-react";
import { listCustomers, createCustomer } from "@/lib/api";
import type { CustomerRead } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

function ago(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CustomersPage() {
  const token = getAccessToken()!;
  const [customers, setCustomers] = useState<CustomerRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    listCustomers(token, 0, 100)
      .then(setCustomers)
      .catch((err: unknown) => setFetchError(err instanceof Error ? err.message : "Failed to load customers"))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setError("");
    try {
      const c = await createCustomer(token, form);
      setCustomers((prev) => [c, ...prev]);
      setShowCreate(false);
      setForm({ name: "", email: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto">

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D] tracking-tight">Customers</h1>
          <p className="mt-0.5 text-sm text-slate-500">{customers.length} total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-full bg-[#3159E8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#284DD1] transition"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      {fetchError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-[12px] text-red-600">{fetchError}</div>
      )}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 w-72">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Name</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Email</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={3} className="px-5 py-3"><div className="h-5 animate-pulse rounded bg-slate-100" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-slate-400">No customers found</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#F8FAFC] transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-[11px] font-bold text-[#3159E8]">
                        {c.name[0]}
                      </div>
                      <span className="font-medium text-[#0F1B2D]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="text-[12px]">{c.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-400">{ago(c.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[420px] rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#0F1B2D] mb-5">Add Customer</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-600">{error}</div>}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Full name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Jane Smith" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required placeholder="jane@company.com" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-full border border-[#E2E8F0] py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 rounded-full bg-[#3159E8] py-2.5 text-sm font-semibold text-white hover:bg-[#284DD1] transition disabled:opacity-60">{creating ? "Adding…" : "Add Customer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
