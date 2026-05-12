import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = ['gemini-2.5-flash', 'gemini-3.1-pro-preview', 'gemini-flash-latest'];
  for (const m of models) {
      try {
        const res = await ai.models.generateContent({
          model: m,
          contents: 'Hello'
        });
        console.log(`Model ${m} SUCCESS:`, res.text);
        return;
      } catch (e: any) {
        console.error(`Model ${m} FAILED`);
      }
  }
}

run();
