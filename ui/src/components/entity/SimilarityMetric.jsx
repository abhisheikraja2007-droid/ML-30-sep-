import React from 'react';

export function SimilarityMetric({ label, score, description, isBoolean = false, boolValue = false }) {
  const pct = isBoolean ? (boolValue ? 100 : 0) : Math.round((score || 0) * 100);

  return (
    <div className="bg-[#E9E2D5] border border-[#C7C0B4] rounded-xl p-5 space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#252522]">{label}</span>
        <span className="font-mono text-xl font-extrabold text-[#252522]">
          {isBoolean ? (boolValue ? 'AGREEMENT (100%)' : 'MISMATCH (0%)') : `${pct}%`}
        </span>
      </div>

      <div className="w-full bg-[#E6E0D4] rounded-full h-3 overflow-hidden border border-[#C7C0B4]/40">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${
            pct >= 85 ? 'bg-[#58704F]' : pct >= 65 ? 'bg-[#A8782E]' : 'bg-[#A34B40]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {description && (
        <p className="text-xs text-[#5E5A51] font-medium">{description}</p>
      )}
    </div>
  );
}

