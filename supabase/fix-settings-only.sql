-- =====================================================
-- FIX SETTINGS UNIQUEMENT (sans toucher autres tables)
-- =====================================================

-- 1. Rendre user_id nullable sur settings SEULEMENT
ALTER TABLE settings ALTER COLUMN user_id DROP NOT NULL;

-- 2. Supprimer les settings existants
DELETE FROM settings;

-- 3. Insérer settings par défaut avec user_id NULL
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

-- 4. Vérifier le résultat
SELECT id, app_name, practitioner_name, cabinet_address FROM settings;
