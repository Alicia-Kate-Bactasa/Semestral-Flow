import React from 'react';
import { User, Award, BookOpen, CheckCircle, ShieldCheck, Cpu, Sparkles } from 'lucide-react';

export default function ProfileView({ user, program, scheduleResult }) {
  const completedUnits = scheduleResult?.completedUnits || 0;
  const totalUnits = scheduleResult?.totalCurriculumUnits || 168;
  const graduationSummary = scheduleResult?.graduationSummary || {};

  return (
    <div className="space-y-6">
      
      {/* Student Passport Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-700 text-white font-black text-xl flex items-center justify-center shadow-glow shrink-0">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'ST'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name || 'Student User'}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-xs font-bold border border-brand-200 dark:border-brand-800">
                BS {program || 'IT'} Student
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Student ID: <strong className="text-slate-800 dark:text-slate-200">{user?.username || '21102941'}</strong> • Department of Computer & Information Sciences
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-center sm:text-right bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 w-full sm:w-auto justify-around sm:justify-end">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Units Completed</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{completedUnits} / {totalUnits}</p>
          </div>
          <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Graduation</p>
            <p className="text-base font-bold text-brand-600 dark:text-brand-400">{graduationSummary.estimatedYears || 4} Years</p>
          </div>
        </div>
      </div>

      {/* Curriculum Track Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle className="w-4 h-4" />
            <span>Year 1 Foundation</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Programming I, Intro to Computing, Discrete Math, HCI, GE-MMW, GE-UTS, PATH-FIT I & II completed.
          </p>
          <div className="w-full bg-emerald-100 dark:bg-emerald-950 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[90%]" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3">
          <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Year 2 Core Major</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Data Structures, OOP, Networking I & II, Web Systems, Information Management in progress.
          </p>
          <div className="w-full bg-brand-100 dark:bg-brand-950 h-2 rounded-full overflow-hidden">
            <div className="bg-brand-500 h-full w-[55%]" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3">
          <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Year 3 & 4 Capstone Track</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Systems Integration, Capstone Project I & II, Practicum A & B awaiting Year 2 prerequisites.
          </p>
          <div className="w-full bg-purple-100 dark:bg-purple-950 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full w-[15%]" />
          </div>
        </div>

      </div>

    </div>
  );
}
