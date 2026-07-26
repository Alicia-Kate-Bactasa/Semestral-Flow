import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, BookOpen, AlertCircle, CheckCircle2, RefreshCw, ChevronRight, Edit3, ArrowRight, Layers, SwapHorizontal, Info, ShieldAlert } from 'lucide-react';

export default function ProspectusProcessor({
  user,
  program,
  scheduleResult,
  loading,
  onOpenWizard,
  onUpdateSchedule
}) {
  const [activeYearTab, setActiveYearTab] = useState(1);
  const [editingMinorSlot, setEditingMinorSlot] = useState(null);
  const [minorSwapSearch, setMinorSwapSearch] = useState('');

  const regeneratedTerms = scheduleResult?.regeneratedTerms || [];
  const graduationSummary = scheduleResult?.graduationSummary || {};
  const completedUnits = scheduleResult?.completedUnits || 0;
  const totalCurriculumUnits = scheduleResult?.totalCurriculumUnits || 168;
  const remainingUnits = scheduleResult?.remainingUnits || 0;

  // Determine available Year Tabs
  const maxYearInRegenerated = Math.max(4, ...regeneratedTerms.map(t => t.yearLevel));
  const yearTabs = Array.from({ length: maxYearInRegenerated }, (_, i) => i + 1);

  // Available Minor / GE subjects for swapping
  const availableMinors = [
    { code: 'GE-MMW', title: 'Mathematics in the Modern World', units: 3 },
    { code: 'GE-PC', title: 'Purposive Communication', units: 3 },
    { code: 'GE-UTS', title: 'Understanding the Self', units: 3 },
    { code: 'GE-CW', title: 'The Contemporary World', units: 3 },
    { code: 'GE-ART', title: 'Art Appreciation', units: 3 },
    { code: 'GE-ETHICS', title: 'Ethics', units: 3 },
    { code: 'EDM 1', title: 'The Carolinian Missionary', units: 3 },
    { code: 'EDM 2', title: 'Missionary Spirit in Modern Society', units: 3 },
    { code: 'NSTP 1', title: 'National Service Training Program I', units: 3 },
    { code: 'NSTP 2', title: 'National Service Training Program II', units: 3 },
    { code: 'TPE 1101', title: 'Physical Education I', units: 2 },
    { code: 'TPE 1102', title: 'Physical Education II', units: 2 },
  ];

  // Swap Minor Course Handler
  const handleSwapMinor = (newMinor) => {
    if (!editingMinorSlot || !scheduleResult) return;

    const { termId, oldCode } = editingMinorSlot;
    const updatedTerms = regeneratedTerms.map((term) => {
      if (term.id !== termId) return term;
      const updatedCourses = term.courses.map((course) => {
        if (course.code === oldCode) {
          return {
            ...course,
            code: newMinor.code,
            title: newMinor.title,
            units: newMinor.units,
            statusLabel: 'Swapped Minor'
          };
        }
        return course;
      });
      return { ...term, courses: updatedCourses };
    });

    if (onUpdateSchedule) {
      onUpdateSchedule({ ...scheduleResult, regeneratedTerms: updatedTerms });
    }
    setEditingMinorSlot(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Academic Progress Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Completed Units */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Units Completed
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {completedUnits}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {totalCurriculumUnits} units</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((completedUnits / totalCurriculumUnits) * 100))}%` }}
            />
          </div>
        </div>

        {/* Remaining Units */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Remaining Units
          </p>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {remainingUnits} <span className="text-xs font-medium text-slate-400">units to take</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Auto-distributed by algorithm</p>
        </div>

        {/* Graduation Timeline */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Target Graduation
          </p>
          <div className="text-base font-bold text-slate-900 dark:text-white truncate">
            {graduationSummary.targetGraduationTerm || 'AY 2027-2028'}
          </div>
          <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-2">
            Estimated Timeline: {graduationSummary.estimatedYears || 4} Years
          </p>
        </div>

        {/* Re-Audit Action Card */}
        <div className="p-5 bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-3xl shadow-glow flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
              Irregular Student Engine
            </span>
            <p className="text-xs text-white/90 mt-2 font-medium">
              Update passed/failed subjects or completed terms anytime.
            </p>
          </div>
          <button
            onClick={onOpenWizard}
            className="mt-3 w-full py-2 bg-white text-brand-700 font-bold text-xs rounded-xl hover:bg-brand-50 transition-colors shadow-sm flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Re-Audit Prospectus</span>
          </button>
        </div>

      </div>

      {/* Year Level Tab Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {yearTabs.map((yr) => (
            <button
              key={yr}
              onClick={() => setActiveYearTab(yr)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeYearTab === yr
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {yr > 4 ? `Year ${yr} (Extended)` : `Year Level ${yr}`}
            </button>
          ))}
        </div>

        <span className="hidden sm:inline text-xs text-slate-400 font-medium px-3">
          Showing Year {activeYearTab} Terms
        </span>
      </div>

      {/* Render Term Cards for Selected Year */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['1st', '2nd', 'Summer'].map((semType) => {
          const isSem1 = semType === '1st';
          const isSem2 = semType === '2nd';
          const isSummer = semType === 'Summer';

          // Find matching term in scheduleResult
          const matchingTerm = regeneratedTerms.find((t) => {
            if (t.yearLevel !== activeYearTab) return false;
            if (isSem1 && (t.semester === '1st' || t.semester === '1')) return true;
            if (isSem2 && (t.semester === '2nd' || t.semester === '2')) return true;
            if (isSummer && (t.semester === 'Summer' || t.semester === '3rd' || t.semester === '3')) return true;
            return false;
          });

          const courses = matchingTerm?.courses || [];
          const totalUnits = matchingTerm?.totalUnits || 0;
          const isCompletedTerm = matchingTerm?.isCompleted;

          return (
            <div
              key={semType}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-card flex flex-col justify-between space-y-4 ${
                isCompletedTerm
                  ? 'border-slate-200 dark:border-slate-800 opacity-90'
                  : 'border-slate-200/90 dark:border-slate-800'
              }`}
            >
              {/* Term Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {semType} Semester {isSummer ? 'Term' : ''}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Year {activeYearTab} • {isCompletedTerm ? 'Finished Term' : 'Scheduled Term'}
                  </span>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                  {totalUnits}u
                </span>
              </div>

              {/* Course List inside Term */}
              <div className="space-y-2.5 flex-1 min-h-[220px]">
                {courses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                    <p className="text-xs font-medium">No courses scheduled for this term.</p>
                  </div>
                ) : (
                  courses.map((course) => {
                    const isPassed = course.status?.includes('passed');
                    const isFailed = course.status?.includes('failed') || course.status === 'retake_required';
                    const isMinor = course.isMinor;

                    return (
                      <div
                        key={course.code}
                        className={`p-3 rounded-2xl border transition-all space-y-1.5 ${
                          isPassed
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                            : (isFailed
                                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'
                                : (isMinor
                                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                                    : 'bg-slate-50/70 dark:bg-slate-850 border-slate-200/70 dark:border-slate-800'))
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {course.code}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {course.title}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0 ml-2">
                            {course.units}u
                          </span>
                        </div>

                        {/* Status Badges & Controls */}
                        <div className="flex items-center justify-between pt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isPassed
                              ? 'bg-emerald-500 text-white'
                              : (isFailed
                                  ? 'bg-rose-500 text-white'
                                  : (isMinor
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-brand-500 text-white'))
                          }`}>
                            {course.statusLabel || (isPassed ? 'Passed' : 'Scheduled')}
                          </span>

                          {/* Minor Edit / Swap Button (Because minors are first come first serve) */}
                          {isMinor && !isCompletedTerm && (
                            <button
                              type="button"
                              onClick={() => setEditingMinorSlot({ termId: matchingTerm.id, oldCode: course.code })}
                              className="flex items-center space-x-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Swap Minor</span>
                            </button>
                          )}
                        </div>

                        {/* Prerequisite Footnote */}
                        {course.prerequisites && course.prerequisites.length > 0 && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                            Prereq: {course.prerequisites.join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Term Footer Summary */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Max Capacity: 21u</span>
                <span className="font-semibold">{courses.length} Subjects</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SWAP MINOR MODAL */}
      {editingMinorSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Swap General Education / Minor Subject
              </h3>
              <button
                onClick={() => setEditingMinorSlot(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              General Education minors are offered every semester, but enrollment is first-come-first-serve. Choose an available minor to replace <strong className="text-slate-800 dark:text-slate-200">{editingMinorSlot.oldCode}</strong>:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {availableMinors.map((minor) => (
                <div
                  key={minor.code}
                  onClick={() => handleSwapMinor(minor)}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {minor.code}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {minor.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {minor.units}u
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
