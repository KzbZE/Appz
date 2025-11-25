import { Appointment, Patient, ApptStatus } from '../types';
import { db } from '../db';

/**
 * Service IA Coach - Optimisation intelligente de l'agenda
 * Regroupement géographique, détection créneaux morts, prédiction revenus
 */

export interface GeoCluster {
  zone: string;
  centerLat: number;
  centerLng: number;
  radius: number; // km
  patients: Patient[];
  appointmentsThisWeek: number;
  potentialRevenue: number;
  travelTimeEstimate: number; // minutes
}

export interface DeadSlot {
  date: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  reason: string;
  suggestions: string[];
}

export interface RevenuePredict {
  month: string;
  predictedRevenue: number;
  confidence: number; // 0-100%
  basedOnHistory: number; // Nombre de mois analysés
  factors: {
    averageSessionsPerWeek: number;
    averagePricePerSession: number;
    seasonalityFactor: number;
    trendFactor: number;
  };
}

export interface OptimizationRecommendation {
  id: string;
  type: 'GEO_GROUPING' | 'DEAD_SLOT' | 'PRICE_OPTIMIZATION' | 'TIME_BLOCKING' | 'PATIENT_RETENTION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact: string;
  estimatedGain: number; // En euros ou minutes
  actionable: boolean;
  actions: string[];
  createdAt: string;
}

class AICoachService {
  /**
   * Analyser et regrouper les patients par zone géographique
   */
  static async analyzeGeographicClusters(): Promise<GeoCluster[]> {
    try {
      const patients = await db.patients.toArray();
      const appointments = await db.appointments
        .filter(a => a.status !== ApptStatus.CANCELLED && a.type !== 'CABINET')
        .toArray();

      // Filtrer les patients avec coordonnées GPS
      const geoPatients = patients.filter(p => p.lat && p.lng);

      if (geoPatients.length === 0) {
        console.log('⚠️ Aucun patient avec coordonnées GPS');
        return [];
      }

      // Clustering simple par K-means (3 zones principales)
      const clusters = this.kMeansClustering(geoPatients, 3);

      // Enrichir avec données de RDV
      const enrichedClusters: GeoCluster[] = clusters.map(cluster => {
        const patientIds = cluster.patients.map(p => p.id);
        const clusterAppointments = appointments.filter(a =>
          patientIds.includes(a.patientId)
        );

        const thisWeek = clusterAppointments.filter(a => {
          const apptDate = new Date(a.startTime);
          const now = new Date();
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return apptDate >= weekStart && apptDate <= weekEnd;
        });

        const potentialRevenue = cluster.patients.length * 80; // Prix moyen 80€

        return {
          ...cluster,
          appointmentsThisWeek: thisWeek.length,
          potentialRevenue,
          travelTimeEstimate: this.estimateTravelTime(cluster)
        };
      });

      console.log(`✅ ${enrichedClusters.length} zones géographiques identifiées`);
      return enrichedClusters.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
    } catch (error) {
      console.error('❌ Erreur analyse géographique:', error);
      return [];
    }
  }

  /**
   * Détecter les créneaux morts / temps improductifs
   */
  static async detectDeadSlots(startDate: Date, endDate: Date): Promise<DeadSlot[]> {
    try {
      const appointments = await db.appointments
        .filter(a =>
          new Date(a.startTime) >= startDate &&
          new Date(a.startTime) <= endDate &&
          a.status !== ApptStatus.CANCELLED
        )
        .toArray();

      // Trier par date
      appointments.sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      const deadSlots: DeadSlot[] = [];

      // Analyser les gaps entre RDV
      for (let i = 0; i < appointments.length - 1; i++) {
        const current = appointments[i];
        const next = appointments[i + 1];

        const currentEnd = new Date(current.startTime);
        currentEnd.setMinutes(currentEnd.getMinutes() + current.durationMin + (current.travelDurationMin || 0));

        const nextStart = new Date(next.startTime);
        const gapMin = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);

        // Gap de plus de 2 heures = créneau mort
        if (gapMin > 120) {
          const suggestions = [];

          // Suggérer de remplir avec patient de la zone
          if (current.type !== 'CABINET' && next.type !== 'CABINET') {
            suggestions.push('Proposer un RDV à un patient de la zone entre les deux déplacements');
          }

          // Suggérer de déplacer un RDV
          if (gapMin > 180) {
            suggestions.push('Envisager de déplacer un des rendez-vous pour réduire le temps mort');
          }

          // Suggérer tâches administratives
          suggestions.push('Utiliser ce temps pour tâches administratives ou repos');

          deadSlots.push({
            date: current.startTime.split('T')[0],
            startTime: currentEnd.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            endTime: nextStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            durationMin: gapMin,
            reason: `Gap de ${Math.round(gapMin / 60)}h entre deux rendez-vous`,
            suggestions
          });
        }
      }

      console.log(`✅ ${deadSlots.length} créneaux morts détectés`);
      return deadSlots;
    } catch (error) {
      console.error('❌ Erreur détection créneaux morts:', error);
      return [];
    }
  }

  /**
   * Prédire les revenus du mois
   */
  static async predictMonthlyRevenue(targetMonth: Date): Promise<RevenuePredict> {
    try {
      const sessions = await db.sessions.toArray();
      const invoices = await db.invoices.toArray();

      // Analyser les 6 derniers mois
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentSessions = sessions.filter(s =>
        new Date(s.date) >= sixMonthsAgo
      );

      const recentInvoices = invoices.filter(i =>
        new Date(i.createdAt) >= sixMonthsAgo
      );

      // Calculer moyennes
      const weeksAnalyzed = Math.ceil(recentSessions.length / 7);
      const averageSessionsPerWeek = recentSessions.length / (weeksAnalyzed || 1);

      const totalRevenue = recentInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const averagePricePerSession = totalRevenue / (recentSessions.length || 1);

      // Facteur de saisonnalité (simple)
      const monthIndex = targetMonth.getMonth();
      const seasonalityFactors = [
        0.85, 0.90, 1.00, 1.05, 1.10, 1.05, // Jan-Jun
        0.95, 0.85, 1.10, 1.15, 1.10, 0.90  // Jul-Dec
      ];
      const seasonalityFactor = seasonalityFactors[monthIndex];

      // Facteur de tendance (croissance/décroissance)
      const recentMonthRevenue = recentInvoices
        .filter(i => {
          const invDate = new Date(i.createdAt);
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          return invDate >= lastMonth;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      const olderMonthRevenue = recentInvoices
        .filter(i => {
          const invDate = new Date(i.createdAt);
          const twoMonthsAgo = new Date();
          twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return invDate >= twoMonthsAgo && invDate < oneMonthAgo;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      const trendFactor = olderMonthRevenue > 0
        ? recentMonthRevenue / olderMonthRevenue
        : 1.0;

      // Prédiction
      const predictedWeeksInMonth = 4.33;
      const basePrediction = averageSessionsPerWeek * predictedWeeksInMonth * averagePricePerSession;
      const predictedRevenue = basePrediction * seasonalityFactor * trendFactor;

      // Confiance basée sur l'historique
      const confidence = Math.min(95, (weeksAnalyzed / 26) * 100); // Max 95% si 6 mois de données

      return {
        month: targetMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        predictedRevenue: Math.round(predictedRevenue),
        confidence: Math.round(confidence),
        basedOnHistory: Math.floor(weeksAnalyzed / 4.33),
        factors: {
          averageSessionsPerWeek: Math.round(averageSessionsPerWeek * 10) / 10,
          averagePricePerSession: Math.round(averagePricePerSession),
          seasonalityFactor: Math.round(seasonalityFactor * 100) / 100,
          trendFactor: Math.round(trendFactor * 100) / 100
        }
      };
    } catch (error) {
      console.error('❌ Erreur prédiction revenus:', error);
      return {
        month: targetMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        predictedRevenue: 0,
        confidence: 0,
        basedOnHistory: 0,
        factors: {
          averageSessionsPerWeek: 0,
          averagePricePerSession: 0,
          seasonalityFactor: 1,
          trendFactor: 1
        }
      };
    }
  }

  /**
   * Générer des recommandations d'optimisation
   */
  static async generateRecommendations(): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = [];

      // 1. Analyser clusters géographiques
      const clusters = await this.analyzeGeographicClusters();
      if (clusters.length > 0) {
        const topCluster = clusters[0];
        if (topCluster.appointmentsThisWeek < topCluster.patients.length * 0.5) {
          recommendations.push({
            id: 'geo_cluster_low_fill',
            type: 'GEO_GROUPING',
            priority: 'HIGH',
            title: `Zone ${topCluster.zone} sous-utilisée`,
            description: `Vous avez ${topCluster.patients.length} patients dans la zone ${topCluster.zone} mais seulement ${topCluster.appointmentsThisWeek} RDV cette semaine.`,
            impact: 'Réduction temps de trajet de 30% en groupant les RDV',
            estimatedGain: Math.round(topCluster.travelTimeEstimate * 0.3),
            actionable: true,
            actions: [
              'Proposer des créneaux groupés aux patients de cette zone',
              'Envoyer un email de disponibilité aux patients de la zone',
              `Bloquer une journée dédiée à la zone ${topCluster.zone}`
            ],
            createdAt: new Date().toISOString()
          });
        }
      }

      // 2. Détecter créneaux morts cette semaine
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const deadSlots = await this.detectDeadSlots(now, weekEnd);

      if (deadSlots.length > 0) {
        const totalWastedTime = deadSlots.reduce((sum, slot) => sum + slot.durationMin, 0);
        recommendations.push({
          id: 'dead_slots_detected',
          type: 'DEAD_SLOT',
          priority: totalWastedTime > 240 ? 'CRITICAL' : 'MEDIUM',
          title: `${Math.round(totalWastedTime / 60)}h de créneaux morts cette semaine`,
          description: `${deadSlots.length} gaps improductifs détectés dans votre planning.`,
          impact: 'Optimisation planning = +2-3 RDV supplémentaires',
          estimatedGain: totalWastedTime,
          actionable: true,
          actions: [
            'Revoir le planning pour réduire les gaps',
            'Proposer des créneaux flash aux patients disponibles',
            'Utiliser ces temps pour tâches administratives'
          ],
          createdAt: new Date().toISOString()
        });
      }

      // 3. Analyser taux de remplissage
      const appointments = await db.appointments.toArray();
      const thisWeekAppointments = appointments.filter(a => {
        const apptDate = new Date(a.startTime);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return apptDate >= weekStart && apptDate <= weekEnd && a.status !== ApptStatus.CANCELLED;
      });

      const workingHoursPerWeek = 35; // 7h/jour * 5 jours
      const bookedHours = thisWeekAppointments.reduce((sum, a) => sum + a.durationMin / 60, 0);
      const fillRate = (bookedHours / workingHoursPerWeek) * 100;

      if (fillRate < 70) {
        recommendations.push({
          id: 'low_fill_rate',
          type: 'TIME_BLOCKING',
          priority: 'HIGH',
          title: `Taux de remplissage faible: ${Math.round(fillRate)}%`,
          description: `Seulement ${Math.round(bookedHours)}h réservées sur ${workingHoursPerWeek}h disponibles.`,
          impact: `Potentiel de ${Math.round((workingHoursPerWeek - bookedHours) * 80)}€ de CA supplémentaire`,
          estimatedGain: Math.round((workingHoursPerWeek - bookedHours) * 80),
          actionable: true,
          actions: [
            'Activer les notifications de créneaux disponibles',
            'Proposer une promotion pour remplir les créneaux',
            'Contacter les patients inactifs depuis plus de 30 jours'
          ],
          createdAt: new Date().toISOString()
        });
      }

      console.log(`✅ ${recommendations.length} recommandations générées`);
      return recommendations.sort((a, b) => {
        const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('❌ Erreur génération recommandations:', error);
      return [];
    }
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Clustering K-means simple
   */
  private static kMeansClustering(patients: Patient[], k: number): GeoCluster[] {
    // Initialisation avec k patients aléatoires comme centres
    const centers = patients.slice(0, k).map(p => ({
      lat: p.lat!,
      lng: p.lng!
    }));

    let clusters: GeoCluster[] = [];
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;

    while (changed && iterations < maxIterations) {
      // Assigner chaque patient au cluster le plus proche
      clusters = centers.map((center, i) => ({
        zone: `Zone ${String.fromCharCode(65 + i)}`,
        centerLat: center.lat,
        centerLng: center.lng,
        radius: 0,
        patients: [],
        appointmentsThisWeek: 0,
        potentialRevenue: 0,
        travelTimeEstimate: 0
      }));

      patients.forEach(patient => {
        let minDist = Infinity;
        let closestCluster = 0;

        centers.forEach((center, i) => {
          const dist = this.haversineDistance(
            patient.lat!,
            patient.lng!,
            center.lat,
            center.lng
          );
          if (dist < minDist) {
            minDist = dist;
            closestCluster = i;
          }
        });

        clusters[closestCluster].patients.push(patient);
      });

      // Recalculer les centres
      changed = false;
      clusters.forEach((cluster, i) => {
        if (cluster.patients.length > 0) {
          const avgLat = cluster.patients.reduce((sum, p) => sum + p.lat!, 0) / cluster.patients.length;
          const avgLng = cluster.patients.reduce((sum, p) => sum + p.lng!, 0) / cluster.patients.length;

          if (Math.abs(centers[i].lat - avgLat) > 0.001 || Math.abs(centers[i].lng - avgLng) > 0.001) {
            centers[i] = { lat: avgLat, lng: avgLng };
            changed = true;
          }

          // Calculer rayon (distance max au centre)
          cluster.radius = Math.max(
            ...cluster.patients.map(p =>
              this.haversineDistance(p.lat!, p.lng!, avgLat, avgLng)
            )
          );
        }
      });

      iterations++;
    }

    return clusters.filter(c => c.patients.length > 0);
  }

  /**
   * Distance Haversine entre deux points GPS
   */
  private static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
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
   * Estimer temps de trajet moyen dans un cluster
   */
  private static estimateTravelTime(cluster: GeoCluster): number {
    if (cluster.patients.length <= 1) return 0;

    // Temps moyen = rayon * 2 (aller-retour) * 60min/km / vitesse moyenne (40 km/h)
    return Math.round((cluster.radius * 2 * 60) / 40);
  }
}

export default AICoachService;
