import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialization - don't create the client at import time
// because dotenv hasn't loaded yet when ESM imports are hoisted
let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY || '';
    if (!key) console.error("WARNING: GEMINI_API_KEY is not set!");
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}

export interface AnalysisResult {
  issue: string;
  confidence: number;
  riskScore: number;
  riskLevel: 'HEALTHY' | 'MONITOR' | 'URGENT' | 'EMERGENCY';
  recommendation: string;
  isEmergency: boolean;
  primary_condition: string;
  severity_level: 'mild' | 'moderate' | 'severe';
  detected_symptoms: string[];
  critical_level_factors: string[];
  ai_explanation: string;
  differential_diagnoses: { condition: string; probability: number }[];
  home_care_recommendations: string[];
  vet_action_required: string;
}

export async function analyzePetSymptom(mediaBase64: string, mimeType: string, petContext?: any, questionnaire?: any): Promise<AnalysisResult> {
  const ai = getAI();
  const model = "gemini-flash-latest";

  // Strip data URL prefix if present (Gemini expects raw base64)
  const cleanBase64 = mediaBase64.replace(/^data:[^;]+;base64,/, '');

  const prompt = `You are the Paws-Check B2B Analysis Engine. Your task is to analyze pet health data and generate a structured clinical report for a veterinarian.

CONTEXT DATA PROVIDED:
- Pet Context: ${JSON.stringify(petContext || "None provided")}
- Questionnaire/Symptoms: ${JSON.stringify(questionnaire || "None provided")}

TASK:
1. Identify the primary suspected condition based on visual indicators and provided context.
2. List all detected and reported symptoms in a bulletin format.
3. Extract "Critical Level Factors": These are specific reasons why this case is risky (e.g., "Symmetry loss in gait," "Lesion near eye," or "Co-morbidity with reported lethargy").
4. Assign a Base Risk Score (0-100) before backend boosters are applied.

OUTPUT CONSTRAINTS:
- Return ONLY valid JSON.
- DO NOT provide a final medical diagnosis; use "Signs consistent with...".
- If image quality is poor, set confidence_score below 0.60.

JSON SCHEMA:
{
  "primary_condition": "string",
  "confidence_score": number (0.0 - 1.0), 
  "severity_level": "mild" | "moderate" | "severe",
  "base_risk_score": number (0-100),
  "detected_symptoms": ["string"],
  "critical_level_factors": ["string"],
  "ai_explanation": "2-3 sentences of professional summary",
  "differential_diagnoses": [
    {"condition": "string", "probability": number}
  ],
  "home_care_recommendations": ["string"],
  "vet_action_required": "string"
}`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: cleanBase64, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primary_condition: { type: Type.STRING },
          confidence_score: { type: Type.NUMBER },
          severity_level: { type: Type.STRING, enum: ["mild", "moderate", "severe"] },
          base_risk_score: { type: Type.NUMBER },
          detected_symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          critical_level_factors: { type: Type.ARRAY, items: { type: Type.STRING } },
          ai_explanation: { type: Type.STRING },
          differential_diagnoses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { condition: { type: Type.STRING }, probability: { type: Type.NUMBER } }
            }
          },
          home_care_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          vet_action_required: { type: Type.STRING }
        },
        required: [
          "primary_condition", "confidence_score", "severity_level",
          "base_risk_score", "detected_symptoms", "critical_level_factors",
          "ai_explanation", "vet_action_required"
        ]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');
  const rawResult = JSON.parse(text);

  if (rawResult.confidence_score < 0.60) {
    throw new Error("UNCERTAIN: Image quality insufficient for accurate triage. Please retake in better lighting.");
  }

  let finalRiskScore = rawResult.base_risk_score;
  if (petContext?.age > 10 && rawResult.severity_level === 'severe') {
    finalRiskScore += 15;
  }
  finalRiskScore = Math.min(100, finalRiskScore);

  let internalRiskLevel: 'HEALTHY' | 'MONITOR' | 'URGENT' | 'EMERGENCY' = 'HEALTHY';
  if (finalRiskScore >= 71) internalRiskLevel = 'EMERGENCY';
  else if (finalRiskScore >= 40) internalRiskLevel = 'URGENT';

  return {
    issue: rawResult.primary_condition,
    confidence: Math.round(rawResult.confidence_score * 100),
    riskScore: finalRiskScore,
    riskLevel: internalRiskLevel,
    recommendation: rawResult.vet_action_required,
    isEmergency: finalRiskScore >= 71,
    primary_condition: rawResult.primary_condition,
    severity_level: rawResult.severity_level,
    detected_symptoms: rawResult.detected_symptoms,
    critical_level_factors: rawResult.critical_level_factors,
    ai_explanation: rawResult.ai_explanation,
    differential_diagnoses: rawResult.differential_diagnoses || [],
    home_care_recommendations: rawResult.home_care_recommendations || [],
    vet_action_required: rawResult.vet_action_required
  };
}

export async function comparePetHealth(prevBase64: string, currBase64: string): Promise<{ status: 'Improved' | 'No change' | 'Worsened', details: string }> {
  const ai = getAI();
  const model = "gemini-flash-latest";

  const prompt = `Compare these two images of a pet's health issue. 
Image 1 is the previous state. Image 2 is the current state.
Determine if the condition has "Improved", "No change", or "Worsened".

Provide a JSON response with:
- status: "Improved", "No change", or "Worsened"
- details: Brief explanation.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: prevBase64.replace(/^data:[^;]+;base64,/, ''), mimeType: "image/jpeg" } },
        { inlineData: { data: currBase64.replace(/^data:[^;]+;base64,/, ''), mimeType: "image/jpeg" } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ["Improved", "No change", "Worsened"] },
          details: { type: Type.STRING }
        },
        required: ["status", "details"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');
  return JSON.parse(text);
}

export async function analyzePrescription(mediaBase64: string, mimeType: string): Promise<any> {
  const ai = getAI();
  const model = "gemini-flash-latest";
  const cleanBase64 = mediaBase64.replace(/^data:[^;]+;base64,/, '');

  const prompt = `You are a veterinary prescription analysis assistant. Extract details from this prescription image.
Return ONLY valid JSON with this schema:
{
  "medication_name": "string",
  "dosage": "string",
  "frequency": "string",
  "duration": "string",
  "instructions": "string",
  "warnings": ["string"],
  "is_authentic": boolean,
  "confidence_score": number
}`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: cleanBase64, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');
  return JSON.parse(text);
}
