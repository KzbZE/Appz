# 🐛 Guide de Debug - Écran Blanc Netlify

## 🔍 Diagnostic Rapide

Si vous voyez un écran blanc sur Netlify, suivez ces étapes:

---

## ✅ Étape 1: Vérifier les Variables d'Environnement

### Dans Netlify Dashboard:

1. **Accéder aux Variables**
   ```
   Site settings → Environment variables → Edit variables
   ```

2. **Ajouter les Variables Requises**
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **IMPORTANT**: Les variables doivent commencer par `VITE_` pour être accessibles côté client avec Vite

4. **Redéployer**
   ```
   Deploys → Trigger deploy → Clear cache and deploy site
   ```

---

## ✅ Étape 2: Vérifier la Console Navigateur

1. **Ouvrir votre site Netlify**
   ```
   https://votre-site.netlify.app
   ```

2. **Ouvrir la Console (F12)**
   ```
   Console → Vérifier erreurs JavaScript
   ```

3. **Erreurs Courantes**:

   **A. "Failed to load module"**
   ```
   Cause: Chemin d'assets incorrect
   Solution: Vérifier base: '/' dans vite.config.ts ✅ (déjà fait)
   ```

   **B. "Supabase client error"**
   ```
   Cause: Variables d'environnement manquantes
   Solution: Ajouter VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
   ```

   **C. "Cannot read property of undefined"**
   ```
   Cause: Initialisation échouée
   Solution: Vérifier que les variables sont bien définies
   ```

---

## ✅ Étape 3: Vérifier le Build Log

1. **Accéder aux Logs**
   ```
   Deploys → [Dernier déploiement] → Deploy log
   ```

2. **Vérifier le Succès**
   ```bash
   # Doit afficher:
   ✓ building for production...
   ✓ built in XXs

   # PAS d'erreurs TypeScript
   # PAS d'erreurs de compilation
   ```

3. **Si Erreurs de Build**:
   ```bash
   # Vérifier les imports manquants
   # Vérifier les erreurs TypeScript
   # Vérifier les dépendances npm
   ```

---

## ✅ Étape 4: Tester en Local

1. **Build Local**
   ```bash
   npm run build
   ```

2. **Preview Local**
   ```bash
   npx serve -s dist
   # Ouvrir http://localhost:3000
   ```

3. **Si Fonctionne en Local mais pas sur Netlify**:
   - Vérifier les variables d'environnement Netlify
   - Vérifier les chemins d'assets
   - Vérifier la configuration netlify.toml

---

## 🔧 Solutions par Type d'Erreur

### Erreur: "Écran blanc + Aucune erreur console"

**Cause probable**: Variables d'environnement manquantes

**Solution**:
```bash
# Netlify Dashboard → Environment variables
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redéployer avec cache clear
```

---

### Erreur: "Failed to fetch"

**Cause**: CSP headers trop restrictifs ou CORS

**Solution**:
```html
<!-- index.html - Vérifier que Supabase est dans connect-src -->
connect-src 'self' https://*.supabase.co
```

---

### Erreur: "Chunk load error"

**Cause**: Assets non trouvés

**Solution**:
```typescript
// vite.config.ts - Vérifier base path
base: '/', // ✅ Déjà configuré
```

---

## 🚀 Checklist Complète Netlify

### Configuration Build
- [x] Command: `npm run build` ✅
- [x] Publish directory: `dist` ✅
- [x] Node version: 18 ✅
- [x] Redirects configurés: `/* /index.html 200` ✅

### Variables d'Environnement
- [ ] `VITE_SUPABASE_URL` configurée ⚠️ **À FAIRE**
- [ ] `VITE_SUPABASE_ANON_KEY` configurée ⚠️ **À FAIRE**
- [ ] Redéploiement après ajout variables ⚠️ **À FAIRE**

### Fichiers de Config
- [x] `netlify.toml` présent ✅
- [x] `public/_redirects` présent ✅
- [x] `vite.config.ts` configuré ✅

---

## 📝 Étapes de Résolution Recommandées

### 1. Configurer Variables d'Environnement (PRIORITÉ 1)

```bash
# Dans Netlify Dashboard:
Site settings → Environment variables → Add a variable

# Ajouter:
Key: VITE_SUPABASE_URL
Value: [Votre URL Supabase depuis Supabase Dashboard → Settings → API]

Key: VITE_SUPABASE_ANON_KEY
Value: [Votre anon key depuis Supabase Dashboard → Settings → API]
```

### 2. Redéployer avec Cache Clear

```bash
# Dans Netlify:
Deploys → Trigger deploy → Clear cache and deploy site

# Ou via CLI:
netlify deploy --prod --build
```

### 3. Vérifier la Console

```bash
# Ouvrir votre site
# F12 → Console
# Vérifier qu'il n'y a pas d'erreurs
```

### 4. Tester les Fonctionnalités

```bash
# Essayer de:
- Créer un nouveau patient
- Voir le dashboard
- Accéder aux différentes pages
```

---

## 🔍 Commandes de Debug

### Test Variables d'Environnement

```typescript
// Ajouter temporairement dans index.tsx pour debug:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key présente:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Devrait afficher dans console:
// Supabase URL: https://xxxxx.supabase.co
// Supabase Key présente: true
```

### Test Build Local

```bash
# Créer .env.production.local
echo "VITE_SUPABASE_URL=https://xxxxx.supabase.co" > .env.production.local
echo "VITE_SUPABASE_ANON_KEY=eyJhbGci..." >> .env.production.local

# Build
npm run build

# Test
npx serve -s dist
```

---

## 📞 Si le Problème Persiste

1. **Vérifier Build Log Complet**
   ```
   Netlify → Deploys → [Latest] → Deploy log
   Rechercher "error" ou "failed"
   ```

2. **Activer Debug Mode**
   ```bash
   # Netlify CLI
   netlify dev

   # Devrait montrer les erreurs localement
   ```

3. **Vérifier Network Tab**
   ```
   F12 → Network
   Vérifier que index.html charge
   Vérifier que les assets JS/CSS chargent
   Vérifier les appels API Supabase
   ```

4. **Consulter Logs Netlify**
   ```
   Netlify → Functions (si utilisées)
   Vérifier les erreurs de fonction
   ```

---

## 💡 Problèmes Connus & Solutions

### Problème: CSP Headers bloquent Supabase

**Symptôme**: Console montre "Refused to connect"

**Solution**:
```html
<!-- index.html - Déjà configuré mais vérifier -->
<meta http-equiv="Content-Security-Policy" content="
  connect-src 'self' https://*.supabase.co
">
```

### Problème: AuthModal ne s'affiche pas

**Cause**: Variables Supabase manquantes

**Solution**:
```typescript
// lib/supabase.ts gère déjà les URLs vides
// Mais l'app ne démarrera pas sans config Supabase
```

### Problème: 404 sur routes

**Cause**: Redirects SPA non configurés

**Solution**: ✅ Déjà fait dans netlify.toml et _redirects

---

## ✅ Solution Rapide (99% des cas)

**Le problème d'écran blanc sur Netlify est dans 99% des cas dû aux variables d'environnement manquantes.**

**Solution en 3 étapes**:

1. **Netlify Dashboard → Site settings → Environment variables**

2. **Ajouter**:
   ```
   VITE_SUPABASE_URL = [URL de Supabase Dashboard]
   VITE_SUPABASE_ANON_KEY = [anon key de Supabase Dashboard]
   ```

3. **Redéployer**:
   ```
   Deploys → Trigger deploy → Clear cache and deploy site
   ```

**Temps de résolution**: ~2 minutes

---

## 📊 Vérification Post-Fix

Après avoir ajouté les variables et redéployé, vérifier:

- [ ] Site charge (pas d'écran blanc)
- [ ] Console sans erreurs (F12)
- [ ] Dashboard s'affiche
- [ ] Navigation fonctionne
- [ ] Peut créer un patient (si Supabase configuré)

---

**Si le problème persiste après avoir suivi TOUS ces steps, copier le message d'erreur de la console et les logs de build pour debug avancé.**
