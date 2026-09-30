import React from 'react';
import { Loader2 } from 'lucide-react';

export function Loader({ label = 'Loading details...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-slate-500 dark:text-slate-400 gap-3 ${className}`}>
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
      <p className="text-xs font-medium tracking-wide uppercase">{label}</p>
    </div>
  );
}
