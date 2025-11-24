# 🔑 Guide Complet : Configuration Google Calendar & Drive

## ⚠️ PROBLÈME ACTUEL

Le diagnostic montre :
```
✅ Token actif dans GAPI (en mémoire) ← Temporaire
❌ Client ID: Manquant (base de données) ← Pas sauvegardé
❌ API Key: Manquant (base de données)
❌ Access Token: Absent (base de données)
```

**Résultat** : Google fonctionne temporairement, mais après rechargement → perd la connexion.

---

## ✅ SOLUTION : Configuration complète OAuth 2.0

### **Étape 1 : Google Cloud Console - Créer OAuth 2.0 Client ID**

#### 1a. Accéder à Google Cloud Console

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Connectez-vous avec votre compte Google
3. Sélectionnez votre projet (ou créez-en un si besoin)

#### 1b. Activer les APIs nécessaires

1. Menu **APIs & Services** → **Library**
2. Recherchez et activez :
   - ✅ **Google Calendar API**
   - ✅ **Google Drive API**
3. Cliquez sur **Enable** pour chaque API

#### 1c. Créer les identifiants OAuth 2.0

1. Menu **APIs & Services** → **Credentials**
2. Cliquez sur **+ CREATE CREDENTIALS** → **OAuth client ID**

3. **Si écran de consentement pas configuré** :
   - Cliquez **CONFIGURE CONSENT SCREEN**
   - Choisissez **External** (ou Internal si G Workspace)
   - Remplissez :
     - App name : `TheraFlow`
     - User support email : Votre email
     - Developer contact : Votre email
   - Cliquez **SAVE AND CONTINUE**
   - Scopes → Cliquez **SAVE AND CONTINUE** (on ajoutera les scopes après)
   - Test users → Ajoutez votre email si External
   - Cliquez **SAVE AND CONTINUE**

4. **Retournez dans Credentials** → **+ CREATE CREDENTIALS** → **OAuth client ID**

5. **Configurez l'OAuth Client** :
   - Application type : **Web application**
   - Name : `TheraFlow Web Client`

   - **Authorized JavaScript origins** :
     ```
     https://votre-site.netlify.app
     http://localhost:5173
     http://localhost:3000
     ```
     ⚠️ Remplacez `votre-site.netlify.app` par votre vrai domaine Netlify

   - **Authorized redirect URIs** :
     ```
     https://votre-site.netlify.app
     http://localhost:5173
     ```

6. Cliquez **CREATE**

7. **COPIEZ ces valeurs importantes** :
   ```
   Client ID: xxx.apps.googleusercontent.com
   Client Secret: (pas nécessaire pour l'app)
   ```

#### 1d. Vérifier l'API Key

Vous avez déjà une API Key : `AIzaSyAfK0Uz779sCthuHIkhC30FY6Kq9OPuIFY`

1. Allez dans **APIs & Services** → **Credentials**
2. Trouvez votre API Key
3. Cliquez sur l'icône ✏️ (Edit)
4. **Vérifiez les restrictions** :
   - API restrictions : **Restrict key**
   - Sélectionnez :
     - ✅ Google Calendar API
     - ✅ Google Drive API
     - ✅ Google Maps JavaScript API
     - ✅ Places API
5. Application restrictions : **HTTP referrers (web sites)**
   - Ajoutez :
     ```
     https://votre-site.netlify.app/*
     http://localhost:*
     ```
6. Cliquez **SAVE**

---

### **Étape 2 : Configurer dans TheraFlow**

#### 2a. Ouvrir l'application

1. Allez sur votre site TheraFlow (Netlify)
2. Connectez-vous

#### 2b. Aller dans Paramètres

1. Cliquez sur l'icône **⚙️ Paramètres** (menu latéral ou en bas)
2. Scrollez jusqu'à la section **"Intégrations Google (Drive & Agenda)"**

#### 2c. Remplir les champs

**Client ID (OAuth2)** :
```
Collez ici votre Client ID : xxx.apps.googleusercontent.com
```

**API Key** :
```
AIzaSyAfK0Uz779sCthuHIkhC30FY6Kq9OPuIFY
```

#### 2d. Enregistrer

1. Cliquez sur le bouton **💾 Enregistrer** (en haut à droite)
2. Attendez la confirmation : "Paramètres sauvegardés avec succès !"

#### 2e. Se connecter à Google

1. Dans la même section "Intégrations Google"
2. Cliquez sur le bouton bleu **"Se connecter à Google"**
3. Une popup Google OAuth s'ouvre
4. Sélectionnez votre compte Google
5. **Autorisez les permissions** :
   - ✅ Voir, modifier et supprimer les événements de votre agenda Google Calendar
   - ✅ Afficher et gérer les fichiers Google Drive
6. Cliquez **Autoriser**

7. Si succès → Message : "Connexion Google réussie !"

---

### **Étape 3 : Vérifier la configuration**

#### 3a. Relancer le diagnostic

Console (F12) → Copiez/collez le script diagnostic :

```javascript
(async function() {
  const db = await indexedDB.open('TheraFlowDB');
  db.onsuccess = (e) => {
    const database = e.target.result;
    const tx = database.transaction(['settings'], 'readonly');
    const store = tx.objectStore('settings');
    const request = store.getAll();

    request.onsuccess = () => {
      const settings = request.result[0];
      console.log('📊 Configuration Google:');
      console.log('  Client ID:', settings?.googleClientId || settings?.google?.clientId || '❌ Absent');
      console.log('  API Key:', settings?.googleApiKey || settings?.google?.apiKey || '❌ Absent');
      console.log('  Access Token:', settings?.accessToken || settings?.google?.accessToken ? '✅ Présent' : '❌ Absent');
      console.log('  Token Expiry:', settings?.tokenExpiry || settings?.google?.tokenExpiry || '❌ Absent');

      if (settings?.google?.tokenExpiry || settings?.tokenExpiry) {
        const expiry = settings?.google?.tokenExpiry || settings?.tokenExpiry;
        const now = Date.now();
        const minutesLeft = Math.round((expiry - now) / 60000);
        console.log(`  ⏰ Token expire dans ${minutesLeft} minutes`);
      }

      database.close();
    };
  };
})();
```

**Résultat attendu** :
```
📊 Configuration Google:
  Client ID: ✅ xxx.apps.googleusercontent.com
  API Key: ✅ AIzaSy...
  Access Token: ✅ Présent
  Token Expiry: ✅ [timestamp]
  ⏰ Token expire dans 59 minutes
```

#### 3b. Tester Google Calendar

1. Créez un nouveau rendez-vous dans TheraFlow
2. Vérifiez qu'il apparaît dans Google Calendar (calendar.google.com)

#### 3c. Tester Google Drive

1. Allez dans **Historique de séances** ou **Finances**
2. Générez un PDF (ex: fiche séance ou facture)
3. Cliquez sur **"Sauvegarder dans Drive"**
4. Sélectionnez un dossier Drive
5. Vérifiez que le fichier apparaît dans Google Drive (drive.google.com)

---

## 🐞 PROBLÈMES FRÉQUENTS

### Erreur : "Client ID manquant"

**Cause** : Vous avez cliqué sur "Se connecter" sans enregistrer d'abord
**Solution** :
1. Remplissez Client ID + API Key
2. Cliquez **"Enregistrer"** d'abord
3. PUIS cliquez "Se connecter à Google"

### Erreur : "Redirect URI mismatch"

**Cause** : L'URL de votre site n'est pas dans les "Authorized JavaScript origins"
**Solution** :
1. Google Cloud Console → Credentials → Edit OAuth Client
2. Ajoutez l'URL exacte de votre site Netlify

### Popup Google ne s'ouvre pas

**Cause** : Bloqueur de popup dans le navigateur
**Solution** : Autorisez les popups pour votre site

### "Access blocked: TheraFlow has not completed verification"

**Cause** : App en mode "Testing" dans l'écran de consentement
**Solution temporaire** : Ajoutez votre email dans "Test users"
**Solution permanente** : Publiez l'app (Google review requis pour usage public)

### Token expire après 1 heure

**C'est normal** : Les tokens OAuth 2.0 expirent après ~1h
**Solution** : L'application devrait automatiquement redemander un nouveau token
**Workaround** : Reconnectez-vous manuellement via Paramètres

---

## 📝 RÉCAPITULATIF CONFIGURATION

| Élément | Où le trouver | Où le mettre |
|---------|---------------|--------------|
| **Client ID** | Google Cloud Console → Credentials | TheraFlow → Paramètres → Client ID (OAuth2) |
| **API Key** | Déjà fourni : `AIzaSyAfK0Uz779sCthuHIkhC30FY6Kq9OPuIFY` | TheraFlow → Paramètres → API Key |
| **Authorized origins** | `https://votre-site.netlify.app` | Google Cloud Console → OAuth Client |
| **APIs activées** | Calendar API + Drive API | Google Cloud Console → Library |

---

## ✅ CHECKLIST COMPLÈTE

- [ ] Google Cloud Console : Projet créé
- [ ] APIs activées : Calendar + Drive
- [ ] OAuth Client ID créé
- [ ] Authorized JavaScript origins configurées
- [ ] API Key restrictions configurées
- [ ] TheraFlow : Client ID saisi
- [ ] TheraFlow : API Key saisie
- [ ] TheraFlow : Paramètres enregistrés (bouton Enregistrer)
- [ ] TheraFlow : Se connecter à Google (popup OAuth)
- [ ] Google : Permissions autorisées (Calendar + Drive)
- [ ] Test : Diagnostic montre Client ID ✅
- [ ] Test : Diagnostic montre Access Token ✅
- [ ] Test : Rendez-vous créé apparaît dans Google Calendar
- [ ] Test : PDF uploadé apparaît dans Google Drive

---

## 🆘 BESOIN D'AIDE ?

Si après avoir suivi ce guide, Google Calendar/Drive ne fonctionne toujours pas :

1. **Relancez le diagnostic** et envoyez-moi la sortie complète
2. **Vérifiez la console** (F12) pour erreurs rouges
3. **Copiez les erreurs** exactes et envoyez-les moi

---

**🎯 Prochaine étape : Suivez ce guide pour créer votre OAuth Client ID et configurer l'application !**
