import Dexie, { Table } from 'dexie';
import { Patient, Appointment, Invoice, Expense, AppSettings, PatientType, ApptStatus, InvoiceStatus, Session } from './types';

class TheraFlowDB extends Dexie {
  patients!: Table<Patient>;
  appointments!: Table<Appointment>;
  invoices!: Table<Invoice>;
  expenses!: Table<Expense>;
  settings!: Table<AppSettings>;
  sessions!: Table<Session>;

  constructor() {
    super('TheraFlowDB');
    (this as any).version(1).stores({
      patients: '++id, name, type',
      appointments: '++id, patientId, startTime, status',
      invoices: '++id, number, status, patientName',
      expenses: '++id, date, category',
      settings: '++id',
      sessions: '++id, patientId, date, type'
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
            nextReminderFreq: 7
        },
        social: {
            instagramHandle: '@equimotion_pro',
            facebookPage: 'EquiMotion Cabinet'
        },
        branding: {
            primaryColor: '#0f766e',
            logoUrl: 'https://cdn-icons-png.flaticon.com/512/2393/2393858.png'
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