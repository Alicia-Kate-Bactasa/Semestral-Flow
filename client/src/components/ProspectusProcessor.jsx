import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckSquare, Sparkles, X, ChevronRight, AlertCircle, Calendar, BookOpen, RotateCcw } from 'lucide-react';

export default function ProspectusProcessor({ user }) {
  const [program, setProgram] = useState(user?.program || 'IT');
  const [failedCourses, setFailedCourses] = useState(['CIS 1101']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [scheduleResult, setScheduleResult] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  // Fetch Course Catalog for selected Program
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch(`/api/courses/${program}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAvailableCourses(data.courses);
          }
        }
      } catch (err) {
        console.warn('Backend server API offline, using catalog fallback');
      }
    }
    fetchCourses();
  }, [program]);

  // Recalculate Prospectus Schedule via Backend API
  const calculateCustomPath = useCallback(async () => {
    try {
      const response = await fetch('/api/generate-prospectus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program,
          passedCourses: user?.passedCourses || [],
          failedCourses,
          targetYearLevel: 1,
          targetSemester: '2nd',
          exceptionFlags: {}
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setScheduleResult(resData.data);
          setIsCalculated(true);
        }
      }
    } catch (err) {
      console.warn('Fallback to standard calculation:', err);
    }
  }, [program, failedCourses, user]);

  // Initial calculation on load
  useEffect(() => {
    calculateCustomPath();
  }, [calculateCustomPath]);

  // Toggle Failed Course checkmark
  const toggleFailedCourse = (code) => {
    if (failedCourses.includes(code)) {
      setFailedCourses(failedCourses.filter(c => c !== code));
    } else {
      setFailedCourses([...failedCourses, code]);
    }
  };

  // Group catalog courses by Year Level and Semester for normal prospectus view
  const groupedCurriculum = availableCourses.reduce((acc, course) => {
    const key = `Year ${course.yearLevel} • ${course.semester} Semester`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {});

  // Filter courses in modal search
  const filteredCourses = availableCourses.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200/60">
              {program} Program
            </span>
            <span className="text-xs text-slate-500 font-medium">Student ID: {user?.username || '21102941'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Academic Prospectus</h1>
          <p className="text-xs text-slate-500 font-normal">
            View your standard curriculum flow or generate a custom path if you failed any subjects.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-xs shadow-subtle transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Plan Your Academic Path!</span>
        </button>
      </div>

      {/* Main Content Area */}
      {isCalculated && failedCourses.length > 0 ? (
        /* RECALCULATED CUSTOM PATH VIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Custom Recalculated Prospectus Path</h2>
              <p className="text-xs text-slate-500">
                Adjusted schedule resolving {failedCourses.length} failed subject(s): <strong className="text-slate-800">{failedCourses.join(', ')}</strong>
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-subtle"
            >
              Modify Failed Courses
            </button>
          </div>

          {/* Warning Banner if prerequisite lockouts occurred */}
          {scheduleResult?.criticalPathWarnings?.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Prerequisite Lockout Delay Detected</span>
              </div>
              <p className="text-[11px] text-rose-700">
                {scheduleResult.criticalPathWarnings[0]?.message}
              </p>
            </div>
          )}

          {/* Scheduled Term Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Term 1: Target Term */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Next Upcoming Term</span>
                <span className="text-xs font-bold text-brand-600">{scheduleResult?.totalScheduledUnits || 0} Units</span>
              </div>

              <div className="space-y-2">
                {scheduleResult?.packedSchedule.map(course => (
                  <div key={course.code} className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{course.code}</span>
                        {course.status === 'retake_required' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                            Retake
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{course.title}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{course.units}u</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Term 2: Next Prerequisites & Extended Path */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Follow-up Term (Prerequisite Unlocks)</span>
                <span className="text-xs font-semibold text-slate-500">Subsequent Semester</span>
              </div>

              <div className="space-y-2">
                {scheduleResult?.blockedPool.slice(0, 4).map(course => (
                  <div key={course.code} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-700">{course.code}</span>
                      <p className="text-xs text-slate-500">{course.title}</p>
                      <p className="text-[10px] text-rose-600">Blocked by: {course.blockedBy?.join(', ')}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{course.units}u</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* STANDARD PROSPECTUS VIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Complete Program Prospectus Flow</h2>
            <span className="text-xs text-slate-500">Standard Course Catalog</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(groupedCurriculum).map(termTitle => (
              <div key={termTitle} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">{termTitle}</span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {groupedCurriculum[termTitle].reduce((sum, c) => sum + c.units, 0)} Total Units
                  </span>
                </div>

                <div className="space-y-2">
                  {groupedCurriculum[termTitle].map(c => (
                    <div key={c.code} className="p-2.5 rounded-lg border border-slate-100 bg-white flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">{c.code}</span>
                          {c.prerequisites?.length > 0 && (
                            <span className="text-[10px] text-slate-400">Prereq: {c.prerequisites.join(', ')}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{c.title}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900">{c.units}u</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLAN YOUR ACADEMIC PATH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-card border border-slate-200 space-y-5 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Plan Your Academic Path!</h3>
                <p className="text-xs text-slate-500">Check any subjects you failed or need to retake</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Program Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Program</label>
              <div className="grid grid-cols-3 gap-2">
                {['IT', 'CS', 'IS'].map(prog => (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => setProgram(prog)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      program === prog
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    BS {prog}
                  </button>
                ))}
              </div>
            </div>

            {/* Search filter for subjects */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject code (e.g. CIS 1101)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Checklist of Courses */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {filteredCourses.map(c => {
                const isChecked = failedCourses.includes(c.code);
                return (
                  <div
                    key={c.code}
                    onClick={() => toggleFailedCourse(c.code)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${
                        isChecked ? 'bg-rose-500 text-white' : 'border border-slate-300'
                      }`}>
                        {isChecked && <CheckSquare className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isChecked ? 'text-rose-900' : 'text-slate-800'}`}>{c.code}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{c.title}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">Yr {c.yearLevel}-{c.semester}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {failedCourses.length} subject(s) marked failed
              </span>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    calculateCustomPath();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-xs shadow-subtle transition-colors"
                >
                  Generate Path
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
