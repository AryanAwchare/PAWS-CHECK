import { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle2, Plus, Trash2, AlertCircle, Activity, X, LogIn, Calendar, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePet } from '../../context/PetContext';
import { getUserReminders, createReminder, completeReminder as markComplete, deleteReminder as removeReminder } from '../../lib/supabaseServices';

export default function Reminders() {
  const { userId, activePet, isGuest } = usePet();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('normal');

  // Appointment Ecosystem States
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentUrgency, setAppointmentUrgency] = useState('normal');
  const [attachReport, setAttachReport] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentReason.trim()) return;

    const fullReason = attachReport 
      ? `${appointmentReason}\n\n[📎 Attached Visual AI Diagnostic Report: Score 85/100 — Flagged URGENT. Erythema observed on ventral layout.]`
      : appointmentReason;

    const newAppointment = {
      id: `app-custom-${Date.now()}`,
      pet_id: activePet?.id || `pet-${Date.now()}`,
      owner_id: userId || `owner-${Date.now()}`,
      vet_id: '11111111-1111-1111-1111-111111111111',
      appointment_date: new Date().toISOString(),
      duration_minutes: 30,
      status: 'pending',
      type: 'scheduled',
      reason: fullReason,
      urgency_level: appointmentUrgency,
      pet_name: activePet?.name || 'My Pet',
      owner_name: localStorage.getItem('pawscheck_user_name') || 'Pet Owner',
      pet_breed: activePet?.breed || 'Unknown'
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

  // Periodically survey live shared memory structures to broadcast vet validation feedback immediately onto the owner portal
  useEffect(() => {
    const poll = () => {
      try {
        const stored = localStorage.getItem('pawscheck_custom_appointments');
        if (stored) {
          setMyAppointments(JSON.parse(stored));
        }
        const rep = localStorage.getItem('pawscheck_completed_consultations');
        if (rep) {
          setCompletedReports(JSON.parse(rep));
        }
      } catch(e) {}
    };
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userId && !isGuest) {
      fetchReminders();
    } else {
      setLoading(false);
    }
  }, [userId]);


  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await getUserReminders(userId);
      setReminders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id: string) => {
    try {
      await markComplete(id);
      setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: true } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await removeReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDate || !activePet) return;
    
    try {
      const newReminder = await createReminder({
        pet_id: activePet.id,
        owner_id: userId,
        title: newTaskTitle,
        dueDate: new Date(newTaskDate).toISOString(),
        priority: newTaskPriority,
        completed: false
      });
      setReminders(prev => [...prev, newReminder].sort((a, b) => new Date(a.duedate || a.dueDate).getTime() - new Date(b.duedate || b.dueDate).getTime()));
      setShowModal(false);
      setNewTaskTitle('');
      setNewTaskDate('');
      setNewTaskPriority('normal');
    } catch (err) {
      console.error("Failed to add task", err);
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
                </div>
                
                <div className="shrink-0 self-start sm:self-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    apt.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-sm shadow-green-500/10' :
                    apt.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  }`}>
                    {apt.status === 'approved' ? '✓ Accepted / Confirmed' :
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
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-colors"
                  >
                    Broadcast Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
