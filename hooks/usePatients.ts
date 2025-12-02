import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Patient } from '../types';

/**
 * Hook personnalisé pour gérer les patients avec Supabase
 */
export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les patients au montage
  useEffect(() => {
    loadPatients();
  }, []);

  // Fonction pour charger tous les patients de l'utilisateur connecté
  const loadPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPatients(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des patients:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ajouter un patient
  const addPatient = async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Utilisateur non connecté');

      const { data, error: insertError } = await supabase
        .from('patients')
        .insert([{
          ...patient,
          user_id: userData.user.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Ajouter le nouveau patient à la liste locale
      setPatients(prev => [data, ...prev]);

      return { data, error: null };
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du patient:', err);
      return { data: null, error: err.message };
    }
  };

  // Fonction pour mettre à jour un patient
  const updatePatient = async (id: number, updates: Partial<Patient>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Mettre à jour la liste locale
      setPatients(prev => prev.map(p => p.id === id ? data : p));

      return { data, error: null };
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du patient:', err);
      return { data: null, error: err.message };
    }
  };

  // Fonction pour supprimer un patient
  const deletePatient = async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Supprimer de la liste locale
      setPatients(prev => prev.filter(p => p.id !== id));

      return { error: null };
    } catch (err: any) {
      console.error('Erreur lors de la suppression du patient:', err);
      return { error: err.message };
    }
  };

  return {
    patients,
    isLoading,
    error,
    addPatient,
    updatePatient,
    deletePatient,
    refreshPatients: loadPatients
  };
};
