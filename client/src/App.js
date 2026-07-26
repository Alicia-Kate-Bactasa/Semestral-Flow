import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, Moon, Sun, RotateCcw, Edit3, Plus, Trash2, Search } from 'lucide-react';

const TERM_NAMES = [
  'Year 1 • 1st Semester',
  'Year 1 • 2nd Semester',
  'Year 1 • Summer Term',
  'Year 2 • 1st Semester',
  'Year 2 • 2nd Semester',
  'Year 2 • Summer Term',
  'Year 3 • 1st Semester',
  'Year 3 • 2nd Semester',
];

const AVAILABLE_MINORS = [
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

export default function App() {
  // Wizard Steps: 1: Program Selection, 2: History Audit, 3: Your New Prospectus
  const [step, setStep] = useState(1); 
  const [program, setProgram] = useState('IT');
  
  // History Audit sub-state
  const [hasChosenSemCount, setHasChosenSemCount] = useState(false);
  const [semestersCount, setSemestersCount] = useState(1);
  const [auditTermIndex, setAuditTermIndex] = useState(0);

  // Dynamic Historical Term Records: { [termIndex]: [ { code, title, units, status: 'passed' | 'failed' } ] }
  const [historicalRecords, setHistoricalRecords] = useState({});

  // Course Catalog & Modals
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  // Result state
  const [scheduleResult, setScheduleResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch catalog whenever program changes
  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await fetch(`/api/courses/${program}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCatalog(data.courses);
          }
        }
      } catch (err) {
        console.warn('Catalog fetch failed:', err);
      }
    }
    fetchCatalog();
  }, [program]);

  // Step 1: Program Select
  const handleSelectProgram = (p) => {
    setProgram(p);
    setStep(2);
    setHasChosenSemCount(false);
  };

  // Step 2 Sub-step A: Sem Count Select
  const handleSelectSemesters = (count) => {
    setSemestersCount(count);
    setAuditTermIndex(0);

    const initialRecords = {};
    for (let t = 1; t <= count; t++) {
      const termYear = Math.ceil(t / 3);
      const termLabel = TERM_NAMES[t - 1] || '';

      const stdCourses = catalog.filter((c) => {
        const matchesYear = c.yearLevel === termYear;
        const matchesSem = termLabel.includes(c.semester);
        return matchesYear && matchesSem;
      });

      initialRecords[t] = stdCourses.map(c => ({
        code: c.code,
        title: c.title,
        units: c.units,
        status: 'passed' // Default passed, user can edit or toggle
      }));
    }

    setHistoricalRecords(initialRecords);
    setHasChosenSemCount(true);
  };

  // Toggle course status in current historical term
  const toggleCourseStatusInTerm = (termIdx, code, newStatus) => {
    const termKey = termIdx + 1;
    const currentList = historicalRecords[termKey] || [];
    const updated = currentList.map(c => {
      if (c.code === code) {
        return { ...c, status: c.status === newStatus ? 'unspecified' : newStatus };
      }
      return c;
    });
    setHistoricalRecords({ ...historicalRecords, [termKey]: updated });
  };

  // Remove course from current term history
  const removeCourseFromTerm = (termIdx, code) => {
    const termKey = termIdx + 1;
    const currentList = historicalRecords[termKey] || [];
    const updated = currentList.filter(c => c.code !== code);
    setHistoricalRecords({ ...historicalRecords, [termKey]: updated });
  };

  // Add custom course to current term history
  const addCourseToTerm = (course) => {
    const termKey = auditTermIndex + 1;
    const currentList = historicalRecords[termKey] || [];

    if (currentList.some(c => c.code === course.code)) {
      setShowAddCourseModal(false);
      return;
    }

    const updated = [...currentList, {
      code: course.code,
      title: course.title,
      units: course.units,
      status: 'passed'
    }];

    setHistoricalRecords({ ...historicalRecords, [termKey]: updated });
    setShowAddCourseModal(false);
    setSearchQuery('');
  };

  // Step 2 Sub-step B: Next Semester inside Audit
  const handleNextAuditSemester = () => {
    if (auditTermIndex < semestersCount - 1) {
      setAuditTermIndex(auditTermIndex + 1);
    } else {
      generatePlan();
    }
  };

  // Generate Plan API Call -> Step 3
  const generatePlan = async () => {
    setLoading(true);

    const historicalTermRecords = Object.keys(historicalRecords).map(termKey => ({
      termIndex: parseInt(termKey, 10),
      courses: historicalRecords[termKey]
    }));

    try {
      const response = await fetch('/api/generate-prospectus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program,
          completedSemestersCount: semestersCount,
          historicalTermRecords
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setScheduleResult(resData.data);
          setStep(3); // Transition to Step 3: Your New Prospectus
        }
      }
    } catch (err) {
      console.warn('Generate plan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Minor Swap in Step 3
  const handleSwapMinor = (newMinor) => {
    if (!swapTarget || !scheduleResult) return;

    const { termId, oldCode } = swapTarget;
    const updatedTerms = scheduleResult.regeneratedTerms.map((term) => {
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

    setScheduleResult({ ...scheduleResult, regeneratedTerms: updatedTerms });
    setSwapTarget(null);
  };

  // Current active audit term data
  const currentTermKey = auditTermIndex + 1;
  const currentTermLabel = TERM_NAMES[auditTermIndex] || `Term ${currentTermKey}`;
  const activeTermCourses = historicalRecords[currentTermKey] || [];

  const filteredCatalogToAdd = catalog.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200">
      
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500 text-white font-black text-xs flex items-center justify-center shadow-glow">
            SF
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Semestral<span className="text-brand-500">Flow</span>
          </span>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-amber-400 hover:scale-105 transition-all shadow-subtle"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Single Centered Card Container */}
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-card p-6 sm:p-8 space-y-6 transition-all">
        
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-3 py-1 rounded-full">
              {step === 1 && 'Step 1 of 3: Program Selection'}
              {step === 2 && 'Step 2 of 3: History Audit'}
              {step === 3 && 'Step 3 of 3: Your New Prospectus'}
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            {program ? `BS ${program}` : ''}
          </span>
        </div>

        {/* STEP 1: SIMPLE PROGRAM SELECTION */}
        {step === 1 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                What is your degree program?
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select your major to load your official curriculum prospectus.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { id: 'IT', label: 'BS-IT', name: 'Information Technology' },
                { id: 'CS', label: 'BS-CS', name: 'Computer Science' },
                { id: 'IS', label: 'BS-IS', name: 'Information Systems' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProgram(p.id)}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-850 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 text-center transition-all group shadow-sm hover:shadow-md"
                >
                  <span className="text-base font-black text-slate-900 dark:text-white group-hover:text-brand-600 block">
                    {p.label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: FLEXIBLE CHRONOLOGICAL HISTORY AUDIT */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Sub-Step A: Semester Count Choice */}
            {!hasChosenSemCount ? (
              <div className="space-y-6 text-center">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    How many semesters have you completed so far?
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Selected Program: <strong className="text-slate-800 dark:text-slate-200">BS {program}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <button
                      key={count}
                      onClick={() => handleSelectSemesters(count)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 bg-slate-50 dark:bg-slate-850 hover:bg-brand-50 dark:hover:bg-brand-950/30 text-center transition-all"
                    >
                      <span className="text-lg font-black text-slate-900 dark:text-white block">
                        {count}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {TERM_NAMES[count - 1]?.split('•')[1] || `Semesters`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Sub-Step B: Term-by-Term Dynamic Audit with Add / Edit / Remove */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Semester Audit {auditTermIndex + 1} of {semestersCount}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {currentTermLabel}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddCourseModal(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Custom Course</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review what you <strong>actually took</strong> during this term. Edit, add, or drop courses to match your custom transcript history:
                </p>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {activeTermCourses.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                      <p className="text-xs text-slate-400 font-medium">No courses listed for this semester history.</p>
                      <button
                        type="button"
                        onClick={() => setShowAddCourseModal(true)}
                        className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        + Add a Course You Enrolled In
                      </button>
                    </div>
                  ) : (
                    activeTermCourses.map((course) => {
                      const isPassed = course.status === 'passed';
                      const isFailed = course.status === 'failed';

                      return (
                        <div
                          key={course.code}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                            isPassed
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                              : (isFailed
                                  ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                                  : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800')
                          }`}
                        >
                          <div className="pr-2 min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {course.code} ({course.units}u)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                              {course.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleCourseStatusInTerm(auditTermIndex, course.code, 'passed')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                isPassed
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              Passed
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCourseStatusInTerm(auditTermIndex, course.code, 'failed')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                isFailed
                                  ? 'bg-rose-500 text-white shadow-sm'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              Failed
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCourseFromTerm(auditTermIndex, course.code)}
                              title="Remove course from this term"
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  {auditTermIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => setAuditTermIndex(auditTermIndex - 1)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      Previous Semester
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setHasChosenSemCount(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      Change Sem Count
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNextAuditSemester}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-500/20"
                  >
                    <span>{auditTermIndex < semestersCount - 1 ? 'Next Semester' : 'Calculate Prospectus'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* STEP 3: THE AUTO-COMPLETED PROSPECTUS (CLEAR & ACTIONABLE) */}
        {step === 3 && scheduleResult && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Summary Banner */}
            <div className="p-5 bg-brand-500/10 border border-brand-500/20 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Your Academic Result
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Your Projected Graduation: {scheduleResult.graduationSummary.targetGraduationTerm}
              </h2>
              <p className="text-xs text-brand-700 dark:text-brand-300 font-semibold">
                {scheduleResult.graduationSummary.statusMessage}
              </p>
            </div>

            {/* Future Semesters Stacked View */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Your Auto-Completed Remaining Schedule
              </h3>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {scheduleResult.regeneratedTerms
                  .filter(term => !term.isCompleted)
                  .map((term) => (
                    <div
                      key={term.id}
                      className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {term.label}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {term.totalUnits} Units
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {term.courses.map((c) => {
                          const isMinor = c.isMinor;
                          return (
                            <div
                              key={c.code}
                              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {c.code} ({c.units}u)
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {c.title}
                                </span>
                              </div>

                              {isMinor && (
                                <button
                                  type="button"
                                  onClick={() => setSwapTarget({ termId: term.id, oldCode: c.code })}
                                  className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Change / Swap</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Start Over / Re-Audit Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => { setStep(1); setAuditTermIndex(0); setHasChosenSemCount(false); }}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start Over / Re-Audit</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ADD CUSTOM COURSE TO HISTORICAL TERM MODAL */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Course to {currentTermLabel} History
              </h3>
              <button onClick={() => setShowAddCourseModal(false)} className="text-slate-400 text-xs font-bold">
                Cancel
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredCatalogToAdd.map((course) => (
                <div
                  key={course.code}
                  onClick={() => addCourseToTerm(course)}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {course.code}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {course.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {course.units}u
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SWAP MINOR MODAL */}
      {swapTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Change / Swap General Education Minor
              </h3>
              <button onClick={() => setSwapTarget(null)} className="text-slate-400 text-xs font-bold">
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pick an available minor course to replace <strong className="text-slate-800 dark:text-slate-200">{swapTarget.oldCode}</strong>:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {AVAILABLE_MINORS.map((minor) => (
                <div
                  key={minor.code}
                  onClick={() => handleSwapMinor(minor)}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
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
