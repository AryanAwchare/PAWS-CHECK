import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, MailOpen, FileText, Download, Calendar, User,
  Pill, Activity, Clock, ShieldAlert, CheckCircle, Search
} from 'lucide-react';

interface MedicationItem {
  id: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  reminderTime: string;
}

interface Prescription {
  id: string;
  petName: string;
  petBreed?: string;
  ownerName?: string;
  ownerEmail: string;
  vetName: string;
  clinicName: string;
  medications: MedicationItem[];
  notes: string;
  createdAt: string;
  status: string;
}

export default function Inbox() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescriptions = () => {
      try {
        const activeEmail = localStorage.getItem('pawscheck_user_email');
        const stored = localStorage.getItem('pawscheck_prescriptions');
        const readList = localStorage.getItem('pawscheck_read_rx_ids');
        
        if (readList) {
          setReadIds(JSON.parse(readList));
        }

        let list: Prescription[] = [];
        if (stored) {
          const all: Prescription[] = JSON.parse(stored);
          if (activeEmail) {
            list = all.filter(rx => rx.ownerEmail?.toLowerCase() === activeEmail.toLowerCase());
          } else {
            list = all;
          }
        }

        // Add some default demo prescriptions if it is a demo or empty user
        if (list.length === 0 && (!activeEmail || activeEmail.includes('demo') || activeEmail === 'priya@example.com')) {
          list = [
            {
              id: 'rx-demo-1',
              petName: 'Bruno',
              petBreed: 'Golden Retriever',
              ownerName: 'Priya Sharma',
              ownerEmail: activeEmail || 'priya@example.com',
              vetName: 'Dr. Sharma',
              clinicName: 'PawCare Veterinary Clinic',
              createdAt: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
              status: 'active',
              notes: 'Give Cephalexin after meals. Complete full 10-day course even if scratching stops.',
              medications: [
                {
                  id: 'm1',
                  medicationName: 'Cephalexin',
                  dosage: '500mg',
                  frequency: 'Twice daily',
                  duration: '10 days',
                  route: 'Oral',
                  instructions: 'Give with food',
                  reminderTime: '08:00'
                }
              ]
            },
            {
              id: 'rx-demo-2',
              petName: 'Bruno',
              petBreed: 'Golden Retriever',
              ownerName: 'Priya Sharma',
              ownerEmail: activeEmail || 'priya@example.com',
              vetName: 'Dr. Patel',
              clinicName: 'City Vet Hospital',
              createdAt: new Date(Date.now() - 86400000 * 8).toLocaleDateString(),
              status: 'active',
              notes: 'Clean ears gently before applying drops. Monitor for any signs of discomfort.',
              medications: [
                {
                  id: 'm2',
                  medicationName: 'Apoquel',
                  dosage: '16mg',
                  frequency: 'Once daily',
                  duration: '14 days',
                  route: 'Oral',
                  instructions: 'Can be given with or without food',
                  reminderTime: '09:00'
                },
                {
                  id: 'm3',
                  medicationName: 'Chlorhexidine Ear Drops',
                  dosage: '3-4 drops',
                  frequency: 'Twice weekly',
                  duration: '4 weeks',
                  route: 'Ear drops',
                  instructions: 'Apply and massage ear base gently',
                  reminderTime: '18:00'
                }
              ]
            }
          ];
        }

        setPrescriptions(list);
      } catch (e) {
        console.error("Error reading prescriptions", e);
      }
    };

    fetchPrescriptions();
    const interval = setInterval(fetchPrescriptions, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = (rx: Prescription) => {
    try {
      const medsText = rx.medications.map(m => 
        `- ${m.medicationName} (${m.dosage})\n  Frequency: ${m.frequency}\n  Duration: ${m.duration}\n  Route: ${m.route}\n  Instructions: ${m.instructions || 'None'}\n  Time: ${m.reminderTime}`
      ).join('\n\n');

      const content = `=========================================\n` +
                      `      PAWSCHECK VETERINARY PRESCRIPTION  \n` +
                      `=========================================\n` +
                      `Date: ${rx.createdAt}\n` +
                      `Clinic: ${rx.clinicName}\n` +
                      `Veterinarian: ${rx.vetName}\n\n` +
                      `Patient: ${rx.petName} (${rx.petBreed || 'Unknown Breed'})\n` +
                      `Owner Name: ${rx.ownerName || 'Pet Owner'}\n` +
                      `Owner Email: ${rx.ownerEmail}\n` +
                      `=========================================\n\n` +
                      `PRESCRIBED MEDICATIONS:\n\n${medsText}\n\n` +
                      `CLINICAL NOTES / GUIDANCE:\n` +
                      `${rx.notes || 'No notes specified.'}\n\n` +
                      `=========================================\n` +
                      `Thank you for trusting PawsCheck Clinical Solutions.\n` +
                      `=========================================\n`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rx.petName.replace(/\s+/g, '_')}_Prescription_${rx.createdAt.replace(/\//g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setToastMessage(`Prescription for ${rx.petName} downloaded!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('pawscheck_read_rx_ids', JSON.stringify(updated));
    }
  };

  const filteredRx = prescriptions.filter(rx => 
    rx.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.vetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.clinicName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pt-2">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Mail className="text-blue-500" /> Clinic Inbox & Prescriptions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View, track, and download official medical regimens sent directly by your veterinarians
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by pet or vet..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List Pane */}
        <div className="lg:col-span-1 space-y-3">
          {filteredRx.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
              <MailOpen size={36} className="mx-auto text-slate-400 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No prescriptions found</p>
              <p className="text-[10px] text-slate-400 mt-1">Prescriptions saved by veterinarians will appear here.</p>
            </div>
          ) : (
            filteredRx.map(rx => {
              const isRead = readIds.includes(rx.id);
              const isSelected = selectedRx?.id === rx.id;
              
              return (
                <motion.div
                  key={rx.id}
                  onClick={() => {
                    setSelectedRx(rx);
                    markAsRead(rx.id);
                  }}
                  whileHover={{ scale: 1.01 }}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500 dark:border-blue-400'
                      : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isRead ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {isRead ? <MailOpen size={16} /> : <Mail size={16} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                          {rx.petName}
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {rx.clinicName}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">
                      {rx.createdAt}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {rx.medications.slice(0, 2).map((m, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[9px] font-bold">
                        💊 {m.medicationName}
                      </span>
                    ))}
                    {rx.medications.length > 2 && (
                      <span className="text-[9px] text-slate-400 self-center font-bold">
                        +{rx.medications.length - 2} more
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-2">
          {selectedRx ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6"
            >
              {/* Rx Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white">
                      Prescription for {selectedRx.petName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Issued by <span className="font-bold text-blue-500">{selectedRx.vetName}</span> · {selectedRx.clinicName}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownload(selectedRx)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 self-start sm:self-center"
                >
                  <Download size={14} /> Download PDF/TXT
                </button>
              </div>

              {/* Patient Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase">Pet Name</label>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedRx.petName}</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase">Breed</label>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedRx.petBreed || 'Unknown'}</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase">Date Issued</label>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedRx.createdAt}</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase">Status</label>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                    Active Regimen
                  </span>
                </div>
              </div>

              {/* Medications List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Prescribed Regimen ({selectedRx.medications.length} items)
                </h4>
                
                <div className="space-y-3">
                  {selectedRx.medications.map((med, idx) => (
                    <div
                      key={med.id}
                      className="border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-black text-slate-800 dark:text-white">
                            {med.medicationName}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {med.dosage}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {med.frequency} · {med.duration} · {med.route}
                        </p>
                        
                        {med.instructions && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Guidance: "{med.instructions}"
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/10 font-bold self-start md:self-center">
                        <Clock size={12} /> Reminder Set: {med.reminderTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vet Clinical Notes */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-5">
                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Veterinary Care Guidance
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 p-4 rounded-xl font-medium">
                  {selectedRx.notes || 'No special clinician guidance notes recorded.'}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[300px] bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center opacity-70">
              <MailOpen size={48} className="text-slate-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Select a Prescription</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Click on any message in the inbox to view full veterinary details, schedules, and clinical guidance notes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
