# ⚡ INSTRUCTIONS DE TEST - API Keys Hard-Codées

## ⚠️ ATTENTION

**La clé Gemini est maintenant HARD-CODÉE dans le code.**

- ✅ Vous pouvez tester immédiatement
- ❌ Ce n'est PAS sécurisé
- ⚠️ Cette clé est VISIBLE PUBLIQUEMENT sur GitHub
- 🔥 Vous DEVEZ supprimer ce commit après les tests

---

## 🧪 TESTS À FAIRE MAINTENANT

### 1️⃣ Attendre le redéploiement Netlify (2 minutes)

Netlify va automatiquement redéployer avec les nouvelles modifications.

Vérifiez sur Netlify → Deploys → Attendez que "Building" devienne "Published"

---

### 2️⃣ Configurer les clés Google dans l'app

Une fois le site redéployé :

1. **Ouvrez votre site** Netlify sur Safari iPhone
2. **Cliquez** sur l'onglet **"Réglages"** (5ème icône en bas)
3. **Scrollez** jusqu'à "Intégration Cloud"
4. **Entrez** :
   ```
   Google Client ID:
   628641859046-ghldi8552ctukbmbo0l4rjbr2nvga5ug.apps.googleusercontent.com

   Google API Key:
   AIzaSyAfK0Uz779sCthuHIkhC30FY6Kq9OPuIFY
   ```
5. **Cliquez** "Enregistrer" (bouton vert en haut à droite)

✅ Les clés Google sont maintenant configurées !

---

### 3️⃣ Tester l'IA Coach

1. **Allez** dans l'onglet "Pilotage" (1er onglet)
2. **Scrollez** jusqu'à voir le module "IA Coach" OU
3. **Cliquez** sur l'onglet dédié si disponible
4. **Posez** une question, par exemple :
   ```
   Comment puis-je optimiser mes tournées ?
   ```
5. **Attendez** la réponse

**Résultats attendus :**
- ✅ Si ça marche : Vous recevez une réponse IA en français
- ❌ Si erreur 403 : Vos restrictions de clés sont trop strictes (voir section Dépannage)

---

### 4️⃣ Tester Google Drive (optionnel)

1. **Créez** un nouveau patient de test
2. **Démarrez** une séance flash avec ce patient
3. **Remplissez** quelques infos de séance
4. **Terminez** la séance
5. **Cliquez** "Sauvegarder sur Drive" (si disponible)
6. **Autorisez** l'accès Google (popup)
7. **Vérifiez** que le PDF apparaît sur votre Google Drive

---

## 🐛 DÉPANNAGE

### Erreur "403 Forbidden" sur IA Coach

Vos clés ont des restrictions. **Solution rapide** :

1. Allez sur https://makersuite.google.com/app/apikey
2. Cliquez sur votre clé Gemini
3. **Application restrictions** → Sélectionnez **"None"**
4. **Sauvegardez**
5. Attendez 1 minute
6. Retestez l'IA Coach

### Erreur "403 Forbidden" sur Google Drive/Calendar

1. Allez sur https://console.cloud.google.com/apis/credentials
2. Cliquez sur votre API Key
3. **Application restrictions** → Sélectionnez **"None"**
4. **Sauvegardez**
5. Retestez

---

## 🧹 APRÈS LES TESTS - NETTOYAGE OBLIGATOIRE

⚠️ **UNE FOIS QUE VOUS AVEZ VÉRIFIÉ QUE TOUT FONCTIONNE** :

### Étape 1 : Configurer proprement sur Netlify

1. Allez sur https://app.netlify.com
2. Site Settings → Environment Variables
3. Ajoutez :
   - **Key** : `GEMINI_API_KEY`
   - **Value** : `AIzaSyCX74WTc8JanMveBecE9HI5Y_8NcNbETZY`
4. Sauvegardez
5. Trigger deploy

### Étape 2 : Révoquer et régénérer les clés

**IMPORTANT - Pour votre sécurité :**

1. **Gemini** : https://makersuite.google.com/app/apikey
   - Supprimez l'ancienne clé
   - Créez-en une nouvelle
   - Mettez-la sur Netlify

2. **Google API** : https://console.cloud.google.com/apis/credentials
   - Supprimez l'ancienne clé
   - Créez-en une nouvelle
   - Mettez-la dans l'app (Réglages)

3. **Client ID** : Si vous voulez aussi le changer (optionnel)

### Étape 3 : Supprimer le commit avec la clé hard-codée

**Je m'en occuperai** une fois que vous aurez configuré Netlify proprement !

---

## 📊 CHECKLIST

- [ ] Netlify a redéployé avec succès
- [ ] Clés Google entrées dans Réglages
- [ ] IA Coach testé et fonctionne
- [ ] Google Drive testé (optionnel)
- [ ] GEMINI_API_KEY configurée sur Netlify
- [ ] Anciennes clés révoquées
- [ ] Nouvelles clés générées
- [ ] Commit avec clé hard-codée supprimé (je m'en charge)

---

## ❓ Questions ?

**Si l'IA Coach ne fonctionne pas :**
- Vérifiez les restrictions de clés (mettez "None" pour tester)
- Attendez 1-2 minutes après avoir modifié les restrictions
- Videz le cache du navigateur (Safari → Réglages → Effacer historique)

**Si tout fonctionne :**
- 🎉 Super ! Passez au nettoyage (configurer Netlify + révoquer clés)
- Dites-moi quand c'est fait, je supprimerai le commit dangereux

**Pour sécuriser vos clés après tests :**
- Donnez-moi votre URL Netlify exacte
- Je vous dirai quoi mettre dans les restrictions
