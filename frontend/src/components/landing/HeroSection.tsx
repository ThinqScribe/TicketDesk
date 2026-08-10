import {
  ArrowRight,
  Play,
  Zap,
  Users,
  BarChart2,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CHAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function LiveChatCard() {
  return (
    <div
      className="
        absolute
        top-[16%]
        left-[8%]
        z-30
        flex
        items-center
        gap-3
        rounded-xl
        bg-white
        px-4
        py-3
        border
        border-slate-100
        shadow-[0_10px_30px_rgba(15,23,42,0.10)]
      "
    >
      {/* Avatars */}
      <div className="flex -space-x-2">
        <div
          className="
            h-8
            w-8
            rounded-full
            border-2
            border-white
            bg-gradient-to-br
            from-orange-200
            to-orange-400
          "
        />

        <div
          className="
            h-8
            w-8
            rounded-full
            border-2
            border-white
            bg-gradient-to-br
            from-amber-100
            to-yellow-400
          "
        />
      </div>

      <div>
        <p className="text-xs font-bold text-[#0F1B2D]">
          Live Chat
        </p>

        <p className="text-[10px] text-slate-400">
          2 Agents online
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT BUBBLE
// ─────────────────────────────────────────────────────────────────────────────

function ChatBubble() {
  return (
    <div
      className="
        absolute
        top-[43%]
        left-[2%]
        z-30
        flex
        items-end
        gap-2
      "
    >
      <div
        className="
          rounded-2xl
          rounded-br-md
          bg-[#3159E8]
          px-4
          py-3
          shadow-[0_10px_25px_rgba(49,89,232,0.22)]
        "
      >
        <p className="text-xs leading-relaxed text-white">
          Hi! How can we help
          <br />
          you today? 👋
        </p>
      </div>

      <div
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          border
          border-slate-100
          bg-white
          shadow-[0_5px_15px_rgba(15,23,42,0.12)]
        "
      >
        <MessageCircle className="h-5 w-5 text-[#3159E8]" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVED CARD
// ─────────────────────────────────────────────────────────────────────────────

function ResolvedCard() {
  return (
    <div
      className="
        absolute
        right-[3%]
        top-[56%]
        z-30
        flex
        items-center
        gap-3
        rounded-xl
        bg-white
        px-4
        py-3
        border
        border-slate-100
        shadow-[0_10px_30px_rgba(15,23,42,0.12)]
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-emerald-100
        "
      >
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      </div>

      <div>
        <p className="text-xs font-bold text-[#0F1B2D]">
          Ticket Resolved
        </p>

        <p className="text-[10px] text-slate-400">
          #1234 · 2m ago
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

const STATS = [
  {
    icon: Zap,
    label: "Faster",
    sub: "Response times",
    bg: "bg-blue-50",
  },
  {
    icon: Users,
    label: "Happier",
    sub: "Customers",
    bg: "bg-emerald-50",
  },
  {
    icon: BarChart2,
    label: "Smarter",
    sub: "Support",
    bg: "bg-violet-50",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────

export default function HeroSection() {
  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#F8FAFF]
      "
      style={{
        minHeight: "720px",
      }}
    >
      {/* ═════════════════════════════════════════════════════════════════════
          BACKGROUND GLOW
      ═════════════════════════════════════════════════════════════════════ */}

      <div
        className="
          pointer-events-none
          absolute
          right-[-180px]
          top-[60px]
          h-[700px]
          w-[700px]
          rounded-full
        "
        style={{
          background:
            "radial-gradient(circle, rgba(218,225,255,0.78) 0%, rgba(218,225,255,0) 70%)",
        }}
      />

      <div
        className="
          pointer-events-none
          absolute
          left-[38%]
          top-[28%]
          h-[550px]
          w-[550px]
          rounded-full
        "
        style={{
          background:
            "radial-gradient(circle, rgba(238,242,255,0.9) 0%, transparent 70%)",
        }}
      />

      {/* ═════════════════════════════════════════════════════════════════════
          MAIN CONTAINER
      ═════════════════════════════════════════════════════════════════════ */}

      <div
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-[1600px]
          px-8
          lg:px-14
          xl:px-20
        "
      >
        <div
          className="
            grid
            min-h-[720px]
            grid-cols-1
            lg:grid-cols-[47%_53%]
          "
        >
          {/* ═══════════════════════════════════════════════════════════════
              LEFT SIDE
          ═══════════════════════════════════════════════════════════════ */}

          <div
            className="
              relative
              z-20
              flex
              flex-col
              justify-center
              pt-24
              pb-20
              lg:pt-12
              lg:pb-12
              lg:pr-16
            "
          >
            {/* Heading */}

            <h1
              className="
                mb-7
                max-w-[820px]
                font-bold
                tracking-[-0.03em]
                text-[#111A3A]
              "
              style={{
                fontSize: "clamp(2.4rem, 3.8vw, 3.5rem)",
                lineHeight: "1.1",
              }}
            >
              Exceptional support.
              <br />

              Stronger{" "}
              <span className="text-[#3159E8]">
                relationships.
              </span>
            </h1>

            {/* Description */}

            <p
              className="
                mb-9
                max-w-[540px]
                text-[17px]
                leading-[1.65]
                text-slate-500
              "
            >
              Supportly helps teams deliver fast, personalized
              support across every channel. Happy customers.
              Loyal for life.
            </p>

            {/* CTA */}

            <div className="mb-11 flex flex-wrap items-center gap-8">
              <a
                href="/signup"
                className="
                  inline-flex
                  items-center
                  gap-4
                  rounded-full
                  bg-[#3159E8]
                  px-5
                  py-3.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_8px_20px_rgba(49,89,232,0.25)]
                  transition-all
                  hover:-translate-y-0.5
                  hover:bg-[#284DD1]
                "
              >
                Get Started Free

                <ArrowRight className="h-5 w-5" />
              </a>

              <a
                href="#demo"
                className="
                  inline-flex
                  items-center
                  gap-3
                  text-sm
                  font-semibold
                  text-[#3159E8]
                  transition-colors
                  hover:text-[#2345B8]
                "
              >
                Watch Demo

                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-[#3159E8]
                  "
                >
                  <Play
                    className="
                      ml-0.5
                      h-3
                      w-3
                      fill-current
                    "
                  />
                </span>
              </a>
            </div>

            {/* Stats */}

            <div className="flex flex-wrap items-center gap-9">
              {STATS.map(
                ({ icon: Icon, label, sub, bg }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-full
                        ${bg}
                      `}
                    >
                      <Icon className="h-5 w-5 text-[#3159E8]" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#111A3A]">
                        {label}
                      </p>

                      <p className="text-xs text-slate-500">
                        {sub}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT SIDE
          ═══════════════════════════════════════════════════════════════ */}

          <div
            className="
              relative
              hidden
              lg:block
            "
          >
            {/* Large glow behind woman */}

            <div
              className="
                absolute
                right-[-100px]
                top-[20%]
                z-0
                h-[600px]
                w-[600px]
                rounded-full
              "
              style={{
                background:
                  "radial-gradient(circle, rgba(215,224,255,0.85) 0%, rgba(215,224,255,0.25) 55%, transparent 72%)",
              }}
            />

            {/* Decorative dots */}

            <div
              className="
                absolute
                right-[1%]
                top-[47%]
                z-0
                grid
                grid-cols-6
                gap-3
                opacity-50
              "
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <span
                  key={i}
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[#B8C7F5]
                  "
                />
              ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                WOMAN
            ═══════════════════════════════════════════════════════════ */}

            <img
              src="/heroimage1.png"
              alt="Customer support specialist"
              className="
                absolute
                bottom-0
                right-[-65px]
                z-10
                h-[98%]
                w-auto
                max-w-none
                object-contain
                object-bottom
              "
              style={{
                filter:
                  "drop-shadow(0 20px 35px rgba(30,60,120,0.08))",
              }}
            />

            {/* ═══════════════════════════════════════════════════════════
                LIVE CHAT
            ═══════════════════════════════════════════════════════════ */}

            <LiveChatCard />

            {/* ═══════════════════════════════════════════════════════════
                CHAT MESSAGE
            ═══════════════════════════════════════════════════════════ */}

            <ChatBubble />

            {/* ═══════════════════════════════════════════════════════════
                RESOLVED
            ═══════════════════════════════════════════════════════════ */}

            <ResolvedCard />
          </div>
        </div>
      </div>
    </section>
  );
}