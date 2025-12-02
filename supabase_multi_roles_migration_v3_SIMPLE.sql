-- ==================================================
-- MIGRATION MULTI-RÔLES - VERSION 3 (ULTRA-SIMPLIFIÉE)
-- Architecture Doctolib avec négociation de dates
-- ==================================================

-- ==================================================
-- 1. EXTENSION PROFILES
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
-- 2. TABLE APPOINTMENT_REQUESTS (Nouvelle table)
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

DROP POLICY IF EXISTS "admins_view_all_requests" ON public.appointment_requests;
CREATE POLICY "admins_view_all_requests" ON public.appointment_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

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
-- 3. EXTENSION APPOINTMENTS
-- ==================================================

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS request_id BIGINT REFERENCES public.appointment_requests(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'UNAVAILABLE', 'PENDING_PATIENT', 'PENDING_PRACTITIONER'));

CREATE INDEX IF NOT EXISTS idx_appointments_practitioner ON public.appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_request ON public.appointments(request_id);

-- RLS
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
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
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
-- 4. EXTENSION PATIENTS
-- ==================================================

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_patients_user_id_link ON public.patients(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_practitioner ON public.patients(practitioner_id);

-- RLS
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
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "practitioners_create_patients" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id OR auth.uid() = user_id);

CREATE POLICY "practitioners_update_patients" ON public.patients
  FOR UPDATE USING (auth.uid() = practitioner_id OR auth.uid() = user_id);

-- ==================================================
-- 5. TABLE CONSULTATION_REPORTS (Nouvelle table)
-- ==================================================

DROP TABLE IF EXISTS public.consultation_reports CASCADE;

CREATE TABLE public.consultation_reports (
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

CREATE INDEX idx_consultation_reports_appointment ON public.consultation_reports(appointment_id);
CREATE INDEX idx_consultation_reports_patient ON public.consultation_reports(patient_id);
CREATE INDEX idx_consultation_reports_practitioner ON public.consultation_reports(practitioner_id);

-- RLS
ALTER TABLE public.consultation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "practitioners_view_reports" ON public.consultation_reports;
CREATE POLICY "practitioners_view_reports" ON public.consultation_reports
  FOR SELECT USING (auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "patients_view_own_reports" ON public.consultation_reports;
CREATE POLICY "patients_view_own_reports" ON public.consultation_reports
  FOR SELECT USING (
    is_visible_to_patient = true AND
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = consultation_reports.patient_id
      AND patients.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admins_view_all_reports" ON public.consultation_reports;
CREATE POLICY "admins_view_all_reports" ON public.consultation_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "practitioners_create_reports" ON public.consultation_reports;
CREATE POLICY "practitioners_create_reports" ON public.consultation_reports
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id);

DROP POLICY IF EXISTS "practitioners_update_reports" ON public.consultation_reports;
CREATE POLICY "practitioners_update_reports" ON public.consultation_reports
  FOR UPDATE USING (auth.uid() = practitioner_id);

-- ==================================================
-- 6. EXTENSION INVOICES
-- ==================================================

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS patient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'PARTIAL', 'PENDING', 'REFUNDED'));
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- RLS
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
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "practitioners_create_invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id OR auth.uid() = user_id);

CREATE POLICY "practitioners_update_invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = practitioner_id OR auth.uid() = user_id);

-- ==================================================
-- 7. TRIGGERS
-- ==================================================

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
-- ✅ MIGRATION TERMINÉE !
-- ==================================================

-- NOTES IMPORTANTES :
-- 1. Les colonnes practitioner_id dans patients et appointments sont NULLABLES
-- 2. Vous devrez mettre à jour manuellement ces colonnes pour les données existantes
-- 3. Pour patients existants : UPDATE patients SET practitioner_id = user_id WHERE practitioner_id IS NULL;
-- 4. Pour appointments existants : UPDATE appointments SET practitioner_id = user_id WHERE practitioner_id IS NULL;
