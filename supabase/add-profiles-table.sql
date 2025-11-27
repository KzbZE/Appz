-- =====================================================
-- TABLE PROFILES (UTILISATEURS) - Supabase
-- =====================================================
-- Cette table stocke les profils utilisateurs liés à auth.users
-- À exécuter dans le SQL Editor de Supabase
-- =====================================================

-- Table: profiles (informations utilisateurs)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'PRACTITIONER', 'PATIENT')),
  practitioner_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP
);

-- =====================================================
-- INDEXES POUR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_practitioner_id ON profiles(practitioner_id);

-- =====================================================
-- TRIGGER POUR AUTO-UPDATE
-- =====================================================

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Politique: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Politique: Les admins peuvent tout voir
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Politique: Les admins peuvent tout modifier
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Politique: Seuls les admins peuvent créer des profils
CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =====================================================
-- FONCTION: AUTO-CRÉATION DU PROFIL
-- =====================================================
-- Crée automatiquement un profil quand un utilisateur s'inscrit

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'PRACTITIONER'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Exécuter la fonction après création d'un utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FONCTION: METTRE À JOUR LAST_LOGIN
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Mettre à jour last_login lors de la connexion
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.update_last_login();

-- =====================================================
-- CRÉER LES PROFILS POUR LES UTILISATEURS EXISTANTS
-- =====================================================
-- Si vous avez déjà créé des utilisateurs dans auth.users,
-- cette requête va créer leurs profils

INSERT INTO public.profiles (id, email, name, role, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Utilisateur'),
  COALESCE(au.raw_user_meta_data->>'role', 'PRACTITIONER'),
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE profiles IS 'Profils des utilisateurs liés à auth.users';
COMMENT ON COLUMN profiles.id IS 'UUID de l''utilisateur (référence auth.users.id)';
COMMENT ON COLUMN profiles.role IS 'Rôle: ADMIN, PRACTITIONER, ou PATIENT';
COMMENT ON COLUMN profiles.practitioner_id IS 'ID du praticien associé (pour les patients)';
COMMENT ON COLUMN profiles.last_login IS 'Dernière connexion de l''utilisateur';

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Pour vérifier que tout fonctionne:
SELECT
  p.id,
  p.email,
  p.name,
  p.role,
  p.created_at,
  p.last_login,
  au.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC;

-- ✅ Vous devriez voir tous vos utilisateurs avec leurs profils
