# 🔐 Création des Comptes TheraFlow

## Comptes à créer:

### 👨‍⚕️ Praticien
- **Email**: arnaudvb7@gmail.com
- **Mot de passe**: Jiskan22
- **Rôle**: PRACTITIONER

### 🔐 Administrateur
- **Email**: admin@admin.com
- **Mot de passe**: adminadmin
- **Rôle**: ADMIN

---

## ⚠️ Prérequis: Configuration Supabase

Actuellement, votre fichier `.env` contient des valeurs factices. Vous devez d'abord configurer un vrai projet Supabase.

### Étape 1: Créer un projet Supabase

1. Allez sur https://supabase.com
2. Créez un compte (gratuit)
3. Cliquez sur "New Project"
4. Choisissez un nom, une région et un mot de passe de base de données
5. Attendez que le projet soit créé (~2 minutes)

### Étape 2: Récupérer les credentials

Dans votre projet Supabase:
1. Allez dans **Settings** (⚙️) → **API**
2. Copiez:
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon/public key** (longue clé JWT commençant par `eyJ...`)

### Étape 3: Mettre à jour `.env`

Modifiez le fichier `.env` à la racine du projet:

```env
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...VOTRE_CLE
```

### Étape 4: Configurer l'authentification Supabase

Dans votre projet Supabase:
1. Allez dans **Authentication** → **Providers**
2. Activez **Email**
3. **Important**: Désactivez "Confirm email" pour simplifier le développement:
   - Allez dans **Authentication** → **Settings**
   - Désactivez **"Enable email confirmations"**

---

## 🚀 Méthode 1: Console du Navigateur (RECOMMANDÉ)

**La plus simple et rapide!**

1. Démarrez l'application:
   ```bash
   npm run dev
   ```

2. Ouvrez le navigateur (http://localhost:5173)

3. Ouvrez la console du navigateur (F12 ou Cmd+Option+J sur Mac)

4. Copiez-collez ce script dans la console:

```javascript
(async function() {
  const { authService } = await import('./services/authService');

  const accounts = [
    { email: 'arnaudvb7@gmail.com', password: 'Jiskan22', name: 'Arnaud VB', role: 'PRACTITIONER' },
    { email: 'admin@admin.com', password: 'adminadmin', name: 'Administrateur', role: 'ADMIN' }
  ];

  for (const acc of accounts) {
    console.log(`Création de ${acc.email}...`);
    const result = await authService.register(acc);
    console.log(result.success ? '✅ Créé!' : `❌ ${result.error}`);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('✨ Comptes créés! Rechargez la page.');
})();
```

5. Appuyez sur **Entrée**

6. Rechargez la page et connectez-vous!

---

## 🚀 Méthode 2: Script Node.js

1. Installez tsx:
   ```bash
   npm install -g tsx
   ```

2. Exécutez le script:
   ```bash
   tsx setup-accounts.ts
   ```

---

## 🚀 Méthode 3: Création Manuelle (Supabase Dashboard)

Si les scripts ne fonctionnent pas:

1. Allez dans **Authentication** → **Users** dans Supabase
2. Cliquez sur **"Add user"** → **"Create new user"**

### Pour le Praticien:
- Email: `arnaudvb7@gmail.com`
- Password: `Jiskan22`
- Confirm Password: `Jiskan22`
- Cliquez sur **"Create User"**
- Dans la liste des utilisateurs, cliquez sur l'utilisateur créé
- Allez dans l'onglet **"User metadata"** (ou "Raw user meta data")
- Ajoutez ce JSON:
```json
{
  "name": "Arnaud VB",
  "role": "PRACTITIONER"
}
```

### Pour l'Admin:
- Email: `admin@admin.com`
- Password: `adminadmin`
- Confirm Password: `adminadmin`
- Cliquez sur **"Create User"**
- Ajoutez les métadonnées:
```json
{
  "name": "Administrateur",
  "role": "ADMIN"
}
```

---

## ✅ Vérification

Une fois les comptes créés, vous pouvez vous connecter:

### Praticien
- Email: arnaudvb7@gmail.com
- Mot de passe: Jiskan22
- → Accès à l'interface praticien complète

### Admin
- Email: admin@admin.com
- Mot de passe: adminadmin
- → Accès au panneau d'administration (Backend Admin)

---

## 🐛 Problèmes courants

### "Invalid API credentials"
→ Vérifiez que `.env` contient les bonnes valeurs Supabase

### "Email confirmations required"
→ Désactivez les confirmations email dans Supabase (voir Étape 4)

### "User already exists"
→ Les comptes existent déjà, essayez de vous connecter directement

### Le script ne fonctionne pas
→ Utilisez la méthode manuelle via le Supabase Dashboard
