# 🚀 Guide d'Intégration - Nouvelles Fonctionnalités

## ✅ Ce qui est fait :

### 1. Types & Base de données
- ✅ Types `AppointmentRequest`, `Notification` ajoutés
- ✅ Enum `AppointmentRequestStatus`
- ✅ Patient étendu avec `lat`, `lng`, `city`, `postalCode`
- ✅ DB version 7 avec tables `appointmentRequests` et `notifications`

### 2. Services
- ✅ `notificationService.ts` - Email (Resend) + SMS (Twilio)
- ✅ `optimizationService.ts` - Optimisation tournées avec calcul distance
- ✅ Fonctions prêtes : `sendEmail()`, `sendSMS()`, `suggestOptimizedSlots()`, `getAllAvailableSlots()`

### 3. Composants
- ✅ `AddressAutocomplete.tsx` - Autocomplétion Google Places
- ✅ `AppointmentRequestManager.tsx` - Gestion demandes RDV (dashboard)

---

## 📋 Intégrations à faire :

### 1. Autocomplétion d'adresses dans PatientList
**Fichier**: `/home/user/Appz/components/PatientList.tsx`

**Localiser** le champ d'adresse dans le formulaire de création/édition de patient.

**Remplacer** :
```tsx
<input
  type="text"
  value={editingPatient.address}
  onChange={(e) => setEditingPatient({...editingPatient, address: e.target.value})}
/>
```

**Par** :
```tsx
import AddressAutocomplete from './AddressAutocomplete';

<AddressAutocomplete
  value={editingPatient.address}
  onChange={(address) => setEditingPatient({...editingPatient, address})}
  onPlaceSelected={(place) => setEditingPatient({
    ...editingPatient,
    address: place.address,
    city: place.city,
    postalCode: place.postalCode,
    lat: place.lat,
    lng: place.lng
  })}
  placeholder="Entrez l'adresse complète..."
  className="w-full p-3 border border-gray-300 rounded-lg"
/>
```

---

### 2. Afficher AppointmentRequestManager dans Dashboard
**Fichier**: `/home/user/Appz/components/Dashboard.tsx` (ou équivalent)

**Ajouter** en haut du dashboard :
```tsx
import AppointmentRequestManager from './AppointmentRequestManager';

// Dans le render
<div className="mb-6">
  <AppointmentRequestManager />
</div>
```

---

### 3. Créneaux optimisés dans Calendar/Appointment
**Fichier**: Composant de sélection de créneaux (Calendar, AppointmentModal, etc.)

**Importer** :
```tsx
import { getAllAvailableSlots } from '../services/optimizationService';
import { useState, useEffect } from 'react';
```

**Ajouter** :
```tsx
const [optimizedSlots, setOptimizedSlots] = useState([]);
const [standardSlots, setStandardSlots] = useState([]);

useEffect(() => {
  if (selectedPatient?.lat && selectedPatient?.lng) {
    getAllAvailableSlots(
      selectedPatient.lat,
      selectedPatient.lng,
      60 // durée en minutes
    ).then(({ optimized, standard }) => {
      setOptimizedSlots(optimized);
      setStandardSlots(standard);
    });
  }
}, [selectedPatient]);
```

**Afficher** :
```tsx
{optimizedSlots.length > 0 && (
  <div className="mb-4">
    <h4 className="font-bold text-purple-700 mb-2">💡 Créneaux Recommandés</h4>
    <div className="grid grid-cols-3 gap-2">
      {optimizedSlots.slice(0, 6).map((slot, i) => (
        <button
          key={i}
          onClick={() => selectTime(slot.startTime)}
          className="p-2 bg-purple-100 border-2 border-purple-300 rounded-lg hover:bg-purple-200"
        >
          <p className="text-sm font-bold">
            {new Date(slot.startTime).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short'
            })}
          </p>
          <p className="text-xs text-purple-700">{slot.reason}</p>
          <span className="text-xs bg-purple-200 px-2 py-0.5 rounded">
            Score: {slot.score}
          </span>
        </button>
      ))}
    </div>
  </div>
)}

<h4 className="font-bold text-gray-700 mb-2">📅 Tous les créneaux</h4>
{/* Afficher standardSlots */}
```

---

## ⚙️ Configuration requise :

### 1. Clé API Google Places
**Où l'obtenir** : https://console.cloud.google.com/apis/credentials

**Fichier** : `/home/user/Appz/components/AddressAutocomplete.tsx`

**Remplacer** :
```tsx
const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';
```

**Par** :
```tsx
const GOOGLE_PLACES_API_KEY = 'VOTRE_CLE_API_GOOGLE';
```

**APIs à activer** :
- Places API
- Maps JavaScript API
- Geocoding API (optionnel)

---

### 2. Email Resend
**Fichier** : `/home/user/Appz/services/notificationService.ts`

✅ Déjà configuré avec votre clé : `re_jGd97qqL_Mkdb5bMqppBthgYaXxyZE1AN`

**À modifier** :
```tsx
from: 'TheraFlow <onboarding@resend.dev>', // Remplacer par votre domaine vérifié
```

**Vérifier un domaine** : https://resend.com/domains

---

### 3. SMS Twilio
**Fichier** : `/home/user/Appz/services/notificationService.ts`

✅ Account SID et Token déjà configurés

**À ajouter** - Votre numéro Twilio :
```tsx
const TWILIO_PHONE_NUMBER = '+33XXXXXXXXX'; // Votre numéro Twilio
```

**Obtenir un numéro** : https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

---

### 4. Praticien Email/Phone dans Settings
**Fichier** : `/home/user/Appz/db.ts` (fonction `populate()`)

**Ajouter** dans AppSettings :
```tsx
await this.settings.add({
    // ... existing fields
    practitioner: {
      name: 'Martin Durand',
      email: 'votre@email.com',
      phone: '+33612345678'
    }
});
```

**Mettre à jour le type** : `/home/user/Appz/types.ts`
```tsx
export interface AppSettings {
  // ... existing fields
  practitioner?: {
    name: string;
    email: string;
    phone: string;
  };
}
```

---

## 🎯 Workflow complet :

### Patient fait une demande :
1. Patient remplit formulaire (nom, email, téléphone, créneau souhaité)
2. Système crée `AppointmentRequest` avec status `PENDING`
3. **Email + SMS envoyé au praticien**
4. Demande apparaît dans Dashboard

### Praticien répond :
**Option A - Accepter** :
- Crée RDV confirmé
- **Email + SMS au patient** : "RDV confirmé"

**Option B - Proposer autre créneau** :
- Système affiche créneaux optimisés (proche d'autres RDV)
- Praticien sélectionne ou choisit manuellement
- Update status → `PRACTITIONER_PROPOSED`
- **Email + SMS au patient** : "Nouveau créneau proposé"

**Option C - Refuser** :
- Status → `REJECTED`
- **Email + SMS au patient** : "Demande refusée"

### Patient répond à la proposition :
- Patient accepte → RDV confirmé
- Patient propose autre créneau → Status `PATIENT_PROPOSED`, **Email + SMS au praticien**

---

## 📱 Test rapide :

1. **Tester autocomplétion** :
   - Créer/éditer un patient
   - Taper une adresse → suggestions Google

2. **Tester optimisation** :
   - Créer 2-3 patients avec adresses proches
   - Créer RDV pour l'un → voir créneaux optimisés suggérés

3. **Tester demandes RDV** :
   - Créer une demande manuellement dans la DB
   - Vérifier apparition dans Dashboard
   - Tester acceptation/proposition/refus

---

## 🐛 Debug :

**Voir les notifications envoyées** :
```tsx
const notifications = useLiveQuery(() => db.notifications.toArray());
console.log('Notifications:', notifications);
```

**Voir les demandes** :
```tsx
const requests = useLiveQuery(() => db.appointmentRequests.toArray());
console.log('Requests:', requests);
```

**Tester calcul distance** :
```tsx
import { calculateDistance } from '../services/optimizationService';
const dist = calculateDistance(48.8566, 2.3522, 48.8606, 2.3376); // Paris
console.log('Distance:', dist, 'km'); // ~2.8 km
```

---

## 🔐 Sécurité :

⚠️ **IMPORTANT** : En production, utiliser des variables d'environnement :

**Créer** `.env` :
```env
VITE_RESEND_API_KEY=re_jGd97qqL_Mkdb5bMqppBthgYaXxyZE1AN
VITE_TWILIO_ACCOUNT_SID=AC823b69ed164a3b5ae50802b730a58f94
VITE_TWILIO_AUTH_TOKEN=b9f360926e91f3a13c69adb108f888c7
VITE_GOOGLE_PLACES_API_KEY=VOTRE_CLE
```

**Utiliser** :
```tsx
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
```

**Ajouter** `.env` à `.gitignore` !

---

## ✨ Fonctionnalités bonus à implémenter :

- [ ] Page publique pour patients (faire demande sans login)
- [ ] Historique complet des échanges dans un modal
- [ ] Badge notification sur dashboard quand nouvelle demande
- [ ] Export des statistiques d'optimisation
- [ ] Carte Google Maps montrant les tournées optimisées
- [ ] Notifications push navigateur
- [ ] Rappels automatiques J-1 et H-2

Bon code ! 🚀
