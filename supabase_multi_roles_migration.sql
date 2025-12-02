-- ==================================================
-- MIGRATION VERS SYSTÈME MULTI-RÔLES
-- Architecture Doctolib-like
-- ==================================================

-- ==================================================
-- TABLE USERS ÉTENDUE
-- ==================================================

-- On va utiliser la table profiles existante et l'améliorer
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_practitioner_id ON public.profiles(practitioner_id);

-- ==================================================
-- TABLE APPOINTMENT_REQUESTS (Demandes de RDV)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id BIGSERIAL PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_date TIMESTAMPTZ NOT NULL,
  duration_min INTEGER DEFAULT 60,
  type TEXT NOT NULL CHECK (type IN ('CABINET', 'DOMICILE', 'STABLE', 'VISIO')),
  reason TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  practitioner_response TEXT,
  alternative_dates JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_appointment_requests_patient ON public.appointment_requests(patient_id);
CREATE INDEX idx_appointment_requests_practitioner ON public.appointment_requests(practitioner_id);
CREATE INDEX idx_appointment_requests_status ON public.appointment_requests(status);

-- RLS pour appointment_requests
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Patients voient leurs propres demandes
CREATE POLICY "patients_view_own_requests" ON public.appointment_requests
  FOR SELECT USING (auth.uid() = patient_id);

-- Praticiens voient les demandes qui leur sont adressées
CREATE POLICY "practitioners_view_their_requests" ON public.appointment_requests
  FOR SELECT USING (auth.uid() = practitioner_id);

-- Admins voient tout
CREATE POLICY "admins_view_all_requests" ON public.appointment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Patients peuvent créer des demandes
CREATE POLICY "patients_create_requests" ON public.appointment_requests
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Praticiens peuvent mettre à jour les demandes qui leur sont adressées
CREATE POLICY "practitioners_update_their_requests" ON public.appointment_requests
  FOR UPDATE USING (auth.uid() = practitioner_id);

-- Patients peuvent annuler leurs demandes
CREATE POLICY "patients_cancel_their_requests" ON public.appointment_requests
  FOR UPDATE USING (auth.uid() = patient_id AND status = 'PENDING');

-- ==================================================
-- MODIFICATION TABLE APPOINTMENTS
-- ==================================================

-- Ajouter des champs pour le multi-rôles
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS request_id BIGINT REFERENCES public.appointment_requests(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Changer les statuts possibles
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'UNAVAILABLE', 'PENDING_PATIENT', 'PENDING_PRACTITIONER'));

-- Index
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner ON public.appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_request ON public.appointments(request_id);

-- RLS pour appointments (multi-rôles)
DROP POLICY IF EXISTS "users_select_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "users_insert_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "users_update_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "users_delete_own_appointments" ON public.appointments;

-- Praticiens voient leurs rendez-vous
CREATE POLICY "practitioners_view_appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() = practitioner_id OR auth.uid() = user_id
  );

-- Patients voient leurs rendez-vous (via patient_id qui correspond à auth.uid() quand c'est un patient)
CREATE POLICY "patients_view_appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = appointments.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Admins voient tout
CREATE POLICY "admins_view_all_appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Praticiens peuvent créer des rendez-vous
CREATE POLICY "practitioners_create_appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    auth.uid() = practitioner_id OR auth.uid() = user_id
  );

-- Praticiens peuvent modifier leurs rendez-vous
CREATE POLICY "practitioners_update_appointments" ON public.appointments
  FOR UPDATE USING (
    auth.uid() = practitioner_id OR auth.uid() = user_id
  );

-- Patients peuvent annuler leurs rendez-vous
CREATE POLICY "patients_cancel_appointments" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = appointments.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- ==================================================
-- MODIFICATION TABLE PATIENTS
-- ==================================================

-- Lier les patients aux users (certains patients ont un compte, d'autres non)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mettre practitioner_id à user_id pour les données existantes (temporaire)
UPDATE public.patients SET practitioner_id = user_id WHERE practitioner_id IS NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_patients_user_id_link ON public.patients(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_practitioner ON public.patients(practitioner_id);

-- RLS pour patients (multi-rôles)
DROP POLICY IF EXISTS "users_select_own_patients" ON public.patients;
DROP POLICY IF EXISTS "users_insert_own_patients" ON public.patients;
DROP POLICY IF EXISTS "users_update_own_patients" ON public.patients;
DROP POLICY IF EXISTS "users_delete_own_patients" ON public.patients;

-- Praticiens voient leurs patients
CREATE POLICY "practitioners_view_patients" ON public.patients
  FOR SELECT USING (auth.uid() = practitioner_id);

-- Patients voient leur propre fiche
CREATE POLICY "patients_view_own_record" ON public.patients
  FOR SELECT USING (auth.uid() = user_id);

-- Admins voient tout
CREATE POLICY "admins_view_all_patients" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Praticiens peuvent créer des patients
CREATE POLICY "practitioners_create_patients" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id);

-- Praticiens peuvent modifier leurs patients
CREATE POLICY "practitioners_update_patients" ON public.patients
  FOR UPDATE USING (auth.uid() = practitioner_id);

-- ==================================================
-- TABLE CONSULTATION_REPORTS (Comptes rendus)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.consultation_reports (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id BIGINT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  diagnosis TEXT,
  treatment TEXT,
  recommendations TEXT,
  next_appointment_date TIMESTAMPTZ,
  attachments JSONB,
  is_visible_to_patient BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_consultation_reports_appointment ON public.consultation_reports(appointment_id);
CREATE INDEX idx_consultation_reports_patient ON public.consultation_reports(patient_id);
CREATE INDEX idx_consultation_reports_practitioner ON public.consultation_reports(practitioner_id);

-- RLS
ALTER TABLE public.consultation_reports ENABLE ROW LEVEL SECURITY;

-- Praticiens voient leurs comptes rendus
CREATE POLICY "practitioners_view_reports" ON public.consultation_reports
  FOR SELECT USING (auth.uid() = practitioner_id);

-- Patients voient leurs comptes rendus (si visible)
CREATE POLICY "patients_view_own_reports" ON public.consultation_reports
  FOR SELECT USING (
    is_visible_to_patient = true AND
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = consultation_reports.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Admins voient tout
CREATE POLICY "admins_view_all_reports" ON public.consultation_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Praticiens peuvent créer des comptes rendus
CREATE POLICY "practitioners_create_reports" ON public.consultation_reports
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id);

-- Praticiens peuvent modifier leurs comptes rendus
CREATE POLICY "practitioners_update_reports" ON public.consultation_reports
  FOR UPDATE USING (auth.uid() = practitioner_id);

-- ==================================================
-- MODIFICATION TABLE INVOICES
-- ==================================================

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS patient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'PARTIAL', 'PENDING', 'REFUNDED'));
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Mettre practitioner_id à user_id pour les données existantes
UPDATE public.invoices SET practitioner_id = user_id WHERE practitioner_id IS NULL;

-- RLS pour invoices (multi-rôles)
DROP POLICY IF EXISTS "users_select_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "users_insert_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "users_update_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "users_delete_own_invoices" ON public.invoices;

-- Praticiens voient leurs factures
CREATE POLICY "practitioners_view_invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = practitioner_id);

-- Patients voient leurs factures
CREATE POLICY "patients_view_own_invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = patient_user_id);

-- Admins voient tout
CREATE POLICY "admins_view_all_invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Praticiens peuvent créer des factures
CREATE POLICY "practitioners_create_invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id);

-- Praticiens peuvent modifier leurs factures
CREATE POLICY "practitioners_update_invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = practitioner_id);

-- ==================================================
-- TRIGGERS
-- ==================================================

-- Trigger pour updated_at sur appointment_requests
CREATE TRIGGER on_appointment_requests_updated
  BEFORE UPDATE ON public.appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pour updated_at sur consultation_reports
CREATE TRIGGER on_consultation_reports_updated
  BEFORE UPDATE ON public.consultation_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==================================================
-- FONCTION : Créer automatiquement un patient quand un user patient est créé
-- ==================================================

CREATE OR REPLACE FUNCTION public.create_patient_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est un patient, créer automatiquement sa fiche patient
  IF NEW.role = 'PATIENT' AND NEW.practitioner_id IS NOT NULL THEN
    INSERT INTO public.patients (
      user_id,
      practitioner_id,
      name,
      email,
      phone,
      type,
      location,
      address
    ) VALUES (
      NEW.id,
      NEW.practitioner_id,
      NEW.name,
      NEW.email,
      NEW.phone,
      'HUMAN',
      'Cabinet',
      NEW.address
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un patient
DROP TRIGGER IF EXISTS on_profile_created_patient ON public.profiles;
CREATE TRIGGER on_profile_created_patient
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_patient_for_user();

-- ==================================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ==================================================

-- Créer un admin de test (commentez si vous ne voulez pas)
-- INSERT INTO auth.users (email, encrypted_password)
-- VALUES ('admin@theraflow.com', crypt('Admin1234!', gen_salt('bf')));

-- ==================================================
-- TERMINÉ ! 🎉
-- ==================================================
