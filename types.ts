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
  phone?: string;
  email?: string;
  lastVisit?: string;
  avatarUrl?: string;
  medicalHistory?: MedicalHistory;
  distanceKm?: number;
  customTariffs?: Record<string, number>; 
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
  reminderSentAt?: string;
  payments?: PaymentRecord[];
}

export interface Expense {
  id?: number | string;
  date: string;
  category: 'MATERIEL' | 'DEPLACEMENT' | 'FORMATION' | 'AUTRE';
  description: string;
  amount: number;
}

export interface BrandingConfig {
  primaryColor: string;
  logoUrl: string;
}

export interface SocialConfig {
    instagramHandle: string;
    facebookPage: string;
}

export interface FinanceSettings {
    firstReminderDays: number;
    nextReminderFreq: number;
}

export interface GoogleConfig {
  clientId: string;
  apiKey: string;
  accessToken?: string;
  tokenExpiry?: number;
}

export interface AppSettings {
  id?: number;
  appName: string; 
  practitionerName: string; 
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
}