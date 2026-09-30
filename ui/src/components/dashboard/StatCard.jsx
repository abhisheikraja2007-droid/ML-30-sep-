import React from 'react';

export function StatCard({ title, value, subtitle, highlight = false }) {
  return (
    <div className={`p-6 flex flex-col justify-between font-sans ${highlight ? 'bg-[#E6D9B9]' : 'bg-[#F1EBDD]'}`}>
      <span className="text-xs font-bold text-[#5E5A51] tracking-wider uppercase mb-2">
        {title}
      </span>

      <div className="space-y-1">
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#252522] font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {subtitle && (
          <p className="text-xs text-[#7E796E] font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function MetricStrip({ metrics }) {
  return (
    <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl overflow-hidden shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#C7C0B4]">
      <StatCard
        title="Source 1 Reference Entities"
        value={metrics?.source1_total || 8}
        subtitle="Deduplicated dataset (S1-)"
        highlight={true}
      />
      <StatCard
        title="Source 2 Records"
        value={metrics?.source2_total || 12450}
        subtitle="Independent record source (S2-)"
      />
      <StatCard
        title="Source 3 Records"
        value={metrics?.source3_total || 11800}
        subtitle="Independent record source (S3-)"
      />
      <StatCard
        title="Validated Final Matches"
        value={metrics?.final_matches_total || 8}
        subtitle="ML Approved S2 & S3 links"
      />
    </div>
  );
}

