import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Stethoscope, ShieldCheck, Zap, Heart, ArrowRight, PawPrint, UserCog, Sun, Moon } from 'lucide-react';

interface LandingProps {
  onGetStarted: (role?: 'owner' | 'veterinarian') => void;
  onSelectRole?: (role: 'owner' | 'veterinarian') => void;
}

export default function Landing({ onGetStarted, onSelectRole }: LandingProps) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('pawscheck_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('pawscheck_theme', nextDark ? 'dark' : 'light');
  };

  const handleRoleSelect = (role: 'owner' | 'veterinarian') => {
    if (onSelectRole) {
      onSelectRole(role);
    } else {
      onGetStarted(role);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Stethoscope size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-600">Paws-Check</span>
          </div>
          
          {/* Explicit separate login options for customer and doctor */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1 flex items-center justify-center border border-slate-200 dark:border-slate-800"
              title="Toggle Theme Mode"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={() => onGetStarted('owner')}
              className="bg-blue-50 text-blue-600 border border-blue-200 px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-blue-100 transition-all shadow-sm flex items-center gap-1.5"
            >
              <PawPrint size={14} />
              Login as Customer
            </button>
            <button
              onClick={() => onGetStarted('veterinarian')}
              className="bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Stethoscope size={14} />
              Login as Doctor
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100">
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              Powered by Google Gemini 2.0
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tighter">
              Instant AI Disease <br/> Prediction for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Your Pets</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
              Don't wait and wonder. Upload a photo and describe the symptoms. Our advanced AI triage engine provides immediate clinical insights and risk scoring to help you make informed decisions before visiting the vet.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => onGetStarted('owner')}
                className="bg-blue-600 text-white px-8 py-4 rounded-full font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 transform hover:-translate-y-1"
              >
                Start Free Diagnosis <ArrowRight size={20} />
              </button>
              <div className="flex items-center gap-2 px-6 py-4 text-slate-600 font-bold">
                <ShieldCheck className="text-emerald-500" />
                Trusted by 500+ Clinics
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full blur-3xl opacity-70 transform translate-y-10"></div>
            <div className="relative rounded-3xl overflow-hidden border-[8px] border-white shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img 
                src="/hero-pets.png" 
                alt="Cute Golden Retriever puppy and Fluffy Kitten" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Heart size={20} className="fill-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Status</p>
                    <p className="text-sm font-black text-slate-800">Healthy & Happy</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600">98%</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role Selector Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Choose Your Portal</h2>
            <p className="text-slate-500 mt-3">Select how you'd like to use Paws-Check today</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pet Owner Card */}
            <motion.button
              onClick={() => handleRoleSelect('owner')}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-blue-400 transition-all shadow-lg hover:shadow-2xl hover:shadow-blue-100/50 text-left cursor-pointer"
            >
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20">
                <PawPrint size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">I'm a Pet Owner</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Scan your pet's symptoms with AI, track health trends, manage medications, and book appointments with verified vets.
              </p>
              <div className="flex flex-wrap gap-2">
                {['AI Triage', 'Health Tracking', 'Book Appointments', 'Med Reminders'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">{tag}</span>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:gap-3 transition-all">
                Enter Owner Portal <ArrowRight size={16} />
              </div>
            </motion.button>

            {/* Veterinarian Card */}
            <motion.button
              onClick={() => handleRoleSelect('veterinarian')}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-slate-900 rounded-3xl p-8 border-2 border-slate-700 hover:border-emerald-400 transition-all shadow-lg hover:shadow-2xl hover:shadow-emerald-900/30 text-left cursor-pointer"
            >
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/20">
                <UserCog size={32} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">I'm a Veterinarian</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Manage your patient queue, review AI-assisted triage reports, write SOAP notes, and prescribe medications seamlessly.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Patient Queue', 'SOAP Notes', 'Prescriptions', 'Appointments'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full">{tag}</span>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 text-emerald-400 font-bold text-sm group-hover:gap-3 transition-all">
                Enter Doctor Portal <ArrowRight size={16} />
              </div>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">B2B Clinical Precision</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">Bridging the gap between concerned pet owners and busy veterinary professionals through intelligent data collection.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Visual Diagnostics", icon: "📷", desc: "Upload images of affected areas. Our vision model detects anomalies, skin conditions, and physical injuries instantly." },
              { title: "Risk Scoring", icon: "🎯", desc: "Dynamic algorithms calculate triage urgency (Monitor, Urgent, Emergency) based on breed, age, and symptoms." },
              { title: "Automated Care Plans", icon: "📋", desc: "Automatically generate B2B PDF reports to hand directly to your Doctor, saving 15 minutes of consultation time." }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
