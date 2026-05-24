-- 1. Table for Pet Profiles (allowing many pets per owner)
CREATE TABLE pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT DEFAULT 'Dog', -- Dog or Cat
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

-- 2. Table for the Generated B2B Triage Reports (Health Logs)
CREATE TABLE health_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_urls TEXT[], -- Primary images/videos (up to 4)
  risk_score INT,
  triage_tier TEXT CHECK (triage_tier IN ('HEALTHY','MONITOR','URGENT','EMERGENCY')),
  questionnaire_answers JSONB, -- The AI's "Symptom Bulletin" / user inputs
  critical_level_factors TEXT[], -- Extracted high-risk indicators
  detected_symptoms JSONB,
  ai_explanation TEXT,
  vet_summary TEXT,
  report_generated BOOLEAN DEFAULT false,
  pdf_report_url TEXT, -- Link to the finalized downloadable report
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Food Analyses
CREATE TABLE food_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  food_name TEXT,
  ingredients TEXT[],
  safety_status TEXT CHECK (safety_status IN ('Safe','Caution','Unsafe')),
  analysis_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Pet Documents
CREATE TABLE pet_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  document_url TEXT,
  document_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Existing Reminders Table update
CREATE TABLE reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  dueDate TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT DEFAULT 'normal',
  completed BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table for historical weight tracking
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
