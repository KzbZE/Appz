import { db } from '../db';
import { Patient, Session, Invoice } from '../types';
import jsPDF from 'jspdf';

/**
 * Service de gestion des documents patient
 * Génération, téléchargement et stockage de documents
 */

export interface PatientDocument {
  id?: number;
  patientId: number;
  patientName: string;
  type: 'SESSION_REPORT' | 'INVOICE' | 'MEDICAL_CERTIFICATE' | 'PRESCRIPTION' | 'PHOTO_BEFORE' | 'PHOTO_AFTER' | 'XRAY' | 'OTHER';
  title: string;
  description?: string;
  fileUrl?: string; // Base64 data URL ou URL externe
  fileName: string;
  fileSize?: number;
  mimeType: string;
  createdAt: string;
  sessionId?: number;
  invoiceId?: number;
  metadata?: Record<string, any>;
}

export interface DocumentAccess {
  documentId: number;
  patientId: number;
  accessedAt: string;
  accessedBy: 'PATIENT' | 'PRACTITIONER';
  ipAddress?: string;
}

class DocumentService {
  /**
   * Générer un compte-rendu de séance en PDF
   */
  static async generateSessionReport(session: Session, patient: Patient): Promise<PatientDocument> {
    try {
      const doc = new jsPDF();

      // En-tête
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Compte-Rendu de Séance', 20, 20);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Informations patient
      doc.text('Patient:', 20, 40);
      doc.setFont('helvetica', 'bold');
      doc.text(patient.name, 60, 40);

      doc.setFont('helvetica', 'normal');
      doc.text('Date:', 20, 50);
      doc.text(new Date(session.date).toLocaleDateString('fr-FR'), 60, 50);

      // Motif de consultation
      let yPos = 70;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Motif de consultation', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const motif = session.reason || 'Non spécifié';
      const motifLines = doc.splitTextToSize(motif, 170);
      doc.text(motifLines, 20, yPos);
      yPos += motifLines.length * 7 + 10;

      // Observations
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Observations', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const observations = session.notes || 'Aucune observation';
      const obsLines = doc.splitTextToSize(observations, 170);
      doc.text(obsLines, 20, yPos);
      yPos += obsLines.length * 7 + 10;

      // Techniques utilisées
      if (session.techniques && session.techniques.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Techniques utilisées', 20, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        session.techniques.forEach(tech => {
          doc.text(`• ${tech}`, 25, yPos);
          yPos += 7;
        });
        yPos += 5;
      }

      // Recommandations
      if (session.recommendations) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommandations', 20, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const recoLines = doc.splitTextToSize(session.recommendations, 170);
        doc.text(recoLines, 20, yPos);
        yPos += recoLines.length * 7 + 10;
      }

      // Prochaine séance
      if (session.nextSessionDate) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Prochaine séance recommandée: ${new Date(session.nextSessionDate).toLocaleDateString('fr-FR')}`,
          20,
          yPos
        );
      }

      // Pied de page
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        20,
        280
      );

      // Convertir en base64
      const pdfBase64 = doc.output('datauristring');

      const document: PatientDocument = {
        patientId: session.patientId as number,
        patientName: patient.name,
        type: 'SESSION_REPORT',
        title: `Compte-rendu ${new Date(session.date).toLocaleDateString('fr-FR')}`,
        description: session.reason,
        fileUrl: pdfBase64,
        fileName: `CR_${patient.name.replace(/\s/g, '_')}_${session.date.split('T')[0]}.pdf`,
        mimeType: 'application/pdf',
        createdAt: new Date().toISOString(),
        sessionId: session.id as number
      };

      // Sauvegarder le document
      const docId = await this.saveDocument(document);
      document.id = docId;

      console.log(`✅ Compte-rendu généré pour ${patient.name}`);
      return document;
    } catch (error) {
      console.error('❌ Erreur génération compte-rendu:', error);
      throw error;
    }
  }

  /**
   * Générer une facture en PDF
   */
  static async generateInvoicePDF(invoice: Invoice): Promise<PatientDocument> {
    try {
      const doc = new jsPDF();

      // En-tête avec logo/titre
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURE', 20, 20);

      // Numéro de facture
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`N° ${invoice.invoiceNumber}`, 150, 20);
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, 150, 27);

      // Informations praticien (à gauche)
      let yPos = 50;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('De:', 20, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.text('Cabinet TheraFlow', 20, yPos);
      yPos += 5;
      doc.text('123 Rue de la Santé', 20, yPos);
      yPos += 5;
      doc.text('75000 Paris', 20, yPos);

      // Informations client (à droite)
      yPos = 50;
      doc.setFont('helvetica', 'bold');
      doc.text('À:', 120, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.text(invoice.patientName, 120, yPos);
      yPos += 5;
      if (invoice.patientAddress) {
        const addressLines = doc.splitTextToSize(invoice.patientAddress, 70);
        addressLines.forEach((line: string) => {
          doc.text(line, 120, yPos);
          yPos += 5;
        });
      }

      // Ligne de séparation
      yPos = 100;
      doc.setDrawColor(200);
      doc.line(20, yPos, 190, yPos);

      // Tableau des prestations
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, yPos);
      doc.text('Montant', 170, yPos, { align: 'right' });

      yPos += 2;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.description, 20, yPos);
      doc.text(`${invoice.amount.toFixed(2)} €`, 170, yPos, { align: 'right' });

      // Total
      yPos += 15;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL TTC', 20, yPos);
      doc.text(`${invoice.amount.toFixed(2)} €`, 170, yPos, { align: 'right' });

      // Statut
      yPos += 15;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const statusText = invoice.status === 'PAID' ? '✓ PAYÉE' : '⚠ EN ATTENTE DE PAIEMENT';
      const statusColor = invoice.status === 'PAID' ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusText, 20, yPos);
      doc.setTextColor(0, 0, 0);

      if (invoice.paidAt) {
        yPos += 7;
        doc.text(`Date de paiement: ${new Date(invoice.paidAt).toLocaleDateString('fr-FR')}`, 20, yPos);
      }

      // Mentions légales
      yPos = 260;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('TVA non applicable - Article 293B du CGI', 20, yPos);
      yPos += 5;
      doc.text('Dispensé d\'immatriculation au registre du commerce et des sociétés', 20, yPos);

      const pdfBase64 = doc.output('datauristring');

      const document: PatientDocument = {
        patientId: typeof invoice.patientId === 'number' ? invoice.patientId : 0,
        patientName: invoice.patientName,
        type: 'INVOICE',
        title: `Facture ${invoice.invoiceNumber}`,
        description: invoice.description,
        fileUrl: pdfBase64,
        fileName: `Facture_${invoice.invoiceNumber}.pdf`,
        mimeType: 'application/pdf',
        createdAt: new Date().toISOString(),
        invoiceId: invoice.id as number
      };

      const docId = await this.saveDocument(document);
      document.id = docId;

      console.log(`✅ Facture PDF générée: ${invoice.invoiceNumber}`);
      return document;
    } catch (error) {
      console.error('❌ Erreur génération facture:', error);
      throw error;
    }
  }

  /**
   * Télécharger un document
   */
  static downloadDocument(document: PatientDocument): void {
    try {
      if (!document.fileUrl) {
        throw new Error('Document sans URL');
      }

      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.fileName;
      link.click();

      // Logger l'accès
      this.logDocumentAccess(document.id!, document.patientId, 'PATIENT');

      console.log(`✅ Document téléchargé: ${document.fileName}`);
    } catch (error) {
      console.error('❌ Erreur téléchargement document:', error);
      throw error;
    }
  }

  /**
   * Uploader une photo (avant/après)
   */
  static async uploadPhoto(
    patientId: number,
    patientName: string,
    type: 'PHOTO_BEFORE' | 'PHOTO_AFTER',
    file: File
  ): Promise<PatientDocument> {
    try {
      // Convertir en base64
      const fileUrl = await this.fileToBase64(file);

      const document: PatientDocument = {
        patientId,
        patientName,
        type,
        title: `Photo ${type === 'PHOTO_BEFORE' ? 'avant' : 'après'} traitement`,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        createdAt: new Date().toISOString()
      };

      const docId = await this.saveDocument(document);
      document.id = docId;

      console.log(`✅ Photo uploadée: ${file.name}`);
      return document;
    } catch (error) {
      console.error('❌ Erreur upload photo:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les documents d'un patient
   */
  static async getPatientDocuments(patientId: number): Promise<PatientDocument[]> {
    try {
      const documents = await this.loadDocuments();
      return documents
        .filter(doc => doc.patientId === patientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('❌ Erreur récupération documents:', error);
      return [];
    }
  }

  /**
   * Récupérer les documents d'une séance
   */
  static async getSessionDocuments(sessionId: number): Promise<PatientDocument[]> {
    try {
      const documents = await this.loadDocuments();
      return documents.filter(doc => doc.sessionId === sessionId);
    } catch (error) {
      console.error('❌ Erreur récupération documents séance:', error);
      return [];
    }
  }

  /**
   * Supprimer un document
   */
  static async deleteDocument(documentId: number): Promise<void> {
    try {
      const documents = await this.loadDocuments();
      const updated = documents.filter(doc => doc.id !== documentId);
      localStorage.setItem('patient_documents', JSON.stringify(updated));
      console.log(`✅ Document ${documentId} supprimé`);
    } catch (error) {
      console.error('❌ Erreur suppression document:', error);
      throw error;
    }
  }

  /**
   * Statistiques documents
   */
  static async getDocumentStats(patientId: number): Promise<{
    totalDocuments: number;
    byType: Record<string, number>;
    totalSize: number;
    recentDocuments: PatientDocument[];
  }> {
    try {
      const documents = await this.getPatientDocuments(patientId);

      const byType: Record<string, number> = {};
      let totalSize = 0;

      documents.forEach(doc => {
        byType[doc.type] = (byType[doc.type] || 0) + 1;
        totalSize += doc.fileSize || 0;
      });

      return {
        totalDocuments: documents.length,
        byType,
        totalSize,
        recentDocuments: documents.slice(0, 5)
      };
    } catch (error) {
      console.error('❌ Erreur stats documents:', error);
      return { totalDocuments: 0, byType: {}, totalSize: 0, recentDocuments: [] };
    }
  }

  // ===== MÉTHODES PRIVÉES =====

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static async saveDocument(document: PatientDocument): Promise<number> {
    const documents = await this.loadDocuments();
    document.id = Date.now();
    documents.push(document);
    localStorage.setItem('patient_documents', JSON.stringify(documents));
    return document.id;
  }

  private static async loadDocuments(): Promise<PatientDocument[]> {
    try {
      const stored = localStorage.getItem('patient_documents');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static async logDocumentAccess(
    documentId: number,
    patientId: number,
    accessedBy: 'PATIENT' | 'PRACTITIONER'
  ): Promise<void> {
    try {
      const access: DocumentAccess = {
        documentId,
        patientId,
        accessedAt: new Date().toISOString(),
        accessedBy
      };

      const accesses = await this.loadAccesses();
      accesses.push(access);
      localStorage.setItem('document_accesses', JSON.stringify(accesses));
    } catch (error) {
      console.error('❌ Erreur log accès document:', error);
    }
  }

  private static async loadAccesses(): Promise<DocumentAccess[]> {
    try {
      const stored = localStorage.getItem('document_accesses');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

export default DocumentService;

/**
 * TODO: Migrer vers IndexedDB avec Dexie
 *
 * Ajouter dans db.ts:
 * patientDocuments: '++id, patientId, sessionId, invoiceId, type, createdAt',
 * documentAccesses: '++id, documentId, patientId, accessedAt, accessedBy'
 */
