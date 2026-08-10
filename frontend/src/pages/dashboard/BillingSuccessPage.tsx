import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { getSubscription } from "@/lib/api";
import type { SubscriptionRead } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useSubscription } from "@/components/dashboard/DashboardLayout";

export default function BillingSuccessPage() {
  const token = getAccessToken()!;
  const [sub, setSub] = useState<SubscriptionRead | null>(null);
  const { refreshSubscription } = useSubscription();

  // Poll until Stripe webhook has updated the subscription
  useEffect(() => {
    let attempts = 0;
    const poll = async () => {
      try {
        const data = await getSubscription(token);
        if (data.is_subscribed && data.subscription_tier === "paid") {
          setSub(data);
          // Refresh subscription in the entire app
          await refreshSubscription();
          return;
        }
      } catch { /* ignore */ }
      if (attempts++ < 10) setTimeout(poll, 2000);
    };
    poll();
  }, [token, refreshSubscription]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-5">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h1 className="text-2xl font-bold text-[#0F1B2D]">You're on Pro!</h1>
        <Sparkles className="h-5 w-5 text-amber-500" />
      </div>

      <p className="text-slate-500 text-sm max-w-md mb-2">
        Your subscription is now active. You have access to unlimited agents, unlimited tickets, and all Pro features.
      </p>

      {sub?.current_period_end ? (
        <p className="text-[12px] text-slate-400 mb-6">
          Next renewal:{" "}
          <span className="font-medium text-slate-600">
            {new Date(sub.current_period_end).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </p>
      ) : (
        <p className="text-[12px] text-slate-400 mb-6 animate-pulse">
          Confirming your subscription…
        </p>
      )}

      <div className="flex gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-full bg-[#3159E8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#284DD1] transition"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/dashboard/billing"
          className="flex items-center gap-2 rounded-full border border-[#E2E8F0] px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          View Billing
        </Link>
      </div>
    </div>
  );
}
