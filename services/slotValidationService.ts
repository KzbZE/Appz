import { db } from '../db';
import { Appointment } from '../types';
import { calculateDistance } from './optimizationService';

export interface SlotValidationResult {
  isAvailable: boolean;
  conflicts: SlotConflict[];
  warnings: SlotWarning[];
  score: number; // 0-100, higher is better
}

export interface SlotConflict {
  type: 'SLOT_TAKEN' | 'TRAVEL_TIME_BEFORE' | 'TRAVEL_TIME_AFTER' | 'OVERLAPPING';
  severity: 'BLOCKING' | 'WARNING';
  message: string;
  details?: {
    appointmentId?: number;
    patientName?: string;
    time?: string;
    travelTimeNeeded?: number; // minutes
    travelTimeAvailable?: number; // minutes
    distance?: number; // km
  };
}

export interface SlotWarning {
  type: 'TIGHT_SCHEDULE' | 'LONG_TRAVEL' | 'END_OF_DAY' | 'EARLY_MORNING';
  message: string;
}

/**
 * Vérifie si un créneau est déjà pris
 */
export async function checkSlotAvailability(
  startTime: Date,
  durationMin: number,
  excludeAppointmentId?: number
): Promise<{ available: boolean; conflict?: SlotConflict }> {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMin);

  // Vérifier les rendez-vous qui se chevauchent
  const appointments = await db.appointments
    .where('startTime')
    .between(
      new Date(startTime.getTime() - 24 * 60 * 60 * 1000).toISOString(), // -1 jour
      new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString()  // +1 jour
    )
    .and(appt => appt.status === 'SCHEDULED')
    .toArray();

  for (const appt of appointments) {
    if (excludeAppointmentId && appt.id === excludeAppointmentId) continue;

    const apptStart = new Date(appt.startTime);
    const apptEnd = new Date(apptStart);
    apptEnd.setMinutes(apptEnd.getMinutes() + appt.durationMin);

    // Vérifier chevauchement
    const overlaps =
      (startTime >= apptStart && startTime < apptEnd) ||
      (endTime > apptStart && endTime <= apptEnd) ||
      (startTime <= apptStart && endTime >= apptEnd);

    if (overlaps) {
      const patient = await db.patients.get(appt.patientId);
      return {
        available: false,
        conflict: {
          type: 'SLOT_TAKEN',
          severity: 'BLOCKING',
          message: `Créneau déjà occupé par ${patient?.name || 'un autre rendez-vous'}`,
          details: {
            appointmentId: appt.id,
            patientName: patient?.name,
            time: appt.startTime
          }
        }
      };
    }
  }

  return { available: true };
}

/**
 * Calcule le temps de trajet nécessaire entre deux points (distance / vitesse moyenne)
 * Vitesse moyenne: 40 km/h en ville, 60 km/h hors ville
 */
export function calculateTravelTime(distanceKm: number): number {
  const avgSpeed = distanceKm > 10 ? 60 : 40; // km/h
  const travelTimeHours = distanceKm / avgSpeed;
  const travelTimeMinutes = Math.ceil(travelTimeHours * 60);

  // Ajouter 10 minutes de marge (préparation, parking, etc.)
  return travelTimeMinutes + 10;
}

/**
 * Valide si le praticien peut arriver à temps depuis le RDV précédent
 */
export async function validateTravelTimeBefore(
  proposedStartTime: Date,
  patientLat: number | undefined,
  patientLng: number | undefined,
  appointmentType?: 'CABINET' | 'HOME'
): Promise<{ valid: boolean; conflict?: SlotConflict }> {
  // Si c'est un RDV cabinet, pas de problème de trajet
  if (appointmentType === 'CABINET') {
    return { valid: true };
  }

  // Si pas de coordonnées, on ne peut pas valider
  if (!patientLat || !patientLng) {
    return { valid: true }; // On laisse passer, mais sans optimisation
  }

  // Chercher le RDV juste avant
  const allAppointments = await db.appointments
    .where('startTime')
    .below(proposedStartTime.toISOString())
    .and(appt => appt.status === 'SCHEDULED')
    .reverse()
    .sortBy('startTime');

  if (!allAppointments || allAppointments.length === 0) {
    return { valid: true }; // Pas de RDV avant
  }

  const previousAppt = allAppointments[0];
  const previousApptEnd = new Date(previousAppt.startTime);
  previousApptEnd.setMinutes(previousApptEnd.getMinutes() + previousAppt.durationMin);

  // Temps disponible entre fin du RDV précédent et début du nouveau
  const availableTimeMinutes = (proposedStartTime.getTime() - previousApptEnd.getTime()) / (1000 * 60);

  // Si le RDV précédent est au cabinet, pas besoin de calculer la distance
  if (previousAppt.type === 'CABINET') {
    // Besoin de temps pour aller du cabinet vers le domicile du patient
    // On suppose que le cabinet est le point de départ (coordonnées à définir dans settings)
    // Pour l'instant, on estime ~30 min pour quitter le cabinet
    const travelTimeNeeded = 30;

    if (availableTimeMinutes < travelTimeNeeded) {
      return {
        valid: false,
        conflict: {
          type: 'TRAVEL_TIME_BEFORE',
          severity: 'BLOCKING',
          message: `Temps insuffisant pour arriver depuis le cabinet (besoin: ${travelTimeNeeded} min, disponible: ${Math.floor(availableTimeMinutes)} min)`,
          details: {
            appointmentId: previousAppt.id,
            travelTimeNeeded,
            travelTimeAvailable: Math.floor(availableTimeMinutes)
          }
        }
      };
    }
    return { valid: true };
  }

  // RDV précédent à domicile: calculer la distance
  const previousPatient = await db.patients.get(previousAppt.patientId);
  if (!previousPatient || !previousPatient.lat || !previousPatient.lng) {
    return { valid: true }; // Pas de coordonnées pour le patient précédent
  }

  const distance = calculateDistance(
    previousPatient.lat,
    previousPatient.lng,
    patientLat,
    patientLng
  );

  const travelTimeNeeded = calculateTravelTime(distance);

  if (availableTimeMinutes < travelTimeNeeded) {
    return {
      valid: false,
      conflict: {
        type: 'TRAVEL_TIME_BEFORE',
        severity: 'BLOCKING',
        message: `Impossible d'arriver à temps depuis "${previousPatient.name}" (distance: ${distance} km, besoin: ${travelTimeNeeded} min, disponible: ${Math.floor(availableTimeMinutes)} min)`,
        details: {
          appointmentId: previousAppt.id,
          patientName: previousPatient.name,
          time: previousAppt.startTime,
          distance,
          travelTimeNeeded,
          travelTimeAvailable: Math.floor(availableTimeMinutes)
        }
      }
    };
  }

  return { valid: true };
}

/**
 * Valide si le créneau empêche d'arriver à temps au RDV suivant
 */
export async function validateTravelTimeAfter(
  proposedStartTime: Date,
  durationMin: number,
  patientLat: number | undefined,
  patientLng: number | undefined,
  appointmentType?: 'CABINET' | 'HOME'
): Promise<{ valid: boolean; conflict?: SlotConflict }> {
  // Si c'est un RDV cabinet, vérifier seulement si le praticien peut partir vers le prochain RDV
  const proposedEndTime = new Date(proposedStartTime);
  proposedEndTime.setMinutes(proposedEndTime.getMinutes() + durationMin);

  // Chercher le RDV juste après
  const allAppointments = await db.appointments
    .where('startTime')
    .above(proposedStartTime.toISOString())
    .and(appt => appt.status === 'SCHEDULED')
    .sortBy('startTime');

  if (!allAppointments || allAppointments.length === 0) {
    return { valid: true }; // Pas de RDV après
  }

  const nextAppt = allAppointments[0];
  const nextApptStart = new Date(nextAppt.startTime);

  // Temps disponible entre fin du RDV proposé et début du suivant
  const availableTimeMinutes = (nextApptStart.getTime() - proposedEndTime.getTime()) / (1000 * 60);

  // Si le RDV suivant est au cabinet
  if (nextAppt.type === 'CABINET') {
    if (appointmentType === 'HOME' && patientLat && patientLng) {
      // Besoin de revenir du domicile vers le cabinet
      const travelTimeNeeded = 30; // Estimation

      if (availableTimeMinutes < travelTimeNeeded) {
        return {
          valid: false,
          conflict: {
            type: 'TRAVEL_TIME_AFTER',
            severity: 'BLOCKING',
            message: `Temps insuffisant pour revenir au cabinet (besoin: ${travelTimeNeeded} min, disponible: ${Math.floor(availableTimeMinutes)} min)`,
            details: {
              appointmentId: nextAppt.id,
              time: nextAppt.startTime,
              travelTimeNeeded,
              travelTimeAvailable: Math.floor(availableTimeMinutes)
            }
          }
        };
      }
    }
    return { valid: true };
  }

  // RDV suivant à domicile: calculer la distance
  const nextPatient = await db.patients.get(nextAppt.patientId);
  if (!nextPatient || !nextPatient.lat || !nextPatient.lng) {
    return { valid: true }; // Pas de coordonnées
  }

  let distance: number;

  if (appointmentType === 'CABINET') {
    // Du cabinet vers le patient suivant - estimation
    distance = 15; // Estimation moyenne
  } else if (patientLat && patientLng) {
    // D'un domicile à l'autre
    distance = calculateDistance(patientLat, patientLng, nextPatient.lat, nextPatient.lng);
  } else {
    return { valid: true };
  }

  const travelTimeNeeded = calculateTravelTime(distance);

  if (availableTimeMinutes < travelTimeNeeded) {
    return {
      valid: false,
      conflict: {
        type: 'TRAVEL_TIME_AFTER',
        severity: 'BLOCKING',
        message: `Empêche d'arriver à temps chez "${nextPatient.name}" (distance: ${distance} km, besoin: ${travelTimeNeeded} min, disponible: ${Math.floor(availableTimeMinutes)} min)`,
        details: {
          appointmentId: nextAppt.id,
          patientName: nextPatient.name,
          time: nextAppt.startTime,
          distance,
          travelTimeNeeded,
          travelTimeAvailable: Math.floor(availableTimeMinutes)
        }
      }
    };
  }

  return { valid: true };
}

/**
 * Génère des avertissements pour un créneau (même s'il est valide)
 */
export async function generateSlotWarnings(
  proposedStartTime: Date,
  durationMin: number,
  patientLat: number | undefined,
  patientLng: number | undefined
): Promise<SlotWarning[]> {
  const warnings: SlotWarning[] = [];
  const proposedEndTime = new Date(proposedStartTime);
  proposedEndTime.setMinutes(proposedEndTime.getMinutes() + durationMin);

  const hour = proposedStartTime.getHours();

  // Avertissement si très tôt le matin
  if (hour < 8) {
    warnings.push({
      type: 'EARLY_MORNING',
      message: 'Créneau très matinal (avant 8h)'
    });
  }

  // Avertissement si tard le soir
  if (proposedEndTime.getHours() >= 19) {
    warnings.push({
      type: 'END_OF_DAY',
      message: 'Créneau finit tard (après 19h)'
    });
  }

  // Vérifier si le trajet depuis le RDV précédent est long mais acceptable
  if (patientLat && patientLng) {
    const previousAppts = await db.appointments
      .where('startTime')
      .below(proposedStartTime.toISOString())
      .and(appt => appt.status === 'SCHEDULED' && appt.type !== 'CABINET')
      .reverse()
      .sortBy('startTime');

    if (previousAppts && previousAppts.length > 0) {
      const prevAppt = previousAppts[0];
      const prevPatient = await db.patients.get(prevAppt.patientId);

      if (prevPatient?.lat && prevPatient?.lng) {
        const distance = calculateDistance(prevPatient.lat, prevPatient.lng, patientLat, patientLng);

        if (distance > 20) {
          warnings.push({
            type: 'LONG_TRAVEL',
            message: `Trajet important depuis le RDV précédent (${distance} km)`
          });
        }
      }
    }
  }

  // Vérifier planning serré (< 15 min entre RDV)
  const prevAppts = await db.appointments
    .where('startTime')
    .below(proposedStartTime.toISOString())
    .reverse()
    .sortBy('startTime');

  if (prevAppts && prevAppts.length > 0) {
    const prevAppt = prevAppts[0];
    const prevEnd = new Date(prevAppt.startTime);
    prevEnd.setMinutes(prevEnd.getMinutes() + prevAppt.durationMin);

    const gap = (proposedStartTime.getTime() - prevEnd.getTime()) / (1000 * 60);

    if (gap < 15) {
      warnings.push({
        type: 'TIGHT_SCHEDULE',
        message: `Planning serré (seulement ${Math.floor(gap)} min avant ce RDV)`
      });
    }
  }

  return warnings;
}

/**
 * Validation complète d'un créneau avec tous les contrôles
 */
export async function validateSlot(
  startTime: Date,
  durationMin: number,
  patientLat: number | undefined,
  patientLng: number | undefined,
  appointmentType?: 'CABINET' | 'HOME',
  excludeAppointmentId?: number
): Promise<SlotValidationResult> {
  const conflicts: SlotConflict[] = [];

  // 1. Vérifier disponibilité du créneau
  const availabilityCheck = await checkSlotAvailability(startTime, durationMin, excludeAppointmentId);
  if (!availabilityCheck.available && availabilityCheck.conflict) {
    conflicts.push(availabilityCheck.conflict);
  }

  // 2. Valider temps de trajet AVANT
  const travelBeforeCheck = await validateTravelTimeBefore(startTime, patientLat, patientLng, appointmentType);
  if (!travelBeforeCheck.valid && travelBeforeCheck.conflict) {
    conflicts.push(travelBeforeCheck.conflict);
  }

  // 3. Valider temps de trajet APRÈS
  const travelAfterCheck = await validateTravelTimeAfter(startTime, durationMin, patientLat, patientLng, appointmentType);
  if (!travelAfterCheck.valid && travelAfterCheck.conflict) {
    conflicts.push(travelAfterCheck.conflict);
  }

  // 4. Générer avertissements
  const warnings = await generateSlotWarnings(startTime, durationMin, patientLat, patientLng);

  // 5. Calculer score global
  const isAvailable = conflicts.filter(c => c.severity === 'BLOCKING').length === 0;
  let score = 100;

  // Pénalités
  score -= conflicts.filter(c => c.severity === 'BLOCKING').length * 50;
  score -= conflicts.filter(c => c.severity === 'WARNING').length * 20;
  score -= warnings.length * 10;

  score = Math.max(0, score);

  return {
    isAvailable,
    conflicts,
    warnings,
    score
  };
}

/**
 * Suggère des jours alternatifs avec moins de conflits
 */
export async function suggestAlternativeDays(
  originalDate: Date,
  durationMin: number,
  patientLat: number | undefined,
  patientLng: number | undefined,
  appointmentType?: 'CABINET' | 'HOME',
  daysToCheck: number = 7
): Promise<Array<{ date: Date; score: number; reason: string }>> {
  const suggestions: Array<{ date: Date; score: number; reason: string }> = [];

  for (let dayOffset = 1; dayOffset <= daysToCheck; dayOffset++) {
    const checkDate = new Date(originalDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);

    // Exclure dimanches
    if (checkDate.getDay() === 0) continue;

    // Essayer différentes heures dans la journée
    const hours = [9, 10, 11, 14, 15, 16, 17];
    let bestScoreForDay = 0;
    let bestReason = '';

    for (const hour of hours) {
      const testTime = new Date(checkDate);
      testTime.setHours(hour, 0, 0, 0);

      const validation = await validateSlot(
        testTime,
        durationMin,
        patientLat,
        patientLng,
        appointmentType
      );

      if (validation.score > bestScoreForDay) {
        bestScoreForDay = validation.score;

        if (validation.conflicts.length === 0) {
          bestReason = 'Journée optimale pour les déplacements';
        } else {
          bestReason = `${validation.conflicts.length} conflit(s) potentiel(s)`;
        }
      }
    }

    if (bestScoreForDay > 50) {
      suggestions.push({
        date: checkDate,
        score: bestScoreForDay,
        reason: bestReason
      });
    }
  }

  // Trier par score décroissant
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions.slice(0, 5); // Top 5 jours
}
