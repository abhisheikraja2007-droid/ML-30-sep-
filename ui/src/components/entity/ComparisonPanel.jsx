import React from 'react';
import { Badge } from '../common/Badge';
import { SimilarityMetric } from './SimilarityMetric';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { Building2, MapPin, Globe, ArrowRightLeft } from 'lucide-react';

export function ComparisonPanel({ source1, candidate }) {
  if (!source1 || !candidate) return null;

  const isSource2 = candidate.candidate_id.startsWith('S2-');
  const candidateSourceVariant = isSource2 ? 's2' : 's3';

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-[#252522] border border-[#4A4A43] text-[#F1EBDD] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C6A15B] uppercase tracking-wider mb-1.5">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Record Pair Investigation Workspace</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F1EBDD] tracking-tight">
            Comparing <code className="font-mono text-[#C6A15B]">{source1.entity_id}</code> vs <code className="font-mono text-[#D8C18A]">{candidate.candidate_id}</code>
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="s1" size="md">Source 1 Reference</Badge>
          <span className="text-[#B8B2A5] font-bold">vs</span>
          <Badge variant={candidateSourceVariant} size="md">{candidate.source}</Badge>
        </div>
      </div>

      {/* Side-by-Side Aligned Record Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SOURCE 1 PANEL (Soft Stone / Warm Cream Surface #E9E2D5) */}
        <div className="bg-[#E9E2D5] border-2 border-[#C7C0B4] rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#C7C0B4]">
            <Badge variant="s1" size="md">SOURCE 1 (REFERENCE ENTITY)</Badge>
            <span className="text-base font-mono font-bold text-[#5E513F]">{source1.entity_id}</span>
          </div>

          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold text-[#5E5A51] uppercase tracking-wider block mb-1">
                Business Name
              </span>
              <p className="text-xl font-bold text-[#252522] flex items-start gap-2.5 leading-snug">
                <Building2 className="w-5 h-5 text-[#C6A15B] shrink-0 mt-1" />
                <span>{source1.business_name}</span>
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-[#5E5A51] uppercase tracking-wider block mb-1">
                Business Address
              </span>
              <p className="text-base text-[#252522] flex items-start gap-2.5 leading-relaxed">
                <MapPin className="w-5 h-5 text-[#7E796E] shrink-0 mt-1" />
                <span>{source1.business_address}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-[#C7C0B4] flex items-center justify-between">
              <span className="text-[#5E5A51] font-semibold text-sm">Country:</span>
              <span className="font-bold text-[#252522] text-base">{source1.country}</span>
            </div>
          </div>
        </div>

        {/* CANDIDATE PANEL (Soft Gold / Warm Beige Surface #E6D9B9) */}
        <div className="bg-[#E6D9B9] border-2 border-[#D8C18A] rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#D8C18A]">
            <Badge variant={candidateSourceVariant} size="md">{candidate.source}</Badge>
            <span className="text-base font-mono font-bold text-[#8A6545]">{candidate.candidate_id}</span>
          </div>

          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold text-[#5E5A51] uppercase tracking-wider block mb-1">
                Business Name
              </span>
              <p className="text-xl font-bold text-[#252522] flex items-start gap-2.5 leading-snug">
                <Building2 className="w-5 h-5 text-[#8A6545] shrink-0 mt-1" />
                <span>{candidate.business_name}</span>
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-[#5E5A51] uppercase tracking-wider block mb-1">
                Business Address
              </span>
              <p className="text-base text-[#252522] flex items-start gap-2.5 leading-relaxed">
                <MapPin className="w-5 h-5 text-[#7E796E] shrink-0 mt-1" />
                <span>{candidate.business_address}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-[#D8C18A] flex items-center justify-between">
              <span className="text-[#5E5A51] font-semibold text-sm">Country:</span>
              <span className="font-bold text-[#252522] text-base">{candidate.country}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MATCH ANALYSIS & SIMILARITY SIGNALS */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#C7C0B4]">
          <div>
            <h3 className="text-lg font-bold text-[#252522]">
              Similarity & Feature Evidence Signals Analysis
            </h3>
            <p className="text-xs text-[#5E5A51] mt-0.5">
              Comparative signal vector extracted prior to ML model inference
            </p>
          </div>
          <span className="text-xs font-semibold text-[#5E5A51] font-mono">
            Vector Dimension: 3
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SimilarityMetric
            label="Name Similarity"
            score={candidate.name_similarity}
            description="Token overlap, Levenshtein, legal suffix normalization"
          />
          <SimilarityMetric
            label="Address Similarity"
            score={candidate.address_similarity}
            description="Geocoding, postal code, street number alignment"
          />
          <SimilarityMetric
            label="Country Agreement"
            isBoolean={true}
            boolValue={candidate.country_match}
            description="Exact ISO/string country matching check"
          />
        </div>

        {candidate.evidence_notes && (
          <div className="bg-[#E9E2D5] p-4 rounded-xl border border-[#C7C0B4] text-sm text-[#252522] leading-relaxed">
            <span className="font-bold text-[#252522]">Algorithmic Evidence Summary: </span>
            {candidate.evidence_notes}
          </div>
        )}
      </div>

      {/* ML MATCHING DECISION */}
      <ConfidenceIndicator
        score={candidate.similarity_score}
        decision={candidate.decision}
        level={candidate.confidence_level}
      />
    </div>
  );
}

