import React, { useState } from 'react';
import { LayoutDashboard, FileText, User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'processor', label: 'Prospectus Processor', icon: LayoutDashboard },
    { id: 'petitions', label: 'Petition Hub', icon: FileText },
    { id: 'profile', label: 'Student Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Name (Logoless, Clean Typography) */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('processor')}>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                Semestral <span className="text-brand-500">Flow</span>
              </span>
              <span className="ml-2.5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200/60">
                {user?.program || 'BS IT'}
              </span>
            </div>
          </div>

          {/* Center: Tagline */}
          <div className="hidden md:flex items-center text-xs font-normal text-slate-500">
            <span>Confused with your academic path? <strong className="font-semibold text-slate-700">Let me help you!</strong></span>
          </div>

          {/* Right: Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="h-4 w-[1px] bg-slate-200 mx-2" />

            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-4 space-y-2 animate-fadeIn">
          <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/60 mb-2">
            <p className="text-xs text-slate-900 font-semibold">{user?.name || 'Student User'}</p>
            <p className="text-[11px] text-slate-500">ID: {user?.username || '21102941'}</p>
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
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white font-semibold'
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
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-2"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
