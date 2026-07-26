import React, { useState, useEffect } from 'react';
import { Sparkles, X, Search, ChevronRight, HelpCircle } from 'lucide-react';

const COMPLETED_TERM_OPTIONS = [
  { count: 1, label: 'Year 1 • 1st Semester', term: 'Year 1 1st Sem' },
  { count: 2, label: 'Year 1 • 2nd Semester', term: 'Year 1 2nd Sem' },
  { count: 3, label: 'Year 1 • Summer Term', term: 'Year 1 Summer' },
  { count: 4, label: 'Year 2 • 1st Semester', term: 'Year 2 1st Sem' },
  { count: 5, label: 'Year 2 • 2nd Semester', term: 'Year 2 2nd Sem' },
  { count: 6, label: 'Year 2 • Summer Term', term: 'Year 2 Summer' },
  { count: 7, label: 'Year 3 • 1st Semester', term: 'Year 3 1st Sem' },
  { count: 8, label: 'Year 3 • 2nd Semester', term: 'Year 3 2nd Sem' },
];

export default function OnboardingWizard({ initialProgram = 'IT', onComplete, onClose }) {
  const [step, setStep] = useState(1);
  const [program, setProgram] = useState(initialProgram);
  const [completedSemestersCount, setCompletedSemestersCount] = useState(1);
  
  const [catalog, setCatalog] = useState([]);
  const [passedCourses, setPassedCourses] = useState([]);
  const [failedCourses, setFailedCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch catalog whenever program changes
  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await fetch(`/api/courses/${program}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCatalog(data.courses);
            const y1s1Codes = data.courses
              .filter(c => c.yearLevel === 1 && (c.semester === '1st' || c.semester === '1'))
              .map(c => c.code);
            setPassedCourses(y1s1Codes);
          }
        }
      } catch (err) {
        console.warn('Catalog fetch failed in wizard:', err);
      }
    }
    fetchCatalog();
  }, [program]);

  const completedTerms = COMPLETED_TERM_OPTIONS.slice(0, completedSemestersCount);

  const togglePassed = (code) => {
    if (passedCourses.includes(code)) {
      setPassedCourses(passedCourses.filter(c => c !== code));
    } else {
      setPassedCourses([...passedCourses, code]);
      setFailedCourses(failedCourses.filter(c => c !== code));
    }
  };

  const toggleFailed = (code) => {
    if (failedCourses.includes(code)) {
      setFailedCourses(failedCourses.filter(c => c !== code));
    } else {
      setFailedCourses([...failedCourses, code]);
      setPassedCourses(passedCourses.filter(c => c !== code));
    }
  };

  const handleFinishWizard = () => {
    onComplete({
      program,
      completedSemestersCount,
      passedCourses,
      failedCourses
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transition-all">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Irregular Student Prospectus Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Step {step} of 2: {step === 1 ? 'Program & Semester Progress' : 'Course Audit & Grades'}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  1. Select your Academic Program
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'IT', label: 'BS IT', name: 'Information Technology' },
                    { id: 'CS', label: 'BS CS', name: 'Computer Science' },
                    { id: 'IS', label: 'BS IS', name: 'Information Systems' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProgram(p.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        program === p.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-2 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                      }`}
                    >
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg mb-1 ${
                        program === p.id ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {p.label}
                      </span>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  2. How many semesters have you completed so far?
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  We will display an interactive audit tailored only to the semesters you have finished.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {COMPLETED_TERM_OPTIONS.map((t) => (
                    <button
                      key={t.count}
                      type="button"
                      onClick={() => setCompletedSemestersCount(t.count)}
                      className={`p-3 text-xs font-medium rounded-xl border text-center transition-all ${
                        completedSemestersCount === t.count
                          ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-start space-x-3">
                <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Why we ask this:</strong> Irregular students often have courses delayed or taken out of order. In the next step, you can mark which courses you passed or failed for each completed term, and our algorithm will generate the rest of your prospectus automatically!
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Audit your Completed Semesters ({completedSemestersCount} Semesters)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click to mark courses as <span className="text-emerald-600 font-bold">Passed</span> or <span className="text-rose-600 font-bold">Failed</span>.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search subject code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {completedTerms.map((termOpt) => {
                  const yearNum = Math.ceil(termOpt.count / 3);

                  const termCourses = catalog.filter((c) => {
                    const matchesYear = c.yearLevel === yearNum;
                    const matchesSem = termOpt.label.includes(c.semester);
                    const matchesSearch = !searchQuery || 
                      c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      c.title.toLowerCase().includes(searchQuery.toLowerCase());
                    return (matchesYear && matchesSem) || (searchQuery && matchesSearch);
                  });

                  return (
                    <div
                      key={termOpt.count}
                      className="p-4 bg-slate-50/70 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {termOpt.label}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          {termCourses.length} Curriculum Courses
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {termCourses.map((course) => {
                          const isPassed = passedCourses.includes(course.code);
                          const isFailed = failedCourses.includes(course.code);

                          return (
                            <div
                              key={course.code}
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                                isPassed
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
                                  : (isFailed
                                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700')
                              }`}
                            >
                              <div className="pr-2 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {course.code}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{course.units}u</span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {course.title}
                                </p>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => togglePassed(course.code)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                                    isPassed
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700'
                                  }`}
                                >
                                  Pass
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleFailed(course.code)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                                    isFailed
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-700'
                                  }`}
                                >
                                  Fail
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          {step === 1 ? (
            <div className="text-xs text-slate-400 font-medium">Program: {program}</div>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Back to Step 1
            </button>
          )}

          <div className="flex items-center space-x-2">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-500/20"
              >
                <span>Continue to Audit</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishWizard}
                className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate My Prospectus Plan</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
