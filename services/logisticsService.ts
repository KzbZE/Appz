import { Appointment, Patient } from '../types';

interface LogisticsResult {
  distanceKm: number;
  durationMin: number;
  cost: number;
}

export const CABINET_ADDRESS = "10 Rue de la Paix, Paris";

export const calculateLogistics = (fromAddress: string, toAddress: string): LogisticsResult => {
  if (fromAddress === toAddress) return { distanceKm: 0, durationMin: 0, cost: 0 };
  if (toAddress.includes("Cabinet") && fromAddress.includes("Cabinet")) return { distanceKm: 0, durationMin: 0, cost: 0 };

  const baseDist = Math.abs(fromAddress.length - toAddress.length) * 2 + 5;
  const distanceKm = Math.round(baseDist); 
  
  const durationMin = Math.round((distanceKm / 50) * 60 + 5);
  const cost = distanceKm * 0.5;

  return { distanceKm, durationMin, cost };
};

export const checkAvailability = (
  proposedStart: Date,
  proposedDurationMin: number,
  proposedAddress: string,
  existingAppts: Appointment[],
  patients: Patient[]
): { available: boolean; reason?: string; logistics?: LogisticsResult } => {

  const proposedEnd = new Date(proposedStart.getTime() + proposedDurationMin * 60000);

  const overlap = existingAppts.find(a => {
    const start = new Date(a.startTime);
    const end = new Date(start.getTime() + a.durationMin * 60000);
    return (proposedStart < end && proposedEnd > start);
  });

  if (overlap) return { available: false, reason: "Créneau déjà occupé par un autre RDV." };

  const sorted = [...existingAppts].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const prevAppt = sorted.reverse().find(a => new Date(a.startTime) < proposedStart);
  const nextAppt = sorted.reverse().find(a => new Date(a.startTime) >= proposedEnd);

  let logisticsToHere: LogisticsResult = { distanceKm: 0, durationMin: 0, cost: 0 };

  if (prevAppt) {
    const prevPatient = patients.find(p => p.id === prevAppt.patientId);
    const prevAddress = prevAppt.type === 'CABINET' ? CABINET_ADDRESS : (prevPatient?.address || CABINET_ADDRESS);

    const travel = calculateLogistics(prevAddress, proposedAddress);
    logisticsToHere = travel;

    const prevEnd = new Date(new Date(prevAppt.startTime).getTime() + prevAppt.durationMin * 60000);
    const arrivalTime = new Date(prevEnd.getTime() + travel.durationMin * 60000);

    if (arrivalTime > proposedStart) {
      return {
        available: false,
        reason: `Temps de trajet insuffisant depuis ${prevAppt.notes} (${travel.durationMin} min nécessaires).`
      };
    }
  } else {
    const travel = calculateLogistics(CABINET_ADDRESS, proposedAddress);
    logisticsToHere = travel;
  }

  if (nextAppt) {
    const nextPatient = patients.find(p => p.id === nextAppt.patientId);
    const nextAddress = nextAppt.type === 'CABINET' ? CABINET_ADDRESS : (nextPatient?.address || CABINET_ADDRESS);

    const travel = calculateLogistics(proposedAddress, nextAddress);

    const departureTime = proposedEnd;
    const arrivalAtNext = new Date(departureTime.getTime() + travel.durationMin * 60000);
    const nextStart = new Date(nextAppt.startTime);

    if (arrivalAtNext > nextStart) {
      return {
        available: false,
        reason: `Impossible d'arriver à l'heure pour le RDV suivant (${travel.durationMin} min de trajet).`
      };
    }
  }

  return { available: true, logistics: logisticsToHere };
};

// 🚀 NOUVELLE FONCTIONNALITÉ : Regroupement géographique intelligent
interface TimeSlotSuggestion {
  startTime: Date;
  score: number; // 0-100, plus c'est élevé, mieux c'est
  reason: string;
  savingsKm?: number;
  savingsTime?: number;
  nearbyAppointments?: Appointment[];
}

/**
 * Suggère les meilleurs créneaux horaires pour un RDV en fonction du regroupement géographique
 * Optimise les trajets en regroupant les RDV dans la même zone
 */
export const suggestOptimalTimeSlots = (
  targetDate: Date,
  targetAddress: string,
  durationMin: number,
  existingAppts: Appointment[],
  patients: Patient[],
  cabinetAddress: string = CABINET_ADDRESS
): TimeSlotSuggestion[] => {

  const suggestions: TimeSlotSuggestion[] = [];

  // Filtrer les RDV du jour ciblé
  const dayAppts = existingAppts.filter(a => {
    const apptDate = new Date(a.startTime);
    return apptDate.toDateString() === targetDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Si aucun RDV ce jour-là, suggérer des créneaux standards
  if (dayAppts.length === 0) {
    const standardSlots = [9, 11, 14, 16]; // 9h, 11h, 14h, 16h
    standardSlots.forEach(hour => {
      const slot = new Date(targetDate);
      slot.setHours(hour, 0, 0, 0);
      suggestions.push({
        startTime: slot,
        score: 60,
        reason: "Créneau standard (journée vide)"
      });
    });
    return suggestions;
  }

  // Analyser chaque RDV existant pour trouver des opportunités de regroupement
  dayAppts.forEach((appt, index) => {
    const apptPatient = patients.find(p => p.id === appt.patientId);
    const apptAddress = appt.type === 'CABINET' ? cabinetAddress : (apptPatient?.address || cabinetAddress);

    // Calculer la distance entre le RDV existant et le nouveau RDV
    const proximity = calculateLogistics(apptAddress, targetAddress);

    // Si c'est dans la même zone géographique (< 10 km), suggérer avant ou après
    if (proximity.distanceKm < 10) {
      const apptStart = new Date(appt.startTime);
      const apptEnd = new Date(apptStart.getTime() + appt.durationMin * 60000);

      // SUGGESTION 1 : Juste après ce RDV
      const afterSlot = new Date(apptEnd.getTime() + proximity.durationMin * 60000);
      const afterCheck = checkAvailability(afterSlot, durationMin, targetAddress, existingAppts, patients);

      if (afterCheck.available) {
        const savingsKm = calculateSavings(apptAddress, targetAddress, cabinetAddress);
        suggestions.push({
          startTime: afterSlot,
          score: Math.min(95, 70 + (10 - proximity.distanceKm) * 3),
          reason: `Grouper avec ${apptPatient?.name || 'RDV'} (même zone, ${proximity.distanceKm}km)`,
          savingsKm: savingsKm.km,
          savingsTime: savingsKm.time,
          nearbyAppointments: [appt]
        });
      }

      // SUGGESTION 2 : Juste avant ce RDV (si c'est le premier du jour ou si assez de temps)
      const beforeSlot = new Date(apptStart.getTime() - durationMin * 60000 - proximity.durationMin * 60000);
      const beforeCheck = checkAvailability(beforeSlot, durationMin, targetAddress, existingAppts, patients);

      if (beforeCheck.available && beforeSlot.getHours() >= 8) {
        const savingsKm = calculateSavings(apptAddress, targetAddress, cabinetAddress);
        suggestions.push({
          startTime: beforeSlot,
          score: Math.min(90, 65 + (10 - proximity.distanceKm) * 3),
          reason: `Avant ${apptPatient?.name || 'RDV'} (même zone, ${proximity.distanceKm}km)`,
          savingsKm: savingsKm.km,
          savingsTime: savingsKm.time,
          nearbyAppointments: [appt]
        });
      }
    }
  });

  // Suggérer des créneaux dans les "trous" de l'agenda
  for (let i = 0; i < dayAppts.length - 1; i++) {
    const currentAppt = dayAppts[i];
    const nextAppt = dayAppts[i + 1];

    const currentEnd = new Date(new Date(currentAppt.startTime).getTime() + currentAppt.durationMin * 60000);
    const nextStart = new Date(nextAppt.startTime);

    const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60000;

    // Si le trou est assez grand (au moins durationMin + temps de trajet * 2)
    if (gapMinutes >= durationMin + 30) {
      const slotStart = new Date(currentEnd.getTime() + 15 * 60000); // 15 min de marge
      const slotCheck = checkAvailability(slotStart, durationMin, targetAddress, existingAppts, patients);

      if (slotCheck.available) {
        suggestions.push({
          startTime: slotStart,
          score: 50,
          reason: "Combler un trou dans l'agenda"
        });
      }
    }
  }

  // Trier par score décroissant
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5); // Top 5 suggestions
};

/**
 * Calcule les économies de km et temps en regroupant deux adresses
 */
const calculateSavings = (
  address1: string,
  address2: string,
  cabinetAddress: string
): { km: number; time: number } => {
  // Scénario sans regroupement : Cabinet -> Adresse1 -> Cabinet -> Adresse2 -> Cabinet
  const withoutGrouping =
    calculateLogistics(cabinetAddress, address1).distanceKm * 2 +
    calculateLogistics(cabinetAddress, address2).distanceKm * 2;

  // Scénario avec regroupement : Cabinet -> Adresse1 -> Adresse2 -> Cabinet
  const withGrouping =
    calculateLogistics(cabinetAddress, address1).distanceKm +
    calculateLogistics(address1, address2).distanceKm +
    calculateLogistics(address2, cabinetAddress).distanceKm;

  const kmSaved = Math.max(0, withoutGrouping - withGrouping);
  const timeSaved = Math.round((kmSaved / 50) * 60); // Estimation à 50 km/h

  return { km: kmSaved, time: timeSaved };
};

/**
 * Groupe les RDV par proximité géographique pour une journée donnée
 */
export const groupAppointmentsByProximity = (
  appointments: Appointment[],
  patients: Patient[],
  cabinetAddress: string = CABINET_ADDRESS,
  maxDistanceKm: number = 15
): { zone: string; appointments: Appointment[]; centerAddress: string }[] => {

  const groups: { zone: string; appointments: Appointment[]; centerAddress: string }[] = [];
  const processed = new Set<string | number>();

  appointments.forEach(appt => {
    if (processed.has(appt.id!)) return;

    const apptPatient = patients.find(p => p.id === appt.patientId);
    const apptAddress = appt.type === 'CABINET' ? cabinetAddress : (apptPatient?.address || cabinetAddress);

    // Trouver tous les RDV proches de celui-ci
    const nearby: Appointment[] = [appt];
    processed.add(appt.id!);

    appointments.forEach(otherAppt => {
      if (processed.has(otherAppt.id!) || otherAppt.id === appt.id) return;

      const otherPatient = patients.find(p => p.id === otherAppt.patientId);
      const otherAddress = otherAppt.type === 'CABINET' ? cabinetAddress : (otherPatient?.address || cabinetAddress);

      const distance = calculateLogistics(apptAddress, otherAddress).distanceKm;

      if (distance <= maxDistanceKm) {
        nearby.push(otherAppt);
        processed.add(otherAppt.id!);
      }
    });

    groups.push({
      zone: appt.type === 'CABINET' ? 'Cabinet' : `Zone ${(apptAddress || 'Adresse inconnue').substring(0, 20)}...`,
      appointments: nearby,
      centerAddress: apptAddress
    });
  });

  return groups;
};