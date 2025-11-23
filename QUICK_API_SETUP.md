# ⚡ Configuration ULTRA-RAPIDE des Clés API

## 🎯 Étape 1 : Clés Google (2 clics dans l'app)

1. **Ouvrez votre app** sur Netlify
2. **Cliquez** sur l'onglet **"Réglages"** (en bas, 5ème icône)
3. **Scrollez** jusqu'à voir "Intégration Cloud"
4. **Entrez** :
   ```
   Google Client ID:
   628641859046-ghldi8552ctukbmbo0l4rjbr2nvga5ug.apps.googleusercontent.com

   Google API Key:
   AIzaSyAfK0Uz779sCthuHIkhC30FY6Kq9OPuIFY
   ```
5. **Cliquez** "Enregistrer" (bouton en haut à droite)

✅ **C'EST FAIT !** Les clés Google sont configurées.

---

## 🤖 Étape 2 : Clé Gemini AI (sur Netlify - 1 minute)

### Sur iPhone avec Safari :

1. **Allez sur** https://app.netlify.com
2. **Connectez-vous**
3. **Sélectionnez** votre site
4. **Cliquez** sur "Site configuration" (dans le menu de gauche)
5. **Cliquez** sur "Environment variables"
6. **Cliquez** sur le bouton "Add a variable" (ou "Add")
7. **Remplissez** :
   - **Key** : `GEMINI_API_KEY`
   - **Value** : `AIzaSyCX74WTc8JanMveBecE9HI5Y_8NcNbETZY`
   - **Scopes** : Cochez "All" ou "All deploys"
8. **Cliquez** "Create variable"
9. **En haut** de la page, cliquez sur "Deploys"
10. **Cliquez** "Trigger deploy" → "Deploy site"
11. **Attendez** 2 minutes ⏱️

✅ **TERMINÉ !** L'IA Coach fonctionnera après le redéploiement.

---

## 🧪 Tester après configuration

### ✅ Test IA Coach :
1. Ouvrez l'app
2. Onglet "IA Coach" (ou "Coach" sur desktop)
3. Posez une question : "Comment optimiser ma rentabilité ?"
4. Vous devriez recevoir une réponse IA

### ✅ Test Google Drive :
1. Terminez une séance
2. Cliquez "Sauvegarder sur Drive"
3. Autorisez l'accès Google
4. Le PDF s'uploade sur votre Drive

---

## ⚠️ Si les clés ne marchent toujours pas (erreur 403)

Vos clés ont des **restrictions de sécurité**. Voici comment les corriger :

### Pour Gemini :
1. Allez sur https://makersuite.google.com/app/apikey
2. Cliquez sur votre clé
3. Dans "Application restrictions" → Sélectionnez **"None"**
4. Sauvegardez

### Pour Google API :
1. Allez sur https://console.cloud.google.com/apis/credentials
2. Cliquez sur votre API Key
3. Dans "Application restrictions" → Sélectionnez **"None"**
4. Sauvegardez

⚠️ **Après les tests**, réactivez les restrictions avec l'URL de votre site Netlify pour la sécurité.

---

## 📱 Quelle est votre URL Netlify ?

Donnez-moi votre URL (ex: `https://theraflow-abc123.netlify.app`) et je vous dirai exactement quoi mettre dans les restrictions pour sécuriser vos clés tout en les rendant fonctionnelles.
