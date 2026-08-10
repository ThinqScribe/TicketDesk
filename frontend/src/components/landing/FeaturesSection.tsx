import { Ticket, Users, BarChart2, Zap, type LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  iconClass: string
}

const FEATURES: Feature[] = [
  {
    icon: Ticket,
    title: 'Unified Ticket Queue',
    description:
      'Every request lands in one place. Assign, prioritise, and track tickets across your entire team without losing context.',
    iconClass: 'bg-indigo-50 text-[#4F46E5]',
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    description:
      'Owners, admins, and agents each see exactly what they need. Granular permissions keep your data clean and your team focused.',
    iconClass: 'bg-emerald-50 text-[#10B981]',
  },
  {
    icon: BarChart2,
    title: 'Live Analytics',
    description:
      'Track open/closed ratios, response times, and agent workload. Make decisions from live data, not stale spreadsheets.',
    iconClass: 'bg-amber-50 text-[#F59E0B]',
  },
  {
    icon: Zap,
    title: 'Per-Tenant Rate Limiting',
    description:
      'Redis-backed rate limiting keeps the platform stable under load — free and paid tiers each get their own quota.',
    iconClass: 'bg-rose-50 text-[#F43F5E]',
  },
]

function FeatureCard({ icon: Icon, title, description, iconClass }: Feature) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-bold text-[#0F1B2D] mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}

export default function FeaturesSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-14">
          <p className="text-[#4F46E5] text-sm font-semibold uppercase tracking-widest mb-3">
            What you get
          </p>
          <h2 className="text-4xl font-extrabold text-[#0F1B2D] tracking-tight">
            Everything your support team needs
          </h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto text-base">
            From ticket creation to resolution, TicketDesk has the tools to keep customers
            happy and agents productive.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

      </div>
    </section>
  )
}
