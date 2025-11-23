# TheraFlow Hybrid - Application de Gestion Thérapeutique

Application complète pour praticiens en kinésithérapie humaine et animale (chevaux, chiens).

## ✨ Fonctionnalités

- 📊 **Tableau de bord** - Vue d'ensemble des rendez-vous et métriques
- 📅 **Agenda** - Gestion des rendez-vous avec détection de conflits logistiques
- 👥 **Patients** - Base de données patients (humains, chevaux, chiens)
- 📝 **Dossiers** - Historique des séances avec génération de rapports
- 🤖 **IA Coach** - Conseils business via Gemini AI
- 💰 **Finance** - Facturation, paiements et suivi des dépenses
- 📈 **Statistiques** - Analyses de performance et rentabilité
- ⚡ **Séance Flash** - Démarrage rapide de séances hors-planning

## 🚀 Démarrage

### Prérequis

Node.js (version 18 ou supérieure)

### Installation

```bash
npm install
```

### Configuration (Optionnel)

Pour utiliser l'IA Coach, créez un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
# Éditez .env et ajoutez votre clé API Gemini
# GEMINI_API_KEY=votre_clé_api_ici
```

Obtenez votre clé API Gemini : https://makersuite.google.com/app/apikey

### Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### Production

```bash
npm run build
npm run preview
```

## 🔧 Technologies

- **React 18** + **TypeScript** - Framework UI
- **Vite** - Build tool ultra-rapide
- **Dexie.js** - Base de données IndexedDB
- **Tailwind CSS** - Styling
- **Recharts** - Graphiques et visualisations
- **Lucide React** - Bibliothèque d'icônes
- **Google Gemini AI** - IA Coach business
- **Google Drive API** - Sauvegarde cloud
- **jsPDF** - Génération de PDF

## 📱 Fonctionnalités Détaillées

### Gestion Logistique
- Calcul automatique des distances et temps de trajet
- Détection de conflits d'horaires
- Optimisation des tournées entre cabinet/écurie/domicile

### Module Séances
- Anamnèse interactive par type de patient
- Cartographie des tensions musculaires
- Notes de traitement détaillées
- Génération automatique de rapports IA
- Export PDF avec branding personnalisé
- Sauvegarde cloud via Google Drive

### Module Finance
- Création de factures automatique
- Suivi des paiements (CB, Espèces, Virement)
- Gestion des rappels automatiques
- Tableau de bord des dépenses professionnelles
- Calcul TVA (20% ou exonération)

### Intégrations
- Google Drive pour stockage de documents
- Google Calendar (synchronisation lecture seule)
- Partage sur réseaux sociaux (Instagram, Facebook)

## 📂 Structure du Projet

```
Appz/
├── components/          # Composants React
│   ├── DailyDashboard.tsx   # Tableau de bord principal
│   ├── CalendarModule.tsx   # Calendrier et agenda
│   ├── PatientList.tsx      # Liste et fiches patients
│   ├── SessionWizard.tsx    # Assistant de séance
│   ├── FinanceModule.tsx    # Gestion finance
│   ├── StatisticsModule.tsx # Analyses et stats
│   └── ...
├── services/           # Services métier
│   ├── geminiService.ts       # IA Gemini
│   ├── googleApiService.ts    # Google APIs
│   └── logisticsService.ts    # Calculs logistiques
├── App.tsx            # Composant principal
├── db.ts              # Configuration Dexie
├── types.ts           # Types TypeScript
├── index.tsx          # Point d'entrée
└── vite.config.ts     # Configuration Vite
```

## 🎨 Personnalisation

Configurez votre cabinet via le module **Paramètres** :
- Nom du cabinet
- Couleur principale de l'interface
- Logo personnalisé
- Tarifs par défaut (humain, équin, canin)
- Adresse du cabinet
- Taux kilométrique
- Liens réseaux sociaux

## 🐛 Résolution de Problèmes

### Écran blanc au démarrage
- Vérifiez que les dépendances sont installées : `npm install`
- Supprimez `node_modules` et réinstallez : `rm -rf node_modules && npm install`
- Vérifiez la console du navigateur pour les erreurs

### IA Coach ne fonctionne pas
- Vérifiez que `GEMINI_API_KEY` est configurée dans `.env`
- Redémarrez le serveur après avoir modifié `.env`

### Erreurs de build
- Nettoyez le cache : `rm -rf dist node_modules/.vite`
- Réinstallez : `npm install`

## 📄 Licence

Propriétaire - Tous droits réservés
