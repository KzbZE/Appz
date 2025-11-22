# Guide de Déploiement Production - TheraFlow Hybrid v2.0

**Date**: 2025-11-22
**Version**: Enterprise Edition v2.0
**Statut**: ✅ Prêt pour Production

---

## 📋 Prérequis

Avant de commencer le déploiement:

- [ ] Compte Supabase créé (https://app.supabase.com)
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Compte Sentry ou LogRocket pour monitoring (optionnel)
- [ ] Accès git au repository
- [ ] Node.js 18+ installé

---

## 🚀 Déploiement Étape par Étape

### Étape 1: Créer le Projet Supabase

1. **Connexion à Supabase**
   ```bash
   # Ouvrir https://app.supabase.com
   # Cliquer sur "New Project"
   ```

2. **Configuration Projet**
   - **Name**: `theraflow-production`
   - **Database Password**: Générer un mot de passe fort (SAUVEGARDER!)
   - **Region**: `Europe West (Frankfurt)` pour Europe
   - **Pricing**: Free Tier (ou Pro si besoin)

3. **Attendre Provisioning** (~2 minutes)

---

### Étape 2: Déployer le Schéma SQL

1. **Accéder au SQL Editor**
   ```
   Supabase Dashboard → SQL Editor → New Query
   ```

2. **Copier et Exécuter**
   ```bash
   # Copier le contenu complet de:
   cat supabase/schema.sql

   # Coller dans SQL Editor
   # Cliquer "Run" (Ctrl+Enter)
   ```

3. **Vérifier les Tables**
   ```
   Table Editor → Vérifier 14 tables créées:
   ✅ patients
   ✅ appointments
   ✅ invoices
   ✅ recurring_invoices
   ✅ expenses
   ✅ sessions
   ✅ sms_logs
   ✅ survey_responses
   ✅ goals
   ✅ loyalty_cards
   ✅ loyalty_transactions
   ✅ referrals
   ✅ promotions
   ✅ settings
   ```

---

### Étape 3: Créer les Buckets Storage

1. **Accéder au Storage**
   ```
   Supabase Dashboard → Storage → Create Bucket
   ```

2. **Créer 6 Buckets**
   ```bash
   # Pour chaque bucket:
   - Name: [nom du bucket]
   - Public: false (privé)
   - File size limit: 10485760 (10 MB)
   - Allowed MIME types: image/*, application/pdf
   ```

   **Buckets à créer**:
   - `patient-documents`
   - `session-files`
   - `invoices-pdf`
   - `avatars`
   - `receipts`
   - `medical-images`

---

### Étape 4: Déployer l'Edge Function

1. **Installer Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login Supabase**
   ```bash
   supabase login
   ```

3. **Lier le Projet**
   ```bash
   supabase link --project-ref [votre-project-ref]
   # Trouver project-ref dans Settings → General
   ```

4. **Configurer le Secret**
   ```bash
   # Ajouter la clé Gemini API (côté serveur sécurisé)
   supabase secrets set GEMINI_API_KEY=votre_clé_gemini_ici
   ```

5. **Déployer la Function**
   ```bash
   supabase functions deploy gemini-proxy
   ```

6. **Vérifier le Déploiement**
   ```bash
   supabase functions list
   # Devrait afficher: gemini-proxy (deployed)
   ```

---

### Étape 5: Configurer les Variables d'Environnement

1. **Récupérer les Credentials Supabase**
   ```
   Supabase Dashboard → Settings → API
   ```

2. **Créer le fichier `.env`**
   ```bash
   # À la racine du projet
   cp .env.example .env
   ```

3. **Remplir les Variables**
   ```env
   # .env (PRODUCTION)
   VITE_SUPABASE_URL=https://[votre-project-ref].supabase.co
   VITE_SUPABASE_ANON_KEY=[votre-anon-key]

   # Optionnel: Google Calendar (si utilisé)
   GEMINI_API_KEY=[votre-gemini-api-key]
   ```

4. **Vérifier le .gitignore**
   ```bash
   # S'assurer que .env est ignoré
   cat .gitignore | grep "\.env"
   ```

---

### Étape 6: Build Production

1. **Installer Dépendances**
   ```bash
   npm install
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Vérifier le Build**
   ```bash
   # Devrait afficher:
   # ✓ built in ~12s
   # dist/index.html: ~2.34 KB
   # dist/assets/...: ~1.9 MB
   ```

---

### Étape 7: Déployer sur Vercel/Netlify

#### Option A: Vercel (Recommandé)

1. **Installer Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login Vercel**
   ```bash
   vercel login
   ```

3. **Déployer**
   ```bash
   vercel --prod
   ```

4. **Configurer Variables d'Environnement**
   ```bash
   # Dans Vercel Dashboard → Project → Settings → Environment Variables
   VITE_SUPABASE_URL=[valeur]
   VITE_SUPABASE_ANON_KEY=[valeur]
   ```

5. **Redéployer**
   ```bash
   vercel --prod
   ```

#### Option B: Netlify

1. **Installer Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Déployer**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Variables d'Environnement**
   ```bash
   # Dans Netlify Dashboard → Site settings → Environment variables
   VITE_SUPABASE_URL=[valeur]
   VITE_SUPABASE_ANON_KEY=[valeur]
   ```

---

### Étape 8: Configurer le Domaine (Optionnel)

1. **Vercel**
   ```
   Vercel Dashboard → Domains → Add Domain
   ```

2. **Configurer DNS**
   ```
   Type: CNAME
   Name: theraflow (ou @)
   Value: cname.vercel-dns.com
   ```

3. **Activer HTTPS**
   ```
   Vercel active automatiquement Let's Encrypt
   ```

---

### Étape 9: Migration des Données

1. **Accéder à l'Application**
   ```
   https://votre-domaine.com
   ```

2. **Utiliser le Wizard de Migration**
   ```
   Navigation → Migration Cloud
   ```

3. **Suivre les Étapes**
   - ✅ Étape 1: Télécharger Backup
   - ✅ Étape 2: Lancer Migration
   - ✅ Étape 3: Vérifier Données

4. **Vérifier dans Supabase**
   ```
   Table Editor → patients → Vérifier données
   ```

---

### Étape 10: Créer le Premier Utilisateur Admin

1. **Accéder à l'Application**
   ```
   https://votre-domaine.com
   ```

2. **Inscription Admin**
   ```
   Mode: Inscription
   Email: admin@votredomaine.com
   Password: [Mot de passe fort]
   Nom: Administrateur Principal
   Rôle: Admin
   ```

3. **Vérifier dans Supabase**
   ```
   Authentication → Users → Vérifier utilisateur créé
   ```

---

### Étape 11: Activer 2FA (Admins)

1. **Dans Supabase Dashboard**
   ```
   Authentication → Settings → Multi-Factor Authentication
   ```

2. **Activer TOTP**
   ```
   Enable TOTP → Save
   ```

3. **Configurer dans l'Application**
   ```typescript
   // Les admins pourront activer 2FA dans leur profil
   ```

---

### Étape 12: Configurer le Monitoring (Optionnel)

#### Option A: Sentry

1. **Créer Compte Sentry**
   ```
   https://sentry.io
   ```

2. **Créer Projet**
   ```
   Platform: React
   ```

3. **Installer SDK**
   ```bash
   npm install @sentry/react @sentry/vite-plugin
   ```

4. **Configurer**
   ```typescript
   // main.tsx
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "votre-dsn-sentry",
     environment: "production",
     tracesSampleRate: 0.1,
   });
   ```

#### Option B: LogRocket

1. **Créer Compte**
   ```
   https://logrocket.com
   ```

2. **Installer SDK**
   ```bash
   npm install logrocket
   ```

3. **Initialiser**
   ```typescript
   import LogRocket from 'logrocket';
   LogRocket.init('votre-app-id');
   ```

---

### Étape 13: Configurer les Sauvegardes

1. **Supabase Backups (Automatique)**
   ```
   Settings → Database → Backups
   ```

2. **Vérifier Configuration**
   ```
   ✅ Daily backups: Enabled
   ✅ Retention: 7 days (Free) / 30 days (Pro)
   ✅ Point-in-time recovery: Available (Pro)
   ```

3. **Test Restauration**
   ```bash
   # Tester la restauration mensuelle
   # Créer projet test
   # Restaurer backup
   # Vérifier données
   ```

---

### Étape 14: Tests Post-Déploiement

#### Checklist Tests

```bash
# 1. Test Authentification
curl -X POST https://votre-api.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123!"}'

# 2. Test Rate Limiting
for i in {1..6}; do
  curl -X POST https://votre-api.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"wrong@test.com","password":"wrong"}'
done
# Devrait bloquer après 5 tentatives

# 3. Test CSP Headers
curl -I https://votre-domaine.com | grep -i "content-security"

# 4. Test HTTPS
curl -I https://votre-domaine.com | grep -i "strict-transport"

# 5. Test Upload Fichiers
# Interface web → Upload avatar patient

# 6. Test Temps Réel
# Ouvrir 2 fenêtres
# Modifier patient dans fenêtre 1
# Vérifier update automatique fenêtre 2

# 7. Test RGPD
# Export données patient
# Vérifier JSON téléchargé

# 8. Test Performance
# Google Lighthouse
# Score > 90
```

---

## 🔒 Post-Déploiement Sécurité

### 1. Activer HTTPS Redirect

**Vercel** (automatique):
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### 2. Configurer Rate Limiting Supabase

```
Supabase Dashboard → Settings → API
Rate Limiting: 60 requests/minute
```

### 3. Activer Audit Logs

```sql
-- Créer table audit_log
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id BIGINT,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activer triggers (voir SECURITY_AUDIT.md)
```

### 4. Configurer Alertes

**Supabase**:
```
Settings → Notifications
✅ Database usage > 80%
✅ Storage usage > 80%
✅ API errors > 100/hour
```

**Sentry** (si configuré):
```
Alerts → New Alert Rule
✅ Error rate > 1%
✅ Response time > 2s
```

---

## 📊 Monitoring Production

### Dashboards à Surveiller

1. **Supabase Dashboard**
   - Database CPU/Memory
   - Storage usage
   - API request rate
   - Error rate

2. **Vercel Analytics**
   - Pageviews
   - Unique visitors
   - Core Web Vitals
   - Geographic distribution

3. **Sentry** (si configuré)
   - Error rate
   - Performance
   - User feedback
   - Release health

### Métriques Clés

```
Objectifs Production:
✅ Uptime: > 99.9%
✅ Response time: < 500ms (p95)
✅ Error rate: < 0.1%
✅ CPU usage: < 70%
✅ Memory usage: < 80%
✅ Storage usage: < 80%
```

---

## 🚨 Plan de Rollback

En cas de problème en production:

### Rollback Rapide (< 5 minutes)

1. **Vercel**
   ```bash
   # Lister déploiements
   vercel list

   # Rollback au déploiement précédent
   vercel rollback [deployment-url]
   ```

2. **Base de Données**
   ```
   Supabase → Database → Backups → Restore
   Sélectionner backup pré-déploiement
   ```

### Rollback Complet (< 30 minutes)

1. **Code**
   ```bash
   git revert HEAD
   git push
   vercel --prod
   ```

2. **Base de Données**
   ```sql
   -- Restaurer schéma précédent
   -- Restaurer données depuis backup
   ```

3. **Variables d'Environnement**
   ```bash
   # Restaurer anciennes valeurs
   vercel env pull
   ```

---

## ✅ Checklist Post-Déploiement

- [ ] Application accessible via HTTPS
- [ ] Certificat SSL valide
- [ ] Variables d'environnement configurées
- [ ] Base de données Supabase opérationnelle
- [ ] Edge Function déployée et fonctionnelle
- [ ] Storage buckets créés
- [ ] Premier utilisateur admin créé
- [ ] Tests authentification passés
- [ ] Tests rate limiting validés
- [ ] CSP headers vérifiés
- [ ] Sauvegardes automatiques activées
- [ ] Monitoring configuré (optionnel)
- [ ] Alertes configurées
- [ ] Documentation équipe créée
- [ ] Plan incident documenté
- [ ] Contacts urgence définis

---

## 📞 Support Post-Déploiement

### En cas de problème:

1. **Vérifier Logs**
   ```bash
   # Vercel
   vercel logs

   # Supabase
   Dashboard → Logs → Edge Functions/Database
   ```

2. **Vérifier Status**
   ```
   https://status.supabase.com
   https://status.vercel.com
   ```

3. **Contacter Support**
   - Supabase: support@supabase.com
   - Vercel: support@vercel.com

### Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Guides Projet**:
  - MIGRATION_GUIDE.md
  - SECURITY.md
  - SECURITY_AUDIT.md
  - IMPLEMENTATION_SUMMARY.md

---

## 🎉 Déploiement Terminé !

**Félicitations!** TheraFlow Hybrid v2.0 est maintenant en production.

**Prochaines Étapes**:
1. ✅ Former l'équipe sur nouvelles fonctionnalités
2. ✅ Communiquer aux utilisateurs
3. ✅ Surveiller métriques pendant 48h
4. ✅ Collecter feedback utilisateurs
5. ✅ Planifier prochaines fonctionnalités

---

**Déployé avec succès** 🚀
**Score Sécurité: A+ (88/100)** 🏆
**Prêt pour Production** ✅
