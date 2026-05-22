import { useState } from 'react';
import { usePet } from '../../context/PetContext';
import { User, Mail, Key, Shield, Plus, FileText, Activity, X, Loader2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  const { pets, refreshPets, userId, isGuest, setActivePetId } = usePet();
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const userEmail = localStorage.getItem('pawscheck_user_email') || 'demo@pawscheck.com';
  const userName = localStorage.getItem('pawscheck_user_name') || 'Pet Owner';

  // Add Pet form state
  const [newPet, setNewPet] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    weight: '',
    previous_medications: '',
  });

  // Fetch scans history from localStorage
  const getScanHistory = () => {
    try {
      const scansStr = localStorage.getItem('pawscheck_user_scans');
      if (scansStr) {
        const allScans = JSON.parse(scansStr);
        // Scans are already saved with user_email filter
        return allScans.filter((s: any) => s.user_email === userEmail);
      }
    } catch (e) {
      console.error('Error reading scan history', e);
    }
    return [];
  };

  const scans = getScanHistory();

  const handleAddPet = async () => {
    if (!newPet.name.trim()) {
      setFormError("Pet name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);

    const mockUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    const generatedPet = {
      id: mockUuid,
      owner_id: userId,
      name: newPet.name.trim(),
      species: newPet.species,
      breed: newPet.breed.trim() || 'Mixed Breed',
      age: newPet.age ? parseInt(newPet.age) : 2,
      profile_picture_url: `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000`,
      medical_history: 'No known chronic ailments.',
      weight: newPet.weight ? parseFloat(newPet.weight) : '',
      previous_medications: newPet.previous_medications.trim()
    };

    try {
      if (isGuest || userId.includes('00000000')) {
        const localSaved = localStorage.getItem('pawscheck_local_pets');
        let localArr = localSaved ? JSON.parse(localSaved) : [];
        localArr.push(generatedPet);
        localStorage.setItem('pawscheck_local_pets', JSON.stringify(localArr));
        
        await refreshPets();
        setActivePetId(generatedPet.id);
        setNewPet({ name: '', species: 'Dog', breed: '', age: '', weight: '', previous_medications: '' });
        setShowAddForm(false);
        return;
      }

      const { error } = await supabase
        .from('pets')
        .insert([{
          owner_id: userId,
          name: generatedPet.name,
          species: generatedPet.species,
          breed: generatedPet.breed,
          age: generatedPet.age,
          weight: generatedPet.weight || null,
          previous_medications: generatedPet.previous_medications || null
        }]);

      if (error) throw new Error(error.message);
      
      await refreshPets();
      setNewPet({ name: '', species: 'Dog', breed: '', age: '', weight: '', previous_medications: '' });
      setShowAddForm(false);
    } catch (err: any) {
      console.warn("Supabase save fallback triggered inside Profile:", err);
      const localSaved = localStorage.getItem('pawscheck_local_pets');
      let localArr = localSaved ? JSON.parse(localSaved) : [];
      localArr.push(generatedPet);
      localStorage.setItem('pawscheck_local_pets', JSON.stringify(localArr));
      
      await refreshPets();
      setActivePetId(generatedPet.id);
      setNewPet({ name: '', species: 'Dog', breed: '', age: '', weight: '', previous_medications: '' });
      setShowAddForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Account overview glassmorphic banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl border border-blue-950 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/15">
            <User size={32} className="text-blue-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">{userName}</h2>
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mt-1">Clinical Account Profile</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 shrink-0 text-left md:text-right">
          <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
            <p className="text-xs font-mono font-bold text-slate-200">{userEmail}</p>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User ID</p>
            <p className="text-xs font-mono font-bold text-slate-200">{userId.substring(0, 18)}...</p>
          </div>
        </div>
      </motion.div>

      {/* Grid containing Pets List and Scan logs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Registered Pets (span 1) */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Registered Pets</h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {pets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                  No registered pets.
                </div>
              ) : (
                pets.map((pet) => (
                  <div key={pet.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all">
                    <img
                      src={pet.profile_picture_url || `https://ui-avatars.com/api/?name=${pet.name}&background=e2e8f0&color=475569`}
                      alt={pet.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-sm font-black text-slate-800">{pet.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        {pet.species} · {pet.breed} · {pet.age} yrs {pet.weight ? `· ${pet.weight} kg` : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Visual Scan Logs (span 2) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Activity size={18} className="text-blue-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Visual Triage History</h3>
            </div>

            <div className="space-y-4">
              {scans.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                  No recent scans. Upload an image in the Triage Scan tab to generate a log.
                </div>
              ) : (
                scans.map((scan: any) => (
                  <div key={scan.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row hover:border-slate-200 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          scan.triage_tier === 'EMERGENCY' ? 'bg-red-500 text-white' :
                          scan.triage_tier === 'URGENT' ? 'bg-amber-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          {scan.triage_tier}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Risk: {scan.risk_score}/100
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-800">{scan.ai_explanation}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Calendar size={10} />
                        {new Date(scan.created_at).toLocaleDateString()} at {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono shrink-0">
                      ID: {scan.id.substring(0, 12)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Add Pet Modal Form Overlay */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-900 text-white">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">🐾 Add New Pet</h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pet Name *</label>
                  <input
                    type="text"
                    value={newPet.name}
                    onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                    placeholder="e.g., Buddy"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Species</label>
                    <select
                      value={newPet.species}
                      onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm bg-white font-bold text-slate-800"
                    >
                      <option value="Dog">🐕 Dog</option>
                      <option value="Cat">🐈 Cat</option>
                      <option value="Fish">🐠 Fish</option>
                      <option value="Bird">🐦 Bird</option>
                      <option value="Rabbit">🐇 Rabbit</option>
                      <option value="Other">🐾 Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Age (years)</label>
                    <input
                      type="number"
                      value={newPet.age}
                      onChange={(e) => setNewPet({ ...newPet, age: e.target.value })}
                      placeholder="e.g., 3"
                      min="0"
                      max="30"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Breed</label>
                  <input
                    type="text"
                    value={newPet.breed}
                    onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                    placeholder="e.g., Golden Retriever"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newPet.weight}
                      onChange={(e) => setNewPet({ ...newPet, weight: e.target.value })}
                      placeholder="e.g., 12.5"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Previous Meds</label>
                    <input
                      type="text"
                      value={newPet.previous_medications}
                      onChange={(e) => setNewPet({ ...newPet, previous_medications: e.target.value })}
                      placeholder="e.g., Apoquel, None"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                    {formError}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPet}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 uppercase tracking-wider"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  {saving ? 'Saving...' : 'Add Pet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
