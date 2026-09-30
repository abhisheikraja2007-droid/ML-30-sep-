import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ArrowLeft, CheckCircle2, Layers, Building2, MapPin, Globe, ArrowRight } from 'lucide-react';

export function ResultDetailsView({ details }) {
  if (!details) return null;

  const { result, source1, matchedCandidates } = details;

  return (
    <div className="space-y-8 font-sans">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link to="/results">
          <Button variant="ghost" size="md" icon={ArrowLeft}>
            Back to Results Table
          </Button>
        </Link>
        <span className="text-sm font-mono text-[#5E5A51] font-semibold">matching_results.tsv Record Entry</span>
      </div>

      {/* Source 1 Header */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#C7C0B4]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="s1" size="md">SOURCE 1 REFERENCE</Badge>
              <span className="font-mono text-base font-bold text-[#5E513F]">{source1.entity_id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#252522]">{source1.business_name}</h1>
          </div>
          <Badge variant={result.status === 'Matched' ? 'success' : result.status === 'Review' ? 'warning' : 'default'} size="md">
            {result.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base text-[#252522]">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#7E796E] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[#5E5A51] text-sm uppercase tracking-wider">Registered Address</span>
              <span className="mt-0.5 block">{source1.business_address}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#7E796E] shrink-0" />
            <div>
              <span className="font-bold block text-[#5E5A51] text-sm uppercase tracking-wider">Country</span>
              <span className="mt-0.5 block font-semibold">{source1.country}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-[#C6A15B] shrink-0" />
            <div>
              <span className="font-bold block text-[#5E5A51] text-sm uppercase tracking-wider">Matched Entities</span>
              <span className="mt-0.5 block font-mono font-bold text-[#5E513F] text-lg">{result.match_count} target records</span>
            </div>
          </div>
        </div>
      </div>

      {/* VISUAL RELATIONSHIP TREE */}
      <div className="bg-[#252522] text-[#F1EBDD] border border-[#4A4A43] rounded-xl p-6 shadow-md font-mono text-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#343430] text-[#B8B2A5]">
          <span className="font-sans font-bold uppercase tracking-wider text-xs">Entity Resolution Relationship Graph</span>
          <span className="text-xs">Target Match Tree</span>
        </div>

        <div className="pt-2 leading-relaxed">
          <div className="text-[#C6A15B] font-bold text-base flex items-center gap-2">
            <span>{source1.entity_id}</span>
            <span className="font-sans text-sm text-[#B8B2A5]">({source1.business_name})</span>
          </div>

          {matchedCandidates.length > 0 ? (
            matchedCandidates.map((c, idx) => {
              const isLast = idx === matchedCandidates.length - 1;
              const prefix = isLast ? '└── ' : '├── ';
              return (
                <div key={c.candidate_id} className="pl-6 flex items-center gap-3 text-[#F1EBDD] py-1">
                  <span className="text-[#8B877C] font-bold">{prefix}</span>
                  <span className={c.candidate_id.startsWith('S2-') ? 'text-[#D8C18A] font-bold text-base' : 'text-[#C6A15B] font-bold text-base'}>
                    {c.candidate_id}
                  </span>
                  <span className="text-[#58704F] font-bold text-xs px-2 py-0.5 bg-[#DCE5D7] rounded border border-[#A4B89D]">MATCH</span>
                  <span className="text-[#B8B2A5] text-sm font-sans">({c.business_name} - {c.country})</span>
                </div>
              );
            })
          ) : (
            <div className="pl-6 text-[#B8B2A5] italic py-1">
              └── [NO RELIABLE MATCH IDENTIFIED — SINGLETON ENTITY]
            </div>
          )}
        </div>
      </div>

      {/* Matched Target Record Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#252522]">
          Confirmed Target Record Details
        </h3>

        {matchedCandidates.length > 0 ? (
          matchedCandidates.map((c) => (
            <div key={c.candidate_id} className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <Badge variant={c.candidate_id.startsWith('S2-') ? 's2' : 's3'} size="md">
                  {c.source} ({c.candidate_id})
                </Badge>
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CONFIRMED MATCH</span>
                </Badge>
              </div>

              <h4 className="text-lg font-bold text-[#252522] flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#C6A15B] shrink-0" />
                <span>{c.business_name}</span>
              </h4>

              <div className="text-base text-[#252522] space-y-1.5">
                <p><strong>Address:</strong> {c.business_address}</p>
                <p><strong>Country:</strong> {c.country}</p>
                <p><strong>Score:</strong> <span className="font-mono font-bold text-[#252522]">{Math.round(c.similarity_score * 100)}%</span> ({c.confidence_level})</p>
              </div>

              <div className="pt-4 border-t border-[#C7C0B4] flex justify-end">
                <Link to={`/resolve/${source1.entity_id}/compare/${c.candidate_id}`}>
                  <Button variant="secondary" size="md" icon={ArrowRight}>
                    View Detailed Pair Analysis
                  </Button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 bg-[#E9E2D5] border border-dashed border-[#C7C0B4] rounded-xl text-center text-base text-[#5E5A51]">
            This reference entity is classified as a <strong>Singleton</strong>. No target entity in Source 2 or Source 3 satisfied match thresholds.
          </div>
        )}
      </div>
    </div>
  );
}

