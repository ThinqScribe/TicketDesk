import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CreditCard, CheckCircle2, ArrowRight } from "lucide-react";
import { getSubscription, createCheckoutSession, createPortalSession } from "@/lib/api";
import type { SubscriptionRead, UserRead } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Context = { user: UserRead };

const FREE_FEATURES = ["Up to 3 agents", "50 open tickets", "Email notifications", "Basic analytics", "Community support"];
const PRO_FEATURES = ["Unlimited agents", "Unlimited tickets", "Priority routing", "Advanced analytics", "Stripe billing portal", "Priority email support"];

export default function BillingPage() {
  const { user } = useOutletContext<Context>();
  const token = getAccessToken()!;
  const [sub, setSub] = useState<SubscriptionRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (user.role !== "owner") { setLoading(false); return; }
    getSubscription(token).then(setSub).catch(() => {}).finally(() => setLoading(false));
  }, [token, user.role]);

  async function handleUpgrade() {
    setRedirecting(true);
    try {
      const { checkout_url } = await createCheckoutSession(token);
      window.location.href = checkout_url;
    } catch { setRedirecting(false); }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const { portal_url } = await createPortalSession(token);
      window.location.href = portal_url;
    } catch { setPortalLoading(false); }
  }

  if (user.role !== "owner") {
    return (
      <div className="max-w-[600px] mx-auto text-center pt-20">
        <CreditCard className="mx-auto h-10 w-10 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-[#0F1B2D]">Billing is owner-only</h2>
        <p className="mt-2 text-sm text-slate-500">Only workspace owners can manage billing and subscription.</p>
      </div>
    );
  }

  const isPro = sub?.is_subscribed && sub?.subscription_tier === "paid";

  return (
    <div className="max-w-[900px] mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F1B2D] tracking-tight">Billing</h1>
        <p className="mt-0.5 text-sm text-slate-500">Manage your subscription and plan.</p>
      </div>

      {loading ? (
        <div className="h-40 rounded-xl border border-[#E2E8F0] bg-white animate-pulse" />
      ) : (
        <>
          {/* Current plan banner */}
          <div className={`mb-6 rounded-xl border p-5 ${isPro ? "border-amber-200 bg-amber-50" : "border-[#E2E8F0] bg-white"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isPro ? "bg-amber-100" : "bg-slate-100"}`}>
                  <CreditCard className={`h-5 w-5 ${isPro ? "text-amber-600" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F1B2D]">
                    {isPro ? "⭐ Pro Plan" : "Free Plan"}
                  </p>
                  {isPro && sub?.current_period_end && (
                    <p className="text-[11px] text-slate-500">
                      Renews {new Date(sub.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                  {!isPro && <p className="text-[11px] text-slate-500">Limited to 3 agents and 50 open tickets</p>}
                </div>
              </div>
              {isPro && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-600">Active</span>
              )}
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Free */}
            <div className={`rounded-xl border p-6 ${!isPro ? "border-[#3159E8] ring-2 ring-[#3159E8]/20" : "border-[#E2E8F0]"} bg-white`}>
              <h3 className="text-lg font-bold text-[#0F1B2D]">Free</h3>
              <p className="mt-1 text-sm text-slate-500">For small teams getting started.</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-[#0F1B2D]">$0</span>
                <span className="mb-1 text-sm text-slate-400">/ forever</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              {!isPro && (
                <div className="mt-6 block w-full rounded-full border border-[#3159E8] py-2.5 text-center text-sm font-semibold text-[#3159E8]">
                  Current Plan
                </div>
              )}
            </div>

            {/* Pro */}
            <div className={`rounded-xl border p-6 ${isPro ? "border-amber-300 ring-2 ring-amber-200" : "border-[#E2E8F0]"} bg-[#0F1B2D] text-white`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Pro</h3>
                <span className="rounded-full bg-[#3159E8] px-2.5 py-0.5 text-[10px] font-bold">MOST POPULAR</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">Unlimited capacity and priority tooling.</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-extrabold">$29</span>
                <span className="mb-1 text-sm text-slate-400">/ month</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#3159E8]" /> {f}
                  </li>
                ))}
              </ul>
              {!isPro ? (
                <button
                  onClick={handleUpgrade}
                  disabled={redirecting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#3159E8] py-2.5 text-sm font-semibold text-white hover:bg-[#284DD1] transition disabled:opacity-60"
                >
                  {redirecting ? "Redirecting…" : "Upgrade to Pro"} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-amber-400 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-50 transition disabled:opacity-60"
                >
                  {portalLoading ? "Loading…" : "Manage Subscription"} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
}
