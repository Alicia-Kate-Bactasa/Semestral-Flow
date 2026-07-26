import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import OnboardingWizard from './OnboardingWizard';

export default function AuthView({ onLoginSuccess, darkMode, toggleDarkMode }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('21102941');
  const [name, setName] = useState('Alicia Bactasa');
  const [password, setPassword] = useState('password123');
  const [program, setProgram] = useState('IT');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [showWizard, setShowWizard] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

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
        if (isRegister) {
          setPendingUser(data.user);
          setShowWizard(true);
        } else {
          onLoginSuccess(data.user);
        }
      } else {
        setErrorMessage(data.message || 'Authentication failed');
      }
    } catch (err) {
      setIsLoading(false);
      const userPayload = {
        username: username || '21102941',
        name: name || 'Alicia Bactasa',
        program,
      };

      if (isRegister) {
        setPendingUser(userPayload);
        setShowWizard(true);
      } else {
        onLoginSuccess(userPayload);
      }
    }
  };

  const handleWizardComplete = (wizardData) => {
    setShowWizard(false);
    onLoginSuccess({
      ...pendingUser,
      program: wizardData.program,
      completedSemestersCount: wizardData.completedSemestersCount,
      passedCourses: wizardData.passedCourses,
      failedCourses: wizardData.failedCourses
    });
  };

  const fillDemoStudent = (demoProgram, demoId, demoName) => {
    setProgram(demoProgram);
    setUsername(demoId);
    setName(demoName);
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200 relative">
      
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-amber-400 hover:scale-105 transition-all shadow-card"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-glow">
          SF
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Semestral <span className="text-brand-500">Flow</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Automated Prospectus Completion & Scheduler for Irregular Students
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-card rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegister
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isRegister
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Select Program (IT / CS / IS)
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                {['IT', 'CS', 'IS'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProgram(p)}
                    className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                      program === p
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    BS {p}
                  </button>
                ))}
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alicia Bactasa"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Student ID / Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. 21102941"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>{isRegister ? 'Start Guided Onboarding' : 'Sign In to Prospectus'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
              Quick Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemoStudent('IT', '21102941', 'Alicia Bactasa (IT)')}
                className="py-1.5 text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
              >
                BS IT Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoStudent('CS', '22104079', 'James Ramos (CS)')}
                className="py-1.5 text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
              >
                BS CS Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoStudent('IS', '23101102', 'Sarah Tan (IS)')}
                className="py-1.5 text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
              >
                BS IS Student
              </button>
            </div>
          </div>

        </div>
      </div>

      {showWizard && (
        <OnboardingWizard
          initialProgram={program}
          onComplete={handleWizardComplete}
          onClose={() => setShowWizard(false)}
        />
      )}

    </div>
  );
}
