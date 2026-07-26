import React from 'react';

export default function DagVisualizer({ dagNodes = [], targetYearLevel, targetSemester }) {
  if (!dagNodes || dagNodes.length === 0) return null;

  const blockedNodes = dagNodes.filter(n => n.state === 'blocked');
  const enrolledNodes = dagNodes.filter(n => n.state === 'enrolled');

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Prerequisite Dependency Graph
        </h3>
        <span className="text-[11px] text-slate-500 font-medium">Year {targetYearLevel} • {targetSemester} Semester</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Scheduled Enrolled */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/60">
          <p className="text-xs font-bold text-slate-900 mb-2">Scheduled ({enrolledNodes.length})</p>
          <div className="space-y-1.5">
            {enrolledNodes.slice(0, 6).map(node => (
              <div key={node.id} className="bg-white p-2 rounded border border-slate-200 text-xs flex justify-between">
                <span className="font-bold text-slate-800">{node.id}</span>
                <span className="text-slate-500">{node.units}u</span>
              </div>
            ))}
          </div>
        </div>

        {/* DAG Blocked Vector */}
        <div className="bg-rose-50/50 p-3.5 rounded-lg border border-rose-200/60">
          <p className="text-xs font-bold text-rose-900 mb-2">Blocked Prerequisites ({blockedNodes.length})</p>
          <div className="space-y-1.5">
            {blockedNodes.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-2">No subjects blocked by DAG prerequisite failure.</p>
            ) : (
              blockedNodes.slice(0, 6).map(node => (
                <div key={node.id} className="bg-white p-2 rounded border border-rose-200 text-xs flex justify-between">
                  <span className="font-bold text-rose-800">{node.id}</span>
                  <span className="text-rose-600 font-medium">Locked</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
