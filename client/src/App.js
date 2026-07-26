import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import ProspectusProcessor from './components/ProspectusProcessor';
import PetitionHub from './components/PetitionHub';
import ProfileView from './components/ProfileView';

export default function App() {
  const [user, setUser] = useState(null); // Null = Logged out view
  const [activeTab, setActiveTab] = useState('processor');

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('processor');
  };

  const handleLogout = () => {
    setUser(null);
  };

  // If user is not authenticated, render Minimalist Auth View
  if (!user) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#fbfcfd] flex flex-col font-sans text-slate-800 selection:bg-brand-100 selection:text-brand-700">
      
      {/* Responsive Top Glassmorphism Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Workspace Body */}
      <main className="flex-1">
        {activeTab === 'processor' && <ProspectusProcessor user={user} />}
        {activeTab === 'petitions' && <PetitionHub user={user} />}
        {activeTab === 'profile' && <ProfileView user={user} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium">
        <p>Semestral Flow © 2026 • DCISM Directed Acyclic Graph (DAG) Engine</p>
      </footer>

    </div>
  );
}
