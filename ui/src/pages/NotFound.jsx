import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { FileQuestion, LayoutDashboard, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
        <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div>
          <span className="font-mono text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 block mb-1">404</span>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Page Not Found</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            The requested EntityMatch AI route or reference record could not be found. Please check the URL or return to the main dashboard.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <Link to="/dashboard" className="w-full">
            <Button variant="primary" className="w-full" icon={LayoutDashboard}>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
