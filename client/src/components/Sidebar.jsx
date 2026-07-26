import React from 'react';
import { Calendar, GitFork, FileText, UserCheck, Moon, Sun, Sparkles, LogOut, Layers } from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  program,
  setProgram,
  darkMode,
  toggleDarkMode,
  onOpenWizard,
  onLogout
}) {
  const navItems = [
    { id: 'planner', label: 'Prospectus Planner', icon: Calendar },
    { id: 'dag', label: 'Prerequisite Flowchart', icon: GitFork },
    { id: 'petitions', label: 'Petition Hub', icon: FileText },
    { id: 'profile', label: 'Student Profile', icon: UserCheck },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-colors duration-200 z-30">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-500/20">
            SF
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight block leading-none">
              Semestral<span className="text-brand-500">Flow</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Irregular Student Planner</span>
          </div>
        </div>
      </div>

      {/* Program Selector Toggle */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
          Academic Program
        </label>
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          {['IT', 'CS', 'IS'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProgram(p)}
              className={`py-1 text-xs font-bold rounded-lg transition-all ${
                program === p
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Re-run Onboarding Wizard Button */}
        <div className="pt-4">
          <button
            onClick={onOpenWizard}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Re-Audit My Courses</span>
          </button>
        </div>
      </nav>

      {/* Bottom User Controls */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Dark Mode</span>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {user?.name || 'Student User'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{user?.username || '21102941'}</p>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}
