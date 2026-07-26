import React, { useState, useEffect, useCallback } from 'react';
import { Search, Check, Sparkles, ArrowRight, RotateCcw, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProspectusProcessor({ user }) {
  const [program, setProgram] = useState(user?.program || 'IT');
  const [failedCourses, setFailedCourses] = useState([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [scheduleResult, setScheduleResult] = useState(null);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);

  // Active Year Level tab (Default Year 1 selected)
  const [activeYearTab, setActiveYearTab] = useState(1);

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
        console.warn('Catalog fetch fallback:', err);
      }
    }
    fetchCourses();
  }, [program]);

  // Generate custom academic plan across all years
  const generatePlan = useCallback(async () => {
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
          setHasGeneratedPlan(true);
        }
      }
    } catch (err) {
      console.warn('Plan generation fallback:', err);
    }
  }, [program, failedCourses, user]);

  // Toggle failed subject checkmark
  const toggleFailedCourse = (code) => {
    if (failedCourses.includes(code)) {
      setFailedCourses(failedCourses.filter(c => c !== code));
    } else {
      setFailedCourses([...failedCourses, code]);
    }
  };

  // Filter courses for wizard checklist
  const filteredCourses = availableCourses.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map DAG node states if plan generated
  const dagStateMap = new Map();
  if (scheduleResult?.dagNodes) {
    scheduleResult.dagNodes.forEach(node => {
      dagStateMap.set(node.id, node.state);
    });
  }

  // Check if failing subjects forces an extension beyond Year 4
  const hasExtension = scheduleResult?.blockedPool?.some(b => b.yearLevel >= 4);
  const yearTabs = hasExtension ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];

  // Group catalog courses by Year Level and Semester
  const coursesByYear = {
    1: {
      '1st Semester': availableCourses.filter(c => c.yearLevel === 1 && c.semester === '1st'),
      '2nd Semester': availableCourses.filter(c => c.yearLevel === 1 && c.semester === '2nd'),
    },
    2: {
      '1st Semester': availableCourses.filter(c => c.yearLevel === 2 && c.semester === '1st'),
      '2nd Semester': availableCourses.filter(c => c.yearLevel === 2 && c.semester === '2nd'),
    },
    3: {
      '1st Semester': availableCourses.filter(c => c.yearLevel === 3 && c.semester === '1st'),
      '2nd Semester': availableCourses.filter(c => c.yearLevel === 3 && c.semester === '2nd'),
    },
    4: {
      '1st Semester': availableCourses.filter(c => c.yearLevel === 4 && c.semester === '1st'),
      '2nd Semester': availableCourses.filter(c => c.yearLevel === 4 && c.semester === '2nd'),
    },
    5: {
      '1st Semester (Extended)': scheduleResult?.blockedPool?.filter(b => b.yearLevel >= 4) || [],
      '2nd Semester (Extended)': [],
    }
  };

  const currentYearData = coursesByYear[activeYearTab] || { '1st Semester': [], '2nd Semester': [] };
  const sem1Title = activeYearTab === 5 ? '1st Semester (Extended)' : '1st Semester';
  const sem2Title = activeYearTab === 5 ? '2nd Semester (Extended)' : '2nd Semester';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Friendly Welcome Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-4 shadow-card">
        <span className="px-4 py-1 text-xs font-semibold text-brand-600 bg-brand-50 rounded-full border border-brand-100 inline-block">
          Simple Academic Planning
        </span>

        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Hi {user?.name?.split(' ')[0] || 'Student'}, let's organize your subjects!
        </h1>
        
        <p className="text-sm text-slate-500 max-w-lg mx-auto font-normal">
          Confused with your academic path? <span className="text-slate-800 font-medium">Let me help you!</span> Select an option below to get started.
        </p>

        {/* 2 Big Friendly Beginner Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
          
          {/* Option A: Plan Custom Path */}
          <div
            onClick={() => setIsWizardOpen(true)}
            className="p-6 bg-slate-900 text-white rounded-3xl cursor-pointer hover:bg-slate-800 transition-all text-left space-y-2 group shadow-subtle"
          >
            <div className="flex justify-between items-center">
              <span className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs">1</span>
              <Sparkles className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-base font-bold">I failed / missed a subject</h3>
            <p className="text-xs text-slate-300 font-normal">Tell us what you missed and we'll recalculate your entire prospectus from Year 1 to graduation.</p>
          </div>

          {/* Option B: Standard Prospectus */}
          <div
            onClick={() => { setFailedCourses([]); setHasGeneratedPlan(false); }}
            className="p-6 bg-slate-50 text-slate-900 rounded-3xl border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition-all text-left space-y-2 group"
          >
            <div className="flex justify-between items-center">
              <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">2</span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-base font-bold">Show standard prospectus</h3>
            <p className="text-xs text-slate-500 font-normal">View the regular 4-year course catalog for your degree.</p>
          </div>

        </div>
      </div>

      {/* RECALCULATED PLAN SUMMARY BANNER (If plan generated) */}
      {hasGeneratedPlan && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom Recalculated Prospectus Active</h2>
              <p className="text-xs text-slate-500">
                {failedCourses.length > 0 
                  ? `Recalculated full 4-year flow to resolve failed subject(s): ${failedCourses.join(', ')}` 
                  : 'Displaying standard 4-year curriculum path'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-full text-xs transition-colors flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Modify Failed Courses</span>
          </button>
        </div>
      )}

      {/* Warning Banner if prerequisite lockouts occurred */}
      {hasGeneratedPlan && scheduleResult?.criticalPathWarnings?.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-xs text-rose-900 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800">Prerequisite Lockout Delay Notice</p>
            <p className="text-rose-700 mt-0.5">
              Failing prerequisite subjects locks downstream higher-level courses. Below, locked courses are highlighted with a 🔒 badge.
            </p>
          </div>
        </div>
      )}

      {/* MAIN SINGLE-VIEW HORIZONTAL SLIDING TABS / PROSPECTUS */}
      <div className="space-y-6">
        
        {/* Header & Year Level Sliding Drawer Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-card">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {hasGeneratedPlan ? `Recalculated BS ${program} Prospectus` : `Full BS ${program} Prospectus`}
            </h2>
            <p className="text-xs text-slate-500">Select year tab to view both semesters in one screen</p>
          </div>

          {/* Circular Year Level Drawer Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/60 self-start sm:self-auto overflow-x-auto max-w-full">
            {yearTabs.map(year => (
              <button
                key={year}
                onClick={() => setActiveYearTab(year)}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                  activeYearTab === year
                    ? 'bg-slate-900 text-white shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {year === 5 ? 'Year 5 (Extended)' : `Year ${year}`}
              </button>
            ))}
          </div>
        </div>

        {/* SINGLE VIEW GRID: 1st Semester & 2nd Semester Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* 1st Semester Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Year {activeYearTab} • {sem1Title}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {(currentYearData[sem1Title] || []).reduce((sum, c) => sum + c.units, 0).toFixed(1)} Total Units
              </span>
            </div>

            <div className="space-y-2.5">
              {(!currentYearData[sem1Title] || currentYearData[sem1Title].length === 0) ? (
                <p className="text-center py-6 text-slate-400 text-xs">No courses scheduled for this semester.</p>
              ) : (
                currentYearData[sem1Title].map(c => {
                  const state = dagStateMap.get(c.code);
                  const isFailed = failedCourses.includes(c.code);
                  const isEnrolled = scheduleResult?.packedSchedule?.some(ps => ps.code === c.code);

                  return (
                    <div key={c.code} className="p-3.5 rounded-2xl border border-slate-100 bg-white flex items-center justify-between hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">{c.code}</span>
                          
                          {/* Recalculated Status Badges */}
                          {hasGeneratedPlan && isFailed && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              Must Retake
                            </span>
                          )}
                          {hasGeneratedPlan && !isFailed && isEnrolled && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Scheduled Next
                            </span>
                          )}
                          {hasGeneratedPlan && state === 'blocked' && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              🔒 Prereq Locked
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-normal">{c.title}</p>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200/60 shrink-0 ml-2">
                        {Number(c.units).toFixed(1)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2nd Semester Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Year {activeYearTab} • {sem2Title}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {(currentYearData[sem2Title] || []).reduce((sum, c) => sum + c.units, 0).toFixed(1)} Total Units
              </span>
            </div>

            <div className="space-y-2.5">
              {(!currentYearData[sem2Title] || currentYearData[sem2Title].length === 0) ? (
                <p className="text-center py-6 text-slate-400 text-xs">No courses scheduled for this semester.</p>
              ) : (
                currentYearData[sem2Title].map(c => {
                  const state = dagStateMap.get(c.code);
                  const isFailed = failedCourses.includes(c.code);
                  const isEnrolled = scheduleResult?.packedSchedule?.some(ps => ps.code === c.code);

                  return (
                    <div key={c.code} className="p-3.5 rounded-2xl border border-slate-100 bg-white flex items-center justify-between hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">{c.code}</span>
                          
                          {/* Recalculated Status Badges */}
                          {hasGeneratedPlan && isFailed && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              Must Retake
                            </span>
                          )}
                          {hasGeneratedPlan && !isFailed && isEnrolled && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Scheduled Next
                            </span>
                          )}
                          {hasGeneratedPlan && state === 'blocked' && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              🔒 Prereq Locked
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-normal">{c.title}</p>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200/60 shrink-0 ml-2">
                        {Number(c.units).toFixed(1)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* BEGINNER-FRIENDLY WIZARD MODAL */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-card border border-slate-200 space-y-6 animate-fadeIn">
            
            {/* Header */}
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">Step 1 of 2</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Which subjects did you miss?</h3>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Program Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-2">Academic Program</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-full border border-slate-200/60">
                {['IT', 'CS', 'IS'].map(prog => (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => setProgram(prog)}
                    className={`py-1.5 text-xs font-bold rounded-full transition-all ${
                      program === prog
                        ? 'bg-white text-slate-900 shadow-subtle'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    BS {prog}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Type course code or title (e.g. CIS 1101)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Subject Checkbox List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredCourses.map(c => {
                const isChecked = failedCourses.includes(c.code);
                return (
                  <div
                    key={c.code}
                    onClick={() => toggleFailedCourse(c.code)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-rose-50 border-rose-300'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-rose-500 text-white' : 'border border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isChecked ? 'text-rose-900' : 'text-slate-800'}`}>{c.code}</p>
                        <p className="text-[11px] text-slate-500">{c.title}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {Number(c.units).toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium ml-2">
                {failedCourses.length} subject(s) selected
              </span>

              <button
                type="button"
                onClick={() => {
                  generatePlan();
                  setIsWizardOpen(false);
                }}
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full text-xs transition-all flex items-center space-x-2 shadow-subtle"
              >
                <span>Calculate My Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
