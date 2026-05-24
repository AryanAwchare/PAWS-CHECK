import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Eye, FileText, Pill, ChevronRight, PawPrint } from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext';

interface Patient {
  id: string;
  pet_name: string;
  pet_breed: string;
  pet_species: string;
  pet_age: number;
  owner_name: string;
  owner_phone: string;
  last_visit: string;
  total_visits: number;
  active_prescriptions: number;
  last_triage_tier: string;
  conditions: string[];
}

const DEMO_PATIENTS: Patient[] = [
  { id: 'p1', pet_name: 'Bruno', pet_breed: 'Golden Retriever', pet_species: 'Dog', pet_age: 3, owner_name: 'Priya Sharma', owner_phone: '+91 98765 43210', last_visit: '2026-05-12', total_visits: 8, active_prescriptions: 2, last_triage_tier: 'URGENT', conditions: ['Dermatitis', 'Ear infection'] },
  { id: 'p2', pet_name: 'Whiskers', pet_breed: 'Persian', pet_species: 'Cat', pet_age: 5, owner_name: 'Raj Patel', owner_phone: '+91 87654 32109', last_visit: '2026-05-10', total_visits: 3, active_prescriptions: 1, last_triage_tier: 'MONITOR', conditions: ['Appetite loss'] },
  { id: 'p3', pet_name: 'Rocky', pet_breed: 'Labrador', pet_species: 'Dog', pet_age: 2, owner_name: 'Amit Kumar', owner_phone: '+91 76543 21098', last_visit: '2026-05-08', total_visits: 5, active_prescriptions: 0, last_triage_tier: 'HEALTHY', conditions: ['Vaccinations up to date'] },
  { id: 'p4', pet_name: 'Max', pet_breed: 'German Shepherd', pet_species: 'Dog', pet_age: 4, owner_name: 'Sneha Reddy', owner_phone: '+91 65432 10987', last_visit: '2026-05-05', total_visits: 12, active_prescriptions: 3, last_triage_tier: 'MONITOR', conditions: ['Hip dysplasia', 'Joint pain'] },
  { id: 'p5', pet_name: 'Luna', pet_breed: 'Beagle', pet_species: 'Dog', pet_age: 1, owner_name: 'Kiran Desai', owner_phone: '+91 54321 09876', last_visit: '2026-05-01', total_visits: 4, active_prescriptions: 1, last_triage_tier: 'EMERGENCY', conditions: ['GI distress', 'Dehydration'] },
  { id: 'p6', pet_name: 'Bella', pet_breed: 'Indie', pet_species: 'Dog', pet_age: 3, owner_name: 'Meera Joshi', owner_phone: '+91 43210 98765', last_visit: '2026-04-28', total_visits: 6, active_prescriptions: 0, last_triage_tier: 'HEALTHY', conditions: ['Post-spay recovery'] },
  { id: 'p7', pet_name: 'Simba', pet_breed: 'Maine Coon', pet_species: 'Cat', pet_age: 7, owner_name: 'Arjun Menon', owner_phone: '+91 32109 87654', last_visit: '2026-04-25', total_visits: 15, active_prescriptions: 2, last_triage_tier: 'MONITOR', conditions: ['Kidney disease', 'Weight management'] },
  { id: 'p8', pet_name: 'Coco', pet_breed: 'Pomeranian', pet_species: 'Dog', pet_age: 6, owner_name: 'Divya Nair', owner_phone: '+91 21098 76543', last_visit: '2026-04-20', total_visits: 9, active_prescriptions: 1, last_triage_tier: 'HEALTHY', conditions: ['Dental cleaning done'] },
];

const tierColors: Record<string, string> = {
  HEALTHY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  MONITOR: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  URGENT: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  EMERGENCY: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const getSpeciesEmoji = (species: string) => {
  const s = species?.toLowerCase();
  if (s === 'dog') return '🐕';
  if (s === 'cat') return '🐈';
  if (s === 'fish') return '🐠';
  if (s === 'bird') return '🐦';
  if (s === 'rabbit') return '🐇';
  return '🐾';
};

export default function PatientRegistry() {
  const { appointments } = useDoctor();
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Dynamic Patient List Map
  const appointmentPatientsMap: Record<string, Patient> = {};
  appointments.forEach(apt => {
    if (!apt.pet_id || !apt.pet_name) return;
    
    const petKey = apt.pet_id;
    const dateStr = apt.appointment_date ? new Date(apt.appointment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    let triageTier = 'HEALTHY';
    if (apt.urgency_level === 'emergency') triageTier = 'EMERGENCY';
    else if (apt.urgency_level === 'urgent') triageTier = 'URGENT';
    else if (apt.urgency_level === 'normal') triageTier = 'MONITOR';

    if (appointmentPatientsMap[petKey]) {
      appointmentPatientsMap[petKey].total_visits += 1;
      if (new Date(dateStr) > new Date(appointmentPatientsMap[petKey].last_visit)) {
        appointmentPatientsMap[petKey].last_visit = dateStr;
        appointmentPatientsMap[petKey].last_triage_tier = triageTier;
      }
      if (apt.reason && !appointmentPatientsMap[petKey].conditions.includes(apt.reason)) {
        appointmentPatientsMap[petKey].conditions.push(apt.reason);
      }
    } else {
      appointmentPatientsMap[petKey] = {
        id: apt.pet_id,
        pet_name: apt.pet_name,
        pet_breed: apt.pet_breed || 'Mixed Breed',
        pet_species: apt.pet_species || 'Dog',
        pet_age: apt.pet_age || 2,
        owner_name: apt.owner_name || 'Pet Owner',
        owner_phone: apt.owner_email || 'No Phone',
        last_visit: dateStr,
        total_visits: 1,
        active_prescriptions: (apt.status === 'approved' || apt.status === 'in_progress') ? 1 : 0,
        last_triage_tier: triageTier,
        conditions: apt.reason ? [apt.reason] : ['Routine consultation']
      };
    }
  });

  const dynamicPatientsList = Object.values(appointmentPatientsMap);
  
  // Merge static DEMO_PATIENTS without duplicates
  const allPatients = [...DEMO_PATIENTS];
  dynamicPatientsList.forEach(dp => {
    const existsIdx = allPatients.findIndex(p => 
      p.id === dp.id || 
      (p.pet_name.toLowerCase() === dp.pet_name.toLowerCase() && p.owner_name.toLowerCase() === dp.owner_name.toLowerCase())
    );
    if (existsIdx >= 0) {
      allPatients[existsIdx].total_visits = Math.max(allPatients[existsIdx].total_visits, dp.total_visits);
      if (new Date(dp.last_visit) > new Date(allPatients[existsIdx].last_visit)) {
        allPatients[existsIdx].last_visit = dp.last_visit;
        allPatients[existsIdx].last_triage_tier = dp.last_triage_tier;
      }
      dp.conditions.forEach(cond => {
        if (!allPatients[existsIdx].conditions.includes(cond)) {
          allPatients[existsIdx].conditions.push(cond);
        }
      });
    } else {
      allPatients.push(dp);
    }
  });

  const filtered = allPatients.filter(p => {
    const matchesSearch = p.pet_name.toLowerCase().includes(search.toLowerCase()) ||
      p.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      p.pet_breed.toLowerCase().includes(search.toLowerCase());
    const matchesTier = filterTier === 'all' || p.last_triage_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-white">Patient Registry</h2>
          <p className="text-sm text-slate-500">{allPatients.length} patients registered</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search pet, owner, or breed..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <select
            value={filterTier}
            onChange={e => setFilterTier(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Status</option>
            <option value="HEALTHY">Healthy</option>
            <option value="MONITOR">Monitor</option>
            <option value="URGENT">Urgent</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Last Visit</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Visits</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Active Rx</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((patient, idx) => (
                <motion.tr
                  key={patient.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedPatient(selectedPatient?.id === patient.id ? null : patient)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-base">
                        {getSpeciesEmoji(patient.pet_species)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{patient.pet_name}</p>
                        <p className="text-[10px] text-slate-500">{patient.pet_breed} · {patient.pet_species} · {patient.pet_age}y</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-slate-300">{patient.owner_name}</p>
                    <p className="text-[10px] text-slate-600">{patient.owner_phone}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-sm text-slate-400">{new Date(patient.last_visit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                    <span className="text-sm font-bold text-slate-300">{patient.total_visits}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                    <span className={`text-sm font-bold ${patient.active_prescriptions > 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                      {patient.active_prescriptions}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${tierColors[patient.last_triage_tier]}`}>
                      {patient.last_triage_tier}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button className="text-slate-500 hover:text-emerald-400 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <PawPrint size={40} className="text-slate-800 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No patients match your search</p>
          </div>
        )}
      </div>

      {/* Expanded Patient Detail */}
      {selectedPatient && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-slate-900 rounded-2xl border border-slate-800 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedPatient.pet_name}'s Profile</h3>
              <p className="text-sm text-slate-500">{selectedPatient.pet_breed} · {selectedPatient.pet_species} · Age: {selectedPatient.pet_age} years</p>
            </div>
            <button
              onClick={() => setSelectedPatient(null)}
              className="text-slate-500 hover:text-white text-sm"
            >✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Owner Info</p>
              <p className="text-sm font-medium text-white">{selectedPatient.owner_name}</p>
              <p className="text-xs text-slate-400">{selectedPatient.owner_phone}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Conditions</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedPatient.conditions.map(c => (
                  <span key={c} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">{c}</span>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Visit Summary</p>
              <p className="text-sm text-slate-300"><span className="font-bold text-white">{selectedPatient.total_visits}</span> total visits</p>
              <p className="text-sm text-slate-300"><span className="font-bold text-blue-400">{selectedPatient.active_prescriptions}</span> active prescriptions</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
