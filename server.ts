import express from "express";
import path from "path";
import { createClient } from '@supabase/supabase-js';
import { analyzePetSymptom } from './src/lib/gemini.js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Polyfill WebSocket for Node.js < 22 to fix Supabase realtime crash
(global as any).WebSocket = ws;

// Initialize Supabase Admin Client using Service Role Key to bypass RLS for backend operations
const supabaseAdminUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseAdminUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function startServer() {
  const app = express();
  const PORT = 4005;

  app.use(express.json({ limit: '50mb' }));



  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", supabase_connected: !!supabaseServiceKey });
  });

  // B2B FASTAPI-EQUIVALENT TRIAGE ENDPOINT
  // Receives Multi-Image + Questionnaire, Calls Gemini Brain, Saves to Supabase
  app.post("/api/triage", async (req, res) => {
    try {
      const { petId, ownerId, imageBase64, mimeType, petContext, questionnaire } = req.body;

      if (!petId || !ownerId || !imageBase64) {
        return res.status(400).json({ error: "Missing required fields: petId, ownerId, or imageBase64" });
      }

      // 0 & 1. PARALLELIZE: Upload to Supabase and Run Gemini AI concurrently to reduce time complexity
      const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileExt = mimeType?.split('/')[1] || 'jpeg';
      const fileName = `${ownerId}/${petId}/${Date.now()}.${fileExt}`;
      const bucketName = process.env.VITE_SUPABASE_STORAGE_BUCKET || 'pet-uploads';
      
      const uploadPromise = supabaseAdmin.storage
        .from(bucketName)
        .upload(fileName, imageBuffer, { contentType: mimeType || 'image/jpeg' });
        
      const aiPromise = analyzePetSymptom(imageBase64, mimeType || "image/jpeg", petContext, questionnaire);

      const [uploadResult, aiResult] = await Promise.all([uploadPromise, aiPromise]);

      if (uploadResult.error) {
        console.error("Storage upload failed:", uploadResult.error);
      }

      const imageUrl = supabaseAdmin.storage.from(bucketName).getPublicUrl(fileName).data.publicUrl;

      // 2. Save the result to Supabase `health_logs` table
      const { data: logData, error: dbError } = await supabaseAdmin
        .from('health_logs')
        .insert([{
          pet_id: petId,
          owner_id: ownerId,
          image_urls: [imageUrl], // Save the permanent storage URL
          risk_score: aiResult.riskScore,
          triage_tier: aiResult.riskLevel.toUpperCase(),
          questionnaire_answers: questionnaire,
          critical_level_factors: aiResult.critical_level_factors,
          detected_symptoms: aiResult.detected_symptoms,
          ai_explanation: aiResult.ai_explanation,
          report_generated: false
        }])
        .select()
        .single();

      if (dbError) throw new Error(`Database Error: ${dbError.message}`);

      // 3. Return the payload to the frontend
      res.json({
        message: "Triage complete and saved to database.",
        log_id: logData.id,
        analysis: aiResult
      });

    } catch (error: any) {
      console.error("Triage Error:", error.message || error);
      if (error.message?.includes('UNCERTAIN')) {
        return res.status(422).json({ error: error.message, status: 'UNCERTAIN' });
      }
      res.status(500).json({ error: error.message || "Internal Server Error during Triage logic." });
    }
  });

  // PET CRUD ENDPOINTS (using admin client to bypass RLS)
  app.post("/api/pets", async (req, res) => {
    try {
      const { owner_id, name, species, breed, age } = req.body;
      if (!owner_id || !name) {
        return res.status(400).json({ error: "owner_id and name are required." });
      }

      const { data, error } = await supabaseAdmin
        .from('pets')
        .insert([{ owner_id, name, species, breed, age }])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Create Pet Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pets", async (req, res) => {
    try {
      const ownerId = req.query.owner_id as string;
      if (!ownerId) {
        return res.status(400).json({ error: "owner_id query param is required." });
      }

      const { data, error } = await supabaseAdmin
        .from('pets')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("Fetch Pets Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // REPORT ENDPOINT (for fetching a single health log with pet details)
  app.get("/api/report/:logId", async (req, res) => {
    try {
      const { logId } = req.params;
      const { data, error } = await supabaseAdmin
        .from('health_logs')
        .select('*, pets(name, breed, age)')
        .eq('id', logId)
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Fetch Report Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analyze-prescription", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });

      const { analyzePrescription } = await import('./src/lib/gemini.js');
      const result = await analyzePrescription(imageBase64, mimeType || "image/jpeg");
      res.json(result);
    } catch (error: any) {
      console.error("Prescription Analysis Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // HEALTH LOGS (for dashboard history)
  app.get("/api/health-logs", async (req, res) => {
    try {
      const ownerId = req.query.owner_id as string || '00000000-0000-0000-0000-000000000000';
      const { data, error } = await supabaseAdmin
        .from('health_logs')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("Fetch Health Logs Error:", error.message);
      res.json([]); // Return empty array on error so dashboard doesn't break
    }
  });

  // Note: We now run the frontend using `vite dev` and the backend using `tsx server.ts` separately
  // to avoid Windows ESM loader crashes with programmatic Vite.
  
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Try the configured port, then fall back to alternatives
  const tryPorts = [PORT, PORT + 1, PORT + 2, PORT + 3];
  for (const port of tryPorts) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = app.listen(port, "0.0.0.0", () => {
          console.log(`Backend API running on http://localhost:${port}`);
          resolve();
        });
        server.on('error', reject);
      });
      break; // Success, stop trying
    } catch (err: any) {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} in use, trying ${port + 1}...`);
      } else {
        throw err;
      }
    }
  }
}

startServer();
