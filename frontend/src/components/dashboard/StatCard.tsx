import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, trendUp }: Props) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-[28px] font-bold tracking-tight text-[#0F1B2D]">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      {trend && (
        <p className={`mt-2 text-[11px] font-medium ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
          {trendUp ? "↑" : "↓"} {trend} <span className="text-slate-400 font-normal">vs last 7 days</span>
        </p>
      )}
    </div>
  );
}
