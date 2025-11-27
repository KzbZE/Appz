# 🔐 Configuration Complète de l'Authentification Supabase

## ✅ Ce Guide Fait Tout pour Vous!

Ce guide configure l'authentification complète pour que la page de login fonctionne avec Supabase.

---

## 📋 Étapes à Suivre

### Étape 1: Créer les Tables (Si pas déjà fait)

#### 1.1 Créer Toutes les Tables

Ouvrez Supabase → SQL Editor → Nouvelle requête

**Copiez et exécutez** le contenu complet de:
```
supabase/schema.sql
```

Cela créera **17 tables** dont `profiles`.

#### 1.2 OU Créer Uniquement ce qui Manque

Si vous avez déjà les autres tables:

```
supabase/add-missing-tables.sql (tables manquantes)
supabase/add-profiles-table.sql (table profiles)
```

---

### Étape 2: Créer les Utilisateurs avec Identifiants

Voici **3 méthodes** pour créer les comptes. Choisissez celle qui vous convient.

---

## 🎯 MÉTHODE 1: Via Dashboard Supabase (LA PLUS SIMPLE)

### Créer le Compte Praticien

1. Allez dans **Authentication** → **Users**
2. Cliquez sur **"Add user"** → **"Create new user"**
3. Remplissez:
   ```
   Email: arnaudvb7@gmail.com
   Password: Jiskan22
   Auto Confirm User: ✅ COCHEZ CETTE CASE!
   ```
4. Cliquez sur **"Create user"**

5. **Ajouter les métadonnées**:
   - Cliquez sur l'utilisateur que vous venez de créer
   - Scrollez à **"User Metadata"**
   - Cliquez sur **"Edit"**
   - Remplacez le JSON par:
   ```json
   {
     "name": "Arnaud VB",
     "role": "PRACTITIONER",
     "createdAt": "2025-01-15T10:00:00Z"
   }
   ```
   - Cliquez sur **"Save"**

6. **Vérifier que le profil est créé**:
   - Allez dans **Table Editor** → **profiles**
   - Vous devriez voir un profil pour `arnaudvb7@gmail.com`
   - ✨ **Créé automatiquement par le trigger!**

### Créer le Compte Admin

Répétez les mêmes étapes:
```
Email: admin@admin.com
Password: adminadmin
Auto Confirm User: ✅ OUI
```

User Metadata:
```json
{
  "name": "Administrateur",
  "role": "ADMIN",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

✅ **C'est tout!** Les profils sont créés automatiquement dans la table `profiles`.

---

## 🎯 MÉTHODE 2: Via SQL dans Supabase (AVANCÉE)

### ⚠️ Prérequis

Cette méthode nécessite que vous ayez accès à une fonction spéciale de Supabase. Si elle ne fonctionne pas, utilisez la Méthode 1 (Dashboard).

### Script SQL

Ouvrez Supabase → SQL Editor → Nouvelle requête

```sql
-- =====================================================
-- CRÉER LES UTILISATEURS AVEC IDENTIFIANTS
-- =====================================================

-- NOTE: Cette méthode utilise une extension Supabase
-- Si vous avez une erreur, utilisez le Dashboard (Méthode 1)

-- Activer l'extension pgcrypto pour les UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CRÉER LE COMPTE PRATICIEN
-- =====================================================

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Générer un UUID pour l'utilisateur
  new_user_id := gen_random_uuid();

  -- Insérer dans auth.users (si vous avez les permissions)
  -- Note: Cette insertion peut échouer selon les permissions
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
    recovery_token
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
      'createdAt', '2025-01-15T10:00:00Z'
    ),
    NOW(),
    NOW(),
    '',
    ''
  );

  RAISE NOTICE 'Utilisateur Praticien créé avec ID: %', new_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la création: %', SQLERRM;
    RAISE NOTICE 'Utilisez le Dashboard Supabase (Authentication → Users) à la place';
END $$;

-- =====================================================
-- 2. CRÉER LE COMPTE ADMIN
-- =====================================================

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  new_user_id := gen_random_uuid();

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
    recovery_token
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
      'createdAt', '2025-01-15T10:00:00Z'
    ),
    NOW(),
    NOW(),
    '',
    ''
  );

  RAISE NOTICE 'Utilisateur Admin créé avec ID: %', new_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la création: %', SQLERRM;
    RAISE NOTICE 'Utilisez le Dashboard Supabase (Authentication → Users) à la place';
END $$;

-- =====================================================
-- 3. VÉRIFIER QUE LES PROFILS SONT CRÉÉS
-- =====================================================

-- Les profils devraient être créés automatiquement par le trigger
-- Vérifions:

SELECT
  au.id,
  au.email,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'name' as name,
  au.raw_user_meta_data->>'role' as role,
  p.id as profile_exists
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email IN ('arnaudvb7@gmail.com', 'admin@admin.com')
ORDER BY au.created_at DESC;

-- Si profile_exists est NULL, créez-les manuellement:
-- Exécutez supabase/add-profiles-table.sql qui contient la requête
-- pour créer les profils des utilisateurs existants
```

---

## 🎯 MÉTHODE 3: Via API TypeScript (POUR DEV)

Si vous développez localement et voulez créer les comptes via code:

```typescript
// À exécuter une seule fois dans votre console navigateur ou script Node.js

import { supabase } from './lib/supabase';

// Créer le compte Praticien
const { data: practitioner, error: err1 } = await supabase.auth.signUp({
  email: 'arnaudvb7@gmail.com',
  password: 'Jiskan22',
  options: {
    emailRedirectTo: undefined,
    data: {
      name: 'Arnaud VB',
      role: 'PRACTITIONER',
      createdAt: new Date().toISOString()
    }
  }
});

console.log('Praticien créé:', practitioner);
if (err1) console.error('Erreur:', err1);

// Créer le compte Admin
const { data: admin, error: err2 } = await supabase.auth.signUp({
  email: 'admin@admin.com',
  password: 'adminadmin',
  options: {
    emailRedirectTo: undefined,
    data: {
      name: 'Administrateur',
      role: 'ADMIN',
      createdAt: new Date().toISOString()
    }
  }
});

console.log('Admin créé:', admin);
if (err2) console.error('Erreur:', err2);
```

**⚠️ Problème**: Par défaut, Supabase envoie un email de confirmation. Vous devrez:
1. Vérifier les emails (boîte spam aussi)
2. OU désactiver la confirmation email dans Settings → Authentication

---

## ✅ Étape 3: Vérifier que Tout Fonctionne

### 3.1 Vérifier les Utilisateurs dans Supabase

Dans Supabase → **Authentication** → **Users**

Vous devriez voir:
- ✅ `arnaudvb7@gmail.com` (confirmé)
- ✅ `admin@admin.com` (confirmé)

### 3.2 Vérifier les Profils

Dans Supabase → **Table Editor** → **profiles**

Vous devriez voir:
- ✅ Profil pour `arnaudvb7@gmail.com` avec role `PRACTITIONER`
- ✅ Profil pour `admin@admin.com` avec role `ADMIN`

### 3.3 Tester la Connexion

1. Ouvrez votre application (local ou Netlify)
2. Allez sur la page de login
3. Ouvrez la console (F12)
4. Vous devez voir:
   ```
   ☁️ Supabase configuré - Utilisation de Supabase Cloud
   ```

5. Essayez de vous connecter:
   ```
   Email: arnaudvb7@gmail.com
   Mot de passe: Jiskan22
   ```

6. ✅ **Ça devrait fonctionner!**

---

## 🔧 Configuration de Votre Application

### Assurez-vous que `.env` est Correct

Votre fichier `.env` doit contenir:

```env
# Mode Supabase (pas local!)
VITE_FORCE_LOCAL_AUTH=false

# Vos vraies clés Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (votre vraie clé)
```

### Configuration Netlify

Dans Netlify Dashboard → Site settings → Environment variables:

```
VITE_FORCE_LOCAL_AUTH = false
VITE_SUPABASE_URL = https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOi... (votre vraie clé)
```

Puis **Redéployez**.

---

## 🚨 Dépannage

### Problème: "Email not confirmed"

**Solution**: Dans Supabase → Authentication → Users:
- Cliquez sur l'utilisateur
- Cochez **"Email confirmed"**
- Sauvegardez

### Problème: "Invalid login credentials"

**Vérifiez**:
1. Que l'email est bien `arnaudvb7@gmail.com` (pas d'espace)
2. Que le mot de passe est bien `Jiskan22` (sensible à la casse!)
3. Que l'utilisateur est confirmé (voir ci-dessus)

### Problème: "User already registered"

**C'est normal!** L'utilisateur existe déjà. Passez directement à l'étape 3 (Vérification).

### Problème: Le profil n'est pas créé automatiquement

**Solution**: Exécutez cette requête dans SQL Editor:

```sql
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
```

---

## 📊 Architecture Complète

```
┌─────────────────────────────────────────────────────┐
│                   PAGE DE LOGIN                     │
│         (arnaudvb7@gmail.com / Jiskan22)            │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              authService.login()                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          isSupabaseConfigured() ?                   │
│   Vérifie: VITE_FORCE_LOCAL_AUTH=false              │
│            VITE_SUPABASE_URL valide                 │
└────────────┬─────────────────────────────┬──────────┘
             │ true                        │ false
             ▼                             ▼
┌────────────────────────┐    ┌──────────────────────┐
│   SUPABASE CLOUD ✅    │    │   IndexedDB Local ❌ │
│                        │    │   (Mode développement)│
│ 1. auth.signIn()       │    └──────────────────────┘
│ 2. Vérifie dans        │
│    auth.users          │
│ 3. Récupère profil     │
│    depuis profiles     │
│ 4. Trigger update      │
│    last_login          │
└────────────────────────┘
```

---

## 🎉 Résumé des Identifiants

Une fois configuré, ces identifiants fonctionnent:

### Compte Praticien
```
Email: arnaudvb7@gmail.com
Mot de passe: Jiskan22
Rôle: PRACTITIONER
```

### Compte Admin
```
Email: admin@admin.com
Mot de passe: adminadmin
Rôle: ADMIN
```

---

## ✅ Checklist Finale

- [ ] Tables créées dans Supabase (schema.sql)
- [ ] Table `profiles` existe
- [ ] Triggers configurés (handle_new_user, update_last_login)
- [ ] Utilisateurs créés dans Authentication
- [ ] User Metadata ajoutées (name, role)
- [ ] Email confirmés
- [ ] Profils visibles dans table `profiles`
- [ ] `.env` configuré avec vraies clés Supabase
- [ ] `VITE_FORCE_LOCAL_AUTH=false`
- [ ] Netlify configuré (si déployé)
- [ ] Test de connexion réussi ✅

---

**Temps estimé**: 5-10 minutes avec Méthode 1 (Dashboard)

**Bon courage! Votre authentification Supabase sera opérationnelle! 🚀**
