# 📁 Fichiers SQL Supabase

Ce dossier contient tous les scripts SQL pour configurer votre base de données Supabase.

---

## 📋 Fichiers Disponibles

### 1. **schema.sql** ⭐ (LE PRINCIPAL)

**Schéma complet de la base de données**

Contient:
- ✅ 17 tables (profiles, patients, appointments, invoices, etc.)
- ✅ Tous les index
- ✅ Tous les triggers
- ✅ Row Level Security (RLS)
- ✅ Fonctions automatiques (handle_new_user, update_last_login)
- ✅ Vues SQL utiles
- ✅ Données initiales (settings)

**Quand l'utiliser**:
- Première fois que vous configurez Supabase
- Pour recréer complètement la base (⚠️ supprime les données)

**Comment l'utiliser**:
1. Supabase → SQL Editor → New query
2. Copiez TOUT le contenu de ce fichier
3. Collez et Run

**Temps**: 30 secondes

---

### 2. **add-missing-tables.sql** 🔧

**Ajoute uniquement les 2 tables manquantes**

Contient:
- ✅ Table `appointment_requests`
- ✅ Table `notifications`
- ✅ Index, triggers, RLS pour ces 2 tables

**Quand l'utiliser**:
- Si vous avez déjà 14 tables mais il en manque 2
- Pour ne pas recréer toutes les tables

**Comment l'utiliser**:
1. Supabase → SQL Editor → New query
2. Copiez le contenu de ce fichier
3. Collez et Run

**Temps**: 10 secondes

---

### 3. **add-profiles-table.sql** 👤

**Crée la table profiles (utilisateurs)**

Contient:
- ✅ Table `profiles`
- ✅ Triggers automatiques (auto-création profil, auto-update last_login)
- ✅ RLS sécurisé (users vs admins)
- ✅ Fonctions handle_new_user() et update_last_login()
- ✅ Requête pour créer profils des users existants

**Quand l'utiliser**:
- Si vous n'avez pas encore la table profiles
- Pour ajouter uniquement cette table sans toucher aux autres

**Comment l'utiliser**:
1. Supabase → SQL Editor → New query
2. Copiez le contenu de ce fichier
3. Collez et Run

**Temps**: 15 secondes

---

### 4. **create-users.sql** 📝

**Documentation pour créer les utilisateurs**

Contient:
- ✅ Instructions pour le Dashboard Supabase
- ✅ Exemples SQL (méthode avancée)
- ✅ Métadonnées à ajouter

**Quand l'utiliser**:
- Référence pour créer les comptes dans Authentication

**Comment l'utiliser**:
- Lisez ce fichier comme guide
- Utilisez plutôt le Dashboard (méthode recommandée)

---

## 🎯 Quel Fichier Utiliser?

### Scénario 1: Première Configuration

**Utilisez**: `schema.sql`

C'est le fichier le plus complet qui crée tout d'un coup.

### Scénario 2: Il Manque des Tables

**Cas A**: Il manque `appointment_requests` et `notifications`
→ **Utilisez**: `add-missing-tables.sql`

**Cas B**: Il manque la table `profiles`
→ **Utilisez**: `add-profiles-table.sql`

**Cas C**: Il manque plusieurs tables différentes
→ **Utilisez**: `schema.sql` (réexécutez tout)

### Scénario 3: Créer les Utilisateurs

**N'utilisez PAS** de fichier SQL!

Utilisez le **Dashboard Supabase**:
1. Authentication → Users → Add user
2. Suivez le guide dans `../ETAPES-FINALES-SUPABASE.md`

---

## 📊 Structure Complète des Tables

Après avoir exécuté `schema.sql`, vous aurez:

| # | Table | Description |
|---|-------|-------------|
| 1 | profiles | Profils utilisateurs (name, role, etc.) |
| 2 | patients | Patients (humains, équins, canins) |
| 3 | appointments | Rendez-vous et séances |
| 4 | invoices | Factures |
| 5 | recurring_invoices | Factures récurrentes |
| 6 | expenses | Dépenses professionnelles |
| 7 | sessions | Comptes-rendus de séances |
| 8 | sms_logs | Logs des SMS envoyés |
| 9 | survey_responses | Réponses aux sondages |
| 10 | goals | Objectifs et KPIs |
| 11 | loyalty_cards | Cartes de fidélité |
| 12 | loyalty_transactions | Transactions fidélité |
| 13 | referrals | Programme de parrainage |
| 14 | promotions | Offres promotionnelles |
| 15 | appointment_requests | Demandes de RDV |
| 16 | notifications | File notifications email/SMS |
| 17 | settings | Paramètres de l'application |

---

## ✅ Vérification

Pour vérifier que tout est bien créé:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Vous devriez voir **17 tables**.

---

## 🚨 En Cas d'Erreur

### "relation already exists"

C'est normal si vous réexécutez le script. La table existe déjà.

**Solution**: Ignorez l'erreur OU supprimez d'abord:
```sql
DROP TABLE IF EXISTS nom_de_la_table CASCADE;
```

### "function does not exist"

Il manque probablement la fonction `update_updated_at_column()`.

**Solution**: Elle est dans `schema.sql`. Exécutez cette partie:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

### "permission denied for table auth.users"

C'est normal pour les méthodes SQL avancées de création d'utilisateurs.

**Solution**: Utilisez le **Dashboard Supabase** (Authentication → Users).

---

## 📚 Documentation Complète

Pour plus de détails, consultez dans le dossier parent:

- **ETAPES-FINALES-SUPABASE.md** ⭐ - Guide rapide (5 min)
- **SETUP-AUTH-SUPABASE.md** - Guide authentification détaillé
- **GUIDE-TABLE-PROFILES.md** - Tout sur la table profiles
- **QUICK-START-SUPABASE.md** - Guide rapide général
- **GUIDE-CONFIGURATION-SUPABASE.md** - Guide complet (30 min)

---

## ⚡ Quick Start

Pour démarrer rapidement:

1. **Exécutez**: `schema.sql` dans Supabase SQL Editor
2. **Créez les utilisateurs**: Via Authentication → Users (voir `../ETAPES-FINALES-SUPABASE.md`)
3. **Configurez** `.env` avec vos clés Supabase
4. **Testez** la connexion!

**Temps total**: 5 minutes

---

**Bonne configuration! 🚀**
