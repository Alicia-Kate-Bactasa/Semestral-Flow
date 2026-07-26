import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import ProspectusProcessor from './components/ProspectusProcessor';
import DagVisualizer from './components/DagVisualizer';
import PetitionHub from './components/PetitionHub';
import ProfileView from './components/ProfileView';
import OnboardingWizard from './components/OnboardingWizard';

export default function App() {
  const [user, setUser] = useState(null);
  const [program, setProgram] = useState('IT');
  const [activeTab, setActiveTab] = useState('planner');
  const [darkMode, setDarkMode] = useState(false);

  const [scheduleResult, setScheduleResult] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Student audit inputs
  const [completedSemestersCount, setCompletedSemestersCount] = useState(1);
  const [passedCourses, setPassedCourses] = useState([]);
  const [failedCourses, setFailedCourses] = useState(['CIS 1101']);

  // Apply dark mode class to <html> root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Handle Login
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.program) setProgram(userData.program);
    if (userData.completedSemestersCount) setCompletedSemestersCount(userData.completedSemestersCount);
    if (userData.passedCourses) setPassedCourses(userData.passedCourses);
    if (userData.failedCourses) setFailedCourses(userData.failedCourses);
  };

  const handleLogout = () => {
    setUser(null);
    setScheduleResult(null);
  };

  // Re-generate schedule call
  const generateSchedule = useCallback(async (overrides = {}) => {
    setLoadingSchedule(true);
    const p = overrides.program || program;
    const semsCount = overrides.completedSemestersCount || completedSemestersCount;
    const passed = overrides.passedCourses || passedCourses;
    const failed = overrides.failedCourses || failedCourses;

    try {
      const response = await fetch('/api/generate-prospectus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: p,
          completedSemestersCount: semsCount,
          passedCourses: passed,
          failedCourses: failed
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setScheduleResult(resData.data);
        }
      }
    } catch (err) {
      console.warn('Prospectus schedule generation error:', err);
    } finally {
      setLoadingSchedule(false);
    }
  }, [program, completedSemestersCount, passedCourses, failedCourses]);

  // Initial load when user logs in or program changes
  useEffect(() => {
    if (user) {
      generateSchedule();
    }
  }, [user, program, generateSchedule]);

  // Wizard completed callback
  const handleWizardComplete = (wizardData) => {
    setProgram(wizardData.program);
    setCompletedSemestersCount(wizardData.completedSemestersCount);
    setPassedCourses(wizardData.passedCourses);
    setFailedCourses(wizardData.failedCourses);
    setIsWizardOpen(false);

    generateSchedule({
      program: wizardData.program,
      completedSemestersCount: wizardData.completedSemestersCount,
      passedCourses: wizardData.passedCourses,
      failedCourses: wizardData.failedCourses
    });
  };

  // Unauthenticated View
  if (!user) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex font-sans transition-colors duration-200">
      
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        program={program}
        setProgram={(newP) => {
          setProgram(newP);
          generateSchedule({ program: newP });
        }}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onOpenWizard={() => setIsWizardOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Navbar */}
        <Navbar
          user={user}
          program={program}
          graduationSummary={scheduleResult?.graduationSummary}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onOpenWizard={() => setIsWizardOpen(true)}
        />

        {/* Dynamic Tab Workspace Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'planner' && (
            <ProspectusProcessor
              user={user}
              program={program}
              scheduleResult={scheduleResult}
              loading={loadingSchedule}
              onOpenWizard={() => setIsWizardOpen(true)}
              onUpdateSchedule={(updatedRes) => setScheduleResult(updatedRes)}
            />
          )}

          {activeTab === 'dag' && (
            <DagVisualizer
              dagNodes={scheduleResult?.dagNodes}
              program={program}
            />
          )}

          {activeTab === 'petitions' && (
            <PetitionHub
              user={user}
              program={program}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={user}
              program={program}
              scheduleResult={scheduleResult}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium bg-white/50 dark:bg-slate-900/50">
          <p>SemestralFlow • DCISM Irregular Prospectus Completion Engine © 2026</p>
        </footer>

      </div>

      {/* Re-Audit Onboarding Wizard Modal */}
      {isWizardOpen && (
        <OnboardingWizard
          initialProgram={program}
          onComplete={handleWizardComplete}
          onClose={() => setIsWizardOpen(false)}
        />
      )}

    </div>
  );
}
