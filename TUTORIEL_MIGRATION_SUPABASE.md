# 🚀 TUTORIEL COMPLET : Migration vers Supabase
## Guide pour les débutants - Étape par étape

---

## 🎯 OBJECTIF
Actuellement, tous les utilisateurs voient les mêmes données.
Après ce tutoriel, chaque utilisateur aura **ses propres données privées**.

---

## 📋 ÉTAPE 1 : Créer la table "patients" dans Supabase

### 1.1 Ouvrir le SQL Editor dans Supabase

1. Allez sur https://app.supabase.com
2. Cliquez sur votre projet `lgbxsqpuabhylawnqlgo`
3. Dans le menu de gauche, cliquez sur **"SQL Editor"** (icône avec `</>`)
4. Cliquez sur **"+ New query"** (bouton en haut à droite)

### 1.2 Copier-coller ce code SQL

Copiez **EXACTEMENT** ce code dans l'éditeur SQL :

```sql
-- ==================================================
-- ÉTAPE 1 : Créer la table "patients"
-- ==================================================

CREATE TABLE IF NOT EXISTS public.patients (
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

-- Index pour améliorer les performances (important pour les recherches rapides)
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at DESC);

-- Fonction pour mettre à jour automatiquement "updated_at"
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour appeler la fonction ci-dessus
DROP TRIGGER IF EXISTS on_patients_updated ON public.patients;
CREATE TRIGGER on_patients_updated
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==================================================
-- ÉTAPE 2 : Activer Row Level Security (RLS)
-- ==================================================

-- Activer la sécurité au niveau des lignes
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- ÉTAPE 3 : Créer les policies (règles de sécurité)
-- ==================================================

-- Policy 1 : Les utilisateurs peuvent voir UNIQUEMENT leurs propres patients
DROP POLICY IF EXISTS "users_select_own_patients" ON public.patients;
CREATE POLICY "users_select_own_patients"
  ON public.patients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2 : Les utilisateurs peuvent créer des patients
DROP POLICY IF EXISTS "users_insert_own_patients" ON public.patients;
CREATE POLICY "users_insert_own_patients"
  ON public.patients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3 : Les utilisateurs peuvent modifier UNIQUEMENT leurs propres patients
DROP POLICY IF EXISTS "users_update_own_patients" ON public.patients;
CREATE POLICY "users_update_own_patients"
  ON public.patients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4 : Les utilisateurs peuvent supprimer UNIQUEMENT leurs propres patients
DROP POLICY IF EXISTS "users_delete_own_patients" ON public.patients;
CREATE POLICY "users_delete_own_patients"
  ON public.patients
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==================================================
-- TERMINÉ ! 🎉
-- ==================================================
```

### 1.3 Exécuter le code

1. Une fois le code copié-collé, cliquez sur **"Run"** (ou appuyez sur `Ctrl + Enter`)
2. Vous devriez voir un message vert : **"Success. No rows returned"**
3. ✅ La table "patients" est créée !

---

## 📋 ÉTAPE 2 : Vérifier que la table est bien créée

1. Dans le menu de gauche, cliquez sur **"Table Editor"**
2. Vous devriez voir votre nouvelle table **"patients"** dans la liste
3. Cliquez dessus pour voir sa structure

---

## 📋 ÉTAPE 3 : Modifier le code de l'application

Maintenant, on va modifier le code pour utiliser Supabase au lieu du stockage local.

### 3.1 Créer un nouveau fichier : `hooks/usePatients.ts`

**Où créer ce fichier :**
- Allez dans le dossier de votre projet
- Si le dossier `hooks` n'existe pas, créez-le
- Créez un fichier nommé `usePatients.ts` dedans

**Contenu du fichier :**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Patient } from '../types';

/**
 * Hook personnalisé pour gérer les patients avec Supabase
 */
export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les patients au montage
  useEffect(() => {
    loadPatients();
  }, []);

  // Fonction pour charger tous les patients de l'utilisateur connecté
  const loadPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPatients(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des patients:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ajouter un patient
  const addPatient = async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Utilisateur non connecté');

      const { data, error: insertError } = await supabase
        .from('patients')
        .insert([{
          ...patient,
          user_id: userData.user.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Ajouter le nouveau patient à la liste locale
      setPatients(prev => [data, ...prev]);

      return { data, error: null };
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du patient:', err);
      return { data: null, error: err.message };
    }
  };

  // Fonction pour mettre à jour un patient
  const updatePatient = async (id: number, updates: Partial<Patient>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Mettre à jour la liste locale
      setPatients(prev => prev.map(p => p.id === id ? data : p));

      return { data, error: null };
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du patient:', err);
      return { data: null, error: err.message };
    }
  };

  // Fonction pour supprimer un patient
  const deletePatient = async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Supprimer de la liste locale
      setPatients(prev => prev.filter(p => p.id !== id));

      return { error: null };
    } catch (err: any) {
      console.error('Erreur lors de la suppression du patient:', err);
      return { error: err.message };
    }
  };

  return {
    patients,
    isLoading,
    error,
    addPatient,
    updatePatient,
    deletePatient,
    refreshPatients: loadPatients
  };
};
```

### 3.2 Modifier `App.tsx` pour utiliser le nouveau hook

**Trouver cette ligne dans `App.tsx` (environ ligne 35) :**

```typescript
const patients = useLiveQuery(() => db.patients.toArray());
```

**Remplacer par :**

```typescript
const { patients, isLoading: patientsLoading, addPatient, updatePatient, deletePatient } = usePatients();
```

**Ajouter cet import en haut du fichier :**

```typescript
import { usePatients } from './hooks/usePatients';
```

---

## 📋 ÉTAPE 4 : Tester la migration

### 4.1 Redémarrer le serveur de développement

1. Arrêtez le serveur (Ctrl + C dans le terminal)
2. Relancez : `npm run dev`

### 4.2 Tester avec deux comptes

1. **Connectez-vous avec le premier compte** (ex: admin@admin.com)
2. **Créez un patient de test** (ex: "Patient Test 1")
3. **Déconnectez-vous**
4. **Connectez-vous avec le deuxième compte** (ex: arnaudvb7@gmail.com)
5. **Vérifiez que vous ne voyez PAS le patient créé par le premier compte** ✅
6. **Créez un nouveau patient** (ex: "Patient Test 2")
7. **Déconnectez-vous et reconnectez-vous avec le premier compte**
8. **Vérifiez que vous voyez UNIQUEMENT "Patient Test 1"** ✅

---

## 🎉 SI TOUT FONCTIONNE

**Félicitations ! Chaque utilisateur a maintenant ses propres données privées !**

---

## 🔄 ÉTAPES SUIVANTES

Maintenant que la table "patients" fonctionne, on peut faire la même chose pour :
- `appointments` (rendez-vous)
- `invoices` (factures)
- `expenses` (dépenses)
- `sessions` (séances)
- etc.

**Voulez-vous que je crée les scripts SQL pour les autres tables ?**

---

## ❓ EN CAS DE PROBLÈME

### Problème : "relation public.patients does not exist"
**Solution :** La table n'a pas été créée. Refaites l'ÉTAPE 1.

### Problème : "new row violates row-level security policy"
**Solution :** Les policies RLS ne sont pas bien configurées. Vérifiez l'ÉTAPE 1.3.

### Problème : "user_id cannot be null"
**Solution :** L'utilisateur n'est pas connecté. Vérifiez que vous êtes bien authentifié.

### Problème : Les patients de l'ancien système n'apparaissent plus
**Solution :** C'est normal ! Ils sont dans IndexedDB (local), pas dans Supabase (cloud).
Pour les migrer, on peut créer un script de migration.

---

## 🆘 BESOIN D'AIDE ?

Si quelque chose ne fonctionne pas, **copiez-collez l'erreur exacte** que vous voyez dans la console, et je vous aiderai !
