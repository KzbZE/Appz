-- ==================================================
-- MIGRATION SUPABASE V4 - COMPLÈTE ET FINALE
-- Architecture Doctolib multi-rôles avec toutes les tables
-- ==================================================

-- ==================================================
-- 1. TABLE PROFILES (CRITIQUE - Manquait dans v3!)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'PRACTITIONER', 'PATIENT', 'ASSISTANT')),
  phone TEXT,
  birth_date DATE,
  address TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  practitioner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_practitioner_id ON public.profiles(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'PATIENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies pour profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Patients can view practitioners" ON public.profiles;
CREATE POLICY "Patients can view practitioners" ON public.profiles
  FOR SELECT USING (role IN ('PRACTITIONER', 'ADMIN'));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ==================================================
-- 2. TABLE PATIENTS
-- ==================================================

CREATE TABLE IF NOT EXISTS public.patients (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('HUMAN', 'EQUINE', 'CANINE')),
  location TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  lat NUMERIC,
  lng NUMERIC,
  phone TEXT,
  email TEXT,
  last_visit TIMESTAMPTZ,
  avatar_url TEXT,
  medical_history JSONB DEFAULT '{}'::jsonb,
  distance_km NUMERIC,
  custom_tariffs JSONB,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_type ON public.patients(type);

-- RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_patients" ON public.patients;
CREATE POLICY "users_select_own_patients" ON public.patients FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_patients" ON public.patients;
CREATE POLICY "users_insert_own_patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_patients" ON public.patients;
CREATE POLICY "users_update_own_patients" ON public.patients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_patients" ON public.patients;
CREATE POLICY "users_delete_own_patients" ON public.patients FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- 3. TABLE APPOINTMENTS
-- ==================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  duration_min INTEGER DEFAULT 60,
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'UNAVAILABLE')),
  type TEXT NOT NULL CHECK (type IN ('CABINET', 'DOMICILE', 'STABLE', 'BLOCK')),
  notes TEXT,
  weather JSONB,
  price NUMERIC DEFAULT 0,
  travel_fee NUMERIC,
  distance_km NUMERIC,
  travel_duration_min INTEGER,
  is_optimized_slot BOOLEAN DEFAULT false,
  google_event_id TEXT,
  request_id BIGINT,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_appointments" ON public.appointments;
CREATE POLICY "users_select_own_appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id OR auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "users_insert_own_appointments" ON public.appointments;
CREATE POLICY "users_insert_own_appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "users_update_own_appointments" ON public.appointments;
CREATE POLICY "users_update_own_appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "users_delete_own_appointments" ON public.appointments;
CREATE POLICY "users_delete_own_appointments" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- 4. TABLE APPOINTMENT_REQUESTS (Négociation RDV)
-- ==================================================

DROP TABLE IF EXISTS public.appointment_requests CASCADE;

CREATE TABLE public.appointment_requests (
  id BIGSERIAL PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  requested_date TIMESTAMPTZ NOT NULL,
  alternative_dates JSONB DEFAULT '[]'::jsonb,

  duration_min INTEGER DEFAULT 60,
  type TEXT NOT NULL CHECK (type IN ('CABINET', 'DOMICILE', 'STABLE', 'VISIO')),
  reason TEXT,
  notes TEXT,

  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
      'COUNTER_PROPOSAL_PRACTITIONER',
      'COUNTER_PROPOSAL_PATIENT',
      'EXPIRED'
    )
  ),

  practitioner_response TEXT,
  patient_response TEXT,
  negotiation_history JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_appointment_requests_patient ON public.appointment_requests(patient_id);
CREATE INDEX idx_appointment_requests_practitioner ON public.appointment_requests(practitioner_id);
CREATE INDEX idx_appointment_requests_status ON public.appointment_requests(status);

-- RLS
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_view_own_requests" ON public.appointment_requests;
CREATE POLICY "patients_view_own_requests" ON public.appointment_requests
  FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "practitioners_view_their_requests" ON public.appointment_requests;
CREATE POLICY "practitioners_view_their_requests" ON public.appointment_requests
  FOR SELECT USING (auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "patients_create_requests" ON public.appointment_requests;
CREATE POLICY "patients_create_requests" ON public.appointment_requests
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "practitioners_update_their_requests" ON public.appointment_requests;
CREATE POLICY "practitioners_update_their_requests" ON public.appointment_requests
  FOR UPDATE USING (auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "patients_update_their_requests" ON public.appointment_requests;
CREATE POLICY "patients_update_their_requests" ON public.appointment_requests
  FOR UPDATE USING (auth.uid() = patient_id);

-- ==================================================
-- 5. TABLE CONSULTATION_REPORTS (Comptes rendus)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.consultation_reports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id BIGINT REFERENCES public.appointments(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  observations TEXT,
  recommendations TEXT,
  next_appointment_date TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_consultation_reports_user_id ON public.consultation_reports(user_id);
CREATE INDEX idx_consultation_reports_patient_id ON public.consultation_reports(patient_id);
CREATE INDEX idx_consultation_reports_date ON public.consultation_reports(date);

-- RLS
ALTER TABLE public.consultation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_reports" ON public.consultation_reports;
CREATE POLICY "users_select_own_reports" ON public.consultation_reports FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_reports" ON public.consultation_reports;
CREATE POLICY "users_insert_own_reports" ON public.consultation_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_reports" ON public.consultation_reports;
CREATE POLICY "users_update_own_reports" ON public.consultation_reports FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_reports" ON public.consultation_reports;
CREATE POLICY "users_delete_own_reports" ON public.consultation_reports FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- 6. TABLE INVOICES
-- ==================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  patient_name TEXT NOT NULL,
  amount_ht NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC NOT NULL DEFAULT 0,
  amount_ttc NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'PARTIAL')),
  items JSONB DEFAULT '[]'::jsonb,
  reminder_sent_at TIMESTAMPTZ,
  reminders JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_date ON public.invoices(date);

-- RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_invoices" ON public.invoices;
CREATE POLICY "users_select_own_invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_invoices" ON public.invoices;
CREATE POLICY "users_insert_own_invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_invoices" ON public.invoices;
CREATE POLICY "users_update_own_invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_invoices" ON public.invoices;
CREATE POLICY "users_delete_own_invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- 7. TABLE EXPENSES
-- ==================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('CARBURANT', 'MATERIEL', 'FORMATION', 'ASSURANCES', 'LOYER', 'AUTRE')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);

-- RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_expenses" ON public.expenses;
CREATE POLICY "users_select_own_expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_expenses" ON public.expenses;
CREATE POLICY "users_insert_own_expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_expenses" ON public.expenses;
CREATE POLICY "users_update_own_expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_expenses" ON public.expenses;
CREATE POLICY "users_delete_own_expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- 8. TABLE SETTINGS
-- ==================================================

CREATE TABLE IF NOT EXISTS public.settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL DEFAULT 'TheraFlow',
  practitioner_name TEXT NOT NULL DEFAULT 'Praticien',
  cabinet_address TEXT,
  km_rate NUMERIC DEFAULT 0.5,
  default_tariffs JSONB,
  finance JSONB,
  social JSONB,
  branding JSONB,
  google JSONB,
  sms JSONB,
  survey JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_settings_user_id ON public.settings(user_id);

-- RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_settings" ON public.settings;
CREATE POLICY "users_select_own_settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_settings" ON public.settings;
CREATE POLICY "users_insert_own_settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_settings" ON public.settings;
CREATE POLICY "users_update_own_settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_settings" ON public.settings;
CREATE POLICY "users_delete_own_settings" ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- 9. TABLE SESSIONS (Dossiers de séances)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id BIGINT REFERENCES public.appointments(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  anamnesis JSONB DEFAULT '{}'::jsonb,
  tensions JSONB DEFAULT '[]'::jsonb,
  treatment_notes TEXT,
  exercises JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  price NUMERIC DEFAULT 0,
  practitioner_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_patient_id ON public.sessions(patient_id);
CREATE INDEX idx_sessions_date ON public.sessions(date);

-- RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_sessions" ON public.sessions;
CREATE POLICY "users_select_own_sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_sessions" ON public.sessions;
CREATE POLICY "users_insert_own_sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_sessions" ON public.sessions;
CREATE POLICY "users_update_own_sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_sessions" ON public.sessions;
CREATE POLICY "users_delete_own_sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- 10. TABLE SESSION_TEMPLATES
-- ==================================================

CREATE TABLE IF NOT EXISTS public.session_templates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  anamnesis JSONB DEFAULT '{}'::jsonb,
  treatment_plan TEXT,
  exercises JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_session_templates_user_id ON public.session_templates(user_id);

-- RLS
ALTER TABLE public.session_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_templates" ON public.session_templates;
CREATE POLICY "users_select_own_templates" ON public.session_templates FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_templates" ON public.session_templates;
CREATE POLICY "users_insert_own_templates" ON public.session_templates FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_templates" ON public.session_templates;
CREATE POLICY "users_update_own_templates" ON public.session_templates FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_templates" ON public.session_templates;
CREATE POLICY "users_delete_own_templates" ON public.session_templates FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- FIN DU SCRIPT - Version 4 Complète
-- ==================================================

-- Messages de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration V4 complète terminée!';
  RAISE NOTICE '📋 Tables créées: profiles, patients, appointments, appointment_requests, consultation_reports, invoices, expenses, settings, sessions, session_templates';
  RAISE NOTICE '🔒 RLS activé sur toutes les tables';
  RAISE NOTICE '🚀 Votre application est prête!';
END $$;
