# Guide de Déploiement - TheraFlow Hybrid

## 🚀 Déploiement sur Vercel (Gratuit & Rapide)

### Méthode 1 : Via CLI (Plus Rapide)

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter à Vercel (ouvre le navigateur)
vercel login

# Déployer l'application
vercel --prod
```

Vercel vous donnera une URL publique accessible depuis n'importe où (ex: `https://theraflow-hybrid.vercel.app`)

### Méthode 2 : Via Interface Web

1. Allez sur https://vercel.com
2. Connectez-vous avec GitHub
3. Cliquez sur "Import Project"
4. Sélectionnez votre repo `KzbZE/Appz`
5. Configuration :
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Cliquez sur "Deploy"

✅ En 2 minutes, votre app sera en ligne !

---

## 🌐 Déploiement sur Netlify (Alternative)

### Via Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod --dir=dist
```

### Via Interface Web

1. Allez sur https://app.netlify.com
2. Connectez-vous avec GitHub
3. Cliquez sur "Add new site" > "Import an existing project"
4. Sélectionnez votre repo
5. Configuration :
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Cliquez sur "Deploy"

---

## 📱 Déploiement sur GitHub Pages

```bash
# Installer gh-pages
npm install --save-dev gh-pages

# Ajouter à package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Déployer
npm run deploy
```

L'app sera accessible sur : `https://kzbze.github.io/Appz/`

---

## 🔧 Configuration pour Variables d'Environnement

Si vous utilisez l'IA Coach (Gemini), configurez la variable d'environnement sur la plateforme :

### Vercel
1. Allez dans Settings > Environment Variables
2. Ajoutez : `GEMINI_API_KEY` = votre_clé

### Netlify
1. Allez dans Site Settings > Build & Deploy > Environment
2. Ajoutez : `GEMINI_API_KEY` = votre_clé

---

## ✅ Après Déploiement

Une fois déployé, vous pourrez accéder à votre application depuis n'importe où :
- iPhone
- Android
- Desktop
- Tablette

L'URL sera du type : `https://votre-app.vercel.app`

**Installez-la comme PWA sur votre iPhone** :
1. Ouvrez l'URL dans Safari
2. Appuyez sur le bouton Partager
3. Sélectionnez "Sur l'écran d'accueil"
4. L'app apparaîtra comme une vraie application !
