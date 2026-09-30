import { useState, useRef, useEffect } from 'react';
import ResultCard from '../components/ResultCard';

const MAX_HISTORY = 5;

function LoadingDots() {
  return (
    <div className="flex flex-col items-center py-14 gap-5 animate-fade-in">
      <div className="flex items-center gap-2.5">
        <span className="dot-pulse w-3.5 h-3.5 rounded-full bg-emerald-500 block" />
        <span className="dot-pulse w-3.5 h-3.5 rounded-full bg-emerald-500 block" />
        <span className="dot-pulse w-3.5 h-3.5 rounded-full bg-emerald-500 block" />
      </div>
      <div className="text-center">
        <p className="text-slate-700 font-semibold text-lg">Verifying with Companies House...</p>
        <p className="text-slate-400 text-sm mt-1">Searching the official UK registry</p>
      </div>
    </div>
  );
}

export default function Home() {
  // Form state
  const [query, setQuery] = useState('');
  const [address, setAddress] = useState('');
  const [town, setTown] = useState('');
  const [postcode, setPostcode] = useState('');
  const [showAddress, setShowAddress] = useState(false);

  // App state
  const [appState, setAppState] = useState('idle'); // idle | loading | done
  const [result, setResult] = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  // Search history (localStorage)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ec_history') || '[]'); }
    catch { return []; }
  });

  const inputRef = useRef(null);
  const resultRef = useRef(null);

  // Scroll to result when it appears
  useEffect(() => {
    if (appState === 'done' && resultRef.current) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [appState]);

  const saveHistory = (name) => {
    const updated = [name, ...history.filter(h => h !== name)].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem('ec_history', JSON.stringify(updated));
  };

  const runVerify = async (nameOverride) => {
    const name = (nameOverride ?? query).trim();
    if (!name) return;
    setLastQuery(name);
    setAppState('loading');
    setResult(null);

    try {
      const resp = await fetch('/api/resolve_candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: address.trim(),
          town: town.trim(),
          zip_code: postcode.trim(),
          threshold: 0.85
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setResult(data);
      saveHistory(name);
    } catch {
      setResult({ status: 'ERROR' });
    } finally {
      setAppState('done');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runVerify();
  };

  const handleReset = () => {
    setAppState('idle');
    setResult(null);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleHistoryClick = (name) => {
    setQuery(name);
    runVerify(name);
  };

  return (
    <div>
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 pt-16 pb-36 px-4 text-center relative overflow-hidden">
        {/* Subtle decorative orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* UK badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-7">
          <span className="text-base">🇬🇧</span>
          <span className="text-emerald-400 text-sm font-semibold">UK Companies House Verification</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-4 tracking-tight leading-none">
          Entity<span className="text-emerald-400">Check</span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg sm:text-xl max-w-sm mx-auto leading-relaxed">
          Instantly verify any UK registered company
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {[
            { icon: '🏛️', label: 'Official Registry' },
            { icon: '⚡', label: 'Instant Results' },
            { icon: '🔒', label: 'Secure & Private' }
          ].map(({ icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-slate-500 text-sm">
              <span>{icon}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Search Card (overlaps hero) ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-20 relative z-10 pb-12">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
          {/* Loading state */}
          {appState === 'loading' && <LoadingDots />}

          {/* Search form (shown when idle) */}
          {appState === 'idle' && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              {/* Main search bar */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    width="18" height="18" viewBox="0 0 24 24" fill="none"
                  >
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    required
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Enter company name..."
                    className="w-full pl-11 pr-4 py-3.5 text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all font-medium text-base placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-2 shadow-sm shadow-emerald-500/25"
                >
                  Verify →
                </button>
              </div>

              {/* Address toggle */}
              <button
                type="button"
                onClick={() => setShowAddress(v => !v)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
              >
                <span className={`inline-block transition-transform duration-200 ${showAddress ? 'rotate-45' : ''}`}>+</span>
                {showAddress ? 'Hide address details' : 'Add address details (optional)'}
              </button>

              {/* Collapsible address fields */}
              {showAddress && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-down pt-1">
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Street address"
                    className="px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-400"
                  />
                  <input
                    type="text"
                    value={town}
                    onChange={e => setTown(e.target.value)}
                    placeholder="Town / City"
                    className="px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-400"
                  />
                  <input
                    type="text"
                    value={postcode}
                    onChange={e => setPostcode(e.target.value)}
                    placeholder="Postcode"
                    className="px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all font-medium font-mono placeholder:text-slate-400"
                  />
                </div>
              )}
            </form>
          )}

          {/* Result (shown when done, inside card) */}
          {appState === 'done' && result && (
            <div ref={resultRef}>
              <ResultCard result={result} onReset={handleReset} queryName={lastQuery} />
            </div>
          )}
        </div>

        {/* ── Recent Search History ── */}
        {appState === 'idle' && history.length > 0 && (
          <div className="mt-5 animate-fade-in">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2.5 px-1">
              Recent searches
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map(name => (
                <button
                  key={name}
                  onClick={() => handleHistoryClick(name)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-150 shadow-sm"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 6v6l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {name}
                </button>
              ))}
              <button
                onClick={() => {
                  localStorage.removeItem('ec_history');
                  setHistory([]);
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ── Stats row ── */}
        {appState === 'idle' && (
          <div className="mt-8 grid grid-cols-3 gap-4 text-center animate-fade-in">
            {[
              { value: '5M+', label: 'Companies indexed' },
              { value: '97%', label: 'Accuracy rate' },
              { value: '<1s', label: 'Avg. response time' }
            ].map(({ value, label }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm">
                <p className="text-xl font-black text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
