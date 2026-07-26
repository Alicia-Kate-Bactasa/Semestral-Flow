import React from 'react';
import { User, Award, BookOpen, CheckCircle, ShieldCheck, Cpu } from 'lucide-react';

export default function ProfileView({ user }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      
      {/* Student Passport Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-400 text-white font-extrabold text-xl flex items-center justify-center shadow-glow">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'AB'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-900">{user?.name || 'Alicia Bactasa'}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">
                Regular Standing
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Program: <strong className="text-slate-800">BS {user?.program || 'IT'}</strong> • Student ID: <strong className="text-slate-800">{user?.username || '21102941'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-center sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Units Passed</p>
            <p className="text-lg font-extrabold text-slate-900">42 / 148</p>
          </div>
          <div className="w-[1px] h-8 bg-slate-200" />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">GWA Estimate</p>
            <p className="text-lg font-extrabold text-brand-600">1.45</p>
          </div>
        </div>
      </div>

      {/* Prerequisite Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft space-y-3">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <CheckCircle className="w-4 h-4" />
            <span>Year 1 Foundation</span>
          </div>
          <p className="text-xs text-slate-600">
            Programming I, Intro to Computing, Discrete Math, HCI, GE-MMW, GE-UTS, PATH-FIT I & II completed.
          </p>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[90%]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft space-y-3">
          <div className="flex items-center space-x-2 text-brand-600 font-bold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Year 2 Core Major</span>
          </div>
          <p className="text-xs text-slate-600">
            Data Structures, OOP, Networking I & II, Web Systems, Information Management in progress.
          </p>
          <div className="w-full bg-brand-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-brand-500 h-full w-[45%]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft space-y-3">
          <div className="flex items-center space-x-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Year 3 Capstone Track</span>
          </div>
          <p className="text-xs text-slate-600">
            Systems Integration, Capstone Project I & II, Practicum A & B awaiting Year 2 prerequisites.
          </p>
          <div className="w-full bg-purple-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full w-[10%]" />
          </div>
        </div>

      </div>

    </div>
  );
}
