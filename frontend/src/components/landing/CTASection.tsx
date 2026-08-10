import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto bg-[#0F1B2D] rounded-3xl px-10 py-16 text-center relative overflow-hidden">

        {/* Glow orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#4F46E5]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            Your customers are waiting.
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Get your workspace live in minutes. No credit card required on the free plan.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-semibold px-8 py-4 rounded-full transition-colors text-base"
          >
            Create your workspace <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  )
}
