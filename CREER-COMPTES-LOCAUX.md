# 🔐 Création des Comptes Locaux (IndexedDB)

## ✨ Comptes à créer

### 👨‍⚕️ Praticien
- **Email**: arnaudvb7@gmail.com
- **Mot de passe**: Jiskan22
- **Rôle**: PRACTITIONER

### 🔐 Administrateur
- **Email**: admin@admin.com
- **Mot de passe**: adminadmin
- **Rôle**: ADMIN

---

## 🚀 Méthode Rapide: Console du Navigateur

### Étape 1: Démarrer l'application
```bash
npm run dev
```

### Étape 2: Ouvrir le navigateur
Allez sur http://localhost:5173

### Étape 3: Ouvrir la console
- **Windows/Linux**: Appuyez sur `F12`
- **Mac**: Appuyez sur `Cmd + Option + J`

### Étape 4: Copier-coller le script
Copiez tout le contenu du fichier `public/create-accounts.js` et collez-le dans la console, puis appuyez sur **Entrée**.

Ou encore plus simple, tapez directement ceci dans la console:

```javascript
// Charger et exécuter le script
await import('/create-accounts.js');
```

### Étape 5: Recharger la page
Une fois les comptes créés, rechargez la page (F5) et connectez-vous!

---

## 📋 Alternative: Script en ligne

Si le fichier `create-accounts.js` ne fonctionne pas, copiez-collez ce script directement:

```javascript
(async function() {
  const { default: Dexie } = await import('https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.mjs');
  const db = new Dexie('TheraFlowDB');

  db.version(102).stores({
    patients: '++id, name, type, lat, lng',
    appointments: '++id, patientId, startTime, status',
    invoices: '++id, number, status, patientName',
    recurringInvoices: '++id, patientName, isActive',
    expenses: '++id, date, category',
    settings: '++id',
    sessions: '++id, patientId, date',
    smsLogs: '++id, date, status',
    surveyResponses: '++id, patientId, date',
    goals: '++id, type, period',
    loyaltyCards: '++id, patientId, isActive',
    loyaltyTransactions: '++id, cardId, date',
    referrals: '++id, referrerId, status',
    promotions: '++id, code, isActive',
    appointmentRequests: '++id, patientId, status',
    notifications: '++id, type, status',
    users: '++id, email, role, createdAt'
  });

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const accounts = [
    { email: 'arnaudvb7@gmail.com', password: 'Jiskan22', name: 'Arnaud VB', role: 'PRACTITIONER' },
    { email: 'admin@admin.com', password: 'adminadmin', name: 'Administrateur', role: 'ADMIN' }
  ];

  for (const acc of accounts) {
    const exists = await db.users.where('email').equals(acc.email).first();
    if (exists) {
      console.log(`⚠️  ${acc.email} existe déjà`);
      continue;
    }

    const hash = await hashPassword(acc.password);
    await db.users.add({
      email: acc.email,
      passwordHash: hash,
      name: acc.name,
      role: acc.role,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ ${acc.email} créé!`);
  }

  console.log('🎉 Terminé! Rechargez la page.');
})();
```

---

## ✅ Vérification

Après avoir créé les comptes, vous devriez voir dans la console:

```
✅ Comptes créés: 2
❌ Échecs: 0
====================================

🎉 Comptes créés avec succès!

Vous pouvez maintenant vous connecter:

👨‍⚕️ PRACTITIONER:
   Email: arnaudvb7@gmail.com
   Mot de passe: Jiskan22

🔐 ADMIN:
   Email: admin@admin.com
   Mot de passe: adminadmin

✨ Rechargez la page pour utiliser les nouveaux comptes!
```

---

## 🔍 Vérifier les comptes dans IndexedDB

Pour vérifier que les comptes ont bien été créés:

1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet **Application** (Chrome) ou **Storage** (Firefox)
3. Dans la sidebar, développez **IndexedDB** → **TheraFlowDB** → **users**
4. Vous devriez voir vos 2 comptes

---

## 🐛 Problèmes courants

### "db.users is undefined"
→ La table users n'existe pas. Exécutez d'abord le script de migration.

### "User already exists"
→ Les comptes existent déjà! Essayez de vous connecter directement.

### Script ne fait rien
→ Vérifiez que vous avez bien ouvert la console et que l'application tourne.

---

## 💡 Notes

- Les mots de passe sont hashés en SHA-256
- Les comptes sont stockés localement dans IndexedDB
- Aucune connexion internet n'est nécessaire
- Les données persistent même après fermeture du navigateur
- Pour réinitialiser, supprimez la base TheraFlowDB dans les DevTools
