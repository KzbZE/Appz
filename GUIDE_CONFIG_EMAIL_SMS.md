# 📧 Guide Configuration Email & SMS (Netlify Functions)

## ⚠️ PROBLÈME ACTUEL

Vous avez dit : **"Le formulaire de demande de rendez-vous fonctionne mais je ne reçois toujours aucun SMS/mail"**

**Cause** : Les Netlify Functions (backend serverless) ont besoin de **variables d'environnement** pour fonctionner.

---

## ✅ SOLUTIONS : 2 Options

### **Option A : Configurer Resend + Twilio (Recommandé)**

Configurez les vraies APIs pour envoyer des emails et SMS automatiquement.

### **Option B : Désactiver temporairement**

Si vous ne voulez pas utiliser email/SMS pour l'instant, ignorez cette section.

---

## 🔧 OPTION A : Configuration complète Email & SMS

### **Étape 1 : Obtenir vos clés API**

#### 1a. Resend (Email)

1. Créez un compte sur [resend.com](https://resend.com)
2. Allez dans **API Keys**
3. Cliquez **Create API Key**
4. Nommez-la : `TheraFlow Production`
5. **Copiez la clé** : `re_...` (elle ne sera affichée qu'une fois)

⚠️ **Mode Sandbox** : Par défaut, Resend n'envoie qu'aux emails vérifiés.
Pour envoyer à n'importe qui : Vérifiez votre domaine (Settings → Domains)

#### 1b. Twilio (SMS)

1. Créez un compte sur [twilio.com](https://twilio.com)
2. Allez dans **Console Dashboard**
3. Notez ces 3 valeurs :
   - **Account SID** : `AC...`
   - **Auth Token** : `...` (cliquez sur "Show" pour révéler)
4. Allez dans **Phone Numbers** → **Manage** → **Buy a number**
5. Achetez un numéro français : `+33...`
6. Notez ce **numéro de téléphone**

💰 **Coût** : ~1€/mois pour le numéro + ~0.07€/SMS

---

### **Étape 2 : Configurer les variables dans Netlify**

#### 2a. Accéder aux variables d'environnement

1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Sélectionnez votre site **TheraFlow**
3. Cliquez sur **Site configuration** (ou **Site settings**)
4. Menu de gauche → **Environment variables**

#### 2b. Ajouter les variables (SANS préfixe VITE_)

⚠️ **CRITIQUE** : Ces variables doivent être **SANS le préfixe `VITE_`** car elles sont pour le backend (Netlify Functions), pas le frontend.

**Pour Resend (Email)** :

Cliquez **Add a variable** :
```
Key: RESEND_API_KEY
Value: re_VOTRE_CLE_RESEND_ICI
Scopes: Production, Deploy previews, Branch deploys (cochez tout)
```

**Pour Twilio (SMS)** :

Cliquez **Add a variable** (3 fois) :

```
Key: TWILIO_ACCOUNT_SID
Value: AC...votre_sid_ici
Scopes: All
```

```
Key: TWILIO_AUTH_TOKEN
Value: ...votre_auth_token_ici
Scopes: All
```

```
Key: TWILIO_PHONE_NUMBER
Value: +33XXXXXXXXX
Scopes: All
```

⚠️ **Format du numéro** : Utilisez le format international avec `+` : `+33612345678`

#### 2c. Redéployer le site (OBLIGATOIRE)

**Les variables ne sont lues qu'au moment du build.**

1. Allez dans **Deploys**
2. Cliquez sur **Trigger deploy** → **Clear cache and deploy site**
3. Attendez que le build se termine (~2-3 min)
4. Vérifiez que le statut est : ✅ **Published**

---

### **Étape 3 : Tester l'envoi Email/SMS**

#### 3a. Test Email (Console F12)

Ouvrez la console (F12) et collez ce code :

```javascript
fetch('/.netlify/functions/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'votre@email.com', // ⚠️ Remplacez par votre vrai email
    subject: '🧪 Test Email TheraFlow',
    message: 'Si vous recevez cet email, la configuration fonctionne ! ✅'
  })
})
.then(r => r.json())
.then(data => {
  console.log('📧 Résultat:', data);
  if (data.success) {
    console.log('✅ Email envoyé avec succès !');
  } else {
    console.error('❌ Erreur:', data.error);
  }
})
.catch(err => console.error('❌ Erreur réseau:', err));
```

**Résultat attendu** :
- Console : `✅ Email envoyé avec succès !`
- Boîte mail : Vous recevez l'email de test

#### 3b. Test SMS (Console F12)

```javascript
fetch('/.netlify/functions/send-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+33612345678', // ⚠️ Remplacez par votre vrai numéro
    message: '🧪 Test SMS TheraFlow : Configuration OK ✅'
  })
})
.then(r => r.json())
.then(data => {
  console.log('📱 Résultat:', data);
  if (data.success) {
    console.log('✅ SMS envoyé avec succès !');
  } else {
    console.error('❌ Erreur:', data.error);
  }
})
.catch(err => console.error('❌ Erreur réseau:', err));
```

**Résultat attendu** :
- Console : `✅ SMS envoyé avec succès !`
- Téléphone : Vous recevez le SMS de test

#### 3c. Test via Formulaire de demande RDV

1. Ouvrez le formulaire public de demande de rendez-vous
2. Remplissez le formulaire avec un vrai email/téléphone
3. Soumettez la demande
4. Vérifiez que vous recevez :
   - ✅ Email de confirmation
   - ✅ SMS de confirmation

---

## 🐞 PROBLÈMES FRÉQUENTS

### Erreur : "RESEND_API_KEY is undefined"

**Cause** : Variable pas configurée ou build pas relancé
**Solution** :
1. Vérifiez que la variable existe dans Netlify → Environment variables
2. Vérifiez qu'il n'y a PAS de préfixe `VITE_` (doit être `RESEND_API_KEY`, pas `VITE_RESEND_API_KEY`)
3. Déclenchez un nouveau build : Deploys → Trigger deploy

### Erreur : "Invalid API key"

**Cause** : Clé API incorrecte, expirée, ou copiée avec des espaces
**Solution** :
1. Régénérez une nouvelle clé sur resend.com ou twilio.com
2. Recopiez-la dans Netlify (sans espaces avant/après)
3. Redéployez

### Email reçu mais pas SMS

**Cause possible 1** : Numéro Twilio pas vérifié (compte trial)
**Solution** : Vérifiez votre numéro de téléphone dans Twilio Console → Verified Caller IDs

**Cause possible 2** : Format numéro incorrect
**Solution** : Utilisez le format international : `+33612345678` (pas `06 12 34 56 78`)

### Aucun email reçu (mode Sandbox Resend)

**Cause** : Resend en mode Sandbox envoie uniquement aux emails vérifiés
**Solution** :
1. Allez dans Resend → Settings → Domains
2. Ajoutez et vérifiez votre domaine (records DNS)
3. OU testez avec un email vérifié dans Resend → Settings → Email addresses

### Erreur : "Function not found"

**Cause** : Les Netlify Functions ne sont pas déployées
**Solution** :
1. Vérifiez que `netlify.toml` contient :
   ```toml
   [build]
     functions = "netlify/functions"
   ```
2. Vérifiez que les fichiers existent :
   - `netlify/functions/send-email.ts`
   - `netlify/functions/send-sms.ts`
3. Redéployez le site

---

## 🔍 DEBUGGING : Logs Netlify Functions

Si les tests échouent, consultez les logs :

1. Netlify Dashboard → **Functions**
2. Cliquez sur `send-email` ou `send-sms`
3. Onglet **Function log**
4. Regardez les erreurs (timestamps récents)

**Erreurs fréquentes dans les logs** :
- `RESEND_API_KEY is not defined` → Variable manquante
- `401 Unauthorized` → Clé API invalide
- `403 Forbidden` → Restrictions API Key trop strictes
- `Network error` → API Resend/Twilio down (rare)

---

## 💰 COÛTS

### Resend (Email)

- **Gratuit** : 3 000 emails/mois (largement suffisant)
- **Payant** : $20/mois pour 50 000 emails

### Twilio (SMS)

- **Numéro** : ~1€/mois
- **SMS sortant** : ~0.07€/SMS
- **Estimation** : ~10-20€/mois pour 200 SMS

**Alternative gratuite** : Désactiver les SMS et utiliser seulement les emails.

---

## 📝 CHECKLIST CONFIGURATION

- [ ] Compte Resend créé
- [ ] API Key Resend copiée : `re_...`
- [ ] Compte Twilio créé
- [ ] Account SID copié : `AC...`
- [ ] Auth Token copié
- [ ] Numéro Twilio acheté : `+33...`
- [ ] Netlify → Environment variables ouvert
- [ ] Variable `RESEND_API_KEY` ajoutée (sans `VITE_`)
- [ ] Variable `TWILIO_ACCOUNT_SID` ajoutée (sans `VITE_`)
- [ ] Variable `TWILIO_AUTH_TOKEN` ajoutée (sans `VITE_`)
- [ ] Variable `TWILIO_PHONE_NUMBER` ajoutée (sans `VITE_`)
- [ ] Build Netlify déclenché (Clear cache and deploy)
- [ ] Build terminé : Status ✅ Published
- [ ] Test email (console F12) : ✅ Réussi
- [ ] Test SMS (console F12) : ✅ Réussi
- [ ] Test formulaire RDV : ✅ Email + SMS reçus

---

## 🔑 RÉSUMÉ DES VARIABLES

| Variable Netlify | Valeur exemple | Où la trouver |
|-----------------|----------------|---------------|
| `RESEND_API_KEY` | `re_abc123...` | resend.com → API Keys |
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxx...` | twilio.com → Console |
| `TWILIO_AUTH_TOKEN` | `abcd1234...` | twilio.com → Console (Show) |
| `TWILIO_PHONE_NUMBER` | `+33612345678` | twilio.com → Phone Numbers |

⚠️ **IMPORTANT** : Toutes ces variables doivent être **SANS le préfixe `VITE_`**

---

## 🆘 BESOIN D'AIDE ?

Si après avoir suivi ce guide, les emails/SMS ne fonctionnent toujours pas :

1. **Copiez les logs** Netlify Functions (section Debugging ci-dessus)
2. **Copiez la sortie** des tests console (F12)
3. **Envoyez-moi** ces informations pour diagnostic

---

**🎯 Prochaine étape : Configurez Resend + Twilio et testez l'envoi !**
