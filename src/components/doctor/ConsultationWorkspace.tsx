import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, Heart, Thermometer, Activity, Wind, Scale, FileText, Save,
  CalendarPlus, AlertTriangle, ChevronDown, ChevronUp, Eye, Clock,
  Stethoscope, PawPrint, Pill, Download, Send
} from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext';

interface ConsultationData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  weight: string;
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  bodyConditionScore: number;
  followUpDate: string;
  needsFollowUp: boolean;
}

// Demo patient data (would come from queue/appointment in production)
const DEMO_PATIENT = {
  pet: { name: 'Bruno', breed: 'Golden Retriever', species: 'Dog', age: 3, weight: '32 kg' },
  owner: { name: 'Priya Sharma', phone: '+91 98765 43210' },
  history: [
    { date: '2026-05-01', condition: 'Ear Infection', vet: 'Dr. Sharma', tier: 'URGENT' },
    { date: '2026-04-15', condition: 'Annual Vaccination', vet: 'Dr. Sharma', tier: 'HEALTHY' },
    { date: '2026-03-20', condition: 'Mild Dermatitis', vet: 'Dr. Patel', tier: 'MONITOR' },
  ],
  activeMeds: [
    { name: 'Cephalexin 500mg', prescribedBy: 'Dr. Patel', frequency: 'Twice daily', endsAt: '2026-05-15' },
  ],
  triageData: {
    riskScore: 72,
    tier: 'URGENT',
    symptoms: ['Red patches on belly', 'Excessive scratching', 'Hair loss in patches'],
    aiExplanation: 'The image shows localized erythema with alopecia consistent with allergic dermatitis. The distribution pattern on the ventral abdomen suggests contact allergen or atopic dermatitis. Given the breed (Golden Retriever) and age, atopic dermatitis is the most likely differential. Recommend cytology to rule out secondary bacterial/yeast infection.',
    imageUrl: null,
    breedAlerts: [
      { alert: 'Golden Retrievers have 3x higher predisposition to atopic dermatitis', severity: 'high' },
      { alert: 'Monitor for hypothyroidism — common in breed, can cause skin issues', severity: 'medium' },
    ],
  },
};

export default function ConsultationWorkspace() {
  const { appointments } = useDoctor();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('default');

  const activeCustomApt = appointments.find(a => a.id === selectedPatientId);

  const [formData, setFormData] = useState<ConsultationData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    weight: '32',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    bodyConditionScore: 5,
    followUpDate: '',
    needsFollowUp: false,
  });
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [triageExpanded, setTriageExpanded] = useState(true);
  const [saved, setSaved] = useState(false);
  const [transmitted, setTransmitted] = useState(false);

  useEffect(() => {
    if (activeCustomApt) {
      setFormData(prev => ({
        ...prev,
        weight: activeCustomApt.pet_weight ? String(activeCustomApt.pet_weight) : '32'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        weight: '32'
      }));
    }
  }, [selectedPatientId]);

  const pet = activeCustomApt ? {
    name: activeCustomApt.pet_name || 'My Pet',
    breed: activeCustomApt.pet_breed || 'Unknown',
    species: activeCustomApt.pet_species || 'Dog',
    age: activeCustomApt.pet_age !== undefined ? activeCustomApt.pet_age : 3,
    weight: activeCustomApt.pet_weight ? `${activeCustomApt.pet_weight} kg` : '32 kg',
    previous_medications: activeCustomApt.previous_medications || ''
  } : {
    ...DEMO_PATIENT.pet,
    previous_medications: 'None'
  };

  const owner = activeCustomApt ? {
    name: activeCustomApt.owner_name || 'Pet Owner',
    phone: '+91 98765 43210'
  } : DEMO_PATIENT.owner;

  const { history, activeMeds, triageData } = DEMO_PATIENT;

  const handleAutoFillSOAP = () => {
    const customReason = activeCustomApt?.reason || "excessive scratching and localized erythema";
    const attachedNote = activeCustomApt?.reason.includes('Scan') ? " [Visual AI Scan attached by owner]" : "";
    setFormData(prev => ({
      ...prev,
      subjective: `Owner reports: "${customReason}"${attachedNote}. No severe appetite drops noted. Activity levels variable.`,
      objective: `AI Triage validation assessment flagged condition. Visual examination reflects localized inflammation patterns. Vitals remain stable.`,
      assessment: `Primary impression: Allergic or contact dermatitis. Rule out secondary secondary pyoderma or parasitic vectors. Standard breed predispositions accounted for.`,
      plan: `1. Gentle topical antiseptic cleanses twice daily. 2. Prescribed standard relief course. 3. Monitor skin status closely over 7 days. 4. Escalate if lethargy manifests.`,
    }));
  };

  const handleSave = () => {
    setSaved(true);
    // Automatically archive record into persistent eco-storage
    try {
      const record = {
        id: `consult-${Date.now()}`,
        pet_name: pet.name,
        date: new Date().toLocaleDateString(),
        summary: formData.plan || formData.assessment || 'Routine clinical summary checkup completed.',
        status: 'Completed'
      };
      const existing = localStorage.getItem('pawscheck_completed_consultations');
      const arr = existing ? JSON.parse(existing) : [];
      localStorage.setItem('pawscheck_completed_consultations', JSON.stringify([record, ...arr]));
    } catch(e){}
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTransmit = () => {
    setTransmitted(true);
    try {
      const record = {
        id: `consult-${Date.now()}`,
        pet_name: pet.name,
        date: new Date().toLocaleDateString(),
        summary: `SOAP Clinical Summary & Guidance:\nAssessment: ${formData.assessment}\nPrescribed Plan: ${formData.plan}`,
        status: 'Completed'
      };
      const existing = localStorage.getItem('pawscheck_completed_consultations');
      const arr = existing ? JSON.parse(existing) : [];
      localStorage.setItem('pawscheck_completed_consultations', JSON.stringify([record, ...arr]));
    } catch(e){}
    setTimeout(() => setTransmitted(false), 2500);
  };

  const handleDownload = () => {
    const content = `PAWSCHECK CLINICAL CONSULTATION RECORD\nPatient: ${pet.name} (${pet.breed})\nOwner: ${owner.name}\nDate: ${new Date().toLocaleString()}\n\nSUBJECTIVE:\n${formData.subjective}\n\nOBJECTIVE:\n${formData.objective}\n\nASSESSMENT:\n${formData.assessment}\n\nPLAN / PRESCRIPTION:\n${formData.plan}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pet.name.replace(/\s+/g, '_')}_Consultation_Summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const tierColor = {
    HEALTHY: 'text-emerald-400 bg-emerald-500/10',
    MONITOR: 'text-amber-400 bg-amber-500/10',
    URGENT: 'text-orange-400 bg-orange-500/10',
    EMERGENCY: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-hidden">
      {/* Patient Target Switcher Top Bar */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <PawPrint size={18} className="text-emerald-400" />
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Consultation Target Subject</label>
            <span className="text-xs font-black text-white">Select Case from Custom Appointments Queue</span>
          </div>
        </div>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 max-w-md w-full sm:w-auto"
        >
          <option value="default">⭐ Default Case: Bruno (Golden Retriever) — Allergic Dermatitis</option>
          {appointments.map(apt => (
            <option key={apt.id} value={apt.id}>
              🐾 {apt.pet_name} ({apt.owner_name}) — {apt.urgency_level.toUpperCase()}: {apt.reason.substring(0, 45)}...
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* LEFT PANEL — Patient Info */}
      <div className="lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3 overflow-y-auto">
        {/* Patient Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
              <PawPrint size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{pet.name}</h3>
              <p className="text-xs text-slate-500">{pet.breed} · {pet.species} · {pet.age}y</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/50 rounded-lg p-2.5">
              <p className="text-slate-500 text-[10px] mb-0.5">Owner</p>
              <p className="text-slate-300 font-medium">{owner.name}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2.5">
              <p className="text-slate-500 text-[10px] mb-0.5">Weight</p>
              <p className="text-slate-300 font-medium">{pet.weight}</p>
            </div>
          </div>
        </div>

        {/* Active Medications (from ALL vets) */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Pill size={14} className="text-blue-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Medications</h4>
          </div>
          {activeMeds.length === 0 ? (
            <p className="text-xs text-slate-600">No active medications</p>
          ) : (
            activeMeds.map((med, i) => (
              <div key={i} className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 mb-2 last:mb-0">
                <p className="text-sm font-bold text-blue-400">{med.name}</p>
                <p className="text-[10px] text-slate-500 mt-1">{med.frequency} · Until {med.endsAt}</p>
                <p className="text-[10px] text-slate-600">Prescribed by <span className="text-slate-400">{med.prescribedBy}</span></p>
              </div>
            ))
          )}
          <div className="border-t border-slate-800 mt-4 pt-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Previous / Owner-Reported Meds</p>
            <p className="text-xs text-slate-300 font-medium">
              {pet.previous_medications || 'None recorded'}
            </p>
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Visit History</h4>
            </div>
            {historyExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>
          {historyExpanded && (
            <div className="px-4 pb-4 space-y-2">
              {history.map((visit, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 truncate">{visit.condition}</p>
                    <p className="text-[10px] text-slate-600">{visit.date} · {visit.vet}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tierColor[visit.tier as keyof typeof tierColor]}`}>
                    {visit.tier}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANEL — AI Triage Analysis */}
      <div className="lg:flex-1 flex flex-col gap-3 overflow-y-auto min-w-0">
        {/* Breed Risk Alerts */}
        {triageData.breedAlerts.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-400" />
              <h4 className="text-sm font-bold text-amber-400">Breed-Specific Risk Alerts</h4>
            </div>
            <div className="space-y-2">
              {triageData.breedAlerts.map((alert, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs ${
                  alert.severity === 'high' ? 'text-orange-300' : 'text-amber-300/70'
                }`}>
                  <span className="mt-0.5">⚠️</span>
                  <span>{alert.alert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Triage Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setTriageExpanded(!triageExpanded)}
            className="w-full px-5 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Eye size={16} className="text-emerald-400" />
              <h4 className="text-sm font-bold text-white">AI Triage Analysis</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tierColor[triageData.tier as keyof typeof tierColor]}`}>
                {triageData.tier} — Score {triageData.riskScore}/100
              </span>
            </div>
            {triageExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>

          {triageExpanded && (
            <div className="px-5 pb-5 space-y-4">
              {/* Risk Score Bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Risk Score</span>
                  <span className="font-bold text-orange-400">{triageData.riskScore}/100</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${triageData.riskScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      triageData.riskScore >= 70 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                      triageData.riskScore >= 40 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                  />
                </div>
              </div>

              {/* Detected Symptoms */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detected Symptoms</p>
                <div className="flex flex-wrap gap-1.5">
                  {triageData.symptoms.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg">{s}</span>
                  ))}
                </div>
              </div>

              {/* AI Explanation */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">AI Clinical Analysis</p>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  {triageData.aiExplanation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Vitals Entry */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" /> Vitals & Examination
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Weight (kg)', icon: Scale, key: 'weight', value: formData.weight, placeholder: '32' },
              { label: 'Temp (°C)', icon: Thermometer, key: 'temperature', value: formData.temperature, placeholder: '38.5' },
              { label: 'Heart Rate', icon: Heart, key: 'heartRate', value: formData.heartRate, placeholder: '80' },
              { label: 'Resp. Rate', icon: Wind, key: 'respiratoryRate', value: formData.respiratoryRate, placeholder: '20' },
              { label: 'BCS (1-9)', icon: Activity, key: 'bodyConditionScore', value: formData.bodyConditionScore.toString(), placeholder: '5' },
            ].map(vital => (
              <div key={vital.key}>
                <label className="text-[10px] text-slate-500 font-medium mb-1 block">{vital.label}</label>
                <div className="relative">
                  <vital.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="number"
                    value={vital.value}
                    onChange={e => setFormData(prev => ({ ...prev, [vital.key]: e.target.value }))}
                    placeholder={vital.placeholder}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — SOAP Notes Builder */}
      <div className="lg:w-80 xl:w-96 shrink-0 flex flex-col gap-3 overflow-y-auto">
        {/* Auto-fill Button */}
        <button
          onClick={handleAutoFillSOAP}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Stethoscope size={16} /> AI Auto-Fill SOAP Notes
        </button>

        {/* SOAP Fields */}
        {[
          { key: 'subjective', label: 'S — Subjective', placeholder: "Owner's complaint, history, pet behavior changes..." },
          { key: 'objective', label: 'O — Objective', placeholder: 'Physical exam findings, lab results, vitals...' },
          { key: 'assessment', label: 'A — Assessment', placeholder: 'Diagnosis, differentials, clinical impression...' },
          { key: 'plan', label: 'P — Plan', placeholder: 'Treatment, medications, follow-up instructions...' },
        ].map(field => (
          <div key={field.key} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800">
              <label className="text-xs font-bold text-emerald-400">{field.label}</label>
            </div>
            <textarea
              value={formData[field.key as keyof ConsultationData] as string}
              onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              rows={3}
              className="w-full px-4 py-3 bg-transparent text-sm text-slate-300 placeholder-slate-700 resize-none focus:outline-none leading-relaxed"
            />
          </div>
        ))}

        {/* Follow-up Toggle */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <CalendarPlus size={14} className="text-amber-400" />
              <span className="text-sm font-bold text-white">Needs Follow-up</span>
            </div>
            <input
              type="checkbox"
              checked={formData.needsFollowUp}
              onChange={e => setFormData(prev => ({ ...prev, needsFollowUp: e.target.checked }))}
              className="accent-emerald-500 w-4 h-4"
            />
          </label>
          {formData.needsFollowUp && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
              <input
                type="date"
                value={formData.followUpDate}
                onChange={e => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
            </motion.div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
          }`}
        >
          {saved ? (
            <><FileText size={16} /> Consultation Saved ✓</>
          ) : (
            <><Save size={16} /> Save Consultation</>
          )}
        </button>

        {/* Transmit & Download Action Grid */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={handleTransmit}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              transmitted
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
            }`}
          >
            <Send size={14} />
            {transmitted ? 'Sent ✓' : 'Send to Portal'}
          </button>
          <button
            onClick={handleDownload}
            className="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <Download size={14} />
            Download File
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
