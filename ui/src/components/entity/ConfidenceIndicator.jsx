import React from 'react';
import { Badge } from '../common/Badge';
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

export function ConfidenceIndicator({ score = 0, decision = 'NO_MATCH', level = 'High Confidence' }) {
  const pct = Math.round(score * 100);

  let variant = 'error';
  let Icon = XCircle;
  let statusText = 'NO MATCH DECISION';

  if (decision === 'MATCH') {
    variant = 'success';
    Icon = ShieldCheck;
    statusText = 'CONFIRMED MATCH';
  } else if (decision === 'REVIEW') {
    variant = 'warning';
    Icon = AlertTriangle;
    statusText = 'REVIEW REQUIRED';
  }

  return (
    <div className="bg-[#252522] border border-[#4A4A43] rounded-xl p-6 sm:p-8 shadow-md space-y-6 font-sans text-[#F1EBDD]">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-[#C6A15B]">
          ML Matching Model Decision
        </h4>
        <Badge variant={variant} size="md">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-bold">{statusText}</span>
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-extrabold text-[#F1EBDD] font-mono tracking-tight">
            {pct}%
          </div>
          <span className="text-base font-semibold text-[#B8B2A5] mt-1 block">
            {level} Classification Score
          </span>
        </div>

        {/* Horizontal Score Indicator */}
        <div className="flex-1 max-w-md space-y-2">
          <div className="flex justify-between text-xs font-mono font-bold text-[#B8B2A5]">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <div className="w-full bg-[#343430] rounded-full h-4 overflow-hidden p-0.5 border border-[#4A4A43]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                decision === 'MATCH' ? 'bg-[#58704F]' : decision === 'REVIEW' ? 'bg-[#A8782E]' : 'bg-[#A34B40]'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-[#B8B2A5] pt-4 border-t border-[#343430]">
        Feature score calculated via normalized token edit distances, address component geocoding & open country verification.
      </p>
    </div>
  );
}

