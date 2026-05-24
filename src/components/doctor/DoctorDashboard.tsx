import { motion } from 'motion/react';
import {
  Users, Clock, Pill, Star, TrendingUp, CalendarCheck, AlertTriangle,
  ArrowRight, CheckCircle, XCircle, Activity, FileText
} from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext';

interface DoctorDashboardProps {
  onNavigate: (tab: string) => void;
}

const getSpeciesEmoji = (species?: string) => {
  const s = species?.toLowerCase();
  if (s === 'dog') return '🐕';
  if (s === 'cat') return '🐈';
  if (s === 'fish') return '🐠';
  if (s === 'bird') return '🐦';
  if (s === 'rabbit') return '🐇';
  return '🐾';
};

export default function DoctorDashboard({ onNavigate }: DoctorDashboardProps) {
  const { stats, pendingRequests, queue, appointments, vetProfile, updateAppointmentStatus } = useDoctor();

  const statCards = [
    { label: "Today's Patients", value: stats.todayPatients, icon: Users, color: 'emerald', trend: '+3 from yesterday' },
    { label: 'Pending Requests', value: stats.pendingCount, icon: Clock, color: 'amber', trend: 'Needs attention' },
    { label: 'Active Prescriptions', value: stats.activePrescriptions, icon: Pill, color: 'blue', trend: 'Across 5 patients' },
    { label: 'Average Rating', value: stats.avgRating.toFixed(1), icon: Star, color: 'purple', trend: `${stats.totalConsultations} consultations` },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
  };

  const colorMapBg: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-2xl p-6 border border-emerald-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {localStorage.getItem('pawscheck_user_name') || 'Doctor'} 👋</h1>
            <p className="text-slate-400 mt-1">You have <span className="text-emerald-400 font-bold">{queue.filter(q => q.status === 'waiting').length} patients waiting</span> and <span className="text-amber-400 font-bold">{pendingRequests.length} pending requests</span></p>
          </div>
          <button
            onClick={() => onNavigate('queue')}
            className="hidden md:flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Open Queue <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMapBg[card.color]}`}>
                <card.icon size={20} />
              </div>
              <TrendingUp size={14} className="text-slate-600" />
            </div>
            <p className="text-3xl font-black text-white">{card.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{card.label}</p>
            <p className="text-[10px] text-slate-600 mt-2">{card.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Appointment Requests */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-amber-400" />
              <h3 className="font-bold text-white text-sm">Pending Requests</h3>
              {pendingRequests.length > 0 && (
                <span className="w-5 h-5 bg-amber-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </div>
            <button onClick={() => onNavigate('appointments')} className="text-xs text-slate-500 hover:text-emerald-400 font-medium transition-colors">
              View All →
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle size={32} className="text-emerald-500/30 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                        {getSpeciesEmoji(req.pet_species)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{req.pet_name} <span className="text-slate-500 font-normal">· {req.pet_breed}</span></p>
                        <p className="text-xs text-slate-500">Owner: {req.owner_name}</p>
                        <p className="text-xs text-slate-400 mt-1">{req.reason}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {req.urgency_level === 'emergency' && (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <AlertTriangle size={10} /> EMERGENCY
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => updateAppointmentStatus(req.id, 'approved')}
                          className="w-7 h-7 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center transition-colors" title="Approve"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button 
                          onClick={() => updateAppointmentStatus(req.id, 'rejected', 'Declined from dashboard')}
                          className="w-7 h-7 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center transition-colors" title="Reject"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-600">
                    <span>📅 {new Date(req.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span>⏰ {new Date(req.appointment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>⏱ {req.duration_minutes} min</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Queue */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Live Queue</h3>
            </div>
            <button onClick={() => onNavigate('queue')} className="text-xs text-slate-500 hover:text-emerald-400 font-medium transition-colors">
              Manage →
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {queue.map((item, idx) => (
              <div key={item.id} className={`p-4 flex items-center gap-4 ${
                item.status === 'in_consultation' ? 'bg-emerald-500/5' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                  item.status === 'in_consultation'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.status === 'in_consultation' ? '▶' : `#${item.queue_position}`}
                </div>
                <div className="flex items-center gap-2 text-xl shrink-0">
                  {getSpeciesEmoji(item.pet_species)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {item.pet_name}
                    {item.is_emergency && <span className="ml-2 text-red-400 text-[10px]">🚨 EMERGENCY</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{item.reason}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'in_consultation' ? 'bg-emerald-500/10 text-emerald-400' :
                    item.status === 'waiting' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {item.status === 'in_consultation' ? 'IN PROGRESS' : item.status === 'waiting' ? `~${item.estimated_wait_minutes}m wait` : item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Walk-in Patient', icon: Users, action: () => onNavigate('queue'), color: 'emerald' },
          { label: 'New Consultation', icon: FileText, action: () => onNavigate('consultation'), color: 'blue' },
          { label: 'Write Prescription', icon: Pill, action: () => onNavigate('prescriptions'), color: 'purple' },
          { label: 'View Calendar', icon: CalendarCheck, action: () => onNavigate('appointments'), color: 'amber' },
        ].map(action => (
          <button
            key={action.label}
            onClick={action.action}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 text-left transition-all hover:bg-slate-800/50 group"
          >
            <action.icon size={20} className={`text-${action.color}-400 mb-2 group-hover:scale-110 transition-transform`} />
            <p className="text-sm font-bold text-white">{action.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
