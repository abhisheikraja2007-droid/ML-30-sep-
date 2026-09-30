import React from 'react';
import { Database } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  title = 'No records found',
  description = 'No matching data found for your current search criteria or selection.',
  icon: Icon = Database,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-300 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h4>
      <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mt-1.5 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
