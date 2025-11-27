-- TheraFlow Hybrid - Supabase Database Schema
-- Migration from IndexedDB to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES PRINCIPALES
-- =====================================================

-- Table: patients
CREATE TABLE patients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('HUMAN', 'EQUINE', 'CANINE')),
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  last_visit TIMESTAMP,
  avatar_url TEXT,
  medical_history JSONB,
  distance_km NUMERIC(10,2),
  custom_tariffs JSONB,
  tags TEXT[], -- Tags personnalisés: VIP, REGULIER, etc.
  notes TEXT, -- Notes privées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: appointments
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'UNAVAILABLE')),
  type TEXT NOT NULL CHECK (type IN ('CABINET', 'DOMICILE', 'STABLE', 'BLOCK')),
  notes TEXT,
  weather JSONB,
  price NUMERIC(10,2) NOT NULL,
  travel_fee NUMERIC(10,2),
  distance_km NUMERIC(10,2),
  travel_duration_min INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: invoices
CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  patient_name TEXT NOT NULL,
  amount_ht NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  amount_ttc NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'PARTIAL')),
  items JSONB NOT NULL,
  reminder_sent_at TIMESTAMP,
  reminders JSONB, -- Array of ReminderRecord
  payments JSONB, -- Array of PaymentRecord
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: recurring_invoices
CREATE TABLE recurring_invoices (
  id BIGSERIAL PRIMARY KEY,
  patient_name TEXT NOT NULL,
  subscription_type TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
  amount_ht NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL,
  start_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_date DATE,
  total_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: expenses
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('CARBURANT', 'MATERIEL', 'FORMATION', 'ASSURANCES', 'LOYER', 'AUTRE')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: sessions
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
  date TIMESTAMP NOT NULL,
  type TEXT NOT NULL,
  anamnesis JSONB,
  tensions JSONB, -- Array of TensionPoint
  treatment_notes TEXT,
  exercises TEXT[],
  documents JSONB, -- Array of SessionDocument
  price NUMERIC(10,2) NOT NULL,
  practitioner_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: sms_logs
CREATE TABLE sms_logs (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'SENT', 'FAILED')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: survey_responses
CREATE TABLE survey_responses (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES sessions(id) ON DELETE SET NULL,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  answers JSONB,
  feedback TEXT,
  would_recommend BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: goals
CREATE TABLE goals (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('REVENUE', 'SESSIONS', 'NEW_PATIENTS', 'CUSTOM')),
  name TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
  target_value NUMERIC(10,2) NOT NULL,
  current_value NUMERIC(10,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  unit TEXT NOT NULL CHECK (unit IN ('EUR', 'COUNT', 'PERCENT')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: loyalty_cards
CREATE TABLE loyalty_cards (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('STAMP_CARD', 'POINTS')),
  current_count INTEGER DEFAULT 0,
  target_count INTEGER NOT NULL,
  created_date TIMESTAMP NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: loyalty_transactions
CREATE TABLE loyalty_transactions (
  id BIGSERIAL PRIMARY KEY,
  card_id BIGINT REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('EARN', 'REDEEM')),
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: referrals
CREATE TABLE referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  referrer_name TEXT NOT NULL,
  referred_id BIGINT REFERENCES patients(id) ON DELETE SET NULL,
  referred_name TEXT NOT NULL,
  referred_phone TEXT,
  referred_email TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'REWARDED')),
  created_date TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_date TIMESTAMP,
  referrer_reward NUMERIC(10,2) NOT NULL,
  referred_reward NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: promotions
CREATE TABLE promotions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SESSION')),
  value NUMERIC(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  target_segment TEXT,
  min_purchase NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: appointment_requests
CREATE TABLE appointment_requests (
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
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  patient_address TEXT,
  patient_lat NUMERIC(10,7),
  patient_lng NUMERIC(10,7),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: notifications
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('EMAIL', 'SMS', 'BOTH')),
  recipient TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  sent_at TIMESTAMP,
  error TEXT,
  related_request_id BIGINT REFERENCES appointment_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: settings
CREATE TABLE settings (
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

-- =====================================================
-- INDEXES POUR PERFORMANCE
-- =====================================================

-- Patients
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_type ON patients(type);
CREATE INDEX idx_patients_tags ON patients USING GIN(tags);
CREATE INDEX idx_patients_email ON patients(email);

-- Appointments
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Invoices
CREATE INDEX idx_invoices_number ON invoices(number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_patient_name ON invoices(patient_name);
CREATE INDEX idx_invoices_date ON invoices(date);

-- Sessions
CREATE INDEX idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX idx_sessions_date ON sessions(date);

-- Goals
CREATE INDEX idx_goals_is_active ON goals(is_active);
CREATE INDEX idx_goals_end_date ON goals(end_date);

-- Loyalty Cards
CREATE INDEX idx_loyalty_cards_patient_id ON loyalty_cards(patient_id);
CREATE INDEX idx_loyalty_cards_is_active ON loyalty_cards(is_active);

-- Promotions
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_is_active ON promotions(is_active);

-- Appointment Requests
CREATE INDEX idx_appointment_requests_patient_id ON appointment_requests(patient_id);
CREATE INDEX idx_appointment_requests_status ON appointment_requests(status);
CREATE INDEX idx_appointment_requests_requested_start_time ON appointment_requests(requested_start_time);
CREATE INDEX idx_appointment_requests_created_at ON appointment_requests(created_at);

-- Notifications
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_related_request_id ON notifications(related_request_id);

-- =====================================================
-- TRIGGERS POUR AUTO-UPDATE
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur toutes les tables
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_invoices_updated_at BEFORE UPDATE ON recurring_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_cards_updated_at BEFORE UPDATE ON loyalty_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointment_requests_updated_at BEFORE UPDATE ON appointment_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RGPD)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès (à configurer selon vos besoins d'authentification)
-- Pour l'instant, accès total pour les utilisateurs authentifiés
CREATE POLICY "Enable all for authenticated users" ON patients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON appointments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON recurring_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON sms_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON survey_responses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON goals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON loyalty_cards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON loyalty_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON referrals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON promotions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON appointment_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON settings FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- DONNÉES INITIALES (SEED)
-- =====================================================

-- Settings par défaut
INSERT INTO settings (
  app_name,
  practitioner_name,
  cabinet_address,
  km_rate,
  default_tariffs,
  social,
  branding
) VALUES (
  'TheraFlow Hybrid',
  'Cabinet Kinésithérapie',
  '123 Rue de la Santé, Paris',
  0.5,
  '{"HUMAN_KINESIO": 60, "EQUINE_KINESIO": 90, "CANINE_KINESIO": 55, "MASSAGE": 70}'::jsonb,
  '{"instagramHandle": "@theraflow", "facebookPage": "TheraFlow Cabinet"}'::jsonb,
  '{"primaryColor": "#0f766e", "logoUrl": "https://cdn-icons-png.flaticon.com/512/2393/2393858.png"}'::jsonb
);

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue: Statistiques globales
CREATE VIEW stats_overview AS
SELECT
  (SELECT COUNT(*) FROM patients) as total_patients,
  (SELECT COUNT(*) FROM appointments WHERE status = 'COMPLETED') as total_sessions,
  (SELECT SUM(amount_paid) FROM invoices WHERE status = 'PAID') as total_revenue,
  (SELECT COUNT(*) FROM invoices WHERE status = 'OVERDUE') as overdue_invoices,
  (SELECT COUNT(*) FROM loyalty_cards WHERE is_active = true) as active_loyalty_cards,
  (SELECT COUNT(*) FROM goals WHERE is_active = true) as active_goals;

-- Vue: Factures en retard avec détails
CREATE VIEW overdue_invoices_detail AS
SELECT
  i.id,
  i.number,
  i.patient_name,
  i.amount_ttc,
  i.amount_paid,
  (i.amount_ttc - i.amount_paid) as amount_due,
  i.due_date,
  (CURRENT_DATE - i.due_date) as days_overdue,
  i.reminders
FROM invoices i
WHERE i.status = 'OVERDUE'
ORDER BY i.due_date ASC;

-- Vue: Patients avec tags
CREATE VIEW patients_tagged AS
SELECT
  id,
  name,
  type,
  tags,
  phone,
  email,
  last_visit
FROM patients
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

COMMENT ON TABLE patients IS 'Gestion des patients (humains, équins, canins)';
COMMENT ON TABLE appointments IS 'Rendez-vous et séances';
COMMENT ON TABLE invoices IS 'Facturation avec suivi paiements';
COMMENT ON TABLE recurring_invoices IS 'Facturation récurrente / abonnements';
COMMENT ON TABLE expenses IS 'Gestion charges et dépenses professionnelles';
COMMENT ON TABLE sessions IS 'Comptes-rendus de séances détaillés';
COMMENT ON TABLE goals IS 'Objectifs et KPIs de performance';
COMMENT ON TABLE loyalty_cards IS 'Cartes de fidélité clients';
COMMENT ON TABLE referrals IS 'Programme de parrainage';
COMMENT ON TABLE promotions IS 'Offres promotionnelles temporaires';
COMMENT ON TABLE appointment_requests IS 'Demandes de rendez-vous des patients avec système de proposition/contre-proposition';
COMMENT ON TABLE notifications IS 'File d''attente des notifications email/SMS à envoyer';
