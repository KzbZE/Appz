# 🚨 Problèmes identifiés et Solutions

## 1. ❌ PROBLÈME CRITIQUE : Resend API ne fonctionne PAS depuis le frontend

### Le Problème

**Resend API est une API backend seulement.** Elle ne peut PAS fonctionner depuis le navigateur (frontend) pour des raisons de sécurité :

1. **CORS (Cross-Origin Resource Sharing)** : Resend bloque les requêtes directes depuis les navigateurs
2. **Sécurité** : La clé API Resend serait visible dans le code JavaScript côté client (n'importe qui peut la voler)
3. **Limitation Resend** : L'adresse `onboarding@resend.dev` ne peut envoyer qu'à des adresses vérifiées en mode test

### Pourquoi ça ne marche pas

Quand vous essayez d'envoyer un email depuis le navigateur :
```javascript
fetch('https://api.resend.com/emails', {
  headers: { 'Authorization': `Bearer ${VITE_RESEND_API_KEY}` }
})
// ❌ ERREUR CORS - Bloqué par le navigateur
```

### ⚠️ Conséquence

**TOUS les emails de l'application ne fonctionnent PAS actuellement** :
- ✅ Le code est correct
- ✅ Les variables sont bien configurées
- ❌ Mais les emails ne partent pas car Resend bloque les requêtes frontend

---

## 2. Solutions pour envoyer des emails

### Option A : Netlify Functions (RECOMMANDÉ)

Créer une Netlify Function (serverless) pour envoyer les emails :

**Avantages** :
- ✅ Gratuit (inclus dans Netlify)
- ✅ Pas de serveur à gérer
- ✅ Fonctionne avec votre déploiement actuel

**Comment faire** :

1. Créer le fichier `netlify/functions/send-email.ts` :
```typescript
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { to, subject, message } = JSON.parse(event.body || '{}');
  const RESEND_API_KEY = process.env.RESEND_API_KEY; // Sans VITE_ prefix

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'TheraFlow <onboarding@resend.dev>',
      to: [to],
      subject,
      html: `<div>${message.replace(/\n/g, '<br>')}</div>`
    })
  });

  if (response.ok) {
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email' }) };
};
```

2. Modifier `services/notificationService.ts` :
```typescript
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        message: params.message
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}
```

3. Configurer dans Netlify :
   - Ajouter `RESEND_API_KEY` (sans `VITE_` prefix) dans les variables d'environnement
   - Redéployer

### Option B : Backend Node.js/Express

Créer un backend séparé avec Express pour gérer les emails.

**Avantages** :
- Plus de contrôle
- Peut gérer d'autres logiques métier

**Inconvénients** :
- Nécessite un serveur (Heroku, Render, etc.)
- Plus complexe à configurer

### Option C : Service tiers (EmailJS, FormSubmit)

Utiliser un service qui accepte les requêtes frontend.

**Avantages** :
- Pas de backend nécessaire
- Simple à configurer

**Inconvénients** :
- Services gratuits limités
- Moins de contrôle

---

## 3. Solution temporaire : mailto: (pas idéal)

Pour que l'app fonctionne en attendant, on peut remettre `mailto:` mais :
- ❌ Nécessite un client email installé
- ❌ L'utilisateur doit envoyer manuellement
- ❌ Pas de traçabilité
- ❌ Pas professionnel

---

## 4. Twilio SMS - Même problème

L'API Twilio a le **même problème** que Resend :
- ❌ Ne fonctionne PAS depuis le frontend
- ❌ Bloquée par CORS
- ✅ Solution : Utiliser aussi Netlify Functions

---

## 5. Problème scroll formulaire mobile

### Le problème
Sur mobile, le formulaire est trop grand et le champ email est caché en bas de page. Le scroll ne fonctionne pas bien.

### Solution

Améliorer le layout mobile dans `PublicAppointmentRequest.tsx` :
1. Réduire les espacements sur mobile
2. Améliorer le scroll
3. Potentiellement diviser en plusieurs étapes (wizard)

---

## 6. Synchronisation Google Calendar

### Import (Google → App)
Le bouton "Synchroniser" dans Agenda devrait fonctionner SI :
- ✅ Vous êtes connecté à Google (Paramètres)
- ✅ Le token n'est pas expiré (dure 1 heure)
- ✅ Vous avez des événements futurs dans Google Calendar

**Test** :
1. Aller dans Paramètres → Se connecter avec Google
2. Autoriser les permissions Calendar
3. Aller dans Agenda
4. Cliquer "📥 Synchroniser Google Calendar"

### Export (App → Google)
L'export automatique devrait fonctionner lors de la création d'un RDV dans Planning SI :
- ✅ Vous êtes connecté à Google
- ✅ Le token est valide
- ✅ Vous créez un RDV via WeeklyPlanner (cliquer sur une case vide)

**Si ça ne marche pas** :
- Vérifier la console du navigateur pour les erreurs
- Le token Google expire après 1 heure → Se reconnecter
- Vérifier que les permissions `calendar.events` sont autorisées

---

## 7. Sauvegarde Google Drive

### Le problème
Le bouton "Sauvegarder dans Drive" ne fonctionne pas.

### Solution
Vérifier :
1. Connexion Google active (Paramètres)
2. Token valide (< 1 heure)
3. Console du navigateur pour erreurs

**Test** :
1. Aller dans Historique
2. Sélectionner une séance
3. Cliquer "💾 Sauvegarder dans Drive"
4. Devrait afficher la liste des dossiers Drive

---

## 8. Où utilise-t-on SMS ?

### Fichier : `services/notificationService.ts`

#### Fonction principale
```typescript
export async function sendSMS(params: SMSParams): Promise<boolean>
```
Ligne 78 - ❌ Ne fonctionne PAS (restrictions CORS Twilio)

#### Utilisé dans :

1. **AppointmentNotifications** (ligne 133)
   - `notifyPatientRequestAccepted` - Confirmation RDV
   - `notifyPatientProposedTime` - Proposition créneau
   - `notifyPatientRequestRejected` - Refus demande
   - `notifyPractitionerNewRequest` - Nouvelle demande praticien
   - `notifyPractitionerProposedTime` - Proposition patient

2. **Appels dans l'app** :
   - `AppointmentRequestManager.tsx` lignes 63-145
   - Envoie SMS automatiquement avec email lors des actions sur les demandes de RDV

### État actuel SMS
❌ **Les SMS ne partent PAS** - Même problème que les emails (restrictions CORS)

---

## 📊 Résumé de la situation

| Fonctionnalité | État | Raison |
|----------------|------|--------|
| **Emails** | ❌ Ne fonctionnent pas | API Resend bloquée par CORS (frontend) |
| **SMS** | ❌ Ne fonctionnent pas | API Twilio bloquée par CORS (frontend) |
| **Scroll formulaire mobile** | ⚠️ Problématique | Layout à optimiser |
| **Google Calendar import** | ✅ Implémenté | Besoin token valide + cliquer "Synchroniser" |
| **Google Calendar export** | ✅ Implémenté | Besoin token valide + créer RDV dans Planning |
| **Google Drive** | ✅ Implémenté | Besoin token valide |

---

## 🎯 Priorités de correction

### CRITIQUE (Bloquant)
1. **Mettre en place Netlify Functions pour emails/SMS**
   - Créer les fonctions serverless
   - Modifier notificationService
   - Tester l'envoi

### IMPORTANT
2. **Corriger scroll formulaire mobile**
   - Améliorer layout mobile
   - Tester sur différentes tailles d'écran

### À VÉRIFIER
3. **Tester synchronisation Google**
   - Se connecter avec token frais
   - Tester import/export/Drive
   - Documenter le process

---

## ⚡ Action immédiate recommandée

**Je peux créer les Netlify Functions maintenant** pour que les emails/SMS fonctionnent vraiment.

Voulez-vous que je crée :
1. `netlify/functions/send-email.ts`
2. `netlify/functions/send-sms.ts`
3. Modifier `notificationService.ts` pour les utiliser

Cela permettra aux emails et SMS de fonctionner réellement ! 🚀
