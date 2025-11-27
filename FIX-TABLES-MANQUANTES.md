# 🔧 Correction: Tables Manquantes dans Supabase

## ❌ Problème Identifié

Votre base de données Supabase contient **14 tables** au lieu de **16**.

### Tables Manquantes:

1. ❌ **`appointment_requests`** - Demandes de rendez-vous
2. ❌ **`notifications`** - Notifications email/SMS

**Note**: La table `users` n'existe pas dans Supabase car on utilise `auth.users` (table système de Supabase pour l'authentification).

---

## ✅ Solution Rapide (2 Minutes)

### Option 1: Exécuter le Script d'Ajout (Recommandé)

1. **Ouvrez Supabase** → SQL Editor
2. **Copiez** le contenu du fichier `supabase/add-missing-tables.sql`
3. **Collez** dans l'éditeur SQL
4. **Cliquez sur "Run"** (ou Ctrl+Enter)
5. ✅ **Vérifiez** qu'il n'y a pas d'erreurs

**C'est tout!** Les 2 tables manquantes sont maintenant créées avec:
- ✅ Structure complète
- ✅ Index pour les performances
- ✅ Triggers auto-update
- ✅ Row Level Security (RLS)
- ✅ Politiques d'accès

---

### Option 2: Réexécuter le Schéma Complet (Si vous préférez tout recréer)

**⚠️ ATTENTION**: Cette méthode va SUPPRIMER toutes vos données existantes!

Seulement si vous n'avez PAS encore de données importantes:

1. Dans Supabase → SQL Editor
2. **Supprimez toutes les tables**:
```sql
-- ⚠️ Ceci va TOUT supprimer!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

3. **Exécutez le schéma complet mis à jour**:
   - Copiez tout le contenu de `supabase/schema.sql` (maintenant à jour avec les 16 tables)
   - Collez et exécutez

---

## 🔍 Vérification

Pour vérifier que tout est OK:

```sql
SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE table_name = t.table_name
     AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Vous devriez voir 16 tables**:

| Table | Colonnes |
|-------|----------|
| appointment_requests | 18 |
| appointments | 11 |
| expenses | 8 |
| goals | 11 |
| invoices | 14 |
| loyalty_cards | 11 |
| loyalty_transactions | 7 |
| notifications | 9 |
| patients | 14 |
| promotions | 13 |
| recurring_invoices | 13 |
| referrals | 11 |
| sessions | 12 |
| settings | 13 |
| sms_logs | 8 |
| survey_responses | 10 |

---

## 📋 Détails des Tables Ajoutées

### Table: `appointment_requests`

Gestion des demandes de rendez-vous avec système de proposition/contre-proposition.

**Colonnes principales**:
- `patient_id` - Référence au patient
- `requested_start_time` - Créneau demandé
- `status` - PENDING, ACCEPTED, REJECTED, EXPIRED
- `proposed_start_time` - Créneau alternatif proposé
- `history` - Historique JSON des échanges
- `type` - CABINET, DOMICILE, STABLE

**Utilisée pour**:
- Demandes de RDV en ligne
- Système de proposition/contre-proposition
- Historique des négociations

---

### Table: `notifications`

File d'attente des notifications email/SMS à envoyer.

**Colonnes principales**:
- `type` - EMAIL, SMS, BOTH
- `recipient` - Email ou numéro de téléphone
- `message` - Contenu de la notification
- `status` - PENDING, SENT, FAILED
- `related_request_id` - Lien vers appointment_request si applicable

**Utilisée pour**:
- Queue de notifications
- Traçabilité des envois
- Gestion des erreurs d'envoi

---

## 🎯 Pourquoi Ces Tables Manquaient?

Le fichier `supabase/schema.sql` initial était basé sur une version antérieure de l'application qui n'incluait pas encore ces fonctionnalités.

**Maintenant corrigé**:
- ✅ `supabase/schema.sql` mis à jour avec toutes les tables
- ✅ `supabase/add-missing-tables.sql` créé pour ajouter uniquement les tables manquantes
- ✅ Tous les index, triggers, et RLS configurés

---

## 🚨 Si Vous Avez des Erreurs

### Erreur: "relation already exists"

Cela signifie que la table existe déjà. Ignorez cette erreur ou vérifiez avec:

```sql
SELECT * FROM information_schema.tables
WHERE table_name IN ('appointment_requests', 'notifications')
AND table_schema = 'public';
```

### Erreur: "foreign key constraint"

Exécutez d'abord la création de la table `appointment_requests`, puis `notifications` (dans cet ordre).

### Erreur: "function does not exist"

Assurez-vous que la fonction `update_updated_at_column()` existe:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'update_updated_at_column';
```

Si elle n'existe pas, copiez cette section du fichier `schema.sql`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

---

## ✅ Après la Correction

Une fois les tables ajoutées:

1. **Vérifiez la connexion** à votre application
2. **Testez la création** d'un patient ou d'un rendez-vous
3. **Vérifiez les logs** dans la console navigateur (F12)

Vous devriez voir:
```
☁️ Supabase configuré - Utilisation de Supabase Cloud
```

Et plus d'erreurs du type "relation does not exist".

---

## 📚 Fichiers Mis à Jour

| Fichier | Statut | Description |
|---------|--------|-------------|
| `supabase/schema.sql` | ✅ Mis à jour | Schéma complet avec 16 tables |
| `supabase/add-missing-tables.sql` | ✅ Nouveau | Script pour ajouter uniquement les tables manquantes |

---

## 🎊 Résumé

**Avant**: 14 tables ❌
**Après**: 16 tables ✅

**Action requise**: Exécuter `supabase/add-missing-tables.sql` dans Supabase SQL Editor

**Temps**: 2 minutes

**Impact**: Votre application peut maintenant utiliser toutes les fonctionnalités!

---

**Bon courage! 🚀**
