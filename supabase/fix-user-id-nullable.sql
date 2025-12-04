-- =====================================================
-- FIX: Rendre user_id nullable et insérer settings
-- =====================================================

-- Rendre user_id nullable dans settings
ALTER TABLE settings ALTER COLUMN user_id DROP NOT NULL;

-- Rendre user_id nullable dans toutes les autres tables si nécessaire
ALTER TABLE patients ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE invoices ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE expenses ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE loyalty_cards ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE referrals ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE promotions ALTER COLUMN user_id DROP NOT NULL;

-- Supprimer les lignes settings existantes (pour repartir à zéro)
DELETE FROM settings;

-- Insérer données par défaut
INSERT INTO settings (
  user_id,
  app_name,
  practitioner_name,
  cabinet_address,
  km_rate,
  default_tariffs,
  social,
  branding
) VALUES (
  NULL,
  'TheraFlow Hybrid',
  'Cabinet Kinésithérapie',
  '123 Rue de la Santé, Paris',
  0.5,
  '{"HUMAN_KINESIO": 60, "EQUINE_KINESIO": 90, "CANINE_KINESIO": 55, "MASSAGE": 70}'::jsonb,
  '{"instagramHandle": "@theraflow", "facebookPage": "TheraFlow Cabinet"}'::jsonb,
  '{"primaryColor": "#0f766e", "logoUrl": "https://cdn-icons-png.flaticon.com/512/2393/2393858.png"}'::jsonb
);

-- Vérifier le résultat
SELECT * FROM settings;
