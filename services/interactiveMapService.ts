import { Patient } from '../types';

/**
 * Service de carte interactive des patients
 * Visualisation géographique, clustering, optimisation tournées
 */

export interface PatientMarker {
  patient: Patient;
  lat: number;
  lng: number;
  color: string; // Couleur par type (human/equine/canine)
  size: number; // Taille par fréquence de visite
  zone: 'A' | 'B' | 'C' | 'UNKNOWN';
}

export interface Zone {
  id: string;
  name: string;
  level: 'A' | 'B' | 'C';
  color: string;
  polygon: { lat: number; lng: number }[];
  pricing: {
    baseRate: number;
    travelFee: number;
  };
  active: boolean;
}

export interface TourOptimization {
  totalDistance: number; // km
  totalDuration: number; // minutes
  stops: {
    patient: Patient;
    order: number;
    arrivalTime: string;
    duration: number; // minutes
    distance: number; // km depuis précédent
  }[];
  startLocation: { lat: number; lng: number; address: string };
  endLocation: { lat: number; lng: number; address: string };
  optimizationScore: number; // 0-100
}

export interface TrafficAlert {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  affectedRoute: string;
  estimatedDelay: number; // minutes
  alternativeRoute?: string;
}

class InteractiveMapService {
  /**
   * Générer les marqueurs patients pour la carte
   */
  static async generatePatientMarkers(patients: Patient[]): Promise<PatientMarker[]> {
    const markers: PatientMarker[] = [];

    // Compter les visites par patient (mock - à remplacer par vraies données)
    const visitCounts: Record<string | number, number> = {};

    for (const patient of patients) {
      if (!patient.lat || !patient.lng) continue;

      const visitCount = visitCounts[patient.id!] || Math.floor(Math.random() * 20) + 1;

      // Couleur par type
      const colorMap = {
        HUMAN: '#10b981', // green
        EQUINE: '#f59e0b', // amber
        CANINE: '#3b82f6'  // blue
      };

      // Taille basée sur fréquence (10-30px)
      const size = Math.min(30, 10 + visitCount * 2);

      // Déterminer la zone
      const zone = this.determineZone(patient.lat, patient.lng);

      markers.push({
        patient,
        lat: patient.lat,
        lng: patient.lng,
        color: colorMap[patient.type] || '#6b7280',
        size,
        zone
      });
    }

    console.log(`✅ ${markers.length} marqueurs générés`);
    return markers;
  }

  /**
   * Clustering des patients par densité géographique
   */
  static clusterMarkers(markers: PatientMarker[], zoomLevel: number): PatientMarker[][] {
    // Clustering simple par grille géographique
    const gridSize = zoomLevel < 10 ? 0.1 : zoomLevel < 13 ? 0.05 : 0.01;
    const clusters: Record<string, PatientMarker[]> = {};

    markers.forEach(marker => {
      const gridLat = Math.floor(marker.lat / gridSize) * gridSize;
      const gridLng = Math.floor(marker.lng / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;

      if (!clusters[key]) {
        clusters[key] = [];
      }
      clusters[key].push(marker);
    });

    return Object.values(clusters);
  }

  /**
   * Optimiser un parcours de tournée
   * Algorithme du plus proche voisin (Nearest Neighbor)
   */
  static optimizeTour(
    patients: Patient[],
    startLocation: { lat: number; lng: number; address: string },
    averageSessionDuration: number = 60
  ): TourOptimization {
    const unvisited = [...patients].filter(p => p.lat && p.lng);
    const tour: typeof unvisited = [];
    let currentLat = startLocation.lat;
    let currentLng = startLocation.lng;
    let totalDistance = 0;
    let currentTime = new Date();

    // Algorithme du plus proche voisin
    while (unvisited.length > 0) {
      let closestIndex = 0;
      let closestDistance = Infinity;

      unvisited.forEach((patient, index) => {
        const dist = this.calculateDistance(
          currentLat,
          currentLng,
          patient.lat!,
          patient.lng!
        );
        if (dist < closestDistance) {
          closestDistance = dist;
          closestIndex = index;
        }
      });

      const closest = unvisited.splice(closestIndex, 1)[0];
      tour.push(closest);
      totalDistance += closestDistance;

      currentLat = closest.lat!;
      currentLng = closest.lng!;
    }

    // Retour au point de départ
    const returnDistance = this.calculateDistance(
      currentLat,
      currentLng,
      startLocation.lat,
      startLocation.lng
    );
    totalDistance += returnDistance;

    // Calculer les horaires d'arrivée
    const stops = tour.map((patient, index) => {
      const distance = index === 0
        ? this.calculateDistance(startLocation.lat, startLocation.lng, patient.lat!, patient.lng!)
        : this.calculateDistance(tour[index - 1].lat!, tour[index - 1].lng!, patient.lat!, patient.lng!);

      const travelTime = (distance / 40) * 60; // 40 km/h moyenne
      currentTime = new Date(currentTime.getTime() + travelTime * 60000);

      const arrivalTime = currentTime.toISOString();
      currentTime = new Date(currentTime.getTime() + averageSessionDuration * 60000);

      return {
        patient,
        order: index + 1,
        arrivalTime,
        duration: averageSessionDuration,
        distance
      };
    });

    const totalDuration = stops.reduce((sum, stop) => sum + stop.duration + (stop.distance / 40 * 60), 0);

    // Score d'optimisation (basé sur distance totale vs distance linéaire)
    const linearDistance = stops.reduce((sum, stop) => sum + stop.distance, 0);
    const optimizationScore = Math.max(0, 100 - ((totalDistance - linearDistance) / linearDistance * 100));

    return {
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration: Math.round(totalDuration),
      stops,
      startLocation,
      endLocation: startLocation,
      optimizationScore: Math.round(optimizationScore)
    };
  }

  /**
   * Obtenir des alertes trafic (Mock - à remplacer par vraie API)
   */
  static async getTrafficAlerts(route: string): Promise<TrafficAlert[]> {
    // Mock - En production, utiliser Google Maps Traffic API ou Waze API
    console.log(`🚗 [TRAFFIC MOCK] Vérification trafic pour: ${route}`);

    // Simulation aléatoire
    const random = Math.random();
    if (random < 0.7) {
      return []; // Pas d'alerte
    } else if (random < 0.9) {
      return [{
        severity: 'MEDIUM',
        message: 'Trafic modéré sur A6',
        affectedRoute: 'A6 direction Paris',
        estimatedDelay: 15,
        alternativeRoute: 'A10 + N104'
      }];
    } else {
      return [{
        severity: 'HIGH',
        message: 'Accident sur périphérique',
        affectedRoute: 'Périphérique Porte de Versailles',
        estimatedDelay: 30,
        alternativeRoute: 'Boulevard périphérique Sud'
      }];
    }
  }

  /**
   * Définir les zones d'intervention
   */
  static defineZones(): Zone[] {
    return [
      {
        id: 'zone_a',
        name: 'Zone A - Centre',
        level: 'A',
        color: '#10b981',
        polygon: [], // Définir les coordonnées du polygone
        pricing: {
          baseRate: 80,
          travelFee: 0
        },
        active: true
      },
      {
        id: 'zone_b',
        name: 'Zone B - Périphérie',
        level: 'B',
        color: '#f59e0b',
        polygon: [],
        pricing: {
          baseRate: 80,
          travelFee: 15
        },
        active: true
      },
      {
        id: 'zone_c',
        name: 'Zone C - Éloignée',
        level: 'C',
        color: '#ef4444',
        polygon: [],
        pricing: {
          baseRate: 80,
          travelFee: 30
        },
        active: true
      }
    ];
  }

  /**
   * Vérifier si un patient est dans une zone autorisée
   */
  static isPatientInAuthorizedZone(patient: Patient, zones: Zone[]): {
    isAuthorized: boolean;
    zone?: Zone;
    message: string;
  } {
    if (!patient.lat || !patient.lng) {
      return {
        isAuthorized: false,
        message: 'Coordonnées GPS manquantes'
      };
    }

    const zone = this.determineZone(patient.lat, patient.lng);
    const zoneConfig = zones.find(z => z.level === zone && z.active);

    if (!zoneConfig) {
      return {
        isAuthorized: false,
        message: `Zone ${zone} non autorisée ou inactive`
      };
    }

    return {
      isAuthorized: true,
      zone: zoneConfig,
      message: `Patient dans ${zoneConfig.name}`
    };
  }

  /**
   * Statistiques par zone
   */
  static async getZoneStatistics(patients: Patient[], appointments: any[]): Promise<{
    zone: string;
    patientCount: number;
    appointmentCount: number;
    avgDistance: number;
    revenue: number;
  }[]> {
    const stats: Record<string, any> = {
      A: { zone: 'A', patientCount: 0, appointmentCount: 0, totalDistance: 0, revenue: 0 },
      B: { zone: 'B', patientCount: 0, appointmentCount: 0, totalDistance: 0, revenue: 0 },
      C: { zone: 'C', patientCount: 0, appointmentCount: 0, totalDistance: 0, revenue: 0 }
    };

    patients.forEach(patient => {
      if (!patient.lat || !patient.lng) return;
      const zone = this.determineZone(patient.lat, patient.lng);
      stats[zone].patientCount++;
    });

    // TODO: Ajouter stats des RDV et revenus

    return Object.values(stats).map(s => ({
      ...s,
      avgDistance: s.patientCount > 0 ? s.totalDistance / s.patientCount : 0
    }));
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Calculer distance entre deux points (Haversine)
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Déterminer la zone d'un point GPS (simple par distance au centre)
   */
  private static determineZone(lat: number, lng: number): 'A' | 'B' | 'C' | 'UNKNOWN' {
    // Centre de référence (Paris par exemple: 48.8566, 2.3522)
    const centerLat = 48.8566;
    const centerLng = 2.3522;

    const distance = this.calculateDistance(lat, lng, centerLat, centerLng);

    if (distance < 10) return 'A';
    if (distance < 30) return 'B';
    return 'C';
  }
}

export default InteractiveMapService;

/**
 * Intégration carte interactive:
 *
 * Recommandations bibliothèques:
 * - Leaflet + react-leaflet (Open Source, gratuit)
 * - Mapbox GL JS (Meilleur design, 50k vues/mois gratuit)
 * - Google Maps API (Payant après quotas)
 *
 * Installation Leaflet:
 * npm install leaflet react-leaflet
 * npm install @types/leaflet -D
 *
 * Exemple React:
 * import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
 *
 * <MapContainer center={[48.8566, 2.3522]} zoom={11}>
 *   <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
 *   {markers.map(m => (
 *     <Marker key={m.patient.id} position={[m.lat, m.lng]}>
 *       <Popup>{m.patient.name}</Popup>
 *     </Marker>
 *   ))}
 * </MapContainer>
 */
