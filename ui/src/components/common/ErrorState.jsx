import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'Unable to load data',
  message = 'An unexpected error occurred while processing your request.',
  onRetry,
  className = ''
}) {
  return (
    <div className={`p-6 border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-rose-950 dark:text-rose-200">{title}</h4>
      <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-1 mb-4 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
