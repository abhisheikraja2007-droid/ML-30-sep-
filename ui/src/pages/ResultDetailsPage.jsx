import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resultsService } from '../services/resultsService';
import { ResultDetailsView } from '../components/results/ResultDetails';
import { Loader } from '../components/common/Loader';
import { ErrorState } from '../components/common/ErrorState';

export function ResultDetailsPage() {
  const { source1Id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      setErrorMsg('');
      try {
        const data = await resultsService.getResultDetails(source1Id);
        setDetails(data);
      } catch (err) {
        setErrorMsg(err.message || 'Result detail information could not be retrieved.');
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [source1Id]);

  if (loading) {
    return <Loader label={`Loading result detail tree for ${source1Id}...`} />;
  }

  if (errorMsg) {
    return (
      <ErrorState
        title="Result Details Not Found"
        message={errorMsg}
        onRetry={() => navigate('/results')}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <ResultDetailsView details={details} />
    </div>
  );
}
