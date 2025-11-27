# ⚡ Quick Start - Configuration Supabase en 10 Minutes

## 🎯 Ce qu'on va faire

Connecter votre application TheraFlow à Supabase pour avoir:
- ✅ Une vraie base de données cloud (PostgreSQL)
- ✅ Authentification sécurisée
- ✅ Vos données accessibles de partout
- ✅ Sauvegardes automatiques

---

## 📝 Checklist Rapide

### ☐ Étape 1: Créer un Projet Supabase (2 min)

1. Allez sur [https://supabase.com](https://supabase.com) → **"Start your project"**
2. Créez un compte gratuit
3. Cliquez sur **"New project"**
4. Remplissez:
   ```
   Name: theraflow-prod
   Database Password: [NOTEZ-LE QUELQUE PART]
   Region: Europe West
   ```
5. **Attendez 2 minutes** que le projet soit créé ⏳

---

### ☐ Étape 2: Créer la Base de Données (3 min)

1. Dans votre projet Supabase → cliquez sur **SQL** (icône dans la barre latérale)
2. Cliquez sur **"New query"**
3. **Ouvrez le fichier** `supabase/schema.sql` de votre projet TheraFlow
4. **Copiez TOUT** le contenu
5. **Collez** dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** (ou Ctrl+Enter)
7. ✅ Vérifiez qu'il n'y a pas d'erreurs en rouge

**✨ Bravo!** Toutes vos tables sont créées (patients, appointments, invoices, etc.)

---

### ☐ Étape 3: Créer les Utilisateurs (2 min)

1. Dans Supabase → **Authentication** → **Users**
2. Cliquez sur **"Add user"** → **"Create new user"**

**Compte Praticien:**
```
Email: arnaudvb7@gmail.com
Password: Jiskan22
Auto Confirm User: ✅ COCHEZ CETTE CASE!
```

3. Cliquez sur **"Create user"**
4. **Important**: Cliquez sur l'utilisateur que vous venez de créer
5. Scrollez à **"User Metadata"** → Cliquez **"Edit"**
6. Remplacez le JSON par:
```json
{
  "name": "Arnaud VB",
  "role": "PRACTITIONER",
  "createdAt": "2025-01-15T10:00:00Z"
}
```
7. Cliquez **"Save"**

**Répétez pour le compte Admin:**
```
Email: admin@admin.com
Password: adminadmin
Auto Confirm User: ✅ OUI
```

User Metadata:
```json
{
  "name": "Administrateur",
  "role": "ADMIN",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

---

### ☐ Étape 4: Récupérer les Clés (1 min)

1. Dans Supabase → Cliquez sur **Settings** (⚙️) en bas
2. Cliquez sur **"API"**
3. **Copiez** ces deux valeurs:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Utilisez la clé "anon public", PAS "service_role"!**

---

### ☐ Étape 5: Configurer votre Application (2 min)

#### Pour le développement local:

1. Ouvrez le fichier **`.env`** de votre projet
2. Remplacez les valeurs:

```env
VITE_FORCE_LOCAL_AUTH=false

VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Redémarrez votre serveur:
```bash
npm run dev
```

#### Pour Netlify:

1. Allez sur **Netlify Dashboard**
2. Sélectionnez votre site → **Site settings** → **Environment variables**
3. **Modifiez** `VITE_FORCE_LOCAL_AUTH`:
   ```
   VITE_FORCE_LOCAL_AUTH = false
   ```
4. **Modifiez** `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec vos vraies valeurs
5. **Sauvegardez**
6. **Deploys** → **Trigger deploy** → **Deploy site**

---

## ✅ Tester que Ça Marche

1. Ouvrez votre application (local ou Netlify)
2. Ouvrez la console du navigateur (F12)
3. Vous devez voir:
   ```
   ☁️ Supabase configuré - Utilisation de Supabase Cloud
   ```

4. Essayez de vous connecter:
   ```
   Email: arnaudvb7@gmail.com
   Mot de passe: Jiskan22
   ```

5. **Si ça marche** → 🎉 **C'EST BON!** Vous utilisez maintenant Supabase!

---

## 🚨 Problèmes Courants

### "Invalid API key"
→ Vérifiez que vous utilisez la clé **"anon public"** (pas service_role)

### "Email not confirmed"
→ Allez dans Authentication → Users → Cliquez sur l'utilisateur → Cochez "Email confirmed"

### L'app utilise encore IndexedDB
→ Vérifiez que `VITE_FORCE_LOCAL_AUTH=false` dans votre `.env`
→ Redémarrez le serveur (`npm run dev`)

### "Failed to fetch"
→ Vérifiez que votre Project URL commence par `https://`

---

## 📚 Besoin de Plus de Détails?

Consultez le guide complet: **`GUIDE-CONFIGURATION-SUPABASE.md`**

---

## 🎊 C'est Fait!

Votre application est maintenant connectée à Supabase!

**Profitez de:**
- 500 MB de stockage gratuit
- 2 GB de bande passante/mois
- Sauvegardes automatiques
- Synchronisation temps réel (si activée)
- Base de données PostgreSQL puissante

**Temps écoulé: ~10 minutes** ⚡

**Bon développement! 🚀**
