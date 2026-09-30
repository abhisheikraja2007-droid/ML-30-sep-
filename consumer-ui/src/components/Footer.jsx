export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="1.5" />
            <path d="M12 6v6l4 2" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Data sourced from <strong className="text-slate-300">UK Companies House</strong></span>
        </div>

        <div className="flex items-center gap-4 text-slate-500 text-xs">
          <span>© 2024 EntityCheck</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Service Online
          </span>
        </div>
      </div>
    </footer>
  );
}
