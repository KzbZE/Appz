# 📱 Utilisation SMS dans l'application

## 🎯 Où sont envoyés les SMS ?

Les SMS sont envoyés **automatiquement** en complément des emails lors des notifications de rendez-vous.

---

## 📍 Fonction principale

### `services/notificationService.ts`

#### 1. **sendSMS()** - Ligne 77
```typescript
export async function sendSMS(params: SMSParams): Promise<boolean>
```

**Description** : Envoie un SMS via Netlify Function (qui appelle Twilio API)

**Paramètres** :
- `to` : Numéro de téléphone (format: "0612345678" ou "+33612345678")
- `message` : Texte du SMS
- `relatedRequestId` : ID de la demande associée (optionnel)

**Format automatique** : Les numéros français sont automatiquement convertis en format international (+33)

**Retour** : `true` si envoyé, `false` si échec

---

#### 2. **sendNotification()** - Ligne 122
```typescript
export async function sendNotification(
  email: string | undefined,
  phone: string | undefined,
  subject: string,
  message: string,
  relatedRequestId?: number | string
): Promise<{ emailSent: boolean; smsSent: boolean }>
```

**Description** : Envoie à la fois un email ET un SMS (si numéro fourni)

**Logique** :
- Si `email` fourni → envoie email
- Si `phone` fourni → envoie SMS
- Retourne le statut des deux envois

**Utilisation** : C'est cette fonction qui est utilisée par les AppointmentNotifications

---

## 📧 Notifications automatiques (Email + SMS)

### `services/notificationService.ts` - AppointmentNotifications

Toutes ces fonctions envoient **automatiquement email + SMS** :

### 1. **notifyPractitionerNewRequest** - Ligne 160
**Quand** : Patient fait une demande de RDV
**À qui** : Praticien
**Contenu SMS** :
```
Bonjour,

[NOM_PATIENT] a demandé un rendez-vous pour le [DATE].

Connectez-vous à votre tableau de bord pour accepter ou proposer un autre créneau.

TheraFlow
```

**Utilisation** :
- `AppointmentRequestManager.tsx` (quand une nouvelle demande est créée)

---

### 2. **notifyPatientRequestAccepted** - Ligne 182
**Quand** : Praticien accepte une demande de RDV
**À qui** : Patient
**Contenu SMS** :
```
Bonjour [NOM_PATIENT],

Votre rendez-vous a été confirmé pour le [DATE].

À bientôt !
TheraFlow
```

**Utilisation** :
- `AppointmentRequestManager.tsx` ligne 63 - Fonction `handleAccept()`

---

### 3. **notifyPatientProposedTime** - Ligne 203
**Quand** : Praticien propose un autre créneau au patient
**À qui** : Patient
**Contenu SMS** :
```
Bonjour [NOM_PATIENT],

Un autre créneau vous est proposé : [DATE].

[MESSAGE_PRATICIEN]

Connectez-vous pour accepter ou proposer un autre créneau.

TheraFlow
```

**Utilisation** :
- `AppointmentRequestManager.tsx` ligne 101 - Fonction `handlePropose()`

---

### 4. **notifyPractitionerProposedTime** - Ligne 227
**Quand** : Patient propose un autre créneau au praticien
**À qui** : Praticien
**Contenu SMS** :
```
Bonjour,

[NOM_PATIENT] propose un autre créneau : [DATE].

[MESSAGE_PATIENT]

Connectez-vous pour accepter ou proposer un autre créneau.

TheraFlow
```

**Utilisation** :
- Workflow bidirectionnel de proposition de créneaux

---

### 5. **notifyPatientRequestRejected** - Ligne 251
**Quand** : Praticien refuse une demande de RDV
**À qui** : Patient
**Contenu SMS** :
```
Bonjour [NOM_PATIENT],

Votre demande de rendez-vous n'a pas pu être acceptée.

[MESSAGE_PRATICIEN]

N'hésitez pas à faire une nouvelle demande pour un autre créneau.

TheraFlow
```

**Utilisation** :
- `AppointmentRequestManager.tsx` ligne 139 - Fonction `handleReject()`

---

## 📂 Fichiers qui utilisent les SMS

### 1. **AppointmentRequestManager.tsx**

**Ligne 63-69** - Acceptation de demande :
```typescript
await AppointmentNotifications.notifyPatientRequestAccepted(
  request.patientEmail,
  request.patientPhone,  // ← Envoi SMS ici
  request.patientName,
  finalTime,
  request.id
);
```

**Ligne 101-108** - Proposition de créneau :
```typescript
await AppointmentNotifications.notifyPatientProposedTime(
  request.patientEmail,
  request.patientPhone,  // ← Envoi SMS ici
  request.patientName,
  proposedTime,
  responseMessage,
  request.id
);
```

**Ligne 139-145** - Refus de demande :
```typescript
await AppointmentNotifications.notifyPatientRequestRejected(
  request.patientEmail,
  request.patientPhone,  // ← Envoi SMS ici
  request.patientName,
  responseMessage,
  request.id
);
```

---

## 🔧 Configuration requise

### Variables d'environnement Netlify

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33xxxxxxxxx
```

⚠️ **Sans le préfixe `VITE_`** - car les SMS sont envoyés depuis le backend (Netlify Functions)

---

## 🧪 Comment tester les SMS

### Scénario de test complet

1. **Créer une demande de RDV** (formulaire public) :
   - Aller sur `/demande-rdv`
   - Remplir le formulaire avec un vrai numéro de téléphone
   - Soumettre

2. **Accepter la demande** (interface praticien) :
   - Aller dans "Demandes de RDV"
   - Cliquer "Accepter" sur la demande
   - ✅ Le patient devrait recevoir un SMS + email de confirmation

3. **Proposer un autre créneau** :
   - Cliquer "Proposer un autre créneau"
   - Choisir une date/heure
   - Ajouter un message
   - ✅ Le patient devrait recevoir un SMS + email avec la proposition

4. **Refuser une demande** :
   - Cliquer "Refuser"
   - Ajouter un message d'explication
   - ✅ Le patient devrait recevoir un SMS + email de refus

---

## 📊 État actuel

| Fonctionnalité | État avant | État après |
|----------------|------------|------------|
| **Confirmation RDV** | ❌ Bloqué (CORS) | ✅ Fonctionne (Netlify Function) |
| **Proposition créneau** | ❌ Bloqué (CORS) | ✅ Fonctionne (Netlify Function) |
| **Refus demande** | ❌ Bloqué (CORS) | ✅ Fonctionne (Netlify Function) |
| **Format numéro** | ✅ Auto (+33) | ✅ Auto (+33) |
| **Logs** | ✅ IndexedDB | ✅ IndexedDB + Netlify |

---

## 🎯 Points importants

### 1. SMS envoyés UNIQUEMENT pour les demandes de RDV
Les SMS ne sont PAS envoyés pour :
- ❌ Rappels de factures
- ❌ Relances multi-niveaux
- ❌ PDF de séances
- ❌ Campagnes marketing

Seules les **notifications de rendez-vous** envoient des SMS.

### 2. SMS nécessite un numéro de téléphone
Si le patient n'a pas de numéro de téléphone :
- ✅ L'email est quand même envoyé
- ⚠️ Le SMS n'est pas envoyé (normal)
- ✅ Pas d'erreur, juste un log dans la console

### 3. Format automatique des numéros
Les numéros français sont automatiquement convertis :
- `0612345678` → `+33612345678`
- `+33612345678` → `+33612345678` (inchangé)

### 4. Coût des SMS (Twilio)
- 💰 ~0,08€ par SMS en France
- 💡 Prévoir un budget si beaucoup de demandes
- 📊 Surveiller la consommation dans Twilio Console

---

## 🐛 Troubleshooting SMS

### SMS non reçus

**Vérifier** :
1. ✅ Variables Twilio configurées dans Netlify (sans `VITE_`)
2. ✅ Numéro de téléphone valide (format français)
3. ✅ Crédits Twilio disponibles
4. ✅ Numéro Twilio vérifié (mode sandbox)

**Logs** :
- Console navigateur : voir si la fonction est appelée
- Netlify Functions logs : voir si l'envoi a réussi
- Twilio Console : voir l'historique des SMS

### Erreur "SMS service not configured"
- Variables Twilio manquantes ou mal configurées
- Vérifier dans Netlify → Environment variables

### Numéro invalide
- Twilio refuse les numéros invalides
- Vérifier le format du numéro
- Vérifier que c'est un mobile (pas un fixe)

---

## 📝 Résumé

### SMS dans l'application :
- ✅ **5 types de notifications** avec SMS automatique
- ✅ **1 fichier principal** : `AppointmentRequestManager.tsx`
- ✅ **Format auto** : Numéros français → international
- ✅ **Logs** : Toutes les tentatives enregistrées
- ✅ **Sécurisé** : Via Netlify Functions (pas d'exposition des clés)

### Pour activer les SMS :
1. Configurer les 3 variables Twilio dans Netlify
2. Redéployer le site
3. Tester avec une vraie demande de RDV
