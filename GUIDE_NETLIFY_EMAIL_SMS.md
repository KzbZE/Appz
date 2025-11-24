# 📧 Guide: Pourquoi Email/SMS ne fonctionnent pas

## 🔴 PROBLÈME ACTUEL

Le formulaire de demande de RDV fonctionne, MAIS vous ne recevez **aucun email ni SMS**.

---

## ✅ CE QUI A ÉTÉ FAIT

J'ai créé deux **Netlify Functions** (serverless backend) :
- `netlify/functions/send-email.ts` → Pour envoyer des emails via Resend API
- `netlify/functions/send-sms.ts` → Pour envoyer des SMS via Twilio API

Ces fonctions sont **déployées** sur Netlify et **fonctionnelles** en théorie.

---

## ❌ POURQUOI ÇA NE MARCHE PAS

Les Netlify Functions ont besoin de **variables d'environnement** pour fonctionner.

Ces variables contiennent vos clés API Resend et Twilio, et doivent être configurées dans **Netlify Dashboard**.

### Variables manquantes ou incorrectes

Vérifiez que vous avez bien configuré ces variables **SANS le préfixe `VITE_`** :

| Variable requise | Valeur | Où la trouver |
|-----------------|--------|---------------|
| `RESEND_API_KEY` | `re_...` | [resend.com/api-keys](https://resend.com/api-keys) |
| `TWILIO_ACCOUNT_SID` | `AC...` | [console.twilio.com](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | `...` | [console.twilio.com](https://console.twilio.com) |
| `TWILIO_PHONE_NUMBER` | `+33...` | Votre numéro Twilio |

**⚠️ IMPORTANT** : Ces variables doivent être configurées **SANS le préfixe `VITE_`** car elles sont utilisées côté serveur (backend), pas côté client (frontend).

---

## 🔧 COMMENT CONFIGURER LES VARIABLES NETLIFY

### Étape 1 : Accéder aux variables d'environnement

1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Sélectionnez votre site **TheraFlow**
3. Cliquez sur **Site configuration** (ou **Site settings**)
4. Dans le menu de gauche → **Environment variables**

### Étape 2 : Ajouter les variables

Pour chaque variable, cliquez sur **Add a variable** :

#### Pour Resend (Email) :

```
Key: RESEND_API_KEY
Value: re_VOTRE_CLE_API_ICI
Scopes: All (ou Production + Deploy previews)
```

#### Pour Twilio (SMS) :

```
Key: TWILIO_ACCOUNT_SID
Value: AC...votre_sid
Scopes: All

Key: TWILIO_AUTH_TOKEN
Value: ...votre_token
Scopes: All

Key: TWILIO_PHONE_NUMBER
Value: +33XXXXXXXXX
Scopes: All
```

### Étape 3 : Redéployer le site

**CRITIQUE** : Les variables d'environnement ne sont lues qu'au moment du build.

Après avoir ajouté les variables :
1. Allez dans **Deploys**
2. Cliquez sur **Trigger deploy** → **Clear cache and deploy site**
3. Attendez que le build se termine (✅ Published)

---

## 🧪 TESTER SI ÇA FONCTIONNE

### Test 1 : Vérifier les Functions existent

Ouvrez la console (F12) et tapez :

```javascript
fetch('/.netlify/functions/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'votre@email.com',
    subject: 'Test Netlify Function',
    message: 'Si vous recevez ceci, ça marche !'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Résultat attendu** :
- Si ça marche : `{success: true}` + vous recevez l'email
- Si variables manquantes : Erreur 500 ou `{error: ...}`

### Test 2 : Vérifier les logs Netlify Functions

1. Netlify Dashboard → **Functions**
2. Cliquez sur `send-email` ou `send-sms`
3. Onglet **Function log**
4. Regardez les erreurs (API key invalid, missing variable, etc.)

---

## 🐞 DEBUGGING

### Erreur : "RESEND_API_KEY is undefined"

→ La variable n'est pas configurée dans Netlify
→ Solution : Ajoutez-la dans Site settings → Environment variables

### Erreur : "Invalid API key"

→ La clé API est incorrecte ou expirée
→ Solution : Régénérez une nouvelle clé sur resend.com

### Email/SMS ne reçoivent rien mais pas d'erreur

→ L'email `from:` peut être bloqué
→ Resend en mode sandbox n'envoie qu'aux emails vérifiés
→ Solution : Vérifiez votre domaine sur Resend ou utilisez un email test vérifié

### Erreur : "Function not found"

→ Les functions ne sont pas déployées
→ Solution : Vérifiez que `netlify.toml` contient :
```toml
[build]
  functions = "netlify/functions"
```

---

## 📝 RÉCAPITULATIF

| Étape | État | Action |
|-------|------|--------|
| ✅ Code Netlify Functions créé | Fait | Déjà pushlé sur Git |
| ❓ Variables d'environnement | À vérifier | Netlify Dashboard |
| ❓ Build avec les variables | À faire | Trigger deploy après config |
| ❓ Test email/SMS | À tester | Console F12 + formulaire |

---

## ❓ FAQ

### Q: Les variables avec `VITE_` fonctionnent aussi ?

**Non.** Les variables `VITE_*` sont pour le **frontend** (browser).
Les Netlify Functions utilisent des variables **backend** (serverless).

### Q: Faut-il supprimer les variables `VITE_` ?

**Non.** Gardez-les pour d'autres usages (Google Places API par exemple).
Ajoutez simplement les nouvelles **sans préfixe** `VITE_`.

### Q: Combien de temps avant que ça marche ?

- Ajout variables : **Instantané**
- Build : **2-3 minutes**
- Test : **Immédiat** après le build

---

## 🆘 BESOIN D'AIDE ?

Si après avoir configuré les variables et redéployé, ça ne fonctionne toujours pas :

1. **Regardez les logs Netlify Functions** (Section Functions → Logs)
2. **Testez avec `curl` ou Postman** :
   ```bash
   curl -X POST https://votre-site.netlify.app/.netlify/functions/send-email \
     -H "Content-Type: application/json" \
     -d '{"to":"test@example.com","subject":"Test","message":"Test"}'
   ```
3. **Vérifiez que Resend/Twilio fonctionnent** directement (API test sur leur dashboard)

---

**🎯 Prochaine étape : Configurez les variables Netlify et redéployez !**
