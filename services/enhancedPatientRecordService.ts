/**
 * Service de Dossier Patient Enrichi
 *
 * Fonctionnalités:
 * - Photos avant/après avec comparaison
 * - Allergies & contre-indications
 * - Antécédents médicaux (chirurgies, pathologies)
 * - Médecin traitant
 * - Consentements & signatures électroniques RGPD
 * - Objectifs thérapeutiques
 * - Bibliothèque exercices à domicile (vidéos/photos)
 * - Journal patient
 */

import { Patient } from '../types';

// Types
export interface PatientPhoto {
  id: string;
  patientId: string;
  type: 'before' | 'after' | 'progress';
  date: Date;
  url: string; // Data URL ou URL serveur
  bodyPart?: string; // "dos", "jambe droite", etc.
  notes?: string;
  takenBy: string; // ID praticien
}

export interface Allergy {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction?: string;
  diagnosedDate?: Date;
}

export interface MedicalHistory {
  id: string;
  type: 'surgery' | 'chronic_condition' | 'injury' | 'medication' | 'family_history' | 'other';
  description: string;
  date?: Date;
  ongoing: boolean;
  notes?: string;
}

export interface TreatingPhysician {
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Consent {
  id: string;
  patientId: string;
  type: 'treatment' | 'photos' | 'data_processing' | 'marketing' | 'custom';
  title: string;
  content: string;
  signedAt?: Date;
  signature?: string; // Data URL de la signature
  ipAddress?: string;
  version: string; // Versioning du consentement
  expiresAt?: Date;
  revokedAt?: Date;
}

export interface TherapeuticGoal {
  id: string;
  patientId: string;
  description: string;
  category: 'pain_relief' | 'mobility' | 'strength' | 'posture' | 'wellness' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'achieved' | 'paused' | 'abandoned';
  startDate: Date;
  targetDate?: Date;
  achievedDate?: Date;
  progress: number; // 0-100
  milestones: {
    date: Date;
    description: string;
    achieved: boolean;
  }[];
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'stretching' | 'strengthening' | 'mobility' | 'balance' | 'breathing' | 'relaxation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // Minutes
  repetitions?: string; // "3x10", "10 min", etc.
  description: string;
  instructions: string[];
  videoUrl?: string; // URL YouTube, Vimeo ou upload
  imageUrl?: string;
  targetedMuscles: string[];
  contraindications: string[];
  equipment?: string[];
  createdBy: string;
  isPublic: boolean;
}

export interface PatientExercisePlan {
  id: string;
  patientId: string;
  name: string;
  exercises: {
    exerciseId: string;
    order: number;
    customInstructions?: string;
    frequency: string; // "2x par jour", "tous les matins", etc.
  }[];
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'paused';
  compliance: number; // 0-100, calculé selon le suivi
  notes?: string;
}

export interface PatientJournalEntry {
  id: string;
  patientId: string;
  date: Date;
  type: 'pain' | 'mobility' | 'mood' | 'sleep' | 'medication' | 'exercise' | 'general';
  painLevel?: number; // 0-10
  painLocation?: string;
  moodLevel?: number; // 0-10
  sleepQuality?: number; // 0-10
  sleepHours?: number;
  notes: string;
  enteredBy: 'patient' | 'practitioner';
  attachments?: string[]; // URLs
}

export interface EnhancedPatientRecord {
  patientId: string;
  photos: PatientPhoto[];
  allergies: Allergy[];
  medicalHistory: MedicalHistory[];
  treatingPhysician?: TreatingPhysician;
  consents: Consent[];
  goals: TherapeuticGoal[];
  exercisePlans: PatientExercisePlan[];
  journal: PatientJournalEntry[];
  lastUpdated: Date;
}

class EnhancedPatientRecordService {
  private records: Map<string, EnhancedPatientRecord> = new Map();
  private exercises: Exercise[] = [];

  constructor() {
    this.loadData();
    this.initializeDefaultExercises();
  }

  /**
   * Gestion dossier enrichi
   */

  getPatientRecord(patientId: string): EnhancedPatientRecord {
    if (!this.records.has(patientId)) {
      const record: EnhancedPatientRecord = {
        patientId,
        photos: [],
        allergies: [],
        medicalHistory: [],
        consents: [],
        goals: [],
        exercisePlans: [],
        journal: [],
        lastUpdated: new Date()
      };
      this.records.set(patientId, record);
      this.saveData();
    }

    return this.records.get(patientId)!;
  }

  updatePatientRecord(patientId: string, updates: Partial<EnhancedPatientRecord>): void {
    const record = this.getPatientRecord(patientId);
    Object.assign(record, updates, { lastUpdated: new Date() });
    this.records.set(patientId, record);
    this.saveData();
  }

  /**
   * Photos avant/après
   */

  async addPhoto(
    patientId: string,
    type: PatientPhoto['type'],
    file: File | string, // File object ou Data URL
    metadata: {
      bodyPart?: string;
      notes?: string;
      takenBy: string;
    }
  ): Promise<PatientPhoto> {
    const record = this.getPatientRecord(patientId);

    let url: string;
    if (typeof file === 'string') {
      url = file;
    } else {
      // Convertir File en Data URL
      url = await this.fileToDataUrl(file);
    }

    const photo: PatientPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      type,
      date: new Date(),
      url,
      ...metadata
    };

    record.photos.push(photo);
    this.updatePatientRecord(patientId, { photos: record.photos });

    return photo;
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  getPhotos(
    patientId: string,
    filters?: {
      type?: PatientPhoto['type'];
      bodyPart?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ): PatientPhoto[] {
    const record = this.getPatientRecord(patientId);
    let photos = [...record.photos];

    if (filters) {
      if (filters.type) {
        photos = photos.filter(p => p.type === filters.type);
      }
      if (filters.bodyPart) {
        photos = photos.filter(p => p.bodyPart === filters.bodyPart);
      }
      if (filters.fromDate) {
        photos = photos.filter(p => new Date(p.date) >= filters.fromDate!);
      }
      if (filters.toDate) {
        photos = photos.filter(p => new Date(p.date) <= filters.toDate!);
      }
    }

    return photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  comparePhotos(photo1Id: string, photo2Id: string, patientId: string): {
    before: PatientPhoto | null;
    after: PatientPhoto | null;
    daysBetween: number;
  } {
    const record = this.getPatientRecord(patientId);
    const photo1 = record.photos.find(p => p.id === photo1Id) || null;
    const photo2 = record.photos.find(p => p.id === photo2Id) || null;

    const daysBetween = photo1 && photo2
      ? Math.abs((new Date(photo2.date).getTime() - new Date(photo1.date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return { before: photo1, after: photo2, daysBetween };
  }

  /**
   * Allergies
   */

  addAllergy(patientId: string, allergy: Omit<Allergy, 'id'>): Allergy {
    const record = this.getPatientRecord(patientId);
    const newAllergy: Allergy = {
      ...allergy,
      id: `allergy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    record.allergies.push(newAllergy);
    this.updatePatientRecord(patientId, { allergies: record.allergies });

    return newAllergy;
  }

  removeAllergy(patientId: string, allergyId: string): void {
    const record = this.getPatientRecord(patientId);
    record.allergies = record.allergies.filter(a => a.id !== allergyId);
    this.updatePatientRecord(patientId, { allergies: record.allergies });
  }

  getSevereAllergies(patientId: string): Allergy[] {
    const record = this.getPatientRecord(patientId);
    return record.allergies.filter(a =>
      a.severity === 'severe' || a.severity === 'life_threatening'
    );
  }

  /**
   * Antécédents médicaux
   */

  addMedicalHistory(patientId: string, history: Omit<MedicalHistory, 'id'>): MedicalHistory {
    const record = this.getPatientRecord(patientId);
    const newHistory: MedicalHistory = {
      ...history,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    record.medicalHistory.push(newHistory);
    this.updatePatientRecord(patientId, { medicalHistory: record.medicalHistory });

    return newHistory;
  }

  getMedicalHistory(patientId: string, type?: MedicalHistory['type']): MedicalHistory[] {
    const record = this.getPatientRecord(patientId);
    const history = type
      ? record.medicalHistory.filter(h => h.type === type)
      : record.medicalHistory;

    return history.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  /**
   * Médecin traitant
   */

  setTreatingPhysician(patientId: string, physician: TreatingPhysician): void {
    const record = this.getPatientRecord(patientId);
    this.updatePatientRecord(patientId, { treatingPhysician: physician });
  }

  getTreatingPhysician(patientId: string): TreatingPhysician | undefined {
    const record = this.getPatientRecord(patientId);
    return record.treatingPhysician;
  }

  /**
   * Consentements & Signatures électroniques
   */

  createConsent(data: Omit<Consent, 'id'>): Consent {
    const consent: Consent = {
      ...data,
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const record = this.getPatientRecord(data.patientId);
    record.consents.push(consent);
    this.updatePatientRecord(data.patientId, { consents: record.consents });

    return consent;
  }

  signConsent(patientId: string, consentId: string, signature: string, ipAddress?: string): Consent | null {
    const record = this.getPatientRecord(patientId);
    const consent = record.consents.find(c => c.id === consentId);

    if (!consent) return null;

    consent.signedAt = new Date();
    consent.signature = signature;
    consent.ipAddress = ipAddress;

    this.updatePatientRecord(patientId, { consents: record.consents });

    return consent;
  }

  revokeConsent(patientId: string, consentId: string): boolean {
    const record = this.getPatientRecord(patientId);
    const consent = record.consents.find(c => c.id === consentId);

    if (!consent) return false;

    consent.revokedAt = new Date();
    this.updatePatientRecord(patientId, { consents: record.consents });

    return true;
  }

  getActiveConsents(patientId: string): Consent[] {
    const record = this.getPatientRecord(patientId);
    const now = new Date();

    return record.consents.filter(c =>
      c.signedAt &&
      !c.revokedAt &&
      (!c.expiresAt || new Date(c.expiresAt) > now)
    );
  }

  needsConsentRenewal(patientId: string, type: Consent['type']): boolean {
    const activeConsents = this.getActiveConsents(patientId);
    return !activeConsents.some(c => c.type === type);
  }

  /**
   * Objectifs thérapeutiques
   */

  addGoal(patientId: string, goal: Omit<TherapeuticGoal, 'id' | 'status' | 'progress' | 'milestones'>): TherapeuticGoal {
    const record = this.getPatientRecord(patientId);
    const newGoal: TherapeuticGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
      progress: 0,
      milestones: []
    };

    record.goals.push(newGoal);
    this.updatePatientRecord(patientId, { goals: record.goals });

    return newGoal;
  }

  updateGoalProgress(patientId: string, goalId: string, progress: number, milestone?: string): void {
    const record = this.getPatientRecord(patientId);
    const goal = record.goals.find(g => g.id === goalId);

    if (!goal) return;

    goal.progress = Math.min(100, Math.max(0, progress));

    if (milestone) {
      goal.milestones.push({
        date: new Date(),
        description: milestone,
        achieved: true
      });
    }

    if (goal.progress === 100) {
      goal.status = 'achieved';
      goal.achievedDate = new Date();
    }

    this.updatePatientRecord(patientId, { goals: record.goals });
  }

  getActiveGoals(patientId: string): TherapeuticGoal[] {
    const record = this.getPatientRecord(patientId);
    return record.goals.filter(g => g.status === 'active');
  }

  /**
   * Bibliothèque d'exercices
   */

  private initializeDefaultExercises(): void {
    const defaultExercises: Omit<Exercise, 'id' | 'createdBy' | 'isPublic'>[] = [
      {
        name: 'Étirement des ischio-jambiers',
        category: 'stretching',
        difficulty: 'beginner',
        duration: 2,
        repetitions: '3x30 sec',
        description: 'Étirement assis pour les muscles arrière de la cuisse',
        instructions: [
          'Assis au sol, jambes tendues devant vous',
          'Penchez-vous vers l\'avant en gardant le dos droit',
          'Attrapez vos pieds ou chevilles',
          'Maintenez la position 30 secondes',
          'Revenez lentement à la position initiale'
        ],
        targetedMuscles: ['ischio-jambiers', 'bas du dos'],
        contraindications: ['hernie discale active', 'sciatique aiguë'],
        equipment: []
      },
      {
        name: 'Renforcement du tronc (Planche)',
        category: 'strengthening',
        difficulty: 'intermediate',
        duration: 1,
        repetitions: '3x45 sec',
        description: 'Exercice de gainage pour renforcer la sangle abdominale',
        instructions: [
          'Position de départ sur les coudes et les pieds',
          'Corps aligné de la tête aux talons',
          'Contractez les abdominaux',
          'Maintenez la position sans creuser le dos',
          'Respirez normalement'
        ],
        targetedMuscles: ['abdominaux', 'lombaires', 'épaules'],
        contraindications: ['douleur aiguë au dos', 'grossesse avancée'],
        equipment: ['tapis de sol']
      },
      {
        name: 'Mobilité cervicale',
        category: 'mobility',
        difficulty: 'beginner',
        duration: 3,
        repetitions: '10x chaque direction',
        description: 'Exercices de mobilité pour la nuque',
        instructions: [
          'Position assise, dos droit',
          'Tournez lentement la tête vers la droite',
          'Revenez au centre',
          'Tournez vers la gauche',
          'Inclinez la tête vers chaque épaule',
          'Mouvements lents et contrôlés'
        ],
        targetedMuscles: ['muscles cervicaux', 'trapèzes'],
        contraindications: ['vertige', 'hernie cervicale'],
        equipment: []
      },
      {
        name: 'Respiration diaphragmatique',
        category: 'breathing',
        difficulty: 'beginner',
        duration: 5,
        repetitions: '10 cycles',
        description: 'Technique de respiration profonde pour la relaxation',
        instructions: [
          'Allongé sur le dos, genoux pliés',
          'Une main sur le ventre, une sur la poitrine',
          'Inspirez lentement par le nez (4 sec)',
          'Sentez votre ventre se gonfler',
          'Expirez par la bouche (6 sec)',
          'Répétez calmement'
        ],
        targetedMuscles: ['diaphragme'],
        contraindications: [],
        equipment: ['tapis de sol']
      }
    ];

    for (const ex of defaultExercises) {
      this.exercises.push({
        ...ex,
        id: `ex_default_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdBy: 'system',
        isPublic: true
      });
    }
  }

  addExercise(exercise: Omit<Exercise, 'id'>): Exercise {
    const newExercise: Exercise = {
      ...exercise,
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.exercises.push(newExercise);
    this.saveData();

    return newExercise;
  }

  getExercises(filters?: {
    category?: Exercise['category'];
    difficulty?: Exercise['difficulty'];
    searchTerm?: string;
  }): Exercise[] {
    let result = [...this.exercises];

    if (filters) {
      if (filters.category) {
        result = result.filter(ex => ex.category === filters.category);
      }
      if (filters.difficulty) {
        result = result.filter(ex => ex.difficulty === filters.difficulty);
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        result = result.filter(ex =>
          ex.name.toLowerCase().includes(term) ||
          ex.description.toLowerCase().includes(term) ||
          ex.targetedMuscles.some(m => m.toLowerCase().includes(term))
        );
      }
    }

    return result;
  }

  getExercise(exerciseId: string): Exercise | undefined {
    return this.exercises.find(ex => ex.id === exerciseId);
  }

  /**
   * Plans d'exercices personnalisés
   */

  createExercisePlan(patientId: string, plan: Omit<PatientExercisePlan, 'id' | 'status' | 'compliance'>): PatientExercisePlan {
    const record = this.getPatientRecord(patientId);
    const newPlan: PatientExercisePlan = {
      ...plan,
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
      compliance: 0
    };

    record.exercisePlans.push(newPlan);
    this.updatePatientRecord(patientId, { exercisePlans: record.exercisePlans });

    return newPlan;
  }

  getActivePlan(patientId: string): PatientExercisePlan | undefined {
    const record = this.getPatientRecord(patientId);
    return record.exercisePlans.find(p => p.status === 'active');
  }

  getPlanWithExercises(patientId: string, planId: string): {
    plan: PatientExercisePlan;
    exercises: (Exercise & { customInstructions?: string; frequency: string })[];
  } | null {
    const record = this.getPatientRecord(patientId);
    const plan = record.exercisePlans.find(p => p.id === planId);

    if (!plan) return null;

    const exercises = plan.exercises
      .map(pe => {
        const exercise = this.getExercise(pe.exerciseId);
        if (!exercise) return null;
        return {
          ...exercise,
          customInstructions: pe.customInstructions,
          frequency: pe.frequency
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => {
        const orderA = plan.exercises.find(pe => pe.exerciseId === a.id)?.order || 0;
        const orderB = plan.exercises.find(pe => pe.exerciseId === b.id)?.order || 0;
        return orderA - orderB;
      });

    return { plan, exercises };
  }

  /**
   * Journal patient
   */

  addJournalEntry(patientId: string, entry: Omit<PatientJournalEntry, 'id'>): PatientJournalEntry {
    const record = this.getPatientRecord(patientId);
    const newEntry: PatientJournalEntry = {
      ...entry,
      id: `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    record.journal.push(newEntry);
    this.updatePatientRecord(patientId, { journal: record.journal });

    return newEntry;
  }

  getJournal(patientId: string, filters?: {
    type?: PatientJournalEntry['type'];
    fromDate?: Date;
    toDate?: Date;
  }): PatientJournalEntry[] {
    const record = this.getPatientRecord(patientId);
    let entries = [...record.journal];

    if (filters) {
      if (filters.type) {
        entries = entries.filter(e => e.type === filters.type);
      }
      if (filters.fromDate) {
        entries = entries.filter(e => new Date(e.date) >= filters.fromDate!);
      }
      if (filters.toDate) {
        entries = entries.filter(e => new Date(e.date) <= filters.toDate!);
      }
    }

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getPainTrend(patientId: string, days: number = 30): {
    date: Date;
    level: number;
  }[] {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const painEntries = this.getJournal(patientId, {
      type: 'pain',
      fromDate
    }).filter(e => e.painLevel !== undefined);

    return painEntries.map(e => ({
      date: new Date(e.date),
      level: e.painLevel!
    }));
  }

  /**
   * Persistence
   */

  private loadData(): void {
    try {
      const saved = localStorage.getItem('theraflow_enhanced_records');
      if (saved) {
        const data = JSON.parse(saved);

        if (data.records) {
          this.records = new Map(
            data.records.map(([patientId, record]: [string, any]) => [
              patientId,
              {
                ...record,
                photos: record.photos.map((p: any) => ({ ...p, date: new Date(p.date) })),
                allergies: record.allergies.map((a: any) => ({
                  ...a,
                  diagnosedDate: a.diagnosedDate ? new Date(a.diagnosedDate) : undefined
                })),
                medicalHistory: record.medicalHistory.map((h: any) => ({
                  ...h,
                  date: h.date ? new Date(h.date) : undefined
                })),
                consents: record.consents.map((c: any) => ({
                  ...c,
                  signedAt: c.signedAt ? new Date(c.signedAt) : undefined,
                  expiresAt: c.expiresAt ? new Date(c.expiresAt) : undefined,
                  revokedAt: c.revokedAt ? new Date(c.revokedAt) : undefined
                })),
                goals: record.goals.map((g: any) => ({
                  ...g,
                  startDate: new Date(g.startDate),
                  targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
                  achievedDate: g.achievedDate ? new Date(g.achievedDate) : undefined,
                  milestones: g.milestones.map((m: any) => ({
                    ...m,
                    date: new Date(m.date)
                  }))
                })),
                exercisePlans: record.exercisePlans.map((p: any) => ({
                  ...p,
                  startDate: new Date(p.startDate),
                  endDate: p.endDate ? new Date(p.endDate) : undefined
                })),
                journal: record.journal.map((j: any) => ({
                  ...j,
                  date: new Date(j.date)
                })),
                lastUpdated: new Date(record.lastUpdated)
              }
            ])
          );
        }

        if (data.exercises) {
          this.exercises = data.exercises;
        }
      }
    } catch (error) {
      console.error('Erreur chargement dossiers enrichis:', error);
    }
  }

  private saveData(): void {
    try {
      const data = {
        records: Array.from(this.records.entries()),
        exercises: this.exercises
      };
      localStorage.setItem('theraflow_enhanced_records', JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde dossiers enrichis:', error);
    }
  }
}

// Export singleton
const enhancedPatientRecordServiceInstance = new EnhancedPatientRecordService();
export default enhancedPatientRecordServiceInstance;

// Fonctions helper
export function getPatientRecord(patientId: string): EnhancedPatientRecord {
  return enhancedPatientRecordServiceInstance.getPatientRecord(patientId);
}

export function addPhoto(patientId: string, type: PatientPhoto['type'], file: File | string, metadata: any): Promise<PatientPhoto> {
  return enhancedPatientRecordServiceInstance.addPhoto(patientId, type, file, metadata);
}

export function addAllergy(patientId: string, allergy: Omit<Allergy, 'id'>): Allergy {
  return enhancedPatientRecordServiceInstance.addAllergy(patientId, allergy);
}

export function getSevereAllergies(patientId: string): Allergy[] {
  return enhancedPatientRecordServiceInstance.getSevereAllergies(patientId);
}

export function createConsent(data: Omit<Consent, 'id'>): Consent {
  return enhancedPatientRecordServiceInstance.createConsent(data);
}

export function signConsent(patientId: string, consentId: string, signature: string, ipAddress?: string): Consent | null {
  return enhancedPatientRecordServiceInstance.signConsent(patientId, consentId, signature, ipAddress);
}

export function getExercises(filters?: any): Exercise[] {
  return enhancedPatientRecordServiceInstance.getExercises(filters);
}

export function createExercisePlan(patientId: string, plan: Omit<PatientExercisePlan, 'id' | 'status' | 'compliance'>): PatientExercisePlan {
  return enhancedPatientRecordServiceInstance.createExercisePlan(patientId, plan);
}
