import { db } from '../db';
import { Appointment, Patient } from '../types';

// Clé API Google Maps (à configurer dans les settings)
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // À remplacer

interface OptimizedSlot {
  startTime: string;
  isOptimized: boolean;
  reason: string;
  nearbyAppointment?: {
    patientName: string;
    time: string;
    distance: number; // km
  };
  score: number; // Score d'optimisation (0-100)
}

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 * Retourne la distance en kilomètres
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Trouve les rendez-vous proches d'un point donné pour une journée
 */
export async function findNearbyAppointments(
  targetLat: number,
  targetLng: number,
  targetDate: Date,
  maxDistanceKm: number = 15 // Rayon de recherche
): Promise<Array<{ appointment: Appointment; patient: Patient; distance: number }>> {
  // Récupérer tous les rendez-vous de la journée
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await db.appointments
    .where('startTime')
    .between(startOfDay.toISOString(), endOfDay.toISOString())
    .and(appt => appt.status === 'SCHEDULED' && appt.type !== 'CABINET' && appt.type !== 'BLOCK')
    .toArray();

  const nearby: Array<{ appointment: Appointment; patient: Patient; distance: number }> = [];

  for (const appointment of appointments) {
    const patient = await db.patients.get(appointment.patientId);
    if (!patient || !patient.lat || !patient.lng) continue;

    const distance = calculateDistance(targetLat, targetLng, patient.lat, patient.lng);

    if (distance <= maxDistanceKm) {
      nearby.push({ appointment, patient, distance });
    }
  }

  // Trier par distance
  nearby.sort((a, b) => a.distance - b.distance);

  return nearby;
}

/**
 * Suggère des créneaux optimisés pour un rendez-vous
 * Basé sur la proximité géographique ET le regroupement au cabinet
 */
export async function suggestOptimizedSlots(
  patientLat: number | undefined,
  patientLng: number | undefined,
  durationMin: number,
  preferredDate?: Date,
  excludeSlots: string[] = [], // Créneaux déjà occupés à exclure
  appointmentType?: 'CABINET' | 'HOME' // Type de RDV pour optimiser différemment
): Promise<OptimizedSlot[]> {
  const suggestions: OptimizedSlot[] = [];
  const startDate = preferredDate || new Date();
  const daysToCheck = 7;

  for (let dayOffset = 0; dayOffset < daysToCheck; dayOffset++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);

    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Récupérer TOUS les RDV du jour
    const dayAppointments = await db.appointments
      .where('startTime')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .and(appt => appt.status === 'SCHEDULED')
      .toArray();

    if (dayAppointments.length > 0) {
      // Si c'est un RDV CABINET, chercher d'autres RDV cabinet pour regrouper
      if (appointmentType === 'CABINET') {
        const cabinetAppointments = dayAppointments.filter(a => a.type === 'CABINET');

        for (const cabAppt of cabinetAppointments) {
          const apptTime = new Date(cabAppt.startTime);

          // Suggérer créneaux avant/après les RDV cabinet existants
          const slotBefore = new Date(apptTime);
          slotBefore.setMinutes(slotBefore.getMinutes() - durationMin - 10);

          const slotAfter = new Date(apptTime);
          slotAfter.setMinutes(slotAfter.getMinutes() + cabAppt.durationMin + 10);

          const beforeHour = slotBefore.getHours();
          const afterHour = slotAfter.getHours();

          if (beforeHour >= 8 && beforeHour < 19 && !excludeSlots.includes(slotBefore.toISOString())) {
            const score = 85 + (cabinetAppointments.length * 5); // Bon score pour regroupement cabinet
            suggestions.push({
              startTime: slotBefore.toISOString(),
              isOptimized: true,
              reason: `Regrouper avec autre RDV cabinet (${cabAppt.notes?.split(' - ')[0] || 'Patient'})`,
              score
            });
          }

          if (afterHour >= 8 && afterHour < 19 && !excludeSlots.includes(slotAfter.toISOString())) {
            const score = 85 + (cabinetAppointments.length * 5);
            suggestions.push({
              startTime: slotAfter.toISOString(),
              isOptimized: true,
              reason: `Regrouper avec autre RDV cabinet (${cabAppt.notes?.split(' - ')[0] || 'Patient'})`,
              score
            });
          }
        }
      }

      // Si c'est un RDV à DOMICILE et qu'on a les coordonnées
      if (patientLat && patientLng && appointmentType !== 'CABINET') {
        const nearbyAppointments = await findNearbyAppointments(
          patientLat,
          patientLng,
          checkDate
        );

        if (nearbyAppointments.length > 0) {
          for (const { appointment, patient, distance } of nearbyAppointments) {
            const apptTime = new Date(appointment.startTime);

            const slotBefore = new Date(apptTime);
            slotBefore.setMinutes(slotBefore.getMinutes() - durationMin - 15);

            const slotAfter = new Date(apptTime);
            slotAfter.setMinutes(slotAfter.getMinutes() + appointment.durationMin + 15);

            const beforeHour = slotBefore.getHours();
            const afterHour = slotAfter.getHours();

            if (beforeHour >= 8 && beforeHour < 19 && !excludeSlots.includes(slotBefore.toISOString())) {
              const score = calculateOptimizationScore(distance, nearbyAppointments.length);
              suggestions.push({
                startTime: slotBefore.toISOString(),
                isOptimized: true,
                reason: `Proche de "${patient.name}" (${distance} km)`,
                nearbyAppointment: {
                  patientName: patient.name,
                  time: appointment.startTime,
                  distance
                },
                score
              });
            }

            if (afterHour >= 8 && afterHour < 19 && !excludeSlots.includes(slotAfter.toISOString())) {
              const score = calculateOptimizationScore(distance, nearbyAppointments.length);
              suggestions.push({
                startTime: slotAfter.toISOString(),
                isOptimized: true,
                reason: `Proche de "${patient.name}" (${distance} km)`,
                nearbyAppointment: {
                  patientName: patient.name,
                  time: appointment.startTime,
                  distance
                },
                score
              });
            }
          }
        }
      }
    }
  }

  // Trier par score décroissant
  suggestions.sort((a, b) => b.score - a.score);

  // Retourner les 10 meilleurs créneaux
  return suggestions.slice(0, 10);
}

/**
 * Calcule un score d'optimisation (0-100)
 * Plus la distance est faible et plus il y a de RDV proches, plus le score est élevé
 */
function calculateOptimizationScore(distanceKm: number, nearbyCount: number): number {
  // Score basé sur la distance (100 points si 0km, 0 points si 50km+)
  const distanceScore = Math.max(0, 100 - (distanceKm * 2));

  // Bonus si plusieurs RDV proches le même jour
  const densityBonus = Math.min(30, nearbyCount * 10);

  return Math.min(100, Math.round(distanceScore + densityBonus));
}

/**
 * Génère des créneaux disponibles standards (non optimisés)
 * Pour donner le choix même s'il n'y a pas d'optimisation possible
 */
export function generateStandardSlots(
  startDate: Date,
  daysAhead: number = 14,
  excludeSlots: string[] = []
): OptimizedSlot[] {
  const slots: OptimizedSlot[] = [];
  const workingHours = [9, 10, 11, 14, 15, 16, 17, 18]; // Heures de travail

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);

    // Exclure les dimanches
    if (date.getDay() === 0) continue;

    for (const hour of workingHours) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, 0, 0, 0);

      if (!excludeSlots.includes(slotTime.toISOString())) {
        slots.push({
          startTime: slotTime.toISOString(),
          isOptimized: false,
          reason: 'Créneau disponible',
          score: 50 // Score neutre
        });
      }
    }
  }

  return slots;
}

/**
 * Combine créneaux optimisés et standards
 */
export async function getAllAvailableSlots(
  patientLat: number | undefined,
  patientLng: number | undefined,
  durationMin: number,
  preferredDate?: Date,
  appointmentType?: 'CABINET' | 'HOME'
): Promise<{
  optimized: OptimizedSlot[];
  standard: OptimizedSlot[];
}> {
  // Récupérer tous les créneaux déjà pris
  const startDate = preferredDate || new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14);

  const bookedAppointments = await db.appointments
    .where('startTime')
    .between(startDate.toISOString(), endDate.toISOString())
    .toArray();

  const excludeSlots = bookedAppointments.map(a => a.startTime);

  // Créneaux optimisés (toujours les chercher, même pour cabinet)
  const optimized = await suggestOptimizedSlots(
    patientLat,
    patientLng,
    durationMin,
    preferredDate,
    excludeSlots,
    appointmentType
  );

  // Créneaux standards
  const standard = generateStandardSlots(startDate, 14, excludeSlots);

  return { optimized, standard };
}

/**
 * Optimisation automatique lors de la création d'un RDV
 * Marque le RDV comme optimisé si proche d'autres RDV
 */
export async function checkIfOptimized(
  appointment: Appointment,
  patientLat: number | undefined,
  patientLng: number | undefined
): Promise<boolean> {
  if (!patientLat || !patientLng) return false;

  const apptDate = new Date(appointment.startTime);
  const nearby = await findNearbyAppointments(patientLat, patientLng, apptDate, 10);

  // Considéré comme optimisé si au moins 1 RDV dans un rayon de 10km
  return nearby.length > 0;
}
