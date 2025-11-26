/**
 * Script de création des comptes - À exécuter dans la console du navigateur
 *
 * INSTRUCTIONS:
 * 1. Démarrez l'application: npm run dev
 * 2. Ouvrez http://localhost:5173 dans le navigateur
 * 3. Ouvrez la console (F12)
 * 4. Copiez-collez ce code dans la console
 * 5. Appuyez sur Entrée
 */

(async function createLocalAccounts() {
  console.log('🚀 Création des comptes locaux TheraFlow...\n');

  // Importer Dexie et créer/ouvrir la base de données
  const { default: Dexie } = await import('https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.mjs');

  // Créer une instance de la base de données
  const db = new Dexie('TheraFlowDB');

  // Définir le schéma (version 102 avec table users)
  db.version(102).stores({
    patients: '++id, name, type, lat, lng',
    appointments: '++id, patientId, startTime, status, isOptimizedSlot, googleEventId',
    invoices: '++id, number, status, patientName',
    recurringInvoices: '++id, patientName, isActive, nextDueDate',
    expenses: '++id, date, category',
    settings: '++id',
    sessions: '++id, patientId, date, type',
    smsLogs: '++id, date, status',
    surveyResponses: '++id, patientId, date, npsScore',
    goals: '++id, type, period, isActive, endDate',
    loyaltyCards: '++id, patientId, isActive, type',
    loyaltyTransactions: '++id, cardId, patientId, date, type',
    referrals: '++id, referrerId, status, createdDate',
    promotions: '++id, code, isActive, startDate, endDate',
    appointmentRequests: '++id, patientId, status, requestedStartTime, createdAt',
    notifications: '++id, type, status, sentAt, relatedRequestId',
    users: '++id, email, role, createdAt'
  });

  // Fonction de hash simple (SHA-256)
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Comptes à créer
  const accounts = [
    {
      email: 'arnaudvb7@gmail.com',
      password: 'Jiskan22',
      name: 'Arnaud VB',
      role: 'PRACTITIONER'
    },
    {
      email: 'admin@admin.com',
      password: 'adminadmin',
      name: 'Administrateur',
      role: 'ADMIN'
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const account of accounts) {
    console.log(`📝 Création de ${account.role}: ${account.email}...`);

    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await db.users.where('email').equals(account.email).first();

      if (existingUser) {
        console.log(`⚠️  ${account.role}: Compte déjà existant`);
        errorCount++;
        continue;
      }

      // Hasher le mot de passe
      const passwordHash = await hashPassword(account.password);

      // Créer l'utilisateur
      const userId = await db.users.add({
        email: account.email,
        passwordHash: passwordHash,
        name: account.name,
        role: account.role,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ ${account.role}: Créé avec succès (ID: ${userId})`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${account.role}: Erreur - ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Comptes créés: ${successCount}`);
  console.log(`❌ Échecs: ${errorCount}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('\n🎉 Comptes créés avec succès!\n');
    console.log('Vous pouvez maintenant vous connecter:');
    accounts.forEach(acc => {
      console.log(`\n${acc.role === 'ADMIN' ? '🔐' : '👨‍⚕️'} ${acc.role}:`);
      console.log(`   Email: ${acc.email}`);
      console.log(`   Mot de passe: ${acc.password}`);
    });
    console.log('\n✨ Rechargez la page pour utiliser les nouveaux comptes!\n');
  }
})().catch(error => {
  console.error('❌ Erreur fatale:', error);
});
