# Application Mobile Native - TheraFlowDB

Guide complet pour développer l'application mobile native avec React Native ou Flutter.

## 🎯 Objectifs de l'App Mobile

- **Performance native** supérieure à la PWA
- **Accès caméra/micro** natif pour photos et visioconférence
- **Notifications push** natives (iOS & Android)
- **Signature stylet** optimisée pour patients
- **Mode hors-ligne** avancé avec synchronisation
- **Géolocalisation** précise pour tournées
- **Intégration calendrier** natif (iOS Calendar, Google Calendar)

---

## 🚀 Option 1: React Native (Recommandé)

### Avantages
- Partage de code avec le web (70-80%)
- Même langage (TypeScript/React)
- Écosystème riche
- Hot Reload

### Installation

```bash
# Installer React Native CLI
npm install -g react-native-cli

# Créer le projet
npx react-native init TheraFlowMobile --template react-native-template-typescript

# Entrer dans le projet
cd TheraFlowMobile

# Installer les dépendances essentielles
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-vector-icons
npm install react-native-gesture-handler react-native-reanimated
npm install @react-native-camera-roll/camera-roll
npm install react-native-signature-canvas
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install react-native-geolocation-service
npm install @react-native-community/datetimepicker
npm install axios
```

### Structure du Projet

```
TheraFlowMobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   ├── PatientListScreen.tsx
│   │   ├── SessionScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── PatientCard.tsx
│   │   ├── AppointmentCard.tsx
│   │   ├── SessionForm.tsx
│   │   └── Signature.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── storage.ts
│   │   ├── sync.ts
│   │   ├── notifications.ts
│   │   └── geolocation.ts
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── store/
│   │   └── index.ts (Redux/Zustand)
│   └── types/
│       └── index.ts
├── android/
├── ios/
└── App.tsx
```

### Configuration Firebase Push Notifications

#### 1. Créer projet Firebase
1. Aller sur https://console.firebase.google.com/
2. Créer un nouveau projet
3. Ajouter les apps iOS et Android

#### 2. Configuration Android

```bash
# Télécharger google-services.json et placer dans android/app/
```

**android/build.gradle:**
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

**android/app/build.gradle:**
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:31.0.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

#### 3. Configuration iOS

```bash
# Installer pods
cd ios && pod install
```

Télécharger **GoogleService-Info.plist** et ajouter dans Xcode.

### Code de Base Push Notifications

**src/services/notifications.ts:**
```typescript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  }

  static async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      await AsyncStorage.setItem('fcm_token', token);
      return token;
    } catch (error) {
      console.error('Erreur FCM token:', error);
      return null;
    }
  }

  static setupForegroundHandler() {
    messaging().onMessage(async (remoteMessage) => {
      console.log('Notification reçue:', remoteMessage);
      // Afficher notification locale
    });
  }

  static setupBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification:', remoteMessage);
    });
  }
}
```

### Géolocalisation

**src/services/geolocation.ts:**
```typescript
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

export class GeolocationService {
  static async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  static async getCurrentPosition(): Promise<{
    latitude: number;
    longitude: number;
  }> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }
}
```

### Signature Numérique

**src/components/Signature.tsx:**
```typescript
import React from 'react';
import SignatureCanvas from 'react-native-signature-canvas';

interface SignatureProps {
  onSave: (signature: string) => void;
}

const Signature: React.FC<SignatureProps> = ({ onSave }) => {
  const handleOK = (signature: string) => {
    onSave(signature); // Base64 string
  };

  return (
    <SignatureCanvas
      onOK={handleOK}
      descriptionText="Signez ici"
      clearText="Effacer"
      confirmText="Valider"
      webStyle={`.m-signature-pad {box-shadow: none; border: 1px solid #e8e8e8;} .m-signature-pad--body {border: none;}`}
    />
  );
};

export default Signature;
```

### Synchronisation Hors-ligne

**src/services/sync.ts:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from './api';

interface SyncQueue {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'patient' | 'appointment' | 'session';
  data: any;
  timestamp: number;
}

export class SyncService {
  private static QUEUE_KEY = 'sync_queue';

  static async addToQueue(item: Omit<SyncQueue, 'id' | 'timestamp'>) {
    const queue = await this.getQueue();
    const newItem: SyncQueue = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    queue.push(newItem);
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  static async processQueue() {
    const queue = await this.getQueue();
    const processed: string[] = [];

    for (const item of queue) {
      try {
        switch (item.entity) {
          case 'patient':
            if (item.action === 'CREATE') {
              await API.createPatient(item.data);
            } else if (item.action === 'UPDATE') {
              await API.updatePatient(item.data.id, item.data);
            }
            break;
          // ... autres cas
        }
        processed.push(item.id);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    // Retirer les items traités
    const remaining = queue.filter(item => !processed.includes(item.id));
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(remaining));

    return { processed: processed.length, remaining: remaining.length };
  }

  private static async getQueue(): Promise<SyncQueue[]> {
    const stored = await AsyncStorage.getItem(this.QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}
```

### Build & Déploiement

#### Android

```bash
# Debug build
npm run android

# Release build
cd android
./gradlew assembleRelease

# APK généré dans: android/app/build/outputs/apk/release/app-release.apk
```

#### iOS

```bash
# Ouvrir dans Xcode
open ios/TheraFlowMobile.xcworkspace

# Build depuis Xcode
# Product > Archive > Distribute App > App Store Connect
```

---

## 🎨 Option 2: Flutter

### Avantages
- Performance native excellente
- UI très fluide
- Un seul codebase pour iOS & Android
- Widgets riches

### Installation

```bash
# Installer Flutter
# https://flutter.dev/docs/get-started/install

# Créer projet
flutter create theraflow_mobile
cd theraflow_mobile

# Installer dépendances
flutter pub add http
flutter pub add provider
flutter pub add sqflite
flutter pub add firebase_core
flutter pub add firebase_messaging
flutter pub add geolocator
flutter pub add image_picker
flutter pub add signature
flutter pub add flutter_local_notifications
```

### Structure du Projet Flutter

```
theraflow_mobile/
├── lib/
│   ├── screens/
│   │   ├── login_screen.dart
│   │   ├── dashboard_screen.dart
│   │   ├── calendar_screen.dart
│   │   └── session_screen.dart
│   ├── widgets/
│   │   ├── patient_card.dart
│   │   └── appointment_card.dart
│   ├── services/
│   │   ├── api_service.dart
│   │   ├── storage_service.dart
│   │   └── notification_service.dart
│   ├── models/
│   │   ├── patient.dart
│   │   └── appointment.dart
│   └── main.dart
├── android/
├── ios/
└── pubspec.yaml
```

### Configuration Firebase Flutter

**pubspec.yaml:**
```yaml
dependencies:
  firebase_core: ^2.13.0
  firebase_messaging: ^14.6.0
  flutter_local_notifications: ^14.0.0
```

**lib/services/notification_service.dart:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // Demander permission
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Obtenir token
    String? token = await _messaging.getToken();
    print('FCM Token: $token');

    // Handler foreground
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showLocalNotification(message);
    });
  }

  static Future<void> _showLocalNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'default_channel',
      'Default',
      importance: Importance.high,
      priority: Priority.high,
    );

    const NotificationDetails details =
        NotificationDetails(android: androidDetails);

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      details,
    );
  }
}
```

### Build Flutter

```bash
# Debug
flutter run

# Release Android
flutter build apk --release

# Release iOS
flutter build ios --release
```

---

## 📱 Fonctionnalités Prioritaires Mobile

### 1. Mode Hors-ligne Avancé
- Base de données locale (SQLite/Realm)
- Queue de synchronisation
- Détection automatique de connexion
- Résolution de conflits

### 2. Caméra & Photos
```typescript
// React Native
import { launchCamera } from 'react-native-image-picker';

const takePhoto = async () => {
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: true
  });

  if (result.assets) {
    const photo = result.assets[0];
    // Upload photo.uri
  }
};
```

### 3. Géolocalisation Temps Réel
- Tracking GPS pour tournées
- Calcul temps de trajet
- Optimisation itinéraire
- Alerte trafic

### 4. Signature Électronique
- Canvas haute résolution
- Export PDF avec signature
- Horodatage
- Conformité légale

### 5. Notifications Push
- RDV du jour (matin)
- Rappels 2h avant
- Annulations
- Messages patients
- Paiements reçus

---

## 🔄 Synchronisation Web ↔ Mobile

### Architecture Recommandée

```
[App Web] ←→ [API Backend] ←→ [App Mobile]
                   ↓
            [Base de données]
```

### Backend API (Node.js + Express)

**server/app.js:**
```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Authentification
app.post('/api/auth/login', async (req, res) => {
  // Vérifier credentials
  // Générer JWT
  res.json({ token, user });
});

// Patients
app.get('/api/patients', authMiddleware, async (req, res) => {
  const patients = await db.patients.toArray();
  res.json(patients);
});

app.post('/api/patients', authMiddleware, async (req, res) => {
  const patient = await db.patients.add(req.body);
  res.json(patient);
});

// Synchronisation
app.post('/api/sync', authMiddleware, async (req, res) => {
  const { lastSync, changes } = req.body;

  // Appliquer les changements
  for (const change of changes) {
    await applyChange(change);
  }

  // Retourner changements depuis lastSync
  const updates = await getChangesSince(lastSync);
  res.json({ updates, timestamp: Date.now() });
});

app.listen(3000);
```

---

## 📦 Publication

### Google Play Store

1. Créer compte développeur ($25 one-time)
2. Préparer assets: icône, screenshots, description
3. Générer bundle signé
```bash
cd android
./gradlew bundleRelease
```
4. Upload sur Play Console

### Apple App Store

1. Créer compte développeur Apple ($99/an)
2. Préparer assets et description
3. Build dans Xcode
4. Upload via Xcode ou Transporter
5. Soumettre pour review

---

## 🎯 Recommandations Finales

### Choisir React Native si:
- Équipe familière avec React
- Besoin de partage de code avec web
- Budget limité

### Choisir Flutter si:
- Performance critique
- UI complexe et animations
- Pas de code web à partager

### Points d'Attention
- Tester sur vrais devices (pas uniquement simulateurs)
- Optimiser taille de l'app (<50MB)
- Gérer permissions correctement
- Implémenter analytics (Firebase, Sentry)
- Tester mode hors-ligne extensivement

---

## 📚 Ressources

- [React Native Docs](https://reactnative.dev/)
- [Flutter Docs](https://flutter.dev/)
- [Firebase](https://firebase.google.com/)
- [React Navigation](https://reactnavigation.org/)
- [Expo](https://expo.dev/) (alternative simplifiée à React Native CLI)

---

✅ **Le système web est prêt. L'app mobile peut être développée en parallèle avec synchronisation via API.**
