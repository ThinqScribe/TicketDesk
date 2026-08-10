import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV_LINKS = ['Home', 'Features', 'Pricing', 'Docs']

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="mx-auto max-w-[1600px] px-8 lg:px-14 xl:px-20 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" style={{ display: 'block', flexShrink: 0, lineHeight: 0 }}>
          <div style={{ width: '160px', height: '48px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <img
              src="/Logo2.png"
              alt="TicketDesk"
              style={{ width: '160px', height: 'auto', display: 'block' }}
            />
          </div>
        </Link>

        {/* Desktop centre links */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link}>
              <a href="#" className="text-slate-500 hover:text-[#4F46E5] text-sm font-medium transition-colors">
                {link}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop right CTAs */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-[#0F1B2D] transition-colors">
            Log in
          </Link>
          <Link
            to="/signup"
            className="bg-[#4F46E5] hover:bg-[#6366F1] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-slate-500"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-t border-[#E2E8F0] px-8 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="text-slate-600 text-sm font-medium">
              {link}
            </a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-[#E2E8F0]">
            <Link to="/login" className="text-sm font-medium text-slate-600">Log in</Link>
            <Link to="/signup" className="bg-[#4F46E5] text-white text-sm font-semibold px-4 py-2 rounded-full">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
