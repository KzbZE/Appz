// 🔍 DIAGNOSTIC COMPLET: TheraFlowDB (la vraie base utilisée par l'app)
// 📋 COPIEZ CE SCRIPT COMPLET ET COLLEZ-LE DANS LA CONSOLE (F12)

(async function diagnosticTheraFlowDB() {
  console.log('🔍 === DIAGNOSTIC TheraFlowDB (BASE ACTIVE) ===\n');

  try {
    // 1. Lister TOUTES les bases
    const databases = await window.indexedDB.databases();
    console.log('📋 Toutes les bases de données IndexedDB locales:');
    databases.forEach(db => {
      console.log(`  - ${db.name} (v${db.version})`);
    });
    console.log('');

    // 2. Ouvrir TheraFlowDB (LA BONNE BASE)
    const request = indexedDB.open('TheraFlowDB');

    request.onsuccess = function(event) {
      const db = event.target.result;
      console.log(`✅ TheraFlowDB ouverte (version ${db.version})`);

      if (db.version < 9) {
        console.log('⚠️ VERSION OBSOLÈTE ! Attendu: v9 ou v90+');
        console.log('   → Fermez tous les onglets et rechargez l\'app\n');
      } else {
        console.log('✅ Version OK\n');
      }

      // 3. Lister tous les object stores
      console.log('📊 Object stores présents:');
      const storeNames = Array.from(db.objectStoreNames);
      storeNames.forEach(name => {
        console.log(`  ✓ ${name}`);
      });
      console.log('');

      // 4. Vérifier 'settings' existe
      if (storeNames.includes('settings')) {
        console.log('✅ Object store "settings" EXISTE !');

        // 4b. Lire la config Google
        const tx = db.transaction(['settings'], 'readonly');
        const settingsStore = tx.objectStore('settings');
        const getAllRequest = settingsStore.getAll();

        getAllRequest.onsuccess = function() {
          const settings = getAllRequest.result;
          console.log(`   → ${settings.length} enregistrement(s) dans settings\n`);

          if (settings.length > 0) {
            const config = settings[0];
            console.log('⚙️ Configuration Google:');
            console.log('  Client ID:', config.googleClientId ? '✅ Configuré' : '❌ Manquant');
            console.log('  API Key:', config.googleApiKey ? '✅ Configuré' : '❌ Manquant');
            console.log('  Access Token:', config.accessToken ? '✅ Présent' : '❌ Absent');

            if (config.tokenExpiry) {
              const now = Date.now();
              const expiryDate = new Date(config.tokenExpiry);
              const minutesLeft = Math.round((config.tokenExpiry - now) / 60000);

              if (now > config.tokenExpiry) {
                console.log('  ⚠️ Token EXPIRÉ ! Reconnectez-vous.');
              } else {
                console.log(`  ✅ Token valide (expire dans ${minutesLeft} min)`);
              }
            } else {
              console.log('  Token Expiry: ❌ Non défini');
            }
            console.log('');
          } else {
            console.log('⚠️ Table settings VIDE (jamais configuré)\n');
          }
        };
      } else {
        console.log('❌ Object store "settings" MANQUANT !');
        console.log('   → Impossible de sauvegarder config Google\n');
      }

      // 5. Vérifier index 'phone' sur patients
      if (storeNames.includes('patients')) {
        const transaction = db.transaction(['patients'], 'readonly');
        const patientsStore = transaction.objectStore('patients');

        console.log('📇 Index sur "patients":');
        const indexNames = Array.from(patientsStore.indexNames);

        if (indexNames.length > 0) {
          indexNames.forEach(indexName => {
            console.log(`  ✓ ${indexName}`);
          });
        } else {
          console.log('  ⚠️ Aucun index trouvé (seulement clé primaire)');
        }

        // Vérifier 'phone' spécifiquement
        if (indexNames.includes('phone')) {
          console.log('\n✅ Index "phone" EXISTE ! Formulaire RDV OK');
        } else {
          console.log('\n❌ Index "phone" MANQUANT !');
          console.log('   → Erreur: "KeyPath phone is not indexed"');
          console.log('   → Le formulaire de demande RDV va échouer');
        }
        console.log('');
      }

      // 6. Vérifier GAPI chargé
      console.log('🌐 Google API (GAPI):');
      if (window.gapi) {
        console.log('  ✓ window.gapi chargé');

        if (window.gapi.client) {
          console.log('  ✓ gapi.client initialisé');

          const token = window.gapi.client.getToken();
          if (token?.access_token) {
            console.log('  ✅ Token actif dans GAPI - Google Calendar/Drive prêt');
          } else {
            console.log('  ⚠️ Pas de token dans GAPI (non connecté)');
          }
        } else {
          console.log('  ⚠️ gapi.client pas encore initialisé');
        }
      } else {
        console.log('  ❌ window.gapi non chargé (scripts Google manquants)');
      }

      db.close();

      console.log('\n' + '='.repeat(60));
      console.log('📝 RÉSUMÉ:');
      console.log('='.repeat(60));
      console.log('Base de données active: TheraFlowDB v' + db.version);
      console.log('Settings store: ' + (storeNames.includes('settings') ? '✅' : '❌'));
      console.log('Index phone: ' + (storeNames.includes('patients') ? 'Vérifier ci-dessus' : '❌'));
      console.log('GAPI: ' + (window.gapi ? '✅' : '❌'));
      console.log('='.repeat(60));
    };

    request.onerror = function(event) {
      console.error('❌ ERREUR ouverture TheraFlowDB:', event.target.error);
    };

  } catch (err) {
    console.error('❌ ERREUR diagnostic:', err);
  }
})();

console.log('\n💡 NOTES:');
console.log('  • AppDB (v8) = ancienne base, ignorez-la');
console.log('  • TheraFlowDB = base active utilisée par l\'app');
console.log('  • IndexedDB = stockage LOCAL (pas Supabase)');
console.log('  • Si version < 9: fermez TOUS onglets et rechargez');
