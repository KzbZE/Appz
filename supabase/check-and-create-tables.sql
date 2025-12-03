-- =====================================================
-- VÉRIFIER ET CRÉER TOUTES LES TABLES MANQUANTES
-- =====================================================

-- Créer la table settings si elle n'existe pas
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  app_name TEXT NOT NULL DEFAULT 'TheraFlow',
  practitioner_name TEXT NOT NULL,
  cabinet_address TEXT NOT NULL,
  km_rate NUMERIC(10,2) NOT NULL DEFAULT 0.5,
  default_tariffs JSONB NOT NULL,
  finance JSONB,
  social JSONB,
  branding JSONB,
  google JSONB,
  sms JSONB,
  survey JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Créer appointment_requests si elle n'existe pas
CREATE TABLE IF NOT EXISTS appointment_requests (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  patient_address TEXT,
  patient_lat NUMERIC,
  patient_lng NUMERIC,
  requested_start_time TIMESTAMP NOT NULL,
  proposed_start_time TIMESTAMP,
  proposed_by TEXT,
  duration_min INTEGER NOT NULL DEFAULT 60,
  type TEXT NOT NULL CHECK (type IN ('CABINET', 'DOMICILE', 'STABLE')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PRACTITIONER_PROPOSED', 'PATIENT_PROPOSED', 'CONFIRMED', 'REJECTED')),
  notes TEXT,
  history JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Créer notifications si elle n'existe pas
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('EMAIL', 'SMS', 'BOTH')),
  recipient_email TEXT,
  recipient_phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  sent_at TIMESTAMP,
  related_request_id BIGINT,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Désactiver RLS sur ces tables
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Insérer un enregistrement par défaut dans settings s'il n'existe pas
INSERT INTO settings (
  app_name,
  practitioner_name,
  cabinet_address,
  km_rate,
  default_tariffs,
  social,
  branding
)
SELECT
  'TheraFlow Hybrid',
  'Cabinet Kinésithérapie',
  '123 Rue de la Santé, Paris',
  0.5,
  '{"HUMAN_KINESIO": 60, "EQUINE_KINESIO": 90, "CANINE_KINESIO": 55, "MASSAGE": 70}'::jsonb,
  '{"instagramHandle": "@theraflow", "facebookPage": "TheraFlow Cabinet"}'::jsonb,
  '{"primaryColor": "#0f766e", "logoUrl": "https://cdn-icons-png.flaticon.com/512/2393/2393858.png"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Afficher le résultat
SELECT 'Tables créées et RLS désactivé !' as status;
