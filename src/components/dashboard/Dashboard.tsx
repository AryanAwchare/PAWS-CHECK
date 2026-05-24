import { useState, useEffect } from 'react';
import { Activity, AlertCircle, ChevronRight, HeartPulse, ShieldAlert, Stethoscope, Calendar, FileText, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  onNavigateScan?: () => void;
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

export default function Dashboard({ onNavigateScan }: DashboardProps = {}) {
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgScore: 0,
    totalRecords: 0,
    emergencyCount: 0
  });
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [completedReports, setCompletedReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecords = () => {
      let mergedRecords: any[] = [];
      const activeUser = localStorage.getItem('pawscheck_user_email');
      try {
        const stored = localStorage.getItem('pawscheck_user_scans');
        if (stored) {
          const raw = JSON.parse(stored);
          if (Array.isArray(raw)) {
            // Filter strictly to current logged-in user email
            mergedRecords = raw.filter((r: any) => r.user_email === activeUser);
          }
        }
      } catch(e) {}

      // Only supply default fallback if anonymous demo user is exploring without signing in
      if (mergedRecords.length === 0 && (!activeUser || activeUser.includes('demo'))) {
        mergedRecords = [
          {
            id: 'log-1',
            user_email: 'demo',
            risk_score: 85,
            triage_tier: 'URGENT',
            ai_explanation: 'Suspected Acute Secondary Dermatitis with marked focal erythema and persistent localized hyperkeratosis scaling.',
            created_at: new Date().toISOString()
          },
          {
            id: 'log-2',
            user_email: 'demo',
            risk_score: 45,
            triage_tier: 'MONITOR',
            ai_explanation: 'Mild localized gingival redness observed along upper left pre-molar boundaries. Feeding intervals reported normal.',
            created_at: new Date(Date.now() - 86400000 * 3).toISOString()
          }
        ];
      }
      updateStats(mergedRecords);
    };

    const updateStats = (records: any[]) => {
      setRecentRecords(records);
      if (records.length > 0) {
        const scores = records.map(r => r.risk_score || 0);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const emergencies = records.filter(r => r.triage_tier === 'EMERGENCY').length;
        setStats({
          avgScore: avg,
          totalRecords: records.length,
          emergencyCount: emergencies
        });
      }
    };

    fetchRecords();
  }, []);

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
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pt-2">
      {/* Welcome Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">AI Diagnostic Report</h2>
          <p className="text-sm text-slate-500">Status as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase">System Status</span>
          <span className="text-xl font-mono font-bold text-green-600">Active</span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="md:col-span-6 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-8"
        >
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Overall Wellness Index</h3>
            <p className="text-5xl font-black text-slate-800 tracking-tighter">
              {stats.avgScore}
              <span className="text-xl font-bold text-slate-300 ml-1">/100</span>
            </p>
            <div className="mt-3 inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-full tracking-wider">
              {stats.avgScore > 70 ? 'Stable Condition' : stats.totalRecords === 0 ? 'No Scans Yet' : 'Attention Required'}
            </div>
          </div>
          
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="64" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
              <circle 
                cx="72" cy="72" r="64" 
                stroke={stats.avgScore > 70 ? "#3b82f6" : "#ef4444"} 
                strokeWidth="10" 
                strokeDasharray="402" 
                strokeDashoffset={402 - (stats.avgScore / 100) * 402} 
                strokeLinecap="round" 
                fill="transparent" 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <HeartPulse className={stats.avgScore > 70 ? "text-blue-500" : "text-red-500"} size={32} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="md:col-span-3 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
        >
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Scans</h3>
          <p className="text-4xl font-black text-slate-800">{String(stats.totalRecords).padStart(2, '0')}</p>
          <div className="mt-4 p-2 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">AI Engine</p>
            <p className="text-xs font-bold text-blue-900 truncate">Gemini 2.0 Flash</p>
          </div>
        </motion.div>

        {stats.emergencyCount > 0 ? (
          <motion.div 
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-3 bg-red-600 rounded-xl p-6 shadow-lg shadow-red-200 text-white flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={20} className="text-white/80" />
              <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Critical Alerts</h3>
            </div>
            <p className="text-4xl font-black">{stats.emergencyCount}</p>
            <button className="mt-4 w-full bg-white text-red-600 font-bold py-2 rounded-lg text-xs hover:bg-red-50 transition-colors uppercase tracking-widest">
              Emergency Action
            </button>
          </motion.div>
        ) : (
          <motion.div 
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-3 bg-slate-900 rounded-xl p-6 text-white flex flex-col justify-between relative overflow-hidden group"
          >
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Wellness Status</h3>
            <p className="text-3xl font-black tracking-tight leading-none">Optimal</p>
            <p className="mt-2 text-xs text-white/60">No extreme risks detected.</p>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          </motion.div>
        )}
      </div>

      {/* Live Consultation & Reports Section (Requested by USER) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {myAppointments.length > 0 && (
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-slate-900 rounded-xl p-5 text-white shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Appointment Status</h3>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {myAppointments.map((apt: any) => (
                <div key={apt.id} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 flex items-center gap-1.5">
                    <span className="text-sm shrink-0">{getSpeciesEmoji(apt.pet_species)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{apt.pet_name} · <span className="text-slate-400 font-normal">{apt.reason}</span></p>
                      {apt.rejection_reason && <p className="text-[10px] text-red-400 font-bold mt-1 bg-red-500/10 p-1 rounded">Note: {apt.rejection_reason}</p>}
                      {apt.assigned_vet_name && (
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded w-fit uppercase tracking-wider border border-blue-500/10">
                          <Stethoscope size={9} />
                          {apt.assigned_vet_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    (apt.status === 'approved' || apt.status === 'in_progress' || apt.status === 'completed') ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    apt.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  }`}>
                    {(apt.status === 'approved' || apt.status === 'in_progress' || apt.status === 'completed') ? 'Accepted' : apt.status === 'rejected' ? 'Declined' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {completedReports.length > 0 && (
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-blue-600 rounded-xl p-5 text-white shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-blue-500 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-blue-100" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Clinical Reports</h3>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {completedReports.map((rep: any) => (
                <div key={rep.id} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{rep.pet_name} Summary</p>
                    <p className="text-[10px] text-blue-100 font-medium">{rep.date}</p>
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob([`PAWSCHECK REPORT\nPatient: ${rep.pet_name}\nDate: ${rep.date}\nSummary: ${rep.summary}`], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `${rep.pet_name}_Report.txt`; a.click();
                    }}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Records List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.div 
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Patient History</h3>
          </div>
          
          <div className="space-y-2 flex-1">
            {recentRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-50">
                <Activity className="text-slate-200 mb-2" size={40} />
                <p className="text-slate-400 text-xs font-medium uppercase tracking-tighter">No analysis history yet. Run your first scan!</p>
              </div>
            ) : (
              recentRecords.map(record => (
                <div key={record.id} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 transition-all group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    record.triage_tier === 'EMERGENCY' ? 'bg-red-50 text-red-600' :
                    record.triage_tier === 'URGENT' ? 'bg-amber-50 text-amber-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    <Activity size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{record.ai_explanation?.substring(0, 60) || 'Scan Result'}...</h4>
                    <p className="text-[10px] font-mono text-slate-400 uppercase">{new Date(record.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      record.triage_tier === 'EMERGENCY' ? 'bg-red-100 text-red-700' :
                      record.triage_tier === 'URGENT' ? 'bg-amber-100 text-amber-700' :
                      record.triage_tier === 'MONITOR' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {record.triage_tier}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => onNavigateScan?.()}
          className="lg:col-span-5 bg-blue-600 rounded-xl p-8 text-white relative overflow-hidden group flex flex-col justify-between shadow-lg shadow-blue-200 cursor-pointer hover:bg-blue-700 transition-colors text-left"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[9px] font-black uppercase tracking-widest">
                Action Required
              </span>
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2 group-hover:scale-105 transition-transform origin-left">
              New Triage Scan
            </h3>
            <p className="text-blue-100 text-sm font-medium leading-tight max-w-[240px]">
              Upload pet media for instant AI validation and triage guidance.
            </p>
          </div>
          
          <div className="relative z-10 pt-4 border-t border-blue-500/50 mt-4 flex items-center justify-between">
            <span className="text-xs text-blue-100 font-bold uppercase tracking-wider">
              Click to launch scanner
            </span>
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
          
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-slate-900 rounded-full blur-3xl opacity-20 pointer-events-none" />
          <div className="absolute top-4 right-4 opacity-10 transform rotate-12 group-hover:rotate-45 transition-transform duration-700 pointer-events-none">
            <Stethoscope size={160} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
