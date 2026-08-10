import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate("/login?reset=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-[#F6F8FD] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[13px] text-slate-500">Invalid or missing reset link.</p>
          <Link to="/forgot-password" className="mt-3 inline-block text-[12px] font-medium text-[#3159E8] hover:underline">
            Request a new one
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8FD] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] rounded-xl border border-slate-200 bg-white p-10 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">

        {/* Logo */}
        <Link to="/" style={{ display: "block", lineHeight: 0, marginBottom: "2rem" }}>
          <img src="/Logo2.png" alt="TicketDesk" style={{ width: "130px", height: "auto" }} />
        </Link>

        <h1 className="text-[24px] font-bold text-[#111A3A] tracking-tight">Set new password</h1>
        <p className="mt-1 text-[12px] text-slate-500">Choose a strong password for your account.</p>

        <form className="mt-6" onSubmit={handleSubmit}>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-600">
              {error}
            </div>
          )}

          {/* New password */}
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#111A3A]">New password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-[43px] w-full rounded-md border border-slate-200 bg-white pl-10 pr-10 text-[12px] outline-none placeholder:text-slate-400 focus:border-[#3159E8] focus:ring-2 focus:ring-[#3159E8]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {/* Confirm password */}
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#111A3A]">Confirm password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="h-[43px] w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-[#3159E8] focus:ring-2 focus:ring-[#3159E8]/10"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex h-[43px] w-full items-center justify-center gap-2 rounded-full bg-[#3159E8] text-[12px] font-semibold text-white shadow-[0_6px_16px_rgba(49,89,232,0.22)] transition hover:bg-[#284DD1] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Reset password"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

        </form>

      </div>
    </main>
  );
}
