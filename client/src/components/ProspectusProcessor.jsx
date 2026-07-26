import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckSquare, AlertTriangle } from 'lucide-react';
import DagVisualizer from './DagVisualizer';

export default function ProspectusProcessor({ user }) {
  const [program] = useState(user?.program || 'IT');
  const [targetYearLevel, setTargetYearLevel] = useState(1);
  const [targetSemester, setTargetSemester] = useState('2nd');
  const [passedCourses] = useState(user?.passedCourses || []);
  const [failedCourses, setFailedCourses] = useState(user?.failedCourses || ['CIS 1101']);
  const [searchQuery, setSearchQuery] = useState('');

  // Exception Flags State
  const [exceptionFlags, setExceptionFlags] = useState({
    courseOverride: false,
    overload: false,
    simultaneous: false,
    petitionNeeded: false
  });

  const [scheduleResult, setScheduleResult] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);

  // Fetch Course Catalog for current Program
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch(`/api/courses/${program}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAvailableCourses(data.courses);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend server API offline, using fallback catalog');
      }
    }
    fetchCourses();
  }, [program]);

  // Recalculate Prospectus Schedule via Backend API
  const calculateSchedule = useCallback(async () => {
    try {
      const response = await fetch('/api/generate-prospectus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program,
          passedCourses,
          failedCourses,
          targetYearLevel,
          targetSemester,
          exceptionFlags
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setScheduleResult(resData.data);
          return;
        }
      }
    } catch (err) {
      console.warn('Fetch fallback to local calculation:', err);
    }
  }, [program, passedCourses, failedCourses, targetYearLevel, targetSemester, exceptionFlags]);

  // Trigger recalculation on state changes
  useEffect(() => {
    calculateSchedule();
  }, [calculateSchedule]);

  // Toggle Failed Course status cleanly (State Rollback)
  const toggleFailedCourse = (code) => {
    if (failedCourses.includes(code)) {
      setFailedCourses(failedCourses.filter(c => c !== code));
    } else {
      setFailedCourses([...failedCourses, code]);
    }
  };

  // Toggle Exception Switches
  const toggleException = (key) => {
    setExceptionFlags(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter courses for checklist
  const filteredChecklistCourses = availableCourses.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-900">{program} Curriculum</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">ID: {user?.username || '21102941'}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Prospectus Processor</h1>
          <p className="text-xs text-slate-500">Calculate non-block prospectus schedule & evaluate DAG prerequisite chains.</p>
        </div>

        {/* Term Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <select
            value={targetYearLevel}
            onChange={(e) => setTargetYearLevel(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none"
          >
            <option value={1}>Year 1</option>
            <option value={2}>Year 2</option>
            <option value={3}>Year 3</option>
            <option value={4}>Year 4</option>
          </select>

          <select
            value={targetSemester}
            onChange={(e) => setTargetSemester(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none"
          >
            <option value="1st">1st Semester</option>
            <option value="2nd">2nd Semester</option>
            <option value="Summer">Summer Term</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Control Panel (Left) & Output Schedule (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: INPUT SECTION & EXCEPTION TOGGLES (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Failed Course Checklist */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Deficient / Failed Courses</h3>
              {failedCourses.length > 0 && (
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {failedCourses.length} Failed
                </span>
              )}
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter subjects (e.g. CIS 1101)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Course Checklist */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredChecklistCourses.length === 0 ? (
                <p className="text-center py-4 text-slate-400 text-xs">No subjects match search.</p>
              ) : (
                filteredChecklistCourses.map((c) => {
                  const isChecked = failedCourses.includes(c.code);
                  return (
                    <div
                      key={c.code}
                      onClick={() => toggleFailedCourse(c.code)}
                      className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-rose-50/60 border-rose-200'
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                          isChecked ? 'bg-rose-500 text-white' : 'border border-slate-300'
                        }`}>
                          {isChecked && <CheckSquare className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isChecked ? 'text-rose-900' : 'text-slate-800'}`}>{c.code}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{c.title}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">Yr {c.yearLevel}-{c.semester}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Conditional Exception Toggles */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              Conditional Exceptions
            </h3>

            <div className="space-y-2.5">
              
              {/* 1. Course Override */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Course Override</label>
                  <p className="text-[10px] text-slate-500">Waive prerequisite restriction for target term</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleException('courseOverride')}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    exceptionFlags.courseOverride ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                    exceptionFlags.courseOverride ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* 2. Overload Permission */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Overload Permission</label>
                  <p className="text-[10px] text-slate-500">Extend maximum credit load to 27 units</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleException('overload')}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    exceptionFlags.overload ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                    exceptionFlags.overload ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* 3. Simultaneous Enrollment */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Simultaneous Enrollment</label>
                  <p className="text-[10px] text-slate-500">Co-enroll prerequisite & dependent in same term</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleException('simultaneous')}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    exceptionFlags.simultaneous ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                    exceptionFlags.simultaneous ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* 4. Petition / Tutorial Request */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Petition Request</label>
                  <p className="text-[10px] text-slate-500">Flag off-cycle unoffered subjects</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleException('petitionNeeded')}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    exceptionFlags.petitionNeeded ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                    exceptionFlags.petitionNeeded ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT PANEL: DYNAMIC OUTPUT SCHEDULE (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Target Term Schedule</h2>
                <p className="text-xs text-slate-500">Year {targetYearLevel} • {targetSemester} Semester Optimal Schedule</p>
              </div>

              {/* Unit Load Progress */}
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900">
                  {scheduleResult?.totalScheduledUnits || 0} / {scheduleResult?.maxUnits || 21} Units
                </span>
                <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, ((scheduleResult?.totalScheduledUnits || 0) / (scheduleResult?.maxUnits || 21)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Critical Path Warning */}
            {scheduleResult?.criticalPathWarnings?.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-0.5">
                <div className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>DAG Lockout Warning</span>
                </div>
                <p className="text-[11px] text-rose-700">{scheduleResult.criticalPathWarnings[0]?.message}</p>
              </div>
            )}

            {/* Scheduled Courses */}
            <div className="space-y-2">
              {!scheduleResult || scheduleResult.packedSchedule.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-xs">No subjects scheduled for this term.</p>
              ) : (
                scheduleResult.packedSchedule.map((course) => {
                  let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  let badgeLabel = 'Eligible';

                  if (course.status === 'retake_required') {
                    badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
                    badgeLabel = 'Retake Required';
                  } else if (course.status === 'override_waived') {
                    badgeStyle = 'bg-brand-100 text-brand-800 border-brand-200 font-bold';
                    badgeLabel = 'Override Active';
                  } else if (course.status === 'simultaneous_coenroll') {
                    badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
                    badgeLabel = 'Simultaneous';
                  } else if (course.status === 'petition_requested') {
                    badgeStyle = 'bg-purple-100 text-purple-800 border-purple-200 font-bold';
                    badgeLabel = 'Petition Needed';
                  }

                  return (
                    <div
                      key={course.code}
                      className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between hover:border-slate-200 transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">{course.code}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{course.title}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">{course.units}u</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DAG Visualizer */}
          <DagVisualizer
            dagNodes={scheduleResult?.dagNodes || []}
            targetYearLevel={targetYearLevel}
            targetSemester={targetSemester}
          />

        </div>

      </div>
    </div>
  );
}
