/**
 * Script de création des comptes - Version Console Navigateur
 *
 * INSTRUCTIONS:
 * 1. Démarrez l'application (npm run dev)
 * 2. Ouvrez la console du navigateur (F12)
 * 3. Copiez-collez ce script dans la console
 * 4. Appuyez sur Entrée
 */

(async function createAccounts() {
  console.log('🚀 Création des comptes TheraFlow...\n');

  // Import dynamique du service d'auth
  const { authService } = await import('./services/authService');

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
  let failCount = 0;

  for (const account of accounts) {
    console.log(`\n📝 Création du compte ${account.role}: ${account.email}...`);

    try {
      const result = await authService.register({
        email: account.email,
        password: account.password,
        name: account.name,
        role: account.role
      });

      if (result.success && result.user) {
        console.log(`✅ Compte créé avec succès!`);
        console.log(`   ID: ${result.user.id}`);
        console.log(`   Email: ${result.user.email}`);
        console.log(`   Rôle: ${account.role}`);
        successCount++;
      } else {
        console.error(`❌ Erreur: ${result.error || 'Erreur inconnue'}`);
        failCount++;
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
      failCount++;
    }

    // Petite pause entre les créations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Comptes créés: ${successCount}`);
  console.log(`❌ Échecs: ${failCount}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('\n🎉 Vous pouvez maintenant vous connecter avec:');
    accounts.forEach(acc => {
      console.log(`\n${acc.role === 'ADMIN' ? '🔐' : '👨‍⚕️'} ${acc.role}:`);
      console.log(`   Email: ${acc.email}`);
      console.log(`   Mot de passe: ${acc.password}`);
    });
  }

  console.log('\n✨ Rechargez la page pour utiliser les nouveaux comptes!\n');
})();
