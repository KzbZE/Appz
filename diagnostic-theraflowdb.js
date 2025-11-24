// 🔍 DIAGNOSTIC COMPLET: TheraFlowDB (la vraie base de données utilisée par l'application)
// 📋 À copier/coller dans la console du navigateur (F12)

(async function diagnosticTheraFlowDB() {
  console.log('🔍 === DIAGNOSTIC TheraFlowDB ===\n');

  try {
    // 1. Lister toutes les bases de données
    const databases = await window.indexedDB.databases();
    console.log('📋 Bases de données disponibles:');
    databases.forEach(db => {
      console.log(`  - ${db.name} (v${db.version})`);
    });
    console.log('');

    // 2. Ouvrir TheraFlowDB (la vraie base)
    const request = indexedDB.open('TheraFlowDB');

    request.onsuccess = function(event) {
      const db = event.target.result;
      console.log(`✅ TheraFlowDB ouverte (version ${db.version})\n`);

      console.log('📊 Object stores présents:');
      const storeNames = Array.from(db.objectStoreNames);
      storeNames.forEach(name => {
        console.log(`  ✓ ${name}`);
      });
      console.log('');

      // 3. Vérifier 'settings' existe
      if (storeNames.includes('settings')) {
        console.log('✅ Object store "settings" EXISTE !');
      } else {
        console.log('❌ Object store "settings" MANQUANT !');
      }

      // 4. Vérifier les index sur 'patients'
      if (storeNames.includes('patients')) {
        const transaction = db.transaction(['patients'], 'readonly');
        const patientsStore = transaction.objectStore('patients');

        console.log('\n📇 Index sur "patients":');
        const indexNames = Array.from(patientsStore.indexNames);
        if (indexNames.length > 0) {
          indexNames.forEach(indexName => {
            const index = patientsStore.index(indexName);
            console.log(`  ✓ ${indexName} (keyPath: ${index.keyPath})`);
          });
        } else {
          console.log('  ⚠️ Aucun index trouvé');
        }

        // Vérifier explicitement si 'phone' est indexé
        if (indexNames.includes('phone')) {
          console.log('\n✅ Index "phone" EXISTE sur patients !');
        } else {
          console.log('\n❌ Index "phone" MANQUANT sur patients !');
          console.log('   → Cela causera l\'erreur "KeyPath phone is not indexed"');
        }
      }

      // 5. Lire la configuration Google (si settings existe)
      if (storeNames.includes('settings')) {
        const tx = db.transaction(['settings'], 'readonly');
        const settingsStore = tx.objectStore('settings');
        const getAllRequest = settingsStore.getAll();

        getAllRequest.onsuccess = function() {
          const settings = getAllRequest.result;
          console.log('\n⚙️ Configuration Google:');

          if (settings.length > 0) {
            const config = settings[0];
            console.log('  Google Client ID:', config.googleClientId || '❌ Non configuré');
            console.log('  Google API Key:', config.googleApiKey || '❌ Non configuré');
            console.log('  Access Token:', config.accessToken ? '✅ Présent' : '❌ Absent');
            console.log('  Token Expiry:', config.tokenExpiry || '❌ Non défini');

            if (config.tokenExpiry) {
              const now = Date.now();
              const expiryDate = new Date(config.tokenExpiry);
              if (now > config.tokenExpiry) {
                console.log('  ⚠️ Token EXPIRÉ ! Reconnectez-vous à Google.');
              } else {
                console.log(`  ✅ Token valide jusqu'à ${expiryDate.toLocaleString()}`);
              }
            }
          } else {
            console.log('  ⚠️ Aucune configuration trouvée (table settings vide)');
          }
        };
      }

      db.close();
    };

    request.onerror = function(event) {
      console.error('❌ Erreur ouverture TheraFlowDB:', event.target.error);
    };

  } catch (err) {
    console.error('❌ Erreur diagnostic:', err);
  }
})();

console.log('');
console.log('💡 Si la version est inférieure à 9:');
console.log('   1. Fermez tous les onglets TheraFlow');
console.log('   2. Rouvrez l\'application');
console.log('   3. La base sera automatiquement mise à jour vers v9');
console.log('');
console.log('💡 Si "phone" manque toujours après v9:');
console.log('   → La migration Dexie a peut-être échoué');
console.log('   → Supprimez la base et rechargez (⚠️ perd les données)');
