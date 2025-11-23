# Politique de Sécurité - TheraFlow Hybrid

## 🔒 Reporting Security Issues

Si vous découvrez une vulnérabilité de sécurité, **NE PAS** créer d'issue publique.

### Processus de Signalement

1. **Email**: Envoyez un email détaillé à `security@theraflow.com` (à créer)
2. **Informations à fournir**:
   - Description de la vulnérabilité
   - Étapes pour reproduire
   - Impact potentiel
   - Suggestions de correction (si applicable)

3. **Délai de réponse**: Nous nous engageons à répondre sous **48 heures**

### Politique de Divulgation Responsable

- ✅ Nous publierons un patch dans les **7 jours** pour les vulnérabilités critiques
- ✅ Nous publierons un patch dans les **30 jours** pour les vulnérabilités moyennes
- ✅ Credit: Nous mentionnerons le chercheur dans le CHANGELOG (si souhaité)

---

## 🛡️ Mesures de Sécurité Implémentées

### 1. Authentification

- ✅ **Supabase Auth** avec JWT tokens
- ✅ **Hashing bcrypt** des mots de passe
- ✅ **Politique mots de passe**:
  - Minimum 8 caractères
  - Au moins 1 majuscule
  - Au moins 1 minuscule
  - Au moins 1 chiffre
  - Au moins 1 caractère spécial (@$!%*?&)
- ✅ **Rate limiting**: 5 tentatives max, lockout 15 minutes
- ✅ **Session expiration**: 1 heure (auto-refresh)
- ⚠️ **2FA**: Recommandé pour admins (à activer manuellement)

### 2. Protection des Données

- ✅ **Encryption at rest**: AES-256 (Supabase)
- ✅ **Encryption in transit**: TLS 1.3
- ✅ **Row Level Security**: Toutes tables protégées
- ✅ **Variables d'environnement**: Clés API jamais exposées côté client
- ✅ **Backup automatique**: Chiffré, quotidien

### 3. Protection contre les Attaques

#### XSS (Cross-Site Scripting)
- ✅ React auto-escaping
- ✅ Pas de `dangerouslySetInnerHTML`
- ✅ Pas de `eval()` ou code dynamique
- ✅ Content Security Policy (CSP) headers

#### SQL Injection
- ✅ Supabase ORM (requêtes paramétrées)
- ✅ Pas de SQL brut côté client
- ✅ Prepared statements automatiques

#### CSRF (Cross-Site Request Forgery)
- ✅ Tokens CSRF automatiques (Supabase)
- ✅ SameSite cookies

#### Clickjacking
- ✅ X-Frame-Options: DENY
- ✅ CSP frame-ancestors

### 4. Headers de Sécurité

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.tailwindcss.com;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 5. Validation & Sanitization

- ✅ Validation TypeScript stricte
- ✅ Validation côté client ET serveur (RLS)
- ✅ Whitelist types MIME (fichiers)
- ✅ Limite taille fichiers: 10 MB
- ✅ Sanitization automatique inputs

### 6. Conformité RGPD

- ✅ Droit d'accès (export JSON)
- ✅ Droit à l'oubli (suppression cascade)
- ✅ Portabilité des données
- ✅ Minimisation des données
- ✅ Chiffrement
- ⚠️ Consentement cookies (à implémenter)
- ⚠️ Notification breach (à implémenter)

---

## 🔐 Configuration Sécurisée

### Variables d'Environnement Requises

**IMPORTANT**: Ne JAMAIS committer ces valeurs dans Git

```env
# .env (production)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Secrets Supabase (Edge Functions)

Configurez dans Supabase Dashboard > Project Settings > Edge Functions:

```bash
# Secrets côté serveur uniquement
GEMINI_API_KEY=votre_clé_gemini
SMTP_PASSWORD=votre_mot_de_passe_smtp
TWILIO_AUTH_TOKEN=votre_token_twilio
```

### Recommandations Production

1. **HTTPS Obligatoire**
   - Certificat SSL valide
   - HSTS activé
   - Redirection HTTP → HTTPS

2. **Environnement Isolé**
   - Séparation dev/staging/prod
   - Credentials différents par environnement
   - Pas de données production en dev

3. **Monitoring**
   - Logs centralisés (Sentry, LogRocket)
   - Alertes temps réel
   - Audit trail complet

4. **Backup**
   - Backup quotidien automatique
   - Chiffrement backups
   - Test restauration mensuel

5. **Updates**
   - Dépendances à jour (Dependabot)
   - Patches sécurité sous 48h
   - Audit npm trimestriel

---

## 📋 Checklist Déploiement Production

Avant tout déploiement en production:

- [ ] Variables d'environnement configurées
- [ ] `.env` dans `.gitignore`
- [ ] HTTPS activé (certificat valide)
- [ ] RLS Supabase vérifié
- [ ] CSP headers configurés
- [ ] Logs sensibles désactivés
- [ ] `npm audit` exécuté (0 vulnérabilités)
- [ ] Tests sécurité passés
- [ ] Backup configuré
- [ ] Monitoring activé
- [ ] Plan incident documenté
- [ ] RGPD: Politique affichée
- [ ] Rate limiting testé
- [ ] 2FA activé (admins)
- [ ] Audit trail activé
- [ ] Revue code sécurité

---

## 🚨 Plan de Réponse aux Incidents

### En cas de violation de données:

1. **Détection** (< 1 heure)
   - Monitoring automatique
   - Alertes temps réel
   - Investigation immédiate

2. **Confinement** (< 6 heures)
   - Isoler système compromis
   - Révoquer accès suspects
   - Bloquer vecteur d'attaque

3. **Analyse** (< 24 heures)
   - Identifier données exposées
   - Évaluer impact
   - Documenter timeline

4. **Notification** (< 72 heures)
   - CNIL (obligation RGPD)
   - Utilisateurs affectés
   - Autorités compétentes

5. **Remediation**
   - Patch vulnérabilité
   - Renforcer sécurité
   - Post-mortem

6. **Communication**
   - Transparence totale
   - Blog post technique
   - Lessons learned

---

## 🔍 Audit de Sécurité

### Audit Interne (Mensuel)

- [ ] Scan vulnérabilités dépendances
- [ ] Revue logs sécurité
- [ ] Test authentication
- [ ] Vérification sauvegardes
- [ ] Audit accès utilisateurs

### Audit Externe (Annuel)

- [ ] Pentest professionnel
- [ ] Revue code sécurité
- [ ] Conformité RGPD
- [ ] Test disaster recovery
- [ ] Certification (optionnel)

### Outils Recommandés

**SAST (Static Analysis)**:
- SonarQube
- Semgrep
- ESLint (security plugins)

**DAST (Dynamic Analysis)**:
- OWASP ZAP
- Burp Suite
- Nikto

**Dependency Scanning**:
- Snyk
- npm audit
- Dependabot

**Secrets Detection**:
- GitGuardian
- TruffleHog
- git-secrets

---

## 📞 Contact Sécurité

- **Email**: security@theraflow.com (à créer)
- **PGP Key**: [Clé publique] (optionnel)
- **Bug Bounty**: Non disponible actuellement

---

## 📚 Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [CNIL - RGPD](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [ANSSI Recommandations](https://www.ssi.gouv.fr/)

---

**Dernière mise à jour**: 2025-11-22
**Version**: 2.0
**Responsable Sécurité**: [À définir]
