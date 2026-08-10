import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, ArrowRight } from "lucide-react";

const FREE_LIMITS = [
  "Up to 3 agents",
  "50 open tickets",
  "Email notifications",
  "Community support",
];

const PRO_BENEFITS = [
  "Unlimited agents",
  "Unlimited tickets",
  "Priority routing",
  "Advanced analytics",
  "Priority email support",
];

export default function BillingCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-5">
        <XCircle className="h-8 w-8 text-slate-400" />
      </div>

      <h1 className="text-2xl font-bold text-[#0F1B2D] mb-2">Upgrade cancelled</h1>
      <p className="text-slate-500 text-sm max-w-md mb-8">
        No worries — you're still on the Free plan. You can upgrade any time when you're ready.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 w-full max-w-lg mb-8 text-left">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <p className="text-sm font-semibold text-slate-500 mb-3">Free (current)</p>
          <ul className="space-y-2">
            {FREE_LIMITS.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[12px] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[#3159E8] bg-[#0F1B2D] p-4">
          <p className="text-sm font-semibold text-[#3159E8] mb-3">Pro — $29/mo</p>
          <ul className="space-y-2">
            {PRO_BENEFITS.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[12px] text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3159E8] shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-full border border-[#E2E8F0] px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <Link
          to="/dashboard/billing"
          className="flex items-center gap-2 rounded-full bg-[#3159E8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#284DD1] transition"
        >
          Try again <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
