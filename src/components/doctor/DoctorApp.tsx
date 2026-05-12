import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, Clock, CalendarCheck, FileText, Pill,
  LogOut, Menu, X, Stethoscope, Bell, ChevronDown, ToggleLeft, ToggleRight,
  CheckCircle2
} from 'lucide-react';
import { DoctorProvider, useDoctor } from '../../context/DoctorContext';
import DoctorDashboard from './DoctorDashboard';
import PatientRegistry from './PatientRegistry';
import PatientQueue from './PatientQueue';
import AppointmentManager from './AppointmentManager';
import ConsultationWorkspace from './ConsultationWorkspace';
import PrescriptionBuilder from './PrescriptionBuilder';

type DoctorTab = 'dashboard' | 'patients' | 'queue' | 'appointments' | 'consultation' | 'prescriptions';

interface DoctorAppProps {
  onExit: () => void;
}

function DoctorAppInner({ onExit }: DoctorAppProps) {
  const [activeTab, setActiveTab] = useState<DoctorTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { vetProfile, pendingRequests, stats } = useDoctor();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'queue', label: 'Patient Queue', icon: Clock, badge: stats.todayPatients },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck, badge: pendingRequests.length },
    { id: 'consultation', label: 'Consultation', icon: FileText },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  ];

  return (
    <div className="min-h-screen h-screen bg-slate-950 flex overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
            <Stethoscope size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Paws-Check</h1>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Doctor Portal</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as DoctorTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-emerald-500/10 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                  activeTab === item.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Doctor Profile Card */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <img
                src={`https://ui-avatars.com/api/?name=Dr+Sharma&background=10b981&color=ffffff&bold=true`}
                className="w-10 h-10 rounded-full border-2 border-emerald-500/30"
                alt="Doctor"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Dr. Sharma</p>
                <p className="text-[10px] text-slate-400 truncate">{vetProfile?.clinic_name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Available</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] text-emerald-400 font-bold">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onExit}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all"
          >
            <LogOut size={14} /> Exit Doctor Portal
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-slate-900 z-50 flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                    <Stethoscope size={18} />
                  </div>
                  <span className="font-bold text-white">Doctor Portal</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 py-4 px-3 space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as DoctorTab); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                      activeTab === item.id
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white capitalize">{activeTab === 'consultation' ? 'Consultation Workspace' : activeTab}</h2>
              <p className="text-[10px] text-slate-500 font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Clickable Notification Bell */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-xl transition-colors ${
                showNotifications ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bell size={20} />
              {pendingRequests.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            {/* Notification Center Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications Center</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      {pendingRequests.length} Live
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/50">
                    {pendingRequests.length === 0 ? (
                      <div className="p-8 text-center text-slate-600">
                        <CheckCircle2 size={24} className="mx-auto mb-2 text-slate-700" />
                        <p className="text-xs font-bold uppercase tracking-wider">All caught up!</p>
                        <p className="text-[10px] text-slate-600 mt-1">No incoming consultation requests.</p>
                      </div>
                    ) : (
                      pendingRequests.map(req => (
                        <div 
                          key={req.id} 
                          onClick={() => {
                            setActiveTab('appointments');
                            setShowNotifications(false);
                          }}
                          className="p-3 hover:bg-slate-800/50 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">{req.pet_name}</span>
                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 rounded uppercase">Pending</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">Owner: {req.owner_name}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5 italic">"{req.reason}"</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-800 bg-slate-950/40">
                    <button
                      onClick={() => {
                        setActiveTab('appointments');
                        setShowNotifications(false);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      View Appointment Requests
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Profile */}
            <div className="lg:hidden flex items-center gap-2">
              <img
                src={`https://ui-avatars.com/api/?name=Dr+Sharma&background=10b981&color=ffffff&bold=true`}
                className="w-8 h-8 rounded-full"
                alt="Doctor"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <DoctorDashboard onNavigate={(tab: string) => setActiveTab(tab as DoctorTab)} />}
              {activeTab === 'patients' && <PatientRegistry />}
              {activeTab === 'queue' && <PatientQueue onStartConsultation={() => setActiveTab('consultation')} />}
              {activeTab === 'appointments' && <AppointmentManager />}
              {activeTab === 'consultation' && <ConsultationWorkspace />}
              {activeTab === 'prescriptions' && <PrescriptionBuilder />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function DoctorApp({ onExit }: DoctorAppProps) {
  return (
    <DoctorProvider>
      <DoctorAppInner onExit={onExit} />
    </DoctorProvider>
  );
}
