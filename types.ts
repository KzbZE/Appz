export enum PatientType {
  HUMAN = 'HUMAN',
  EQUINE = 'EQUINE',
  CANINE = 'CANINE'
}

export enum ApptStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  IN_PROGRESS = 'IN_PROGRESS',
  UNAVAILABLE = 'UNAVAILABLE'
}

export enum AppointmentRequestStatus {
  PENDING = 'PENDING', // Demande initiale du patient
  PRACTITIONER_PROPOSED = 'PRACTITIONER_PROPOSED', // Praticien propose autre créneau
  PATIENT_PROPOSED = 'PATIENT_PROPOSED', // Patient propose autre créneau
  CONFIRMED = 'CONFIRMED', // Validé définitivement
  REJECTED = 'REJECTED' // Refusé
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL'
}

export interface MedicalHistory {
  lastVetVisit?: string;
  pathologies: string[]; 
  vetContact?: string; 
  farrierContact?: string;
}

export interface Patient {
  id?: number | string;
  name: string;
  ownerName?: string;
  type: PatientType;
  location: string;
  address: string;
  city?: string; // Ville (auto-rempli par Google Places)
  postalCode?: string; // Code postal (auto-rempli)
  lat?: number; // Latitude (pour optimisation tournée)
  lng?: number; // Longitude (pour optimisation tournée)
  phone?: string;
  email?: string;
  lastVisit?: string;
  avatarUrl?: string;
  medicalHistory?: MedicalHistory;
  distanceKm?: number;
  customTariffs?: Record<string, number>;
  tags?: string[]; // Tags: VIP, REGULIER, SPORTIF, SENIOR, RISQUE, etc.
  notes?: string; // Notes privées
}

// ✅ Compte patient (Option B) pour dashboard patient
export interface PatientAccount {
  id?: number;
  patientId: number; // Lien avec Patient
  email: string;
  passwordHash: string; // Hash bcrypt du mot de passe
  createdAt: string;
  lastLoginAt?: string;
}

export interface Appointment {
  id?: number | string;
  patientId: string | number;
  startTime: string;
  durationMin: number;
  status: ApptStatus;
  type: 'CABINET' | 'DOMICILE' | 'STABLE' | 'BLOCK';
  notes?: string;
  weather?: {
    temp: number;
    condition: 'sunny' | 'rain' | 'cloudy' | 'storm';
  };
  price: number;
  travelFee?: number;
  distanceKm?: number;
  travelDurationMin?: number;
  isOptimizedSlot?: boolean; // Si créneau suggéré par optimisation tournée
  googleEventId?: string; // ✅ ID événement Google Calendar pour sync bidirectionnelle
}

export interface AppointmentRequest {
  id?: number | string;
  patientId: string | number;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  requestedStartTime: string; // Créneau demandé
  durationMin: number;
  type: 'CABINET' | 'DOMICILE' | 'STABLE';
  status: AppointmentRequestStatus;
  notes?: string;
  proposedStartTime?: string; // Créneau proposé en alternative
  proposedBy?: 'PATIENT' | 'PRACTITIONER'; // Qui a proposé l'alternative
  history: AppointmentRequestHistoryItem[]; // Historique des échanges
  createdAt: string;
  updatedAt: string;
  patientAddress?: string; // Pour calcul optimisation
  patientLat?: number;
  patientLng?: number;
  validationToken?: string; // ✅ Token pour validation par email (Option A)
  validated?: boolean; // ✅ Si le créneau a été validé par le patient
}

export interface AppointmentRequestHistoryItem {
  date: string;
  action: 'CREATED' | 'PROPOSED_ALT' | 'ACCEPTED' | 'REJECTED';
  by: 'PATIENT' | 'PRACTITIONER';
  message?: string;
  proposedTime?: string;
}

export interface Notification {
  id?: number;
  type: 'EMAIL' | 'SMS' | 'BOTH';
  recipient: string; // email ou phone
  subject?: string; // Pour email
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
  error?: string;
  relatedRequestId?: number | string;
}

export interface TensionPoint {
  id: string;
  x: number;
  y: number;
  level: number; 
  notes: string;
}

export interface SessionDocument {
  id: string;
  name: string;
  type: 'IMAGE' | 'PDF' | 'VIDEO';
  url: string;
  date: string;
}

export interface Session {
  id?: number;
  patientId: number | string;
  appointmentId?: number | string;
  date: string;
  type: string; 
  anamnesis: Record<string, string>;
  tensions: TensionPoint[];
  treatmentNotes: string;
  exercises: string[];
  documents: SessionDocument[];
  price: number;
  practitionerNotes?: string;
}

export interface PaymentRecord {
  date: string;
  amount: number;
  method: string;
}

export interface ReminderRecord {
  date: string;
  stage: 'J+7' | 'J+15' | 'J+30' | 'J+45' | 'J+60_FORMAL';
  message: string;
  method: 'EMAIL' | 'SMS' | 'MAIL';
}

export interface Invoice {
  id?: number | string;
  number: string;
  date: string;
  dueDate: string;
  patientName: string;
  amountHT: number;
  vatRate: number;
  amountTTC: number;
  amountPaid: number;
  status: InvoiceStatus;
  items: { description: string; price: number }[];
  reminderSentAt?: string; // Legacy field - will be replaced by reminders array
  reminders?: ReminderRecord[]; // New multi-stage reminder tracking
  payments?: PaymentRecord[];
}

export interface RecurringInvoice {
  id?: number | string;
  patientName: string;
  subscriptionType: string; // ex: "Suivi mensuel", "Abonnement hebdomadaire"
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  amountHT: number;
  vatRate: number;
  items: { description: string; price: number }[];
  startDate: string;
  nextDueDate: string;
  endDate?: string;
  isActive: boolean;
  lastGeneratedDate?: string;
  totalGenerated?: number; // Nombre de factures générées
}

export interface Expense {
  id?: number | string;
  date: string;
  category: 'CARBURANT' | 'MATERIEL' | 'FORMATION' | 'ASSURANCES' | 'LOYER' | 'AUTRE';
  description: string;
  amount: number;
  receiptUrl?: string; // URL ou nom du fichier reçu
  notes?: string;
}

export interface BrandingConfig {
  primaryColor: string;
  logoUrl: string;
}

export interface SocialConfig {
    instagramHandle: string;
    facebookPage: string;
}

export interface ReminderStageConfig {
    stage: 'J+7' | 'J+15' | 'J+30' | 'J+45' | 'J+60_FORMAL';
    daysAfterDue: number;
    message: string;
    enabled: boolean;
}

export interface FinanceSettings {
    firstReminderDays: number; // Legacy
    nextReminderFreq: number; // Legacy
    reminderStages?: ReminderStageConfig[]; // New multi-stage system
}

export interface GoogleConfig {
  clientId: string;
  apiKey: string;
  accessToken?: string;
  tokenExpiry?: number;
}

export interface SMSTemplate {
  id: string;
  name: string;
  trigger: 'REMINDER_J1' | 'REMINDER_H2' | 'POST_SESSION' | 'BIRTHDAY' | 'CUSTOM';
  message: string;
  enabled: boolean;
}

export interface SMSLog {
  id?: number;
  date: string;
  patientName: string;
  phone: string;
  message: string;
  trigger: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
}

export interface SMSConfig {
  enabled: boolean;
  templates: SMSTemplate[];
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'NPS' | 'RATING' | 'TEXT' | 'YES_NO';
  required: boolean;
}

export interface SurveyResponse {
  id?: number;
  sessionId?: number | string;
  patientId: number | string;
  patientName: string;
  date: string;
  npsScore?: number; // 0-10
  rating?: number; // 1-5 stars
  answers: Record<string, string | number>;
  feedback: string;
  wouldRecommend: boolean;
}

export interface SurveyConfig {
  enabled: boolean;
  sendAfterSession: boolean;
  questions: SurveyQuestion[];
}

export interface Goal {
  id?: number;
  type: 'REVENUE' | 'SESSIONS' | 'NEW_PATIENTS' | 'CUSTOM';
  name: string;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  unit: 'EUR' | 'COUNT' | 'PERCENT';
}

export interface LoyaltyCard {
  id?: number;
  patientId: number | string;
  patientName: string;
  type: 'STAMP_CARD' | 'POINTS'; // Carte 10 séances ou Points
  currentCount: number; // Séances effectuées ou points
  targetCount: number; // Ex: 10 pour carte gratuite
  createdDate: string;
  expiryDate?: string;
  isActive: boolean;
  rewardClaimed: boolean;
}

export interface LoyaltyTransaction {
  id?: number;
  cardId: number;
  patientId: number | string;
  date: string;
  type: 'EARN' | 'REDEEM';
  points: number;
  description: string;
}

export interface Referral {
  id?: number;
  referrerId: number | string; // Patient qui parraine
  referrerName: string;
  referredId?: number | string; // Patient parrainé
  referredName: string;
  referredPhone?: string;
  referredEmail?: string;
  status: 'PENDING' | 'COMPLETED' | 'REWARDED';
  createdDate: string;
  completedDate?: string;
  referrerReward: number; // Récompense en €
  referredReward: number;
}

export interface Promotion {
  id?: number;
  name: string;
  code?: string; // Code promo
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SESSION';
  value: number; // Ex: 20 pour 20% ou 10 pour 10€
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number; // Nombre max d'utilisations
  usageCount: number; // Nombre d'utilisations
  targetSegment?: string; // Ex: "VIP", "NEW", "ALL"
  minPurchase?: number; // Montant minimum requis
}

export interface AppSettings {
  id?: number;
  appName: string;
  practitionerName: string;
  practitionerEmail?: string; // ✅ Email praticien pour notifications
  practitionerPhone?: string; // ✅ Téléphone praticien pour SMS notifications
  cabinetAddress: string;
  kmRate: number;
  defaultTariffs: {
    HUMAN_KINESIO: number;
    EQUINE_KINESIO: number;
    CANINE_KINESIO: number;
    MASSAGE: number;
  };
  finance?: FinanceSettings;
  social: SocialConfig;
  branding: BrandingConfig;
  google?: GoogleConfig;
  sms?: SMSConfig;
  survey?: SurveyConfig;
}