import React, { useState, useEffect } from 'react';
import { PlusCircle, Users } from 'lucide-react';

export default function PetitionHub({ user }) {
  const [petitions, setPetitions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [reason, setReason] = useState('');

  // Fetch petitions from MongoDB database
  useEffect(() => {
    async function fetchPetitions() {
      try {
        const res = await fetch('/api/petitions');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPetitions(data.petitions);
          }
        }
      } catch (err) {
        console.warn('API error, using local database fallback:', err.message);
      }
    }
    fetchPetitions();
  }, []);

  // Submit new petition to MongoDB database
  const handleCreatePetition = async (e) => {
    e.preventDefault();
    if (!courseCode) return;

    try {
      const res = await fetch('/api/petitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: courseCode,
          title: `Petition for ${courseCode.toUpperCase()}`,
          requestedBy: user?.name || 'Student User',
          requestedByUsername: user?.username || '21102941',
          program: user?.program || 'IT',
          reason
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPetitions([data.petition, ...petitions]);
        }
      }
    } catch (err) {
      console.warn('Failed to save to database:', err);
    }

    setShowModal(false);
    setCourseCode('');
    setReason('');
  };

  // Sign petition in MongoDB database
  const handleSignPetition = async (id) => {
    try {
      const res = await fetch(`/api/petitions/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user?.username || '21102941' })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPetitions(petitions.map(p => p._id === id || p.id === id ? data.petition : p));
        }
      }
    } catch (err) {
      console.warn('Failed to sign petition in database:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-wider">
              Academic Support
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Off-Cycle Petition Hub
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Submit and sign petitions stored in DCISM MongoDB database for unoffered or off-cycle tutorial classes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-cyan-500 text-white font-bold rounded-xl text-xs shadow-soft hover:shadow-soft-lg transform active:scale-95 transition-all flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Petition</span>
        </button>
      </div>

      {/* Petition Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {petitions.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-100 p-6 shadow-soft">
            No active petitions found in database. Create the first petition!
          </div>
        ) : (
          petitions.map((p) => {
            const petId = p._id || p.id;
            const progressPercent = Math.min(100, Math.round((p.currentSignatures / p.requiredSignatures) * 100));
            return (
              <div key={petId} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{p.code}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    p.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : p.status === 'In Review'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700">{p.title}</p>
                  <p className="text-xs text-slate-500 mt-1 italic font-medium">"{p.reason}"</p>
                </div>

                {/* Progress Bar for Minimum Class Size */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-brand-500" />
                      <span>Student Signatures:</span>
                    </span>
                    <span>{p.currentSignatures} / {p.requiredSignatures} Students</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-slate-400 font-medium">Initiated by {p.requestedBy}</span>
                  <button
                    onClick={() => handleSignPetition(petId)}
                    disabled={p.currentSignatures >= p.requiredSignatures}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      p.currentSignatures >= p.requiredSignatures
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white'
                    }`}
                  >
                    {p.currentSignatures >= p.requiredSignatures ? 'Class Threshold Reached' : '+ Sign Petition'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Creating New Petition */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-soft-lg border border-slate-100 animate-fadeIn">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Create Class Petition</h3>
            <form onSubmit={handleCreatePetition} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT 3103A"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-brand-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Petition</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this subject is required for your prerequisite flow..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-brand-ring"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs shadow-soft transition-all"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
