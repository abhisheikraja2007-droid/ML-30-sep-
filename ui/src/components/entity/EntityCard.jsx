import React from 'react';
import { Badge } from '../common/Badge';
import { Building2, MapPin, Globe, Hash, Layers } from 'lucide-react';

export function EntityCard({ entity, showActions = true, onSelect }) {
  if (!entity) return null;

  return (
    <div className="bg-[#F1EBDD] border-2 border-[#C6A15B] rounded-xl p-6 shadow-xs flex flex-col justify-between font-sans">
      <div>
        {/* Source Badge & Status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <Badge variant="s1" size="md">
            <Layers className="w-3.5 h-3.5" />
            <span>SOURCE 1 (REFERENCE ENTITY)</span>
          </Badge>

          {entity.status && (
            <Badge
              variant={
                entity.status === 'Matched' ? 'success' : entity.status === 'Review' ? 'warning' : 'default'
              }
              size="md"
            >
              {entity.status}
            </Badge>
          )}
        </div>

        {/* Business Name */}
        <h3 className="text-xl font-bold text-[#252522] flex items-start gap-2.5 mb-3 leading-snug">
          <Building2 className="w-5 h-5 text-[#C6A15B] mt-0.5 shrink-0" />
          <span>{entity.business_name}</span>
        </h3>

        {/* Details Grid */}
        <div className="space-y-3 text-sm text-[#5E5A51] mt-4 pt-4 border-t border-[#C7C0B4]">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#7E796E] shrink-0" />
            <span className="font-semibold text-[#5E5A51]">ID:</span>
            <span className="font-mono font-bold text-[#5E513F] text-base">{entity.entity_id}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#7E796E] shrink-0 mt-0.5" />
            <span className="leading-relaxed text-base text-[#252522]">{entity.business_address}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-[#7E796E] shrink-0" />
            <span className="font-semibold text-[#252522] text-base">{entity.country}</span>
          </div>
        </div>
      </div>

      {showActions && onSelect && (
        <div className="mt-6 pt-4 border-t border-[#C7C0B4] flex items-center justify-between text-sm">
          <span className="text-[#5E5A51] font-medium">
            {entity.candidate_count} candidate{entity.candidate_count !== 1 ? 's' : ''} generated
          </span>
          <button
            onClick={() => onSelect(entity.entity_id)}
            className="font-bold text-[#C6A15B] hover:text-[#9E7B3F] hover:underline cursor-pointer"
          >
            Inspect Candidates →
          </button>
        </div>
      )}
    </div>
  );
}

