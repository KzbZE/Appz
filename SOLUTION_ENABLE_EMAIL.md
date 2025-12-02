# 🚨 SOLUTION : Activer l'authentification Email dans Supabase

## Problème identifié
- ❌ "Enable email" n'est PAS coché dans Supabase
- ✅ Les utilisateurs EXISTENT dans Authentication → Users
- ❌ Mais l'authentification par email est désactivée

## Solution étape par étape

### 1. Activer l'authentification Email

**Dans Supabase Dashboard** : https://app.supabase.com/project/lgbxsqpuabhylawnqlgo

1. **Authentication** → **Providers** (menu de gauche)

2. Trouvez **"Email"** dans la liste des providers

3. Cliquez dessus pour voir les options

4. **ACTIVEZ** :
   - ✅ **Enable Email provider** (TRÈS IMPORTANT !)

5. **DÉSACTIVEZ** (pour faciliter les tests) :
   - ❌ **Confirm email**
   - ❌ **Secure email change**

6. Cliquez sur **"Save"** en bas de la page

### 2. Tester la connexion

Une fois "Enable Email" activé, retournez sur votre application et essayez de vous connecter avec un des utilisateurs existants :

**Utilisateur 1 :**
- Email : `admin@admin.com`
- Mot de passe : [votre mot de passe]

**Utilisateur 2 :**
- Email : `arnaudvb7@gmail.com`
- Mot de passe : [votre mot de passe]

### 3. Si vous ne connaissez pas le mot de passe

Dans **Supabase Dashboard** :
1. **Authentication** → **Users**
2. Cliquez sur un utilisateur
3. Utilisez **"Reset password"** ou **"Send magic link"**
4. OU créez un nouveau mot de passe temporaire

---

## Pourquoi cette erreur ?

### Erreur 400 "Invalid login credentials"
Causée par : L'authentification Email est désactivée, donc Supabase refuse toutes les tentatives de connexion par email/mot de passe.

### Erreur 500 "Database error saving new user"
Causée par : L'authentification Email est désactivée, donc Supabase ne peut pas créer de nouveaux utilisateurs avec email/mot de passe.

---

## Après avoir activé "Enable Email"

✅ La connexion devrait fonctionner
✅ L'inscription devrait fonctionner
✅ Plus d'erreurs 400 ou 500

---

## Note importante

L'option "Enable Email" doit TOUJOURS être activée si vous voulez utiliser l'authentification par email/mot de passe.

Si elle est désactivée, Supabase n'acceptera aucune opération d'authentification par email.
