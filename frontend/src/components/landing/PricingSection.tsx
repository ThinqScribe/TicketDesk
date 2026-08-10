import { CheckCircle2 } from 'lucide-react'

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for small teams getting started with structured support.',
    features: [
      'Up to 3 agents',
      '50 open tickets',
      'Email notifications',
      'Basic analytics',
      'Community support',
    ],
    cta: 'Get started free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For growing teams that need unlimited capacity and priority tooling.',
    features: [
      'Unlimited agents',
      'Unlimited tickets',
      'Priority routing',
      'Advanced analytics',
      'Stripe billing portal',
      'Priority email support',
    ],
    cta: 'Start Pro trial',
    highlighted: true,
  },
]

function PlanCard({ plan }: { plan: Plan }) {
  const { name, price, period, description, features, cta, highlighted } = plan

  return (
    <div
      className={`rounded-2xl p-8 border transition-all ${
        highlighted
          ? 'bg-[#0F1B2D] border-[#4F46E5] text-white'
          : 'bg-white border-[#E2E8F0] text-[#0F1B2D]'
      }`}
    >
      {highlighted && (
        <span className="inline-block bg-[#4F46E5] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
          Most popular
        </span>
      )}

      <h3 className="text-xl font-bold mb-1">{name}</h3>
      <p className={`text-sm mb-5 ${highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
        {description}
      </p>

      <div className="flex items-end gap-1 mb-6">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className={`text-sm mb-1 ${highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
          / {period}
        </span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <CheckCircle2
              className={`w-4 h-4 flex-shrink-0 ${
                highlighted ? 'text-[#4F46E5]' : 'text-[#10B981]'
              }`}
            />
            <span className={highlighted ? 'text-slate-300' : 'text-slate-600'}>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href="/signup"
        className={`block text-center font-semibold py-3 rounded-full transition-colors ${
          highlighted
            ? 'bg-[#4F46E5] hover:bg-[#6366F1] text-white'
            : 'bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F1B2D] border border-[#E2E8F0]'
        }`}
      >
        {cta}
      </a>
    </div>
  )
}

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-6 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-14">
          <p className="text-[#4F46E5] text-sm font-semibold uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-4xl font-extrabold text-[#0F1B2D] tracking-tight">
            Simple, honest pricing
          </h2>
          <p className="text-slate-500 mt-4 text-base">
            No hidden fees. Upgrade when your team grows, downgrade any time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

      </div>
    </section>
  )
}
