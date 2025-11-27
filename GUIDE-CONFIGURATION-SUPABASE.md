# 🚀 Guide Complet de Configuration Supabase - TheraFlow

## 📋 Vue d'Ensemble

Ce guide vous explique **étape par étape** comment configurer Supabase pour votre application TheraFlow.

---

## 🎯 Étape 1: Créer un Projet Supabase

### 1.1 Inscription sur Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"**
3. Créez un compte (gratuit) avec:
   - Email
   - Mot de passe
   - Ou connectez-vous avec GitHub

### 1.2 Créer un Nouveau Projet

1. Une fois connecté, cliquez sur **"New project"**
2. Remplissez les informations:
   ```
   Name: theraflow-prod
   Database Password: [Choisissez un mot de passe FORT]
   Region: Europe West (France/Ireland)
   Pricing Plan: Free (ou Pro selon vos besoins)
   ```
3. Cliquez sur **"Create new project"**
4. ⏳ **Attendez 2-3 minutes** que le projet soit créé

---

## 🗄️ Étape 2: Créer la Structure de la Base de Données

### 2.1 Ouvrir le SQL Editor

1. Dans votre projet Supabase, cliquez sur l'icône **SQL** dans la barre latérale gauche
2. Cliquez sur **"New query"**

### 2.2 Exécuter le Script SQL

1. Copiez **TOUT** le contenu du fichier `supabase/schema.sql` de votre projet
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **"Run"** (ou `Ctrl+Enter`)
4. ✅ Vérifiez qu'il n'y a pas d'erreurs

**Ce script va créer:**
- ✅ Toutes les tables (patients, appointments, invoices, etc.)
- ✅ Les index pour les performances
- ✅ Les triggers pour auto-update
- ✅ Les politiques de sécurité (Row Level Security)
- ✅ Les vues SQL utiles
- ✅ Les données initiales (settings)

---

## 🔐 Étape 3: Configurer l'Authentification

### 3.1 Créer les Comptes Utilisateurs

#### Option A: Via le Dashboard Supabase (Recommandé)

1. Dans Supabase, allez dans **Authentication** → **Users**
2. Cliquez sur **"Add user"** → **"Create new user"**

**Créez le compte Praticien:**
```
Email: arnaudvb7@gmail.com
Password: Jiskan22
Auto Confirm User: ✅ OUI (cochez cette case!)
```

Cliquez sur **"Create user"**

3. Ajoutez les métadonnées utilisateur:
   - Cliquez sur l'utilisateur que vous venez de créer
   - Descendez à la section **"User Metadata"**
   - Cliquez sur **"Edit"**
   - Remplacez le JSON par:

```json
{
  "name": "Arnaud VB",
  "role": "PRACTITIONER",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

Cliquez sur **"Save"**

4. **Répétez** pour le compte Admin:

```
Email: admin@admin.com
Password: adminadmin
Auto Confirm User: ✅ OUI
```

Métadonnées:
```json
{
  "name": "Administrateur",
  "role": "ADMIN",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

#### Option B: Via SQL (Avancé)

**⚠️ ATTENTION**: Cette méthode nécessite d'utiliser une fonction SQL spéciale.

Dans le SQL Editor de Supabase, exécutez:

```sql
-- Créer le compte Praticien
SELECT auth.create_user(
  '{"email": "arnaudvb7@gmail.com",
    "password": "Jiskan22",
    "email_confirm": true,
    "user_metadata": {
      "name": "Arnaud VB",
      "role": "PRACTITIONER",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }'::jsonb
);

-- Créer le compte Admin
SELECT auth.create_user(
  '{"email": "admin@admin.com",
    "password": "adminadmin",
    "email_confirm": true,
    "user_metadata": {
      "name": "Administrateur",
      "role": "ADMIN",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }'::jsonb
);
```

**Note**: Si cette méthode ne fonctionne pas, utilisez l'Option A (Dashboard).

### 3.2 Configurer les Email Templates (Optionnel)

1. Allez dans **Authentication** → **Email Templates**
2. Vous pouvez personnaliser:
   - Confirmation email
   - Reset password email
   - Magic link email

---

## 🔑 Étape 4: Récupérer les Clés API

### 4.1 Trouver vos Clés

1. Dans Supabase, cliquez sur l'icône **Settings** (⚙️) en bas de la barre latérale
2. Cliquez sur **"API"**
3. Vous verrez:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
```

Faites défiler vers le bas pour trouver:

```
Project API keys:
  - anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... [SECRET]
```

**⚠️ IMPORTANT**:
- Utilisez la clé **`anon public`** (PAS la `service_role`)
- Ne JAMAIS partager la clé `service_role` (elle donne accès admin complet)

---

## 📝 Étape 5: Configurer les Variables d'Environnement

### 5.1 Mettre à Jour le Fichier `.env`

Ouvrez votre fichier `.env` et remplacez les valeurs:

```env
# Variables d'environnement pour Supabase Production

# ⚠️ DÉSACTIVEZ le mode local pour utiliser Supabase
VITE_FORCE_LOCAL_AUTH=false

# Supabase Configuration (REMPLACEZ avec vos vraies valeurs)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4IiByb2xlIjoiYW5vbiIsImlhdCI6MTY0NTE5MjAwMH0.votre_vraie_clé_ici

# Google API Keys (optionnel)
VITE_GEMINI_API_KEY=
VITE_GOOGLE_PLACES_API_KEY=AIzaSyD6iSzooBzG0ETymCWWrjLTmeW3k35oSCc
```

**Remplacez:**
- `https://xxxxxxxxxxxxx.supabase.co` par votre vraie Project URL
- `eyJhbGciOi...` par votre vraie clé `anon public`

### 5.2 Configurer Netlify (Pour Production)

1. Allez sur **Netlify Dashboard**
2. Sélectionnez votre site
3. **Site settings** → **Environment variables**
4. **Supprimez ou modifiez** `VITE_FORCE_LOCAL_AUTH`:
   ```
   VITE_FORCE_LOCAL_AUTH = false
   ```
   (Ou supprimez cette variable complètement)

5. **Ajoutez/Mettez à jour** les variables Supabase:
   ```
   VITE_SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOi... (votre vraie clé)
   ```

6. **Sauvegardez** et **Redéployez**

---

## ✅ Étape 6: Vérifier que Tout Fonctionne

### 6.1 Test en Local

1. Redémarrez votre serveur de développement:
   ```bash
   npm run dev
   ```

2. Ouvrez votre navigateur sur `http://localhost:5173`

3. Ouvrez la console (F12)

4. **Vérifiez** que vous voyez:
   ```
   ☁️ Supabase configuré - Utilisation de Supabase Cloud
   ```

   **PAS** ce message:
   ```
   🔒 Mode local FORCÉ via VITE_FORCE_LOCAL_AUTH - Utilisation d'IndexedDB
   ```

5. Essayez de vous connecter avec:
   ```
   Email: arnaudvb7@gmail.com
   Mot de passe: Jiskan22
   ```

6. ✅ **Si ça marche**, vous êtes connecté via Supabase!

### 6.2 Test sur Netlify

1. Attendez que le déploiement Netlify soit terminé
2. Ouvrez votre site Netlify
3. Ouvrez la console (F12)
4. Vérifiez le message **"☁️ Supabase configuré"**
5. Connectez-vous avec vos identifiants

---

## 🔄 Étape 7: Migrer les Données Existantes (Optionnel)

### Si vous avez des données dans IndexedDB

Si vous avez déjà créé des patients, factures, etc. en mode local et que vous voulez les conserver:

#### 7.1 Exporter les Données

Ouvrez la console du navigateur (F12) et exécutez:

```javascript
// Exporter tous les patients
const db = new Dexie('TheraFlowDB');
db.version(102).stores({
  patients: '++id, name, type, lat, lng'
});

const patients = await db.table('patients').toArray();
console.log('Patients:', JSON.stringify(patients, null, 2));

// Copiez le résultat JSON
```

#### 7.2 Importer dans Supabase

1. Allez dans Supabase → **Table Editor**
2. Sélectionnez la table **patients**
3. Cliquez sur **"Insert"** → **"Insert row"**
4. Remplissez les données une par une

**OU**

Utilisez le SQL Editor:

```sql
INSERT INTO patients (name, type, location, address, phone, email)
VALUES
  ('Sophie Martin', 'HUMAN', 'Cabinet', '10 Rue de la Paix, Paris', '06 12 34 56 78', 'sophie@gmail.com'),
  ('Mistral', 'EQUINE', 'Ecuries du Val', 'Route de la Foret, 78000', NULL, NULL);
```

**Répétez** pour les autres tables si nécessaire.

---

## 🛠️ Étape 8: Configuration Avancée (Optionnel)

### 8.1 Activer les Realtime (Temps Réel)

Pour synchroniser les données en temps réel:

1. Dans Supabase → **Database** → **Replication**
2. Activez la réplication pour les tables que vous voulez:
   - `patients`
   - `appointments`
   - `invoices`
   - etc.

### 8.2 Configurer le Storage (Stockage de Fichiers)

Pour stocker des avatars, documents, etc.:

1. Dans Supabase → **Storage**
2. Créez un bucket:
   ```
   Name: avatars
   Public: ✅ Yes (si vous voulez des URLs publiques)
   ```

3. Créez un autre bucket pour les documents:
   ```
   Name: documents
   Public: ❌ No (documents privés)
   ```

### 8.3 Configurer les Politiques RLS Personnalisées

Les politiques actuelles donnent accès total aux utilisateurs authentifiés.

Pour restreindre l'accès (ex: un patient ne voit que ses propres données):

```sql
-- Exemple: Politique pour patients
DROP POLICY IF EXISTS "Enable all for authenticated users" ON patients;

-- Admins et Praticiens voient tout
CREATE POLICY "Admins and practitioners see all" ON patients
  FOR SELECT
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('ADMIN', 'PRACTITIONER')
  );

-- Patients ne voient que leurs propres données
CREATE POLICY "Patients see own data" ON patients
  FOR SELECT
  USING (
    auth.uid()::text = id::text
  );
```

---

## 🎉 Résumé des Étapes

- [x] **1. Créer un projet Supabase**
- [x] **2. Exécuter le script SQL `supabase/schema.sql`**
- [x] **3. Créer les utilisateurs dans Authentication**
  - arnaudvb7@gmail.com (PRACTITIONER)
  - admin@admin.com (ADMIN)
- [x] **4. Récupérer les clés API (Project URL + anon public key)**
- [x] **5. Mettre à jour `.env`**
  - `VITE_FORCE_LOCAL_AUTH=false`
  - `VITE_SUPABASE_URL=https://...`
  - `VITE_SUPABASE_ANON_KEY=eyJ...`
- [x] **6. Configurer Netlify avec les mêmes variables**
- [x] **7. Tester la connexion**

---

## 🚨 Dépannage

### Problème 1: "Invalid API key"

**Solution**: Vérifiez que vous utilisez la clé **`anon public`** et pas `service_role`

### Problème 2: "Email not confirmed"

**Solution**:
1. Allez dans **Authentication** → **Users**
2. Cliquez sur l'utilisateur
3. Cochez **"Email confirmed"**
4. Sauvegardez

### Problème 3: "Row Level Security policy violation"

**Solution**: Vérifiez que les politiques RLS sont bien créées (étape 2 du script SQL)

### Problème 4: L'app utilise encore IndexedDB

**Solution**:
1. Vérifiez que `VITE_FORCE_LOCAL_AUTH=false` dans `.env`
2. Redémarrez le serveur de dev (`npm run dev`)
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Problème 5: "Failed to fetch" ou erreurs réseau

**Solution**:
1. Vérifiez que votre Project URL est correcte (pas de `http://`, doit être `https://`)
2. Vérifiez que le projet Supabase est bien démarré (statut sur le dashboard)

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes:

1. **Vérifiez les logs** de la console navigateur (F12)
2. **Vérifiez les logs** de Supabase (Dashboard → Logs)
3. **Consultez la documentation** Supabase: [https://supabase.com/docs](https://supabase.com/docs)

---

## 🎊 Félicitations!

Votre application TheraFlow est maintenant connectée à Supabase!

**Avantages**:
- ✅ Base de données PostgreSQL cloud
- ✅ Authentification sécurisée
- ✅ API REST automatique
- ✅ Synchronisation en temps réel (si activée)
- ✅ Sauvegardes automatiques
- ✅ Scaling automatique
- ✅ 500 MB de stockage gratuit
- ✅ 2 GB de bande passante gratuite/mois

**Profitez-en! 🚀**
