# 🔧 Script SQL corrigé pour créer la table "patients"

## ⚠️ IMPORTANT
Ce script va **supprimer la table "patients" existante** (si elle existe) et créer une nouvelle table.

**Si vous avez des données importantes dans la table "patients", SAUVEGARDEZ-LES D'ABORD !**

---

## 📋 ÉTAPE 1 : Ouvrir le SQL Editor dans Supabase

1. Allez sur https://app.supabase.com
2. Cliquez sur votre projet `lgbxsqpuabhylawnqlgo`
3. Dans le menu de gauche, cliquez sur **"SQL Editor"** (icône avec `</>`)
4. Cliquez sur **"+ New query"** (bouton en haut à droite)

---

## 📋 ÉTAPE 2 : Copier-coller ce script SQL

```sql
-- ==================================================
-- ÉTAPE 1 : Nettoyer l'ancienne table (si elle existe)
-- ==================================================

-- Supprimer l'ancienne table patients (et toutes ses dépendances)
DROP TABLE IF EXISTS public.patients CASCADE;

-- ==================================================
-- ÉTAPE 2 : Créer la nouvelle table "patients"
-- ==================================================

CREATE TABLE public.patients (
  -- Identifiant unique du patient
  id BIGSERIAL PRIMARY KEY,

  -- Lien vers l'utilisateur propriétaire (TRÈS IMPORTANT !)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations du patient
  name TEXT NOT NULL,
  owner_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('HUMAN', 'EQUINE', 'CANINE')),
  location TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  last_visit TIMESTAMPTZ,
  avatar_url TEXT,
  medical_history JSONB,
  distance_km NUMERIC,
  custom_tariffs JSONB,
  tags TEXT[],
  notes TEXT,
  lat NUMERIC,
  lng NUMERIC,

  -- Dates de création et modification
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==================================================
-- ÉTAPE 3 : Créer les index pour les performances
-- ==================================================

CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_created_at ON public.patients(created_at DESC);

-- ==================================================
-- ÉTAPE 4 : Fonction pour mettre à jour "updated_at"
-- ==================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- ÉTAPE 5 : Trigger pour appeler la fonction
-- ==================================================

CREATE TRIGGER on_patients_updated
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==================================================
-- ÉTAPE 6 : Activer Row Level Security (RLS)
-- ==================================================

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- ÉTAPE 7 : Créer les policies (règles de sécurité)
-- ==================================================

-- Policy 1 : SELECT - Les utilisateurs voient uniquement leurs patients
CREATE POLICY "users_select_own_patients"
  ON public.patients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2 : INSERT - Les utilisateurs peuvent créer des patients
CREATE POLICY "users_insert_own_patients"
  ON public.patients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3 : UPDATE - Les utilisateurs peuvent modifier leurs patients
CREATE POLICY "users_update_own_patients"
  ON public.patients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4 : DELETE - Les utilisateurs peuvent supprimer leurs patients
CREATE POLICY "users_delete_own_patients"
  ON public.patients
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==================================================
-- TERMINÉ ! 🎉
-- ==================================================
```

---

## 📋 ÉTAPE 3 : Exécuter le script

1. Cliquez sur **"Run"** (ou appuyez sur `Ctrl + Enter`)
2. Attendez 2-3 secondes
3. Vous devriez voir : **"Success. No rows returned"** ✅

---

## 📋 ÉTAPE 4 : Vérifier que tout fonctionne

1. Dans le menu de gauche, cliquez sur **"Table Editor"**
2. Vous devriez voir **"patients"** dans la liste des tables
3. Cliquez sur **"patients"**
4. Vérifiez que les colonnes sont bien là, notamment **"user_id"** ✅

---

## ✅ SI ÇA FONCTIONNE

Passez à l'étape suivante du tutoriel : **Créer le fichier `hooks/usePatients.ts`**

---

## ❌ SI VOUS AVEZ ENCORE UNE ERREUR

**Copiez-collez l'erreur EXACTE** que vous voyez, et je vous aiderai immédiatement !

---

## 🔄 Différence avec l'ancien script

**Ancien script :** Essayait de créer la table avec `IF NOT EXISTS` (pouvait causer des conflits)

**Nouveau script :** Supprime complètement l'ancienne table et crée une nouvelle table propre
