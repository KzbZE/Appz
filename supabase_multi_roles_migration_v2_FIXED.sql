-- ==================================================
-- MIGRATION VERS SYSTÈME MULTI-RÔLES - VERSION CORRIGÉE
-- Architecture Doctolib-like avec négociation de dates
-- ==================================================

-- ==================================================
-- TABLE USERS ÉTENDUE
-- ==================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_practitioner_id ON public.profiles(practitioner_id);

-- ==================================================
-- TABLE APPOINTMENT_REQUESTS (Demandes de RDV avec négociation)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id BIGSERIAL PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Date demandée initialement par le patient
  requested_date TIMESTAMPTZ NOT NULL,

  -- Dates alternatives proposées (format JSON: [{date: "...", proposed_by: "PATIENT|PRACTITIONER"}])
  alternative_dates JSONB DEFAULT '[]'::jsonb,

  duration_min INTEGER DEFAULT 60,
  type TEXT NOT NULL CHECK (type IN ('CABINET', 'DOMICILE', 'STABLE', 'VISIO')),
  reason TEXT,
  notes TEXT,

  -- Statuts étendus pour la négociation
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN (
      'PENDING',                      -- En attente de réponse praticien
      'APPROVED',                     -- Approuvé par praticien
      'REJECTED',                     -- Refusé par praticien
      'CANCELLED',                    -- Annulé par patient
      'COUNTER_PROPOSAL_PRACTITIONER',-- Praticien propose autre date
      'COUNTER_PROPOSAL_PATIENT',     -- Patient contre-propose
      'EXPIRED'                       -- Expiré (pas de réponse)
    )
  ),

  practitioner_response TEXT,
  patient_response TEXT,

  -- Historique des échanges (JSON)
  negotiation_history JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_appointment_requests_patient ON public.appointment_requests(patient_id);
CREATE INDEX idx_appointment_requests_practitioner ON public.appointment_requests(practitioner_id);
CREATE INDEX idx_appointment_requests_status ON public.appointment_requests(status);

-- RLS pour appointment_requests
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_view_own_requests" ON public.appointment_requests
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "practitioners_view_their_requests" ON public.appointment_requests
  FOR SELECT USING (auth.uid() = practitioner_id);

CREATE POLICY "admins_view_all_requests" ON public.appointment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "patients_create_requests" ON public.appointment_requests
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "practitioners_update_their_requests" ON public.appointment_requests
  FOR UPDATE USING (auth.uid() = practitioner_id);

CREATE POLICY "patients_update_their_requests" ON public.appointment_requests
  FOR UPDATE USING (auth.uid() = patient_id);

-- ==================================================
-- MODIFICATION TABLE APPOINTMENTS
-- ==================================================

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS request_id BIGINT REFERENCES public.appointment_requests(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Mettre practitioner_id à user_id pour les données existantes SI la colonne existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='user_id') THEN
    UPDATE public.appointments SET practitioner_id = user_id WHERE practitioner_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'UNAVAILABLE', 'PENDING_PATIENT', 'PENDING_PRACTITIONER'));

CREATE INDEX IF NOT EXISTS idx_appointments_practitioner ON public.appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_request ON public.appointments(request_id);

-- RLS pour appointments (multi-rôles)
DROP POLICY IF EXISTS "users_select_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "users_insert_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "users_update_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "users_delete_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "practitioners_view_appointments" ON public.appointments;
DROP POLICY IF EXISTS "patients_view_appointments" ON public.appointments;
DROP POLICY IF EXISTS "admins_view_all_appointments" ON public.appointments;
DROP POLICY IF EXISTS "practitioners_create_appointments" ON public.appointments;
DROP POLICY IF EXISTS "practitioners_update_appointments" ON public.appointments;
DROP POLICY IF EXISTS "patients_cancel_appointments" ON public.appointments;

CREATE POLICY "practitioners_view_appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() = practitioner_id OR
    (user_id IS NOT NULL AND auth.uid() = user_id)
  );

CREATE POLICY "patients_view_appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = appointments.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "admins_view_all_appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "practitioners_create_appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    auth.uid() = practitioner_id OR
    (user_id IS NOT NULL AND auth.uid() = user_id)
  );

CREATE POLICY "practitioners_update_appointments" ON public.appointments
  FOR UPDATE USING (
    auth.uid() = practitioner_id OR
    (user_id IS NOT NULL AND auth.uid() = user_id)
  );

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

-- ⚠️ CORRECTION: Ajouter practitioner_id comme NULLABLE d'abord
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mettre practitioner_id à user_id pour les données existantes (si user_id existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='user_id') THEN
    UPDATE public.patients SET practitioner_id = user_id WHERE practitioner_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patients_user_id_link ON public.patients(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_practitioner ON public.patients(practitioner_id);

-- RLS pour patients (multi-rôles)
DROP POLICY IF EXISTS "users_select_own_patients" ON public.patients;
DROP POLICY IF EXISTS "users_insert_own_patients" ON public.patients;
DROP POLICY IF EXISTS "users_update_own_patients" ON public.patients;
DROP POLICY IF EXISTS "users_delete_own_patients" ON public.patients;
DROP POLICY IF EXISTS "practitioners_view_patients" ON public.patients;
DROP POLICY IF EXISTS "patients_view_own_record" ON public.patients;
DROP POLICY IF EXISTS "admins_view_all_patients" ON public.patients;
DROP POLICY IF EXISTS "practitioners_create_patients" ON public.patients;
DROP POLICY IF EXISTS "practitioners_update_patients" ON public.patients;

CREATE POLICY "practitioners_view_patients" ON public.patients
  FOR SELECT USING (auth.uid() = practitioner_id OR auth.uid() = user_id);

CREATE POLICY "patients_view_own_record" ON public.patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_view_all_patients" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "practitioners_create_patients" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id OR auth.uid() = user_id);

CREATE POLICY "practitioners_update_patients" ON public.patients
  FOR UPDATE USING (auth.uid() = practitioner_id OR auth.uid() = user_id);

-- ==================================================
-- TABLE CONSULTATION_REPORTS (Comptes rendus)
-- ==================================================

CREATE TABLE IF NOT EXISTS public.consultation_reports (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT REFERENCES public.appointments(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_consultation_reports_appointment ON public.consultation_reports(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultation_reports_patient ON public.consultation_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_reports_practitioner ON public.consultation_reports(practitioner_id);

-- RLS
ALTER TABLE public.consultation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "practitioners_view_reports" ON public.consultation_reports;
DROP POLICY IF EXISTS "patients_view_own_reports" ON public.consultation_reports;
DROP POLICY IF EXISTS "admins_view_all_reports" ON public.consultation_reports;
DROP POLICY IF EXISTS "practitioners_create_reports" ON public.consultation_reports;
DROP POLICY IF EXISTS "practitioners_update_reports" ON public.consultation_reports;

CREATE POLICY "practitioners_view_reports" ON public.consultation_reports
  FOR SELECT USING (auth.uid() = practitioner_id);

CREATE POLICY "patients_view_own_reports" ON public.consultation_reports
  FOR SELECT USING (
    is_visible_to_patient = true AND
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = consultation_reports.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "admins_view_all_reports" ON public.consultation_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "practitioners_create_reports" ON public.consultation_reports
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id);

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
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='user_id') THEN
    UPDATE public.invoices SET practitioner_id = user_id WHERE practitioner_id IS NULL;
  END IF;
END $$;

-- RLS pour invoices (multi-rôles)
DROP POLICY IF EXISTS "users_select_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "users_insert_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "users_update_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "users_delete_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "practitioners_view_invoices" ON public.invoices;
DROP POLICY IF EXISTS "patients_view_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "admins_view_all_invoices" ON public.invoices;
DROP POLICY IF EXISTS "practitioners_create_invoices" ON public.invoices;
DROP POLICY IF EXISTS "practitioners_update_invoices" ON public.invoices;

CREATE POLICY "practitioners_view_invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = practitioner_id OR auth.uid() = user_id);

CREATE POLICY "patients_view_own_invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = patient_user_id);

CREATE POLICY "admins_view_all_invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "practitioners_create_invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id OR auth.uid() = user_id);

CREATE POLICY "practitioners_update_invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = practitioner_id OR auth.uid() = user_id);

-- ==================================================
-- TRIGGERS
-- ==================================================

-- Créer la fonction handle_updated_at si elle n'existe pas
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_appointment_requests_updated ON public.appointment_requests;
CREATE TRIGGER on_appointment_requests_updated
  BEFORE UPDATE ON public.appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_consultation_reports_updated ON public.consultation_reports;
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
    )
    ON CONFLICT DO NOTHING; -- Éviter les doublons
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_patient ON public.profiles;
CREATE TRIGGER on_profile_created_patient
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_patient_for_user();

-- ==================================================
-- TERMINÉ ! 🎉
-- ==================================================
