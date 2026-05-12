import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdminUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseAdminUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  realtime: {
    // Pass ws as the transport for node < 22
    transport: ws
  }
});

async function run() {
  const { data, error } = await supabase.from('health_logs').select('triage_tier').limit(10);
  console.log('Existing values:', data);
}

run();
