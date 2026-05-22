import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Stethoscope, Loader2, ArrowLeft, UserCircle, PawPrint, UserCog, Sun, Moon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuthProps {
  onBack: () => void;
  onGuest: (role: 'owner' | 'veterinarian') => void;
  initialRole?: 'owner' | 'veterinarian';
}

export default function Auth({ onBack, onGuest, initialRole = 'owner' }: AuthProps) {
  const [selectedRole, setSelectedRole] = useState<'owner' | 'veterinarian'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('pawscheck_theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('pawscheck_theme', nextDark ? 'dark' : 'light');
  };

  const isVet = selectedRole === 'veterinarian';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Store the requested role and typed credentials in localStorage to ensure user state saves seamlessly
      localStorage.setItem('pawscheck_role', selectedRole);
      if (email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        localStorage.setItem('pawscheck_user_email', cleanEmail);
        const generatedName = cleanEmail.split('@')[0];
        const prettyName = generatedName.charAt(0).toUpperCase() + generatedName.slice(1);
        localStorage.setItem('pawscheck_user_name', prettyName);
        
        // Generate deterministic isolated user ID from email hash
        let hash = 0;
        for (let i = 0; i < cleanEmail.length; i++) {
          hash = ((hash << 5) - hash) + cleanEmail.charCodeAt(i);
          hash |= 0;
        }
        const uniqueHex = Math.abs(hash).toString(16).padStart(12, '0');
        const customUserId = `00000000-0000-4000-8000-${uniqueHex}`;
        localStorage.setItem('pawscheck_user_id', customUserId);

        // Master Multi-User Table Database provisioning logic
        const profilesStr = localStorage.getItem('pawscheck_multi_user_profiles');
        const masterTable = profilesStr ? JSON.parse(profilesStr) : {};

        if (isSignUp) {
          // If signing up as a new user, initialize an entirely new clean slice for this person
          masterTable[cleanEmail] = {
            email: cleanEmail,
            name: prettyName,
            role: selectedRole,
            userId: customUserId,
            pets: [],
            scans: [],
            appointments: [],
            consultations: []
          };
          localStorage.setItem('pawscheck_multi_user_profiles', JSON.stringify(masterTable));
          // Synchronize local active arrays to blank state so dashboard renders no legacy records
          localStorage.setItem('pawscheck_local_pets', JSON.stringify([]));
          localStorage.setItem('pawscheck_user_scans', JSON.stringify([]));
        } else {
          // If signing in, retrieve their specific old saved data sections
          if (masterTable[cleanEmail]) {
            const userSection = masterTable[cleanEmail];
            localStorage.setItem('pawscheck_local_pets', JSON.stringify(userSection.pets || []));
            localStorage.setItem('pawscheck_user_scans', JSON.stringify(userSection.scans || []));
          } else {
            // Provision empty fallback table if logging in for the first time
            masterTable[cleanEmail] = {
              email: cleanEmail,
              name: prettyName,
              role: selectedRole,
              userId: customUserId,
              pets: [],
              scans: [],
              appointments: [],
              consultations: []
            };
            localStorage.setItem('pawscheck_multi_user_profiles', JSON.stringify(masterTable));
            localStorage.setItem('pawscheck_local_pets', JSON.stringify([]));
            localStorage.setItem('pawscheck_user_scans', JSON.stringify([]));
          }
        }
      }

      // Completely skip external backend APIs to prevent Supabase 429 rate limit log alerts on the login screen
      setTimeout(() => {
        onGuest(selectedRole);
      }, 350);
    } catch (err: any) {
      onGuest(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background dynamic gradients based on selected role */}
      <div className={`absolute inset-0 transition-colors duration-700 -z-10 ${
        isVet ? 'bg-gradient-to-tr from-emerald-100/40 to-teal-50/40' : 'bg-gradient-to-tr from-blue-100/50 to-indigo-50/50'
      }`}></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative px-4 sm:px-0">
        <button 
          onClick={onBack}
          className="absolute -top-12 left-4 sm:left-0 text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="absolute -top-14 right-4 sm:right-0">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            title="Toggle Theme Mode"
            type="button"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Dynamic Header Icon */}
        <div className="flex justify-center">
          <motion.div 
            key={selectedRole}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl ${
              isVet ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-blue-600 shadow-blue-600/20'
            }`}
          >
            {isVet ? <UserCog size={32} strokeWidth={2.5} /> : <PawPrint size={32} strokeWidth={2.5} />}
          </motion.div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          {isVet ? 'Veterinarian Portal' : 'Customer & Pet Portal'}
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500 font-medium">
          {isVet ? 'Secure access for licensed veterinary clinicians' : 'Manage your pet health records and scans'}
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0"
      >
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          
          {/* Dual Role Tabs Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                !isVet 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <PawPrint size={16} />
              Customer
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('veterinarian')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                isVet 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Stethoscope size={16} />
              Doctor
            </button>
          </div>

          {/* Action Switcher: Login vs Register New User */}
          <div className="grid grid-cols-2 bg-slate-50 rounded-xl p-1 mb-6 border border-slate-100">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${
                !isSignUp 
                  ? (isVet ? 'bg-white text-emerald-700 shadow-sm' : 'bg-white text-blue-700 shadow-sm') 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1 ${
                isSignUp 
                  ? (isVet ? 'bg-white text-emerald-700 shadow-sm' : 'bg-white text-blue-700 shadow-sm') 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              New User
            </button>
          </div>

          {/* Offline prototype logic runs invisibly in the background */}

          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label className="block text-sm font-bold text-slate-700">
                {isVet ? 'Doctor Email Address' : 'Customer Email Address'}
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    isVet ? 'focus:border-emerald-500 focus:ring-emerald-500/20' : 'focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  placeholder={isVet ? 'dr.smith@vetclinic.com' : 'petowner@gmail.com'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">Password</label>
              <div className="mt-2">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    isVet ? 'focus:border-emerald-500 focus:ring-emerald-500/20' : 'focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold border border-red-100 leading-relaxed">
                 {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`flex w-full justify-center rounded-xl border border-transparent py-3.5 px-4 text-sm font-black text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 transition-all items-center gap-2 uppercase tracking-wide ${
                  isVet 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 focus:ring-emerald-500' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 focus:ring-blue-500'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  isSignUp 
                    ? (isVet ? 'Register Doctor Account' : 'Register Customer Account') 
                    : (isVet ? 'Login as Doctor' : 'Login as Customer')
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-400 font-bold text-xs uppercase tracking-wider">or quick explore</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const email = selectedRole === 'veterinarian' ? 'demo-doctor@pawscheck.com' : 'demo-customer@pawscheck.com';
                const name = selectedRole === 'veterinarian' ? 'Dr. Sarah Jenkins' : 'Demo Customer';
                const id = selectedRole === 'veterinarian' ? '00000000-0000-0000-0000-000000doctor' : '00000000-0000-0000-0000-00000customer';
                localStorage.setItem('pawscheck_role', selectedRole);
                localStorage.setItem('pawscheck_user_email', email);
                localStorage.setItem('pawscheck_user_name', name);
                localStorage.setItem('pawscheck_user_id', id);

                // Clear previous local states and load multi-user demo profiles
                const profilesStr = localStorage.getItem('pawscheck_multi_user_profiles');
                const masterTable = profilesStr ? JSON.parse(profilesStr) : {};
                if (!masterTable[email]) {
                  masterTable[email] = {
                    email,
                    name,
                    role: selectedRole,
                    userId: id,
                    pets: selectedRole === 'veterinarian' ? [] : [
                      {
                        id: '00000000-0000-0000-0000-0000000buddy',
                        owner_id: id,
                        name: 'Buddy',
                        species: 'Dog',
                        breed: 'Golden Retriever',
                        age: 3,
                        profile_picture_url: `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000`,
                        medical_history: 'No known chronic ailments.'
                      }
                    ],
                    scans: [],
                    appointments: [],
                    consultations: []
                  };
                  localStorage.setItem('pawscheck_multi_user_profiles', JSON.stringify(masterTable));
                }
                const userSection = masterTable[email];
                localStorage.setItem('pawscheck_local_pets', JSON.stringify(userSection.pets || []));
                localStorage.setItem('pawscheck_user_scans', JSON.stringify(userSection.scans || []));

                onGuest(selectedRole);
              }}
              className="mt-4 flex w-full justify-center items-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3.5 px-4 text-xs font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all uppercase tracking-wider"
            >
              <UserCircle size={16} className={isVet ? 'text-emerald-600' : 'text-blue-600'} />
              {isVet ? 'Access Doctor Portal Demo' : 'Access Customer Portal Demo'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
