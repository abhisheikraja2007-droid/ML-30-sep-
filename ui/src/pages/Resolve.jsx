import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { entityService } from '../services/entityService';
import { EntityCard } from '../components/entity/EntityCard';
import { CandidateCard } from '../components/entity/CandidateCard';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Button } from '../components/common/Button';
import {
  Search,
  Filter,
  Database,
  Cpu,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export function Resolve() {
  const { source1Id } = useParams();
  const navigate = useNavigate();

  // Mode: 'LIVE_QUERY' or 'REGISTRY_BROWSE'
  const [activeTab, setActiveTab] = useState('LIVE_QUERY');

  // Live Query Form State
  const [queryName, setQueryName] = useState('Big Impact Graphics Limited');
  const [queryAddress, setQueryAddress] = useState('160 City Road');
  const [queryTown, setQueryTown] = useState('London');
  const [queryZip, setQueryZip] = useState('EC1V 9LT');
  const [threshold, setThreshold] = useState(0.85);

  const [resolving, setResolving] = useState(false);
  const [liveResult, setLiveResult] = useState(null);
  const [liveError, setLiveError] = useState(null);

  // Registry Browser State
  const [searchInput, setSearchInput] = useState(source1Id || '11743365');
  const [activeEntity, setActiveEntity] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [allEntities, setAllEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [candidateFilter, setCandidateFilter] = useState('ALL');

  // Load registry entities for the dropdown
  useEffect(() => {
    async function loadRegistry() {
      try {
        const entitiesList = await entityService.getEntities('', 'ALL', 'ALL');
        setAllEntities(entitiesList);
        if (source1Id) {
          setActiveTab('REGISTRY_BROWSE');
          loadEntityDetails(source1Id);
        }
      } catch (err) {
        console.error('Failed to load initial entities:', err);
      }
    }
    loadRegistry();
  }, [source1Id]);

  const loadEntityDetails = async (id) => {
    setLoading(true);
    setErrorMsg('');
    try {
      setSearchInput(id);
      const entityData = await entityService.getEntityById(id);
      setActiveEntity(entityData);
      const candData = await entityService.getCandidatesForEntity(id);
      setCandidates(candData);
    } catch (err) {
      setErrorMsg(err.message || 'Entity resolution record not found.');
      setActiveEntity(null);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    loadEntityDetails(searchInput.trim());
  };

  // Run Real-Time Two-Stage Neural Resolution
  const handleLiveResolve = async (e) => {
    if (e) e.preventDefault();
    if (!queryName.trim()) return;

    setResolving(true);
    setLiveError(null);
    try {
      const res = await entityService.resolveCustomQuery({
        name: queryName,
        address: queryAddress,
        town: queryTown,
        zip_code: queryZip,
        threshold: parseFloat(threshold)
      });
      setLiveResult(res);
    } catch (err) {
      setLiveError(err.message || 'Resolution failed. Make sure the FastAPI server is running on port 8000.');
      setLiveResult(null);
    } finally {
      setResolving(false);
    }
  };

  // Quick Preset Handlers for live demo
  const loadPreset = (name, addr, town, zip, thresh = 0.85) => {
    setQueryName(name);
    setQueryAddress(addr);
    setQueryTown(town);
    setQueryZip(zip);
    setThreshold(thresh);
    setLiveResult(null);
  };

  const filteredCandidates = candidates.filter((c) => {
    if (candidateFilter === 'ALL') return true;
    if (candidateFilter === 'MATCH') return c.decision === 'MATCH';
    if (candidateFilter === 'REJECTED') return c.decision === 'NO_MATCH';
    if (candidateFilter === 'HIGH') return (c.cross_encoder_confidence || 0) >= 0.90;
    if (candidateFilter === 'MEDIUM') return (c.cross_encoder_confidence || 0) >= 0.70 && (c.cross_encoder_confidence || 0) < 0.90;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Workspace Header */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6DAC3] text-[#7A5B1E] border border-[#D5C2A0]">
                <Cpu className="w-3.5 h-3.5" />
                Two-Stage Neural Pipeline Active
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#252522] flex items-center gap-3 tracking-tight">
              <Search className="w-7 h-7 text-[#C6A15B] shrink-0" />
              <span>Entity Resolution Investigation Workspace</span>
            </h1>
            <p className="text-sm text-[#5E5A51] mt-1">
              Bi-Encoder Dense Blocking (FAISS IndexFlatIP) + Fine-Tuned Cross-Encoder Cross-Attention
            </p>
          </div>

          {/* Tab Selector */}
          <div className="inline-flex p-1 rounded-xl bg-[#E4DBCB] border border-[#C7C0B4]">
            <button
              onClick={() => setActiveTab('LIVE_QUERY')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'LIVE_QUERY'
                  ? 'bg-[#252522] text-[#F1EBDD] shadow-sm'
                  : 'text-[#5E5A51] hover:text-[#252522]'
              }`}
            >
              <Zap className="w-4 h-4 text-[#C6A15B]" />
              Live Neural Query
            </button>
            <button
              onClick={() => {
                setActiveTab('REGISTRY_BROWSE');
                if (!activeEntity && allEntities.length > 0) {
                  loadEntityDetails(allEntities[0].entity_id);
                }
              }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'REGISTRY_BROWSE'
                  ? 'bg-[#252522] text-[#F1EBDD] shadow-sm'
                  : 'text-[#5E5A51] hover:text-[#252522]'
              }`}
            >
              <Database className="w-4 h-4 text-[#C6A15B]" />
              Registry Browser
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: LIVE NEURAL RESOLUTION QUERY INTERFACE                        */}
      {/* ==================================================================== */}
      {activeTab === 'LIVE_QUERY' && (
        <div className="space-y-7">
          {/* Query Input Card */}
          <div className="bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E0D3] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#252522] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#C6A15B]" />
                  Real-Time Business Record Query
                </h2>
                <p className="text-xs text-[#7A7569] mt-0.5">
                  Input business attributes to perform live dense vector retrieval and cross-encoder scoring.
                </p>
              </div>

              {/* Demo Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#7A7569] uppercase tracking-wider">Presets:</span>
                <button
                  type="button"
                  onClick={() => loadPreset('Big Impact Graphics Limited', '160 City Road', 'London', 'EC1V 9LT')}
                  className="px-2.5 py-1 text-xs font-semibold bg-[#EBE4D5] hover:bg-[#DDD4C1] text-[#423C32] rounded-md border border-[#C7C0B4] transition-colors cursor-pointer"
                >
                  Big Impact (London)
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('heal ur tehch', '5 bridge st', 'guildford', 'gu14ry')}
                  className="px-2.5 py-1 text-xs font-semibold bg-[#EBE4D5] hover:bg-[#DDD4C1] text-[#423C32] rounded-md border border-[#C7C0B4] transition-colors cursor-pointer"
                >
                  Heal Ur Tech (Typo)
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('Galactic Quantum Rocketry Systems', 'Sector 9 Mars Base', 'New Olympus', 'ZZ99 9ZZ')}
                  className="px-2.5 py-1 text-xs font-semibold bg-[#EBE4D5] hover:bg-[#DDD4C1] text-[#423C32] rounded-md border border-[#C7C0B4] transition-colors cursor-pointer"
                >
                  Unseen Entity
                </button>
              </div>
            </div>

            <form onSubmit={handleLiveResolve} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Company Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#423C32] uppercase tracking-wider">
                    Company / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                    placeholder="e.g. Big Impact Graphics Limited"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#C7C0B4] rounded-lg text-[#252522] focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] outline-none font-medium"
                  />
                </div>

                {/* Street Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#423C32] uppercase tracking-wider">
                    Registered Address Line
                  </label>
                  <input
                    type="text"
                    value={queryAddress}
                    onChange={(e) => setQueryAddress(e.target.value)}
                    placeholder="e.g. 160 City Road"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#C7C0B4] rounded-lg text-[#252522] focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] outline-none font-medium"
                  />
                </div>

                {/* Post Town */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#423C32] uppercase tracking-wider">
                    Post Town
                  </label>
                  <input
                    type="text"
                    value={queryTown}
                    onChange={(e) => setQueryTown(e.target.value)}
                    placeholder="e.g. London"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#C7C0B4] rounded-lg text-[#252522] focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] outline-none font-medium"
                  />
                </div>

                {/* Postal Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#423C32] uppercase tracking-wider">
                    Postal Code (ZIP)
                  </label>
                  <input
                    type="text"
                    value={queryZip}
                    onChange={(e) => setQueryZip(e.target.value)}
                    placeholder="e.g. EC1V 9LT"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#C7C0B4] rounded-lg text-[#252522] focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] outline-none font-mono font-medium"
                  />
                </div>

                {/* Confidence Threshold Slider */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#423C32] uppercase tracking-wider">
                    <span>Decision Threshold (tau):</span>
                    <span className="font-mono text-sm text-[#C6A15B] font-extrabold">{threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="0.99"
                    step="0.01"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[#C6A15B] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#7A7569] font-mono">
                    <span>0.50 (Permissive)</span>
                    <span>0.85 (Production Standard)</span>
                    <span>0.99 (Ultra Strict)</span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="submit"
                    disabled={resolving || !queryName.trim()}
                    className="w-full py-2.5 px-4 bg-[#252522] hover:bg-[#383832] disabled:opacity-50 text-[#F1EBDD] font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {resolving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
                        <span>Resolving...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-[#C6A15B]" />
                        <span>Resolve Entity</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {liveError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>{liveError}</span>
            </div>
          )}

          {/* Live Resolution Results Display */}
          {liveResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Decision Outcome Card */}
              <div
                className={`border rounded-xl p-6 sm:p-7 shadow-xs ${
                  liveResult.status === 'MATCH_FOUND'
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-amber-50/70 border-amber-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      {liveResult.status === 'MATCH_FOUND' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4" />
                          MATCH_FOUND (High Confidence)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          <XCircle className="w-4 h-4" />
                          NO_MATCH (Singleton / Below Threshold)
                        </span>
                      )}
                      <span className="text-xs font-mono text-[#5E5A51]">
                        Decision Threshold: {liveResult.threshold || threshold}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-[#252522] tracking-tight">
                      {liveResult.status === 'MATCH_FOUND'
                        ? `Unified Entity ID: ${liveResult.entity_id}`
                        : 'No Consolidated Entity Match Found'}
                    </h3>

                    {liveResult.status === 'MATCH_FOUND' && (
                      <p className="text-sm text-[#423C32]">
                        Matched to Canonical Entity: <strong className="uppercase">{liveResult.canonical_name}</strong> (Company Number: <code className="font-mono font-bold text-[#A8782E]">{liveResult.matched_company_number}</code>, Cluster Size: {liveResult.cluster_size})
                      </p>
                    )}
                  </div>

                  {/* Confidence & Latency Badges */}
                  <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                    <div className="px-4 py-3 bg-white/90 border border-[#D5CDBD] rounded-xl text-center min-w-[120px]">
                      <div className="text-[11px] font-bold uppercase text-[#7A7569]">Confidence</div>
                      <div className="text-2xl font-black text-[#252522]">
                        {liveResult.confidence
                          ? `${(liveResult.confidence * 100).toFixed(1)}%`
                          : `${((liveResult.top_candidate_score || 0) * 100).toFixed(1)}%`}
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-white/90 border border-[#D5CDBD] rounded-xl text-center min-w-[140px]">
                      <div className="text-[11px] font-bold uppercase text-[#7A7569] flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-[#C6A15B]" />
                        Total Latency
                      </div>
                      <div className="text-2xl font-black text-[#252522]">
                        {liveResult.latency_breakdown?.total_ms || 0} ms
                      </div>
                      <div className="text-[10px] text-[#7A7569] font-mono">
                        Block: {liveResult.latency_breakdown?.blocking_ms}ms | Score: {liveResult.latency_breakdown?.scoring_ms}ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidate Pairs Table */}
              <div className="bg-white border border-[#DCD5C9] rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E0D3] pb-3">
                  <div>
                    <h4 className="text-base font-bold text-[#252522] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#C6A15B]" />
                      Top FAISS & Cross-Encoder Candidate Pairs (Stage 1 & Stage 2)
                    </h4>
                    <p className="text-xs text-[#7A7569]">
                      Retrieved {liveResult.candidates?.length || 0} candidates via Bi-Encoder and scored via full Cross-Attention.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[#FAF7F2] text-[#423C32] text-xs font-bold uppercase tracking-wider border-b border-[#E7E0D3]">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Candidate Company</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4 text-center">FAISS Cosine</th>
                        <th className="py-3 px-4 text-center">Cross-Encoder</th>
                        <th className="py-3 px-4 text-center">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEAE1]">
                      {(liveResult.candidates || []).map((cand, idx) => (
                        <tr key={cand.candidate_id} className="hover:bg-[#FAF7F2] transition-colors font-sans">
                          <td className="py-3 px-4 font-mono font-bold text-[#7A7569]">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#252522]">{cand.company_name}</div>
                            <div className="text-xs text-[#7A7569] font-mono">No: {cand.candidate_id}</div>
                          </td>
                          <td className="py-3 px-4 text-xs text-[#5E5A51]">
                            <div>{cand.post_town || 'N/A'}</div>
                            <div className="font-mono">{cand.postcode}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#5E5A51]">
                            {cand.faiss_cosine_score?.toFixed(3)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono font-extrabold text-sm text-[#252522]">
                              {(cand.cross_encoder_confidence * 100).toFixed(1)}%
                            </span>
                            <div className="text-[10px] text-[#7A7569]">{cand.confidence_level}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {cand.decision === 'MATCH' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                MATCH
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-300">
                                REJECTED
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: REGISTRY RECORD BROWSER                                       */}
      {/* ==================================================================== */}
      {activeTab === 'REGISTRY_BROWSE' && (
        <div className="space-y-6">
          <div className="bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-[#7E796E] absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter Company Number (e.g. 11743365)..."
                  className="w-full pl-10 pr-4 py-2 text-sm font-mono font-bold bg-white border border-[#C7C0B4] rounded-lg text-[#252522] focus:ring-2 focus:ring-[#C6A15B]/40 outline-none"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" icon={Search}>
                Inspect Record
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5E5A51] uppercase">Select Registered:</span>
              <select
                value={searchInput}
                onChange={(e) => loadEntityDetails(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-[#C7C0B4] rounded-lg font-mono font-bold text-[#5E513F] focus:outline-none cursor-pointer"
              >
                {allEntities.slice(0, 30).map((e) => (
                  <option key={e.entity_id} value={e.entity_id}>
                    {e.entity_id} - {e.business_name.slice(0, 22)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <Loader label="Fetching reference entity from registry and scoring candidate pairs..." />
          ) : errorMsg ? (
            <ErrorState
              title="Registry Entity Not Found"
              message={errorMsg}
              onRetry={() => loadEntityDetails(allEntities[0]?.entity_id || '11743365')}
            />
          ) : activeEntity ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Reference Entity Card */}
              <div className="lg:col-span-1 space-y-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#5E5A51]">
                  Reference Company Record
                </h2>
                <EntityCard entity={activeEntity} showActions={false} />

                <div className="bg-[#252522] text-[#F1EBDD] border border-[#4A4A43] rounded-xl p-5 text-sm space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-[#C6A15B] font-bold uppercase text-xs tracking-wider">
                    <Database className="w-4 h-4" />
                    <span>Dense Vector Candidate Generation</span>
                  </div>
                  <p className="text-[#B8B2A5] leading-relaxed text-xs">
                    Company <code className="text-[#C6A15B] font-mono font-bold">{activeEntity.entity_id}</code> generated{' '}
                    <strong className="text-[#F1EBDD]">{candidates.length} nearest neighbors</strong> from FAISS IndexFlatIP.
                  </p>
                </div>
              </div>

              {/* Candidates List Panel */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#5E5A51]">
                    Evaluated Candidate Pairs ({filteredCandidates.length} of {candidates.length})
                  </h2>

                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#7E796E]" />
                    <select
                      value={candidateFilter}
                      onChange={(e) => setCandidateFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-[#C7C0B4] rounded-lg text-[#252522] font-semibold focus:outline-none"
                    >
                      <option value="ALL">All Candidates</option>
                      <option value="MATCH">Matches Only</option>
                      <option value="REJECTED">Rejected Candidates</option>
                      <option value="HIGH">High Confidence (&ge; 90%)</option>
                      <option value="MEDIUM">Medium Confidence (70-89%)</option>
                    </select>
                  </div>
                </div>

                {filteredCandidates.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCandidates.map((c) => (
                      <CandidateCard
                        key={c.candidate_id}
                        source1Id={activeEntity.entity_id}
                        candidate={c}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Candidates Found"
                    description="No candidates matched the selected filter."
                    onAction={() => setCandidateFilter('ALL')}
                    actionLabel="Reset Filters"
                  />
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
