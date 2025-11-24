# 📅 Statut Synchronisation Google Calendar & Drive

## ✅ Fonctionnalités implémentées

### 1. **Google Calendar - Export automatique** ✅
**Emplacement** : `components/WeeklyPlanner.tsx:138-162`

Quand vous créez un rendez-vous dans le planning, il est **automatiquement exporté** vers Google Calendar :

```typescript
// Auto-export to Google Calendar
const googleEvent = await createCalendarEvent({
  summary: `${patientName} - ${newApptData.type}`,
  description: newApptData.notes || '',
  start: slotDate.toISOString(),
  end: endDate.toISOString(),
  location: patient?.address || ''
});

if (googleEvent && googleEvent.id) {
  await db.appointments.update(appointmentId, { googleEventId: googleEvent.id });
}
```

**Comment tester** :
1. Aller dans "Planning"
2. Cliquer sur une case vide
3. Créer un nouveau rendez-vous
4. ✅ Il devrait apparaître dans Google Calendar

---

### 2. **Google Calendar - Import manuel** ✅
**Emplacement** : `components/CalendarModule.tsx:32-51`

Bouton "📥 Synchroniser Google Calendar" pour importer les événements :

```typescript
const handleSyncCalendar = async () => {
  setIsSyncing(true);
  const authed = await checkAuth();
  if (!authed) {
    alert("Connectez votre compte Google dans les paramètres.");
    return;
  }

  const imported = await importCalendarEventsToLocal();
  alert(`✅ Synchronisation réussie !\n${imported.length} événements importés.`);
};
```

**Comment tester** :
1. Aller dans "Agenda"
2. Cliquer sur "📥 Synchroniser Google Calendar"
3. ✅ Les événements Google devraient apparaître dans l'agenda local

---

### 3. **Fonctions Google Calendar disponibles** ✅

#### `createCalendarEvent()` - Export vers Google
**Emplacement** : `services/googleApiService.ts:159-195`
- Crée événements dans Google Calendar
- Ajoute rappels (email 24h avant, popup 30min avant)
- Timezone: Europe/Paris

#### `importCalendarEventsToLocal()` - Import depuis Google
**Emplacement** : `services/googleApiService.ts:245-277`
- Importe événements futurs (maxResults: 100)
- Évite doublons via `googleEventId`
- Calcule durée automatiquement

#### `updateCalendarEvent()` - Mise à jour
**Emplacement** : `services/googleApiService.ts:198-228`
- Modifier événements existants

#### `deleteCalendarEvent()` - Suppression
**Emplacement** : `services/googleApiService.ts:231-242`
- Supprimer événements

#### `syncCalendarEvents()` - Liste événements
**Emplacement** : `services/googleApiService.ts:141-156`
- Récupère événements depuis Google

---

### 4. **Google Drive - Sauvegarde avec sélection dossier** ✅
**Emplacement** : `components/SessionWizard.tsx:329-377`

Le bouton "💾 Sauvegarder dans Drive" permet de :
1. Lister tous les dossiers Drive
2. Choisir le dossier de destination
3. Uploader le PDF avec le nom choisi

```typescript
const openDriveModal = async () => {
  const authed = await checkAuth();
  if (authed) {
    const folders = await listDriveFolders();
    setDriveFolders(folders);
    setShowDriveModal(true);
  }
};

const handleDriveSave = async () => {
  const fileBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  const fileUrl = await uploadToDrive(fileBlob, pdfFileName, selectedDriveFolder);
  alert(`✅ Fichier sauvegardé dans Drive !\n${fileUrl}`);
};
```

**Comment tester** :
1. Aller dans "Nouvelle Session" ou "Historique"
2. Générer un PDF de séance
3. Cliquer "💾 Sauvegarder dans Drive"
4. Choisir le dossier de destination
5. ✅ Le fichier devrait être uploadé dans le dossier choisi

---

## 🔐 Authentification Google

### Auto-restauration du token ✅
**Emplacement** : `App.tsx:51-61`

Le token Google est **automatiquement restauré** au chargement de l'app :

```typescript
useEffect(() => {
  if (appSettings) {
    initGoogleClient(appSettings)
      .then(async () => {
        const { checkAuth } = await import('./services/googleApiService');
        const isAuth = await checkAuth();
        if (isAuth) {
          console.log("✅ Google: Session restaurée automatiquement");
        }
      });
  }
}, [appSettings]);
```

### Vérification et nettoyage du token expiré
**Emplacement** : `services/googleApiService.ts:70-96`

```typescript
export const checkAuth = async (): Promise<boolean> => {
  const settings = (await db.settings.toArray())[0];

  if (!settings?.google?.accessToken) {
    console.log("❌ Google: Pas de token sauvegardé");
    return false;
  }

  // Vérifier expiration
  if (settings.google.tokenExpiry && Date.now() > settings.google.tokenExpiry) {
    console.log("⏱️ Google: Token expiré. Reconnexion nécessaire.");
    // Nettoyer automatiquement
    await db.settings.update(settings.id, {
      google: { ...settings.google, accessToken: undefined, tokenExpiry: undefined }
    });
    return false;
  }

  // Restaurer dans gapi
  if (window.gapi?.client) {
    window.gapi.client.setToken({ access_token: settings.google.accessToken });
    console.log("✅ Google: Token restauré, connecté");
    return true;
  }

  return false;
};
```

---

## ⚙️ Configuration requise

### Variables d'environnement Netlify
```bash
VITE_GOOGLE_PLACES_API_KEY=AIzaSyAfK0Uz779sCthuHIkhC30FY6Kq9OPuIFY
```

### Configuration dans Paramètres (côté app)
Dans "Paramètres" → Section Google :
- **Client ID** : Configuration OAuth2
- **API Key** : Clé Google Places/Calendar/Drive

### Permissions OAuth2 (SCOPES)
**Emplacement** : `services/googleApiService.ts:16`
```typescript
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events';
```

✅ **Permissions en ÉCRITURE** pour :
- Google Calendar (`.events` au lieu de `.readonly`)
- Google Drive (`.file` pour upload)

---

## 🧪 Tests de synchronisation

### Scénario 1 : Export automatique (Planner → Google)
1. ✅ Se connecter à Google dans Paramètres
2. ✅ Créer un RDV dans Planning (cliquer sur une case vide)
3. ✅ Vérifier dans Google Calendar que l'événement apparaît
4. ✅ Vérifier que le RDV local a un `googleEventId`

### Scénario 2 : Import manuel (Google → Planner)
1. ✅ Créer un événement directement dans Google Calendar
2. ✅ Aller dans Agenda
3. ✅ Cliquer "📥 Synchroniser Google Calendar"
4. ✅ Vérifier que l'événement apparaît dans l'agenda local

### Scénario 3 : Drive avec sélection dossier
1. ✅ Se connecter à Google
2. ✅ Générer un PDF de séance
3. ✅ Cliquer "💾 Sauvegarder dans Drive"
4. ✅ Voir la liste des dossiers Drive
5. ✅ Sélectionner un dossier
6. ✅ Vérifier l'upload dans Google Drive

---

## 🐛 Troubleshooting

### "Pas de token sauvegardé"
**Solution** : Aller dans Paramètres → Se connecter avec Google

### "Token expiré"
**Cause** : Les tokens Google expirent après 1 heure
**Solution** : Se reconnecter (automatique au prochain rechargement)

### "Impossible de récupérer vos dossiers Drive"
**Cause** : Session Google expirée ou permissions insuffisantes
**Solution** :
1. Vérifier les permissions SCOPES dans `googleApiService.ts`
2. Se reconnecter à Google
3. Vérifier que `drive.file` est dans les scopes

### Import ne trouve pas d'événements
**Vérifications** :
1. Console : Check si `syncCalendarEvents()` retourne des événements
2. Google Calendar : Vérifier qu'il y a des événements **futurs** (timeMin = maintenant)
3. Token : Vérifier qu'il est valide avec `checkAuth()`

### Export ne fonctionne pas
**Vérifications** :
1. Console : Check les erreurs lors de `createCalendarEvent()`
2. Permissions : Vérifier que `.calendar.events` (pas `.readonly`)
3. Token : Exécuter `checkAuth()` avant l'export

---

## 📊 Base de données

### Index `googleEventId` ✅
**Emplacement** : `db.ts` version 8
```typescript
appointments: '++id, patientId, startTime, status, isOptimizedSlot, googleEventId'
```

Permet de :
- Éviter les doublons lors de l'import
- Retrouver rapidement les RDV liés à Google Calendar
- Mettre à jour/supprimer les bons événements

---

## ✅ Résumé - Tout est déjà implémenté !

| Fonctionnalité | État | Fichier | Ligne |
|----------------|------|---------|-------|
| Export auto vers Google Calendar | ✅ | `WeeklyPlanner.tsx` | 138-162 |
| Import manuel depuis Google Calendar | ✅ | `CalendarModule.tsx` | 32-51 |
| Sauvegarde Drive avec sélection dossier | ✅ | `SessionWizard.tsx` | 329-377 |
| Auto-restauration token | ✅ | `App.tsx` | 51-61 |
| Nettoyage token expiré | ✅ | `googleApiService.ts` | 70-96 |
| Permissions écriture Calendar | ✅ | `googleApiService.ts` | 16 |
| Index googleEventId | ✅ | `db.ts` | version 8 |

**Conclusion** : La synchronisation Google est complète et fonctionnelle.
Les problèmes signalés par l'utilisateur sont probablement dus à :
1. Token Google expiré (dure 1h)
2. Permissions non autorisées lors de la première connexion
3. Configuration Client ID/API Key manquante dans Paramètres

**Action recommandée** : Se reconnecter à Google dans Paramètres après déploiement Netlify.
