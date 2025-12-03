import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import {
  Patient,
  Appointment,
  Invoice,
  RecurringInvoice,
  Expense,
  Session,
  SMSLog,
  SurveyResponse,
  Goal,
  LoyaltyCard,
  LoyaltyTransaction,
  Referral,
  Promotion,
  AppSettings
} from '../types';

/**
 * Hook générique pour charger et gérer les données Supabase
 */
function useSupabaseData<T>(
  loadFn: () => Promise<T[]>,
  deleteFn?: (id: number) => Promise<void>,
  updateFn?: (id: number, updates: Partial<T>) => Promise<void>
) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await loadFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const deleteItem = async (id: number) => {
    if (!deleteFn) throw new Error('Delete function not provided');
    await deleteFn(id);
    await loadData(); // Refresh data after delete
  };

  const updateItem = async (id: number, updates: Partial<T>) => {
    if (!updateFn) throw new Error('Update function not provided');
    await updateFn(id, updates);
    await loadData(); // Refresh data after update
  };

  return {
    data,
    isLoading,
    error,
    reload: loadData,
    deleteItem: deleteFn ? deleteItem : undefined,
    updateItem: updateFn ? updateItem : undefined
  };
}

/**
 * Hooks spécialisés pour chaque type de données
 */
export function usePatients() {
  return useSupabaseData<Patient>(
    () => dataService.getPatients(),
    (id) => dataService.deletePatient(id),
    (id, updates) => dataService.updatePatient(id, updates)
  );
}

export function useAppointments() {
  return useSupabaseData<Appointment>(
    () => dataService.getAppointments(),
    (id) => dataService.deleteAppointment(id),
    (id, updates) => dataService.updateAppointment(id, updates)
  );
}

export function useInvoices() {
  return useSupabaseData<Invoice>(
    () => dataService.getInvoices(),
    undefined, // No delete for invoices (business rule)
    (id, updates) => dataService.updateInvoice(id, updates)
  );
}

export function useRecurringInvoices() {
  return useSupabaseData<RecurringInvoice>(
    () => dataService.getRecurringInvoices(),
    undefined,
    (id, updates) => dataService.updateRecurringInvoice(id, updates)
  );
}

export function useExpenses() {
  return useSupabaseData<Expense>(
    () => dataService.getExpenses(),
    undefined,
    (id, updates) => dataService.updateExpense(id, updates)
  );
}

export function useSessions() {
  return useSupabaseData<Session>(
    () => dataService.getSessions(),
    undefined,
    (id, updates) => dataService.updateSession(id, updates)
  );
}

export function useSMSLogs() {
  return useSupabaseData<SMSLog>(
    () => dataService.getSMSLogs(),
    undefined,
    undefined
  );
}

export function useSurveyResponses() {
  return useSupabaseData<SurveyResponse>(
    () => dataService.getSurveyResponses(),
    undefined,
    undefined
  );
}

export function useGoals() {
  return useSupabaseData<Goal>(
    () => dataService.getGoals(),
    undefined,
    (id, updates) => dataService.updateGoal(id, updates)
  );
}

export function useLoyaltyCards() {
  return useSupabaseData<LoyaltyCard>(
    () => dataService.getLoyaltyCards(),
    undefined,
    (id, updates) => dataService.updateLoyaltyCard(id, updates)
  );
}

export function useLoyaltyTransactions() {
  return useSupabaseData<LoyaltyTransaction>(
    () => dataService.getLoyaltyTransactions(),
    undefined,
    undefined
  );
}

export function useReferrals() {
  return useSupabaseData<Referral>(
    () => dataService.getReferrals(),
    undefined,
    (id, updates) => dataService.updateReferral(id, updates)
  );
}

export function usePromotions() {
  return useSupabaseData<Promotion>(
    () => dataService.getPromotions(),
    undefined,
    (id, updates) => dataService.updatePromotion(id, updates)
  );
}

export function useSettings() {
  return useSupabaseData<AppSettings>(
    () => dataService.getSettings(),
    undefined,
    (id, updates) => dataService.updateSettings(id, updates)
  );
}
