import React from 'react';
import { GitBranch, CheckCircle2, AlertTriangle, Lock, Zap, ArrowRight } from 'lucide-react';

export default function DagVisualizer({ dagNodes = [], targetYearLevel, targetSemester }) {
  if (!dagNodes || dagNodes.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs font-medium">
        No DAG graph data available for visualization.
      </div>
    );
  }

  // Filter nodes relevant to current year level & immediate dependencies
  const currentNodes = dagNodes.filter(n => n.yearLevel === targetYearLevel);
  const blockedNodes = dagNodes.filter(n => n.state === 'blocked');
  const enrolledNodes = dagNodes.filter(n => n.state === 'enrolled');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft">
      {/* Visualizer Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Prerequisite DAG Dependency Visualizer</h3>
            <p className="text-[11px] text-slate-500 font-medium">Interactive flow tree for Year {targetYearLevel} • {targetSemester} Semester</p>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="hidden sm:flex items-center space-x-3 text-[11px] font-semibold">
          <span className="flex items-center space-x-1 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Enrolled</span>
          </span>
          <span className="flex items-center space-x-1 text-rose-600">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>DAG Blocked</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Prerequisite Required</span>
          </span>
        </div>
      </div>

      {/* Visual Node Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Column 1: Active Enrolled Subjects */}
        <div className="bg-emerald-50/40 rounded-xl border border-emerald-100 p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Scheduled Enrolled ({enrolledNodes.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {enrolledNodes.slice(0, 6).map(node => (
              <div key={node.id} className="bg-white p-2.5 rounded-lg border border-emerald-200/60 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{node.id}</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{node.title}</p>
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  {node.units}u
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Prerequisite Connection Bridge */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/60 p-3.5 flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-2 shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mb-1">DAG Dependency Flow</h4>
          <p className="text-[11px] text-slate-500 max-w-[180px]">
            Forward traversal maps prerequisite blocks & unlocks downstream courses.
          </p>
          <div className="flex items-center space-x-1 mt-3 text-brand-600 text-xs font-bold">
            <span>Prerequisites</span>
            <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
            <span>Target Term</span>
          </div>
        </div>

        {/* Column 3: DAG Blocked Subjects */}
        <div className="bg-rose-50/40 rounded-xl border border-rose-100 p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>DAG Blocked Vector ({blockedNodes.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {blockedNodes.length === 0 ? (
              <p className="text-center text-slate-400 text-[11px] py-4">No subjects blocked by DAG prerequisite failure!</p>
            ) : (
              blockedNodes.slice(0, 6).map(node => (
                <div key={node.id} className="bg-white p-2.5 rounded-lg border border-rose-200/60 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-900">{node.id}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{node.title}</p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                    Locked
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
