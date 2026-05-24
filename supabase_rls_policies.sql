-- ============================================================
-- PAWSCHECK — COMPLETE STANDALONE SCHEMA & RLS POLICIES
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- 
-- Fully self-contained & idempotent: Creates missing tables automatically
-- before applying Row Level Security policies and multi-user trigger mapping.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PART 1: CREATE TABLES (IF NOT EXISTS) IN DEPENDENCY ORDER
-- ============================================================

-- 1. Pets
CREATE TABLE IF NOT EXISTS pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT DEFAULT 'Dog',
  breed TEXT,
  age INT,
  medical_history TEXT,
  profile_picture_url TEXT,
  known_allergies TEXT[],
  vaccination_records JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  microchip_number TEXT,
  weight TEXT,
  previous_medications TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Health Logs
CREATE TABLE IF NOT EXISTS health_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_urls TEXT[],
  risk_score INT,
  triage_tier TEXT CHECK (triage_tier IN ('HEALTHY','MONITOR','URGENT','EMERGENCY')),
  questionnaire_answers JSONB,
  critical_level_factors TEXT[],
  detected_symptoms JSONB,
  ai_explanation TEXT,
  vet_summary TEXT,
  report_generated BOOLEAN DEFAULT false,
  pdf_report_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Food Analyses
CREATE TABLE IF NOT EXISTS food_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  food_name TEXT,
  ingredients TEXT[],
  safety_status TEXT CHECK (safety_status IN ('Safe','Caution','Unsafe')),
  analysis_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Pet Documents
CREATE TABLE IF NOT EXISTS pet_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  document_url TEXT,
  document_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  dueDate TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT DEFAULT 'normal',
  completed BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'veterinarian')),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Veterinarians
CREATE TABLE IF NOT EXISTS veterinarians (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT,
  specialization TEXT DEFAULT 'General Practice',
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_phone TEXT,
  years_of_experience INT DEFAULT 0,
  bio TEXT,
  consultation_fee DECIMAL(10,2) DEFAULT 500,
  is_available BOOLEAN DEFAULT true,
  vacation_mode BOOLEAN DEFAULT false,
  vacation_start DATE,
  vacation_end DATE,
  rating DECIMAL(2,1) DEFAULT 4.5,
  total_consultations INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Vet Time Slots
CREATE TABLE IF NOT EXISTS vet_time_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vet_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_status TEXT DEFAULT 'available' CHECK (slot_status IN ('available', 'booked', 'blocked', 'break')),
  blocked_reason TEXT,
  appointment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vet_id, slot_date, start_time)
);

-- 9. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES vet_time_slots(id),
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled', 'no_show'
  )),
  type TEXT DEFAULT 'scheduled' CHECK (type IN ('walk_in', 'scheduled', 'follow_up', 'emergency')),
  reason TEXT,
  rejection_reason TEXT,
  owner_notes TEXT,
  vet_notes TEXT,
  health_log_id UUID REFERENCES health_logs(id),
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'urgent', 'emergency')),
  pet_weight TEXT,
  pet_age INT,
  pet_species TEXT,
  previous_medications TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Patient Queue
CREATE TABLE IF NOT EXISTS patient_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vet_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  queue_position INT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'completed', 'skipped')),
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  estimated_wait_minutes INT,
  is_walk_in BOOLEAN DEFAULT false,
  is_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Consultations
CREATE TABLE IF NOT EXISTS consultations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  vet_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  ai_preliminary_notes TEXT,
  breed_risk_alerts JSONB,
  weight_kg DECIMAL(5,2),
  temperature_c DECIMAL(4,1),
  heart_rate INT,
  respiratory_rate INT,
  body_condition_score INT CHECK (body_condition_score BETWEEN 1 AND 9),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'needs_followup')),
  follow_up_date DATE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  rating_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  vet_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  vet_name TEXT,
  clinic_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'superseded')),
  notes TEXT,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Prescription Items
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  route TEXT DEFAULT 'Oral',
  instructions TEXT,
  reminder_times TIME[],
  is_active BOOLEAN DEFAULT true,
  started_at DATE DEFAULT CURRENT_DATE,
  ends_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Medication Adherence
CREATE TABLE IF NOT EXISTS medication_adherence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prescription_item_id UUID REFERENCES prescription_items(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'skipped', 'late')),
  taken_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN (
    'info', 'prescription', 'appointment_request', 'appointment_approved',
    'appointment_rejected', 'follow_up', 'alert', 'reminder',
    'emergency', 'medication', 'referral', 'rating_request'
  )),
  is_read BOOLEAN DEFAULT false,
  action_type TEXT,
  reference_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referring_vet_id UUID REFERENCES veterinarians(id),
  referred_to_vet_id UUID REFERENCES veterinarians(id),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'emergency')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  notes TEXT,
  consultation_id UUID REFERENCES consultations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Pre-Visit Forms
CREATE TABLE IF NOT EXISTS pre_visit_forms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  symptoms JSONB,
  appetite_change TEXT,
  behavior_change TEXT,
  last_meal TIMESTAMPTZ,
  recent_medications TEXT,
  additional_notes TEXT,
  attachments TEXT[],
  filled_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Historical Weight Tracking
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- PART 2: ENABLE ROW LEVEL SECURITY & CREATE POLICIES
-- ============================================================

-- A. Owner-side tables
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Pets (owner CRUD)
DROP POLICY IF EXISTS "Users can view their own pets" ON pets;
CREATE POLICY "Users can view their own pets" ON pets FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own pets" ON pets;
CREATE POLICY "Users can insert their own pets" ON pets FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own pets" ON pets;
CREATE POLICY "Users can update their own pets" ON pets FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own pets" ON pets;
CREATE POLICY "Users can delete their own pets" ON pets FOR DELETE USING (auth.uid() = owner_id);

-- Health Logs (owner CRU)
DROP POLICY IF EXISTS "Users can view their own logs" ON health_logs;
CREATE POLICY "Users can view their own logs" ON health_logs FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own logs" ON health_logs;
CREATE POLICY "Users can insert their own logs" ON health_logs FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own logs" ON health_logs;
CREATE POLICY "Users can update their own logs" ON health_logs FOR UPDATE USING (auth.uid() = owner_id);

-- Reminders (owner CRUD)
DROP POLICY IF EXISTS "Users can view their own reminders" ON reminders;
CREATE POLICY "Users can view their own reminders" ON reminders FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own reminders" ON reminders;
CREATE POLICY "Users can insert their own reminders" ON reminders FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own reminders" ON reminders;
CREATE POLICY "Users can update their own reminders" ON reminders FOR UPDATE USING (auth.uid() = owner_id);

-- Weight Logs (owner CRUD)
DROP POLICY IF EXISTS "Users can view their own weight logs" ON weight_logs;
CREATE POLICY "Users can view their own weight logs" ON weight_logs FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own weight logs" ON weight_logs;
CREATE POLICY "Users can insert their own weight logs" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own weight logs" ON weight_logs;
CREATE POLICY "Users can update their own weight logs" ON weight_logs FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own weight logs" ON weight_logs;
CREATE POLICY "Users can delete their own weight logs" ON weight_logs FOR DELETE USING (auth.uid() = owner_id);

-- Vets can view weight logs for their patients
DROP POLICY IF EXISTS "Vets can view weight logs for their patients" ON weight_logs;
CREATE POLICY "Vets can view weight logs for their patients" ON weight_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.pet_id = weight_logs.pet_id AND a.vet_id = auth.uid()
    )
  );


-- B. FOOD ANALYSES
DROP POLICY IF EXISTS "Users can view their own food analyses" ON food_analyses;
CREATE POLICY "Users can view their own food analyses" ON food_analyses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = food_analyses.pet_id AND pets.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own food analyses" ON food_analyses;
CREATE POLICY "Users can insert their own food analyses" ON food_analyses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = food_analyses.pet_id AND pets.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their own food analyses" ON food_analyses;
CREATE POLICY "Users can delete their own food analyses" ON food_analyses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = food_analyses.pet_id AND pets.owner_id = auth.uid())
  );


-- C. PET DOCUMENTS
DROP POLICY IF EXISTS "Users can view their own pet documents" ON pet_documents;
CREATE POLICY "Users can view their own pet documents" ON pet_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = pet_documents.pet_id AND pets.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own pet documents" ON pet_documents;
CREATE POLICY "Users can insert their own pet documents" ON pet_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = pet_documents.pet_id AND pets.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their own pet documents" ON pet_documents;
CREATE POLICY "Users can delete their own pet documents" ON pet_documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = pet_documents.pet_id AND pets.owner_id = auth.uid())
  );


-- D. USER PROFILES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON user_profiles;
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);


-- E. VETERINARIANS
ALTER TABLE veterinarians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vet profiles are viewable by everyone" ON veterinarians;
CREATE POLICY "Vet profiles are viewable by everyone" ON veterinarians
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vets can insert their own profile" ON veterinarians;
CREATE POLICY "Vets can insert their own profile" ON veterinarians
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Vets can update their own profile" ON veterinarians;
CREATE POLICY "Vets can update their own profile" ON veterinarians
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Vets can delete their own profile" ON veterinarians;
CREATE POLICY "Vets can delete their own profile" ON veterinarians
  FOR DELETE USING (auth.uid() = id);


-- F. VET TIME SLOTS
ALTER TABLE vet_time_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Time slots are viewable by everyone" ON vet_time_slots;
CREATE POLICY "Time slots are viewable by everyone" ON vet_time_slots
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vets can insert their own time slots" ON vet_time_slots;
CREATE POLICY "Vets can insert their own time slots" ON vet_time_slots
  FOR INSERT WITH CHECK (auth.uid() = vet_id);

DROP POLICY IF EXISTS "Vets can update their own time slots" ON vet_time_slots;
CREATE POLICY "Vets can update their own time slots" ON vet_time_slots
  FOR UPDATE USING (auth.uid() = vet_id);

DROP POLICY IF EXISTS "Vets can delete their own time slots" ON vet_time_slots;
CREATE POLICY "Vets can delete their own time slots" ON vet_time_slots
  FOR DELETE USING (auth.uid() = vet_id);


-- G. APPOINTMENTS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
CREATE POLICY "Users can view their own appointments" ON appointments
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = vet_id);

DROP POLICY IF EXISTS "Owners can create appointments" ON appointments;
CREATE POLICY "Owners can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Participants can update appointments" ON appointments;
CREATE POLICY "Participants can update appointments" ON appointments
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = vet_id);

DROP POLICY IF EXISTS "Owners can delete their own appointments" ON appointments;
CREATE POLICY "Owners can delete their own appointments" ON appointments
  FOR DELETE USING (auth.uid() = owner_id);


-- H. PATIENT QUEUE
ALTER TABLE patient_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Queue visible to vet and owner" ON patient_queue;
CREATE POLICY "Queue visible to vet and owner" ON patient_queue
  FOR SELECT USING (auth.uid() = vet_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Vets can manage their queue" ON patient_queue;
CREATE POLICY "Vets can manage their queue" ON patient_queue
  FOR INSERT WITH CHECK (auth.uid() = vet_id);

DROP POLICY IF EXISTS "Vets can update their queue" ON patient_queue;
CREATE POLICY "Vets can update their queue" ON patient_queue
  FOR UPDATE USING (auth.uid() = vet_id);

DROP POLICY IF EXISTS "Vets can delete from their queue" ON patient_queue;
CREATE POLICY "Vets can delete from their queue" ON patient_queue
  FOR DELETE USING (auth.uid() = vet_id);


-- I. CONSULTATIONS (SOAP NOTES)
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultation visible to vet and owner" ON consultations;
CREATE POLICY "Consultation visible to vet and owner" ON consultations
  FOR SELECT USING (auth.uid() = vet_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Vets can create consultations" ON consultations;
CREATE POLICY "Vets can create consultations" ON consultations
  FOR INSERT WITH CHECK (auth.uid() = vet_id);

DROP POLICY IF EXISTS "Vets can update their consultations" ON consultations;
CREATE POLICY "Vets can update their consultations" ON consultations
  FOR UPDATE USING (auth.uid() = vet_id);

DROP POLICY IF EXISTS "Owners can rate consultations" ON consultations;
CREATE POLICY "Owners can rate consultations" ON consultations
  FOR UPDATE USING (auth.uid() = owner_id);


-- J. PRESCRIPTIONS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prescriptions visible to vet and owner" ON prescriptions;
CREATE POLICY "Prescriptions visible to vet and owner" ON prescriptions
  FOR SELECT USING (auth.uid() = vet_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Vets can create prescriptions" ON prescriptions;
CREATE POLICY "Vets can create prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (auth.uid() = vet_id);

DROP POLICY IF EXISTS "Vets can update their prescriptions" ON prescriptions;
CREATE POLICY "Vets can update their prescriptions" ON prescriptions
  FOR UPDATE USING (auth.uid() = vet_id);

DROP POLICY IF EXISTS "Vets can delete their prescriptions" ON prescriptions;
CREATE POLICY "Vets can delete their prescriptions" ON prescriptions
  FOR DELETE USING (auth.uid() = vet_id);


-- K. PRESCRIPTION ITEMS
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prescription items viewable by participants" ON prescription_items;
CREATE POLICY "Prescription items viewable by participants" ON prescription_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_items.prescription_id
        AND (p.vet_id = auth.uid() OR p.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Vets can insert prescription items" ON prescription_items;
CREATE POLICY "Vets can insert prescription items" ON prescription_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_items.prescription_id
        AND p.vet_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vets can update prescription items" ON prescription_items;
CREATE POLICY "Vets can update prescription items" ON prescription_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_items.prescription_id
        AND p.vet_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vets can delete prescription items" ON prescription_items;
CREATE POLICY "Vets can delete prescription items" ON prescription_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_items.prescription_id
        AND p.vet_id = auth.uid()
    )
  );


-- L. MEDICATION ADHERENCE
ALTER TABLE medication_adherence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Adherence visible to owner and vet" ON medication_adherence;
CREATE POLICY "Adherence visible to owner and vet" ON medication_adherence
  FOR SELECT USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM prescription_items pi
      JOIN prescriptions p ON p.id = pi.prescription_id
      WHERE pi.id = medication_adherence.prescription_item_id
        AND p.vet_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can insert adherence logs" ON medication_adherence;
CREATE POLICY "Owners can insert adherence logs" ON medication_adherence
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their adherence logs" ON medication_adherence;
CREATE POLICY "Owners can update their adherence logs" ON medication_adherence
  FOR UPDATE USING (auth.uid() = owner_id);


-- M. NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);


-- N. REFERRALS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Referral visible to all participants" ON referrals;
CREATE POLICY "Referral visible to all participants" ON referrals
  FOR SELECT USING (
    auth.uid() = referring_vet_id
    OR auth.uid() = referred_to_vet_id
    OR auth.uid() = owner_id
  );

DROP POLICY IF EXISTS "Referring vet can create referrals" ON referrals;
CREATE POLICY "Referring vet can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referring_vet_id);

DROP POLICY IF EXISTS "Vets can update referrals" ON referrals;
CREATE POLICY "Vets can update referrals" ON referrals
  FOR UPDATE USING (
    auth.uid() = referring_vet_id OR auth.uid() = referred_to_vet_id
  );

DROP POLICY IF EXISTS "Referring vet can delete referrals" ON referrals;
CREATE POLICY "Referring vet can delete referrals" ON referrals
  FOR DELETE USING (auth.uid() = referring_vet_id);


-- O. PRE-VISIT FORMS
ALTER TABLE pre_visit_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pre-visit forms visible to owner and vet" ON pre_visit_forms;
CREATE POLICY "Pre-visit forms visible to owner and vet" ON pre_visit_forms
  FOR SELECT USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = pre_visit_forms.appointment_id
        AND a.vet_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can insert pre-visit forms" ON pre_visit_forms;
CREATE POLICY "Owners can insert pre-visit forms" ON pre_visit_forms
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their pre-visit forms" ON pre_visit_forms;
CREATE POLICY "Owners can update their pre-visit forms" ON pre_visit_forms
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their pre-visit forms" ON pre_visit_forms;
CREATE POLICY "Owners can delete their pre-visit forms" ON pre_visit_forms
  FOR DELETE USING (auth.uid() = owner_id);


-- P. EXTRA: LET VETS READ PETS THEY ARE TREATING
DROP POLICY IF EXISTS "Vets can view pets they are treating" ON pets;
CREATE POLICY "Vets can view pets they are treating" ON pets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.pet_id = pets.id AND a.vet_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vets can view health logs for their patients" ON health_logs;
CREATE POLICY "Vets can view health logs for their patients" ON health_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.pet_id = health_logs.pet_id AND a.vet_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vets can update health logs for their patients" ON health_logs;
CREATE POLICY "Vets can update health logs for their patients" ON health_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.pet_id = health_logs.pet_id AND a.vet_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vets can view pet documents for their patients" ON pet_documents;
CREATE POLICY "Vets can view pet documents for their patients" ON pet_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.pet_id = pet_documents.pet_id AND a.vet_id = auth.uid()
    )
  );

-- ============================================================
-- PART 3: AUTOMATIC USER PROFILE PROVISIONING TRIGGERS
-- ============================================================
-- Ensures user_profiles table is populated seamlessly upon registration

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000'),
    COALESCE(new.raw_user_meta_data->>'role', 'owner')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution automatically keeps profiles populated
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
