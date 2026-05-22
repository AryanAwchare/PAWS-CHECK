// Gemini direct browser client — no backend proxy needed
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export async function callGemini(parts: GeminiPart[], retryCount = 0): Promise<string> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { 
          temperature: 0.2, 
          maxOutputTokens: 8192
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      
      // Handle transient errors with retries
      if ((res.status === 503 || res.status === 429) && retryCount < MAX_RETRIES) {
        console.warn(`Gemini error ${res.status}. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return callGemini(parts, retryCount + 1);
      }

      // If quota exceeded after retries, return a high-quality mock fallback for demo stability
      if (res.status === 429) {
        console.warn('Gemini Quota Exceeded. Using Clinical Mock Fallback.');
        return JSON.stringify({
          disease_name: "Localized Acute Dermatitis (Mock)",
          risk_score: 65,
          triage_tier: "URGENT",
          ai_explanation: "Visual markers suggest acute inflammatory response. Quota reached, showing simulated clinical analysis.",
          clinical_reasons: "Presence of focal redness and suspected pruritic behavior. Epidermal barrier appears compromised.",
          detected_symptoms: ["Erythema", "Localized Alopecia", "Inflammation"],
          probable_causes: ["Allergic reaction", "Contact dermatitis", "Flea allergy"],
          critical_level_factors: ["Rapid onset", "Persistent irritation"],
          recommendation: "Schedule a physical examination for definitive diagnosis.",
          occurrence_rate: "Common in seasonal presentations."
        });
      }
      throw new Error(`Gemini API error: ${res.status} — ${errText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error: any) {
    if (error.message.includes('429') && retryCount < MAX_RETRIES) {
       await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
       return callGemini(parts, retryCount + 1);
    }
    throw error;
  }
}

// Convert a File or data-URL into the base64 inlineData part Gemini needs
export function fileToGeminiPart(base64DataUrl: string, mimeType: string): GeminiPart {
  // Strip the "data:image/jpeg;base64," prefix
  const base64 = base64DataUrl.split(',')[1] ?? base64DataUrl;
  return { inlineData: { mimeType, data: base64 } };
}
