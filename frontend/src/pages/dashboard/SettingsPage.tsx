import { useOutletContext } from "react-router-dom";
import type { UserRead } from "@/lib/api";
import { updateUser } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { User, Lock, Bell } from "lucide-react";
import { useState } from "react";

type Context = { user: UserRead };

export default function SettingsPage() {
  const { user } = useOutletContext<Context>();
  const token = getAccessToken()!;

  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true); setProfileMsg(""); setProfileError("");
    try {
      await updateUser(token, user.id, { first_name: firstName, last_name: lastName });
      setProfileMsg("Profile updated.");
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F1B2D] tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Manage your profile and preferences.</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white mb-5">
        <div className="flex items-center gap-3 border-b border-[#E2E8F0] px-5 py-4">
          <User className="h-4 w-4 text-[#3159E8]" />
          <h2 className="text-sm font-semibold text-[#0F1B2D]">Profile</h2>
        </div>
        <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
          {profileMsg && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[12px] text-emerald-700">{profileMsg}</div>}
          {profileError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-600">{profileError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#3159E8]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-[#0F1B2D]">Email</label>
            <input value={user.email} disabled className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 outline-none cursor-not-allowed" />
            <p className="mt-1 text-[10px] text-slate-400">Email cannot be changed.</p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${user.is_verified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-700"}`}>
              {user.is_verified ? "✓ Verified" : "Email not verified"}
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize bg-violet-100 text-violet-700">{user.role}</span>
          </div>
          <button type="submit" disabled={savingProfile} className="rounded-full bg-[#3159E8] px-5 py-2 text-sm font-semibold text-white hover:bg-[#284DD1] transition disabled:opacity-60">
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Password — uses forgot-password flow (no current-password endpoint exists) */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white mb-5">
        <div className="flex items-center gap-3 border-b border-[#E2E8F0] px-5 py-4">
          <Lock className="h-4 w-4 text-[#3159E8]" />
          <h2 className="text-sm font-semibold text-[#0F1B2D]">Password</h2>
        </div>
        <div className="p-5">
          <p className="text-[12px] text-slate-500 mb-4">To change your password, use the forgot password flow — a reset link will be sent to your email.</p>
          <a
            href="/forgot-password"
            className="inline-flex items-center rounded-full border border-[#3159E8] px-5 py-2 text-sm font-semibold text-[#3159E8] hover:bg-[#3159E8] hover:text-white transition"
          >
            Send reset link
          </a>
        </div>
      </div>

      {/* Notifications — UI only, no backend endpoint */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-3 border-b border-[#E2E8F0] px-5 py-4">
          <Bell className="h-4 w-4 text-[#3159E8]" />
          <h2 className="text-sm font-semibold text-[#0F1B2D]">Notifications</h2>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: "New ticket assigned to me", defaultOn: true },
            { label: "Customer replies to my ticket", defaultOn: true },
            { label: "Ticket resolved", defaultOn: false },
            { label: "Weekly digest", defaultOn: true },
          ].map(({ label, defaultOn }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{label}</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked={defaultOn} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-[#3159E8] transition after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
