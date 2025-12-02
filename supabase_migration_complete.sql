-- ================================================== -- SCRIPT SQL COMPLET POUR MIGRER VERS SUPABASE
-- Toutes les tables avec Row Level Security (RLS)
-- ==================================================

-- ==================================================
-- NETTOYER LES ANCIENNES TABLES
-- ==================================================

DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.recurring_invoices CASCADE;

-- ==================================================
-- TABLE 1 : PATIENTS
-- ==================================================

CREATE TABLE public.patients (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('HUMAN', 'EQUINE', 'CANINE')),
  location TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  last_visit TIMESTAMPTZ,
  avatar_url TEXT,
  medical_history JSONB,
  distance_km NUMERIC,
  custom_tariffs JSONB,
  tags TEXT[],
  notes TEXT,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_created_at ON public.patients(created_at DESC);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_patients" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_patients" ON public.patients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_patients" ON public.patients FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- TABLE 2 : APPOINTMENTS (Rendez-vous)
-- ==================================================

CREATE TABLE public.appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'UNAVAILABLE')),
  type TEXT NOT NULL CHECK (type IN ('CABINET', 'DOMICILE', 'STABLE', 'BLOCK')),
  notes TEXT,
  weather JSONB,
  price NUMERIC DEFAULT 0,
  travel_fee NUMERIC,
  distance_km NUMERIC,
  travel_duration_min INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time DESC);
CREATE INDEX idx_appointments_status ON public.appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_appointments" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- TABLE 3 : INVOICES (Factures)
-- ==================================================

CREATE TABLE public.invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  patient_name TEXT NOT NULL,
  amount_ht NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC NOT NULL DEFAULT 0,
  amount_ttc NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'PARTIAL')),
  items JSONB,
  reminder_sent_at TIMESTAMPTZ,
  reminders JSONB,
  payments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_date ON public.invoices(date DESC);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_number ON public.invoices(number);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- TABLE 4 : EXPENSES (Dépenses)
-- ==================================================

CREATE TABLE public.expenses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('CARBURANT', 'MATERIEL', 'FORMATION', 'ASSURANCES', 'LOYER', 'AUTRE')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX idx_expenses_category ON public.expenses(category);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- TABLE 5 : SESSIONS (Séances)
-- ==================================================

CREATE TABLE public.sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id BIGINT REFERENCES public.appointments(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  anamnesis JSONB,
  tensions JSONB,
  treatment_notes TEXT,
  exercises TEXT[],
  documents JSONB,
  price NUMERIC DEFAULT 0,
  practitioner_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_patient_id ON public.sessions(patient_id);
CREATE INDEX idx_sessions_appointment_id ON public.sessions(appointment_id);
CREATE INDEX idx_sessions_date ON public.sessions(date DESC);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- TABLE 6 : SETTINGS (Paramètres)
-- ==================================================

CREATE TABLE public.settings (
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

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_settings" ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- TABLE 7 : RECURRING INVOICES (Factures récurrentes)
-- ==================================================

CREATE TABLE public.recurring_invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  subscription_type TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
  amount_ht NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC NOT NULL DEFAULT 0,
  items JSONB,
  start_date TIMESTAMPTZ NOT NULL,
  next_due_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_generated_date TIMESTAMPTZ,
  total_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_recurring_invoices_user_id ON public.recurring_invoices(user_id);
CREATE INDEX idx_recurring_invoices_next_due_date ON public.recurring_invoices(next_due_date);
CREATE INDEX idx_recurring_invoices_is_active ON public.recurring_invoices(is_active);

ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_recurring_invoices" ON public.recurring_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_recurring_invoices" ON public.recurring_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_recurring_invoices" ON public.recurring_invoices FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_recurring_invoices" ON public.recurring_invoices FOR DELETE USING (auth.uid() = user_id);

-- ==================================================
-- FONCTION : Mise à jour automatique de updated_at
-- ==================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- TRIGGERS : Appliquer handle_updated_at à toutes les tables
-- ==================================================

CREATE TRIGGER on_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_sessions_updated BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_recurring_invoices_updated BEFORE UPDATE ON public.recurring_invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==================================================
-- FONCTION : Créer les settings par défaut pour nouveaux utilisateurs
-- ==================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings (user_id, app_name, practitioner_name, km_rate, default_tariffs)
  VALUES (
    NEW.id,
    'TheraFlow',
    COALESCE(NEW.raw_user_meta_data->>'name', 'Praticien'),
    0.5,
    '{"HUMAN_KINESIO": 0, "EQUINE_KINESIO": 0, "CANINE_KINESIO": 0, "MASSAGE": 0}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- TRIGGER : Créer settings automatiquement pour nouveaux utilisateurs
-- ==================================================

DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();

-- ==================================================
-- TERMINÉ ! 🎉
-- ==================================================
