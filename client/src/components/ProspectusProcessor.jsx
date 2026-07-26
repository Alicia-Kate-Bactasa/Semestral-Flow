import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  BookOpen, 
  Sparkles, 
  CheckCircle, 
  RotateCcw, 
  FileCheck, 
  ShieldAlert,
  Search,
  ChevronRight,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import DagVisualizer from './DagVisualizer';

export default function ProspectusProcessor({ user }) {
  const [program, setProgram] = useState(user?.program || 'IT');
  const [targetYearLevel, setTargetYearLevel] = useState(1);
  const [targetSemester, setTargetSemester] = useState('2nd');
  const [passedCourses, setPassedCourses] = useState([]);
  const [failedCourses, setFailedCourses] = useState(['CIS 1101']);
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
  const [isLoading, setIsLoading] = useState(false);

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

  // Recalculate Prospectus Schedule via Backend API (or client fallback)
  const calculateSchedule = useCallback(async () => {
    setIsLoading(true);
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
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Fetch fallback to local calculation:', err);
    }
    setIsLoading(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Dashboard Top Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wider">
              {program} Curriculum
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Student ID: {user?.username || '21102941'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Prospectus DAG Scheduler
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Calculate your non-block prospectus schedule, resolve prerequisite blocks & optimize unit load.
          </p>
        </div>

        {/* Quick Term Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60">
          <select
            value={targetYearLevel}
            onChange={(e) => setTargetYearLevel(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-sm focus-brand-ring cursor-pointer"
          >
            <option value={1}>Year 1</option>
            <option value={2}>Year 2</option>
            <option value={3}>Year 3</option>
            <option value={4}>Year 4</option>
          </select>

          <select
            value={targetSemester}
            onChange={(e) => setTargetSemester(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-sm focus-brand-ring cursor-pointer"
          >
            <option value="1st">1st Semester</option>
            <option value="2nd">2nd Semester</option>
            <option value="Summer">Summer Term</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Control Panel (Left) & Output Schedule (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: INPUT SECTION & EXCEPTION TOGGLES (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Failed / Deficient Course Checklist Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-brand-500" />
                  <span>Failed / Deficient Courses</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Check subjects you need to retake</p>
              </div>

              {failedCourses.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold animate-pulse">
                  {failedCourses.length} Failed
                </span>
              )}
            </div>

            {/* Search filter for subjects */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject code (e.g. CIS 1101)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus-brand-ring placeholder:text-slate-400"
              />
            </div>

            {/* Checklist List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredChecklistCourses.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">No courses found matching search.</div>
              ) : (
                filteredChecklistCourses.map((c) => {
                  const isChecked = failedCourses.includes(c.code);
                  return (
                    <div
                      key={c.code}
                      onClick={() => toggleFailedCourse(c.code)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isChecked
                          ? 'bg-rose-50/70 border-rose-200 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded transition-colors flex items-center justify-center ${
                          isChecked ? 'bg-rose-500 text-white' : 'border border-slate-300'
                        }`}>
                          {isChecked && <CheckSquare className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isChecked ? 'text-rose-900' : 'text-slate-800'}`}>
                            {c.code}
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{c.title}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Yr {c.yearLevel}-{c.semester}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CONDITIONAL EXCEPTION TOGGLES */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Conditional Exceptions
              </h3>
            </div>

            <div className="space-y-3">
              
              {/* 1. Course Override */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors bg-slate-50/50">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Course Override</label>
                  <p className="text-[11px] text-slate-500 font-medium">Bypass prerequisite blocks for target term</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleException('courseOverride')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    exceptionFlags.courseOverride ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    exceptionFlags.courseOverride ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* 2. Overload Permission */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors bg-slate-50/50">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Overload Permission</label>
                  <p className="text-[11px] text-slate-500 font-medium">Extend max units capacity to 27 units</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleException('overload')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    exceptionFlags.overload ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    exceptionFlags.overload ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* 3. Simultaneous Enrollment */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors bg-slate-50/50">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Simultaneous Enrollment</label>
                  <p className="text-[11px] text-slate-500 font-medium">Co-enroll prereq & dependent in same term</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleException('simultaneous')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    exceptionFlags.simultaneous ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    exceptionFlags.simultaneous ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* 4. Petition / Tutorial Request */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors bg-slate-50/50">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Petition / Tutorial Request</label>
                  <p className="text-[11px] text-slate-500 font-medium">Flag off-cycle unoffered subjects</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleException('petitionNeeded')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    exceptionFlags.petitionNeeded ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    exceptionFlags.petitionNeeded ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT PANEL: DYNAMIC OUTPUT SCHEDULE & ANALYTICS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Schedule Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Calculated Prospectus Schedule
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Year {targetYearLevel} • {targetSemester} Semester Optimal Load
                </p>
              </div>

              {/* Dynamic Unit Load Gauge Bar */}
              <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 min-w-[180px]">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600">Unit Load:</span>
                  <span className={scheduleResult?.totalScheduledUnits > 21 ? 'text-brand-600' : 'text-slate-900'}>
                    {scheduleResult?.totalScheduledUnits || 0} / {scheduleResult?.maxUnits || 21} u
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((scheduleResult?.totalScheduledUnits || 0) / (scheduleResult?.maxUnits || 21)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Critical Path Warning Alerts */}
            {scheduleResult?.criticalPathWarnings?.length > 0 && (
              <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-3.5 text-xs text-rose-800 space-y-1 animate-fadeIn">
                <div className="font-extrabold flex items-center space-x-1.5 text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>DAG Prerequisite Lockout Active ({scheduleResult.criticalPathWarnings.length})</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  {scheduleResult.criticalPathWarnings[0]?.message}
                </p>
              </div>
            )}

            {/* Scheduled Course Cards List */}
            <div className="space-y-3">
              {!scheduleResult || scheduleResult.packedSchedule.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  No courses scheduled for this term under current parameters.
                </div>
              ) : (
                scheduleResult.packedSchedule.map((course) => {
                  let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  let badgeLabel = 'Eligible';

                  if (course.status === 'retake_required') {
                    badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200 font-extrabold';
                    badgeLabel = 'Retake Required';
                  } else if (course.status === 'override_waived') {
                    badgeStyle = 'bg-brand-100 text-brand-800 border-brand-200 font-extrabold';
                    badgeLabel = 'Override Waived';
                  } else if (course.status === 'simultaneous_coenroll') {
                    badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200 font-extrabold';
                    badgeLabel = 'Simultaneous';
                  } else if (course.status === 'petition_requested') {
                    badgeStyle = 'bg-purple-100 text-purple-800 border-purple-200 font-extrabold';
                    badgeLabel = 'Petition Needed';
                  }

                  return (
                    <div
                      key={course.code}
                      className="p-4 rounded-xl border border-slate-100 bg-white hover:shadow-soft transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900">{course.code}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700">{course.title}</p>
                        {course.prerequisites?.length > 0 && (
                          <p className="text-[11px] text-slate-400">
                            Prerequisites: {course.prerequisites.join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-right">
                        <div>
                          <span className="text-xs font-extrabold text-slate-900">{course.units} Units</span>
                          <p className="text-[10px] text-slate-400">Unlocks {course.downstreamCount || 0} future subjects</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive DAG Visualizer */}
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
