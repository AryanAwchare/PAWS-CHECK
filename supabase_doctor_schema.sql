-- ============================================================
-- PAWSCHECK DOCTOR PORTAL — SCHEMA MIGRATION
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. User Profiles (role tracking)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'veterinarian')),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Veterinarian Profiles
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

-- 3. Doctor Time Slots (calendar blocking)
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

-- 4. Appointments (with request/approval flow)
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

-- 5. Patient Queue
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

-- 6. Consultations (SOAP notes)
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

-- 7. Prescriptions (MULTI-VET)
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

-- 8. Prescription Items
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

-- 9. Medication Adherence Log
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

-- 10. Notifications
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

-- 11. Vet-to-Vet Referrals
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

-- 12. Pre-Visit Symptoms Form
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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_appointments_vet ON appointments(vet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_owner ON appointments(owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_queue_vet ON patient_queue(vet_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON patient_queue(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pet ON prescriptions(pet_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_vet ON prescriptions(vet_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_generic ON prescription_items(generic_name);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_adherence_item ON medication_adherence(prescription_item_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_vet_date ON vet_time_slots(vet_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_referrals_pet ON referrals(pet_id);

-- AUTO PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
