-- =====================================================
-- CRÉER LES UTILISATEURS DANS SUPABASE - MÉTHODE RAPIDE
-- =====================================================
-- Exécutez ce script dans Supabase SQL Editor
-- =====================================================

-- IMPORTANT: Si cette méthode ne fonctionne pas (permissions),
-- utilisez le Dashboard Supabase (Authentication → Users → Add user)
-- C'est la méthode LA PLUS SIMPLE!

-- =====================================================
-- ACTIVER L'EXTENSION POUR LES UUID
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CRÉER LE COMPTE PRATICIEN
-- =====================================================

DO $$
DECLARE
  new_user_id uuid;
  user_exists boolean;
BEGIN
  -- Vérifier si l'utilisateur existe déjà
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'arnaudvb7@gmail.com'
  ) INTO user_exists;

  IF user_exists THEN
    RAISE NOTICE '⚠️ L''utilisateur arnaudvb7@gmail.com existe déjà';
  ELSE
    -- Générer un nouvel UUID
    new_user_id := gen_random_uuid();

    -- Créer l'utilisateur dans auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'arnaudvb7@gmail.com',
      crypt('Jiskan22', gen_salt('bf')),
      NOW(),
      jsonb_build_object(
        'name', 'Arnaud VB',
        'role', 'PRACTITIONER',
        'createdAt', NOW()::text
      ),
      NOW(),
      NOW(),
      '',
      '',
      ''
    );

    RAISE NOTICE '✅ Utilisateur Praticien créé: arnaudvb7@gmail.com (ID: %)', new_user_id;
    RAISE NOTICE '   Password: Jiskan22';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors de la création du praticien: %', SQLERRM;
    RAISE NOTICE '💡 Utilisez le Dashboard Supabase: Authentication → Users → Add user';
END $$;

-- =====================================================
-- CRÉER LE COMPTE ADMIN
-- =====================================================

DO $$
DECLARE
  new_user_id uuid;
  user_exists boolean;
BEGIN
  -- Vérifier si l'utilisateur existe déjà
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@admin.com'
  ) INTO user_exists;

  IF user_exists THEN
    RAISE NOTICE '⚠️ L''utilisateur admin@admin.com existe déjà';
  ELSE
    -- Générer un nouvel UUID
    new_user_id := gen_random_uuid();

    -- Créer l'utilisateur dans auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@admin.com',
      crypt('adminadmin', gen_salt('bf')),
      NOW(),
      jsonb_build_object(
        'name', 'Administrateur',
        'role', 'ADMIN',
        'createdAt', NOW()::text
      ),
      NOW(),
      NOW(),
      '',
      '',
      ''
    );

    RAISE NOTICE '✅ Utilisateur Admin créé: admin@admin.com (ID: %)', new_user_id;
    RAISE NOTICE '   Password: adminadmin';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors de la création de l''admin: %', SQLERRM;
    RAISE NOTICE '💡 Utilisez le Dashboard Supabase: Authentication → Users → Add user';
END $$;

-- =====================================================
-- CRÉER LES PROFILS AUTOMATIQUEMENT
-- =====================================================

-- Si la table profiles existe et que les triggers sont configurés,
-- les profils seront créés automatiquement.
-- Sinon, créons-les manuellement:

INSERT INTO public.profiles (id, email, name, role, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Utilisateur'),
  COALESCE(au.raw_user_meta_data->>'role', 'PRACTITIONER'),
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
  AND au.email IN ('arnaudvb7@gmail.com', 'admin@admin.com');

-- =====================================================
-- VÉRIFIER LES UTILISATEURS CRÉÉS
-- =====================================================

SELECT
  au.id,
  au.email,
  au.email_confirmed_at as confirmed_at,
  au.raw_user_meta_data->>'name' as name,
  au.raw_user_meta_data->>'role' as role,
  p.id as profile_id,
  p.name as profile_name,
  p.role as profile_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email IN ('arnaudvb7@gmail.com', 'admin@admin.com')
ORDER BY au.created_at DESC;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

-- Vous devriez voir:
-- 1. arnaudvb7@gmail.com avec role PRACTITIONER
-- 2. admin@admin.com avec role ADMIN
-- 3. Les profils correspondants dans la table profiles

-- Si ça ne fonctionne pas, utilisez la méthode Dashboard ci-dessous!
