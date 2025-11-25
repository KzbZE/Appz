# 🧪 Tests des Nouvelles Fonctionnalités

## ✅ Checklist Tests Desktop

### 1. Carte Interactive 🗺️
- [ ] Navigation → Clic sur "Carte Interactive"
- [ ] Vérifier affichage des 3 zones (A, B, C)
- [ ] Cliquer sur "Optimiser Tournée du Jour"
- [ ] Vérifier calcul distance et durée
- [ ] Tester affichage/masquage itinéraire

### 2. Téléconsultation 🎥
- [ ] Navigation → Clic sur "Téléconsultation"
- [ ] Sélectionner un patient dans la liste
- [ ] Choisir plateforme (Jitsi/Whereby)
- [ ] Cliquer "Démarrer la session"
- [ ] Vérifier interface vidéo s'affiche
- [ ] Tester contrôles (mute, camera, end call)
- [ ] Tester chat intégré

### 3. Dashboard Bien-être 💚
- [ ] Navigation → Clic sur "Bien-être"
- [ ] Cliquer "Enregistrer métriques du jour"
- [ ] Remplir tous les champs du formulaire
- [ ] Cliquer "Enregistrer"
- [ ] Vérifier affichage score équilibre vie pro/perso
- [ ] Vérifier affichage risque burnout
- [ ] Tester "Rapport Mensuel"

### 4. Assistant IA Planning 🧠
- [ ] Navigation → Clic sur "IA Planning"
- [ ] Vérifier affichage prédiction semaine prochaine
- [ ] Sélectionner un patient
- [ ] Cliquer "Analyser"
- [ ] Vérifier historique patient affiché
- [ ] Vérifier suggestions créneaux
- [ ] Tester bouton "Envoyer suggestion"

## ✅ Checklist Tests Mobile

### Navigation
- [ ] Ouvrir app sur mobile (ou mode responsive)
- [ ] Vérifier bottom bar avec 5 icônes
- [ ] Cliquer sur bouton "Menu" (dernier)
- [ ] Vérifier modal avec grille 3x3 s'ouvre
- [ ] Tester fermeture modal (X en haut)

### Nouvelles Sections
- [ ] Depuis menu, taper "Carte Interactive"
- [ ] Vérifier affichage responsive
- [ ] Tester scroll vertical
- [ ] Depuis menu, taper "Téléconsultation"
- [ ] Vérifier formulaire adapté mobile
- [ ] Depuis menu, taper "Bien-être"
- [ ] Vérifier sliders fonctionnent au toucher
- [ ] Depuis menu, taper "IA Planning"
- [ ] Vérifier cards empilées verticalement

## 🔍 Tests Intégration

### Navigation fluide
- [ ] Passer de Dashboard → Carte Interactive
- [ ] Passer de Carte → Téléconsultation
- [ ] Passer de Téléconsultation → Bien-être
- [ ] Passer de Bien-être → IA Planning
- [ ] Retour au Dashboard
- [ ] Vérifier aucun écran blanc
- [ ] Vérifier aucune erreur console (F12)

### Données persistantes
- [ ] Enregistrer métriques bien-être
- [ ] Rafraîchir page (F5)
- [ ] Retourner Bien-être
- [ ] Vérifier données toujours présentes
- [ ] Analyser un patient (IA Planning)
- [ ] Rafraîchir page
- [ ] Vérifier analyse toujours visible

### Performance
- [ ] Temps chargement initial < 3s
- [ ] Navigation entre sections < 500ms
- [ ] Animations fluides 60fps
- [ ] Pas de freeze/lag

## ❌ Tests Cas d'Erreur

### Carte Interactive
- [ ] Cliquer "Optimiser Tournée" sans RDV aujourd'hui
- [ ] Vérifier message d'erreur clair
- [ ] Pas de crash application

### Téléconsultation
- [ ] Démarrer session sans sélectionner patient
- [ ] Vérifier alerte "Sélectionner patient"
- [ ] Tester enregistrement sans consentement
- [ ] Vérifier popup consentement RGPD

### Bien-être
- [ ] Soumettre formulaire incomplet
- [ ] Vérifier valeurs par défaut
- [ ] Tester sliders aux limites (0 et 10)

### IA Planning
- [ ] Analyser patient sans historique
- [ ] Vérifier message approprié
- [ ] Tester avec base de données vide

## 🎯 Résultats Attendus

### ✅ Succès si:
- Toutes les sections accessibles
- Aucun écran blanc
- Aucune erreur console
- Navigation fluide
- Responsive fonctionne
- Données sauvegardées

### ❌ Échec si:
- Écran blanc au clic
- Erreur console bloquante
- Section non accessible
- Crash application
- Données perdues après refresh

---

**Note:** Ce test peut être effectué par le praticien sans compétences techniques.
**Durée estimée:** 15-20 minutes
**Navigateurs testés:** Chrome, Firefox, Safari, Edge
**Appareils:** Desktop, Tablet, Mobile
