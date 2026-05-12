import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Play, CheckCircle, SkipForward, Plus, AlertTriangle, User, Timer } from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext';

interface PatientQueueProps {
  onStartConsultation: () => void;
}

export default function PatientQueue({ onStartConsultation }: PatientQueueProps) {
  const { queue } = useDoctor();
  const [localQueue, setLocalQueue] = useState(queue);
  const [showAddWalkIn, setShowAddWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ petName: '', ownerName: '', reason: '', isEmergency: false });

  const waitingCount = localQueue.filter(q => q.status === 'waiting').length;
  const inProgressItem = localQueue.find(q => q.status === 'in_consultation');

  const handleStatusChange = (id: string, newStatus: 'waiting' | 'in_consultation' | 'completed' | 'skipped') => {
    setLocalQueue(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          status: newStatus,
          start_time: newStatus === 'in_consultation' ? new Date().toISOString() : q.start_time,
          end_time: (newStatus === 'completed' || newStatus === 'skipped') ? new Date().toISOString() : q.end_time,
        };
      }
      return q;
    }));
    if (newStatus === 'in_consultation') {
      onStartConsultation();
    }
  };

  const addWalkIn = () => {
    const newItem = {
      id: `wq-${Date.now()}`,
      appointment_id: `wa-${Date.now()}`,
      pet_id: `wp-${Date.now()}`,
      owner_id: `wo-${Date.now()}`,
      queue_position: localQueue.length + 1,
      status: walkInForm.isEmergency ? 'waiting' as const : 'waiting' as const,
      check_in_time: new Date().toISOString(),
      estimated_wait_minutes: waitingCount * 15,
      is_walk_in: true,
      is_emergency: walkInForm.isEmergency,
      pet_name: walkInForm.petName,
      pet_breed: 'Unknown',
      pet_species: 'Dog',
      owner_name: walkInForm.ownerName,
      reason: walkInForm.reason,
    };

    if (walkInForm.isEmergency) {
      // Emergency goes to front of queue
      setLocalQueue(prev => [newItem, ...prev.map(q => ({ ...q, queue_position: q.queue_position + 1 }))]);
    } else {
      setLocalQueue(prev => [...prev, newItem]);
    }
    setWalkInForm({ petName: '', ownerName: '', reason: '', isEmergency: false });
    setShowAddWalkIn(false);
  };

  const getTimeWaiting = (checkInTime: string) => {
    const diff = Date.now() - new Date(checkInTime).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const statusColors = {
    waiting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    in_consultation: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-slate-800 text-slate-500 border-slate-700',
    skipped: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-white">Patient Queue</h2>
          <p className="text-sm text-slate-500">
            <span className="text-amber-400 font-bold">{waitingCount}</span> waiting
            {inProgressItem && <span> · <span className="text-emerald-400 font-bold">1</span> in consultation</span>}
          </p>
        </div>
        <button
          onClick={() => setShowAddWalkIn(true)}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} /> Walk-in Patient
        </button>
      </div>

      {/* Walk-in Modal */}
      <AnimatePresence>
        {showAddWalkIn && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-slate-900 rounded-2xl border border-slate-800 p-5"
          >
            <h3 className="text-sm font-bold text-white mb-4">Add Walk-in Patient</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Pet Name"
                value={walkInForm.petName}
                onChange={e => setWalkInForm(p => ({ ...p, petName: e.target.value }))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
              <input
                placeholder="Owner Name"
                value={walkInForm.ownerName}
                onChange={e => setWalkInForm(p => ({ ...p, ownerName: e.target.value }))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
              <input
                placeholder="Reason for visit"
                value={walkInForm.reason}
                onChange={e => setWalkInForm(p => ({ ...p, reason: e.target.value }))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 sm:col-span-2"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={walkInForm.isEmergency}
                  onChange={e => setWalkInForm(p => ({ ...p, isEmergency: e.target.checked }))}
                  className="accent-red-500"
                />
                <span className="text-sm text-red-400 font-medium flex items-center gap-1">
                  <AlertTriangle size={14} /> Emergency (Skip queue)
                </span>
              </label>
              <div className="flex gap-2">
                <button onClick={() => setShowAddWalkIn(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-white transition-colors">Cancel</button>
                <button
                  onClick={addWalkIn}
                  disabled={!walkInForm.petName || !walkInForm.ownerName}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Add to Queue
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue List */}
      <div className="space-y-3">
        {localQueue.filter(q => q.status !== 'completed' && q.status !== 'skipped').map((item, idx) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-slate-900 rounded-2xl border p-5 transition-all ${
              item.status === 'in_consultation' ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5' :
              item.is_emergency ? 'border-red-500/30' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Position */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                item.status === 'in_consultation' ? 'bg-emerald-500 text-white' :
                item.is_emergency ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-slate-800 text-slate-400'
              }`}>
                {item.status === 'in_consultation' ? <Play size={20} /> : `#${item.queue_position}`}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-bold text-white">{item.pet_name}</p>
                  {item.is_walk_in && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full">WALK-IN</span>}
                  {item.is_emergency && <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full animate-pulse">🚨 EMERGENCY</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.pet_breed} · Owner: {item.owner_name}
                </p>
                <p className="text-xs text-slate-400 mt-1">{item.reason}</p>
              </div>

              {/* Time & Status */}
              <div className="text-right shrink-0">
                <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full border ${statusColors[item.status]}`}>
                  {item.status === 'in_consultation' ? 'IN PROGRESS' : item.status.toUpperCase()}
                </span>
                <div className="flex items-center gap-1 mt-2 justify-end text-slate-600">
                  <Timer size={12} />
                  <span className="text-[10px] font-medium">{getTimeWaiting(item.check_in_time)}</span>
                </div>
                {item.status === 'waiting' && item.estimated_wait_minutes && (
                  <p className="text-[10px] text-slate-600 mt-0.5">~{item.estimated_wait_minutes}m est.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                {item.status === 'waiting' && (
                  <button
                    onClick={() => handleStatusChange(item.id, 'in_consultation')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Play size={12} /> Start
                  </button>
                )}
                {item.status === 'in_consultation' && (
                  <button
                    onClick={() => handleStatusChange(item.id, 'completed')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors"
                  >
                    <CheckCircle size={12} /> Complete
                  </button>
                )}
                {item.status === 'waiting' && (
                  <button
                    onClick={() => handleStatusChange(item.id, 'skipped')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    <SkipForward size={12} /> Skip
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {localQueue.filter(q => q.status !== 'completed' && q.status !== 'skipped').length === 0 && (
          <div className="text-center py-16">
            <Clock size={48} className="text-slate-800 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Queue is empty</p>
            <p className="text-xs text-slate-600 mt-1">Add a walk-in patient to get started</p>
          </div>
        )}
      </div>

      {/* Completed Section */}
      {localQueue.filter(q => q.status === 'completed' || q.status === 'skipped').length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Completed Today</h3>
          <div className="space-y-2">
            {localQueue.filter(q => q.status === 'completed' || q.status === 'skipped').map(item => (
              <div key={item.id} className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-3 flex items-center gap-3 opacity-60">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {item.status === 'completed' ? <CheckCircle size={14} /> : <SkipForward size={14} />}
                </div>
                <p className="text-sm text-slate-400">{item.pet_name} <span className="text-slate-600">· {item.owner_name}</span></p>
                <span className="ml-auto text-[10px] text-slate-600">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
