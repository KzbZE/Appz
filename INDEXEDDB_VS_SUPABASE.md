# 📚 IndexedDB vs Supabase : Quelle est la différence ?

## 🤔 CONFUSION FRÉQUENTE

Vous avez demandé "Comment savoir dans Supabase si elle s'est mise à jour ?"

**Problème** : IndexedDB et Supabase sont **deux systèmes complètement différents** !

---

## 🗄️ IndexedDB (Base de données LOCALE)

### Qu'est-ce que c'est ?

IndexedDB = Base de données **stockée dans votre navigateur** (sur votre ordinateur)

- **Stockage** : Local (navigateur Chrome, Firefox, Safari...)
- **Accès** : Seulement depuis **votre navigateur** sur **votre machine**
- **Persistance** : Les données restent même après fermeture du navigateur
- **Synchronisation** : **Aucune** entre appareils
- **Taille** : Limitée (quelques centaines de Mo max)

### Exemples d'utilisation dans TheraFlow

- Liste des patients
- Rendez-vous
- Factures
- Configuration de l'application
- **Configuration Google (Client ID, API Key, Access Token)**

### Comment voir IndexedDB ?

1. Ouvrez la console navigateur : **F12**
2. Onglet **Application** (Chrome) ou **Storage** (Firefox)
3. Section **IndexedDB** à gauche
4. Vous verrez :
   - `TheraFlowDB` (version 90) ← **BASE ACTIVE**
   - `AppDB` (version 8) ← ancienne base, ignorez

### Caractéristiques

✅ **Avantages** :
- Ultra-rapide (pas de réseau)
- Fonctionne hors ligne
- Gratuit
- Données privées (sur votre machine)

❌ **Inconvénients** :
- **Pas de synchronisation** multi-appareils
- Si vous videz le cache navigateur → **données perdues**
- Stockage limité
- Visible uniquement sur **cet appareil**

---

## ☁️ Supabase (Base de données CLOUD)

### Qu'est-ce que c'est ?

Supabase = Base de données **hébergée sur Internet** (cloud PostgreSQL)

- **Stockage** : Sur les serveurs Supabase (cloud)
- **Accès** : Depuis **n'importe quel appareil** avec connexion Internet
- **Persistance** : Permanente (tant que compte Supabase existe)
- **Synchronisation** : Automatique entre tous vos appareils
- **Taille** : Quasi-illimitée (plan payant)

### Exemples d'utilisation (si implémenté)

Dans votre app, Supabase **n'est PAS encore utilisé activement** pour stocker des données.

**Utilisations potentielles futures** :
- Backup automatique des patients/RDV
- Synchronisation multi-appareils
- Partage de données entre praticiens
- Stockage fichiers volumineux

### Comment voir Supabase ?

1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet
4. **Table Editor** : Voir les tables et données
5. **SQL Editor** : Requêtes SQL
6. **Database** → **Tables** : Structure

### Caractéristiques

✅ **Avantages** :
- Synchronisation multi-appareils
- Backup automatique
- Partage entre utilisateurs
- Stockage quasi-illimité
- Sécurisé (authentification, permissions)

❌ **Inconvénients** :
- Nécessite connexion Internet
- Payant au-delà du plan gratuit
- Légèrement plus lent (requête réseau)
- Configuration complexe

---

## 🔄 COMPARAISON DIRECTE

| Critère | IndexedDB | Supabase |
|---------|-----------|----------|
| **Localisation** | Navigateur (local) | Cloud (serveurs) |
| **Synchronisation** | ❌ Aucune | ✅ Multi-appareils |
| **Hors ligne** | ✅ Fonctionne | ❌ Nécessite Internet |
| **Vitesse** | ⚡ Ultra-rapide | 🐢 Latence réseau |
| **Taille max** | ~200-500 Mo | 📦 Quasi-illimité |
| **Prix** | Gratuit | Gratuit puis payant |
| **Backup** | ❌ Aucun | ✅ Automatique |
| **Accès** | Un seul appareil | Tous vos appareils |
| **Sécurité** | Machine locale | Cloud sécurisé |

---

## 🎯 DANS THERAFLOW (ÉTAT ACTUEL)

### Ce qui est stocké dans IndexedDB (LOCAL)

- ✅ Patients
- ✅ Rendez-vous
- ✅ Factures
- ✅ Dépenses
- ✅ Configuration Google
- ✅ SMS logs
- ✅ Sessions

**→ C'est la base ACTIVE de votre application**

### Ce qui est stocké dans Supabase (CLOUD)

- ❓ Pas encore implémenté activement dans votre app
- La connexion existe mais n'est pas utilisée pour le stockage principal

**→ Potentiel pour backup futur**

---

## 📊 VERSIONS DE BASE DE DONNÉES

### IndexedDB : TheraFlowDB v90 (ou v9)

Quand on parle de "version 90" ou "version 9", on parle du **schéma de la base de données**.

**Comment ça marche ?**

```typescript
// db.ts
this.version(8).stores({ ... })  // v8 = sans index phone
this.version(9).stores({ ... })  // v9 = avec index phone
```

Chaque fois qu'on modifie le schéma (ajout index, nouvelle table, etc.), on **incrémente la version**.

**Version 90 ?**
Probablement une ancienne migration. L'important est que la version soit ≥ 9 pour avoir l'index `phone`.

### Supabase : Migrations SQL

Sur Supabase, les versions s'appellent **migrations** :

```sql
-- Migration 001: Create patients table
CREATE TABLE patients (...);

-- Migration 002: Add phone index
CREATE INDEX idx_phone ON patients(phone);
```

---

## 🔍 COMMENT VÉRIFIER LA VERSION

### IndexedDB (TheraFlowDB)

**Console F12** :

```javascript
indexedDB.databases().then(dbs => {
  dbs.forEach(db => console.log(db.name, 'v' + db.version));
});

// Résultat :
// TheraFlowDB v90  ← BASE ACTIVE
// AppDB v8         ← ANCIENNE (ignorez)
```

### Supabase

1. Dashboard Supabase → **Database** → **Migrations**
2. Ou SQL Editor :

```sql
SELECT * FROM _prisma_migrations; -- Si Prisma
-- ou
SELECT version FROM schema_migrations; -- Si autre ORM
```

---

## ❓ FAQ

### Q: Pourquoi AppDB v8 existe encore ?

**Réponse** : C'est une **ancienne base** créée lors d'un test précédent.
Elle n'est **plus utilisée** par l'application.

**Solution** : Vous pouvez la supprimer (Console F12) :

```javascript
indexedDB.deleteDatabase('AppDB');
```

### Q: Mes données sont-elles sauvegardées ?

**IndexedDB** : ❌ Non, sauf si backup manuel
**Supabase** : ✅ Oui, automatiquement (si implémenté)

### Q: Si je change d'ordinateur, je perds mes patients ?

**Avec IndexedDB seul** : ❌ Oui, les données sont locales
**Avec Supabase sync** : ✅ Non, synchronisation cloud

### Q: Comment forcer la migration IndexedDB ?

**Si version reste < 9** :

1. Fermez **TOUS** les onglets TheraFlow
2. Rechargez l'application
3. Dexie migrera automatiquement

**Si ça ne marche pas** :

```javascript
// Console F12 - ⚠️ PERD LES DONNÉES
indexedDB.deleteDatabase('TheraFlowDB');
location.reload();
```

### Q: Supabase est-il nécessaire ?

**Pour l'instant** : ❌ Non, l'app fonctionne avec IndexedDB seul
**À l'avenir** : ✅ Oui, pour synchronisation et backup multi-appareils

---

## 🎯 EN RÉSUMÉ

| Question | Réponse |
|----------|---------|
| **Où sont mes patients ?** | IndexedDB (local navigateur) |
| **Comment vérifier la version ?** | Console F12 → `indexedDB.databases()` |
| **Supabase stocke mes données ?** | Non (pas encore implémenté) |
| **Comment sauvegarder ?** | Export manuel ou implémenter sync Supabase |
| **Puis-je supprimer AppDB ?** | Oui, c'est une ancienne base |

---

**🔑 Retenez** : IndexedDB = **LOCAL** (navigateur) / Supabase = **CLOUD** (Internet)
