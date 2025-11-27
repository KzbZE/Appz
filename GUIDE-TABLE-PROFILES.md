# 📋 Guide: Table Profiles (Utilisateurs) dans Supabase

## 🎯 Vue d'Ensemble

La table `profiles` stocke les informations des utilisateurs de votre application dans la base de données Supabase.

**Différence importante**:
- ❌ **PAS de table `users` locale** (IndexedDB) - On n'utilise plus ça!
- ✅ **Table `profiles`** dans Supabase (cloud)
- ✅ **Table `auth.users`** de Supabase (authentification système)

---

## 🏗️ Structure de la Table `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,              -- UUID de auth.users
  email TEXT UNIQUE NOT NULL,       -- Email de l'utilisateur
  name TEXT NOT NULL,               -- Nom complet
  role TEXT NOT NULL,               -- ADMIN, PRACTITIONER, ou PATIENT
  practitioner_id TEXT,             -- ID du praticien (pour patients)
  avatar_url TEXT,                  -- URL de l'avatar
  created_at TIMESTAMP,             -- Date de création
  updated_at TIMESTAMP,             -- Date de modification
  last_login TIMESTAMP              -- Dernière connexion
);
```

### Colonnes:

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire, référence `auth.users.id` |
| `email` | TEXT | Email unique de l'utilisateur |
| `name` | TEXT | Nom complet (ex: "Arnaud VB") |
| `role` | TEXT | Rôle: ADMIN, PRACTITIONER, ou PATIENT |
| `practitioner_id` | TEXT | ID du praticien associé (pour patients) |
| `avatar_url` | TEXT | URL de l'image de profil |
| `created_at` | TIMESTAMP | Date de création du profil |
| `updated_at` | TIMESTAMP | Dernière modification (auto-update) |
| `last_login` | TIMESTAMP | Dernière connexion (auto-update) |

---

## 🔄 Comment ça Fonctionne?

### 1. Création Automatique du Profil

Quand un utilisateur s'inscrit via `auth.signUp()`:

```typescript
// Dans votre code
const { data, error } = await supabase.auth.signUp({
  email: 'arnaudvb7@gmail.com',
  password: 'Jiskan22',
  options: {
    data: {
      name: 'Arnaud VB',
      role: 'PRACTITIONER'
    }
  }
});
```

**Automatiquement**:
1. ✅ Utilisateur créé dans `auth.users`
2. ✅ Trigger `on_auth_user_created` s'exécute
3. ✅ Profil créé dans `profiles` avec les métadonnées

**Résultat**:
```sql
-- Dans auth.users
id: uuid-123-456
email: arnaudvb7@gmail.com
raw_user_meta_data: {"name": "Arnaud VB", "role": "PRACTITIONER"}

-- Dans profiles (créé automatiquement)
id: uuid-123-456
email: arnaudvb7@gmail.com
name: Arnaud VB
role: PRACTITIONER
created_at: 2025-01-15 10:00:00
```

### 2. Mise à Jour Automatique de `last_login`

Quand un utilisateur se connecte:

```typescript
await supabase.auth.signInWithPassword({
  email: 'arnaudvb7@gmail.com',
  password: 'Jiskan22'
});
```

**Automatiquement**:
1. ✅ `auth.users.last_sign_in_at` est mis à jour
2. ✅ Trigger `on_auth_user_login` s'exécute
3. ✅ `profiles.last_login` est mis à jour

---

## 📝 Créer les Profils pour les Utilisateurs Existants

Si vous avez déjà créé des utilisateurs dans `auth.users` **avant** d'ajouter la table `profiles`:

### Option 1: Script SQL (Recommandé)

Exécutez dans Supabase SQL Editor:

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

Ce script:
- Récupère tous les utilisateurs de `auth.users`
- Crée un profil pour ceux qui n'en ont pas
- Utilise les métadonnées (`raw_user_meta_data`) pour le nom et le rôle

### Option 2: Créer Manuellement

Dans Supabase Dashboard → Table Editor → `profiles` → Insert:

```
id: [UUID de auth.users]
email: arnaudvb7@gmail.com
name: Arnaud VB
role: PRACTITIONER
created_at: 2025-01-15 10:00:00
```

---

## 🔐 Sécurité (Row Level Security)

La table `profiles` a des politiques RLS configurées:

### Pour les Utilisateurs Normaux:

```sql
-- ✅ Peut voir son propre profil
"Users can view own profile"
→ SELECT où auth.uid() = id

-- ✅ Peut modifier son propre profil
"Users can update own profile"
→ UPDATE où auth.uid() = id
```

### Pour les Admins:

```sql
-- ✅ Peut voir tous les profils
"Admins can view all profiles"
→ SELECT si role = 'ADMIN'

-- ✅ Peut modifier tous les profils
"Admins can update all profiles"
→ UPDATE si role = 'ADMIN'

-- ✅ Peut créer des profils
"Admins can insert profiles"
→ INSERT si role = 'ADMIN'
```

---

## 💻 Utilisation dans le Code

### Récupérer le Profil de l'Utilisateur Connecté

```typescript
// Méthode 1: Via auth.user + métadonnées
const { data: { user } } = await supabase.auth.getUser();
const name = user?.user_metadata?.name;
const role = user?.user_metadata?.role;

// Méthode 2: Via la table profiles (RECOMMANDÉ)
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

console.log(profile);
// {
//   id: 'uuid-123',
//   email: 'arnaudvb7@gmail.com',
//   name: 'Arnaud VB',
//   role: 'PRACTITIONER',
//   last_login: '2025-01-15 15:30:00'
// }
```

### Mettre à Jour le Profil

```typescript
const { error } = await supabase
  .from('profiles')
  .update({
    name: 'Arnaud Van Brusselen',
    avatar_url: 'https://example.com/avatar.jpg'
  })
  .eq('id', user.id);
```

### Lister Tous les Profils (Admin uniquement)

```typescript
// Seuls les admins peuvent exécuter ceci (RLS)
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .order('created_at', { ascending: false });
```

### Filtrer par Rôle

```typescript
// Lister tous les praticiens
const { data: practitioners } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'PRACTITIONER');
```

---

## 🚀 Actions à Faire Maintenant

### Étape 1: Créer la Table

Exécutez dans Supabase SQL Editor:
- **Option A**: `supabase/add-profiles-table.sql` (script complet avec tout)
- **Option B**: Réexécutez `supabase/schema.sql` (schéma complet mis à jour)

### Étape 2: Créer les Profils pour Utilisateurs Existants

Si vous avez déjà créé des utilisateurs (arnaudvb7@gmail.com, admin@admin.com):

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

### Étape 3: Vérifier

```sql
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
```

Vous devriez voir:
- ✅ 2 profils (Arnaud VB, Administrateur)
- ✅ Avec leurs rôles respectifs
- ✅ Dates de création

---

## ❓ FAQ

### Q: Pourquoi pas de table `users` dans Supabase?

**R**: Supabase a déjà `auth.users` pour l'authentification (email, password, etc.). La table `profiles` stocke les **informations supplémentaires** (nom, rôle, avatar).

### Q: Pourquoi pas de `passwordHash` dans `profiles`?

**R**: Les mots de passe sont gérés par `auth.users` de Supabase. Ne JAMAIS stocker de mots de passe dans `profiles`!

### Q: La table locale `users` (IndexedDB) est encore utilisée?

**R**: Non! Quand `VITE_FORCE_LOCAL_AUTH=false`, on utilise uniquement Supabase (`auth.users` + `profiles`).

### Q: Comment migrer de IndexedDB vers Supabase?

**R**: Les utilisateurs locaux ne peuvent pas être migrés directement car les mots de passe sont hachés différemment. Ils doivent être recréés via `auth.signUp()`.

### Q: Peut-on avoir des rôles personnalisés?

**R**: Oui! Modifiez la contrainte CHECK dans la table:
```sql
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('ADMIN', 'PRACTITIONER', 'PATIENT', 'SECRETARY'));
```

---

## 📊 Schéma de Relation

```
┌─────────────────────────────────────┐
│        auth.users (Supabase)        │
│  - id (UUID)                        │
│  - email                            │
│  - encrypted_password               │
│  - raw_user_meta_data (JSONB)       │
│  - last_sign_in_at                  │
└──────────────┬──────────────────────┘
               │
               │ RÉFÉRENCE (id)
               ▼
┌─────────────────────────────────────┐
│        profiles (Votre table)       │
│  - id (UUID) → auth.users.id        │
│  - email                            │
│  - name                             │
│  - role                             │
│  - practitioner_id                  │
│  - avatar_url                       │
│  - last_login                       │
└─────────────────────────────────────┘
```

---

## ✅ Résumé

1. ✅ **Table `profiles`** stocke les infos utilisateur (nom, rôle, etc.)
2. ✅ **Liée à `auth.users`** via `id` (UUID)
3. ✅ **Création automatique** quand un utilisateur s'inscrit
4. ✅ **RLS configuré** pour sécurité
5. ✅ **Triggers automatiques** pour `last_login` et création
6. ❌ **Pas de table locale** `users` - On utilise Supabase!

**Fichiers importants**:
- `supabase/add-profiles-table.sql` - Script pour créer la table
- `supabase/schema.sql` - Schéma complet (mis à jour avec profiles)

**Prochaine étape**: Exécutez `supabase/add-profiles-table.sql` dans Supabase SQL Editor!

---

**Bonne utilisation! 🚀**
