import React, { useState, useEffect } from 'react';
import { historyService } from '../services/historyService';
import { Loader } from '../components/common/Loader';
import { Badge } from '../components/common/Badge';
import { History as HistoryIcon, Clock, Filter } from 'lucide-react';

export function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const data = await historyService.getLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(item => {
    if (categoryFilter === 'ALL') return true;
    return item.category === categoryFilter;
  });

  const getCategoryBadgeVariant = (cat) => {
    switch (cat) {
      case 'SEARCH': return 'default';
      case 'BLOCKING': return 'warning';
      case 'INVESTIGATION': return 's3';
      case 'VALIDATION': return 'success';
      case 'EXPORT': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Editorial Page Header */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#252522] flex items-center gap-3 tracking-tight">
            <HistoryIcon className="w-8 h-8 text-[#C6A15B] shrink-0" />
            <span>Resolution Activity History</span>
          </h1>
          <p className="text-base text-[#5E5A51]">
            Audit log of searches, candidate comparisons, validation runs and TSV exports
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Filter className="w-4 h-4 text-[#7E796E]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 text-sm bg-[#E9E2D5] border border-[#C7C0B4] rounded-lg text-[#252522] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40"
          >
            <option value="ALL">All Event Categories</option>
            <option value="EXPORT">Export Events</option>
            <option value="VALIDATION">Validation Runs</option>
            <option value="INVESTIGATION">Pair Comparisons</option>
            <option value="SEARCH">Entity Searches</option>
            <option value="BLOCKING">Candidate Blocking</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table Surface */}
      {loading ? (
        <Loader label="Loading platform resolution activity history logs..." />
      ) : (
        <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="bg-[#E9E2D5] border-b border-[#C7C0B4] text-[#5E5A51] font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5 min-w-[180px]">Timestamp</th>
                  <th className="py-4 px-5 min-w-[200px]">Action / Event</th>
                  <th className="py-4 px-5 min-w-[140px]">Category</th>
                  <th className="py-4 px-5 min-w-[140px]">Source 1 Context</th>
                  <th className="py-4 px-5">Event Details</th>
                  <th className="py-4 px-5 text-right min-w-[120px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C7C0B4] font-medium text-[#252522]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#E6D9B9]/50 transition-colors">
                    <td className="py-4 px-5 text-[#5E5A51] font-mono text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#7E796E] shrink-0" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 font-bold text-[#252522] text-base">
                      {log.action}
                    </td>

                    <td className="py-4 px-5">
                      <Badge variant={getCategoryBadgeVariant(log.category)} size="md">
                        {log.category}
                      </Badge>
                    </td>

                    <td className="py-4 px-5 font-mono font-bold text-[#5E513F] text-base">
                      {log.source1_id}
                    </td>

                    <td className="py-4 px-5 text-[#5E5A51] text-sm">
                      {log.details}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <Badge variant={log.status === 'Success' ? 'success' : 'default'} size="md">
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

