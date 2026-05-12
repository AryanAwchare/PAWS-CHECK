import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarCheck, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight,
  AlertTriangle, MessageSquare, Filter
} from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext';

type ViewMode = 'requests' | 'calendar' | 'all';

interface TimeSlot {
  id: string;
  time: string;
  endTime: string;
  status: 'available' | 'booked' | 'blocked' | 'break';
  label?: string;
  appointment?: any;
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9 AM to 6 PM

export default function AppointmentManager() {
  const { appointments, pendingRequests } = useDoctor();
  const [viewMode, setViewMode] = useState<ViewMode>('requests');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [localAppointments, setLocalAppointments] = useState(appointments);
  
  // Ensure background sync arrays feed immediately into local interface mapping views
  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  const [blockedSlots, setBlockedSlots] = useState<TimeSlot[]>([
    { id: 'b1', time: '12:00', endTime: '13:00', status: 'break', label: 'Lunch Break' },
    { id: 'b2', time: '15:00', endTime: '15:30', status: 'blocked', label: 'Surgery' },
  ]);

  const localPending = localAppointments.filter(a => a.status === 'pending');
  const allExceptPending = localAppointments.filter(a => a.status !== 'pending');

  const handleApprove = (id: string) => {
    setLocalAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'approved' } : a)
    );
    try {
      const stored = localStorage.getItem('pawscheck_custom_appointments');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((a: any) => a.id === id ? { ...a, status: 'approved' } : a);
        localStorage.setItem('pawscheck_custom_appointments', JSON.stringify(updated));
      }
    } catch(e) {}
  };

  const handleReject = (id: string) => {
    setLocalAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'rejected', rejection_reason: rejectReason } : a)
    );
    try {
      const stored = localStorage.getItem('pawscheck_custom_appointments');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((a: any) => a.id === id ? { ...a, status: 'rejected', rejection_reason: rejectReason } : a);
        localStorage.setItem('pawscheck_custom_appointments', JSON.stringify(updated));
      }
    } catch(e) {}
    setRejectingId(null);
    setRejectReason('');
  };

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'booked': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'blocked': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'break': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default: return 'bg-slate-800 border-slate-700 text-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed': return 'bg-slate-700 text-slate-400 border-slate-600';
      case 'cancelled': return 'bg-slate-800 text-slate-500 border-slate-700';
      default: return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const toggleSlotBlock = (hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const existing = blockedSlots.find(s => s.time === timeStr);
    if (existing) {
      setBlockedSlots(prev => prev.filter(s => s.time !== timeStr));
    } else {
      setBlockedSlots(prev => [...prev, {
        id: `block-${Date.now()}`,
        time: timeStr,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        status: 'blocked',
        label: 'Blocked',
      }]);
    }
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-white">Appointments</h2>
          <p className="text-sm text-slate-500">Manage requests and your calendar</p>
        </div>

        <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-1">
          {[
            { id: 'requests', label: 'Requests', badge: localPending.length },
            { id: 'calendar', label: 'Calendar' },
            { id: 'all', label: 'All' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as ViewMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === tab.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Requests View */}
      {viewMode === 'requests' && (
        <div className="space-y-3">
          {localPending.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
              <CheckCircle size={48} className="text-emerald-500/20 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">All caught up!</p>
              <p className="text-xs text-slate-600 mt-1">No pending appointment requests</p>
            </div>
          ) : (
            localPending.map((apt, idx) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-slate-900 rounded-2xl border p-5 ${
                  apt.urgency_level === 'emergency' ? 'border-red-500/30' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(apt.pet_name || 'P')}&background=${apt.urgency_level === 'emergency' ? 'ef4444' : '6366f1'}&color=ffffff&bold=true&size=44`}
                      className="w-11 h-11 rounded-xl shrink-0"
                      alt={apt.pet_name}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-white">{apt.pet_name}</h4>
                        <span className="text-xs text-slate-500">{apt.pet_breed}</span>
                        {apt.urgency_level === 'emergency' && (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                            <AlertTriangle size={10} /> EMERGENCY
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">Owner: {apt.owner_name}</p>
                      <p className="text-sm text-slate-300 mt-2">{apt.reason}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>📅 {new Date(apt.appointment_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span>⏰ {new Date(apt.appointment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>⏱ {apt.duration_minutes} min</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(apt.type)}`}>
                          {apt.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(apt.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(apt.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-colors"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>

                {/* Reject Reason Input */}
                <AnimatePresence>
                  {rejectingId === apt.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-800"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={14} className="text-red-400" />
                        <span className="text-xs font-bold text-red-400">Reason for rejection (visible to owner)</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="e.g., Fully booked, please try tomorrow..."
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50"
                        />
                        <button
                          onClick={() => handleReject(apt.id)}
                          className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-3 py-2.5 text-slate-500 hover:text-white text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          {/* Date Navigation */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <button onClick={() => navigateDate(-1)} className="text-slate-500 hover:text-white transition-colors p-1">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-sm font-bold text-white">
              {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => navigateDate(1)} className="text-slate-500 hover:text-white transition-colors p-1">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Time Slots Legend */}
          <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap gap-3">
            {[
              { status: 'available', label: 'Available', dot: 'bg-emerald-400' },
              { status: 'booked', label: 'Booked', dot: 'bg-blue-400' },
              { status: 'blocked', label: 'Blocked', dot: 'bg-red-400' },
              { status: 'break', label: 'Break', dot: 'bg-amber-400' },
            ].map(item => (
              <div key={item.status} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.dot}`}></div>
                <span className="text-[10px] text-slate-500 font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="divide-y divide-slate-800/50">
            {HOURS.map(hour => {
              const timeStr = `${hour.toString().padStart(2, '0')}:00`;
              const blocked = blockedSlots.find(s => s.time === timeStr);
              const bookedApt = localAppointments.find(a => {
                const aptHour = new Date(a.appointment_date).getHours();
                return aptHour === hour && (a.status === 'approved' || a.status === 'in_progress');
              });
              const slotStatus = bookedApt ? 'booked' : blocked?.status || 'available';

              return (
                <div
                  key={hour}
                  className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                    slotStatus === 'available' ? 'hover:bg-slate-800/30 cursor-pointer' : ''
                  }`}
                  onClick={() => slotStatus === 'available' && toggleSlotBlock(hour)}
                >
                  <span className="text-xs font-mono text-slate-600 w-14 shrink-0">
                    {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`}
                  </span>

                  <div className={`flex-1 h-12 rounded-xl border flex items-center px-4 gap-3 ${getSlotColor(slotStatus)}`}>
                    {slotStatus === 'available' && (
                      <span className="text-xs font-medium opacity-60">Click to block this slot</span>
                    )}
                    {slotStatus === 'booked' && bookedApt && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-xs font-bold">{bookedApt.pet_name}</span>
                        <span className="text-[10px] opacity-60">· {bookedApt.owner_name} · {bookedApt.duration_minutes}min</span>
                      </>
                    )}
                    {(slotStatus === 'blocked' || slotStatus === 'break') && blocked && (
                      <>
                        <div className={`w-2 h-2 rounded-full ${slotStatus === 'break' ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                        <span className="text-xs font-bold">{blocked.label}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSlotBlock(hour); }}
                          className="ml-auto text-[10px] text-slate-500 hover:text-white"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Appointments View */}
      {viewMode === 'all' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Reason</th>
                  <th className="text-center px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {localAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-white">{apt.pet_name}</p>
                      <p className="text-[10px] text-slate-500">{apt.owner_name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-300">
                        {new Date(apt.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(apt.appointment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {apt.duration_minutes}min
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-slate-400 capitalize">{apt.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-slate-400 max-w-[200px] truncate">{apt.reason}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusBadge(apt.status)}`}>
                        {apt.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
