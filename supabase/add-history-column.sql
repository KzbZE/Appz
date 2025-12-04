-- =====================================================
-- FIX: Ajouter colonne history manquante
-- =====================================================

-- Ajouter la colonne history si elle n'existe pas
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;

-- Mettre à jour les lignes existantes
UPDATE appointment_requests SET history = '[]'::jsonb WHERE history IS NULL;

-- Vérifier
SELECT id, patient_name, history FROM appointment_requests LIMIT 5;
