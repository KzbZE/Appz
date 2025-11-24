// ===== SCRIPT DE DIAGNOSTIC AMÉLIORÉ =====
// Copie-colle ce code dans la console (F12)

console.log("🔍 === DIAGNOSTIC BASE DE DONNÉES ===\n");

// Lister toutes les bases de données
indexedDB.databases().then(dbs => {
    console.log("📋 Bases de données trouvées:");
    dbs.forEach(db => {
        console.log(`  - ${db.name} (version ${db.version})`);
    });

    // Ouvrir AppDB
    const request = indexedDB.open('AppDB');

    request.onsuccess = (event) => {
        const db = event.target.result;
        console.log(`\n✅ Base de données 'AppDB' ouverte (version ${db.version})`);
        console.log(`\nObject stores disponibles:`);

        const storesList = [];
        for (let i = 0; i < db.objectStoreNames.length; i++) {
            storesList.push(db.objectStoreNames[i]);
            console.log(`  ${i + 1}. ${db.objectStoreNames[i]}`);
        }

        // Vérifier si 'settings' existe
        if (db.objectStoreNames.contains('settings')) {
            console.log("\n✅ Object store 'settings' trouvé");

            // Lire les settings
            const transaction = db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const getRequest = store.getAll();

            getRequest.onsuccess = () => {
                const settings = getRequest.result;
                console.log(`\nNombre de settings: ${settings.length}`);

                if (settings.length > 0) {
                    const s = settings[0];
                    console.log("\nConfiguration trouvée:");
                    console.log("  - google:", s.google ? "✅ Existe" : "❌ Manquant");

                    if (s.google) {
                        console.log("    - clientId:", s.google.clientId ? "✅ Configuré" : "❌ Manquant");
                        console.log("    - apiKey:", s.google.apiKey ? "✅ Configuré" : "❌ Manquant");
                        console.log("    - accessToken:", s.google.accessToken ? "✅ Présent" : "❌ Absent");

                        if (s.google.accessToken) {
                            console.log("    - Token (début):", s.google.accessToken.substring(0, 30) + "...");
                        }

                        if (s.google.tokenExpiry) {
                            const now = Date.now();
                            const expiry = s.google.tokenExpiry;
                            const isExpired = now > expiry;
                            const diff = Math.round((expiry - now) / 1000 / 60);
                            console.log(`    - Expiration: ${isExpired ? '❌ EXPIRÉ' : `✅ Valide (${diff} min)`}`);
                        } else {
                            console.log("    - Expiration: ⚠️ Non définie");
                        }

                        // TEST GOOGLE API
                        console.log("\n📋 Test Google API:");
                        if (window.gapi && window.gapi.client) {
                            console.log("✅ gapi.client disponible");

                            const token = window.gapi.client.getToken();
                            if (token && token.access_token) {
                                console.log("✅ Token actif dans gapi.client");

                                // Test Calendar
                                console.log("\n📋 Test accès Google Calendar...");
                                window.gapi.client.calendar.events.list({
                                    'calendarId': 'primary',
                                    'timeMin': (new Date()).toISOString(),
                                    'maxResults': 10,
                                    'singleEvents': true,
                                    'orderBy': 'startTime'
                                }).then(response => {
                                    console.log(`✅ Google Calendar accessible ! ${response.result.items.length} événements trouvés`);

                                    if (response.result.items.length > 0) {
                                        console.log("\nPremiers événements:");
                                        response.result.items.slice(0, 3).forEach((event, idx) => {
                                            console.log(`  ${idx + 1}. ${event.summary} - ${event.start.dateTime || event.start.date}`);
                                        });
                                    } else {
                                        console.log("ℹ️ Aucun événement futur dans Google Calendar");
                                    }
                                }).catch(err => {
                                    console.error("❌ Erreur Google Calendar:", err);
                                    if (err.status === 401) {
                                        console.log("→ Token invalide ou expiré. Reconnectez-vous.");
                                    } else if (err.status === 403) {
                                        console.log("→ Permissions insuffisantes. Autorisez Calendar lors de la connexion.");
                                    }
                                });
                            } else {
                                console.log("❌ Aucun token dans gapi.client");
                                console.log("→ Solution: Paramètres → Se connecter avec Google");
                            }
                        } else {
                            console.log("❌ gapi.client non initialisé");
                            console.log("→ Solution: Rafraîchir la page");
                        }
                    } else {
                        console.log("\n❌ Aucune configuration Google trouvée");
                        console.log("→ Solution: Aller dans Paramètres → Configurer Google (Client ID + API Key)");
                    }
                } else {
                    console.log("\n⚠️ Aucun setting trouvé dans la base");
                    console.log("→ Solution: Aller dans Paramètres pour initialiser la configuration");
                }

                db.close();
            };

            getRequest.onerror = () => {
                console.error("❌ Erreur lors de la lecture des settings");
            };
        } else {
            console.log("\n❌ Object store 'settings' NON TROUVÉ !");
            console.log("Liste des stores:", storesList.join(", "));
            console.log("\n→ La base de données n'est pas correctement initialisée");
            console.log("→ Solution: Rafraîchir complètement (Ctrl+Shift+R ou Ctrl+F5)");
            db.close();
        }
    };

    request.onerror = () => {
        console.error("❌ Erreur lors de l'ouverture de la base de données");
    };
}).catch(err => {
    console.error("❌ Erreur lors de la liste des bases:", err);
});
