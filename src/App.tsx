import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Upload, 
  MapPin, 
  Bell, 
  Menu, 
  X, 
  TrendingUp,
  Stethoscope,
  LogOut,
  FileText
} from 'lucide-react';
import { supabase } from './lib/supabase';

import Landing from './components/Landing';
import Auth from './components/auth/Auth';
import Dashboard from './components/dashboard/Dashboard';
import Diagnostic from './components/diagnostic/Diagnostic';
import Trends from './components/history/Trends';
import VetFinder from './components/vets/VetFinder';
import Reminders from './components/reminders/Reminders';
import PrescriptionScanner from './components/prescription/PrescriptionScanner';
import { PetProvider } from './context/PetContext';
import PetSwitcher from './components/dashboard/PetSwitcher';
import DoctorApp from './components/doctor/DoctorApp';

type Tab = 'dashboard' | 'diagnostic' | 'prescription' | 'trends' | 'vets' | 'reminders';
type Page = 'landing' | 'auth' | 'app' | 'doctor';

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [page, setPage] = useState<Page>('landing');
  const [userId, setUserId] = useState<string>(GUEST_USER_ID);
  const [userName, setUserName] = useState<string>('Guest User');
  const [initialAuthRole, setInitialAuthRole] = useState<'owner' | 'veterinarian'>('owner');

  useEffect(() => {
    // Check localStorage for persisted role and profile credentials (prototype mode)
    const savedRole = localStorage.getItem('pawscheck_role');
    const savedName = localStorage.getItem('pawscheck_user_name');
    const savedId = localStorage.getItem('pawscheck_user_id');
    if (savedName) setUserName(savedName);
    if (savedId) setUserId(savedId);

    if (savedRole === 'veterinarian') {
      setPage('doctor');
      return;
    }
    if (savedRole === 'owner') {
      setPage('app');
      return;
    }

    // Check Supabase session for authenticated users
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const rawRole = session.user.user_metadata?.role || localStorage.getItem('pawscheck_role') || 'owner';
        const role = (rawRole === 'veterinarian' ? 'veterinarian' : 'owner') as 'owner' | 'veterinarian';
        setUserId(session.user.id);
        setUserName(session.user.user_metadata?.full_name || session.user.email || 'User');
        localStorage.setItem('pawscheck_role', role);
        if (role === 'veterinarian') {
          setPage('doctor');
        } else {
          setPage('app');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const rawRole = session.user.user_metadata?.role || localStorage.getItem('pawscheck_role') || 'owner';
        const role = (rawRole === 'veterinarian' ? 'veterinarian' : 'owner') as 'owner' | 'veterinarian';
        setUserId(session.user.id);
        setUserName(session.user.user_metadata?.full_name || session.user.email || 'User');
        localStorage.setItem('pawscheck_role', role);
        if (role === 'veterinarian') {
          setPage('doctor');
        } else {
          setPage('app');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRoleSelect = (role: 'owner' | 'veterinarian') => {
    setInitialAuthRole(role);
    setPage('auth');
  };

  const handleExitDoctor = () => {
    localStorage.removeItem('pawscheck_role');
    setPage('landing');
  };

  if (page === 'landing') {
    return (
      <Landing 
        onGetStarted={(role?: 'owner' | 'veterinarian') => {
          setInitialAuthRole(role || 'owner');
          setPage('auth');
        }} 
        onSelectRole={handleRoleSelect}
      />
    );
  }

  if (page === 'auth') {
    return (
      <Auth 
        initialRole={initialAuthRole}
        onBack={() => setPage('landing')} 
        onGuest={(selectedRole) => {
          const savedName = localStorage.getItem('pawscheck_user_name') || (selectedRole === 'veterinarian' ? 'Dr. Sarah Jenkins' : 'Demo Customer');
          const savedId = localStorage.getItem('pawscheck_user_id') || GUEST_USER_ID;
          setUserId(savedId);
          setUserName(savedName);
          localStorage.setItem('pawscheck_role', selectedRole);
          if (selectedRole === 'veterinarian') {
            setPage('doctor');
          } else {
            setPage('app');
          }
        }}
      />
    );
  }

  // Doctor Portal
  if (page === 'doctor') {
    return <DoctorApp onExit={handleExitDoctor} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'diagnostic', label: 'Triage Scan', icon: Upload },
    { id: 'prescription', label: 'Meds Scanner', icon: FileText },
    { id: 'trends', label: 'Health Trends', icon: TrendingUp },
    { id: 'vets', label: 'Nearby Vets', icon: MapPin },
    { id: 'reminders', label: 'Care Plan', icon: Bell },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('pawscheck_role');
    setUserId(GUEST_USER_ID);
    setUserName('Guest User');
    setPage('landing');
  };

  return (
    <PetProvider userId={userId}>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden h-screen">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Stethoscope size={18} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-blue-600">Paws-Check</h1>
          <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">B2B Clinical Engine</span>
        </div>
        
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <div className="hidden lg:flex items-center gap-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`transition-colors hover:text-blue-600 relative py-4 whitespace-nowrap ${
                  activeTab === item.id ? 'text-blue-600' : ''
                }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            ))}
          </div>
          
          <div className="hidden md:block w-px h-6 bg-slate-200"></div>
          
          <div className="flex items-center gap-3">
            <PetSwitcher />
            <div className="text-right hidden sm:block ml-2">
              <p className="text-xs font-bold leading-none">{userName}</p>
              <button 
                onClick={handleSignOut} 
                className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-tighter flex items-center gap-1"
              >
                <LogOut size={10} /> Exit
              </button>
            </div>
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=ffffff`} 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <button className="lg:hidden" onClick={() => setSidebarOpen(!isSidebarOpen)}><Menu size={20}/></button>
          </div>
        </nav>
      </header>

      <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="lg:hidden absolute inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30 p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-blue-600">Clinical Suite</span>
                <button onClick={() => setSidebarOpen(false)}><X size={20}/></button>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as Tab); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold ${
                      activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
          <div className="w-full max-w-[1280px] flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === 'dashboard' && <Dashboard onNavigateScan={() => setActiveTab('diagnostic')} />}
                {activeTab === 'diagnostic' && <Diagnostic />}
                {activeTab === 'prescription' && <PrescriptionScanner />}
                {activeTab === 'trends' && <Trends />}
                {activeTab === 'vets' && <VetFinder />}
                {activeTab === 'reminders' && <Reminders />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="h-10 bg-slate-100 border-t border-slate-200 flex items-center justify-center px-6 shrink-0">
        <p className="text-[10px] text-slate-400 italic text-center leading-tight">
          ⚠️ CLINICAL DISCLAIMER: Paws-Check B2B Engine is a triage assistant. It provides professional insights but is NOT a replacement for direct clinical examination.
        </p>
      </footer>
    </div>
    </PetProvider>
  );
}
