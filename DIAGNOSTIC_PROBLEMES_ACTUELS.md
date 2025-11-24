# 🐛 Guide de résolution des problèmes identifiés

## 📊 RÉSUMÉ DES PROBLÈMES

D'après vos tests, voici l'état actuel :

| Problème | État | Cause |
|----------|------|-------|
| **Import Google Calendar → App** | ✅ Fonctionne | OK |
| **Export App → Google Calendar** | ❌ Ne marche pas | Token ou erreur silencieuse |
| **Sauvegarde Google Drive** | ❌ Bouton ne fait rien | Erreur silencieuse |
| **Netlify Functions déployées** | ✅ OK (status 405) | Bien déployées |
| **SMS Twilio** | ❌ Erreur numéro | Mauvais numéro configuré |
| **Email Resend** | ❓ Pas testé | À tester |

---

## 🔴 PROBLÈME 1 : Export App → Google Calendar ne marche pas

### Diagnostic

Le code dans `WeeklyPlanner.tsx:137-163` essaie d'exporter vers Google Calendar mais échoue **silencieusement**.

**Code actuel** :
```typescript
try {
  const isAuthed = await checkAuth();
  if (isAuthed) {
    // ... création événement Google ...
  }
} catch (error) {
  console.log("Export Google Calendar échoué:", error);
  // Ne pas bloquer la création du RDV
}
```

### Causes possibles

1. **`checkAuth()` retourne `false`**
   - Client ID manquant dans settings
   - Token expiré
   - Token pas sauvegardé

2. **`createCalendarEvent()` échoue**
   - Permissions insuffisantes
   - Token invalide
   - Erreur API Google

### Solution : Améliorer les logs et détecter l'erreur

**À TESTER** : Créez un rendez-vous dans l'app et regardez la console (F12).

**Vous devriez voir** :
- `✅ Google: Token restauré, connecté` OU
- `❌ Google: Pas de token sauvegardé` OU
- `Export Google Calendar échoué: [détails erreur]`

**Si vous voyez "Pas de token sauvegardé"** :
→ C'est le problème du Client ID manquant dans settings
→ **Solution** : Suivez `GUIDE_GOOGLE_OAUTH_SETUP.md` section "Configuration dans TheraFlow"

**Si vous voyez "Export échoué" avec erreur** :
→ Envoyez-moi l'erreur exacte de la console

---

### Test manuel immédiat

**Console F12** :

```javascript
// Test si Google Calendar export fonctionne
console.log('🧪 Test export Google Calendar...\n');

(async () => {
  try {
    // 1. Vérifier auth
    const { checkAuth } = await import('./services/googleApiService.js');
    const isAuthed = await checkAuth();

    console.log('🔐 Authentification Google:', isAuthed ? '✅ OK' : '❌ Non connecté');

    if (!isAuthed) {
      console.error('❌ Vous devez configurer Client ID + API Key dans Paramètres');
      console.error('   puis cliquer sur "Se connecter à Google"');
      return;
    }

    // 2. Essayer de créer un événement test
    const { createCalendarEvent } = await import('./services/googleApiService.js');

    const testEvent = await createCalendarEvent({
      summary: '🧪 Test Export TheraFlow',
      description: 'Si vous voyez cet événement dans Google Calendar, l\'export fonctionne !',
      start: new Date(Date.now() + 3600000).toISOString(), // Dans 1h
      end: new Date(Date.now() + 5400000).toISOString(), // Dans 1h30
      location: 'Test'
    });

    console.log('✅ Événement créé dans Google Calendar !');
    console.log('   → Vérifiez calendar.google.com');
    console.log('   → ID événement:', testEvent.id);

  } catch (error) {
    console.error('❌ ERREUR:', error);
    console.error('   → Message:', error.message);
    console.error('   → Stack:', error.stack);
  }
})();
```

**LANCEZ CE SCRIPT** et envoyez-moi le résultat complet !

---

## 🔴 PROBLÈME 2 : Google Drive sauvegarde ne marche pas

### Diagnostic

Vous avez dit : "quand j'appuis sur le bouton il ne se passe rien"

**Cause probable** : Erreur JavaScript silencieuse qui empêche le clic de fonctionner.

### Solution : Regarder la console au moment du clic

**À FAIRE** :
1. Ouvrez la console F12
2. Allez dans Historique de séances ou Finances
3. Générez un PDF (ex: fiche séance ou facture)
4. Cliquez sur le bouton "Sauvegarder dans Drive"
5. **Regardez immédiatement la console** : Y a-t-il des erreurs rouges ?

**Envoyez-moi** :
- Le nom exact du bouton cliqué
- Le module où vous êtes (Historique séances ? Finances ?)
- Les erreurs console (copier/coller)

---

## 🔴 PROBLÈME 3 : SMS Twilio - Mauvais numéro

### Erreur Twilio

```
'From' +3319595006824 is not a Twilio phone number
```

**Cause** : `+3319595006824` est votre numéro PERSONNEL, pas un numéro Twilio.

### Comment fonctionne Twilio

Pour envoyer des SMS via Twilio, vous devez **ACHETER un numéro Twilio** (environ 1€/mois).

Vous **NE POUVEZ PAS** utiliser votre propre numéro de téléphone.

### Solution : Acheter un numéro Twilio

#### Option A : Acheter un numéro Twilio (recommandé)

1. Allez sur [twilio.com/console](https://www.twilio.com/console)
2. Menu → **Phone Numbers** → **Manage** → **Buy a number**
3. Sélectionnez **France** (`+33`)
4. Filtrez par **SMS** (cochez la case SMS)
5. Choisissez un numéro disponible (ex: `+33612345678`)
6. Cliquez **Buy** (~1€/mois)

7. **Configurez dans Netlify** :
   - Netlify Dashboard → Environment variables
   - Modifiez `TWILIO_PHONE_NUMBER`
   - Nouvelle valeur : `+33612345678` (le numéro acheté)
   - **Trigger deploy** (Clear cache)

#### Option B : Désactiver les SMS (gratuit)

Si vous ne voulez pas payer pour Twilio :

1. Supprimez les variables Twilio de Netlify
2. Les SMS ne seront pas envoyés (mais emails oui)
3. Vous pouvez toujours utiliser les notifications email

**💰 Coût Twilio** :
- Numéro : ~1€/mois
- SMS sortant : ~0.07€/SMS
- Total estimé : 10-20€/mois pour ~200 SMS

---

## 🔴 PROBLÈME 4 : Email Resend pas testé

### Logs Netlify

Vous avez montré :
```
send-email: Duration: 3.41 ms	Memory Usage: 76 MB	Init Duration: 233.18 ms
```

**Cela signifie** : La fonction existe MAIS n'a pas été appelée réellement (juste l'init).

### Solution : Test email réel

**Console F12** :

```javascript
console.log('🧪 Test 2 : Envoi email réel...\n');

fetch('/.netlify/functions/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'VOTRE_EMAIL@gmail.com', // ⚠️ REMPLACEZ ICI
    subject: '🧪 Test Email TheraFlow',
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
});
```

**⚠️ REMPLACEZ `VOTRE_EMAIL@gmail.com`** par votre vrai email !

**LANCEZ CE SCRIPT** et envoyez-moi le résultat !

---

## 📋 CHECKLIST ACTIONS IMMÉDIATES

Faites ces tests dans l'ordre :

### 1. ✅ Test export Google Calendar

- [ ] Copiez le script "Test export Google Calendar" dans console F12
- [ ] Lancez-le
- [ ] Envoyez-moi le résultat complet

**Résultat attendu** :
- ✅ Si ça marche : Un événement test apparaît dans calendar.google.com
- ❌ Si ça échoue : Erreur détaillée dans console

---

### 2. 🔍 Test Google Drive (diagnostic console)

- [ ] Ouvrez console F12
- [ ] Allez dans Historique séances OU Finances
- [ ] Générez un PDF
- [ ] Cliquez sur "Sauvegarder dans Drive"
- [ ] **Regardez immédiatement les erreurs console**

**Envoyez-moi** :
- Nom exact du bouton
- Module où vous êtes
- Erreurs console (copier/coller tout en rouge)

---

### 3. 📧 Test email réel

- [ ] Copiez le script "Test email réel" dans console F12
- [ ] **Remplacez** `VOTRE_EMAIL@gmail.com` par votre vrai email
- [ ] Lancez-le
- [ ] Envoyez-moi le résultat

**Résultat attendu** :
- ✅ Status 200 + vous recevez l'email
- ❌ Status 500 + erreur RESEND_API_KEY

---

### 4. 📱 Décider pour Twilio SMS

**Option A** : Acheter numéro Twilio (~1€/mois)
- [ ] Allez sur twilio.com
- [ ] Buy a number (France +33, SMS enabled)
- [ ] Mettez à jour `TWILIO_PHONE_NUMBER` dans Netlify
- [ ] Trigger deploy

**Option B** : Désactiver SMS (gratuit)
- [ ] Supprimez les variables TWILIO_* de Netlify
- [ ] Les SMS ne seront pas envoyés

---

## 🎯 PRIORITÉS

**PRIORITÉ 1** : Test export Google Calendar (script ci-dessus)
→ Cela va nous dire si le problème est l'auth ou l'API

**PRIORITÉ 2** : Diagnostic Drive (erreurs console au clic)
→ Cela va nous dire quelle erreur empêche la sauvegarde

**PRIORITÉ 3** : Test email réel
→ Vérifier si RESEND_API_KEY est configuré

**PRIORITÉ 4** : Décider Twilio
→ Acheter numéro OU désactiver SMS

---

**💬 Lancez les 2 scripts de test (Calendar + Email) et envoyez-moi les résultats complets !**
