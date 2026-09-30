import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resultsService } from '../services/resultsService';
import { MetricStrip } from '../components/dashboard/StatCard';
import { CandidateVsMatchesChart, EvaluationMetricsChart } from '../components/dashboard/MetricChart';
import { Loader } from '../components/common/Loader';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  SearchCode,
  FileCheck2,
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, r] = await Promise.all([
          resultsService.getSummaryMetrics(),
          resultsService.getResults()
        ]);
        setMetrics(m);
        setRecentResults(r.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <Loader label="Loading Entity Resolution Dashboard..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Page Header Banner */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {metrics?.live_backend ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Live Neural AI Backend Connected (Mean Latency: {metrics.mean_latency_ms} ms)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F1E4C9] text-[#A8782E] border border-[#D8C18A]">
                <Sparkles className="w-3.5 h-3.5" />
                Demo / Standby Dataset Active
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#252522] tracking-tight">
            Entity Resolution Overview
          </h1>
          <p className="text-base text-[#5E5A51] max-w-2xl leading-relaxed">
            Multi-stage dense blocking with FAISS IndexFlatIP & fine-tuned Cross-Encoder precision scoring across UK Companies House registry.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/resolve">
            <Button variant="primary" size="md" icon={SearchCode}>
              Resolve Reference Entity
            </Button>
          </Link>
          <Link to="/results">
            <Button variant="secondary" size="md" icon={FileCheck2}>
              View All Results
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Summary Metric Strip */}
      <MetricStrip metrics={metrics} />

      {/* Process Overview Pipeline Stepper */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#C7C0B4]">
          <h3 className="text-lg font-bold text-[#252522]">
            Resolution Pipeline Workflow State
          </h3>
          <span className="text-xs font-semibold text-[#5E5A51]">
            End-to-End Execution Flow
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
          <div className="p-4 bg-[#E6E0D4] border border-[#C7C0B4] rounded-lg flex flex-col items-center">
            <Database className="w-5 h-5 text-[#8B877C] mb-2" />
            <span className="text-xs font-bold text-[#252522]">REFERENCE ENTITY</span>
            <span className="text-xs text-[#5E5A51] mt-0.5">Source 1</span>
          </div>

          <div className="p-4 bg-[#E9E2D5] border border-[#C7C0B4] rounded-lg flex flex-col items-center">
            <SearchCode className="w-5 h-5 text-[#C6A15B] mb-2" />
            <span className="text-xs font-bold text-[#252522]">CANDIDATE BLOCKING</span>
            <span className="text-xs text-[#5E5A51] mt-0.5">S2 & S3 Records</span>
          </div>

          <div className="p-4 bg-[#E6D9B9] border border-[#D8C18A] rounded-lg flex flex-col items-center">
            <Cpu className="w-5 h-5 text-[#8A6545] mb-2" />
            <span className="text-xs font-bold text-[#252522]">MATCH ANALYSIS</span>
            <span className="text-xs text-[#5E5A51] mt-0.5">Name/Address Signals</span>
          </div>

          <div className="p-4 bg-[#F1E4C9] border border-[#D8C18A] rounded-lg flex flex-col items-center">
            <ShieldCheck className="w-5 h-5 text-[#9A5B43] mb-2" />
            <span className="text-xs font-bold text-[#252522]">ML MATCHING</span>
            <span className="text-xs text-[#5E5A51] mt-0.5">Match / Singleton</span>
          </div>

          <div className="p-4 bg-[#DCE5D7] border border-[#A4B89D] rounded-lg flex flex-col items-center">
            <FileSpreadsheet className="w-5 h-5 text-[#58704F] mb-2" />
            <span className="text-xs font-bold text-[#252522]">FINAL RESULT</span>
            <span className="text-xs text-[#58704F] mt-0.5">Validated TSV Output</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CandidateVsMatchesChart />
        <EvaluationMetricsChart metrics={metrics?.evaluation ?? metrics} />
      </div>

      {/* Recent Reference Activity Table */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#C7C0B4]">
          <div>
            <h3 className="text-lg font-bold text-[#252522]">
              Recent Reference Entity Activity
            </h3>
            <p className="text-sm text-[#5E5A51] mt-0.5">
              Snapshot of recent reference entities processed through candidate generation
            </p>
          </div>
          <Link to="/results">
            <Button variant="ghost" size="sm" icon={ArrowRight}>
              View Full Table
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#E9E2D5] text-[#5E5A51] font-semibold border-b border-[#C7C0B4]">
              <tr>
                <th className="py-3.5 px-4">Source 1 ID</th>
                <th className="py-3.5 px-4">Business Name</th>
                <th className="py-3.5 px-4">Country</th>
                <th className="py-3.5 px-4">Matched Target IDs</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C7C0B4] font-medium text-[#252522]">
              {recentResults.map((r) => (
                <tr key={r.source1_entity_id} className="hover:bg-[#E6D9B9]/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#5E513F] text-sm">
                    {r.source1_entity_id}
                  </td>
                  <td className="py-3.5 px-4 text-[#252522] font-bold text-sm">
                    {r.business_name}
                  </td>
                  <td className="py-3.5 px-4 text-[#5E5A51] text-sm">{r.country}</td>
                  <td className="py-3.5 px-4">
                    {r.matched_entity_ids.length > 0 ? (
                      <div className="flex gap-1.5">
                        {r.matched_entity_ids.map(id => (
                          <Badge key={id} variant={id.startsWith('S2-') ? 's2' : 's3'} size="sm">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#7E796E] italic text-xs">None (Singleton)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={r.status === 'Matched' ? 'success' : r.status === 'Review' ? 'warning' : 'default'} size="sm">
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link to={`/resolve/${r.source1_entity_id}`} className="text-[#C6A15B] hover:text-[#9E7B3F] font-bold text-xs">
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

