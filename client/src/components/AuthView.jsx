import React, { useState } from 'react';
import { Network, ArrowRight, Eye, EyeOff, Sparkles, BookOpen } from 'lucide-react';

export default function AuthView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('21102941');
  const [name, setName] = useState('Alicia Bactasa');
  const [password, setPassword] = useState('password123');
  const [program, setProgram] = useState('IT');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          name,
          program
        })
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMessage(data.message || 'Authentication failed');
      }
    } catch (err) {
      console.warn('API error, proceeding with database student model fallback:', err.message);
      setIsLoading(false);
      onLoginSuccess({
        username: username || '21102941',
        name: name || 'Alicia Bactasa',
        program,
        targetYearLevel: 1,
        targetSemester: '2nd',
        failedCourses: ['CIS 1101'],
        passedCourses: ['CIS 1102N', 'CIS 1103', 'CIS 1104', 'EDM 1', 'GE-MMW', 'GE-PC', 'GE-UTS', 'NSTP 1', 'TPE 1101'],
        exceptionFlags: { courseOverride: false, overload: false, simultaneous: false, petitionNeeded: false }
      });
    }
  };

  const fillDemoStudent = (demoProgram, demoId, demoName) => {
    setProgram(demoProgram);
    setUsername(demoId);
    setName(demoName);
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-brand-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-all duration-300">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-400 text-white shadow-glow mb-4 transform hover:scale-105 transition-transform">
          <Network className="w-8 h-8 stroke-[2.2]" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center space-x-2">
          <span>Semestral</span>
          <span className="text-brand-500">Flow</span>
        </h1>
        
        <p className="mt-2 text-sm text-slate-600 font-medium max-w-xs mx-auto">
          Confused with your academic path? <br />
          <span className="text-brand-600 font-semibold">Let me help you!</span>
        </p>
      </div>

      {/* Main Login / Register Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-soft-lg rounded-2xl border border-slate-100/80 backdrop-blur-xl relative overflow-hidden transition-all duration-300">
          
          {/* Subtle Top Accent Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-cyan-400" />

          {/* Mode Switcher Pills */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl mb-6 border border-slate-200/50">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                !isRegister
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                isRegister
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name Input (Register mode only) */}
            {isRegister && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alicia Bactasa"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 focus-brand-ring placeholder:text-slate-400"
                />
              </div>
            )}

            {/* Username / Student ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID / Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. 21102941"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 focus-brand-ring placeholder:text-slate-400"
              />
            </div>

            {/* Program Selector Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Program</label>
              <div className="relative">
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus-brand-ring appearance-none cursor-pointer"
                >
                  <option value="IT">BS Information Technology (BS IT)</option>
                  <option value="CS">BS Computer Science (BS CS)</option>
                  <option value="IS">BS Information Systems (BS IS)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 focus-brand-ring pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-soft hover:shadow-soft-lg transform active:scale-[0.99] transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </span>
              ) : (
                <>
                  <span>{isRegister ? 'Complete Registration' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Quick Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center flex items-center justify-center space-x-1">
              <Sparkles className="w-3 h-3 text-brand-500" />
              <span>Quick Demo Fill</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoStudent('IT', '21102941', 'Alicia Bactasa (IT)')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 border border-slate-200/80 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors"
              >
                BS IT Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoStudent('CS', '21104882', 'Mark Rivera (CS)')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 border border-slate-200/80 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors"
              >
                BS CS Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoStudent('IS', '21109920', 'Sarah Tan (IS)')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 border border-slate-200/80 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors"
              >
                BS IS Student
              </button>
            </div>
          </div>

        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Powered by DCISM Prospectus & MongoDB Directed Acyclic Graph (DAG) Engine
        </p>
      </div>

    </div>
  );
}
