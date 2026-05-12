import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdminUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseAdminUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

const testValues = [
  'OBSERVATION', 'MONITOR', 'STABLE', 'HEALTHY', 'STANDARD', 'GOOD', 'FINE', 'MINOR',
  'Observation', 'Monitor', 'Stable', 'Healthy', 'Standard', 'Good', 'Fine', 'Minor',
  'observation', 'monitor', 'stable', 'healthy', 'standard', 'good', 'fine', 'minor',
  'MODERATE', 'Moderate', 'moderate', 'AVERAGE', 'Average', 'average',
  'LOW', 'Low', 'low', 'NON_URGENT', 'Non_urgent', 'non_urgent',
  'CRITICAL', 'SEVERE', 'Critical', 'Severe', 'critical', 'severe'
];

async function run() {
  const ownerId = '00000000-0000-0000-0000-000000000000';
  const { data: pets } = await supabaseAdmin.from('pets').select('id, owner_id').limit(1);
  const validPetId = pets?.[0]?.id;
  const validOwnerId = pets?.[0]?.owner_id || ownerId;

  if (validPetId) {
    testInsert(validPetId, validOwnerId);
  }
}

async function testInsert(petId: string, ownerId: string) {
    for (const val of testValues) {
        const { error } = await supabaseAdmin.from('health_logs').insert({
            pet_id: petId,
            owner_id: ownerId,
            triage_tier: val,
            risk_score: 50,
            report_generated: false
        });

        if (!error) {
            console.log(`✅ SUCCESS for value: "${val}"`);
            await supabaseAdmin.from('health_logs').delete().eq('triage_tier', val).eq('pet_id', petId);
        }
    }
}

run();
