import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Camera, AlertCircle, Loader2, Info } from 'lucide-react';
import { usePet } from '../../context/PetContext';
import ScanResults from './ScanResults';
import { callGemini, fileToGeminiPart } from '../../lib/geminiClient';
import PetInteractiveSelector from './PetInteractiveSelector';

export default function Diagnostic() {
  const { activePet } = usePet();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [questionnaire, setQuestionnaire] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [geminiResult, setGeminiResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('File size exceeds 20MB limit.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);

      // Read as base64 immediately
      const reader = new FileReader();
      reader.onload = () => setBase64Data(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !base64Data) return;
    if (!activePet) {
      setError('Please select a pet from the top menu first.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const prompt = `You are a veterinary AI triage assistant. Analyze this image of a pet (${activePet.species || 'dog'}, breed: ${activePet.breed || 'unknown'}, age: ${activePet.age || 'unknown'} years).

Owner's description: "${questionnaire || 'No additional description provided.'}"

Respond ONLY with a valid JSON object — no markdown fences, no extra text. Ensure all strings are properly escaped (no literal newlines or unescaped quotes inside strings).
Schema:
{
  "disease_name": "short clinical name",
  "occurrence_rate": "how common this is",
  "risk_score": number between 0-100,
  "triage_tier": "HEALTHY" | "MONITOR" | "URGENT" | "EMERGENCY",
  "ai_explanation": "2-3 sentence clinical explanation based on visual cues and user description",
  "clinical_reasons": "detailed clinical reasoning with references to common presentations",
  "probable_causes": ["cause1", "cause2", "cause3"],
  "detected_symptoms": ["symptom1", "symptom2"],
  "critical_level_factors": ["factor1", "factor2"],
  "vet_action_required": "recommended vet action",
  "recommendation": "short home care recommendation"
}`;

      const imagePart = fileToGeminiPart(base64Data, selectedFile.type || 'image/jpeg');
      
      let parsed = null;
      let attempts = 0;
      let lastRaw = "";
      
      while (attempts < 3 && !parsed) {
        attempts++;
        try {
          const raw = await callGemini([{ text: prompt }, imagePart]);
          lastRaw = raw;

          let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleaned = jsonMatch[0];
          }
          cleaned = cleaned.replace(/[\u0000-\u001F]+/g, " ");
          parsed = JSON.parse(cleaned);
        } catch (e) {
          console.warn(`Attempt ${attempts} failed to parse JSON. Retrying...`, e);
          if (attempts >= 3) {
            console.error("Raw output that failed parsing on final attempt:", lastRaw);
            throw new Error("AI returned malformed data after multiple attempts. The AI might be struggling to format the results. Please try again.");
          }
          // Wait 2 seconds before retrying
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      const id = `gemini-log-${Date.now()}`;
      setGeminiResult({ ...parsed, id });
      setLogId(id);
    } catch (err: any) {
      console.error('Gemini triage error:', err);
      setError(`AI scan failed: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  // Show results page after successful scan
  if (logId && geminiResult) {
    return (
      <ScanResults
        logId={logId}
        uploadedImage={previewUrl || undefined}
        prefetchedReport={geminiResult}
        onClose={() => {
          setLogId(null);
          setGeminiResult(null);
          setSelectedFile(null);
          setPreviewUrl(null);
          setBase64Data(null);
          setQuestionnaire('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Interactive SVG Hot-Spot Pet Silhouette Selector */}
      <PetInteractiveSelector onSelectSymptom={(symptom) => setQuestionnaire(prev => prev ? `${prev}\n\n${symptom}` : symptom)} />

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Visual Triage Scanner</h2>
        <p className="text-slate-500 mb-8">
          Upload a clear image of the affected area and provide a brief description. Gemini AI will analyze the symptoms for your vet.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Image Upload */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Media Upload</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                previewUrl
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'
              }`}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  {isUploading && (
                    <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-laser-scan pointer-events-none" />
                  )}
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold tracking-wide">
                    Click to Change
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <Camera className="mx-auto text-blue-500 mb-3" size={40} />
                  <p className="text-sm font-bold text-slate-700">Click to Upload Photo</p>
                  <p className="text-xs text-slate-400 mt-1">Make sure the area is well-lit.</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            {selectedFile && (
              <div className="flex justify-between items-center text-xs font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <span>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            )}
          </div>

          {/* Right: Questionnaire */}
          <div className="space-y-4 flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">2. Symptoms Description</h3>
            <textarea
              className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none min-h-[160px]"
              placeholder={`Describe what you see...\nE.g., "Max has been scratching his left ear constantly since yesterday. It looks red and inflamed."`}
              value={questionnaire}
              onChange={(e) => setQuestionnaire(e.target.value)}
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-700 text-sm font-medium">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing image & symptoms...
                </>
              ) : (
                'Run Clinical Triage'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400 italic text-center px-4 flex items-center justify-center gap-2">
        <Info size={14} />
        Powered by Google Gemini AI. This is a triage aid, not a replacement for veterinary diagnosis.
      </div>
    </div>
  );
}
