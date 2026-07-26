import React, { useState } from 'react';
import { Network, LayoutDashboard, FileText, User, LogOut, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'processor', label: 'Prospectus Processor', icon: LayoutDashboard },
    { id: 'petitions', label: 'Petition Hub', icon: FileText },
    { id: 'profile', label: 'Student Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo & Brand Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('processor')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center shadow-glow text-white transform transition-transform hover:scale-105">
              <Network className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">Semestral</span>
                <span className="font-extrabold text-lg text-brand-500 tracking-tight">Flow</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">DAG Scheduler</p>
            </div>
          </div>

          {/* Center: Tagline (Muted, Collapses gracefully on mobile) */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
            <span>Confused with your academic path? <strong className="text-slate-700">Let me help you!</strong></span>
          </div>

          {/* Right: Desktop Navigation Links & User Logout */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 border border-brand-200/60 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="h-4 w-[1px] bg-slate-200 mx-2" />

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Slide-Down Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-2 animate-slideDown">
          <div className="px-3 py-2 bg-brand-50/60 rounded-lg border border-brand-100 mb-3">
            <p className="text-xs text-brand-700 font-semibold">{user?.name || 'Student User'}</p>
            <p className="text-[11px] text-slate-500 font-medium">{user?.program || 'BS IT'} Program • ID: {user?.username || '21102941'}</p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              onLogout();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-all mt-2"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
}
