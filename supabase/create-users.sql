-- =====================================================
-- Création des Utilisateurs pour TheraFlow
-- =====================================================
-- Ce script crée les comptes utilisateurs par défaut dans Supabase Auth
--
-- ⚠️ IMPORTANT: Ce script utilise auth.create_user qui nécessite
-- des privilèges spéciaux. Il est recommandé de créer les utilisateurs
-- via le Dashboard Supabase (Authentication → Users) à la place.
--
-- Si vous devez absolument utiliser SQL, exécutez ce script dans le
-- SQL Editor de Supabase (PAS dans votre application).
-- =====================================================

-- NOTE: La fonction auth.create_user peut ne pas être disponible selon
-- votre version de Supabase. Dans ce cas, utilisez le Dashboard.

-- =====================================================
-- Méthode 1: Via Dashboard Supabase (RECOMMANDÉ)
-- =====================================================
--
-- 1. Allez dans Authentication → Users
-- 2. Cliquez sur "Add user" → "Create new user"
--
-- Compte Praticien:
--   Email: arnaudvb7@gmail.com
--   Password: Jiskan22
--   Auto Confirm User: ✅ COCHEZ CETTE CASE
--
-- 3. Cliquez sur l'utilisateur créé
-- 4. Scrollez à "User Metadata" → Edit
-- 5. Remplacez le JSON par:
--    {
--      "name": "Arnaud VB",
--      "role": "PRACTITIONER",
--      "createdAt": "2025-01-15T10:00:00Z"
--    }
--
-- Compte Admin:
--   Email: admin@admin.com
--   Password: adminadmin
--   Auto Confirm User: ✅ COCHEZ CETTE CASE
--
-- User Metadata:
--   {
--     "name": "Administrateur",
--     "role": "ADMIN",
--     "createdAt": "2025-01-15T10:00:00Z"
--   }

-- =====================================================
-- Méthode 2: Via SQL (AVANCÉ - Peut ne pas fonctionner)
-- =====================================================

-- Si vous avez accès à auth.create_user, décommentez et exécutez:

/*
-- Créer le compte Praticien
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insérer dans auth.users (table système Supabase)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'arnaudvb7@gmail.com',
    crypt('Jiskan22', gen_salt('bf')),
    NOW(),
    '{"name": "Arnaud VB", "role": "PRACTITIONER", "createdAt": "2025-01-15T10:00:00Z"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  RAISE NOTICE 'Praticien créé avec ID: %', new_user_id;
END $$;

-- Créer le compte Admin
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@admin.com',
    crypt('adminadmin', gen_salt('bf')),
    NOW(),
    '{"name": "Administrateur", "role": "ADMIN", "createdAt": "2025-01-15T10:00:00Z"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  RAISE NOTICE 'Admin créé avec ID: %', new_user_id;
END $$;
*/

-- =====================================================
-- Méthode 3: Via fonction edge (si auth.create_user existe)
-- =====================================================

/*
-- Compte Praticien
SELECT auth.create_user(
  jsonb_build_object(
    'email', 'arnaudvb7@gmail.com',
    'password', 'Jiskan22',
    'email_confirm', true,
    'user_metadata', jsonb_build_object(
      'name', 'Arnaud VB',
      'role', 'PRACTITIONER',
      'createdAt', '2025-01-15T10:00:00Z'
    )
  )
);

-- Compte Admin
SELECT auth.create_user(
  jsonb_build_object(
    'email', 'admin@admin.com',
    'password', 'adminadmin',
    'email_confirm', true,
    'user_metadata', jsonb_build_object(
      'name', 'Administrateur',
      'role', 'ADMIN',
      'createdAt', '2025-01-15T10:00:00Z'
    )
  )
);
*/

-- =====================================================
-- Vérification des Utilisateurs
-- =====================================================

-- Pour vérifier que les utilisateurs ont été créés, exécutez:

/*
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;
*/

-- =====================================================
-- RÉSUMÉ
-- =====================================================
--
-- La méthode la plus simple et fiable est d'utiliser le Dashboard Supabase.
--
-- Étapes:
-- 1. Dashboard → Authentication → Users → Add user
-- 2. Créer l'utilisateur avec email + password
-- 3. ✅ Cocher "Auto Confirm User"
-- 4. Ajouter les métadonnées (name, role) après création
--
-- C'est fait! 🎉
