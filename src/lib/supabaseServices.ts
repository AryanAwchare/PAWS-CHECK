import { supabase } from './supabase';

/**
 * COMPREHENSIVE SUPABASE DATABASE SERVICES
 * 
 * This file contains full CRUD operations and complex queries for the 
 * entire Paws-Check B2B Platform Schema, including relational fetches.
 */

// ==========================================
// 1. PET PROFILES
// ==========================================

export async function createPet(ownerId: string, petData: {
  name: string; species?: string; breed?: string; age?: number;
  medical_history?: string; profile_picture_url?: string;
  known_allergies?: string[]; vaccination_records?: any;
  medications?: any; microchip_number?: string;
}) {
  const { data, error } = await supabase
    .from('pets')
    .insert([{ owner_id: ownerId, ...petData }])
    .select()
    .single();

  if (error) throw new Error(`Error creating pet: ${error.message}`);
  return data;
}

export async function getPetsByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching pets: ${error.message}`);
  return data;
}

// Complex Query: Get a Pet with ALL its related data (Logs, Docs, Reminders)
export async function getFullPetProfile(petId: string) {
  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      health_logs (*),
      pet_documents (*),
      food_analyses (*),
      reminders (*)
    `)
    .eq('id', petId)
    .single();

  if (error) throw new Error(`Error fetching full pet profile: ${error.message}`);
  return data;
}

export async function updatePet(petId: string, updates: any) {
  const { data, error } = await supabase
    .from('pets')
    .update(updates)
    .eq('id', petId)
    .select()
    .single();

  if (error) throw new Error(`Error updating pet: ${error.message}`);
  return data;
}

export async function deletePet(petId: string) {
  const { error } = await supabase.from('pets').delete().eq('id', petId);
  if (error) throw new Error(`Error deleting pet: ${error.message}`);
  return true;
}

// ==========================================
// 2. HEALTH LOGS (B2B Triage Reports)
// ==========================================

export async function createHealthLog(logData: {
  pet_id: string; owner_id: string; image_urls?: string[];
  risk_score?: number; triage_tier?: 'HEALTHY' | 'MONITOR' | 'URGENT' | 'EMERGENCY';
  questionnaire_answers?: any; critical_level_factors?: string[];
  detected_symptoms?: any; ai_explanation?: string; vet_summary?: string;
  report_generated?: boolean; pdf_report_url?: string;
}) {
  const { data, error } = await supabase
    .from('health_logs')
    .insert([logData])
    .select()
    .single();

  if (error) throw new Error(`Error creating health log: ${error.message}`);
  return data;
}

export async function getHealthLogsByPet(petId: string) {
  const { data, error } = await supabase
    .from('health_logs')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching health logs: ${error.message}`);
  return data;
}

// Fetch a single specific B2B report including pet metadata
export async function getReportById(logId: string) {
  const { data, error } = await supabase
    .from('health_logs')
    .select('*, pets(name, breed, age)')
    .eq('id', logId)
    .single();

  if (error) throw new Error(`Error fetching report details: ${error.message}`);
  return data;
}

export async function updateHealthLogWithVetSummary(logId: string, vetSummary: string, pdfUrl?: string) {
  const { data, error } = await supabase
    .from('health_logs')
    .update({ 
      vet_summary: vetSummary, 
      report_generated: true,
      ...(pdfUrl && { pdf_report_url: pdfUrl })
    })
    .eq('id', logId)
    .select()
    .single();

  if (error) throw new Error(`Error updating health log: ${error.message}`);
  return data;
}

// ==========================================
// 3. FOOD ANALYSES
// ==========================================

export async function createFoodAnalysis(analysisData: {
  pet_id: string; food_name: string; ingredients?: string[];
  safety_status?: 'Safe' | 'Caution' | 'Unsafe'; analysis_details?: string;
}) {
  const { data, error } = await supabase
    .from('food_analyses')
    .insert([analysisData])
    .select()
    .single();

  if (error) throw new Error(`Error saving food analysis: ${error.message}`);
  return data;
}

export async function getFoodAnalysesByPet(petId: string) {
  const { data, error } = await supabase
    .from('food_analyses')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching food analyses: ${error.message}`);
  return data;
}

// ==========================================
// 4. PET DOCUMENTS (X-Rays, Prescriptions, etc.)
// ==========================================

export async function uploadPetDocument(petId: string, document_url: string, document_type: string, description: string) {
  const { data, error } = await supabase
    .from('pet_documents')
    .insert([{ pet_id: petId, document_url, document_type, description }])
    .select()
    .single();

  if (error) throw new Error(`Error adding document record: ${error.message}`);
  return data;
}

export async function getPetDocuments(petId: string) {
  const { data, error } = await supabase
    .from('pet_documents')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching documents: ${error.message}`);
  return data;
}

export async function deletePetDocument(documentId: string) {
  const { error } = await supabase.from('pet_documents').delete().eq('id', documentId);
  if (error) throw new Error(`Error deleting document: ${error.message}`);
  return true;
}

// ==========================================
// 5. REMINDERS
// ==========================================

export async function createReminder(reminderData: {
  pet_id: string; owner_id: string; title: string;
  dueDate: string; priority?: string; completed?: boolean;
}) {
  // Postgres lowercases unquoted DDL identifiers: 'dueDate' schema column → 'duedate' in DB
  const { dueDate, ...rest } = reminderData;
  const { data, error } = await supabase
    .from('reminders')
    .insert([{ ...rest, duedate: dueDate }])
    .select()
    .single();

  if (error) throw new Error(`Error creating reminder: ${error.message}`);
  return data;
}

export async function getUserReminders(ownerId: string, includeCompleted = false) {
  // Postgres lowercases unquoted DDL identifiers: 'dueDate' schema column → 'duedate' in DB
  let query = supabase
    .from('reminders')
    .select('*, pets(name, profile_picture_url)')
    .eq('owner_id', ownerId)
    .order('duedate', { ascending: true });

  if (!includeCompleted) {
    query = query.eq('completed', false);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error fetching reminders: ${error.message}`);
  return data;
}

export async function completeReminder(reminderId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .update({ completed: true })
    .eq('id', reminderId)
    .select()
    .single();

  if (error) throw new Error(`Error completing reminder: ${error.message}`);
  return data;
}

export async function deleteReminder(reminderId: string) {
  const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
  if (error) throw new Error(`Error deleting reminder: ${error.message}`);
  return true;
}

// ==========================================
// 6. STORAGE (File & Image Uploads)
// ==========================================

export async function uploadImageToStorage(file: File, path: string, bucket = 'pet-images') {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw new Error(`Error uploading image: ${uploadError.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
