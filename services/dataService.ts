import { supabase, toSnakeCase, toCamelCase } from '../lib/supabase';
import {
  Patient,
  Appointment,
  Invoice,
  RecurringInvoice,
  Expense,
  AppSettings,
  Session,
  SMSLog,
  SurveyResponse,
  Goal,
  LoyaltyCard,
  LoyaltyTransaction,
  Referral,
  Promotion,
  AppointmentRequest,
  Notification
} from '../types';

/**
 * Service centralisé pour toutes les opérations de données via Supabase
 * Remplace les appels directs à db.* de Dexie
 */
export class DataService {
  // ========== PATIENTS ==========

  async getPatients(): Promise<Patient[]> {
    const { data, error } = await supabase.from('patients').select('*').order('name');
    if (error) throw error;
    return toCamelCase(data) as Patient[];
  }

  async getPatient(id: number): Promise<Patient | null> {
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
    if (error) throw error;
    return toCamelCase(data) as Patient;
  }

  async getPatientByPhone(phone: string): Promise<Patient[]> {
    const { data, error } = await supabase.from('patients').select('*').eq('phone', phone);
    if (error) throw error;
    return toCamelCase(data) as Patient[];
  }

  async createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('patients')
      .insert([toSnakeCase(patient)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updatePatient(id: number, updates: Partial<Patient>): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  async deletePatient(id: number): Promise<void> {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
  }

  // ========== APPOINTMENTS ==========

  async getAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase.from('appointments').select('*').order('start_time');
    if (error) throw error;
    return toCamelCase(data) as Appointment[];
  }

  async getAppointment(id: number): Promise<Appointment | null> {
    const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
    if (error) throw error;
    return toCamelCase(data) as Appointment;
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('appointments')
      .insert([toSnakeCase(appointment)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  async deleteAppointment(id: number): Promise<void> {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  }

  // ========== APPOINTMENT REQUESTS ==========

  async getAppointmentRequests(): Promise<AppointmentRequest[]> {
    const { data, error } = await supabase
      .from('appointment_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as AppointmentRequest[];
  }

  async getPendingAppointmentRequests(): Promise<AppointmentRequest[]> {
    const { data, error } = await supabase
      .from('appointment_requests')
      .select('*')
      .in('status', ['PENDING', 'PRACTITIONER_PROPOSED', 'PATIENT_PROPOSED'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as AppointmentRequest[];
  }

  async getAppointmentRequest(id: number): Promise<AppointmentRequest | null> {
    const { data, error } = await supabase
      .from('appointment_requests')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return toCamelCase(data) as AppointmentRequest;
  }

  async createAppointmentRequest(
    request: Omit<AppointmentRequest, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> {
    const { data, error } = await supabase
      .from('appointment_requests')
      .insert([toSnakeCase(request)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateAppointmentRequest(id: number, updates: Partial<AppointmentRequest>): Promise<void> {
    const updateData = {
      ...toSnakeCase(updates),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from('appointment_requests')
      .update(updateData)
      .eq('id', id);
    if (error) throw error;
  }

  // ========== INVOICES ==========

  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase.from('invoices').select('*').order('date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as Invoice[];
  }

  async getInvoice(id: number): Promise<Invoice | null> {
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
    if (error) throw error;
    return toCamelCase(data) as Invoice;
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('invoices')
      .insert([toSnakeCase(invoice)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  // ========== RECURRING INVOICES ==========

  async getRecurringInvoices(): Promise<RecurringInvoice[]> {
    const { data, error } = await supabase.from('recurring_invoices').select('*').order('next_due_date');
    if (error) throw error;
    return toCamelCase(data) as RecurringInvoice[];
  }

  async createRecurringInvoice(invoice: Omit<RecurringInvoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('recurring_invoices')
      .insert([toSnakeCase(invoice)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateRecurringInvoice(id: number, updates: Partial<RecurringInvoice>): Promise<void> {
    const { error } = await supabase
      .from('recurring_invoices')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  // ========== EXPENSES ==========

  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as Expense[];
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('expenses')
      .insert([toSnakeCase(expense)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateExpense(id: number, updates: Partial<Expense>): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  // ========== SESSIONS ==========

  async getSessions(): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*').order('date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as Session[];
  }

  async getSessionsByPatient(patientId: number): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as Session[];
  }

  async createSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('sessions')
      .insert([toSnakeCase(session)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateSession(id: number, updates: Partial<Session>): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  // ========== SMS LOGS ==========

  async getSMSLogs(): Promise<SMSLog[]> {
    const { data, error } = await supabase.from('sms_logs').select('*').order('date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as SMSLog[];
  }

  async createSMSLog(log: Omit<SMSLog, 'id' | 'createdAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('sms_logs')
      .insert([toSnakeCase(log)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  // ========== SURVEY RESPONSES ==========

  async getSurveyResponses(): Promise<SurveyResponse[]> {
    const { data, error } = await supabase.from('survey_responses').select('*').order('date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as SurveyResponse[];
  }

  async createSurveyResponse(response: Omit<SurveyResponse, 'id' | 'createdAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('survey_responses')
      .insert([toSnakeCase(response)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  // ========== GOALS ==========

  async getGoals(): Promise<Goal[]> {
    const { data, error } = await supabase.from('goals').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as Goal[];
  }

  async createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('goals')
      .insert([toSnakeCase(goal)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  // ========== LOYALTY ==========

  async getLoyaltyCards(): Promise<LoyaltyCard[]> {
    const { data, error } = await supabase.from('loyalty_cards').select('*').order('created_date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as LoyaltyCard[];
  }

  async createLoyaltyCard(card: Omit<LoyaltyCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('loyalty_cards')
      .insert([toSnakeCase(card)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateLoyaltyCard(id: number, updates: Partial<LoyaltyCard>): Promise<void> {
    const { error } = await supabase
      .from('loyalty_cards')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  async getLoyaltyTransactions(): Promise<LoyaltyTransaction[]> {
    const { data, error } = await supabase.from('loyalty_transactions').select('*').order('date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as LoyaltyTransaction[];
  }

  async createLoyaltyTransaction(transaction: Omit<LoyaltyTransaction, 'id' | 'createdAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .insert([toSnakeCase(transaction)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  // ========== REFERRALS ==========

  async getReferrals(): Promise<Referral[]> {
    const { data, error } = await supabase.from('referrals').select('*').order('created_date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as Referral[];
  }

  async createReferral(referral: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('referrals')
      .insert([toSnakeCase(referral)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateReferral(id: number, updates: Partial<Referral>): Promise<void> {
    const { error } = await supabase
      .from('referrals')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  // ========== PROMOTIONS ==========

  async getPromotions(): Promise<Promotion[]> {
    const { data, error } = await supabase.from('promotions').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return toCamelCase(data) as Promotion[];
  }

  async createPromotion(promotion: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('promotions')
      .insert([toSnakeCase(promotion)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updatePromotion(id: number, updates: Partial<Promotion>): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  // ========== SETTINGS ==========

  async getSettings(): Promise<AppSettings[]> {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    return toCamelCase(data) as AppSettings[];
  }

  async getFirstSettings(): Promise<AppSettings | null> {
    const { data, error } = await supabase.from('settings').select('*').limit(1).single();
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return toCamelCase(data) as AppSettings;
  }

  async createSettings(settings: Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('settings')
      .insert([toSnakeCase(settings)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateSettings(id: number, updates: Partial<AppSettings>): Promise<void> {
    const { error } = await supabase
      .from('settings')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  // ========== NOTIFICATIONS ==========

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<number> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([toSnakeCase(notification)])
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateNotification(id: number, updates: Partial<Notification>): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update(toSnakeCase(updates))
      .eq('id', id);
    if (error) throw error;
  }

  // ========== UTILITIES ==========

  /**
   * Compte le nombre d'enregistrements dans une table
   */
  async count(tableName: string): Promise<number> {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  }

  /**
   * Vérifie si une table contient des données
   */
  async hasData(tableName: string): Promise<boolean> {
    const count = await this.count(tableName);
    return count > 0;
  }
}

// Export singleton instance
export const dataService = new DataService();
