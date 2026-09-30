import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ArrowUpDown, ChevronRight } from 'lucide-react';

export function ResultsTable({ results = [], onSort, sortField, sortDir }) {
  if (results.length === 0) {
    return (
      <div className="p-12 text-center bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl text-base text-[#5E5A51] font-sans">
        No matching entity results found for your filter criteria.
      </div>
    );
  }

  return (
    <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl overflow-hidden shadow-xs font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead className="bg-[#E9E2D5] border-b border-[#C7C0B4] text-[#5E5A51] font-bold select-none text-xs uppercase tracking-wider">
            <tr>
              <th className="py-4 px-5 min-w-[150px]">
                <button onClick={() => onSort('source1_entity_id')} className="flex items-center gap-1.5 hover:text-[#252522]">
                  <span>Source 1 ID</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#C6A15B]" />
                </button>
              </th>
              <th className="py-4 px-5 min-w-[280px]">Business Name & Country</th>
              <th className="py-4 px-5 text-center min-w-[130px]">Match Count</th>
              <th className="py-4 px-5 min-w-[240px]">Matched Target IDs (S2/S3)</th>
              <th className="py-4 px-5 min-w-[160px]">Status</th>
              <th className="py-4 px-5 text-right min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C7C0B4] font-medium text-[#252522]">
            {results.map((row) => {
              const hasMatches = row.matched_entity_ids && row.matched_entity_ids.length > 0;
              let statusBadge = { variant: 'default', label: row.status };
              if (row.status === 'Matched') statusBadge = { variant: 'success', label: 'Matched' };
              else if (row.status === 'Review') statusBadge = { variant: 'warning', label: 'Review Needed' };
              else if (row.status === 'Singleton') statusBadge = { variant: 'default', label: 'Singleton (0 Matches)' };

              return (
                <tr key={row.source1_entity_id} className="hover:bg-[#E6D9B9]/50 transition-colors">
                  <td className="py-4 px-5 font-mono font-bold text-[#5E513F] text-base">
                    {row.source1_entity_id}
                  </td>

                  <td className="py-4 px-5">
                    <div className="font-bold text-[#252522] text-base">{row.business_name}</div>
                    <div className="text-xs text-[#5E5A51] font-medium mt-0.5">{row.country}</div>
                  </td>

                  <td className="py-4 px-5 text-center">
                    <span className={`inline-flex items-center justify-center px-3.5 py-1 rounded-full font-mono text-sm font-bold ${
                      row.match_count > 0 ? 'bg-[#DCE5D7] text-[#58704F] border border-[#A4B89D]' : 'bg-[#E9E2D5] text-[#5E5A51] border border-[#C7C0B4]'
                    }`}>
                      {row.match_count}
                    </span>
                  </td>

                  <td className="py-4 px-5">
                    {hasMatches ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.matched_entity_ids.map((id) => (
                          <Badge key={id} variant={id.startsWith('S2-') ? 's2' : 's3'} size="md">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#7E796E] italic text-sm">No matching record (Singleton)</span>
                    )}
                  </td>

                  <td className="py-4 px-5">
                    <Badge variant={statusBadge.variant} size="md">
                      {statusBadge.label}
                    </Badge>
                  </td>

                  <td className="py-4 px-5 text-right">
                    <Link to={`/results/${row.source1_entity_id}`}>
                      <Button variant="ghost" size="sm" icon={ChevronRight}>
                        Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

