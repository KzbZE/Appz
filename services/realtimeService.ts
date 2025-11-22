import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type TableName =
  | 'patients'
  | 'appointments'
  | 'invoices'
  | 'recurring_invoices'
  | 'expenses'
  | 'sessions'
  | 'sms_logs'
  | 'survey_responses'
  | 'goals'
  | 'loyalty_cards'
  | 'loyalty_transactions'
  | 'referrals'
  | 'promotions'
  | 'settings';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  table: string;
  schema: string;
}

/**
 * Service de synchronisation temps réel Supabase
 * Permet d'écouter les changements de base de données en temps réel
 */
export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Écouter les changements sur une table spécifique
   */
  subscribeToTable<T = any>(
    tableName: TableName,
    event: RealtimeEvent = '*',
    callback: (payload: RealtimePayload<T>) => void
  ): () => void {
    const channelName = `${tableName}_${event}_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table: tableName
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            table: payload.table,
            schema: payload.schema
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Retourne une fonction de cleanup
    return () => {
      this.unsubscribe(channelName);
    };
  }

  /**
   * Écouter les changements sur plusieurs tables
   */
  subscribeToTables(
    tables: TableName[],
    callback: (payload: RealtimePayload) => void
  ): () => void {
    const unsubscribers = tables.map(table =>
      this.subscribeToTable(table, '*', callback)
    );

    // Retourne une fonction qui désinscrit de toutes les tables
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Écouter spécifiquement les insertions
   */
  onInsert<T = any>(
    tableName: TableName,
    callback: (record: T) => void
  ): () => void {
    return this.subscribeToTable<T>(tableName, 'INSERT', (payload) => {
      callback(payload.new);
    });
  }

  /**
   * Écouter spécifiquement les mises à jour
   */
  onUpdate<T = any>(
    tableName: TableName,
    callback: (newRecord: T, oldRecord: T) => void
  ): () => void {
    return this.subscribeToTable<T>(tableName, 'UPDATE', (payload) => {
      callback(payload.new, payload.old);
    });
  }

  /**
   * Écouter spécifiquement les suppressions
   */
  onDelete<T = any>(
    tableName: TableName,
    callback: (record: T) => void
  ): () => void {
    return this.subscribeToTable<T>(tableName, 'DELETE', (payload) => {
      callback(payload.old);
    });
  }

  /**
   * Écouter les changements d'un patient spécifique
   */
  subscribeToPatient(
    patientId: number,
    callback: (payload: RealtimePayload) => void
  ): () => void {
    const channelName = `patient_${patientId}_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `id=eq.${patientId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      this.unsubscribe(channelName);
    };
  }

  /**
   * Écouter les rendez-vous d'une date spécifique
   */
  subscribeToAppointmentsByDate(
    date: string,
    callback: (payload: RealtimePayload) => void
  ): () => void {
    const channelName = `appointments_${date}_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `start_time=gte.${date}T00:00:00`
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      this.unsubscribe(channelName);
    };
  }

  /**
   * Broadcast personnalisé (présence, messages, etc.)
   */
  createPresenceChannel(
    channelName: string,
    onJoin?: (presence: any) => void,
    onLeave?: (presence: any) => void
  ): RealtimeChannel {
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: 'user_id'
        }
      }
    });

    if (onJoin) {
      channel.on('presence', { event: 'join' }, onJoin);
    }

    if (onLeave) {
      channel.on('presence', { event: 'leave' }, onLeave);
    }

    channel.subscribe();
    this.channels.set(channelName, channel);

    return channel;
  }

  /**
   * Envoyer un message broadcast
   */
  async broadcast(
    channelName: string,
    event: string,
    payload: any
  ): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event,
        payload
      });
    }
  }

  /**
   * Se désinscrire d'un channel spécifique
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Se désinscrire de tous les channels
   */
  async unsubscribeAll(): Promise<void> {
    const promises = Array.from(this.channels.keys()).map(name =>
      this.unsubscribe(name)
    );
    await Promise.all(promises);
  }

  /**
   * Obtenir le nombre de channels actifs
   */
  getActiveChannelsCount(): number {
    return this.channels.size;
  }

  /**
   * Obtenir la liste des channels actifs
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Hook React pour utiliser facilement le temps réel
export const useRealtimeSubscription = <T = any>(
  tableName: TableName,
  callback: (payload: RealtimePayload<T>) => void,
  dependencies: any[] = []
) => {
  React.useEffect(() => {
    const unsubscribe = realtimeService.subscribeToTable<T>(tableName, '*', callback);

    return () => {
      unsubscribe();
    };
  }, dependencies);
};

// Import React pour le hook
import React from 'react';
