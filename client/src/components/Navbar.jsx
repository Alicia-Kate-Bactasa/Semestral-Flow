import React from 'react';
import { LogOut } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Name (Logoless, Circular Badge) */}
          <div className="flex items-center space-x-3">
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                Semestral <span className="text-brand-500">Flow</span>
              </span>
              <span className="ml-2.5 px-3 py-1 text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full border border-slate-200/60">
                {user?.program || 'BS IT'}
              </span>
            </div>
          </div>

          {/* Center: Tagline */}
          <div className="hidden md:flex items-center text-xs font-normal text-slate-500">
            <span>Confused with your academic path? <strong className="font-semibold text-slate-700">Let me help you!</strong></span>
          </div>

          {/* Right: User Greeting & Circular Logout Button */}
          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline text-xs font-medium text-slate-600">
              {user?.name || 'Student'}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors border border-slate-200/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
