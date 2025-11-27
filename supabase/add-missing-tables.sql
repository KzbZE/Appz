-- =====================================================
-- AJOUT DES TABLES MANQUANTES - TheraFlow Supabase
-- =====================================================
-- Ce script ajoute les 3 tables manquantes au schéma Supabase
-- À exécuter dans le SQL Editor de Supabase
-- =====================================================

-- Table: appointment_requests
-- Gestion des demandes de rendez-vous des patients
CREATE TABLE IF NOT EXISTS appointment_requests (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  requested_start_time TIMESTAMP NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  type TEXT NOT NULL CHECK (type IN ('CABINET', 'DOMICILE', 'STABLE')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  notes TEXT,
  proposed_start_time TIMESTAMP,
  proposed_by TEXT CHECK (proposed_by IN ('PATIENT', 'PRACTITIONER')),
  history JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of AppointmentRequestHistoryItem
  patient_address TEXT,
  patient_lat NUMERIC(10,7),
  patient_lng NUMERIC(10,7),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: notifications
-- Gestion des notifications email/SMS
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('EMAIL', 'SMS', 'BOTH')),
  recipient TEXT NOT NULL, -- email ou numéro de téléphone
  subject TEXT, -- Pour les emails
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  sent_at TIMESTAMP,
  error TEXT,
  related_request_id BIGINT REFERENCES appointment_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES POUR PERFORMANCE
-- =====================================================

-- Appointment Requests
CREATE INDEX IF NOT EXISTS idx_appointment_requests_patient_id ON appointment_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_requested_start_time ON appointment_requests(requested_start_time);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_created_at ON appointment_requests(created_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_related_request_id ON notifications(related_request_id);

-- =====================================================
-- TRIGGERS POUR AUTO-UPDATE
-- =====================================================

-- Trigger pour appointment_requests
CREATE TRIGGER IF NOT EXISTS update_appointment_requests_updated_at
  BEFORE UPDATE ON appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- NOTE: notifications n'a pas de updated_at car c'est un log immutable

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès pour utilisateurs authentifiés
CREATE POLICY "Enable all for authenticated users" ON appointment_requests
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON notifications
  FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE appointment_requests IS 'Demandes de rendez-vous des patients avec système de proposition/contre-proposition';
COMMENT ON TABLE notifications IS 'File d''attente des notifications email/SMS à envoyer';

COMMENT ON COLUMN appointment_requests.history IS 'Historique JSON des échanges entre patient et praticien';
COMMENT ON COLUMN appointment_requests.proposed_start_time IS 'Créneau alternatif proposé si le créneau demandé n''est pas disponible';
COMMENT ON COLUMN notifications.related_request_id IS 'ID de la demande de RDV associée (si applicable)';

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Pour vérifier que les tables ont été créées correctement:
SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('appointment_requests', 'notifications')
ORDER BY table_name;

-- ✅ Vous devriez voir:
-- appointment_requests | 18 colonnes
-- notifications        | 9 colonnes
