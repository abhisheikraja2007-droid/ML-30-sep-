import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export function CandidateVsMatchesChart() {
  const data = [
    { name: 'S1-00001 (India)', Candidates: 3, FinalMatches: 2 },
    { name: 'S1-00002 (US)', Candidates: 2, FinalMatches: 1 },
    { name: 'S1-00003 (France)', Candidates: 4, FinalMatches: 2 },
    { name: 'S1-00004 (UK)', Candidates: 1, FinalMatches: 0 },
    { name: 'S1-00005 (India)', Candidates: 3, FinalMatches: 1 },
    { name: 'S1-00006 (US)', Candidates: 2, FinalMatches: 1 },
    { name: 'S1-00008 (India)', Candidates: 3, FinalMatches: 2 }
  ];

  return (
    <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 font-sans shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#252522]">
            Candidate Pair Volume vs Final Matches
          </h3>
          <p className="text-sm text-[#5E5A51]">
            Blocking candidate volume vs ML validated entity matches per Source 1 reference ID
          </p>
        </div>
        <span className="text-xs font-semibold text-[#252522] bg-[#E9E2D5] border border-[#C7C0B4] px-3 py-1 rounded-md">
          Illustrative Data
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#C7C0B4" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5E5A51' }} interval={0} angle={-15} textAnchor="end" />
            <YAxis tick={{ fontSize: 12, fill: '#5E5A51' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#343430',
                borderColor: '#C6A15B',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#F1EBDD'
              }}
            />
            <Bar dataKey="Candidates" fill="#8A6545" name="Candidates (Blocking)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="FinalMatches" fill="#C6A15B" name="Final Matches (ML)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function EvaluationMetricsChart({ metrics }) {
  const evalData = [
    { name: 'Precision', score: (metrics.precision * 100).toFixed(1), fill: '#252522' },
    { name: 'Recall', score: (metrics.recall * 100).toFixed(1), fill: '#C6A15B' },
    { name: 'F0.5 Score (Precision-Heavy)', score: (metrics.f05 * 100).toFixed(1), fill: '#8A6545' },
    { name: 'Candidate Recall', score: (metrics.candidate_recall * 100).toFixed(1), fill: '#58704F' }
  ];

  return (
    <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 font-sans shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#252522]">
            Model Evaluation Metrics (F0.5 Focus)
          </h3>
          <p className="text-sm text-[#5E5A51]">
            Precision-weighted metric giving higher weight to precision over recall
          </p>
        </div>
        <span className="text-xs font-semibold text-[#252522] bg-[#E9E2D5] border border-[#C7C0B4] px-3 py-1 rounded-md">
          Mock Scores
        </span>
      </div>

      <div className="space-y-5">
        {evalData.map((item) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex justify-between text-sm font-bold text-[#252522]">
              <span>{item.name}</span>
              <span className="font-mono">{item.score}%</span>
            </div>
            <div className="w-full bg-[#E9E2D5] rounded-full h-3 overflow-hidden border border-[#C7C0B4]/40">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${item.score}%`, backgroundColor: item.fill }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#5E5A51] mt-6 pt-4 border-t border-[#C7C0B4]">
        💡 <strong>Note:</strong> F0.5 measures precision preference. False Positives carry higher penalty than False Negatives in deduplication.
      </p>
    </div>
  );
}

