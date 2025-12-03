-- =====================================================
-- DÉSACTIVER RLS POUR DÉVELOPPEMENT
-- =====================================================
-- ⚠️ ATTENTION : À utiliser UNIQUEMENT en développement
-- Ne PAS utiliser en production avec des données réelles
-- =====================================================

-- Supprimer toutes les policies existantes
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

-- Créer des policies qui autorisent TOUT LE MONDE (anon + authenticated)
CREATE POLICY "Allow all access" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all access" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all access" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all access" ON recurring_invoices FOR ALL USING (true);
CREATE POLICY "Allow all access" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all access" ON sms_logs FOR ALL USING (true);
CREATE POLICY "Allow all access" ON survey_responses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON goals FOR ALL USING (true);
CREATE POLICY "Allow all access" ON loyalty_cards FOR ALL USING (true);
CREATE POLICY "Allow all access" ON loyalty_transactions FOR ALL USING (true);
CREATE POLICY "Allow all access" ON referrals FOR ALL USING (true);
CREATE POLICY "Allow all access" ON promotions FOR ALL USING (true);
CREATE POLICY "Allow all access" ON settings FOR ALL USING (true);
CREATE POLICY "Allow all access" ON appointment_requests FOR ALL USING (true);
CREATE POLICY "Allow all access" ON notifications FOR ALL USING (true);

-- ✅ RLS reste activé mais les policies autorisent tout
-- C'est mieux que de désactiver RLS complètement
