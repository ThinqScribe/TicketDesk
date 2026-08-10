import { Bell, Search, Plus, ChevronDown } from "lucide-react";
import type { UserRead } from "@/lib/api";

interface Props {
  user: UserRead;
  onCreateTicket?: () => void;
}

export default function TopBar({ user, onCreateTicket }: Props) {
  const companyName = user.company_name || "My Workspace";
  const initial = companyName[0]?.toUpperCase() ?? "T";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-6">

      {/* Left — workspace breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#EEF3FF]">
          <span className="text-[10px] font-bold text-[#3159E8]">{initial}</span>
        </div>
        <span className="font-medium text-[#0F1B2D]">{companyName}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </div>

      {/* Centre — search */}
      <div className="hidden md:flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 w-64">
        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <input
          placeholder="Search tickets, customers…"
          className="flex-1 bg-transparent text-[12px] text-slate-600 outline-none placeholder:text-slate-400"
        />
        <kbd className="hidden lg:inline text-[10px] text-slate-400 bg-slate-100 rounded px-1 py-0.5">⌘K</kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative text-slate-400 hover:text-slate-600 transition">
          <Bell className="h-5 w-5" />
        </button>

        <button
          onClick={onCreateTicket}
          className="flex items-center gap-1.5 rounded-full bg-[#3159E8] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#284DD1] transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Ticket
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3159E8] text-xs font-bold text-white cursor-pointer">
          {user.first_name[0]}{user.last_name[0]}
        </div>
      </div>

    </header>
  );
}
