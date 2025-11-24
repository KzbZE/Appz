# 🔧 Guide de dépannage Google Calendar & Drive

## 🚨 Problèmes courants et solutions

### Problème 1 : "Les fonctions Google ne marchent pas"

**Symptômes** :
- Je ne vois pas mes événements Google Calendar dans l'application
- Les RDV créés dans l'app n'apparaissent pas dans Google Calendar
- Le bouton "Sauvegarder dans Drive" ne fonctionne pas
- "Impossible de récupérer vos dossiers Drive"

---

## ✅ ÉTAPES OBLIGATOIRES pour que Google fonctionne

### 1. Se connecter à Google (PREMIÈRE FOIS)

**Dans l'application** :
1. Aller dans **Paramètres** (icône ⚙️)
2. Section "Configuration Google"
3. Renseigner **Client ID** et **API Key** (si pas déjà fait)
4. Cliquer sur **"Se connecter avec Google"**
5. ✅ Une popup Google s'ouvre
6. ✅ Autoriser toutes les permissions demandées :
   - ✅ Voir et gérer les événements de tous vos agendas
   - ✅ Gérer vos fichiers Drive
7. ✅ La popup se ferme automatiquement

**⚠️ IMPORTANT** : Le token Google expire après **1 HEURE**. Après 1 heure, vous devez vous reconnecter.

---

### 2. Importer les événements Google Calendar → Application

**L'import n'est PAS automatique !** Vous devez cliquer manuellement sur le bouton :

1. Aller dans **Agenda** (icône 📅)
2. En haut, cliquer sur **"📥 Synchroniser Google Calendar"**
3. ✅ Les événements Google Calendar s'importent dans l'agenda local
4. ✅ Un message confirme : "✅ Synchronisation réussie ! X événements importés."

**Note** : Seuls les événements **futurs** sont importés (pas les événements passés).

---

### 3. Exporter les RDV Application → Google Calendar

**L'export est automatique** lors de la création d'un RDV dans le Planning :

1. Aller dans **Planning** (icône 📆)
2. **Cliquer sur une case vide** (cellule du planning)
3. Une modale s'ouvre pour créer un RDV
4. Remplir : Patient, Type, Durée, Notes
5. Cliquer **"Créer le rendez-vous"**
6. ✅ Le RDV est créé localement
7. ✅ **Automatiquement exporté vers Google Calendar** (si connecté)

**Pour vérifier** :
1. Ouvrir Google Calendar dans un autre onglet
2. Rafraîchir la page
3. Le RDV devrait apparaître avec le nom du patient + type

---

### 4. Sauvegarder dans Google Drive

**Depuis l'historique des séances** :

1. Aller dans **Historique** (icône 📋)
2. Cliquer sur une séance pour voir le détail
3. Cliquer sur **"💾 Sauvegarder dans Drive"**
4. ✅ Une modale s'ouvre avec la liste de vos dossiers Drive
5. Sélectionner le dossier de destination
6. Entrer le nom du fichier
7. Cliquer **"Sauvegarder"**
8. ✅ Le PDF est uploadé dans Drive

**Si la liste des dossiers est vide** :
- ⚠️ Votre token Google a expiré
- 🔄 Reconnectez-vous dans Paramètres
- 🔄 Réessayez

---

## 🐛 Diagnostic des problèmes

### "Je ne vois pas mes événements Google Calendar"

**Checklist** :
- [ ] Vous êtes connecté à Google ? (Paramètres → "Se connecter avec Google")
- [ ] Vous avez cliqué sur "📥 Synchroniser" dans Agenda ?
- [ ] Vous avez des événements **futurs** dans Google Calendar ?
- [ ] Le token n'a pas expiré ? (< 1 heure depuis la connexion)

**Solution** :
1. Paramètres → Se connecter avec Google (même si déjà connecté)
2. Agenda → Cliquer "📥 Synchroniser Google Calendar"
3. Vérifier le message de confirmation

---

### "Les RDV de l'app n'apparaissent pas dans Google Calendar"

**Checklist** :
- [ ] Vous êtes connecté à Google ?
- [ ] Vous avez créé le RDV via **Planning** (pas Agenda) ?
- [ ] Vous avez **cliqué sur une case vide** du planning ?
- [ ] Le token n'a pas expiré ?

**Test** :
1. Paramètres → Se connecter avec Google
2. Planning → Cliquer sur une case vide
3. Créer un RDV de test
4. Ouvrir Google Calendar dans un nouvel onglet
5. Rafraîchir → Le RDV devrait apparaître

**Console du navigateur** :
1. Appuyer sur F12
2. Onglet "Console"
3. Chercher les messages :
   - ✅ "Google: Token restauré, connecté"
   - ✅ "Export Google Calendar réussi"
   - ❌ "Google: Token expiré" → Se reconnecter

---

### "Impossible de récupérer vos dossiers Drive"

**Causes possibles** :
1. **Token expiré** (> 1 heure)
2. **Permissions manquantes** (n'a pas autorisé Drive lors de la connexion)
3. **Clé API invalide**

**Solution** :
1. Paramètres → Se connecter avec Google
2. **Bien autoriser toutes les permissions** (Drive + Calendar)
3. Historique → Sélectionner séance → "💾 Sauvegarder dans Drive"
4. La liste des dossiers devrait apparaître

---

### "Token Google expire trop vite"

**C'est normal !** Les tokens Google OAuth2 expirent après **1 heure** pour des raisons de sécurité.

**Solution temporaire** :
- Se reconnecter toutes les heures dans Paramètres

**Solution à long terme** (nécessite développement) :
- Implémenter le refresh token (stockage sécurisé backend)
- Utiliser un backend pour gérer les tokens

---

## 🧪 Test complet Google Calendar

### Test 1 : Connexion

1. Paramètres → "Se connecter avec Google"
2. ✅ Popup Google s'ouvre
3. ✅ Autorise les permissions
4. ✅ Popup se ferme
5. ✅ Message dans console : "Google: Token restauré, connecté"

### Test 2 : Import (Google → App)

1. Créer un événement de test dans Google Calendar (événement futur)
2. Dans l'app : Agenda → "📥 Synchroniser"
3. ✅ Message : "✅ Synchronisation réussie ! 1 événements importés."
4. ✅ L'événement apparaît dans l'agenda local

### Test 3 : Export (App → Google)

1. Planning → Cliquer case vide (ex: Lundi 10h)
2. Sélectionner un patient
3. Type : CABINET
4. Durée : 60 min
5. Créer
6. Ouvrir Google Calendar dans nouvel onglet
7. ✅ L'événement apparaît (nom patient + type)

### Test 4 : Drive

1. Historique → Sélectionner une séance
2. "💾 Sauvegarder dans Drive"
3. ✅ Liste des dossiers Drive apparaît
4. Sélectionner dossier
5. Nom fichier : "Test.pdf"
6. Sauvegarder
7. Ouvrir Google Drive dans nouvel onglet
8. ✅ Le fichier "Test.pdf" est dans le dossier

---

## 🔧 Configuration requise

### Dans Paramètres de l'application

**Client ID Google** :
```
Votre_Client_ID_OAuth2.apps.googleusercontent.com
```

**API Key Google** :
```
AIzaSyAfK0Uz779sCthuHIkhC30FY6Kq9OPuIFY
```

⚠️ Ces valeurs doivent être configurées dans **Paramètres** (icône ⚙️) → Section "Configuration Google"

---

## 📊 Vérifications techniques

### Permissions Google requises

Lors de la connexion Google, vous devez autoriser :

✅ **Google Calendar API** :
- `https://www.googleapis.com/auth/calendar.events`
- Permet de lire, créer, modifier et supprimer les événements

✅ **Google Drive API** :
- `https://www.googleapis.com/auth/drive.file`
- Permet de créer et gérer les fichiers créés par l'application

### Console du navigateur

**Ouvrir la console** : F12 → Onglet "Console"

**Messages attendus** :

✅ **Connexion réussie** :
```
Google: Token restauré, connecté
GAPI client initialisé
```

❌ **Token expiré** :
```
Google: Token expiré. Reconnexion nécessaire.
```

✅ **Export réussi** :
```
Export Google Calendar échoué: [Erreur si échec]
```

✅ **Import réussi** :
```
Synchronisation réussie ! X événements importés.
```

---

## 📝 Récapitulatif

| Action | Où | Comment | Auto/Manuel |
|--------|-----|---------|-------------|
| **Se connecter** | Paramètres | "Se connecter avec Google" | Manuel (toutes les heures) |
| **Import Calendar** | Agenda | "📥 Synchroniser" | Manuel |
| **Export Calendar** | Planning | Créer RDV (case vide) | Automatique |
| **Save Drive** | Historique | "💾 Sauvegarder dans Drive" | Manuel |

---

## 🚀 Résolution rapide

**Si rien ne fonctionne** :

1. ✅ Paramètres → Se connecter avec Google (même si déjà connecté)
2. ✅ Autoriser TOUTES les permissions dans la popup
3. ✅ Attendre que la popup se ferme
4. ✅ F12 → Console → Vérifier "Token restauré, connecté"
5. ✅ Tester import : Agenda → "📥 Synchroniser"
6. ✅ Tester export : Planning → Créer RDV
7. ✅ Tester Drive : Historique → "💾 Sauvegarder"

**Si toujours pas** :
- 🔍 Ouvrir console (F12)
- 📸 Prendre screenshot des erreurs
- 📧 Contacter support avec screenshot
