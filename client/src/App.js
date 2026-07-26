import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import ProspectusProcessor from './components/ProspectusProcessor';

export default function App() {
  const [user, setUser] = useState(null); // Null = Logged out view

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Unauthenticated View
  if (!user) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#fbfcfd] flex flex-col font-sans text-slate-800 selection:bg-brand-100 selection:text-brand-700">
      
      {/* Top Navbar */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Main Single-Focus Prospectus View */}
      <main className="flex-1">
        <ProspectusProcessor user={user} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-5 text-center text-xs text-slate-400 font-medium">
        <p>Semestral Flow © 2026 • DCISM Prospectus Planner</p>
      </footer>

    </div>
  );
}
