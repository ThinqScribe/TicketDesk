import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyEmail } from "@/lib/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in this link.");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setMessage(res.message);
        setStatus("success");
      })
      .catch((err: unknown) => {
        setMessage(err instanceof Error ? err.message : "Verification failed.");
        setStatus("error");
      });
  }, [token]);

  return (
    <main className="min-h-screen bg-[#F6F8FD] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] rounded-xl border border-slate-200 bg-white p-10 shadow-[0_10px_40px_rgba(15,23,42,0.06)] text-center">

        {/* Logo */}
        <Link to="/" style={{ display: "inline-block", lineHeight: 0, marginBottom: "2rem" }}>
          <img src="/Logo2.png" alt="TicketDesk" style={{ width: "130px", height: "auto" }} />
        </Link>

        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#3159E8]" />
            <p className="mt-4 text-[13px] text-slate-500">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-[22px] font-bold text-[#111A3A] tracking-tight">Email verified!</h1>
            <p className="mt-2 text-[12px] text-slate-500">{message}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#3159E8] px-6 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#284DD1]"
            >
              Continue to sign in
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-[22px] font-bold text-[#111A3A] tracking-tight">Verification failed</h1>
            <p className="mt-2 text-[12px] text-slate-500">{message}</p>
            <Link
              to="/login"
              className="mt-6 inline-block text-[12px] font-medium text-[#3159E8] hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}

      </div>
    </main>
  );
}
