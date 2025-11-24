/**
 * SCRIPT DE DIAGNOSTIC GOOGLE CALENDAR/DRIVE
 *
 * Copiez-collez ce code dans la console du navigateur (F12 → Console)
 * pour diagnostiquer les problèmes Google Calendar/Drive
 */

(async function diagnosticGoogle() {
    console.log("🔍 === DIAGNOSTIC GOOGLE CALENDAR/DRIVE ===\n");

    // Test 1: Vérifier si window.gapi est chargé
    console.log("📋 Test 1: Chargement de l'API Google");
    if (!window.gapi) {
        console.error("❌ window.gapi n'est PAS chargé !");
        console.log("→ Solution: Rafraîchir la page (F5)");
        return;
    }
    console.log("✅ window.gapi est chargé");

    if (!window.google) {
        console.error("❌ window.google n'est PAS chargé !");
        console.log("→ Solution: Rafraîchir la page (F5)");
        return;
    }
    console.log("✅ window.google est chargé\n");

    // Test 2: Vérifier les settings dans IndexedDB
    console.log("📋 Test 2: Configuration dans les Paramètres");
    const db = await window.indexedDB.open('AppDB', 8);

    db.onsuccess = async () => {
        const transaction = db.result.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.getAll();

        request.onsuccess = () => {
            const settings = request.result[0];

            if (!settings?.google) {
                console.error("❌ Aucune configuration Google trouvée !");
                console.log("→ Solution: Aller dans Paramètres → Configurer Client ID et API Key");
                return;
            }

            console.log("Configuration Google :");
            console.log("  - Client ID:", settings.google.clientId ? "✅ Configuré" : "❌ Manquant");
            console.log("  - API Key:", settings.google.apiKey ? "✅ Configuré" : "❌ Manquant");
            console.log("  - Access Token:", settings.google.accessToken ? "✅ Présent" : "❌ Absent");

            if (settings.google.tokenExpiry) {
                const now = Date.now();
                const expiry = settings.google.tokenExpiry;
                const isExpired = now > expiry;
                const timeLeft = Math.round((expiry - now) / 1000 / 60);

                console.log("  - Token expiration:", isExpired ? "❌ EXPIRÉ" : `✅ Valide (${timeLeft} min restantes)`);

                if (isExpired) {
                    console.log("\n→ Solution: Le token est expiré. Allez dans Paramètres → Se connecter avec Google");
                }
            } else {
                console.log("  - Token expiration: ⚠️ Non défini");
            }

            console.log("\n");

            // Test 3: Vérifier si gapi.client est initialisé
            console.log("📋 Test 3: Initialisation du client GAPI");
            if (!window.gapi.client) {
                console.error("❌ gapi.client n'est PAS initialisé !");
                console.log("→ Solution: Rafraîchir la page ou aller dans Paramètres");
                return;
            }
            console.log("✅ gapi.client est initialisé\n");

            // Test 4: Vérifier si le token est défini dans gapi
            console.log("📋 Test 4: Token actif dans GAPI");
            const token = window.gapi.client.getToken();
            if (!token || !token.access_token) {
                console.error("❌ Aucun token actif dans gapi.client !");
                console.log("→ Solution: Aller dans Paramètres → Se connecter avec Google");
                return;
            }
            console.log("✅ Token actif dans gapi.client:", token.access_token.substring(0, 20) + "...\n");

            // Test 5: Tester l'accès à Google Calendar API
            console.log("📋 Test 5: Test d'accès à Google Calendar API");
            window.gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': (new Date()).toISOString(),
                'maxResults': 5,
                'singleEvents': true,
                'orderBy': 'startTime'
            }).then(response => {
                console.log("✅ Accès Google Calendar réussi !");
                console.log(`   Événements trouvés: ${response.result.items.length}`);
                if (response.result.items.length > 0) {
                    console.log("\n   Premiers événements:");
                    response.result.items.forEach((event, idx) => {
                        console.log(`   ${idx + 1}. ${event.summary} - ${event.start.dateTime || event.start.date}`);
                    });
                } else {
                    console.log("   ℹ️ Aucun événement futur trouvé dans Google Calendar");
                }
                console.log("\n");

                // Test 6: Tester l'accès à Google Drive API
                console.log("📋 Test 6: Test d'accès à Google Drive API");
                window.gapi.client.drive.files.list({
                    q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
                    fields: 'files(id, name)',
                    pageSize: 5
                }).then(driveResponse => {
                    console.log("✅ Accès Google Drive réussi !");
                    console.log(`   Dossiers trouvés: ${driveResponse.result.files.length}`);
                    if (driveResponse.result.files.length > 0) {
                        console.log("\n   Premiers dossiers:");
                        driveResponse.result.files.forEach((folder, idx) => {
                            console.log(`   ${idx + 1}. ${folder.name}`);
                        });
                    }

                    console.log("\n✅ === DIAGNOSTIC TERMINÉ - TOUT FONCTIONNE ! ===");
                    console.log("\nSi vous ne voyez pas vos événements dans l'app:");
                    console.log("1. Assurez-vous d'avoir cliqué sur '📥 Synchroniser' dans l'onglet Agenda");
                    console.log("2. Vérifiez que vous avez des événements FUTURS dans Google Calendar");
                    console.log("3. Rafraîchissez la page après la synchronisation\n");
                }).catch(driveError => {
                    console.error("❌ Erreur d'accès à Google Drive:", driveError);
                    console.log("→ Solution: Vérifiez les permissions Drive lors de la connexion Google");
                });
            }).catch(calendarError => {
                console.error("❌ Erreur d'accès à Google Calendar:", calendarError);

                if (calendarError.status === 401) {
                    console.log("→ Erreur 401 (Non autorisé): Le token est invalide ou expiré");
                    console.log("→ Solution: Aller dans Paramètres → Se connecter avec Google");
                } else if (calendarError.status === 403) {
                    console.log("→ Erreur 403 (Interdit): Permissions insuffisantes");
                    console.log("→ Solution: Lors de la connexion Google, autorisez l'accès à Google Calendar");
                } else {
                    console.log("→ Erreur inconnue. Détails:", calendarError.result?.error?.message || calendarError.message);
                }
            });
        };
    };

    db.onerror = () => {
        console.error("❌ Impossible d'accéder à la base de données IndexedDB");
    };
})();

console.log("💡 Script de diagnostic lancé. Les résultats s'afficheront ci-dessous...\n");
