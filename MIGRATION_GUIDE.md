# Guide de Migration vers Supabase

## 🎯 Objectif

Migrer TheraFlow d'une base de données locale (IndexedDB) vers une base de données cloud (Supabase PostgreSQL) pour:
- ✅ Synchronisation multi-appareils
- ✅ Sauvegarde automatique dans le cloud
- ✅ Accès depuis n'importe où
- ✅ Performance améliorée
- ✅ Collaboration possible
- ✅ Conformité RGPD renforcée

---

## 📋 Prérequis

1. **Compte Supabase** (gratuit): https://app.supabase.com
2. **Node.js** installé (déjà présent)
3. **Données locales** à migrer

---

## 🚀 Étapes de Migration

### Étape 1: Créer un Projet Supabase

1. Allez sur https://app.supabase.com
2. Cliquez sur **"New Project"**
3. Choisissez:
   - **Organization**: Créez-en une si nécessaire
   - **Name**: `theraflow-production` (ou nom de votre choix)
   - **Database Password**: Créez un mot de passe fort et **SAUVEGARDEZ-LE**
   - **Region**: Choisissez la région la plus proche (Europe West pour la France)
   - **Pricing Plan**: Free tier (gratuit) suffit pour commencer

4. Cliquez sur **"Create new project"**
5. Attendez quelques minutes que le projet soit provisionné

---

### Étape 2: Exécuter le Schéma SQL

1. Dans votre projet Supabase, allez dans l'onglet **"SQL Editor"** (icône `</>` dans la barre latérale)

2. Cliquez sur **"New query"**

3. Copiez **TOUT** le contenu du fichier `supabase/schema.sql` de votre projet

4. Collez-le dans l'éditeur SQL

5. Cliquez sur **"Run"** (ou `Ctrl+Enter`)

6. Vérifiez qu'il n'y a pas d'erreurs. Vous devriez voir:
   ```
   Success. No rows returned
   ```

7. Allez dans l'onglet **"Table Editor"** pour vérifier que les 14 tables ont été créées:
   - patients
   - appointments
   - invoices
   - recurring_invoices
   - expenses
   - sessions
   - sms_logs
   - survey_responses
   - goals
   - loyalty_cards
   - loyalty_transactions
   - referrals
   - promotions
   - settings

---

### Étape 3: Récupérer les Credentials Supabase

1. Dans votre projet Supabase, allez dans **Settings** (icône ⚙️)

2. Cliquez sur **API**

3. Copiez les informations suivantes:

   - **Project URL** (commence par `https://xxxxx.supabase.co`)
   - **anon public** key (longue clé alphanumérique)

---

### Étape 4: Configurer les Variables d'Environnement

1. À la racine de votre projet TheraFlow, créez un fichier `.env` (s'il n'existe pas déjà):

   ```bash
   touch .env
   ```

2. Ajoutez ces lignes dans le fichier `.env`:

   ```env
   # Google Gemini API Key (déjà existant)
   GEMINI_API_KEY=your_api_key_here

   # Supabase Configuration
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Remplacez:
   - `https://xxxxx.supabase.co` par votre **Project URL**
   - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` par votre **anon public key**

4. **Important**: Le fichier `.env` ne doit **JAMAIS** être committé dans Git (il est déjà dans `.gitignore`)

---

### Étape 5: Redémarrer le Serveur de Développement

1. Arrêtez le serveur actuel (`Ctrl+C` dans le terminal)

2. Relancez le serveur:

   ```bash
   npm run dev
   ```

3. Le serveur va automatiquement charger les nouvelles variables d'environnement

---

### Étape 6: Utiliser le Wizard de Migration

1. Ouvrez TheraFlow dans votre navigateur

2. Dans le menu latéral, cliquez sur **"Migration Cloud"** (icône nuage ☁️)

3. Vous verrez un écran de statut:
   - ✅ **Configuration OK**: Supabase est correctement configuré
   - ✅ **Données locales présentes**: Vos données IndexedDB sont détectées
   - ❌ **Données Supabase**: Vide (normal avant migration)

4. Cliquez sur **"Commencer la Migration"**

5. **Étape 1 - Backup**:
   - Cliquez sur **"Télécharger Backup"**
   - Un fichier JSON sera téléchargé avec TOUTES vos données
   - **Conservez ce fichier en sécurité** (backup de secours)

6. **Étape 2 - Migration**:
   - Cliquez sur **"Lancer Migration"**
   - Confirmez l'action dans la popup
   - Observez la progression en temps réel:
     * Chaque table affiche son avancement
     * Les barres de progression indiquent le nombre d'enregistrements migrés
     * La migration peut prendre quelques secondes à quelques minutes selon la quantité de données

7. **Étape 3 - Terminé**:
   - Message de succès affiché
   - Nombre de tables et d'enregistrements migrés
   - Option: **"Supprimer données locales"** (optionnel, pour libérer de l'espace)

---

### Étape 7: Vérification

1. Retournez sur Supabase dans l'onglet **"Table Editor"**

2. Cliquez sur la table **patients**

3. Vérifiez que vos patients sont présents

4. Vérifiez également les autres tables (appointments, invoices, etc.)

---

## 🔧 Résolution de Problèmes

### Erreur: "Supabase non configuré"

**Cause**: Les variables d'environnement ne sont pas chargées

**Solution**:
1. Vérifiez que le fichier `.env` existe à la racine du projet
2. Vérifiez que les variables commencent par `VITE_` (nécessaire pour Vite)
3. Redémarrez complètement le serveur de développement

---

### Erreur: "Failed to insert into table"

**Cause**: Le schéma SQL n'a pas été exécuté correctement

**Solution**:
1. Retournez sur Supabase → SQL Editor
2. Supprimez toutes les tables existantes (si nécessaire)
3. Ré-exécutez le fichier `schema.sql` en entier

---

### Erreur: "Network error" ou "CORS"

**Cause**: Configuration Supabase incomplète

**Solution**:
1. Vérifiez que l'URL Supabase est correcte
2. Vérifiez que la clé anon est correcte (copiée en entier)
3. Vérifiez que votre projet Supabase est bien actif (pas en pause)

---

### Migration Partielle (certaines tables en erreur)

**Cause**: Contraintes de foreign keys ou données invalides

**Solution**:
1. Consultez les messages d'erreur détaillés dans le wizard
2. Vérifiez les données problématiques dans IndexedDB
3. Relancez la migration (elle ne dupliquerait pas les données déjà migrées)

---

## 📊 Architecture de la Base de Données

### Tables Principales

| Table | Description | Relations |
|-------|-------------|-----------|
| `patients` | Patients (humains, équins, canins) | → appointments, sessions, loyalty_cards |
| `appointments` | Rendez-vous et séances | → patients |
| `invoices` | Factures et paiements | → patients (via patient_name) |
| `recurring_invoices` | Abonnements et facturation récurrente | - |
| `expenses` | Charges professionnelles | - |
| `sessions` | Comptes-rendus de séances | → patients, appointments |
| `sms_logs` | Historique SMS | - |
| `survey_responses` | Réponses enquêtes satisfaction | → patients, sessions |
| `goals` | Objectifs et KPIs | - |
| `loyalty_cards` | Cartes de fidélité | → patients |
| `loyalty_transactions` | Transactions fidélité | → loyalty_cards, patients |
| `referrals` | Programme de parrainage | → patients (referrer, referred) |
| `promotions` | Offres promotionnelles | - |
| `settings` | Configuration application | - |

### Vues Utiles

- **stats_overview**: Statistiques globales (patients, séances, CA, etc.)
- **overdue_invoices_detail**: Factures en retard avec calcul jours
- **patients_tagged**: Patients avec tags personnalisés

---

## 🔐 Sécurité et RGPD

### Row Level Security (RLS)

Toutes les tables ont **RLS activé** avec des politiques d'accès:
- Actuellement: Accès complet pour utilisateurs authentifiés
- Future: Possibilité d'ajouter des politiques multi-tenants

### Données Sensibles

- **Mot de passe database**: Stocké uniquement dans Supabase (pas dans le code)
- **Anon key**: Clé publique (sans danger si exposée, accès limité par RLS)
- **Service role key**: **NE JAMAIS utiliser côté client** (full access)

### Conformité RGPD

- Export patient: Utilise maintenant les APIs Supabase
- Suppression: Cascade automatique via foreign keys
- Anonymisation: Fonctionne sur Supabase avec mêmes règles

---

## 🚀 Fonctionnalités Avancées (Futures)

### 1. Authentification Multi-Utilisateurs

```typescript
// Activer l'authentification Supabase
const { data, error } = await supabase.auth.signUp({
  email: 'practitioner@example.com',
  password: 'secure-password'
});
```

### 2. Synchronisation Temps Réel

```typescript
// Écouter les changements en temps réel
supabase
  .channel('appointments')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'appointments'
  }, (payload) => {
    console.log('Change received!', payload);
    // Mettre à jour l'UI automatiquement
  })
  .subscribe();
```

### 3. Storage de Fichiers

```typescript
// Upload documents, images, PDFs
const { data, error } = await supabase.storage
  .from('session-documents')
  .upload('patient-123/scan.pdf', file);
```

### 4. Fonctions Serverless (Edge Functions)

- Génération factures PDF côté serveur
- Envoi SMS automatiques
- Rappels planifiés
- Analytics avancés

---

## 📝 Maintenance

### Backup Automatique

Supabase effectue des backups automatiques quotidiens (plan gratuit: 7 jours de rétention)

### Mise à Jour du Schéma

Pour ajouter une nouvelle table ou colonne:

1. Modifiez `supabase/schema.sql`
2. Exécutez uniquement les nouvelles commandes dans SQL Editor
3. Ou utilisez les migrations Supabase (recommandé pour production):

```bash
# Installer Supabase CLI
npm install -g supabase

# Créer une migration
supabase migration new add_new_table

# Appliquer la migration
supabase db push
```

---

## 🆘 Support

- **Documentation Supabase**: https://supabase.com/docs
- **Community Discord**: https://discord.supabase.com
- **GitHub Issues**: Pour bugs spécifiques à TheraFlow

---

## ✅ Checklist de Migration

- [ ] Compte Supabase créé
- [ ] Projet Supabase provisionné
- [ ] Schema SQL exécuté avec succès
- [ ] 14 tables visibles dans Table Editor
- [ ] Credentials copiés (URL + anon key)
- [ ] Fichier `.env` créé avec credentials
- [ ] Serveur dev redémarré
- [ ] Wizard de migration accessible
- [ ] Backup téléchargé
- [ ] Migration lancée et terminée avec succès
- [ ] Données vérifiées dans Supabase
- [ ] Application teste avec données cloud

---

**Migration réussie ! 🎉**

Vos données sont maintenant dans le cloud et accessibles partout.
