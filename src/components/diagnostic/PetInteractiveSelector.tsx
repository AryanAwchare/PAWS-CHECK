import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface Hotspot {
  id: string;
  name: string;
  symptoms: string;
  tooltip: string;
  top: string;
  left: string;
}

interface PetInteractiveSelectorProps {
  onSelectSymptom: (symptom: string) => void;
}

export default function PetInteractiveSelector({ onSelectSymptom }: PetInteractiveSelectorProps) {
  const [selectedPet, setSelectedPet] = useState<'dog' | 'cat' | 'fish' | 'bird'>('dog');
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [selectedHotspots, setSelectedHotspots] = useState<string[]>([]);

  // Clear selections when switching species
  useEffect(() => {
    setSelectedHotspots([]);
    setActiveHotspot(null);
  }, [selectedPet]);

  const dogHotspots: Hotspot[] = [
    { id: 'ears', name: 'Ears', symptoms: 'Scratching ears constantly, shaking head, redness or bad odor in the ear canal.', tooltip: 'Check for Otitis, infections, or ear mites.', top: '22%', left: '33%' },
    { id: 'eyes', name: 'Eyes', symptoms: 'Redness, watery discharge, squinting or pawing at the eyes.', tooltip: 'Check for Conjunctivitis, corneal injury, or dry eye.', top: '24%', left: '44%' },
    { id: 'skin', name: 'Skin & Coat', symptoms: 'Dry skin, bald patches, hot spots, constant licking, scratching or hives.', tooltip: 'Check for Dermatitis, fleas, allergies, or fungal infections.', top: '35%', left: '55%' },
    { id: 'stomach', name: 'Stomach & Digestion', symptoms: 'Bloating, sensitive to touch, loss of appetite, occasional vomiting or loose stool.', tooltip: 'Check for Gastrointestinal issues, dietary sensitivity, or parasites.', top: '55%', left: '58%' },
    { id: 'joints', name: 'Paws & Joints', symptoms: 'Limping, stiffness, reluctance to jump, constant paw licking, or swollen joints.', tooltip: 'Check for Arthritis, paw injuries, tick bites, or sprains.', top: '78%', left: '68%' }
  ];

  const catHotspots: Hotspot[] = [
    { id: 'ears', name: 'Ears', symptoms: 'Ear scratching, head tilt, black discharge or debris in ear canal.', tooltip: 'Check for ear mites, bacterial or yeast infections.', top: '24%', left: '36%' },
    { id: 'eyes', name: 'Eyes', symptoms: 'Squinting, cloudy eyes, third eyelid showing, yellow/green discharge.', tooltip: 'Check for Cat Flu (FHV-1), scratches, or Conjunctivitis.', top: '28%', left: '44%' },
    { id: 'skin', name: 'Skin & Fur', symptoms: 'Overgrooming, scabs along the back, patchy fur loss, or scaling skin.', tooltip: 'Check for flea allergy dermatitis, ringworm, or stress grooming.', top: '38%', left: '54%' },
    { id: 'stomach', name: 'Stomach & Digestion', symptoms: 'Frequent hairballs, vomiting after eating, lethargy, or hiding behavior.', tooltip: 'Check for hairball obstruction, gastritis, or ingestion of toxins.', top: '50%', left: '58%' },
    { id: 'joints', name: 'Paws & Claws', symptoms: 'Limping, hiding paws, torn claws, or swollen pads.', tooltip: 'Check for claw infections, sprains, or joint inflammation.', top: '74%', left: '62%' }
  ];

  const fishHotspots: Hotspot[] = [
    { id: 'fins', name: 'Fins & Tail', symptoms: 'Ragged or split fins, lethargic swimming, clamping fins close to the body.', tooltip: 'Check for Fin rot, physical nipping, or fungal infections.', top: '48%', left: '78%' },
    { id: 'gills', name: 'Gills', symptoms: 'Rapid breathing or gasping at the surface, red or inflamed gills.', tooltip: 'Check for Gill flukes, ammonia poisoning, or low oxygen.', top: '52%', left: '45%' },
    { id: 'scales', name: 'Scales & Skin', symptoms: 'White spots resembling salt sprinkles, scratching against objects, excess mucus coating.', tooltip: 'Check for Ich (white spot disease), velvet disease, or bacterial ulcers.', top: '38%', left: '56%' },
    { id: 'eyes', name: 'Mouth & Eyes', symptoms: 'Protruding or cloudy eyes, cotton-like growths around the mouth, difficulty feeding.', tooltip: 'Check for Pop-eye, mouth fungus, or physical trauma.', top: '44%', left: '26%' }
  ];

  const birdHotspots: Hotspot[] = [
    { id: 'feathers', name: 'Feathers & Skin', symptoms: 'Bare patches of skin, excessive preening, feather chewing, self-mutilation.', tooltip: 'Check for Feather plucking, mites, or nutritional deficiency.', top: '42%', left: '50%' },
    { id: 'beak', name: 'Beak & Cere', symptoms: 'Crusty lesions around beak/nostrils, clicking sounds when breathing, beak flaking.', tooltip: 'Check for Beak overgrowth, scaly face mites, or respiratory distress.', top: '26%', left: '42%' },
    { id: 'wings', name: 'Wings & Joints', symptoms: 'Drooping wing, reluctance to fly, swelling at wing joints.', tooltip: 'Check for Sprained wing, joint arthritis, or bone fracture.', top: '48%', left: '62%' },
    { id: 'feet', name: 'Feet & Claws', symptoms: 'Swollen or red pads on the bottom of feet, lameness, favoring one leg, crusty toes.', tooltip: 'Check for Bumblefoot (pododermatitis), overgrown claws, or scaling mites.', top: '82%', left: '52%' }
  ];

  const hotspots = selectedPet === 'dog' ? dogHotspots :
                    selectedPet === 'cat' ? catHotspots :
                    selectedPet === 'fish' ? fishHotspots : birdHotspots;

  const petImages = {
    dog: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600',
    cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600',
    fish: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600',
    bird: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&q=80&w=600'
  };

  const toggleHotspot = (id: string) => {
    setSelectedHotspots(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedHotspots.length === 0) return;
    const compiledText = selectedHotspots
      .map(id => {
        const spot = hotspots.find(h => h.id === id);
        return spot ? `[${spot.name} Area] Common symptoms identified: ${spot.symptoms}` : '';
      })
      .filter(Boolean)
      .join('\n');
    onSelectSymptom(compiledText);
    setSelectedHotspots([]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
      {/* Background glassmorphic glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">Interactive Anatomical Triage</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Click hotspots to select symptoms & verify focus points</p>
        </div>
        <div className="flex flex-wrap bg-slate-800 p-1 rounded-xl border border-slate-700/50 gap-1">
          {(['dog', 'cat', 'fish', 'bird'] as const).map((pet) => (
            <button
              key={pet}
              onClick={() => setSelectedPet(pet)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                selectedPet === pet ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>
                {pet === 'dog' ? '🐕' : pet === 'cat' ? '🐈' : pet === 'fish' ? '🐠' : '🐦'}
              </span>
              <span className="capitalize">{pet}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Silhouette Backdrop Container */}
        <div className="relative bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-center overflow-hidden min-h-[300px] aspect-[4/3] w-full max-w-[450px] mx-auto">
          <img
            src={petImages[selectedPet]}
            alt={selectedPet}
            className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40 pointer-events-none" />

          {/* Hotspot absolute nodes */}
          {hotspots.map((spot) => {
            const isSelected = selectedHotspots.includes(spot.id);
            return (
              <button
                key={spot.id}
                style={{ top: spot.top, left: spot.left }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 outline-none"
                onMouseEnter={() => setActiveHotspot(spot.id)}
                onMouseLeave={() => setActiveHotspot(null)}
                onClick={() => toggleHotspot(spot.id)}
              >
                {/* Outermost pulsing ring */}
                <div
                  className={`w-10 h-10 -m-3 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 animate-pulse transition-all duration-300 ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-500/20 scale-110'
                      : 'border-blue-500/40 bg-blue-500/10 group-hover:scale-125'
                  }`}
                />
                {/* Interactive Inner Node Core */}
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all duration-300 ${
                    isSelected ? 'bg-emerald-500' : 'bg-blue-600 group-hover:bg-blue-400'
                  }`}
                >
                  {isSelected && <Check size={8} strokeWidth={4} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hotspot details & confirm button card */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 flex-1 flex flex-col justify-center">
            {activeHotspot ? (
              (() => {
                const active = hotspots.find(h => h.id === activeHotspot);
                if (!active) return null;
                const isSelected = selectedHotspots.includes(active.id);
                return (
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded">
                        Focus: {active.name}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isSelected ? '✓ Selected' : 'Click point to select'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{active.tooltip}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                      {active.symptoms}
                    </p>
                  </motion.div>
                );
              })()
            ) : selectedHotspots.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Check size={12} className="stroke-[3]" />
                  Selected Body Regions ({selectedHotspots.length})
                </p>
                <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                  {selectedHotspots.map(id => {
                    const spot = hotspots.find(h => h.id === id);
                    if (!spot) return null;
                    return (
                      <div key={id} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-xs">
                        <span className="font-extrabold text-blue-400 shrink-0">{spot.name}:</span>
                        <span className="text-slate-300 line-clamp-1">{spot.symptoms}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-6">
                <Info size={24} className="mx-auto mb-2 text-slate-700 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Anatomical Focus Area</p>
                <p className="text-[10px] mt-1 leading-normal text-slate-500">
                  Select flashing nodes directly on the {selectedPet} backdrop image to add points of concern to your description checklist.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {selectedHotspots.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedHotspots([])}
                  className="px-3 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Clear
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
                >
                  Confirm & Add Selected Symptoms
                </button>
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800/60 p-3 rounded-2xl flex items-start gap-2.5">
              <span className="text-xs mt-0.5 text-blue-400"><AlertCircle size={14} /></span>
              <p className="text-[10px] text-slate-400 leading-normal text-left">
                Accumulate symptoms by clicking on multiple nodes, then click <strong>Confirm & Add</strong> to append them to the clinical triage report questionnaire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
