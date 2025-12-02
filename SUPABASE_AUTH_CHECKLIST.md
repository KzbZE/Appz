# Checklist Configuration Supabase Auth

## Paramètres à vérifier dans Supabase Dashboard

### 1. Authentication → Providers → Email

✅ **Enable Email provider** : Doit être activé

✅ **Confirm email** :
- Pour le développement : DÉSACTIVER (décocher)
- Pour la production : Activer
- Si activé, vous devez confirmer l'email via un lien envoyé

✅ **Secure email change** : Peut être désactivé pour les tests

### 2. Authentication → Users

Vérifiez qu'il y a au moins un utilisateur dans cette liste.

Si la liste est vide, les utilisateurs n'existent pas dans Supabase Auth.

### 3. Authentication → URL Configuration

Vérifiez que :
- **Site URL** : Correspond à votre URL locale (http://localhost:5173 ou autre)
- **Redirect URLs** : Inclut votre URL locale

---

## Comment créer un utilisateur de test manuellement dans Supabase

### Option 1 : Via le Dashboard Supabase
1. Allez à **Authentication** → **Users**
2. Cliquez sur **"Add user"** ou **"Invite user"**
3. Entrez :
   - Email : `test@example.com`
   - Password : `Test1234!`
4. **Important** : Décochez "Send email confirmation" si vous voulez tester immédiatement

### Option 2 : Via l'application (Inscription)
1. Dans votre app, cliquez sur l'onglet **Inscription**
2. Remplissez le formulaire
3. Si "Confirm email" est activé dans Supabase, vous devrez confirmer l'email
4. Si désactivé, l'utilisateur est créé immédiatement

---

## Problèmes courants

### ❌ Erreur "Invalid login credentials"

**Causes possibles :**
1. L'utilisateur n'existe pas dans `auth.users` (Supabase Auth)
2. Le mot de passe est incorrect
3. L'utilisateur n'a pas confirmé son email (si la confirmation est activée)

**Solution :**
- Créez l'utilisateur via l'interface d'inscription
- OU créez-le manuellement dans le dashboard Supabase
- OU désactivez la confirmation d'email pour les tests

### ❌ Erreur 400 "Bad Request"

**Causes possibles :**
1. Les credentials Supabase sont incorrects (URL ou Anon Key)
2. L'authentification par email n'est pas activée
3. Le format de l'email ou du mot de passe est invalide

**Solution :**
- Vérifiez les variables d'environnement dans `.env`
- Vérifiez que "Enable Email provider" est activé

---

## Test rapide

Exécutez ce test dans la console de votre navigateur (F12) :

```javascript
// Test de connexion
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'Test1234!'
});

console.log('Data:', data);
console.log('Error:', error);
```

Si erreur = "Invalid login credentials" → L'utilisateur n'existe pas
Si erreur = null et data contient un user → Succès !
