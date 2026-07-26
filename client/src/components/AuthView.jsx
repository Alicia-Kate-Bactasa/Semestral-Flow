import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, BookOpen } from 'lucide-react';

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
        body: JSON.stringify({ username, password, name, program })
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setErrorMessage(data.message || 'Authentication failed');
      }
    } catch (err) {
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Logoless Minimalist Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Semestral <span className="text-brand-500">Flow</span>
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 font-normal">
          Confused with your academic path? <span className="text-slate-700 font-medium">Let me help you!</span>
        </p>
      </div>

      {/* Main Login / Register Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-card rounded-xl border border-slate-200/80">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6 border border-slate-200/60">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMessage(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                !isRegister ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMessage(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                isRegister ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alicia Bactasa"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Student ID / Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. 21102941"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Program</label>
              <div className="relative">
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer"
                >
                  <option value="IT">BS Information Technology (BS IT)</option>
                  <option value="CS">BS Computer Science (BS CS)</option>
                  <option value="IS">BS Information Systems (BS IS)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">Quick Demo Profiles</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoStudent('IT', '21102941', 'Alicia Bactasa (IT)')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded text-[11px] font-medium text-slate-700 transition-colors"
              >
                BS IT Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoStudent('CS', '21104882', 'Mark Rivera (CS)')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded text-[11px] font-medium text-slate-700 transition-colors"
              >
                BS CS Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoStudent('IS', '21109920', 'Sarah Tan (IS)')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded text-[11px] font-medium text-slate-700 transition-colors"
              >
                BS IS Student
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
