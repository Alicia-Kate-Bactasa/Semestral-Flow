import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, FileText, CheckCircle2, MessageSquare, ThumbsUp, AlertCircle } from 'lucide-react';

export default function PetitionHub({ user, program }) {
  const [petitions, setPetitions] = useState([
    {
      _id: 'p1',
      code: 'CIS 2103',
      title: 'Petition for CIS 2103 (Object-Oriented Programming)',
      requestedBy: 'Alicia Bactasa',
      program: 'IT',
      reason: 'Prerequisite for 3rd Year Capstone, needed off-cycle offering in 2nd Sem.',
      signedCount: 14,
      status: 'Open'
    },
    {
      _id: 'p2',
      code: 'MATH 101',
      title: 'Petition for GE-MMW (Mathematics in Modern World)',
      requestedBy: 'John Doe',
      program: 'CS',
      reason: 'Conflicts with major subject schedule, requesting additional afternoon section.',
      signedCount: 8,
      status: 'Open'
    }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [reason, setReason] = useState('');

  // Fetch petitions from API
  useEffect(() => {
    async function fetchPetitions() {
      try {
        const res = await fetch('/api/petitions');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.petitions.length > 0) {
            setPetitions(data.petitions);
          }
        }
      } catch (err) {
        console.warn('API error, using local state:', err);
      }
    }
    fetchPetitions();
  }, []);

  const handleCreatePetition = async (e) => {
    e.preventDefault();
    if (!courseCode) return;

    const newPetition = {
      _id: `p-${Date.now()}`,
      code: courseCode.toUpperCase(),
      title: `Petition for ${courseCode.toUpperCase()}`,
      requestedBy: user?.name || 'Student User',
      program: program || 'IT',
      reason,
      signedCount: 1,
      status: 'Open'
    };

    try {
      const res = await fetch('/api/petitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPetition)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPetitions([data.petition, ...petitions]);
        }
      } else {
        setPetitions([newPetition, ...petitions]);
      }
    } catch (err) {
      setPetitions([newPetition, ...petitions]);
    }

    setShowModal(false);
    setCourseCode('');
    setReason('');
  };

  const handleSignPetition = (id) => {
    setPetitions(petitions.map(p => {
      if (p._id === id || p.id === id) {
        return { ...p, signedCount: (p.signedCount || 0) + 1 };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
              Academic Support
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Off-Cycle Course Petition Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Request or support petitions for unoffered, off-cycle, or overcrowded courses.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Subject Petition</span>
        </button>
      </div>

      {/* Petitions List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {petitions.map((petition) => (
          <div
            key={petition._id || petition.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-card space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 rounded-lg">
                  {petition.code}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  {petition.status || 'Open'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {petition.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                "{petition.reason || 'No detailed reason specified.'}"
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">{petition.signedCount || 1} Students</span>
                <span>Signed</span>
              </div>

              <button
                type="button"
                onClick={() => handleSignPetition(petition._id || petition.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Sign Petition</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PETITION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create Subject Petition
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-xs font-bold">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreatePetition} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CIS 2103"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Petition
                </label>
                <textarea
                  placeholder="Why do you need this course off-cycle?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Submit Petition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
