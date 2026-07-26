import React from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle2, Clock, Moon, Sun } from 'lucide-react';

export default function Navbar({
  user,
  program,
  graduationSummary,
  searchQuery,
  setSearchQuery,
  darkMode,
  toggleDarkMode,
  onOpenWizard
}) {
  const isExtended = graduationSummary?.statusMessage?.includes('Delayed');

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 px-6 flex items-center justify-between transition-colors duration-200">
      
      {/* Search Input Bar */}
      <div className="relative w-72 sm:w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search subjects, prerequisites, code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {/* Right Header Status Indicators */}
      <div className="flex items-center space-x-3">
        {/* Status Pill Badge */}
        <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
          isExtended
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        }`}>
          {isExtended ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          <span>{graduationSummary?.statusMessage || 'Analyzing Prospectus...'}</span>
        </div>

        {/* Quick Audit Button */}
        <button
          onClick={onOpenWizard}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Audit Progress</span>
        </button>
      </div>

    </header>
  );
}
