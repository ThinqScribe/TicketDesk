import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Users,
  UserCog,
  BarChart2,
  Settings,
  Bell,
  CreditCard,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { clearTokens } from "@/lib/auth";
import type { UserRead } from "@/lib/api";

interface Props {
  user: UserRead;
  subscription?: { subscription_tier: string; is_subscribed: boolean } | null;
}

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/dashboard/tickets", icon: Ticket, label: "Tickets" },
  { to: "/dashboard/customers", icon: Users, label: "Customers" },
  { to: "/dashboard/agents", icon: UserCog, label: "Agents" },
  { to: "/dashboard/reports", icon: BarChart2, label: "Reports" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
  { to: "/dashboard/notifications", icon: Bell, label: "Notifications" },
  { to: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

function NavItem({ to, icon: Icon, label, end }: { to: string; icon: React.ElementType; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-[#3159E8] text-white"
            : "text-slate-400 hover:bg-[#1e2a45] hover:text-white"
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

export default function Sidebar({ user, subscription }: Props) {
  const navigate = useNavigate();
  const tier = subscription?.subscription_tier ?? "free";
  const isPro = tier === "paid";

  function handleLogout() {
    clearTokens();
    navigate("/login");
  }

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col bg-[#0F1B2D] text-white">

      {/* Logo */}
      <div className="flex h-14 items-center px-5 border-b border-white/10">
        <img src="/Logo2.png" alt="TicketDesk" style={{ width: "120px", height: "auto" }} />
      </div>

      {/* Workspace switcher */}
      <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 cursor-pointer hover:bg-white/10 transition">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#3159E8] text-xs font-bold uppercase">
          {user.company_name?.[0] ?? user.first_name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[11px] font-semibold text-white leading-tight">
            {user.company_name || "My Workspace"}
          </p>
          <p className="truncate text-[10px] text-slate-400 leading-tight">
            {user.tenant_slug || ""}
          </p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Plan card */}
      <div className="mx-3 mb-3 rounded-lg bg-white/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Current Plan</span>
        </div>
        <p className={`text-sm font-bold ${isPro ? "text-amber-400" : "text-white"}`}>
          {isPro ? "⭐ Pro Plan" : "Free Plan"}
        </p>
        {!isPro && (
          <NavLink
            to="/dashboard/billing"
            className="mt-2 block w-full rounded-lg border border-[#3159E8] py-1.5 text-center text-[11px] font-semibold text-[#3159E8] hover:bg-[#3159E8] hover:text-white transition"
          >
            Upgrade to Pro
          </NavLink>
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3159E8] text-xs font-bold">
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[11px] font-semibold text-white">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-[10px] text-slate-400 capitalize">{user.role}</p>
          </div>
          <button onClick={handleLogout} title="Sign out" className="text-slate-400 hover:text-white transition">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}
