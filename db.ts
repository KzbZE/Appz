import Dexie, { Table } from 'dexie';
import { Patient, Appointment, Invoice, RecurringInvoice, Expense, AppSettings, PatientType, ApptStatus, InvoiceStatus, Session, SMSLog, SurveyResponse, Goal, LoyaltyCard, LoyaltyTransaction, Referral, Promotion, AppointmentRequest, Notification, PatientAccount } from './types';

class TheraFlowDB extends Dexie {
  patients!: Table<Patient>;
  appointments!: Table<Appointment>;
  invoices!: Table<Invoice>;
  recurringInvoices!: Table<RecurringInvoice>;
  expenses!: Table<Expense>;
  settings!: Table<AppSettings>;
  sessions!: Table<Session>;
  smsLogs!: Table<SMSLog>;
  surveyResponses!: Table<SurveyResponse>;
  goals!: Table<Goal>;
  loyaltyCards!: Table<LoyaltyCard>;
  loyaltyTransactions!: Table<LoyaltyTransaction>;
  referrals!: Table<Referral>;
  promotions!: Table<Promotion>;
  appointmentRequests!: Table<AppointmentRequest>;
  notifications!: Table<Notification>;
  patientAccounts!: Table<PatientAccount>;

  constructor() {
    super('TheraFlowDB');
    // Version 7: Ajout appointmentRequests, notifications, GPS (lat/lng), isOptimizedSlot
    (this as any).version(7).stores({
      patients: '++id, name, type, lat, lng',
      appointments: '++id, patientId, startTime, status, isOptimizedSlot',
      invoices: '++id, number, status, patientName',
      recurringInvoices: '++id, patientName, isActive, nextDueDate',
      expenses: '++id, date, category',
      settings: '++id',
      sessions: '++id, patientId, date, type',
      smsLogs: '++id, date, status',
      surveyResponses: '++id, patientId, date, npsScore',
      goals: '++id, type, period, isActive, endDate',
      loyaltyCards: '++id, patientId, isActive, type',
      loyaltyTransactions: '++id, cardId, patientId, date, type',
      referrals: '++id, referrerId, status, createdDate',
      promotions: '++id, code, isActive, startDate, endDate',
      appointmentRequests: '++id, patientId, status, requestedStartTime, createdAt',
      notifications: '++id, type, status, sentAt, relatedRequestId'
    });

    // ✅ Version 8: Ajout index googleEventId pour synchronisation Google Calendar
    (this as any).version(8).stores({
      patients: '++id, name, type, lat, lng',
      appointments: '++id, patientId, startTime, status, isOptimizedSlot, googleEventId',
      invoices: '++id, number, status, patientName',
      recurringInvoices: '++id, patientName, isActive, nextDueDate',
      expenses: '++id, date, category',
      settings: '++id',
      sessions: '++id, patientId, date, type',
      smsLogs: '++id, date, status',
      surveyResponses: '++id, patientId, date, npsScore',
      goals: '++id, type, period, isActive, endDate',
      loyaltyCards: '++id, patientId, isActive, type',
      loyaltyTransactions: '++id, cardId, patientId, date, type',
      referrals: '++id, referrerId, status, createdDate',
      promotions: '++id, code, isActive, startDate, endDate',
      appointmentRequests: '++id, patientId, status, requestedStartTime, createdAt',
      notifications: '++id, type, status, sentAt, relatedRequestId'
    });

    // ✅ Version 9: Ajout index 'phone' sur patients pour recherche dans PublicAppointmentRequest
    (this as any).version(9).stores({
      patients: '++id, name, type, lat, lng, phone',
      appointments: '++id, patientId, startTime, status, isOptimizedSlot, googleEventId',
      invoices: '++id, number, status, patientName',
      recurringInvoices: '++id, patientName, isActive, nextDueDate',
      expenses: '++id, date, category',
      settings: '++id',
      sessions: '++id, patientId, date, type',
      smsLogs: '++id, date, status',
      surveyResponses: '++id, patientId, date, npsScore',
      goals: '++id, type, period, isActive, endDate',
      loyaltyCards: '++id, patientId, isActive, type',
      loyaltyTransactions: '++id, cardId, patientId, date, type',
      referrals: '++id, referrerId, status, createdDate',
      promotions: '++id, code, isActive, startDate, endDate',
      appointmentRequests: '++id, patientId, status, requestedStartTime, createdAt',
      notifications: '++id, type, status, sentAt, relatedRequestId'
    });

    // ✅ Version 10: Ajout table patientAccounts (Option B - Dashboard patient)
    (this as any).version(10).stores({
      patients: '++id, name, type, lat, lng, phone',
      appointments: '++id, patientId, startTime, status, isOptimizedSlot, googleEventId',
      invoices: '++id, number, status, patientName',
      recurringInvoices: '++id, patientName, isActive, nextDueDate',
      expenses: '++id, date, category',
      settings: '++id',
      sessions: '++id, patientId, date, type',
      smsLogs: '++id, date, status',
      surveyResponses: '++id, patientId, date, npsScore',
      goals: '++id, type, period, isActive, endDate',
      loyaltyCards: '++id, patientId, isActive, type',
      loyaltyTransactions: '++id, cardId, patientId, date, type',
      referrals: '++id, referrerId, status, createdDate',
      promotions: '++id, code, isActive, startDate, endDate',
      appointmentRequests: '++id, patientId, status, requestedStartTime, createdAt, validationToken',
      notifications: '++id, type, status, sentAt, relatedRequestId',
      patientAccounts: '++id, patientId, email'
    });
  }

  async populate() {
    const settingsCount = await this.settings.count();
    if (settingsCount > 0) return;

    // 1. Seed Settings
    await this.settings.add({
        appName: 'EquiMotion',
        practitionerName: 'Martin Durand',
        cabinetAddress: '10 Rue de la Paix, Paris',
        kmRate: 0.50,
        defaultTariffs: {
            HUMAN_KINESIO: 60,
            EQUINE_KINESIO: 90,
            CANINE_KINESIO: 55,
            MASSAGE: 70
        },
        finance: {
            firstReminderDays: 1,
            nextReminderFreq: 7,
            reminderStages: [
                {
                    stage: 'J+7',
                    daysAfterDue: 7,
                    message: 'Bonjour,\n\nNous constatons que la facture {invoiceNumber} d\'un montant de {amount}€ n\'a pas encore été réglée.\nNous vous remercions de bien vouloir procéder au paiement dans les meilleurs délais.\n\nCordialement,\n{practitioner}',
                    enabled: true
                },
                {
                    stage: 'J+15',
                    daysAfterDue: 15,
                    message: 'Bonjour,\n\nNous vous rappelons que la facture {invoiceNumber} d\'un montant de {amount}€ reste impayée.\nMerci de régulariser votre situation rapidement.\n\nCordialement,\n{practitioner}',
                    enabled: true
                },
                {
                    stage: 'J+30',
                    daysAfterDue: 30,
                    message: 'Bonjour,\n\nMalgré nos précédentes relances, la facture {invoiceNumber} de {amount}€ n\'a toujours pas été réglée.\nNous vous demandons de procéder au paiement sous 7 jours.\n\nCordialement,\n{practitioner}',
                    enabled: true
                },
                {
                    stage: 'J+45',
                    daysAfterDue: 45,
                    message: 'DERNIERE RELANCE\n\nLa facture {invoiceNumber} de {amount}€ reste impayée malgré nos relances.\nSans règlement sous 15 jours, nous serons contraints d\'engager une procédure de recouvrement.\n\n{practitioner}',
                    enabled: true
                },
                {
                    stage: 'J+60_FORMAL',
                    daysAfterDue: 60,
                    message: 'MISE EN DEMEURE\n\nEn l\'absence de règlement de la facture {invoiceNumber} de {amount}€, nous vous mettons en demeure de procéder au paiement sous 8 jours.\nPassé ce délai, nous engagerons une procédure de recouvrement contentieux.\n\n{practitioner}',
                    enabled: false
                }
            ]
        },
        social: {
            instagramHandle: '@equimotion_pro',
            facebookPage: 'EquiMotion Cabinet'
        },
        branding: {
            primaryColor: '#0f766e',
            logoUrl: 'https://cdn-icons-png.flaticon.com/512/2393/2393858.png'
        },
        sms: {
            enabled: true,
            templates: [
                {
                    id: 'reminder_j1',
                    name: 'Rappel RDV J-1',
                    trigger: 'REMINDER_J1',
                    message: 'Bonjour {patient}, rappel de votre RDV demain à {heure} chez {praticien}. À bientôt !',
                    enabled: true
                },
                {
                    id: 'reminder_h2',
                    name: 'Rappel RDV H-2',
                    trigger: 'REMINDER_H2',
                    message: 'Bonjour {patient}, votre RDV est dans 2h chez {praticien}. À tout de suite !',
                    enabled: true
                },
                {
                    id: 'post_session',
                    name: 'Remerciement Post-Séance',
                    trigger: 'POST_SESSION',
                    message: 'Merci {patient} pour votre visite ! N\'hésitez pas à nous contacter si besoin. {praticien}',
                    enabled: true
                },
                {
                    id: 'birthday',
                    name: 'Vœux Anniversaire',
                    trigger: 'BIRTHDAY',
                    message: 'Joyeux anniversaire {patient} ! Toute l\'équipe {praticien} vous souhaite une excellente journée 🎉',
                    enabled: false
                }
            ]
        },
        survey: {
            enabled: true,
            sendAfterSession: true,
            questions: [
                {
                    id: 'nps',
                    question: 'Sur une échelle de 0 à 10, recommanderiez-vous nos services à un proche ?',
                    type: 'NPS',
                    required: true
                },
                {
                    id: 'satisfaction',
                    question: 'Comment évalueriez-vous votre satisfaction globale ?',
                    type: 'RATING',
                    required: true
                },
                {
                    id: 'pain_improvement',
                    question: 'Avez-vous ressenti une amélioration après la séance ?',
                    type: 'YES_NO',
                    required: true
                },
                {
                    id: 'feedback',
                    question: 'Avez-vous des suggestions ou commentaires pour améliorer nos services ?',
                    type: 'TEXT',
                    required: false
                }
            ]
        }
    });

    // 2. Seed Patients
    const p1 = await this.patients.add({ 
      name: 'Sophie Martin', 
      type: PatientType.HUMAN, 
      location: 'Cabinet', 
      address: '10 Rue de la Paix, Paris', 
      phone: '06 12 34 56 78', 
      email: 'sophie@gmail.com', 
      lastVisit: '2023-09-10',
      medicalHistory: { pathologies: ['Stress'] }
    } as Patient);
    
    const p2 = await this.patients.add({ 
      name: 'Mistral', 
      ownerName: 'Jean Dupont', 
      type: PatientType.EQUINE, 
      location: 'Ecuries du Val', 
      address: 'Route de la Foret, 78000', 
      distanceKm: 24, 
      medicalHistory: { 
        pathologies: ['Ulcères', 'Arthrose Jarret'], 
        lastVetVisit: '2023-08-01', 
        vetContact: 'Dr. Veto', 
        farrierContact: 'M. Fer' 
      }, 
      customTariffs: {'KINESIO': 85} 
    } as Patient);

    const p3 = await this.patients.add({ 
      name: 'Rex', 
      ownerName: 'Mme. Durand', 
      type: PatientType.CANINE, 
      location: 'Domicile', 
      address: '3 Allée des Pins, 78100', 
      distanceKm: 5, 
      medicalHistory: { 
        pathologies: [], 
        lastVetVisit: '2023-01-15' 
      } 
    } as Patient);

    // 3. Seed Appointments
    await this.appointments.bulkAdd([
        { patientId: p2, startTime: new Date().toISOString(), durationMin: 60, status: ApptStatus.SCHEDULED, type: 'STABLE', notes: 'Mistral - Ostéo Complète', weather: { temp: 14, condition: 'cloudy'}, price: 90, travelFee: 25 },
        { patientId: p1, startTime: new Date(Date.now() + 7200000).toISOString(), durationMin: 45, status: ApptStatus.SCHEDULED, type: 'CABINET', notes: 'S. Martin - Cervicales', price: 60 },
    ] as Appointment[]);

    // 4. Seed Invoices
    await this.invoices.bulkAdd([
        { number: '2023-10-01', date: '2023-10-20', dueDate: '2023-10-30', patientName: 'Jean Dupont (Mistral)', amountHT: 95.83, vatRate: 20, amountTTC: 115.00, amountPaid: 115.00, status: InvoiceStatus.PAID, items: [], payments: [{ date: '2023-10-25', amount: 115.00, method: 'TRANSFER' }] },
        { number: '2023-10-02', date: '2023-10-22', dueDate: '2023-11-05', patientName: 'Sophie Martin', amountHT: 50.00, vatRate: 0, amountTTC: 50.00, amountPaid: 0, status: InvoiceStatus.SENT, items: [], payments: [] },
    ] as Invoice[]);

    // 5. Seed Expenses
    await this.expenses.add({ date: '2023-10-01', category: 'MATERIEL', description: 'Huiles de massage', amount: 120.50 } as Expense);
  }
}

export const db = new TheraFlowDB();