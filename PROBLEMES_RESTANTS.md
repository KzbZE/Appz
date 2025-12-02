# 🔧 Résolution des problèmes restants

## Problème 1 : Erreur 500 lors de l'inscription

### Symptôme
```
POST /auth/v1/signup 500 (Internal Server Error)
AuthApiError: Database error saving new user
```

### Cause probable
Un **trigger automatique** ou une **fonction PostgreSQL** s'exécute lors de la création d'un utilisateur dans `auth.users` et échoue.

### Diagnostic

1. **Vérifier les triggers dans Supabase**

Dans **Supabase Dashboard** → **Database** → **Functions & Triggers**

Cherchez des triggers qui s'exécutent sur :
- `auth.users` (table d'authentification)
- Événement : `AFTER INSERT` ou `BEFORE INSERT`

2. **Vérifier les logs Supabase**

Dans **Supabase Dashboard** → **Logs** → **Postgres Logs**

Filtrez par :
- Timestamp : Moment où vous avez essayé de vous inscrire
- Severity : `ERROR`

Cela vous montrera l'erreur exacte qui se produit.

### Solutions possibles

#### Solution 1 : Désactiver temporairement le trigger

Si vous trouvez un trigger qui cause problème :
1. Notez son nom
2. Désactivez-le temporairement dans **Database** → **Functions & Triggers**
3. Réessayez l'inscription
4. Si ça marche, le trigger est la cause

#### Solution 2 : Créer les utilisateurs via le Dashboard

En attendant de résoudre le problème :
1. **Authentication** → **Users** → **Add user**
2. Remplissez les informations
3. ✅ Cochez **"Auto Confirm User"**
4. Créez l'utilisateur

#### Solution 3 : Vérifier les policies RLS

Il se peut qu'une **policy Row Level Security** bloque l'insertion.

Dans **Database** → **Tables** → Cherchez les tables qui ont des policies

Si une table custom dépend de `auth.users` et a une policy stricte, cela peut causer l'erreur.

---

## Problème 2 : Données partagées entre tous les comptes ⚠️

### Symptôme
Tous les utilisateurs voient les mêmes données, peu importe le compte connecté.

### Cause
L'application utilise **IndexedDB (Dexie)** pour stocker les données **localement dans le navigateur**, pas dans Supabase.

Cela signifie :
- ❌ Les données ne sont PAS liées à l'utilisateur connecté
- ❌ Les données ne sont PAS stockées dans le cloud
- ❌ Tous les utilisateurs sur le même navigateur voient les mêmes données
- ❌ Si vous changez d'ordinateur, vous perdez vos données

### Solution : Migrer vers Supabase (RECOMMANDÉ)

Il faut **migrer les données de IndexedDB vers Supabase** et implémenter **Row Level Security (RLS)**.

#### Étape 1 : Créer les tables dans Supabase

Pour chaque table de votre application (patients, appointments, invoices, etc.), créez une table correspondante dans Supabase avec une colonne `user_id`.

**Exemple pour la table `patients` :**

```sql
CREATE TABLE public.patients (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_name TEXT,
  type TEXT NOT NULL,
  location TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  last_visit TIMESTAMPTZ,
  avatar_url TEXT,
  medical_history JSONB,
  distance_km NUMERIC,
  custom_tariffs JSONB,
  tags TEXT[],
  notes TEXT,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
```

#### Étape 2 : Activer Row Level Security (RLS)

Activez RLS pour que chaque utilisateur ne voie que SES données :

```sql
-- Activer RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir uniquement leurs propres données
CREATE POLICY "Users can view their own patients"
  ON public.patients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert their own patients"
  ON public.patients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Users can update their own patients"
  ON public.patients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent supprimer leurs propres données
CREATE POLICY "Users can delete their own patients"
  ON public.patients
  FOR DELETE
  USING (auth.uid() = user_id);
```

#### Étape 3 : Modifier le code pour utiliser Supabase

Au lieu d'utiliser `db.patients.toArray()` (Dexie), utilisez :

```typescript
// Avant (Dexie)
const patients = useLiveQuery(() => db.patients.toArray());

// Après (Supabase)
const [patients, setPatients] = useState<Patient[]>([]);

useEffect(() => {
  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPatients(data);
    }
  };

  fetchPatients();
}, []);
```

#### Étape 4 : Créer un trigger pour auto-remplir `user_id`

Pour que `user_id` soit automatiquement rempli lors de l'insertion :

```sql
-- Fonction pour auto-remplir user_id
CREATE OR REPLACE FUNCTION public.handle_new_user_data()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur la table patients
CREATE TRIGGER on_insert_patients_set_user_id
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_data();
```

---

## Solution temporaire (si vous voulez garder IndexedDB)

Si vous ne voulez pas migrer vers Supabase maintenant, vous pouvez implémenter un système de filtrage basé sur l'utilisateur connecté dans IndexedDB :

1. Ajouter un champ `userId` à toutes vos données
2. Filtrer les données par `userId` lors de la récupération
3. Stocker le `userId` de l'utilisateur connecté

**MAIS** cette solution :
- ❌ Ne synchronise PAS les données entre appareils
- ❌ Ne sauvegarde PAS les données dans le cloud
- ❌ Peut être contournée par un utilisateur malveillant

---

## Recommandation

Pour une application multi-utilisateurs professionnelle, il faut **ABSOLUMENT** migrer vers Supabase avec RLS.

Voulez-vous que je vous aide à :
1. Créer les tables dans Supabase avec RLS ?
2. Migrer le code pour utiliser Supabase au lieu de Dexie ?
3. Créer un script de migration des données existantes ?
