import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, FileText, MessageSquare, Stethoscope, ArrowLeft, HelpCircle, Activity, Calendar } from 'lucide-react';
import { usePet } from '../../context/PetContext';

interface ScanResultsProps {
  logId: string;
  uploadedImage?: string;
  prefetchedReport?: any;   // Real Gemini result passed directly from Diagnostic.tsx
  onClose: () => void;
}

export default function ScanResults({ logId, uploadedImage, prefetchedReport, onClose }: ScanResultsProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { activePet } = usePet();

  useEffect(() => {
    const resolvedName = activePet?.name || 'Your Pet';
    const resolvedBreed = activePet?.breed || 'Mixed Breed';
    const resolvedAge = activePet?.age || 2;

    const commitReport = (repObj: any) => {
      const enriched = {
        ...repObj,
        pets: { name: resolvedName, breed: resolvedBreed, age: resolvedAge },
        image_urls: uploadedImage ? [uploadedImage] : repObj.image_urls || []
      };
      setReport(enriched);
      // Persist to user-scoped scan history
      try {
        const activeUser = localStorage.getItem('pawscheck_user_email') || 'anonymous';
        const rec = {
          id: enriched.id || `scan-${Date.now()}`,
          user_email: activeUser,
          pet_id: activePet?.id || 'demo-pet',
          risk_score: enriched.risk_score || 0,
          triage_tier: enriched.triage_tier || 'MONITOR',
          ai_explanation: enriched.disease_name
            ? `${enriched.disease_name}: ${enriched.ai_explanation || ''}`
            : enriched.ai_explanation || '',
          created_at: new Date().toISOString()
        };
        const existing = localStorage.getItem('pawscheck_user_scans');
        const arr = existing ? JSON.parse(existing) : [];
        if (!arr.find((a: any) => a.id === rec.id)) {
          localStorage.setItem('pawscheck_user_scans', JSON.stringify([rec, ...arr]));
        }
      } catch (e) {}
      setLoading(false);
    };

    if (prefetchedReport) {
      // Real Gemini result — use immediately, no delay
      commitReport(prefetchedReport);
    }
  }, [logId, prefetchedReport, activePet, uploadedImage]);

  const [bookingStatus, setBookingStatus] = useState<'idle' | 'success'>('idle');
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [bookingTime, setBookingTime] = useState('10:00');

  const handleBookAppointment = () => {
    if (!report) return;
    const activeEmail = localStorage.getItem('pawscheck_user_email') || 'anonymous';
    const userName = localStorage.getItem('pawscheck_user_name') || 'Pet Owner';
    const userId = localStorage.getItem('pawscheck_user_id') || 'guest';

    let selectedDateTime = new Date().toISOString();
    try {
      if (bookingDate && bookingTime) {
        selectedDateTime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      }
    } catch (e) {
      console.warn("Date parsing failed, using now", e);
    }

    const newAppointment = {
      id: `app-scan-${Date.now()}`,
      pet_id: activePet?.id || `pet-${Date.now()}`,
      owner_id: userId,
      owner_email: activeEmail,
      vet_id: 'vet-active',
      appointment_date: selectedDateTime,
      duration_minutes: 30,
      status: 'pending',
      type: 'scheduled',
      reason: `Post-Scan Consultation: ${report.disease_name}\n\n[📎 Attached Visual AI Diagnostic Report — Scan ID: PH-${logId.substring(0, 8).toUpperCase()}]`,
      urgency_level: report.triage_tier?.toLowerCase() === 'emergency' ? 'emergency' : report.triage_tier?.toLowerCase() === 'urgent' ? 'urgent' : 'normal',
      pet_name: report.pets?.name || 'My Pet',
      owner_name: userName,
      pet_breed: report.pets?.breed || 'Unknown'
    };

    try {
      const existing = localStorage.getItem('pawscheck_custom_appointments');
      const parsedArray = existing ? JSON.parse(existing) : [];
      localStorage.setItem('pawscheck_custom_appointments', JSON.stringify([newAppointment, ...parsedArray]));
      setBookingStatus('success');
      setTimeout(() => setBookingStatus('idle'), 3000);
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />

        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Compiling Clinical Data...</p>
      </div>
    );
  }

  if (!report) return null;

  const displayPic = uploadedImage || report.image_urls?.[0] || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000';

  return (
    <div className="space-y-6">
      <button 
        onClick={onClose}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-widest transition-colors mb-4 print:hidden"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0"
      >
        {/* Premium Disease Heading Banner */}
        <div className="bg-slate-900 text-white p-8 border-b border-slate-800 print:bg-white print:text-black print:border-b-2 print:border-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 print:hidden">
                  Suspected Condition
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white print:text-black">
                {report.disease_name || 'Dermatological Inflammatory Response'}
              </h1>
            </div>
            <div className="text-left md:text-right shrink-0">
              <p className="text-[10px] font-black uppercase text-slate-500">Case ID</p>
              <p className="text-xs font-mono font-bold text-slate-300 print:text-slate-800">#PH-{logId.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Tier, Risk Score & Real Pet Identity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Triage Tier</p>
              <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest ${
                report.triage_tier === 'EMERGENCY' ? 'bg-red-600 text-white shadow-lg shadow-red-200' :
                report.triage_tier === 'URGENT' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                'bg-green-500 text-white shadow-lg shadow-green-200'
              }`}>
                {report.triage_tier}
              </span>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Base Risk Score</p>
              <p className={`text-4xl font-black tracking-tighter ${
                report.risk_score >= 70 ? 'text-red-600' : 'text-slate-800'
              }`}>{report.risk_score}<span className="text-xl text-slate-300">/100</span></p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient</p>
              <p className="text-xl font-black tracking-tight text-blue-600">{report.pets?.name || 'Your Pet'}</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{report.pets?.breed || 'Canine'} • {report.pets?.age || 2} yrs</p>
            </div>
          </div>

          {/* Core Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Section: Clinical Presentation & Diagnostic Reasoning */}
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Activity size={14} className="text-blue-600" />
                  Occurrence Rate & Epidemiology
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">
                    {report.occurrence_rate || 'Frequently diagnosed in outpatient veterinary practices.'}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle size={14} className="text-indigo-600" />
                  Diagnostic Reasoning
                </h3>
                <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                  <p className="text-xs font-bold text-indigo-950 leading-relaxed">
                    {report.clinical_reasons || report.ai_explanation}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Detected Symptoms</h3>
                <div className="flex flex-wrap gap-2">
                  {report.detected_symptoms?.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Section: Causes & Action Plan */}
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <HelpCircle size={14} className="text-amber-600" />
                  Probable Triggers / Underlying Causes
                </h3>
                <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-2">
                  {report.probable_causes?.map((cause: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-1 h-1 rounded-full bg-amber-600 mt-2 shrink-0" />
                      <p className="text-xs font-bold text-amber-950">{cause}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Stethoscope size={14} className="text-red-600" />
                  Critical Level Factors
                </h3>
                <div className="space-y-2">
                  {report.critical_level_factors?.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <p className="text-xs font-bold text-red-900">{f}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Recommended Vet Action</h3>
                <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-xl">
                  <p className="text-xs font-bold leading-relaxed">
                    {report.triage_tier === 'EMERGENCY' ? 'IMMEDIATE INTERVENTION REQUIRED: ' : ''}
                    {report.vet_action_required || report.recommendation}
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* Evidence Image explicitly rendering user's upload */}
          {displayPic && (
            <section className="print:break-inside-avoid pt-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Uploaded Visual Evidence</h3>
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-[350px]">
                <img src={displayPic} alt="Triage Evidence Upload" className="max-h-[350px] w-auto object-contain rounded-lg shadow-inner" />
              </div>
            </section>
          )}

          {/* Custom Date / Time selection */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-3 print:hidden mb-6 text-left">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-blue-600" />
              Schedule Online Consultation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Date</label>
                <input 
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 bg-white text-sm font-bold text-slate-800 outline-none"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Time</label>
                <input 
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 bg-white text-sm font-bold text-slate-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons (Hidden in Print) */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 print:hidden">
            <button 
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              <FileText size={18} />
              Download Clinical PDF
            </button>
            <button 
              onClick={handleBookAppointment}
              disabled={bookingStatus === 'success'}
              className={`flex-1 font-black py-4 rounded-xl text-xs transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest ${
                bookingStatus === 'success' 
                  ? 'bg-green-500 text-white shadow-green-100' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-100'
              }`}
            >
              {bookingStatus === 'success' ? (
                <>✓ Request Sent</>
              ) : (
                <>
                  <Calendar size={18} className="text-blue-400" />
                  Book Professional Consultation
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-black py-4 rounded-xl text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              Close Report
            </button>
          </div>
        </div>
        
        {/* Print Footer */}
        <div className="hidden print:block p-8 pt-0 text-[10px] text-slate-400 text-center font-bold italic">
          Disclaimer: This AI-generated clinical triage report is for professional reference only. 
          Case ID: #PH-{logId.substring(0, 8).toUpperCase()} | Date: {new Date().toLocaleString()}
        </div>
      </motion.div>
    </div>
  );
}
