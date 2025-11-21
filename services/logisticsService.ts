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