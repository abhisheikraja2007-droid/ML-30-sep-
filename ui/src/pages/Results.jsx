import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resultsService } from '../services/resultsService';
import { historyService } from '../services/historyService';
import { useToast } from '../context/ToastContext';
import { ResultsTable } from '../components/results/ResultsTable';
import { ResultFilters } from '../components/results/ResultFilters';
import { Loader } from '../components/common/Loader';
import { Button } from '../components/common/Button';
import { generateMatchingResultsTSV, generateCandidatePairsTSV, triggerFileDownload } from '../utils/exportUtils';
import { Download, FileSpreadsheet, Info } from 'lucide-react';

export function Results() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [resultsList, setResultsList] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [sortField, setSortField] = useState('source1_entity_id');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      try {
        const fullData = await resultsService.getResults(searchQuery, statusFilter, countryFilter);
        setResultsList(fullData);
        if (allResults.length === 0 && searchQuery === '' && statusFilter === 'ALL' && countryFilter === 'ALL') {
          setAllResults(fullData);
        }
      } catch (err) {
        toast.error('Failed to load entity matching results.');
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [searchQuery, statusFilter, countryFilter]);

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCountryFilter('ALL');
  };

  const handleExportMatchingResults = async () => {
    const dataToExport = allResults.length > 0 ? allResults : resultsList;
    const tsvContent = generateMatchingResultsTSV(dataToExport);
    triggerFileDownload(tsvContent, 'matching_results.tsv');
    await historyService.addLog('Exported matching_results.tsv', 'EXPORT', 'GLOBAL', `Exported ${dataToExport.length} rows TSV file.`);
    toast.success('Generated matching_results.tsv successfully (TAB-separated).');
  };

  const handleExportCandidatePairs = async () => {
    const dataToExport = allResults.length > 0 ? allResults : resultsList;
    const tsvContent = generateCandidatePairsTSV(dataToExport);
    triggerFileDownload(tsvContent, 'candidate_pairs.tsv');
    await historyService.addLog('Exported candidate_pairs.tsv', 'EXPORT', 'GLOBAL', `Exported ${dataToExport.length} candidate rows.`);
    toast.success('Generated candidate_pairs.tsv successfully (TAB-separated).');
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDir === 'asc';
    setSortDir(isAsc ? 'desc' : 'asc');
    setSortField(field);

    const sorted = [...resultsList].sort((a, b) => {
      const valA = a[field] || '';
      const valB = b[field] || '';
      if (valA < valB) return isAsc ? 1 : -1;
      if (valA > valB) return isAsc ? -1 : 1;
      return 0;
    });
    setResultsList(sorted);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-[#252522] flex items-center gap-3 tracking-tight">
            <FileSpreadsheet className="w-8 h-8 text-[#C6A15B] shrink-0" />
            <span>Final Matching Output Results</span>
          </h1>
          <p className="text-base text-[#5E5A51]">
            Inspect matching output table representing <code className="font-mono text-[#5E513F] font-bold">matching_results.tsv</code> and candidate sets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button variant="secondary" size="md" icon={Download} onClick={handleExportCandidatePairs}>
            Export candidate_pairs.tsv
          </Button>
          <Button variant="primary" size="md" icon={Download} onClick={handleExportMatchingResults}>
            Export matching_results.tsv
          </Button>
        </div>
      </div>

      {/* Info Callout */}
      <div className="bg-[#E9E2D5] border border-[#C7C0B4] rounded-xl p-4 text-sm text-[#252522] flex items-center gap-3">
        <Info className="w-5 h-5 text-[#C6A15B] shrink-0" />
        <span>
          <strong>TSV Export Format Compliance:</strong> Columns use Tab (<code className="font-mono font-bold">\t</code>) separators. Multi-target matches use comma-separated lists. Singletons produce an empty second column field (never string placeholders).
        </span>
      </div>

      {/* Filters Bar */}
      <ResultFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        countryFilter={countryFilter}
        onCountryChange={setCountryFilter}
        onReset={handleReset}
      />

      {/* Results Table */}
      {loading ? (
        <Loader label="Loading matching results dataset..." />
      ) : (
        <ResultsTable
          results={resultsList}
          onSort={handleSort}
          sortField={sortField}
          sortDir={sortDir}
        />
      )}
    </div>
  );
}

