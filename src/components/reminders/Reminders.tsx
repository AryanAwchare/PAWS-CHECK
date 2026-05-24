import { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle2, Plus, Trash2, AlertCircle, Activity, X, LogIn, Calendar, FileText, Download, Scale, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePet } from '../../context/PetContext';
import { getUserReminders, createReminder, completeReminder as markComplete, deleteReminder as removeReminder, updatePet } from '../../lib/supabaseServices';

export default function Reminders() {
  const { userId, activePet, isGuest, refreshPets } = usePet();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('normal');

  // Weight Ecosystem States
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [logWeightValue, setLogWeightValue] = useState('');
  const [logWeightDate, setLogWeightDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [logWeightSuccess, setLogWeightSuccess] = useState(false);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logWeightValue || !activePet) return;

    const weightNum = parseFloat(logWeightValue);
    if (isNaN(weightNum) || weightNum <= 0) return;

    const activeEmail = localStorage.getItem('pawscheck_user_email') || 'anonymous';
    
    const newLog = {
      id: `weight-log-${Date.now()}`,
      pet_id: activePet.id,
      pet_name: activePet.name,
      owner_id: userId,
      owner_email: activeEmail,
      weight: logWeightValue,
      date: logWeightDate
    };

    try {
      // 1. Save to local storage weight logs
      const existingLogs = localStorage.getItem('pawscheck_weight_logs');
      const parsedLogs = existingLogs ? JSON.parse(existingLogs) : [];
      localStorage.setItem('pawscheck_weight_logs', JSON.stringify([newLog, ...parsedLogs]));

      // 2. Update pet profile (weight field)
      if (isGuest || userId.includes('00000000')) {
        const localSaved = localStorage.getItem('pawscheck_local_pets');
        if (localSaved) {
          const localArr = JSON.parse(localSaved);
          const updatedArr = localArr.map((p: any) => 
            p.id === activePet.id ? { ...p, weight: logWeightValue } : p
          );
          localStorage.setItem('pawscheck_local_pets', JSON.stringify(updatedArr));
        }
      } else {
        try {
          await updatePet(activePet.id, { weight: logWeightValue });
        } catch (supabaseErr) {
          console.warn("Failed to sync weight to Supabase, updating local fallback:", supabaseErr);
          const localSaved = localStorage.getItem('pawscheck_local_pets');
          const localArr = localSaved ? JSON.parse(localSaved) : [];
          const updatedArr = localArr.map((p: any) => 
            p.id === activePet.id ? { ...p, weight: logWeightValue } : p
          );
          localStorage.setItem('pawscheck_local_pets', JSON.stringify(updatedArr));
        }
      }

      // 3. Refresh pets context
      await refreshPets();

      setLogWeightSuccess(true);
      setTimeout(() => {
        setLogWeightSuccess(false);
        setShowWeightModal(false);
        setLogWeightValue('');
      }, 1500);

    } catch (err) {
      console.error("Failed to log weight:", err);
    }
  };

  // Appointment Ecosystem States
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentUrgency, setAppointmentUrgency] = useState('normal');
  const [attachReport, setAttachReport] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('10:00');

  const [petWeight, setPetWeight] = useState('');
  const [petAge, setPetAge] = useState('');
  const [previousMedications, setPreviousMedications] = useState('');

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      days.push({
        dateString: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return days;
  };

  const availableSlots = [
    { time: '09:00', label: '09:00 AM' },
    { time: '10:00', label: '10:00 AM' },
    { time: '11:00', label: '11:00 AM' },
    { time: '12:00', label: '12:00 PM' },
    { time: '14:00', label: '02:00 PM' },
    { time: '15:00', label: '03:00 PM' },
    { time: '16:00', label: '04:00 PM' },
    { time: '17:00', label: '05:00 PM' }
  ];

  useEffect(() => {
    if (activePet) {
      setPetWeight(activePet.weight ? String(activePet.weight) : '');
      setPetAge(activePet.age ? String(activePet.age) : '');
      setPreviousMedications(activePet.previous_medications || '');
    } else {
      setPetWeight('');
      setPetAge('');
      setPreviousMedications('');
    }
  }, [showAppointmentModal, activePet]);

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentReason.trim()) return;

    const activeEmail = localStorage.getItem('pawscheck_user_email') || 'anonymous';
    const fullReason = attachReport
      ? `${appointmentReason}\n\n[📎 Attached Visual AI Diagnostic Report — Latest scan attached by owner]`
      : appointmentReason;

    let selectedDateTime = new Date().toISOString();
    try {
      if (appointmentDate && appointmentTime) {
        selectedDateTime = new Date(`${appointmentDate}T${appointmentTime}`).toISOString();
      }
    } catch (e) {
      console.warn("Date parsing failed", e);
    }

    const newAppointment = {
      id: `app-custom-${Date.now()}`,
      pet_id: activePet?.id || `pet-${Date.now()}`,
      owner_id: userId || `owner-${Date.now()}`,
      owner_email: activeEmail,
      vet_id: 'vet-active',
      appointment_date: selectedDateTime,
      duration_minutes: 30,
      status: 'pending',
      type: 'scheduled',
      reason: fullReason,
      urgency_level: appointmentUrgency,
      pet_name: activePet?.name || 'My Pet',
      owner_name: localStorage.getItem('pawscheck_user_name') || 'Pet Owner',
      pet_breed: activePet?.breed || 'Unknown',
      pet_species: activePet?.species || 'Dog',
      pet_weight: petWeight,
      pet_age: petAge ? parseInt(petAge) : undefined,
      previous_medications: previousMedications
    };

    try {
      const existing = localStorage.getItem('pawscheck_custom_appointments');
      const parsedArray = existing ? JSON.parse(existing) : [];
      localStorage.setItem('pawscheck_custom_appointments', JSON.stringify([newAppointment, ...parsedArray]));
      
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setShowAppointmentModal(false);
        setAppointmentReason('');
      }, 1800);
    } catch(err) {
      console.error(err);
    }
  };

  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [completedReports, setCompletedReports] = useState<any[]>([]);

  // Poll for appointment status updates — filtered strictly to only this user's email
  useEffect(() => {
    const poll = () => {
      try {
        const activeEmail = localStorage.getItem('pawscheck_user_email');
        if (!activeEmail) {
          setMyAppointments([]);
          setCompletedReports([]);
          return;
        }

        const stored = localStorage.getItem('pawscheck_custom_appointments');
        if (stored) {
          const all = JSON.parse(stored);
          setMyAppointments(all.filter((a: any) => a.owner_email?.toLowerCase() === activeEmail.toLowerCase()));
        } else {
          setMyAppointments([]);
        }

        const rep = localStorage.getItem('pawscheck_completed_consultations');
        if (rep) {
          const allReps = JSON.parse(rep);
          setCompletedReports(allReps.filter((r: any) => r.owner_email?.toLowerCase() === activeEmail.toLowerCase()));
        } else {
          setCompletedReports([]);
        }
      } catch(e) {
        setMyAppointments([]);
        setCompletedReports([]);
      }
    };
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchReminders();
    } else {
      setLoading(false);
    }
  }, [userId]);


  const fetchReminders = async () => {
    setLoading(true);
    try {
      if (isGuest || userId.includes('00000000')) {
        throw new Error("Guest or offline user");
      }
      const data = await getUserReminders(userId);
      setReminders(data || []);
    } catch (err) {
      try {
        const localSaved = localStorage.getItem('pawscheck_local_reminders');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          setReminders(parsed.filter((r: any) => r.owner_id === userId));
        } else {
          setReminders([]);
        }
      } catch (e) {
        setReminders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id: string) => {
    try {
      if (isGuest || userId.includes('00000000') || id.startsWith('reminder-local-')) {
        throw new Error("Offline reminder complete");
      }
      await markComplete(id);
      setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: true } : r));
    } catch (err) {
      setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: true } : r));
      try {
        const localSaved = localStorage.getItem('pawscheck_local_reminders');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          const updated = parsed.map((r: any) => r.id === id ? { ...r, completed: true } : r);
          localStorage.setItem('pawscheck_local_reminders', JSON.stringify(updated));
        }
      } catch (e) {}
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      if (isGuest || userId.includes('00000000') || id.startsWith('reminder-local-')) {
        throw new Error("Offline reminder delete");
      }
      await removeReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setReminders(prev => prev.filter(r => r.id !== id));
      try {
        const localSaved = localStorage.getItem('pawscheck_local_reminders');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          const updated = parsed.filter((r: any) => r.id !== id);
          localStorage.setItem('pawscheck_local_reminders', JSON.stringify(updated));
        }
      } catch (e) {}
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDate || !activePet) return;
    
    const localId = `reminder-local-${Date.now()}`;
    const newTask = {
      id: localId,
      pet_id: activePet.id,
      owner_id: userId,
      title: newTaskTitle,
      duedate: new Date(newTaskDate).toISOString(),
      priority: newTaskPriority,
      completed: false
    };

    try {
      if (isGuest || userId.includes('00000000')) {
        throw new Error("Offline mode");
      }
      const newReminder = await createReminder({
        pet_id: activePet.id,
        owner_id: userId,
        title: newTaskTitle,
        dueDate: new Date(newTaskDate).toISOString(),
        priority: newTaskPriority,
        completed: false
      });
      setReminders(prev => [...prev, newReminder].sort((a, b) => new Date(a.duedate || a.dueDate).getTime() - new Date(b.duedate || b.dueDate).getTime()));
    } catch (err) {
      try {
        const localSaved = localStorage.getItem('pawscheck_local_reminders');
        const parsed = localSaved ? JSON.parse(localSaved) : [];
        parsed.push(newTask);
        localStorage.setItem('pawscheck_local_reminders', JSON.stringify(parsed));
      } catch (e) {}
      setReminders(prev => [...prev, newTask].sort((a, b) => new Date(a.duedate || a.dueDate).getTime() - new Date(b.duedate || b.dueDate).getTime()));
    } finally {
      setShowModal(false);
      setNewTaskTitle('');
      setNewTaskDate('');
      setNewTaskPriority('normal');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-2">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Care Plan & Scheduling</h2>
          <p className="text-sm text-slate-500 font-medium">Automatic follow-ups and real-time vet consultation requests.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowWeightModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 transition-colors flex items-center gap-2"
          >
            <Scale size={14} strokeWidth={3} />
            Log Weight
          </button>
          <button 
            onClick={() => setShowAppointmentModal(true)}
            className="bg-slate-900 text-white rounded-lg px-4 py-2 font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Calendar size={14} strokeWidth={3} className="text-blue-400" />
            Book Vet Visit
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={3} />
            Add Task
          </button>
        </div>
      </div>

      {/* Booking Feedback Alert */}
      <AnimatePresence>
        {bookingSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between font-bold text-xs"
          >
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">✓</span>
              Appointment broadcast transmitted! The clinical queue on the Doctor Portal has been updated in real-time.
            </span>
            <span className="text-[9px] uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">Ecosystem Sync</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Consultation Tracker */}
      {myAppointments.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-blue-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Live Consultation Status</h3>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ecosystem Feedback Loop</span>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {myAppointments.map((apt: any) => (
              <div key={apt.id} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">{apt.pet_name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[220px]">· {apt.reason}</span>
                  </div>
                  {apt.rejection_reason && (
                    <p className="text-[11px] text-red-400 font-bold mt-1.5 leading-tight bg-red-500/10 p-2 rounded border border-red-500/20">
                      Doctor's Note: {apt.rejection_reason}
                    </p>
                  )}
                  {apt.assigned_vet_name && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded w-fit uppercase tracking-wider border border-blue-500/10">
                      <Stethoscope size={10} />
                      Assigned Doctor: {apt.assigned_vet_name}
                    </div>
                  )}
                </div>
                
                <div className="shrink-0 self-start sm:self-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    (apt.status === 'approved' || apt.status === 'in_progress' || apt.status === 'completed') ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-sm shadow-green-500/10' :
                    apt.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  }`}>
                    {(apt.status === 'approved' || apt.status === 'in_progress' || apt.status === 'completed') ? '✓ Appointment Accepted' :
                     apt.status === 'rejected' ? '✕ Request Declined' :
                     '⌛ Pending Doctor Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Consultation Reports & Downloads */}
      {completedReports.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-5 text-white shadow-xl space-y-3 border border-blue-800/50">
          <div className="flex items-center justify-between border-b border-blue-800/50 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-blue-300" />
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-100">Transmitted Veterinary Records</h3>
            </div>
            <span className="bg-blue-500/20 text-blue-200 border border-blue-500/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Online Prescription / Summary</span>
          </div>
          
          <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {completedReports.map((rep: any) => (
              <div key={rep.id} className="bg-slate-900/60 backdrop-blur-sm border border-blue-700/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    🐾 Patient: {rep.pet_name}
                  </span>
                  <span className="text-[10px] text-blue-300 font-bold bg-blue-500/10 px-2 py-0.5 rounded">
                    {rep.date}
                  </span>
                </div>
                <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">
                  {rep.summary}
                </pre>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      const blob = new Blob([`PAWSCHECK VETERINARY CLINICAL REPORT\nPatient: ${rep.pet_name}\nDate: ${rep.date}\n\nCLINICAL SUMMARY & PRESCRIBED PLAN:\n${rep.summary}`], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${rep.pet_name}_Clinical_Report.txt`;
                      a.click();
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download size={12} />
                    Download Summary File
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Bell size={16} />
            </div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Schedule</h3>
          </div>
        </div>

        <div className="divide-y divide-slate-50 px-2 pb-2">
          <AnimatePresence initial={false}>
            {reminders.length === 0 ? (
              <div className="p-20 text-center text-slate-200">
                <Clock size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No active reminders</p>
              </div>
            ) : (
              reminders.map((reminder) => (
                <motion.div 
                  key={reminder.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`group p-4 flex items-center gap-4 transition-colors rounded-xl m-1 border ${
                    reminder.completed 
                    ? 'bg-slate-50 border-transparent opacity-60' 
                    : 'bg-white border-white hover:bg-slate-50/50 hover:border-slate-100'
                  }`}
                >
                  <button 
                    onClick={() => toggleComplete(reminder.id)}
                    className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                      reminder.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'bg-white border-slate-200 group-hover:border-blue-400'
                    }`}
                  >
                    {reminder.completed && <CheckCircle2 size={12} strokeWidth={4} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`text-sm font-bold truncate ${reminder.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {reminder.title}
                      </h4>
                      {reminder.priority === 'urgent' && !reminder.completed && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[8px] font-black uppercase rounded tracking-tighter">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(reminder.duedate || reminder.dueDate).toLocaleDateString()}
                      </span>
                      {reminder.petId === 'default-pet' && (
                        <span className="flex items-center gap-1">
                          <Activity size={10} />
                          Post-Diagnostic
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteReminder(reminder.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0">
          <AlertCircle size={20} />
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Consistency Check</h4>
          <p className="text-amber-800 text-xs font-bold leading-relaxed uppercase tracking-tighter opacity-80">
            Maintain protocol alignment. If health indices decline, immediate escalation to a professional facility is mandatory.
          </p>
        </div>
      </div>
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Add Care Task</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Task Title</label>
                  <input 
                    type="text" 
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g., Heartworm Medication"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Due Date</label>
                    <input 
                      type="date" 
                      required
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Priority</label>
                    <select 
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={!activePet}
                  className="w-full mt-2 bg-blue-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  Save Task
                </button>
                {!activePet && <p className="text-[10px] text-red-500 text-center mt-2 font-bold uppercase tracking-widest">Please create a pet profile first.</p>}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Weight Dialog */}
      <AnimatePresence>
        {showWeightModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Scale size={18} className="text-emerald-600" />
                  <h3 className="font-bold text-slate-800">Log Pet Weight</h3>
                </div>
                <button onClick={() => setShowWeightModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              {logWeightSuccess && (
                <div className="bg-emerald-600 text-white p-3 font-bold text-xs text-center">
                  ✓ Weight logged and synchronized successfully!
                </div>
              )}

              <form onSubmit={handleLogWeight} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Weight ({activePet?.species === 'Cat' ? 'kg / lbs' : 'kg'})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={logWeightValue}
                    onChange={(e) => setLogWeightValue(e.target.value)}
                    placeholder="e.g., 14.5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Log Date</label>
                  <input 
                    type="date" 
                    required
                    value={logWeightDate}
                    onChange={(e) => setLogWeightDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!activePet || logWeightSuccess}
                  className="w-full mt-2 bg-emerald-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  Log New Weight
                </button>
                {!activePet && <p className="text-[10px] text-red-500 text-center mt-2 font-bold uppercase tracking-widest">Please create a pet profile first.</p>}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book Appointment Dialog */}
      <AnimatePresence>
        {showAppointmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-400" />
                  <h3 className="font-bold text-xs uppercase tracking-widest">Book Consultation</h3>
                </div>
                <button onClick={() => setShowAppointmentModal(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Primary Symptom / Consultation Intent
                  </label>
                  <textarea 
                    required
                    rows={3}
                    value={appointmentReason}
                    onChange={(e) => setAppointmentReason(e.target.value)}
                    placeholder="e.g., Post-scan checkup for persistent scratching and lethargy cycles..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
                
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Select Consultation Date
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {getNext7Days().map((day) => {
                      const isSelected = appointmentDate === day.dateString;
                      return (
                        <motion.button
                          key={day.dateString}
                          type="button"
                          onClick={() => setAppointmentDate(day.dateString)}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-shrink-0 relative flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-all ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 font-black' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/80 font-bold'
                          }`}
                        >
                          <span className="text-[8px] uppercase tracking-tighter opacity-80">{day.dayName}</span>
                          <span className="text-sm leading-none my-1 block">{day.dayNumber}</span>
                          <span className="text-[8px] uppercase tracking-wider">{day.monthName}</span>
                          {isSelected && (
                            <motion.span 
                              layoutId="activeConsultationDateDot" 
                              className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white block" 
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Select Consultation Time
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      const isSelected = appointmentTime === slot.time;
                      return (
                        <motion.button
                          key={slot.time}
                          type="button"
                          onClick={() => setAppointmentTime(slot.time)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`py-2 rounded-lg border text-center text-[10px] font-black uppercase transition-all tracking-wider ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/80'
                          }`}
                        >
                          {slot.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Pet Weight (kg)
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      value={petWeight}
                      onChange={(e) => setPetWeight(e.target.value)}
                      placeholder="e.g., 10"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Pet Age (years)
                    </label>
                    <input 
                      type="number"
                      value={petAge}
                      onChange={(e) => setPetAge(e.target.value)}
                      placeholder="e.g., 3"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Previous Medications / Prescriptions
                  </label>
                  <input 
                    type="text"
                    value={previousMedications}
                    onChange={(e) => setPreviousMedications(e.target.value)}
                    placeholder="e.g., Apoquel, none"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Urgency Classification
                  </label>
                  <select 
                    value={appointmentUrgency}
                    onChange={(e) => setAppointmentUrgency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors mb-3"
                  >
                    <option value="normal">Standard Checkup (Within 48 hours)</option>
                    <option value="urgent">Urgent Priority (Next available block)</option>
                    <option value="emergency">🚨 Critical Emergency (Immediate triage admission)</option>
                  </select>

                  <label className="flex items-center gap-2 cursor-pointer bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/10 hover:bg-blue-500/10 transition-colors">
                    <input 
                      type="checkbox"
                      checked={attachReport}
                      onChange={(e) => setAttachReport(e.target.checked)}
                      className="accent-blue-600 rounded"
                    />
                    <span className="text-[11px] font-bold text-blue-400 block leading-tight">
                      📎 Attach Last Visual AI Scan Report/Score <span className="text-slate-500 font-medium">(Optional)</span>
                    </span>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">
                    Patient: {activePet?.name || 'Selected Pet'}
                  </span>
                  <button 
                    type="submit"
                    disabled={!activePet}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-colors disabled:opacity-50"
                  >
                    Broadcast Request
                  </button>
                </div>
                {!activePet && <p className="text-[10px] text-red-500 text-center mt-2 font-bold uppercase tracking-widest">Please create a pet profile first.</p>}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
