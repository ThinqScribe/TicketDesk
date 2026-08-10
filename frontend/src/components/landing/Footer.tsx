const FOOTER_LINKS = ['Privacy', 'Terms', 'Status', 'Docs']

export default function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white px-6 py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Logo */}
        <a href="/" style={{ display: 'block', lineHeight: 0, flexShrink: 0 }}>
          <div style={{ width: '140px', display: 'flex', alignItems: 'center' }}>
            <img
              src="/Logo2.png"
              alt="TicketDesk"
              style={{ width: '140px', height: 'auto', display: 'block' }}
            />
          </div>
        </a>

        <p className="text-sm text-slate-400">© 2026 TicketDesk. All rights reserved.</p>

        {/* Links */}
        <nav className="flex gap-6">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm text-slate-400 hover:text-[#4F46E5] transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>

      </div>
    </footer>
  )
}
