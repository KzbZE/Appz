# 🚨 CRÉER LES UTILISATEURS MAINTENANT - 2 MINUTES

## ⚡ Problème Actuel

Vous avez cette erreur:
```
POST https://lgbxsqpuabhylawnqlgo.supabase.co/auth/v1/token 400 (Bad Request)
```

**Cause**: Les utilisateurs **n'existent pas encore** dans Supabase Auth.

**Solution**: Créez-les maintenant! (2 minutes)

---

## ✅ MÉTHODE 1: Via Dashboard (LA PLUS SIMPLE) ⭐

### Étape 1: Créer le Praticien (1 min)

1. Ouvrez **Supabase** → [https://supabase.com](https://supabase.com)
2. Sélectionnez votre projet **lgbxsqpuabhylawnqlgo**
3. Dans la barre latérale, cliquez sur **Authentication** (icône cadenas)
4. Cliquez sur **"Users"**
5. Cliquez sur le bouton **"Add user"** (en haut à droite)
6. Sélectionnez **"Create new user"**

7. Remplissez le formulaire:
   ```
   Email: arnaudvb7@gmail.com
   Password: Jiskan22
   Auto Confirm User: ✅ COCHEZ CETTE CASE!
   ```

8. Cliquez sur **"Create user"**

9. **Ajoutez les métadonnées**:
   - Dans la liste des utilisateurs, **cliquez** sur `arnaudvb7@gmail.com`
   - Scrollez vers le bas jusqu'à **"User Metadata"**
   - Cliquez sur le bouton **"Edit"**
   - **Remplacez** le JSON par:
   ```json
   {
     "name": "Arnaud VB",
     "role": "PRACTITIONER"
   }
   ```
   - Cliquez sur **"Save"**

✅ **Praticien créé!**

### Étape 2: Créer l'Admin (1 min)

Répétez les étapes 5-9 avec:
```
Email: admin@admin.com
Password: adminadmin
Auto Confirm User: ✅ OUI
```

User Metadata:
```json
{
  "name": "Administrateur",
  "role": "ADMIN"
}
```

✅ **Admin créé!**

### Étape 3: Vérifier (30 sec)

1. Allez dans **Table Editor** (icône tableau dans la barre latérale)
2. Sélectionnez la table **profiles**
3. Vous devez voir **2 lignes**:
   - arnaudvb7@gmail.com (PRACTITIONER)
   - admin@admin.com (ADMIN)

✅ **Les profils sont créés automatiquement par le trigger!**

---

## ✅ MÉTHODE 2: Via SQL (Alternative)

Si vous préférez utiliser SQL:

1. Ouvrez **Supabase** → **SQL Editor** (icône dans la barre latérale)
2. Cliquez sur **"New query"**
3. **Copiez TOUT** le contenu du fichier:
   ```
   supabase/create-users-direct.sql
   ```
4. **Collez** dans l'éditeur
5. Cliquez sur **"Run"** (ou Ctrl+Enter)
6. Vérifiez les messages dans la console SQL:
   ```
   ✅ Utilisateur Praticien créé: arnaudvb7@gmail.com
   ✅ Utilisateur Admin créé: admin@admin.com
   ```

**Note**: Si vous avez une erreur de permissions, utilisez la Méthode 1 (Dashboard).

---

## 🧪 TESTER MAINTENANT!

1. **Rechargez** votre application (F5)
2. **Ouvrez** la console (F12)
3. Vous devez voir:
   ```
   ☁️ Supabase configuré - Utilisation de Supabase Cloud
   ```

4. **Connectez-vous**:
   ```
   Email: arnaudvb7@gmail.com
   Mot de passe: Jiskan22
   ```

5. ✅ **ÇA MARCHE!** Vous êtes connecté via Supabase!

---

## 🔍 Si Ça Ne Marche Toujours Pas

### Erreur: "Email not confirmed"

**Solution**:
1. Supabase → Authentication → Users
2. Cliquez sur l'utilisateur
3. Cochez **"Email confirmed"**
4. Sauvegardez

### Erreur: "Invalid credentials"

**Vérifiez**:
- Email exact: `arnaudvb7@gmail.com` (pas d'espace)
- Mot de passe exact: `Jiskan22` (sensible à la casse!)
- L'utilisateur est bien créé dans Authentication → Users

### Erreur: "User already exists"

**C'est normal!** L'utilisateur existe. Passez directement au test.

### Les profils ne sont pas créés dans la table profiles

**Solution**: Exécutez cette requête dans SQL Editor:

```sql
INSERT INTO public.profiles (id, email, name, role, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Utilisateur'),
  COALESCE(au.raw_user_meta_data->>'role', 'PRACTITIONER'),
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
  AND au.email IN ('arnaudvb7@gmail.com', 'admin@admin.com');
```

---

## 📸 Captures d'Écran Mentales

### Dans Authentication → Users

Vous devez voir:
```
┌─────────────────────────┬──────────┬───────────┐
│ Email                   │ Provider │ Confirmed │
├─────────────────────────┼──────────┼───────────┤
│ arnaudvb7@gmail.com     │ email    │ ✅        │
│ admin@admin.com         │ email    │ ✅        │
└─────────────────────────┴──────────┴───────────┘
```

### Dans Table Editor → profiles

Vous devez voir:
```
┌──────────────────────┬─────────────┬──────────────┐
│ email                │ name        │ role         │
├──────────────────────┼─────────────┼──────────────┤
│ arnaudvb7@gmail.com  │ Arnaud VB   │ PRACTITIONER │
│ admin@admin.com      │ Admin       │ ADMIN        │
└──────────────────────┴─────────────┴──────────────┘
```

---

## ⚡ Checklist Rapide

- [ ] Aller dans Supabase → Authentication → Users
- [ ] Cliquer "Add user" → "Create new user"
- [ ] Email: `arnaudvb7@gmail.com`, Password: `Jiskan22`
- [ ] ✅ Cocher "Auto Confirm User"
- [ ] Créer l'utilisateur
- [ ] Cliquer sur l'utilisateur → Edit User Metadata
- [ ] Ajouter `{"name": "Arnaud VB", "role": "PRACTITIONER"}`
- [ ] Répéter pour admin@admin.com
- [ ] Vérifier dans Table Editor → profiles
- [ ] Tester la connexion dans l'app

**Temps: 2-3 minutes**

---

## 🎉 Après Création

Une fois les utilisateurs créés:

1. ✅ La page de login fonctionne
2. ✅ Connexion avec arnaudvb7@gmail.com / Jiskan22
3. ✅ Les profils sont dans Supabase (table profiles)
4. ✅ Plus d'erreur 400
5. ✅ Plus de localDB!

**Créez-les maintenant! 🚀**
