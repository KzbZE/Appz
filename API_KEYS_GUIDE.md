# 🔑 Clés API - TheraFlow Hybrid

Guide complet de toutes les clés API nécessaires au bon fonctionnement de l'application.

---

## ✅ CLÉS API ACTUELLEMENT NÉCESSAIRES

### 1. 🤖 **Google Gemini AI** (Pour IA Coach)

**Utilisation :**
- Génération de conseils business intelligents
- Analyse de rentabilité et optimisation des tournées
- Génération automatique de rapports de séances pour les clients
- Résumés professionnels des traitements

**Comment l'obtenir :**
1. Allez sur https://makersuite.google.com/app/apikey
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé générée

**Où la configurer :**
- Sur Netlify : Site Settings → Environment Variables
- Variable : `GEMINI_API_KEY`
- Valeur : `AIza...` (votre clé)

**Prix :** GRATUIT jusqu'à 60 requêtes/minute

---

### 2. 🔐 **Google Cloud - Client ID & API Key** (Pour Drive + Calendar)

**Utilisation :**
- **Google Drive** : Sauvegarde automatique des rapports de séances (PDF)
- **Google Calendar** : Synchronisation lecture seule de votre calendrier existant

**Comment les obtenir :**

#### Étape 1 : Créer un projet Google Cloud
1. Allez sur https://console.cloud.google.com
2. Créez un nouveau projet (ex: "TheraFlow")
3. Attendez la création (30 secondes)

#### Étape 2 : Activer les APIs
1. Dans le menu → "APIs & Services" → "Library"
2. Cherchez et activez :
   - **Google Drive API**
   - **Google Calendar API**

#### Étape 3 : Créer les identifiants

**Pour l'API Key :**
1. "APIs & Services" → "Credentials"
2. "+ Create Credentials" → "API Key"
3. Copiez la clé

**Pour le Client ID (OAuth 2.0) :**
1. "APIs & Services" → "Credentials"
2. "+ Create Credentials" → "OAuth client ID"
3. Type d'application : **Application web**
4. Nom : "TheraFlow Web"
5. **Origines JavaScript autorisées** :
   - `https://votre-site.netlify.app` (remplacez par votre URL Netlify)
   - `http://localhost:3000` (pour dev local)
6. Cliquez "Créer"
7. Copiez le **Client ID** (commence par "xxx.apps.googleusercontent.com")

#### Étape 4 : Configurer l'écran de consentement OAuth
1. "APIs & Services" → "OAuth consent screen"
2. Type : **Externe**
3. Remplissez :
   - Nom de l'application : "TheraFlow Hybrid"
   - Email : votre email
   - Domaine autorisé : votre domaine Netlify
4. Scopes : Ajoutez
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
5. Enregistrez

**Où les configurer dans l'app :**
- Une fois dans l'app, allez dans **Paramètres** (onglet Réglages sur iPhone)
- Section "Intégration Cloud"
- Entrez :
  - **Google Client ID**
  - **Google API Key**
- Sauvegardez
- Cliquez sur "Connecter Google" pour autoriser l'accès

**Prix :** GRATUIT (Google offre 15 Go gratuits sur Drive)

---

## 🚧 CLÉS API OPTIONNELLES (Non implémentées actuellement)

### 3. 🗺️ **Google Maps API** (Recommandé pour améliorer la logistique)

**Utilisation potentielle :**
- Calcul précis des distances réelles entre votre cabinet et les lieux de visite
- Calcul des temps de trajet en temps réel (trafic inclus)
- Optimisation des tournées quotidiennes
- Géolocalisation des adresses clients

**Actuellement :** L'application utilise un calcul basique de distance (approximatif)

**Pour l'implémenter :**
1. Activez **Maps JavaScript API** + **Distance Matrix API** dans Google Cloud
2. Créez une clé API Maps
3. Je peux l'intégrer pour remplacer le calcul basique actuel

**Prix :**
- 28 000 requêtes GRATUITES par mois
- Ensuite : 5$/1000 requêtes

---

## 📊 RÉCAPITULATIF

| API | Nécessaire | Gratuit | Utilité |
|-----|-----------|---------|---------|
| **Gemini AI** | ✅ Oui (IA Coach) | ✅ 60 req/min | Conseils business + rapports |
| **Google Client ID** | ⚠️ Optionnel | ✅ Oui | Connexion Drive/Calendar |
| **Google API Key** | ⚠️ Optionnel | ✅ Oui | Drive + Calendar |
| **Google Maps** | ❌ Non implémenté | ✅ 28k/mois | Distances précises |

---

## 🎯 CONFIGURATION RECOMMANDÉE

### Pour commencer (Minimum) :
1. ✅ **Gemini AI** : Pour profiter de l'IA Coach

### Pour fonctionnalité complète :
1. ✅ **Gemini AI**
2. ✅ **Google Client ID + API Key** : Pour sauvegarder vos rapports sur Drive

### Pour version Pro optimale :
1. ✅ **Gemini AI**
2. ✅ **Google Client ID + API Key**
3. ✅ **Google Maps API** (je peux l'intégrer sur demande)

---

## ❓ COMMENT FONCTIONNENT LES INTÉGRATIONS GOOGLE

### 📁 **Google Drive** (googleApiService.ts lignes 88-126)
**Quand elle est utilisée :**
- Quand vous terminez une séance dans le **SessionWizard**
- Permet de sauvegarder le rapport de séance (PDF) sur votre Google Drive
- Vous pouvez choisir dans quel dossier sauvegarder

**Bénéfice :**
- Backup automatique de vos rapports
- Partage facile avec clients
- Accès depuis n'importe où

### 📅 **Google Calendar** (googleApiService.ts lignes 129-144)
**Quand elle est utilisée :**
- Synchronisation en lecture seule de votre calendrier Google
- Permet de voir vos RDV personnels à côté de vos séances

**Bénéfice :**
- Éviter les conflits entre vie pro et perso
- Vue unifiée de tous vos engagements

**Note :** Actuellement, le code est prêt mais la sync n'est pas activée dans l'interface. Je peux l'activer si vous voulez.

### 🗺️ **Google Maps** (NON IMPLÉMENTÉ)
**Si implémenté, servirait à :**
- Remplacer le calcul approximatif actuel (logisticsService.ts ligne 11-22)
- Calculer les vraies distances route par route
- Prendre en compte le trafic en temps réel
- Optimiser l'ordre des visites sur une journée

**Bénéfice potentiel :**
- Économies de carburant
- Meilleur planning des tournées
- Estimations précises des frais kilométriques

---

## 🔧 TROUBLESHOOTING

### L'IA Coach ne fonctionne pas
→ Vérifiez que `GEMINI_API_KEY` est bien configurée dans Netlify Environment Variables

### "Erreur de connexion Google"
→ Vérifiez que :
- L'URL Netlify est dans les "Origines autorisées" du Client ID
- Les APIs Drive et Calendar sont activées
- L'écran de consentement OAuth est configuré

### Les rapports ne se sauvegardent pas sur Drive
→ Cliquez sur "Connecter Google" dans Paramètres pour autoriser l'accès

---

**Besoin d'aide pour configurer une API ? Dites-moi laquelle et je vous guide pas à pas ! 🚀**
