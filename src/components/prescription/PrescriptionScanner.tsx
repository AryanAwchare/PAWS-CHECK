import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle, Info, CalendarPlus, PlusCircle } from 'lucide-react';
import { usePet } from '../../context/PetContext';
import { createReminder } from '../../lib/supabaseServices';
import { callGemini, fileToGeminiPart } from '../../lib/geminiClient';

export default function PrescriptionScanner() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const { activePet, userId } = usePet();

  const handleAddToCarePlan = async () => {
    if (!activePet || !result) return;
    setIsSavingPlan(true);
    try {
      await createReminder({
        pet_id: activePet.id,
        owner_id: userId,
        title: `Medication: ${result.medication_name}`,
        dueDate: new Date().toISOString(),
        priority: 'urgent',
        completed: false
      });
      alert('Successfully added to Care Plan!');
    } catch (err) {
      console.error(err);
      alert('Failed to add to Care Plan.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!result) return;
    const title = encodeURIComponent(`Pet Medication: ${result.medication_name}`);
    const details = encodeURIComponent(`Dosage: ${result.dosage}\nFrequency: ${result.frequency}\nInstructions: ${result.instructions}`);
    
    // Create a start time (now) and end time (1 hour from now) just for the initial calendar block
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    // Format dates to YYYYMMDDTHHMMSSZ
    const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
    window.open(url, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!preview || !selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const prompt = `You are a veterinary pharmacist AI assistant. Analyze this prescription or medication label image.

Respond ONLY with a valid JSON object — no markdown fences, no extra text. Schema:
{
  "medication_name": "full drug name",
  "dosage": "dosage amount and form",
  "frequency": "how often to administer",
  "duration": "course length",
  "instructions": "administration instructions",
  "warnings": ["warning1", "warning2"],
  "is_authentic": true,
  "confidence_score": 0.95
}

If this is not a prescription or medication label, set medication_name to "Not a prescription" and confidence_score to 0.`;

      const imagePart = fileToGeminiPart(preview, selectedFile.type || 'image/jpeg');
      const raw = await callGemini([{ text: prompt }, imagePart]);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch (err: any) {
      console.error('Gemini prescription error:', err);
      setError(`AI analysis failed: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-2">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Prescription Scanner</h2>
        <p className="text-sm text-slate-500 font-medium">Extract medication details and verify authenticity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
          {preview ? (
            <div className="relative w-full h-full flex flex-col items-center">
              <img src={preview} className="max-h-[250px] rounded-lg shadow-md mb-4" />
              <button 
                onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); }}
                className="text-xs font-bold text-red-500 uppercase tracking-widest hover:text-red-700"
              >
                Remove Image
              </button>
            </div>
          ) : (
            <div 
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              onClick={() => document.getElementById('prescriptionInput')?.click()}
            >
              <Upload className="text-slate-300 group-hover:text-blue-400 mb-2" size={48} />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Upload Prescription</p>
              <input id="prescriptionInput" type="file" hidden onChange={handleFileChange} />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Extraction Result</h3>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Analyzing Meds...</p>
                </motion.div>
              ) : result ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Medication</p>
                      <p className="text-sm font-black text-indigo-900">{result.medication_name}</p>
                    </div>
                    {result.is_authentic && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                        <CheckCircle size={10} /> Authentic
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dosage</p>
                      <p className="text-xs font-bold text-slate-800">{result.dosage}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frequency</p>
                      <p className="text-xs font-bold text-slate-800">{result.frequency}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instructions</p>
                    <p className="text-xs font-bold text-slate-800">{result.instructions}</p>
                  </div>

                  {result.warnings?.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100 mb-4">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle size={10} /> Warnings
                      </p>
                      <ul className="text-xs font-bold text-red-800 mt-1 list-disc list-inside">
                        {result.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleAddToCarePlan}
                      disabled={isSavingPlan || !activePet}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 font-black py-2.5 rounded-lg text-[10px] hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                    >
                      {isSavingPlan ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                      Add to Care Plan
                    </button>
                    
                    <button 
                      onClick={handleAddToCalendar}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 font-black py-2.5 rounded-lg text-[10px] hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                      <CalendarPlus size={14} />
                      Google Calendar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                  <Info size={40} className="mb-2" />
                  <p className="text-xs font-bold text-center uppercase tracking-widest">Scan to extract data</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <button 
            disabled={!preview || loading}
            onClick={handleAnalyze}
            className="mt-6 w-full bg-indigo-600 text-white font-black py-3 rounded-xl text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 uppercase tracking-widest"
          >
            {loading ? 'Processing...' : 'Start Extraction'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-3">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}
    </div>
  );
}
