import { Link, useLocation } from 'react-router-dom';

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
        fill="#10B981"
        opacity="0.15"
      />
      <path
        d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12l2.5 2.5 4.5-4.5"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <ShieldIcon />
          <span className="text-white font-black text-xl tracking-tight">
            Entity<span className="text-emerald-400">Check</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              location.pathname === '/'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Verify
          </Link>
          <Link
            to="/about"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              location.pathname === '/about'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
