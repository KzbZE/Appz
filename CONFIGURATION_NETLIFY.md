# 🚀 Configuration Netlify pour Emails & SMS

## 📋 Variables d'environnement à configurer

Allez dans **Netlify Dashboard** → **Site Configuration** → **Environment variables** et ajoutez :

### Pour les emails (Resend)
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```
⚠️ **IMPORTANT** : Sans le préfixe `VITE_` - car c'est pour le backend (Functions)

### Pour les SMS (Twilio)
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33xxxxxxxxx
```
⚠️ **IMPORTANT** : Sans le préfixe `VITE_` - car c'est pour le backend (Functions)

### Pour Google Places (frontend)
```
VITE_GOOGLE_PLACES_API_KEY=AIzaSyAfK0Uz779sCthuHIkhC30FY6Kq9OPuIFY
```
✅ Garde le préfixe `VITE_` - c'est pour le frontend

---

## 📁 Fichiers créés

### 1. Netlify Functions

**`netlify/functions/send-email.ts`**
- Fonction serverless pour envoyer des emails via Resend
- Appelée depuis le frontend : `/.netlify/functions/send-email`

**`netlify/functions/send-sms.ts`**
- Fonction serverless pour envoyer des SMS via Twilio
- Appelée depuis le frontend : `/.netlify/functions/send-sms`

### 2. Configuration

**`netlify.toml`**
- Modifié pour inclure le dossier `functions`
- Timeout configuré à 10 secondes

### 3. Service modifié

**`services/notificationService.ts`**
- Modifié pour utiliser les Netlify Functions au lieu d'appels API directs
- `sendEmail()` appelle `/.netlify/functions/send-email`
- `sendSMS()` appelle `/.netlify/functions/send-sms`

---

## 🔧 Installation des dépendances

Les Netlify Functions nécessitent le package `@netlify/functions` :

```bash
npm install --save-dev @netlify/functions
```

---

## 🚀 Déploiement

### 1. Ajouter les variables d'environnement dans Netlify

1. Aller dans **Netlify Dashboard**
2. Sélectionner votre site
3. **Site configuration** → **Environment variables**
4. Cliquer **Add a variable**
5. Ajouter les 5 variables listées ci-dessus :
   - `RESEND_API_KEY` (sans VITE_)
   - `TWILIO_ACCOUNT_SID` (sans VITE_)
   - `TWILIO_AUTH_TOKEN` (sans VITE_)
   - `TWILIO_PHONE_NUMBER` (sans VITE_)
   - `VITE_GOOGLE_PLACES_API_KEY` (avec VITE_)

### 2. Commit et push

```bash
git add .
git commit -m "🚀 Add Netlify Functions for emails and SMS"
git push
```

### 3. Vérifier le déploiement

Une fois déployé, vous pouvez tester les fonctions :

**Test email** :
```bash
curl -X POST https://votre-site.netlify.app/.netlify/functions/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","message":"Message de test"}'
```

**Test SMS** :
```bash
curl -X POST https://votre-site.netlify.app/.netlify/functions/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"0612345678","message":"Test SMS"}'
```

---

## 🧪 Comment tester dans l'application

### Emails

1. **Rappels de factures** :
   - Aller dans "Rappels"
   - Cliquer "Relancer" sur une facture
   - Entrer un email
   - Envoyer

2. **Relances multi-niveaux** :
   - Aller dans "Finance" → Onglet "Relances"
   - Cliquer "Envoyer" sur une relance
   - Entrer un email
   - Envoyer

3. **PDF de séances** :
   - Aller dans "Historique"
   - Sélectionner une séance
   - Cliquer "Envoyer par Email"
   - Entrer un email
   - Envoyer

4. **Factures** :
   - Aller dans "Finance"
   - Sélectionner une facture
   - Cliquer "Envoyer par Email"
   - Entrer un email
   - Envoyer

5. **Campagnes marketing** :
   - Aller dans "Marketing"
   - Sélectionner des patients
   - Cliquer "Envoyer une campagne"
   - Les emails partiront automatiquement

### SMS

Les SMS sont envoyés **automatiquement** avec les emails lors de :
- Confirmation de rendez-vous
- Proposition de nouveau créneau
- Refus de demande

Pour tester :
1. Faire une demande de RDV publique (avec numéro de téléphone)
2. Accepter la demande dans l'interface praticien
3. Le patient devrait recevoir un SMS + email

---

## 🐛 Troubleshooting

### Erreur "Email service not configured"
- ✅ Vérifier que `RESEND_API_KEY` est bien configuré dans Netlify (sans `VITE_`)
- ✅ Redéployer le site après avoir ajouté la variable

### Erreur "SMS service not configured"
- ✅ Vérifier que les 3 variables Twilio sont configurées dans Netlify (sans `VITE_`)
- ✅ Redéployer le site

### Erreur 405 "Method Not Allowed"
- Les fonctions n'acceptent que POST
- Vérifier que vous utilisez bien POST dans les requêtes

### Erreur 500 Internal Server Error
- Vérifier les logs Netlify : **Functions** → Sélectionner la fonction → **View logs**
- Regarder le détail de l'erreur

### Les emails ne partent toujours pas
1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Network"
3. Envoyer un email
4. Regarder la requête vers `/.netlify/functions/send-email`
5. Vérifier la réponse (200 = succès, 500 = erreur)

### Resend "onboarding@resend.dev" limitations
L'adresse `onboarding@resend.dev` est une adresse de test qui :
- ❌ Ne peut envoyer qu'à des adresses vérifiées dans Resend
- ❌ A des limitations de volume

**Solution** : Configurer un domaine vérifié dans Resend
1. Aller sur https://resend.com/domains
2. Ajouter votre domaine
3. Configurer les DNS (SPF, DKIM)
4. Modifier `netlify/functions/send-email.ts` ligne 44 :
   ```typescript
   from: 'TheraFlow <noreply@votre-domaine.com>'
   ```

---

## 📊 Logs et monitoring

### Voir les logs des fonctions

1. Aller dans **Netlify Dashboard**
2. **Functions** (menu latéral)
3. Cliquer sur `send-email` ou `send-sms`
4. **View logs**

Vous verrez :
- Nombre d'invocations
- Temps d'exécution
- Erreurs éventuelles

### Notifications dans la base de données

Toutes les notifications (succès et échecs) sont enregistrées dans IndexedDB :
- Table : `notifications`
- Champs : `type`, `recipient`, `status`, `sentAt`, `error`

Pour voir les notifications :
1. Ouvrir la console du navigateur (F12)
2. **Application** → **IndexedDB** → **AppDB** → **notifications**

---

## ✅ Checklist de déploiement

- [ ] Installer `@netlify/functions` : `npm install --save-dev @netlify/functions`
- [ ] Ajouter `RESEND_API_KEY` dans Netlify (sans VITE_)
- [ ] Ajouter `TWILIO_ACCOUNT_SID` dans Netlify (sans VITE_)
- [ ] Ajouter `TWILIO_AUTH_TOKEN` dans Netlify (sans VITE_)
- [ ] Ajouter `TWILIO_PHONE_NUMBER` dans Netlify (sans VITE_)
- [ ] Garder `VITE_GOOGLE_PLACES_API_KEY` dans Netlify (avec VITE_)
- [ ] Commit et push toutes les modifications
- [ ] Attendre le déploiement Netlify
- [ ] Tester l'envoi d'un email
- [ ] Tester l'envoi d'un SMS
- [ ] Vérifier les logs en cas d'erreur

---

## 🎯 Ce qui change pour l'utilisateur

### Avant (ne fonctionnait pas)
- ❌ Les emails n'étaient pas envoyés (bloqués par CORS)
- ❌ Les SMS n'étaient pas envoyés (bloqués par CORS)
- ❌ Message d'erreur : "Vérifiez la configuration de votre clé API Resend"

### Après (avec Netlify Functions)
- ✅ Les emails sont envoyés via le serveur Netlify
- ✅ Les SMS sont envoyés via le serveur Netlify
- ✅ Pas de problème CORS (les appels API sont côté serveur)
- ✅ Les clés API restent sécurisées (pas exposées au frontend)

---

## 🔐 Sécurité

### Avantages des Netlify Functions

1. **Clés API sécurisées** : Elles ne sont jamais exposées dans le code JavaScript du navigateur
2. **Pas de CORS** : Les appels API se font côté serveur
3. **Rate limiting** : Netlify limite automatiquement les requêtes abusives
4. **Logs** : Toutes les invocations sont loggées pour audit

### Limitations

- **Quota gratuit** : 125 000 invocations/mois (largement suffisant)
- **Timeout** : 10 secondes maximum par invocation (configurable jusqu'à 26s)
- **Taille** : Les fonctions doivent faire moins de 50 MB

---

## 🚀 Prêt pour la production !

Une fois toutes ces étapes effectuées, votre application sera prête pour envoyer de vrais emails et SMS ! 🎉
