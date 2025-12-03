-- =====================================================
-- DÉSACTIVER COMPLÈTEMENT RLS (MODE FORCE)
-- =====================================================
-- ⚠️ Ce script désactive TOTALEMENT RLS sur toutes les tables
-- À utiliser UNIQUEMENT en développement
-- =====================================================

-- Supprimer TOUTES les policies existantes
DROP POLICY IF EXISTS "Enable all for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON appointments;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON recurring_invoices;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sms_logs;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON survey_responses;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON goals;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON loyalty_cards;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON loyalty_transactions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON referrals;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON promotions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON settings;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON appointment_requests;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON notifications;

-- Supprimer les policies "Allow all access" si elles existent
DROP POLICY IF EXISTS "Allow all access" ON patients;
DROP POLICY IF EXISTS "Allow all access" ON appointments;
DROP POLICY IF EXISTS "Allow all access" ON invoices;
DROP POLICY IF EXISTS "Allow all access" ON recurring_invoices;
DROP POLICY IF EXISTS "Allow all access" ON expenses;
DROP POLICY IF EXISTS "Allow all access" ON sessions;
DROP POLICY IF EXISTS "Allow all access" ON sms_logs;
DROP POLICY IF EXISTS "Allow all access" ON survey_responses;
DROP POLICY IF EXISTS "Allow all access" ON goals;
DROP POLICY IF EXISTS "Allow all access" ON loyalty_cards;
DROP POLICY IF EXISTS "Allow all access" ON loyalty_transactions;
DROP POLICY IF EXISTS "Allow all access" ON referrals;
DROP POLICY IF EXISTS "Allow all access" ON promotions;
DROP POLICY IF EXISTS "Allow all access" ON settings;
DROP POLICY IF EXISTS "Allow all access" ON appointment_requests;
DROP POLICY IF EXISTS "Allow all access" ON notifications;

-- DÉSACTIVER COMPLÈTEMENT RLS sur toutes les tables
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- ✅ RLS complètement désactivé
-- ⚠️ ATTENTION: Ne JAMAIS utiliser en production !
