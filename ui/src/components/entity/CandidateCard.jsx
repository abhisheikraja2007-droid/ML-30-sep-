import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Building2, MapPin, Globe, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export function CandidateCard({ source1Id, candidate }) {
  if (!candidate) return null;

  const isSource2 = candidate.candidate_id.startsWith('S2-');
  const sourceVariant = isSource2 ? 's2' : 's3';

  let statusBadge = { variant: 'default', text: 'NO MATCH', icon: XCircle };
  if (candidate.decision === 'MATCH') {
    statusBadge = { variant: 'success', text: 'MATCH', icon: CheckCircle2 };
  } else if (candidate.decision === 'REVIEW') {
    statusBadge = { variant: 'warning', text: 'REVIEW NEEDED', icon: AlertTriangle };
  }

  const StatusIcon = statusBadge.icon;
  const scorePct = Math.round(candidate.similarity_score * 100);

  return (
    <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 shadow-xs font-sans space-y-4 hover:border-[#AAA194] transition-all">
      {/* Source, ID & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant={sourceVariant} size="md">
            {candidate.source} ({candidate.candidate_id})
          </Badge>
          <Badge variant={statusBadge.variant} size="md">
            <StatusIcon className="w-4 h-4" />
            <span>{statusBadge.text}</span>
          </Badge>
        </div>

        {/* Similarity Score */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#5E5A51] uppercase tracking-wider">Score:</span>
          <span className="font-mono text-lg font-bold text-[#252522]">{scorePct}%</span>
          <div className="w-24 bg-[#E9E2D5] rounded-full h-2 overflow-hidden border border-[#C7C0B4]/40">
            <div
              className={`h-2 rounded-full ${
                scorePct >= 85 ? 'bg-[#58704F]' : scorePct >= 70 ? 'bg-[#A8782E]' : 'bg-[#8A6545]'
              }`}
              style={{ width: `${scorePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Candidate Business Name */}
      <h4 className="text-lg font-bold text-[#252522] flex items-start gap-2.5">
        <Building2 className="w-5 h-5 text-[#5E5A51] mt-0.5 shrink-0" />
        <span>{candidate.business_name}</span>
      </h4>

      {/* Address & Country */}
      <div className="space-y-2 text-base text-[#252522]">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#7E796E] shrink-0 mt-1" />
          <span className="leading-relaxed">{candidate.business_address}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-[#7E796E] shrink-0" />
          <span className="font-semibold">{candidate.country}</span>
        </div>
      </div>

      {/* Algorithmic Evidence Summary */}
      {candidate.evidence_notes && (
        <div className="bg-[#E9E2D5] border border-[#C7C0B4] rounded-lg p-4 text-sm text-[#252522] leading-relaxed">
          <strong className="text-[#252522] font-semibold">Evidence:</strong> {candidate.evidence_notes}
        </div>
      )}

      {/* View Side-by-Side Comparison CTA */}
      <div className="pt-4 border-t border-[#C7C0B4] flex justify-end">
        <Link to={`/resolve/${source1Id}/compare/${candidate.candidate_id}`}>
          <Button variant="secondary" size="md" icon={ArrowRight}>
            View Side-by-Side Pair Comparison
          </Button>
        </Link>
      </div>
    </div>
  );
}

