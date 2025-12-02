# 🚨 Problèmes Critiques - Migration Supabase

## Analyse complète des problèmes identifiés

### ✅ Problèmes Résolus

1. **TypeError substring** - ✅ Corrigé
   - Protection null/undefined sur tous les `.substring()`
   - Fichiers: App.tsx, DailyDashboard.tsx, Navigation.tsx, etc.

2. **Settings Google ne se sauvegardent pas** - ✅ Corrigé
   - Transformation bidirectionnelle camelCase ↔ snake_case
   - Lecture et écriture normalisées

3. **Pas de bouton déconnexion** - ✅ Corrigé
   - Bouton ajouté dans PatientDashboard

4. **Dépendance date-fns manquante** - ✅ Corrigé
   - `npm install date-fns` effectué

---

## 🔴 Problèmes Critiques Restants

### 1. Table `profiles` manquante

**Symptôme:**
- Pas de praticiens dans la liste lors de la création de RDV patient
- Erreur probable: "relation 'public.profiles' does not exist"

**Cause:**
- Aucun script SQL ne crée la table `public.profiles`
- Le script v3 fait seulement `ALTER TABLE profiles` sans `CREATE TABLE`

**Solution:**
```sql
-- À ajouter au début du script SQL
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'PRACTITIONER', 'PATIENT', 'ASSISTANT')),
  phone TEXT,
  birth_date DATE,
  address TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  practitioner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'PATIENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Patients can view practitioners" ON public.profiles;
CREATE POLICY "Patients can view practitioners" ON public.profiles
  FOR SELECT USING (role IN ('PRACTITIONER', 'ADMIN'));
```

---

### 2. DatabaseClosedError - Dexie encore utilisé

**Symptôme:**
```
DatabaseClosedError: UnknownError Internal error opening backing store for indexedDB.open
```

**Cause:**
- Plusieurs composants utilisent encore `useLiveQuery` de Dexie
- L'app essaie d'accéder à IndexedDB alors qu'on utilise Supabase

**Composants à migrer:**
- `components/SessionHistory.tsx`
- `components/Navigation.tsx`
- `components/AdvancedStatistics.tsx`
- `components/AppointmentRequestManager.tsx`
- `components/FinanceModule.tsx`
- `components/GoalsWidget.tsx`
- `components/InvoiceReminders.tsx`
- `components/LoyaltyPromoModule.tsx`
- `components/MarketingAutomation.tsx`
- `components/ReminderModule.tsx`
- `components/RGPDModule.tsx`
- `components/SatisfactionSurvey.tsx`
- `components/SessionTemplates.tsx`
- `components/UrssafModule.tsx`
- `components/WeeklyPlanner.tsx`

**Solution:**
Remplacer tous les:
```typescript
// ❌ Ancien (Dexie)
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
const settings = useLiveQuery(() => db.settings.toArray())?.[0];

// ✅ Nouveau (Supabase)
import { useSettings } from '../hooks/useSupabaseData';
const { settings } = useSettings();
```

---

### 3. Techniques de séance manquantes

**Symptôme:**
- Les techniques (reiki, kinésio, etc.) ne s'affichent plus lors du lancement d'une séance

**Cause probable:**
- SessionWizard.tsx utilise probablement encore Dexie pour charger les templates
- Ou les templates ne sont pas stockés dans Supabase

**Solution:**
1. Vérifier si la table `session_templates` existe dans Supabase
2. Migrer les données des templates vers Supabase
3. Mettre à jour SessionWizard.tsx pour utiliser Supabase

---

### 4. Données manquantes dans Supabase

**Problème:**
Plusieurs tables sont définies dans le code mais peuvent être vides:
- `session_templates` - Templates de séances
- `products` - Produits pour l'inventaire
- `loyalty_cards` - Cartes de fidélité
- `promotions` - Promotions
- `goals` - Objectifs

**Solution:**
Créer des données de démonstration ou un script de migration depuis IndexedDB:

```typescript
// Script de migration Dexie → Supabase
import { db } from './db';
import { supabase } from './lib/supabase';

async function migrateData() {
  // Migrer les templates
  const templates = await db.sessionTemplates.toArray();
  for (const template of templates) {
    await supabase.from('session_templates').insert(template);
  }

  // Migrer les produits
  const products = await db.products.toArray();
  for (const product of products) {
    await supabase.from('products').insert(product);
  }

  // etc...
}
```

---

## 📋 Plan d'Action Recommandé

### Phase 1: Infrastructure (Urgent)
1. ✅ Créer script SQL complet avec table profiles
2. ✅ Exécuter le script dans Supabase
3. ✅ Vérifier que les tables sont créées

### Phase 2: Migration des composants
1. Identifier tous les composants utilisant Dexie
2. Les migrer un par un vers Supabase
3. Tester chaque composant après migration

### Phase 3: Migration des données
1. Créer un script de migration Dexie → Supabase
2. Migrer les données existantes
3. Ou créer des données de démonstration

### Phase 4: Cleanup
1. Supprimer les imports Dexie non utilisés
2. Supprimer db.ts si plus nécessaire
3. Retirer dexie des dépendances npm

---

## 🛠️ Script SQL Complet Recommandé

Un nouveau fichier `supabase_migration_v4_COMPLETE.sql` devrait être créé avec:

1. ✅ Création de la table profiles avec trigger
2. ✅ Toutes les tables nécessaires (appointment_requests, etc.)
3. ✅ Tables manquantes pour les fonctionnalités avancées:
   - session_templates
   - products
   - loyalty_cards
   - promotions
   - goals
   - survey_responses
   - sms_logs
4. ✅ Toutes les RLS policies
5. ✅ Toutes les fonctions et triggers

---

## 📊 État d'Avancement

### Fonctionnalités Core (Critiques)
- [x] Authentification multi-rôles
- [x] Demandes de RDV (appointment_requests)
- [x] Négociation RDV patient/praticien
- [x] Settings (avec transformation snake_case)
- [x] Dashboard patient (avec logout)
- [ ] **Liste des praticiens (table profiles manquante)** ⚠️
- [ ] **Séances avec techniques** ⚠️

### Fonctionnalités Avancées (Non-critiques)
- [ ] Templates de séances
- [ ] Produits/Inventaire
- [ ] Fidélité & Promotions
- [ ] Objectifs
- [ ] Enquêtes de satisfaction
- [ ] Statistiques avancées
- [ ] Rappels automatiques

---

## 💡 Recommandation

**Option A: Migration complète (Recommandé)**
- Créer un script SQL v4 complet
- Migrer tous les composants vers Supabase
- Supprimer Dexie complètement

**Option B: Approche hybride**
- Garder Dexie pour les fonctionnalités avancées
- Utiliser Supabase uniquement pour le core
- Mais cela cause les DatabaseClosedError actuels

👉 **Je recommande l'Option A** pour éviter les conflits et avoir une architecture cohérente.

---

## 📝 Actions Immédiates

1. Créer `supabase_migration_v4_COMPLETE.sql` avec la table profiles
2. Exécuter ce script dans Supabase
3. Vérifier que la liste des praticiens apparaît
4. Ensuite, traiter les autres problèmes un par un
