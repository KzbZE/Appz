# 🧪 Script de Test Netlify Functions

## ⚠️ PROBLÈME : Logs Netlify vides pour send-email et send-sms

Vous avez dit : "Il n'y a rien dans les logs pour send-sms et send-email est vide"

**Cela signifie** : Les fonctions ne sont **pas appelées** ou **pas déployées**.

---

## 🔍 DIAGNOSTIC : Pourquoi les logs sont vides ?

### Raisons possibles :

1. **Les fonctions ne sont pas déployées** sur Netlify
2. **Les fonctions ne sont jamais appelées** (aucune requête)
3. **Les variables d'environnement ne sont pas configurées** donc les appels échouent silencieusement
4. **Le build Netlify a échoué** et les fonctions n'existent pas

---

## ✅ SOLUTION : Tests étape par étape

### **Étape 1 : Vérifier que les fonctions sont déployées**

1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Sélectionnez votre site TheraFlow
3. Menu de gauche → **Functions**

**Que devez-vous voir ?**
- ✅ `send-email` (devrait apparaître dans la liste)
- ✅ `send-sms` (devrait apparaître dans la liste)

**Si les fonctions N'APPARAISSENT PAS** :
→ **Problème** : Les fonctions ne sont pas déployées
→ **Solution** : Relancez un build (Deploys → Trigger deploy → Clear cache)

**Si les fonctions APPARAISSENT** :
→ Passez à l'étape 2

---

### **Étape 2 : Vérifier les variables d'environnement**

1. Netlify Dashboard → **Site configuration** → **Environment variables**

**Vérifiez que ces variables EXISTENT (SANS préfixe `VITE_`)** :

| Variable | Doit être présente |
|----------|-------------------|
| `RESEND_API_KEY` | ✅ OUI (sans VITE_) |
| `TWILIO_ACCOUNT_SID` | ✅ OUI (sans VITE_) |
| `TWILIO_AUTH_TOKEN` | ✅ OUI (sans VITE_) |
| `TWILIO_PHONE_NUMBER` | ✅ OUI (sans VITE_) |

**Si ces variables N'EXISTENT PAS** :
→ **Problème** : Les fonctions ne peuvent pas appeler les APIs
→ **Solution** : Ajoutez-les (voir guide `GUIDE_CONFIG_EMAIL_SMS.md`)

**Si les variables EXISTENT** :
→ Passez à l'étape 3

---

### **Étape 3 : Test manuel via console navigateur (F12)**

Ouvrez la console de votre site TheraFlow (F12) et collez ces scripts :

#### **Test 1 : Vérifier que les fonctions existent (ping)**

```javascript
// Test basique : les fonctions répondent-elles ?
console.log('🧪 Test 1 : Vérification existence fonctions Netlify...\n');

Promise.all([
  fetch('/.netlify/functions/send-email', { method: 'GET' })
    .then(r => ({ name: 'send-email', status: r.status, ok: r.ok }))
    .catch(e => ({ name: 'send-email', error: e.message })),

  fetch('/.netlify/functions/send-sms', { method: 'GET' })
    .then(r => ({ name: 'send-sms', status: r.status, ok: r.ok }))
    .catch(e => ({ name: 'send-sms', error: e.message }))
])
.then(results => {
  console.log('📊 Résultats :');
  results.forEach(r => {
    if (r.error) {
      console.log(`  ❌ ${r.name} : Erreur - ${r.error}`);
    } else if (r.status === 405) {
      console.log(`  ✅ ${r.name} : Déployée (405 = Method Not Allowed, normal pour GET)`);
    } else if (r.status === 404) {
      console.log(`  ❌ ${r.name} : NON DÉPLOYÉE (404 Not Found)`);
    } else {
      console.log(`  ⚠️ ${r.name} : Status ${r.status}`);
    }
  });
  console.log('\n💡 405 = NORMAL (fonction existe mais refuse GET)');
  console.log('💡 404 = PROBLÈME (fonction pas déployée)');
});
```

**Résultat attendu** :
```
✅ send-email : Déployée (405 = Method Not Allowed, normal pour GET)
✅ send-sms : Déployée (405 = Method Not Allowed, normal pour GET)
```

**Si vous voyez 404** :
→ Les fonctions ne sont pas déployées
→ Allez dans Netlify → Deploys → Trigger deploy

---

#### **Test 2 : Appel réel send-email**

```javascript
console.log('🧪 Test 2 : Envoi email réel...\n');

fetch('/.netlify/functions/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'VOTRE_EMAIL_ICI@example.com', // ⚠️ REMPLACEZ PAR VOTRE EMAIL
    subject: '🧪 Test Netlify Function Email',
    message: 'Si vous recevez cet email, la fonction send-email fonctionne ! ✅\n\nDate: ' + new Date().toLocaleString()
  })
})
.then(async r => {
  const data = await r.json().catch(() => ({}));
  console.log('📧 Statut HTTP:', r.status);
  console.log('📧 Réponse:', data);

  if (r.ok && data.success) {
    console.log('\n✅ EMAIL ENVOYÉ AVEC SUCCÈS !');
    console.log('   → Vérifiez votre boîte mail (et spam)');
  } else {
    console.error('\n❌ ERREUR envoi email:');
    console.error('   → Status:', r.status);
    console.error('   → Détails:', data.error || 'Erreur inconnue');

    if (r.status === 500 && data.error?.includes('RESEND_API_KEY')) {
      console.error('\n💡 SOLUTION : Variable RESEND_API_KEY manquante dans Netlify');
    }
  }
})
.catch(err => {
  console.error('❌ ERREUR réseau:', err.message);
  console.error('💡 La fonction send-email n\'existe peut-être pas (404)');
});
```

**⚠️ IMPORTANT** : Remplacez `VOTRE_EMAIL_ICI@example.com` par votre vrai email !

**Résultats possibles** :

| Résultat | Signification | Action |
|----------|---------------|--------|
| ✅ Status 200 + `{success: true}` | Email envoyé ! | Vérifiez votre boîte mail |
| ❌ Status 500 + "RESEND_API_KEY undefined" | Variable manquante | Ajoutez `RESEND_API_KEY` dans Netlify |
| ❌ Status 401 + "Invalid API key" | Clé API incorrecte | Vérifiez la valeur de `RESEND_API_KEY` |
| ❌ Status 404 | Fonction pas déployée | Trigger deploy dans Netlify |
| ❌ CORS error | CSP bloque | Vérifiez CSP dans index.html |

---

#### **Test 3 : Appel réel send-sms**

```javascript
console.log('🧪 Test 3 : Envoi SMS réel...\n');

fetch('/.netlify/functions/send-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+33612345678', // ⚠️ REMPLACEZ PAR VOTRE NUMÉRO
    message: '🧪 Test Netlify Function SMS : OK ✅'
  })
})
.then(async r => {
  const data = await r.json().catch(() => ({}));
  console.log('📱 Statut HTTP:', r.status);
  console.log('📱 Réponse:', data);

  if (r.ok && data.success) {
    console.log('\n✅ SMS ENVOYÉ AVEC SUCCÈS !');
    console.log('   → Vérifiez votre téléphone');
  } else {
    console.error('\n❌ ERREUR envoi SMS:');
    console.error('   → Status:', r.status);
    console.error('   → Détails:', data.error || 'Erreur inconnue');

    if (r.status === 500 && data.error?.includes('TWILIO')) {
      console.error('\n💡 SOLUTION : Variables TWILIO manquantes dans Netlify');
    }
  }
})
.catch(err => {
  console.error('❌ ERREUR réseau:', err.message);
});
```

**⚠️ IMPORTANT** : Remplacez `+33612345678` par votre vrai numéro !

---

### **Étape 4 : Consulter les logs Netlify après les tests**

1. Netlify Dashboard → **Functions**
2. Cliquez sur `send-email` ou `send-sms`
3. Onglet **Function log**

**Maintenant les logs DOIVENT être remplis** avec :
- Les timestamps des appels
- Les erreurs éventuelles
- Les succès

**Si les logs sont TOUJOURS vides** :
→ Les fonctions n'ont jamais été appelées
→ Vérifiez les erreurs réseau dans la console F12

---

## 🔧 SOLUTIONS AUX PROBLÈMES FRÉQUENTS

### Problème : 404 Not Found

**Cause** : Fonctions pas déployées
**Solution** :
1. Vérifiez `netlify.toml` contient :
   ```toml
   [build]
     functions = "netlify/functions"
   ```
2. Trigger deploy : Deploys → Trigger deploy → Clear cache
3. Attendez 2-3 min que le build finisse

---

### Problème : 500 + "RESEND_API_KEY is undefined"

**Cause** : Variable d'environnement manquante
**Solution** :
1. Netlify → Site configuration → Environment variables
2. Ajoutez `RESEND_API_KEY` (SANS préfixe `VITE_`)
3. Valeur : `re_...` (votre clé Resend)
4. **Trigger deploy** (obligatoire pour recharger les variables)

---

### Problème : 401 Unauthorized

**Cause** : Clé API invalide
**Solution** :
1. Régénérez une nouvelle clé sur [resend.com](https://resend.com) ou [twilio.com](https://twilio.com)
2. Mettez à jour la variable dans Netlify
3. Trigger deploy

---

### Problème : Logs vides après tests

**Cause** : Les fetch() échouent avant d'atteindre les fonctions
**Solution** :
1. Ouvrez Console F12 → onglet **Network**
2. Filtrez par "functions"
3. Relancez les tests
4. Regardez les requêtes vers `/.netlify/functions/send-email`
5. Cliquez sur la requête → Onglet **Response** pour voir l'erreur

---

## 📊 CHECKLIST DE DIAGNOSTIC

Cochez au fur et à mesure :

- [ ] Netlify Functions → `send-email` et `send-sms` apparaissent dans la liste
- [ ] Environment variables → `RESEND_API_KEY` existe (sans `VITE_`)
- [ ] Environment variables → `TWILIO_ACCOUNT_SID` existe (sans `VITE_`)
- [ ] Environment variables → `TWILIO_AUTH_TOKEN` existe (sans `VITE_`)
- [ ] Environment variables → `TWILIO_PHONE_NUMBER` existe (sans `VITE_`)
- [ ] Build Netlify → Status ✅ Published (dernier build)
- [ ] Test 1 (ping) → Status 405 (normal)
- [ ] Test 2 (email) → Status 200 + email reçu
- [ ] Test 3 (SMS) → Status 200 + SMS reçu
- [ ] Logs Netlify → Contiennent les appels des tests

---

## 🎯 ACTIONS IMMÉDIATES

**Faites ceci MAINTENANT** :

1. **Vérifiez que les fonctions existent** :
   - Netlify Dashboard → Functions
   - Vous devez voir `send-email` et `send-sms`

2. **Si elles n'existent pas** :
   - Deploys → Trigger deploy → Clear cache and deploy site
   - Attendez 2-3 min

3. **Si elles existent** :
   - Copiez/collez **Test 1** dans la console F12
   - Envoyez-moi le résultat

4. **Si Test 1 OK** :
   - Copiez/collez **Test 2** (email) avec VOTRE email
   - Envoyez-moi le résultat

---

**💬 Dites-moi le résultat du Test 1 pour qu'on puisse avancer !**
