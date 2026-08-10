import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FD] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] rounded-xl border border-slate-200 bg-white p-10 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">

        {/* Logo */}
        <Link to="/" style={{ display: "block", lineHeight: 0, marginBottom: "2rem" }}>
          <img src="/Logo2.png" alt="TicketDesk" style={{ width: "130px", height: "auto" }} />
        </Link>

        {sent ? (
          /* Success state */
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Mail className="h-5 w-5 text-emerald-600" />
            </div>
            <h1 className="text-[22px] font-bold text-[#111A3A] tracking-tight">Check your inbox</h1>
            <p className="mt-2 text-[12px] text-slate-500 leading-relaxed">
              If <strong>{email}</strong> is registered, a reset link has been sent. Check your spam folder too.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-[12px] font-medium text-[#3159E8] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          /* Form state */
          <>
            <h1 className="text-[24px] font-bold text-[#111A3A] tracking-tight">Forgot password?</h1>
            <p className="mt-1 text-[12px] text-slate-500">
              Enter your email and we'll send you a reset link.
            </p>

            <form className="mt-6" onSubmit={handleSubmit}>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-600">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold text-[#111A3A]">
                  Email address
                </span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-[43px] w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-[#3159E8] focus:ring-2 focus:ring-[#3159E8]/10"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex h-[43px] w-full items-center justify-center gap-2 rounded-full bg-[#3159E8] text-[12px] font-semibold text-white shadow-[0_6px_16px_rgba(49,89,232,0.22)] transition hover:bg-[#284DD1] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Sending…" : "Send reset link"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <p className="mt-5 text-center text-[11px] text-slate-500">
                Remembered it?{" "}
                <Link to="/login" className="font-medium text-[#3159E8] hover:underline">
                  Sign in
                </Link>
              </p>

            </form>
          </>
        )}

      </div>
    </main>
  );
}
