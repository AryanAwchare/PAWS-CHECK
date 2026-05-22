import dotenv from 'dotenv';
dotenv.config();

const GEMINI_MODEL = 'gemini-flash-lite-latest';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function testGemini() {
  console.log('Testing Gemini with model:', GEMINI_MODEL);
  console.log('API Key starts with:', GEMINI_API_KEY?.substring(0, 10));

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, what is the latest news in veterinary medicine today?' }] }],
        tools: [{ google_search: {} }],
        generationConfig: { 
          temperature: 0.2, 
          maxOutputTokens: 1024
        }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Error:', res.status, err);
      return;
    }

    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testGemini();
