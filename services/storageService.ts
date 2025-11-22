import { supabase } from '../lib/supabase';

export type BucketName =
  | 'patient-documents'
  | 'session-files'
  | 'invoices-pdf'
  | 'avatars'
  | 'receipts'
  | 'medical-images';

export interface UploadOptions {
  bucket: BucketName;
  path: string;
  file: File;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Service de gestion du stockage de fichiers Supabase
 * Gère l'upload, téléchargement, et suppression de fichiers
 */
export class StorageService {
  /**
   * Initialiser les buckets (à exécuter une seule fois)
   */
  async initializeBuckets(): Promise<void> {
    const buckets: BucketName[] = [
      'patient-documents',
      'session-files',
      'invoices-pdf',
      'avatars',
      'receipts',
      'medical-images'
    ];

    for (const bucket of buckets) {
      const { data: exists } = await supabase.storage.getBucket(bucket);

      if (!exists) {
        await supabase.storage.createBucket(bucket, {
          public: false, // Privé par défaut (nécessite authentification)
          fileSizeLimit: 10485760, // 10 MB max
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ]
        });
      }
    }
  }

  /**
   * Upload un fichier vers Supabase Storage
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      const { bucket, path, file, contentType, cacheControl, upsert } = options;

      // Validation de la taille (10 MB max)
      if (file.size > 10485760) {
        return {
          success: false,
          error: 'Fichier trop volumineux (max 10 MB)'
        };
      }

      // Validation du type MIME
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Type de fichier non autorisé'
        };
      }

      // Upload
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: contentType || file.type,
          cacheControl: cacheControl || '3600',
          upsert: upsert || false
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Générer URL publique signée (valide 1 heure)
      const { data: signedUrlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 3600);

      return {
        success: true,
        path: data.path,
        publicUrl: signedUrlData?.signedUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Upload d'avatar patient
   */
  async uploadPatientAvatar(patientId: number, file: File): Promise<UploadResult> {
    const path = `patient-${patientId}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
    return this.uploadFile({
      bucket: 'avatars',
      path,
      file,
      upsert: true
    });
  }

  /**
   * Upload de document de séance
   */
  async uploadSessionDocument(
    sessionId: number,
    file: File,
    documentType: 'scan' | 'radiographie' | 'rapport' | 'autre'
  ): Promise<UploadResult> {
    const path = `session-${sessionId}/${documentType}-${Date.now()}.${file.name.split('.').pop()}`;
    return this.uploadFile({
      bucket: 'session-files',
      path,
      file
    });
  }

  /**
   * Upload de justificatif de charge
   */
  async uploadExpenseReceipt(expenseId: number, file: File): Promise<UploadResult> {
    const path = `expense-${expenseId}/receipt-${Date.now()}.${file.name.split('.').pop()}`;
    return this.uploadFile({
      bucket: 'receipts',
      path,
      file
    });
  }

  /**
   * Upload de facture PDF
   */
  async uploadInvoicePDF(invoiceNumber: string, file: File): Promise<UploadResult> {
    const path = `invoice-${invoiceNumber}-${Date.now()}.pdf`;
    return this.uploadFile({
      bucket: 'invoices-pdf',
      path,
      file,
      contentType: 'application/pdf'
    });
  }

  /**
   * Télécharger un fichier
   */
  async downloadFile(bucket: BucketName, path: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);

      if (error || !data) {
        console.error('Download error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  /**
   * Obtenir une URL signée pour un fichier privé
   */
  async getSignedUrl(
    bucket: BucketName,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error || !data) {
        console.error('Signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      return null;
    }
  }

  /**
   * Obtenir une URL publique (pour buckets publics uniquement)
   */
  getPublicUrl(bucket: BucketName, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Supprimer un fichier
   */
  async deleteFile(bucket: BucketName, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  /**
   * Supprimer plusieurs fichiers
   */
  async deleteFiles(bucket: BucketName, paths: string[]): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  /**
   * Lister les fichiers d'un dossier
   */
  async listFiles(
    bucket: BucketName,
    folder: string = ''
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error || !data) {
        console.error('List error:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('List error:', error);
      return [];
    }
  }

  /**
   * Supprimer tous les fichiers d'un patient (RGPD)
   */
  async deletePatientFiles(patientId: number): Promise<boolean> {
    try {
      // Supprimer avatar
      const avatars = await this.listFiles('avatars', `patient-${patientId}`);
      if (avatars.length > 0) {
        await this.deleteFiles(
          'avatars',
          avatars.map(f => `patient-${patientId}/${f.name}`)
        );
      }

      // Supprimer documents médicaux
      const medicalImages = await this.listFiles('medical-images', `patient-${patientId}`);
      if (medicalImages.length > 0) {
        await this.deleteFiles(
          'medical-images',
          medicalImages.map(f => `patient-${patientId}/${f.name}`)
        );
      }

      // Supprimer documents patients
      const patientDocs = await this.listFiles('patient-documents', `patient-${patientId}`);
      if (patientDocs.length > 0) {
        await this.deleteFiles(
          'patient-documents',
          patientDocs.map(f => `patient-${patientId}/${f.name}`)
        );
      }

      return true;
    } catch (error) {
      console.error('Error deleting patient files:', error);
      return false;
    }
  }

  /**
   * Obtenir l'utilisation du stockage par bucket
   */
  async getStorageUsage(bucket: BucketName): Promise<number> {
    try {
      const files = await this.listFiles(bucket);
      return files.reduce((total, file) => total + (file.metadata?.size || 0), 0);
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return 0;
    }
  }

  /**
   * Formater la taille en octets vers format lisible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const storageService = new StorageService();
