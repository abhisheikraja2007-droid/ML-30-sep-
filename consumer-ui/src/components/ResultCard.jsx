/* ─── ResultCard.jsx ──────────────────────────────────────────────────────── */
/* Renders either a ✅ MATCH FOUND or ❌ NO MATCH card.                         */
/* All ML/internal fields (FAISS, entity_id, latency, cluster_size) are hidden. */

function CheckCircleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.2)" />
      <path d="M7.5 12l3 3 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        fill="rgba(255,255,255,0.2)"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="white" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="1" stroke="#10b981" strokeWidth="1.5" />
      <path d="M9 21V12h6v9" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 8h.01M12 8h.01M17 8h.01" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Success Card ─────────────────────────────────────────────────────────── */
function MatchFoundCard({ result, onReset }) {
  const confidence = result.confidence ?? 0;
  const pct = Math.round(confidence * 100);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-7 py-6 flex items-center gap-4">
        <div className="shrink-0">
          <CheckCircleIcon />
        </div>
        <div className="text-white">
          <p className="text-sm font-semibold opacity-75 uppercase tracking-wide">Verification Result</p>
          <h2 className="text-2xl font-black mt-0.5">Company Verified ✓</h2>
        </div>
      </div>

      {/* Body */}
      <div className="px-7 py-7 space-y-6">
        {/* Registered Name */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
            Registered Company Name
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            {result.canonical_name || 'Unknown'}
          </p>
        </div>

        {/* Company Number + Status badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="number-badge flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-mono font-bold text-lg">
            <BuildingIcon />
            <span>{result.matched_company_number || '—'}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-sm font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Registered &amp; Active
          </span>
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-slate-600">Verification Confidence</span>
            <span className="text-emerald-600 font-black text-lg">{pct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="confidence-bar h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
              style={{ '--target-width': `${pct}%`, width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {pct >= 95 ? 'Excellent match — high certainty' :
             pct >= 85 ? 'Strong match — confident result' :
             'Probable match — review recommended'}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* CTA */}
        <button
          onClick={onReset}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Search Another Company
        </button>
      </div>
    </div>
  );
}

/* ── No Match Card ────────────────────────────────────────────────────────── */
function NoMatchCard({ result, onReset, queryName }) {
  const topScore = result.top_candidate_score ?? 0;
  const showClosest = topScore > 0.5;
  const closestPct = Math.round(topScore * 100);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-6 flex items-center gap-4">
        <div className="shrink-0">
          <AlertTriangleIcon />
        </div>
        <div className="text-white">
          <p className="text-sm font-semibold opacity-75 uppercase tracking-wide">Verification Result</p>
          <h2 className="text-2xl font-black mt-0.5">Company Not Found</h2>
        </div>
      </div>

      {/* Body */}
      <div className="px-7 py-7 space-y-5">
        <p className="text-slate-600 text-base leading-relaxed">
          <span className="font-bold text-slate-800">"{queryName}"</span> could not be verified
          in the UK Companies House registry. Please check the company name and try again.
        </p>

        {/* Closest match bar (only if > 50%) */}
        {showClosest && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-amber-700">Closest match found</span>
              <span className="text-amber-700 font-black">{closestPct}%</span>
            </div>
            <div className="h-2.5 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="confidence-bar h-full rounded-full bg-amber-400"
                style={{ '--target-width': `${closestPct}%`, width: `${closestPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-slate-50 rounded-xl px-5 py-4">
          <p className="text-sm font-bold text-slate-700 mb-2.5">Tips to improve results:</p>
          <ul className="space-y-1.5 text-sm text-slate-500">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">→</span>
              Try removing <code className="bg-slate-200 px-1 rounded text-xs font-mono">Ltd</code>,{' '}
              <code className="bg-slate-200 px-1 rounded text-xs font-mono">Limited</code> or{' '}
              <code className="bg-slate-200 px-1 rounded text-xs font-mono">PLC</code> from the name
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">→</span>
              Double-check the spelling of the company name
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">→</span>
              Add the registered address for a more precise result
            </li>
          </ul>
        </div>

        <div className="border-t border-slate-100" />

        <button
          onClick={onReset}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors duration-200"
        >
          ← Try Again
        </button>
      </div>
    </div>
  );
}

/* ── Error Card ───────────────────────────────────────────────────────────── */
function ErrorCard({ onReset }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden animate-fade-in-up">
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-7 py-6 text-white">
        <p className="text-sm font-semibold opacity-75 uppercase tracking-wide mb-0.5">Connection Error</p>
        <h2 className="text-xl font-black">Service Unavailable</h2>
      </div>
      <div className="px-7 py-6 space-y-4">
        <p className="text-slate-600">
          Could not connect to the verification service. Please check your connection and try again.
        </p>
        <button onClick={onReset} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );
}

/* ── Main Export ──────────────────────────────────────────────────────────── */
export default function ResultCard({ result, onReset, queryName }) {
  if (!result) return null;

  if (result.status === 'MATCH_FOUND') {
    return <MatchFoundCard result={result} onReset={onReset} />;
  }
  if (result.status === 'NO_MATCH') {
    return <NoMatchCard result={result} onReset={onReset} queryName={queryName} />;
  }
  return <ErrorCard onReset={onReset} />;
}
