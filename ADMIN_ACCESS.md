# 🔐 Guide d'Accès Admin & Nouvelles Fonctionnalités

## 🚀 Panneau d'Administration Caché

### Accès au Panneau Admin

Le panneau d'administration est caché et accessible de **3 façons** :

#### Méthode 1: Combinaison de touches (Recommandé)
Appuyez simultanément sur : **`Ctrl + Shift + A`**

#### Méthode 2: URL Paramètre
Ajoutez `?admin=true` à l'URL :
```
https://votre-app.netlify.app/?admin=true
```

#### Méthode 3: Via la Console
Ouvrez la console développeur (F12) et tapez :
```javascript
window.location.href = '/?admin=true';
```

### 🔑 Connexion Admin

**Mot de passe par défaut :** `TheraFlow2025!`

⚠️ **IMPORTANT:** Changez ce mot de passe dès que possible dans le code source (`components/AdminPanel.tsx` ligne 23).

### 📊 Fonctionnalités du Panneau Admin

1. **Vue d'ensemble**
   - Statistiques DB (patients, rendez-vous, factures, dépenses)
   - Informations système (version, navigateur, taille DB)

2. **Gestion Base de Données**
   - ✅ Exporter la DB complète (JSON)
   - ✅ Importer une sauvegarde
   - ⚠️ Vider la DB (DANGER!)
   - 📊 Vue des tables et nombre d'enregistrements

3. **Clés API**
   - Vérification de toutes les clés configurées
   - Statut de chaque service (actif/inactif)
   - Liste: Gemini, Google Places, Supabase, Twilio, SendGrid, Stripe

4. **Configuration Avancée**
   - Mode Debug (logs détaillés)
   - Vider le cache navigateur
   - Reset complet de l'application

---

## 🎨 Nouvelles Fonctionnalités Implémentées

### 1. 📄 **Scanner OCR** (`/ocr`)
**Accès:** Menu → Scanner OCR

**Fonctionnalités:**
- Capture avec caméra en temps réel
- Import de fichiers (JPG, PNG, PDF)
- Reconnaissance de texte (simulation - peut être activé avec Tesseract.js)
- Historique des scans
- Export texte détecté (copie/téléchargement)

**Activation OCR réel:**
```bash
npm install tesseract.js
```

### 2. 🗺️ **Cartographie Interactive** (`/map`)
**Accès:** Menu → Carte

**Fonctionnalités:**
- Vue cartographique des patients géolocalisés
- Filtres par type (Humain/Équin/Canin)
- Heatmap des zones chaudes
- Statistiques: distance moyenne, zones à fort potentiel
- Marqueurs interactifs

**Intégration vraie carte:**
```bash
npm install @react-google-maps/api
# ou
npm install react-map-gl
```

### 3. 🎤 **Notes Vocales** (`/voice`)
**Accès:** Menu → Notes Vocales

**Fonctionnalités:**
- Enregistrement audio avec pause/reprise
- Lecture des notes enregistrées
- Transcription automatique (simulation - activable avec API)
- Téléchargement audio (format WebM)
- Historique complet

**APIs de transcription recommandées:**
- Web Speech API (gratuit, navigateur)
- Google Cloud Speech-to-Text
- Whisper API (OpenAI)
- AssemblyAI

### 4. 📸 **Galerie Photos Patients** (Existant - Amélioré)
- Upload avec compression automatique
- Catégories: Avant/Après/Progrès
- Gestion consentement RGPD
- Métadonnées (partie du corps, angle de vue)

### 5. 🔔 **Rappels Automatiques** (Existant - Amélioré)
- Configuration templates SMS/Email
- Variables dynamiques
- Test d'envoi
- Historique avec stats

### 6. 💳 **Paiements Stripe** (Existant - Amélioré)
- Liens de paiement pour factures
- Acomptes 30% configurables
- Gestion abonnements/forfaits
- Configuration API intégrée

### 7. 📊 **Exports Comptables** (Existant)
- Excel multi-feuilles
- Format Pennylane (CSV)
- Frais kilométriques

---

## 🌙 Dark Mode

### Service de Thème Créé
Fichier: `services/themeService.ts`

**Fonctionnalités:**
- Détection préférence système
- Basculement manuel light/dark
- Sauvegarde dans localStorage
- Application automatique au chargement

**Utilisation dans un composant:**
```typescript
import themeService from '../services/themeService';

// Basculer le thème
const newTheme = themeService.toggleTheme(); // 'light' ou 'dark'

// Obtenir le thème actuel
const current = themeService.getTheme();

// Définir manuellement
themeService.setTheme('dark');
```

**À faire:** Ajouter un toggle dans `SettingsModule.tsx`

---

## 🔧 Netlify Functions Créées

### 📁 Structure
```
netlify/
└── functions/
    ├── create-payment-link.ts  (Stripe)
    ├── send-sms.ts             (Twilio)
    └── send-email.ts           (SendGrid)
```

### Configuration requise dans Netlify

Ajoutez ces variables d'environnement dans votre projet Netlify:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_PHONE_NUMBER=+33xxxxxxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@votre-domaine.com
```

### Endpoints disponibles

1. **Créer lien de paiement**
```javascript
POST /.netlify/functions/create-payment-link
{
  "invoiceNumber": "F001",
  "amount": 5000, // en centimes
  "currency": "eur",
  "patientName": "Jean Dupont",
  "description": "Facture F001",
  "invoiceId": 123
}
```

2. **Envoyer SMS**
```javascript
POST /.netlify/functions/send-sms
{
  "to": "+33612345678",
  "message": "Rappel: RDV demain à 14h"
}
```

3. **Envoyer Email**
```javascript
POST /.netlify/functions/send-email
{
  "to": "patient@email.com",
  "subject": "Rappel rendez-vous",
  "html": "<h1>Bonjour</h1><p>Votre RDV...</p>"
}
```

---

## 📦 Installation des Dépendances

Pour activer toutes les fonctionnalités, installez:

```bash
# OCR
npm install tesseract.js

# Cartes interactives
npm install @react-google-maps/api
# ou
npm install react-map-gl

# Netlify Functions (développement local)
npm install -D @netlify/functions

# Dépendances Functions (backend)
npm install stripe twilio @sendgrid/mail
```

---

## 🎯 Roadmap Implémentée

✅ **Phase 1 - Terminée**
- ✅ Module Admin caché
- ✅ Scanner OCR avec simulation
- ✅ Cartographie interactive (démo)
- ✅ Notes vocales avec enregistrement
- ✅ Service Dark Mode
- ✅ Netlify Functions (Stripe, Twilio, SendGrid)

🔲 **Phase 2 - À Venir**
- Multi-praticiens
- Téléconsultation (WebRTC)
- IA avancée (détection sentiment, prédictions)
- PWA installable

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Changez le mot de passe admin** immédiatement
2. **Ne commitez JAMAIS** les clés API dans Git
3. **Utilisez Netlify Env Variables** pour tous les secrets
4. **Activez 2FA** sur vos comptes Stripe/Twilio/SendGrid
5. **Limitez les permissions** des clés API

### Variables à NE PAS committer
- `STRIPE_SECRET_KEY`
- `TWILIO_AUTH_TOKEN`
- `SENDGRID_API_KEY`
- `VITE_SUPABASE_ANON_KEY` (si sensible)

---

## 📞 Support

Pour toute question:
1. Consultez la documentation dans `/docs`
2. Vérifiez les logs du panneau admin
3. Activez le mode debug via le panneau admin

---

**Créé le:** 2025-01-26
**Version:** 2.0.0
**Dernière mise à jour:** 2025-01-26
