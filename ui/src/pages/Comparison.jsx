import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { entityService } from '../services/entityService';
import { ComparisonPanel } from '../components/entity/ComparisonPanel';
import { Loader } from '../components/common/Loader';
import { ErrorState } from '../components/common/ErrorState';
import { Button } from '../components/common/Button';
import { ArrowLeft } from 'lucide-react';

export function Comparison() {
  const { source1Id, candidateId } = useParams();
  const navigate = useNavigate();

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadComparison() {
      setLoading(true);
      setErrorMsg('');
      try {
        const data = await entityService.getComparison(source1Id, candidateId);
        setComparisonData(data);
      } catch (err) {
        setErrorMsg(err.message || 'Record comparison data could not be retrieved.');
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, [source1Id, candidateId]);

  if (loading) {
    return <Loader label={`Analyzing record pair similarity for ${source1Id} vs ${candidateId}...`} />;
  }

  if (errorMsg) {
    return (
      <ErrorState
        title="Comparison Analysis Failed"
        message={errorMsg}
        onRetry={() => navigate(`/resolve/${source1Id}`)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link to={`/resolve/${source1Id}`}>
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Candidates List
          </Button>
        </Link>
        <span className="text-xs text-[#5E5A51] font-mono">
          Route: /resolve/{source1Id}/compare/{candidateId}
        </span>
      </div>

      <ComparisonPanel
        source1={comparisonData.source1}
        candidate={comparisonData.candidate}
      />
    </div>
  );
}
