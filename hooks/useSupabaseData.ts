import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook générique pour gérer les données Supabase avec RLS
 */
export const useSupabaseData = <T extends { id?: number | string }>(
  tableName: string,
  orderBy: { column: string; ascending?: boolean } = { column: 'created_at', ascending: false }
) => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Utilisateur non connecté');
      }

      const query = supabase
        .from(tableName)
        .select('*')
        .order(orderBy.column, { ascending: orderBy.ascending || false });

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData((fetchedData as T[]) || []);
    } catch (err: any) {
      console.error(`Erreur lors du chargement de ${tableName}:`, err);
      setError(err.message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter un élément
  const addItem = async (item: Omit<T, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Utilisateur non connecté');

      const { data: insertedData, error: insertError } = await supabase
        .from(tableName)
        .insert([{
          ...item,
          user_id: userData.user.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setData(prev => [insertedData as T, ...prev]);

      return { data: insertedData as T, error: null };
    } catch (err: any) {
      console.error(`Erreur lors de l'ajout dans ${tableName}:`, err);
      return { data: null, error: err.message };
    }
  };

  // Mettre à jour un élément
  const updateItem = async (id: number | string, updates: Partial<T>) => {
    try {
      const { data: updatedData, error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setData(prev => prev.map(item => item.id === id ? updatedData as T : item));

      return { data: updatedData as T, error: null };
    } catch (err: any) {
      console.error(`Erreur lors de la mise à jour dans ${tableName}:`, err);
      return { data: null, error: err.message };
    }
  };

  // Supprimer un élément
  const deleteItem = async (id: number | string) => {
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setData(prev => prev.filter(item => item.id !== id));

      return { error: null };
    } catch (err: any) {
      console.error(`Erreur lors de la suppression dans ${tableName}:`, err);
      return { error: err.message };
    }
  };

  useEffect(() => {
    loadData();
  }, [tableName]);

  return {
    data,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refresh: loadData
  };
};

// Hooks spécifiques pour chaque table
export const usePatients = () => useSupabaseData('patients', { column: 'created_at', ascending: false });
export const useAppointments = () => useSupabaseData('appointments', { column: 'start_time', ascending: false });
export const useInvoices = () => useSupabaseData('invoices', { column: 'date', ascending: false });
export const useExpenses = () => useSupabaseData('expenses', { column: 'date', ascending: false });
export const useSessions = () => useSupabaseData('sessions', { column: 'date', ascending: false });
export const useRecurringInvoices = () => useSupabaseData('recurring_invoices', { column: 'created_at', ascending: false });
export const useAppointmentRequests = () => useSupabaseData('appointment_requests', { column: 'requested_date', ascending: false });
export const useConsultationReports = () => useSupabaseData('consultation_reports', { column: 'date', ascending: false });

// Hook spécial pour settings (un seul enregistrement par utilisateur)
export const useSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Utilisateur non connecté');

      // RLS filtre automatiquement par user_id, pas besoin de .eq()
      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      // Transformer snake_case en camelCase pour le code TypeScript
      const toCamelCase = (obj: any): any => {
        if (!obj) return null;
        const camelCaseObj: any = {};
        for (const key in obj) {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          camelCaseObj[camelKey] = obj[key];
        }
        return camelCaseObj;
      };

      const normalizedData = data ? toCamelCase(data) : null;
      setSettings(normalizedData);
    } catch (err: any) {
      console.error('Erreur lors du chargement des settings:', err);
      setError(err.message);
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: any) => {
    try {
      // Transformer camelCase en snake_case pour Supabase
      const toSnakeCase = (obj: any): any => {
        const snakeCaseObj: any = {};
        for (const key in obj) {
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          snakeCaseObj[snakeKey] = obj[key];
        }
        return snakeCaseObj;
      };

      // Transformer snake_case en camelCase
      const toCamelCase = (obj: any): any => {
        if (!obj) return null;
        const camelCaseObj: any = {};
        for (const key in obj) {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          camelCaseObj[camelKey] = obj[key];
        }
        return camelCaseObj;
      };

      const snakeCaseUpdates = toSnakeCase(updates);

      if (!settings?.id) {
        // Créer si n'existe pas
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Utilisateur non connecté');

        const { data, error: insertError } = await supabase
          .from('settings')
          .insert([{ ...snakeCaseUpdates, user_id: userData.user.id }])
          .select()
          .single();

        if (insertError) throw insertError;
        const normalizedData = toCamelCase(data);
        setSettings(normalizedData);
        return { data: normalizedData, error: null };
      } else {
        // Mettre à jour
        const { data, error: updateError } = await supabase
          .from('settings')
          .update(snakeCaseUpdates)
          .eq('id', settings.id)
          .select()
          .single();

        if (updateError) throw updateError;
        const normalizedData = toCamelCase(data);
        setSettings(normalizedData);
        return { data: normalizedData, error: null };
      }
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour des settings:', err);
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refresh: loadSettings
  };
};
