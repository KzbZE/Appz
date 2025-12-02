# 📋 ARCHITECTURE DE L'APPLICATION

## 🎯 QU'EST-CE QUE CETTE APPLICATION ?

**TheraFlow Hybrid** est une **application de gestion pour praticiens** (kinésithérapeutes, ostéopathes, etc.).

Ce n'est **PAS** une plateforme multi-utilisateurs avec différents rôles (admin/praticien/patient).

---

## 👥 DIFFÉRENCE ENTRE USERS ET PATIENTS

### 🔐 USERS (Utilisateurs de l'application)

**Ce sont les PRATICIENS** qui utilisent l'application.

- ✅ Peuvent se connecter avec email/mot de passe
- ✅ Ont accès à toute l'application
- ✅ Gèrent leurs propres patients, rendez-vous, factures, etc.
- ✅ Chaque praticien a ses propres données (grâce à RLS)

**Exemples :**
- `admin@admin.com` → Un praticien
- `arnaudvb7@gmail.com` → Un autre praticien

### 👤 PATIENTS (Enregistrements dans la base de données)

**Ce sont les PATIENTS DES PRATICIENS**.

- ❌ NE peuvent PAS se connecter à l'application
- ❌ N'ont PAS de compte utilisateur
- ✅ Sont créés et gérés PAR les praticiens
- ✅ Ont des fiches avec : nom, adresse, historique médical, etc.

**Exemples :**
- "Jean Dupont" → Patient de `admin@admin.com`
- "Marie Martin" → Patiente de `arnaudvb7@gmail.com`

---

## 🏗️ ARCHITECTURE ACTUELLE

```
┌─────────────────────────────────────┐
│     PRATICIEN 1 (admin@admin.com)   │
├─────────────────────────────────────┤
│ Ses patients :                      │
│ - Jean Dupont                       │
│ - Marie Martin                      │
│                                     │
│ Ses rendez-vous :                   │
│ - RDV avec Jean le 15/12            │
│ - RDV avec Marie le 16/12           │
│                                     │
│ Ses factures, dépenses, etc.        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  PRATICIEN 2 (arnaudvb7@gmail.com)  │
├─────────────────────────────────────┤
│ Ses patients :                      │
│ - Pierre Durand                     │
│ - Sophie Lefèvre                    │
│                                     │
│ Ses rendez-vous :                   │
│ - RDV avec Pierre le 17/12          │
│                                     │
│ Ses factures, dépenses, etc.        │
└─────────────────────────────────────┘
```

**Chaque praticien ne voit QUE ses propres données.**

---

## 🆕 COMMENT CRÉER UN PATIENT ?

### Dans l'application actuelle :

1. **Connectez-vous** en tant que praticien
2. Allez dans **"Base Patients"** (menu de gauche)
3. Cliquez sur **"Nouveau Patient"** ou **"+"**
4. Remplissez les informations du patient
5. ✅ Le patient est créé et visible UNIQUEMENT par vous

**OU**

1. Créez un **nouveau rendez-vous**
2. Choisissez **"Nouveau Patient"**
3. Entrez les informations
4. ✅ Le patient est créé automatiquement

---

## 🤔 VOUS VOULEZ UNE APPLICATION DIFFÉRENTE ?

Si vous voulez que **les patients puissent se connecter** et voir leurs propres données, c'est une **architecture complètement différente** !

### Option 1 : Application avec accès patient (nécessite beaucoup de travail)

```
ADMIN
├── Peut gérer tous les praticiens
├── Peut voir toutes les données
└── Administration complète

PRATICIEN
├── Peut gérer ses patients
├── Peut créer des rendez-vous
├── Peut voir ses factures
└── Tableau de bord praticien

PATIENT
├── Peut voir SES rendez-vous
├── Peut voir SES factures
├── Peut demander un rendez-vous
└── Interface simplifiée
```

**Ce qu'il faudrait faire :**
- ✅ Créer une table `users` avec un champ `role` (admin/practitioner/patient)
- ✅ Créer des interfaces différentes pour chaque rôle
- ✅ Lier les patients aux users
- ✅ Système de permissions complexe
- ✅ Portail patient séparé
- ⏱️ **Temps estimé : 20-30 heures de développement**

### Option 2 : Garder l'architecture actuelle (recommandé)

**Avantages :**
- ✅ Plus simple
- ✅ Déjà fonctionnel
- ✅ Standard pour les applications de gestion de cabinet

**Les patients n'ont pas besoin de compte** :
- Vous gérez tout depuis votre interface
- Vous pouvez leur envoyer des emails/SMS avec les infos
- C'est comme ça que fonctionnent la plupart des logiciels de gestion de cabinet

---

## 🎨 L'APPLICATION ACTUELLE EST-ELLE NORMALE ?

**OUI !** La plupart des logiciels de gestion de cabinet fonctionnent ainsi :

- **Doctolib** (côté praticien) : Le praticien gère ses patients
- **Maiia** (côté praticien) : Le praticien gère son agenda
- **Mondocteur** (côté praticien) : Le praticien gère ses consultations

Il existe un **portail patient séparé** (Doctolib patient, etc.) mais c'est une application DIFFÉRENTE.

---

## ❓ QUESTIONS FRÉQUENTES

### "Je veux que mes patients puissent se connecter"

→ Il faut développer un **portail patient séparé** avec :
- Interface de connexion patient
- Vue limitée (seulement leurs données)
- Possibilité de prendre RDV
- Voir leurs factures

**C'est un gros projet !** Voulez-vous que je le développe ?

### "Je veux différents rôles (admin/praticien)"

→ Si vous avez **plusieurs praticiens** dans le même cabinet :
- Un administrateur peut gérer les praticiens
- Chaque praticien gère ses patients
- Nécessite un système de rôles

**Voulez-vous cette fonctionnalité ?**

### "Comment mes patients prennent RDV ?"

Actuellement :
- Ils vous appellent / envoient un email
- Vous créez le RDV dans l'application

Si vous voulez un système de prise de RDV en ligne :
- Il faut développer un formulaire public
- Le composant `PublicAppointmentRequest` existe déjà !
- Vous pouvez le personnaliser

---

## 🎯 RÉSUMÉ

**L'application actuelle :**
- ✅ Chaque praticien a son compte
- ✅ Chaque praticien gère ses patients
- ✅ Les données sont séparées par praticien
- ✅ C'est une architecture standard

**Si vous voulez autre chose, dites-moi :**
1. Portail patient (patients peuvent se connecter) ?
2. Système multi-rôles (admin/praticien) ?
3. Autre chose ?

Je peux développer ce que vous voulez, mais il faut savoir ce dont vous avez besoin ! 😊
