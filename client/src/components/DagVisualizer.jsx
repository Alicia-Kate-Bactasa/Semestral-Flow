import React, { useState } from 'react';
import { GitFork, CheckCircle2, AlertCircle, Lock, Unlock, Search, ArrowRight } from 'lucide-react';

export default function DagVisualizer({ dagNodes = [], program }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterState, setFilterState] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!dagNodes || dagNodes.length === 0) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
        <GitFork className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Graph Data Available</h3>
        <p className="text-xs text-slate-500">Generate a prospectus plan to visualize prerequisite dependencies.</p>
      </div>
    );
  }

  // Filter nodes
  const filteredNodes = dagNodes.filter(node => {
    const matchesFilter = filterState === 'all' || node.state === filterState;
    const matchesSearch = !searchQuery || 
      node.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      node.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    completed: dagNodes.filter(n => n.state === 'completed').length,
    failed: dagNodes.filter(n => n.state === 'failed').length,
    available: dagNodes.filter(n => n.state === 'available').length,
    locked: dagNodes.filter(n => n.state === 'locked').length,
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitFork className="w-5 h-5 text-brand-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Prerequisite Dependency Flowchart ({program})
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual breakdown of unlocked, completed, failed, and locked curriculum courses.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `All (${dagNodes.length})` },
            { id: 'available', label: `Unlocked (${counts.available})`, color: 'text-brand-600 bg-brand-50 border-brand-200' },
            { id: 'completed', label: `Passed (${counts.completed})`, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { id: 'failed', label: `Failed (${counts.failed})`, color: 'text-rose-600 bg-rose-50 border-rose-200' },
            { id: 'locked', label: `Locked (${counts.locked})`, color: 'text-slate-500 bg-slate-100 border-slate-200' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterState(f.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                filterState === f.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredNodes.map((node) => {
          const isPassed = node.state === 'completed';
          const isFailed = node.state === 'failed';
          const isAvailable = node.state === 'available';
          const isLocked = node.state === 'locked';

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-card flex flex-col justify-between space-y-3 ${
                isPassed
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400'
                  : (isFailed
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 hover:border-rose-400'
                      : (isAvailable
                          ? 'bg-brand-50/70 dark:bg-brand-950/20 border-brand-300 dark:border-brand-800 hover:border-brand-400'
                          : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'))
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {node.id}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {node.title}
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                  {node.units}u
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-1">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                  isPassed
                    ? 'bg-emerald-500 text-white'
                    : (isFailed
                        ? 'bg-rose-500 text-white'
                        : (isAvailable
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-400 text-white'))
                }`}>
                  {isPassed ? 'Passed' : (isFailed ? 'Failed / Retake' : (isAvailable ? 'Unlocked / Ready' : 'Prereq Locked'))}
                </span>

                <span className="text-[10px] font-medium text-slate-400">
                  Y{node.yearLevel} {node.semester} Sem
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* NODE DETAILS MODAL */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedNode.id} • {selectedNode.title}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Year {selectedNode.yearLevel} • {selectedNode.semester} Semester ({selectedNode.units} Units)
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prerequisites Required:</p>
              {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.prerequisites.map(p => (
                    <span key={p} className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No prerequisite requirements.</p>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs rounded-xl"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
