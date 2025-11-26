/**
 * Service d'Audit Trail - Traçabilité complète des actions (RGPD)
 */

export interface AuditEvent {
  id: number;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  entity: 'patient' | 'appointment' | 'invoice' | 'expense' | 'settings' | 'user' | 'system';
  entityId?: number | string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'info' | 'warning' | 'critical';
}

class AuditTrailService {
  private events: AuditEvent[] = [];
  private readonly MAX_EVENTS = 10000; // Limite en mémoire
  private readonly STORAGE_KEY = 'theraflow_audit_trail';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Enregistre un événement d'audit
   */
  log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>) {
    const auditEvent: AuditEvent = {
      ...event,
      id: Date.now(),
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    this.events.unshift(auditEvent);

    // Limiter la taille
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    this.saveToStorage();

    // Log en console en développement
    if (import.meta.env.DEV) {
      console.log('[AUDIT]', auditEvent);
    }

    return auditEvent;
  }

  /**
   * Récupère les événements avec filtres
   */
  getEvents(filters?: {
    userId?: string;
    entity?: AuditEvent['entity'];
    action?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: AuditEvent['severity'];
  }): AuditEvent[] {
    let filtered = [...this.events];

    if (filters?.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }

    if (filters?.entity) {
      filtered = filtered.filter(e => e.entity === filters.entity);
    }

    if (filters?.action) {
      filtered = filtered.filter(e => e.action.includes(filters.action));
    }

    if (filters?.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
    }

    if (filters?.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    return filtered;
  }

  /**
   * Enregistre une création
   */
  logCreate(entity: AuditEvent['entity'], entityId: number | string, userId: string, userName: string, data?: any) {
    return this.log({
      userId,
      userName,
      action: `create_${entity}`,
      entity,
      entityId,
      metadata: data,
      severity: 'info'
    });
  }

  /**
   * Enregistre une modification
   */
  logUpdate(
    entity: AuditEvent['entity'],
    entityId: number | string,
    userId: string,
    userName: string,
    changes: AuditEvent['changes']
  ) {
    return this.log({
      userId,
      userName,
      action: `update_${entity}`,
      entity,
      entityId,
      changes,
      severity: 'info'
    });
  }

  /**
   * Enregistre une suppression
   */
  logDelete(entity: AuditEvent['entity'], entityId: number | string, userId: string, userName: string) {
    return this.log({
      userId,
      userName,
      action: `delete_${entity}`,
      entity,
      entityId,
      severity: 'warning'
    });
  }

  /**
   * Enregistre un accès/lecture
   */
  logAccess(entity: AuditEvent['entity'], entityId: number | string, userId: string, userName: string) {
    return this.log({
      userId,
      userName,
      action: `access_${entity}`,
      entity,
      entityId,
      severity: 'info'
    });
  }

  /**
   * Enregistre une action critique
   */
  logCritical(action: string, userId: string, userName: string, metadata?: Record<string, any>) {
    return this.log({
      userId,
      userName,
      action,
      entity: 'system',
      metadata,
      severity: 'critical'
    });
  }

  /**
   * Exporte l'audit trail en CSV
   */
  exportToCSV(filters?: Parameters<typeof this.getEvents>[0]): string {
    const events = this.getEvents(filters);

    const headers = ['ID', 'Date/Heure', 'Utilisateur', 'Action', 'Entité', 'Entité ID', 'Sévérité', 'IP', 'User Agent'];
    const rows = events.map(e => [
      e.id,
      e.timestamp.toISOString(),
      `${e.userName} (${e.userId})`,
      e.action,
      e.entity,
      e.entityId || '',
      e.severity,
      e.ipAddress || '',
      e.userAgent || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Télécharge l'audit trail en CSV
   */
  downloadCSV(filters?: Parameters<typeof this.getEvents>[0]) {
    const csv = this.exportToCSV(filters);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Récupère les statistiques
   */
  getStats() {
    return {
      total: this.events.length,
      today: this.events.filter(e => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return e.timestamp >= today;
      }).length,
      byEntity: this.events.reduce((acc, e) => {
        acc[e.entity] = (acc[e.entity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: this.events.reduce((acc, e) => {
        acc[e.severity] = (acc[e.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Sauvegarde dans localStorage
   */
  private saveToStorage() {
    try {
      // Sauvegarder seulement les 1000 derniers événements
      const toSave = this.events.slice(0, 1000);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.warn('Audit Trail: Impossible de sauvegarder', error);
    }
  }

  /**
   * Charge depuis localStorage
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.events = parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Audit Trail: Impossible de charger', error);
    }
  }

  /**
   * Récupère l'IP du client (approximation)
   */
  private getClientIP(): string {
    // En production, l'IP devrait venir du backend
    return 'N/A';
  }

  /**
   * Nettoie les anciens événements
   */
  cleanup(olderThanDays: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const before = this.events.length;
    this.events = this.events.filter(e => e.timestamp >= cutoffDate);
    const removed = before - this.events.length;

    this.saveToStorage();

    return { removed, remaining: this.events.length };
  }
}

export default new AuditTrailService();
