import { useState, useEffect, useRef } from 'react';
import { supabase, toCamelCase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook similaire à useLiveQuery de Dexie mais utilisant Supabase
 * Écoute les changements en temps réel et retourne les données mises à jour
 */
export function useSupabaseQuery<T>(
  tableName: string,
  queryFn?: (query: any) => any,
  deps: any[] = []
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        let query = supabase.from(tableName).select('*');

        // Appliquer les modifications de requête si fournie
        if (queryFn) {
          query = queryFn(query);
        }

        const { data: result, error } = await query;

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          return;
        }

        if (isMounted) {
          // Convertir snake_case vers camelCase
          const camelData = result ? toCamelCase(result) : undefined;
          setData(camelData as T);
        }
      } catch (err) {
        console.error(`Error in useSupabaseQuery for ${tableName}:`, err);
      }
    };

    // Fetch initial
    fetchData();

    // S'abonner aux changements en temps réel
    channelRef.current = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log(`Change in ${tableName}:`, payload);
          // Refetch les données quand il y a un changement
          fetchData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tableName, ...deps]);

  return data;
}

/**
 * Hook pour récupérer un seul enregistrement
 */
export function useSupabaseQuerySingle<T>(
  tableName: string,
  id: number | string
): T | undefined {
  return useSupabaseQuery<T[]>(
    tableName,
    (query) => query.eq('id', id).single(),
    [id]
  ) as any;
}

/**
 * Hook pour récupérer avec filtre
 */
export function useSupabaseQueryFiltered<T>(
  tableName: string,
  filterFn: (query: any) => any,
  deps: any[] = []
): T | undefined {
  return useSupabaseQuery<T>(tableName, filterFn, deps);
}
