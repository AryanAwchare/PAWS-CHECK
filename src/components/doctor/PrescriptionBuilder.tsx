import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pill, Plus, Trash2, Save, Clock, Bell, Eye, ChevronDown,
  CheckCircle, AlertTriangle, User, Calendar
} from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext';

interface MedicationItem {
  id: string;
  medicationName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  reminderTime: string;
}

interface PrescriptionRecord {
  id: string;
  petName: string;
  ownerName: string;
  vetName: string;
  clinicName: string;
  medications: MedicationItem[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  notes: string;
}

interface PatientOption {
  petId: string;
  petName: string;
  petBreed: string;
  ownerName: string;
  ownerEmail: string;
  petSpecies?: string;
}

const EMPTY_MED: MedicationItem = {
  id: '', medicationName: '', genericName: '', dosage: '', frequency: 'Twice daily',
  duration: '7 days', route: 'Oral', instructions: '', reminderTime: '08:00',
};

const DEMO_PAST_PRESCRIPTIONS: PrescriptionRecord[] = [
  {
    id: 'rx1', petName: 'Bruno', ownerName: 'Priya Sharma', vetName: 'Dr. Sharma',
    clinicName: 'PawCare Clinic', status: 'active', createdAt: '2026-05-10',
    notes: 'Complete full course even if symptoms improve.',
    medications: [
      { id: 'm1', medicationName: 'Cephalexin', genericName: 'Cephalexin', dosage: '500mg', frequency: 'Twice daily', duration: '10 days', route: 'Oral', instructions: 'Give with food', reminderTime: '08:00' },
    ],
  },
  {
    id: 'rx2', petName: 'Bruno', ownerName: 'Priya Sharma', vetName: 'Dr. Patel',
    clinicName: 'City Vet Hospital', status: 'active', createdAt: '2026-05-05',
    notes: 'Monitor for drowsiness.',
    medications: [
      { id: 'm2', medicationName: 'Apoquel', genericName: 'Oclacitinib', dosage: '16mg', frequency: 'Once daily', duration: '14 days', route: 'Oral', instructions: 'Can be given with or without food', reminderTime: '09:00' },
      { id: 'm3', medicationName: 'Chlorhexidine Shampoo', genericName: 'Chlorhexidine 2%', dosage: 'Apply topically', frequency: 'Twice weekly', duration: '4 weeks', route: 'Topical', instructions: 'Leave on for 10 minutes before rinsing', reminderTime: '18:00' },
    ],
  },
  {
    id: 'rx3', petName: 'Whiskers', ownerName: 'Raj Patel', vetName: 'Dr. Sharma',
    clinicName: 'PawCare Clinic', status: 'completed', createdAt: '2026-04-20',
    notes: '',
    medications: [
      { id: 'm4', medicationName: 'Metronidazole', genericName: 'Metronidazole', dosage: '250mg', frequency: 'Twice daily', duration: '5 days', route: 'Oral', instructions: 'Give with food to prevent nausea', reminderTime: '08:00' },
    ],
  },
];

const getSpeciesEmoji = (species?: string) => {
  const s = species?.toLowerCase();
  if (s === 'dog') return '🐕';
  if (s === 'cat') return '🐈';
  if (s === 'fish') return '🐠';
  if (s === 'bird') return '🐦';
  if (s === 'rabbit') return '🐇';
  return '🐾';
};

export default function PrescriptionBuilder() {
  const { appointments } = useDoctor();
  const [viewMode, setViewMode] = useState<'builder' | 'history'>('builder');
  const [medications, setMedications] = useState<MedicationItem[]>([
    { ...EMPTY_MED, id: `med-${Date.now()}` },
  ]);
  
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPet, setSelectedPet] = useState('demo-bruno');
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>({
    petId: 'demo-bruno', petName: 'Bruno', petBreed: 'Golden Retriever', ownerName: 'Priya Sharma', ownerEmail: 'priya@example.com', petSpecies: 'Dog'
  });
  
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const list: PatientOption[] = [
      { petId: 'demo-bruno', petName: 'Bruno', petBreed: 'Golden Retriever', ownerName: 'Priya Sharma', ownerEmail: 'priya@example.com', petSpecies: 'Dog' },
      { petId: 'demo-whiskers', petName: 'Whiskers', petBreed: 'Persian Cat', ownerName: 'Raj Patel', ownerEmail: 'raj@example.com', petSpecies: 'Cat' },
      { petId: 'demo-rocky', petName: 'Rocky', petBreed: 'Labrador', ownerName: 'Amit Kumar', ownerEmail: 'amit@example.com', petSpecies: 'Dog' },
      { petId: 'demo-max', petName: 'Max', petBreed: 'German Shepherd', ownerName: 'Sneha Reddy', ownerEmail: 'sneha@example.com', petSpecies: 'Dog' },
    ];

    // Add patients from active appointments
    appointments.forEach(apt => {
      if (apt.pet_name) {
        const alreadyExists = list.some(p => p.petName.toLowerCase() === apt.pet_name?.toLowerCase() && p.ownerEmail === apt.owner_email);
        if (!alreadyExists) {
          list.push({
            petId: apt.pet_id || `apt-${apt.id}`,
            petName: apt.pet_name,
            petBreed: apt.pet_breed || 'Unknown',
            ownerName: apt.owner_name || 'Pet Owner',
            ownerEmail: apt.owner_email || 'owner@example.com',
            petSpecies: apt.pet_species || 'Dog',
          });
        }
      }
    });

    // Add patients from local pets
    try {
      const localSaved = localStorage.getItem('pawscheck_local_pets');
      if (localSaved) {
        const localPets = JSON.parse(localSaved);
        const activeEmail = localStorage.getItem('pawscheck_user_email') || 'owner@example.com';
        const activeName = localStorage.getItem('pawscheck_user_name') || 'Pet Owner';
        localPets.forEach((pet: any) => {
          const alreadyExists = list.some(p => p.petName.toLowerCase() === pet.name?.toLowerCase() && p.ownerEmail === activeEmail);
          if (!alreadyExists) {
            list.push({
              petId: pet.id,
              petName: pet.name,
              petBreed: pet.breed || 'Unknown',
              ownerName: activeName,
              ownerEmail: activeEmail,
              petSpecies: pet.species || 'Dog',
            });
          }
        });
      }
    } catch (e) {
      console.error("Error reading local pets for prescription builder", e);
    }

    setPatients(list);
    
    // Auto-select or refresh selectedPatient references
    if (list.length > 0) {
      const currentSelected = list.find(p => p.petId === selectedPet);
      if (currentSelected) {
        setSelectedPatient(currentSelected);
      } else {
        setSelectedPet(list[0].petId);
        setSelectedPatient(list[0]);
      }
    }
  }, [appointments]);

  const handlePatientChange = (petId: string) => {
    setSelectedPet(petId);
    const found = patients.find(p => p.petId === petId);
    if (found) {
      setSelectedPatient(found);
    }
  };

  const addMedication = () => {
    setMedications(prev => [...prev, { ...EMPTY_MED, id: `med-${Date.now()}` }]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(prev => prev.filter(m => m.id !== id));
    }
  };

  const updateMedication = (id: string, field: keyof MedicationItem, value: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSaveAndNotify = () => {
    setSaved(true);
    try {
      const validMeds = medications.filter(m => m.medicationName);
      const medsText = validMeds.map(m => `• ${m.medicationName} (${m.dosage}) — ${m.frequency} for ${m.duration}.\n  Route: ${m.route}. Guidance: "${m.instructions || 'Standard routine'}"\n  Reminder Trigger: ${m.reminderTime}`).join('\n\n');
      
      const petName = selectedPatient ? selectedPatient.petName : 'Bruno';
      const ownerEmail = selectedPatient ? selectedPatient.ownerEmail : 'priya@example.com';
      const ownerName = selectedPatient ? selectedPatient.ownerName : 'Priya Sharma';
      const petBreed = selectedPatient ? selectedPatient.petBreed : 'Golden Retriever';

      const rxId = `rx-${Date.now()}`;
      
      const docName = localStorage.getItem('pawscheck_user_name') || 'Dr. Sarah Jenkins';
      const prettyDocName = docName.startsWith('Dr.') ? docName : `Dr. ${docName}`;

      // Save prescription to pawscheck_prescriptions
      const newRx = {
        id: rxId,
        petName,
        petBreed,
        ownerName,
        ownerEmail,
        vetName: prettyDocName,
        clinicName: 'PawCare Veterinary Clinic',
        medications: validMeds,
        notes: notes || 'Complete full dosage schedule as indicated.',
        status: 'active',
        createdAt: new Date().toLocaleDateString()
      };

      const existingRx = localStorage.getItem('pawscheck_prescriptions');
      const rxArr = existingRx ? JSON.parse(existingRx) : [];
      localStorage.setItem('pawscheck_prescriptions', JSON.stringify([newRx, ...rxArr]));

      // Save to consultations for backwards compatibility
      const record = {
        id: `rx-portal-${Date.now()}`,
        pet_name: petName,
        owner_email: ownerEmail,
        date: new Date().toLocaleDateString(),
        summary: `OFFICIAL CLINICAL E-PRESCRIPTION ORDER:\n\nPrescribed Regimen:\n${medsText}\n\nClinician Notes:\n${notes || 'Complete full dosage schedule as indicated.'}`,
        status: 'Prescribed'
      };
      const existing = localStorage.getItem('pawscheck_completed_consultations');
      const arr = existing ? JSON.parse(existing) : [];
      localStorage.setItem('pawscheck_completed_consultations', JSON.stringify([record, ...arr]));
    } catch(e) {}

    setTimeout(() => setSaved(false), 4000);
  };

  const isValid = medications.every(m => m.medicationName && m.dosage);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-white">Prescriptions</h2>
          <p className="text-sm text-slate-500">Create and manage prescriptions across all patients</p>
        </div>
        <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-1">
          <button
            onClick={() => setViewMode('builder')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'builder' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            New Prescription
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'history' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {viewMode === 'builder' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Prescription Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Patient Select */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Patient</label>
              <select
                value={selectedPet}
                onChange={e => handlePatientChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              >
                {patients.map(p => (
                  <option key={p.petId} value={p.petId}>
                    {getSpeciesEmoji(p.petSpecies)} {p.petName} — {p.petBreed} (Owner: {p.ownerName})
                  </option>
                ))}
              </select>
            </div>

            {/* Medications */}
            <div className="space-y-3">
              {medications.map((med, idx) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                        <Pill size={14} />
                      </div>
                      <h4 className="text-sm font-bold text-white">Medication #{idx + 1}</h4>
                    </div>
                    {medications.length > 1 && (
                      <button
                        onClick={() => removeMedication(med.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium mb-1 block">Medication Name *</label>
                      <input
                        value={med.medicationName}
                        onChange={e => updateMedication(med.id, 'medicationName', e.target.value)}
                        placeholder="e.g., Apoquel"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium mb-1 block">Dosage *</label>
                      <input
                        value={med.dosage}
                        onChange={e => updateMedication(med.id, 'dosage', e.target.value)}
                        placeholder="e.g., 16mg"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium mb-1 block">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={e => updateMedication(med.id, 'frequency', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option>Once daily</option>
                        <option>Twice daily</option>
                        <option>Three times daily</option>
                        <option>Every 8 hours</option>
                        <option>Once weekly</option>
                        <option>Twice weekly</option>
                        <option>As needed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium mb-1 block">Duration</label>
                      <select
                        value={med.duration}
                        onChange={e => updateMedication(med.id, 'duration', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option>3 days</option>
                        <option>5 days</option>
                        <option>7 days</option>
                        <option>10 days</option>
                        <option>14 days</option>
                        <option>21 days</option>
                        <option>30 days</option>
                        <option>Until follow-up</option>
                        <option>Ongoing</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium mb-1 block">Route</label>
                      <select
                        value={med.route}
                        onChange={e => updateMedication(med.id, 'route', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option>Oral</option>
                        <option>Topical</option>
                        <option>Injectable</option>
                        <option>Eye drops</option>
                        <option>Ear drops</option>
                        <option>Inhalation</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium mb-1 block flex items-center gap-1">
                        <Bell size={10} /> Reminder Time
                      </label>
                      <input
                        type="time"
                        value={med.reminderTime}
                        onChange={e => updateMedication(med.id, 'reminderTime', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-medium mb-1 block">Special Instructions</label>
                      <input
                        value={med.instructions}
                        onChange={e => updateMedication(med.id, 'instructions', e.target.value)}
                        placeholder="e.g., Give with food, avoid direct sunlight..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              <button
                onClick={addMedication}
                className="w-full py-3 border-2 border-dashed border-slate-800 rounded-2xl text-sm font-bold text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Another Medication
              </button>
            </div>

            {/* Notes */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Additional Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional instructions for the owner..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Right: Preview & Actions */}
          <div className="space-y-4">
            {/* Owner Preview */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
                <Eye size={14} className="text-blue-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Owner Will See</h4>
              </div>
              <div className="p-5">
                {/* Simulated owner notification */}
                <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      <Bell size={12} />
                    </div>
                    <span className="text-xs font-bold text-blue-400">New Notification</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    Dr. Sharma prescribed{' '}
                    {medications.filter(m => m.medicationName).length > 0
                      ? medications.filter(m => m.medicationName).map(m => m.medicationName).join(', ')
                      : '...'
                    }{' '}for {selectedPatient ? selectedPatient.petName : 'Bruno'}.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Medication reminders have been set automatically.</p>
                </div>

                {/* Simulated medication cards */}
                {medications.filter(m => m.medicationName).map(med => (
                  <div key={med.id} className="bg-slate-800/50 rounded-xl p-3 mb-2 last:mb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill size={12} className="text-emerald-400" />
                        <span className="text-sm font-bold text-white">{med.medicationName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{med.dosage}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{med.frequency} · {med.duration}</p>
                    {med.instructions && (
                      <p className="text-[10px] text-slate-500 mt-1 italic">"{med.instructions}"</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-500">
                      <Clock size={10} /> Reminder: {med.reminderTime}
                    </div>
                  </div>
                ))}

                {medications.every(m => !m.medicationName) && (
                  <p className="text-xs text-slate-600 text-center py-4">Add medications to see preview</p>
                )}
              </div>
            </div>

            {/* Save & Notify */}
            <button
              onClick={handleSaveAndNotify}
              disabled={!isValid}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                saved
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : isValid
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              {saved ? (
                <><CheckCircle size={16} /> Saved & Owner Notified ✓</>
              ) : (
                <><Save size={16} /> Save & Notify Owner</>
              )}
            </button>

            {saved && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-center"
              >
                <p className="text-xs text-emerald-400 font-medium">
                  ✅ Prescription saved to {selectedPatient ? selectedPatient.petName : 'Bruno'}'s profile<br />
                  📱 Owner notified with medication reminders<br />
                  💊 Auto-added to Care Plan
                </p>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        /* Prescription History */
        <div className="space-y-4">
          {DEMO_PAST_PRESCRIPTIONS.map(rx => (
            <div key={rx.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    rx.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Pill size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{rx.petName}</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        rx.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {rx.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      By <span className="text-slate-400">{rx.vetName}</span> · {rx.clinicName} · {rx.createdAt}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-600">{rx.medications.length} med{rx.medications.length > 1 ? 's' : ''}</span>
              </div>
              <div className="p-5 space-y-2">
                {rx.medications.map(med => (
                  <div key={med.id} className="flex items-center justify-between bg-slate-800/30 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{med.medicationName} <span className="text-slate-500">{med.dosage}</span></p>
                      <p className="text-xs text-slate-500">{med.frequency} · {med.duration} · {med.route}</p>
                    </div>
                    <span className="text-[10px] text-slate-600">{med.reminderTime}</span>
                  </div>
                ))}
                {rx.notes && (
                  <p className="text-xs text-slate-500 italic mt-2 pt-2 border-t border-slate-800">Note: {rx.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
