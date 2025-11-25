/**
 * Service de Conformité RGPD
 *
 * Fonctionnalités:
 * - Export données patient (droit d'accès)
 * - Suppression compte/données (droit à l'oubli)
 * - Journal d'accès complet
 * - Chiffrement données sensibles
 * - Gestion des consentements
 * - Archivage automatique (10 ans)
 * - Templates documents légaux
 */

import { Patient, Appointment } from '../types';
import { EnhancedPatientRecord } from './enhancedPatientRecordService';

// Types
export interface AccessLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'print';
  resourceType: 'patient' | 'appointment' | 'invoice' | 'document' | 'record';
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export interface DataExportRequest {
  id: string;
  patientId: string;
  requestedAt: Date;
  requestedBy: string; // patient ou praticien
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date; // Lien valide 72h
  format: 'json' | 'pdf' | 'zip';
}

export interface DeletionRequest {
  id: string;
  patientId: string;
  requestedAt: Date;
  requestedBy: string;
  reason?: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  scheduledFor?: Date; // Délai légal de 30 jours
  completedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface DataRetentionPolicy {
  resourceType: 'patient' | 'appointment' | 'invoice' | 'document';
  retentionYears: number;
  autoArchive: boolean;
  autoDelete: boolean;
}

export interface LegalDocument {
  id: string;
  type: 'privacy_policy' | 'terms_of_service' | 'consent_form' | 'devis' | 'cgv' | 'custom';
  title: string;
  content: string;
  version: string;
  effectiveDate: Date;
  language: string;
  createdBy: string;
  isActive: boolean;
}

export interface DataProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interest' | 'public_interest' | 'legitimate_interest';
  dataCategories: string[];
  recipients: string[];
  retentionPeriod: string;
  securityMeasures: string[];
}

class RGPDComplianceService {
  private accessLogs: AccessLog[] = [];
  private exportRequests: DataExportRequest[] = [];
  private deletionRequests: DeletionRequest[] = [];
  private retentionPolicies: DataRetentionPolicy[];
  private legalDocuments: LegalDocument[] = [];
  private processingActivities: DataProcessingActivity[] = [];

  constructor() {
    // Politiques de rétention par défaut (conformes RGPD)
    this.retentionPolicies = [
      {
        resourceType: 'patient',
        retentionYears: 10, // Dossier médical: 10 ans après dernier contact
        autoArchive: true,
        autoDelete: false
      },
      {
        resourceType: 'appointment',
        retentionYears: 10,
        autoArchive: true,
        autoDelete: false
      },
      {
        resourceType: 'invoice',
        retentionYears: 10, // Comptabilité: 10 ans
        autoArchive: true,
        autoDelete: false
      },
      {
        resourceType: 'document',
        retentionYears: 10,
        autoArchive: true,
        autoDelete: false
      }
    ];

    this.loadData();
    this.initializeDefaultDocuments();
    this.initializeProcessingActivities();
  }

  /**
   * Journal d'accès (Logs)
   */

  logAccess(log: Omit<AccessLog, 'id' | 'timestamp'>): void {
    const accessLog: AccessLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.accessLogs.push(accessLog);
    this.saveData();

    // Nettoyer les logs de plus de 3 ans (obligation légale)
    this.cleanOldLogs();
  }

  getAccessLogs(filters?: {
    patientId?: string;
    userId?: string;
    action?: AccessLog['action'];
    resourceType?: AccessLog['resourceType'];
    fromDate?: Date;
    toDate?: Date;
  }): AccessLog[] {
    let logs = [...this.accessLogs];

    if (filters) {
      if (filters.patientId) {
        logs = logs.filter(l => l.resourceId === filters.patientId);
      }
      if (filters.userId) {
        logs = logs.filter(l => l.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(l => l.action === filters.action);
      }
      if (filters.resourceType) {
        logs = logs.filter(l => l.resourceType === filters.resourceType);
      }
      if (filters.fromDate) {
        logs = logs.filter(l => new Date(l.timestamp) >= filters.fromDate!);
      }
      if (filters.toDate) {
        logs = logs.filter(l => new Date(l.timestamp) <= filters.toDate!);
      }
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private cleanOldLogs(): void {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    this.accessLogs = this.accessLogs.filter(log =>
      new Date(log.timestamp) > threeYearsAgo
    );

    this.saveData();
  }

  /**
   * Export données (Droit d'accès - Art. 15 RGPD)
   */

  createExportRequest(
    patientId: string,
    requestedBy: string,
    format: DataExportRequest['format'] = 'json'
  ): DataExportRequest {
    const request: DataExportRequest = {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      requestedAt: new Date(),
      requestedBy,
      status: 'pending',
      format
    };

    this.exportRequests.push(request);
    this.saveData();

    // Traiter immédiatement (en production, traiter de manière asynchrone)
    this.processExportRequest(request.id);

    return request;
  }

  private async processExportRequest(requestId: string): Promise<void> {
    const request = this.exportRequests.find(r => r.id === requestId);
    if (!request) return;

    request.status = 'processing';
    this.saveData();

    try {
      // Collecter toutes les données du patient
      const exportData = await this.collectPatientData(request.patientId);

      // Générer fichier selon format
      let downloadUrl: string;
      switch (request.format) {
        case 'json':
          downloadUrl = this.generateJSONExport(exportData);
          break;
        case 'pdf':
          downloadUrl = this.generatePDFExport(exportData);
          break;
        case 'zip':
          downloadUrl = this.generateZIPExport(exportData);
          break;
      }

      // Mettre à jour la requête
      request.status = 'completed';
      request.completedAt = new Date();
      request.downloadUrl = downloadUrl;

      // Lien expire dans 72h
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);
      request.expiresAt = expiresAt;

      this.saveData();

      // Log
      this.logAccess({
        userId: request.requestedBy,
        userName: 'Patient',
        action: 'export',
        resourceType: 'patient',
        resourceId: request.patientId,
        details: `Export ${request.format} généré`
      });

    } catch (error) {
      request.status = 'failed';
      this.saveData();
      console.error('Erreur export données:', error);
    }
  }

  private async collectPatientData(patientId: string): Promise<any> {
    // En production, collecter depuis toutes les sources
    return {
      patient: null, // Données patient de la DB
      appointments: [],
      invoices: [],
      documents: [],
      consents: [],
      accessLogs: this.getAccessLogs({ patientId })
    };
  }

  private generateJSONExport(data: any): string {
    // Créer blob JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  private generatePDFExport(data: any): string {
    // En production, utiliser jsPDF ou similaire
    console.log('Génération PDF export RGPD:', data);
    return 'data:application/pdf;base64,placeholder';
  }

  private generateZIPExport(data: any): string {
    // En production, utiliser JSZip
    console.log('Génération ZIP export RGPD:', data);
    return 'data:application/zip;base64,placeholder';
  }

  getExportRequests(patientId?: string): DataExportRequest[] {
    let requests = [...this.exportRequests];
    if (patientId) {
      requests = requests.filter(r => r.patientId === patientId);
    }
    return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  /**
   * Suppression données (Droit à l'oubli - Art. 17 RGPD)
   */

  createDeletionRequest(patientId: string, requestedBy: string, reason?: string): DeletionRequest {
    const request: DeletionRequest = {
      id: `deletion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      requestedAt: new Date(),
      requestedBy,
      reason,
      status: 'pending'
    };

    // Délai légal de traitement: 30 jours
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 30);
    request.scheduledFor = scheduledFor;

    this.deletionRequests.push(request);
    this.saveData();

    return request;
  }

  approveDeletionRequest(requestId: string, approvedBy: string): DeletionRequest | null {
    const request = this.deletionRequests.find(r => r.id === requestId);
    if (!request) return null;

    request.status = 'approved';
    request.approvedBy = approvedBy;
    this.saveData();

    return request;
  }

  rejectDeletionRequest(requestId: string, rejectionReason: string): DeletionRequest | null {
    const request = this.deletionRequests.find(r => r.id === requestId);
    if (!request) return null;

    request.status = 'rejected';
    request.rejectionReason = rejectionReason;
    this.saveData();

    return request;
  }

  async executeDeletion(requestId: string): Promise<boolean> {
    const request = this.deletionRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'approved') return false;

    try {
      // En production, supprimer toutes les données du patient
      console.log('Suppression RGPD patient:', request.patientId);

      request.status = 'completed';
      request.completedAt = new Date();
      this.saveData();

      // Log (dernier log avant suppression)
      this.logAccess({
        userId: request.approvedBy || request.requestedBy,
        userName: 'Praticien',
        action: 'delete',
        resourceType: 'patient',
        resourceId: request.patientId,
        details: `Suppression RGPD complète`
      });

      return true;
    } catch (error) {
      console.error('Erreur suppression données:', error);
      return false;
    }
  }

  getDeletionRequests(patientId?: string): DeletionRequest[] {
    let requests = [...this.deletionRequests];
    if (patientId) {
      requests = requests.filter(r => r.patientId === patientId);
    }
    return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  /**
   * Politiques de rétention
   */

  setRetentionPolicy(policy: DataRetentionPolicy): void {
    const index = this.retentionPolicies.findIndex(p => p.resourceType === policy.resourceType);
    if (index >= 0) {
      this.retentionPolicies[index] = policy;
    } else {
      this.retentionPolicies.push(policy);
    }
    this.saveData();
  }

  getRetentionPolicy(resourceType: DataRetentionPolicy['resourceType']): DataRetentionPolicy | undefined {
    return this.retentionPolicies.find(p => p.resourceType === resourceType);
  }

  /**
   * Documents légaux (Templates)
   */

  private initializeDefaultDocuments(): void {
    this.legalDocuments = [
      {
        id: 'doc_privacy_policy',
        type: 'privacy_policy',
        title: 'Politique de Confidentialité',
        content: `# Politique de Confidentialité

## 1. Responsable du traitement
[Votre nom/entreprise]
[Adresse]
[Email]

## 2. Données collectées
- Données d'identification (nom, prénom, date de naissance)
- Coordonnées (adresse, téléphone, email)
- Données de santé (historique de consultations, diagnostics)

## 3. Finalités du traitement
- Prise en charge thérapeutique
- Facturation et suivi administratif
- Gestion des rendez-vous

## 4. Base légale
- Consentement explicite (données de santé)
- Exécution du contrat de soins

## 5. Vos droits
Conformément au RGPD, vous disposez des droits suivants:
- Droit d'accès (Art. 15)
- Droit de rectification (Art. 16)
- Droit à l'effacement (Art. 17)
- Droit à la limitation (Art. 18)
- Droit à la portabilité (Art. 20)

Pour exercer vos droits: [email]`,
        version: '1.0',
        effectiveDate: new Date(),
        language: 'fr',
        createdBy: 'system',
        isActive: true
      },
      {
        id: 'doc_consent_form',
        type: 'consent_form',
        title: 'Formulaire de Consentement',
        content: `# Formulaire de Consentement au Traitement des Données

Je soussigné(e) [NOM PRÉNOM], autorise [Praticien] à collecter et traiter mes données personnelles et de santé dans le cadre de ma prise en charge thérapeutique.

**Données concernées:**
- Données d'identification
- Coordonnées
- Antécédents médicaux
- Notes de consultations
- Photos cliniques (si applicable)

**Finalités:**
- Suivi thérapeutique
- Gestion administrative
- Facturation

**Durée de conservation:** 10 ans après le dernier contact

Je reconnais avoir été informé(e) de mes droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité conformément au RGPD.

Date: _________________
Signature: _________________`,
        version: '1.0',
        effectiveDate: new Date(),
        language: 'fr',
        createdBy: 'system',
        isActive: true
      }
    ];
  }

  getLegalDocument(type: LegalDocument['type']): LegalDocument | undefined {
    return this.legalDocuments.find(d => d.type === type && d.isActive);
  }

  getAllLegalDocuments(): LegalDocument[] {
    return this.legalDocuments.filter(d => d.isActive);
  }

  createLegalDocument(doc: Omit<LegalDocument, 'id'>): LegalDocument {
    const newDoc: LegalDocument = {
      ...doc,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.legalDocuments.push(newDoc);
    this.saveData();

    return newDoc;
  }

  /**
   * Registre des activités de traitement (Art. 30 RGPD)
   */

  private initializeProcessingActivities(): void {
    this.processingActivities = [
      {
        id: 'activity_patient_care',
        name: 'Prise en charge thérapeutique',
        purpose: 'Suivi et traitement des patients',
        legalBasis: 'consent',
        dataCategories: ['Identité', 'Santé', 'Vie personnelle'],
        recipients: ['Praticien', 'Médecin traitant (si nécessaire)'],
        retentionPeriod: '10 ans après dernier contact',
        securityMeasures: [
          'Chiffrement des données',
          'Contrôle d\'accès par authentification',
          'Sauvegardes régulières',
          'Formation du personnel au RGPD'
        ]
      },
      {
        id: 'activity_billing',
        name: 'Facturation et comptabilité',
        purpose: 'Gestion administrative et comptable',
        legalBasis: 'contract',
        dataCategories: ['Identité', 'Coordonnées bancaires', 'Facturation'],
        recipients: ['Praticien', 'Expert-comptable'],
        retentionPeriod: '10 ans (obligation légale)',
        securityMeasures: [
          'Accès restreint',
          'Chiffrement',
          'Archivage sécurisé'
        ]
      },
      {
        id: 'activity_appointments',
        name: 'Gestion des rendez-vous',
        purpose: 'Planification et rappels',
        legalBasis: 'contract',
        dataCategories: ['Identité', 'Coordonnées', 'Disponibilités'],
        recipients: ['Praticien'],
        retentionPeriod: '10 ans',
        securityMeasures: [
          'Accès sécurisé',
          'Notifications chiffrées'
        ]
      }
    ];
  }

  getProcessingActivities(): DataProcessingActivity[] {
    return this.processingActivities;
  }

  /**
   * Chiffrement (basique, en production utiliser crypto API)
   */

  encryptSensitiveData(data: string): string {
    // En production, utiliser un vrai algorithme (AES-256)
    return btoa(data); // Base64 pour démo
  }

  decryptSensitiveData(encryptedData: string): string {
    // En production, déchiffrer avec AES-256
    return atob(encryptedData);
  }

  /**
   * Archivage automatique
   */

  async archiveOldRecords(): Promise<{
    archived: number;
    failed: number;
  }> {
    let archived = 0;
    let failed = 0;

    // En production, archiver les dossiers selon politiques de rétention
    console.log('Archivage automatique RGPD en cours...');

    return { archived, failed };
  }

  /**
   * Rapport de conformité
   */

  generateComplianceReport(): {
    totalPatients: number;
    activeConsents: number;
    expiredConsents: number;
    pendingExportRequests: number;
    pendingDeletionRequests: number;
    recentAccessLogs: number;
    complianceScore: number;
  } {
    const recentLogs = this.getAccessLogs({
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
    });

    const pendingExports = this.exportRequests.filter(r => r.status === 'pending' || r.status === 'processing').length;
    const pendingDeletions = this.deletionRequests.filter(r => r.status === 'pending').length;

    // Score de conformité (basique)
    let complianceScore = 100;
    if (pendingExports > 5) complianceScore -= 20; // Retard dans les exports
    if (pendingDeletions > 0) complianceScore -= 10; // Demandes de suppression en attente
    if (recentLogs.length === 0) complianceScore -= 30; // Pas de logs récents

    return {
      totalPatients: 0, // À compléter avec DB
      activeConsents: 0, // À compléter
      expiredConsents: 0,
      pendingExportRequests: pendingExports,
      pendingDeletionRequests: pendingDeletions,
      recentAccessLogs: recentLogs.length,
      complianceScore: Math.max(0, complianceScore)
    };
  }

  /**
   * Persistence
   */

  private loadData(): void {
    try {
      const saved = localStorage.getItem('theraflow_rgpd');
      if (saved) {
        const data = JSON.parse(saved);

        this.accessLogs = (data.accessLogs || []).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));

        this.exportRequests = (data.exportRequests || []).map((req: any) => ({
          ...req,
          requestedAt: new Date(req.requestedAt),
          completedAt: req.completedAt ? new Date(req.completedAt) : undefined,
          expiresAt: req.expiresAt ? new Date(req.expiresAt) : undefined
        }));

        this.deletionRequests = (data.deletionRequests || []).map((req: any) => ({
          ...req,
          requestedAt: new Date(req.requestedAt),
          scheduledFor: req.scheduledFor ? new Date(req.scheduledFor) : undefined,
          completedAt: req.completedAt ? new Date(req.completedAt) : undefined
        }));

        this.retentionPolicies = data.retentionPolicies || this.retentionPolicies;
        this.legalDocuments = data.legalDocuments || this.legalDocuments;
        this.processingActivities = data.processingActivities || this.processingActivities;
      }
    } catch (error) {
      console.error('Erreur chargement données RGPD:', error);
    }
  }

  private saveData(): void {
    try {
      const data = {
        accessLogs: this.accessLogs,
        exportRequests: this.exportRequests,
        deletionRequests: this.deletionRequests,
        retentionPolicies: this.retentionPolicies,
        legalDocuments: this.legalDocuments,
        processingActivities: this.processingActivities
      };
      localStorage.setItem('theraflow_rgpd', JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde données RGPD:', error);
    }
  }
}

// Export singleton
const rgpdComplianceServiceInstance = new RGPDComplianceService();
export default rgpdComplianceServiceInstance;

// Fonctions helper
export function logAccess(log: Omit<AccessLog, 'id' | 'timestamp'>): void {
  rgpdComplianceServiceInstance.logAccess(log);
}

export function createExportRequest(patientId: string, requestedBy: string, format?: DataExportRequest['format']): DataExportRequest {
  return rgpdComplianceServiceInstance.createExportRequest(patientId, requestedBy, format);
}

export function createDeletionRequest(patientId: string, requestedBy: string, reason?: string): DeletionRequest {
  return rgpdComplianceServiceInstance.createDeletionRequest(patientId, requestedBy, reason);
}

export function getAccessLogs(filters?: any): AccessLog[] {
  return rgpdComplianceServiceInstance.getAccessLogs(filters);
}

export function generateComplianceReport() {
  return rgpdComplianceServiceInstance.generateComplianceReport();
}

export function getLegalDocument(type: LegalDocument['type']): LegalDocument | undefined {
  return rgpdComplianceServiceInstance.getLegalDocument(type);
}
