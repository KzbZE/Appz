/**
 * Service de Gestion des Médias Patients
 *
 * Fonctionnalités:
 * - Upload photos avant/après
 * - Comparaison visuelle
 * - Stockage sécurisé (Local ou Cloud)
 * - Compression automatique
 * - Watermarking (option)
 */

export interface PatientMedia {
  id?: number;
  patientId: number;
  sessionId?: number;
  type: 'photo' | 'xray' | 'document' | 'video';
  category: 'before' | 'after' | 'progress' | 'other';
  url: string; // Base64 ou URL cloud
  thumbnailUrl?: string;
  filename: string;
  mimeType: string;
  size: number; // bytes
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
  tags?: string[];
  bodyPart?: string; // 'dos', 'genou', 'épaule', etc.
  viewAngle?: 'front' | 'back' | 'side' | 'top';
  consent: boolean; // Consentement patient pour utilisation
}

export interface MediaComparison {
  beforePhoto: PatientMedia;
  afterPhoto: PatientMedia;
  sessionsBetween: number;
  daysBetween: number;
  improvements?: string[];
}

class PatientMediaService {

  /**
   * Compresse une image avant stockage
   */
  async compressImage(
    file: File,
    maxWidth: number = 1920,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionner si trop grand
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Génère une miniature
   */
  async generateThumbnail(
    file: File,
    maxSize: number = 200
  ): Promise<string> {
    const blob = await this.compressImage(file, maxSize, 0.7);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convertit un fichier en Base64 pour stockage local
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload une photo patient
   */
  async uploadPhoto(
    file: File,
    patientId: number,
    category: 'before' | 'after' | 'progress',
    metadata: {
      sessionId?: number;
      bodyPart?: string;
      viewAngle?: 'front' | 'back' | 'side' | 'top';
      notes?: string;
      consent: boolean;
    }
  ): Promise<PatientMedia> {

    // Compression
    const compressed = await this.compressImage(file);
    const thumbnail = await this.generateThumbnail(file);
    const fullImage = await this.fileToBase64(new File([compressed], file.name, { type: file.type }));

    const media: PatientMedia = {
      patientId,
      sessionId: metadata.sessionId,
      type: 'photo',
      category,
      url: fullImage, // Stockage en Base64 pour IndexedDB
      thumbnailUrl: thumbnail,
      filename: file.name,
      mimeType: file.type,
      size: compressed.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Praticien', // TODO: Get from auth context
      notes: metadata.notes,
      bodyPart: metadata.bodyPart,
      viewAngle: metadata.viewAngle,
      consent: metadata.consent
    };

    // TODO: Sauvegarder dans IndexedDB (table patientMedia)
    console.log('Media uploaded:', media);

    return media;
  }

  /**
   * Crée une comparaison avant/après
   */
  createComparison(
    beforePhoto: PatientMedia,
    afterPhoto: PatientMedia,
    sessionsBetween: number = 0
  ): MediaComparison {

    const daysBetween = Math.floor(
      (new Date(afterPhoto.uploadedAt).getTime() - new Date(beforePhoto.uploadedAt).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    return {
      beforePhoto,
      afterPhoto,
      sessionsBetween,
      daysBetween,
      improvements: []
    };
  }

  /**
   * Génère une vue côte-à-côte
   */
  generateSideBySideCanvas(
    beforeUrl: string,
    afterUrl: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      const beforeImg = new Image();
      const afterImg = new Image();
      let loaded = 0;

      const onLoad = () => {
        loaded++;
        if (loaded === 2) {
          // Les deux images sont chargées
          const maxHeight = Math.max(beforeImg.height, afterImg.height);
          canvas.width = beforeImg.width + afterImg.width + 20; // +20 pour séparateur
          canvas.height = maxHeight;

          // Fond blanc
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Image "Avant"
          ctx.drawImage(beforeImg, 0, 0);

          // Ligne séparatrice
          ctx.fillStyle = '#e5e7eb';
          ctx.fillRect(beforeImg.width, 0, 20, maxHeight);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px Arial';
          ctx.save();
          ctx.translate(beforeImg.width + 10, maxHeight / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText('AVANT', -30, 5);
          ctx.rotate(Math.PI / 2);
          ctx.translate(0, maxHeight / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText('APRÈS', -30, 5);
          ctx.restore();

          // Image "Après"
          ctx.drawImage(afterImg, beforeImg.width + 20, 0);

          resolve(canvas.toDataURL('image/jpeg', 0.9));
        }
      };

      beforeImg.onload = onLoad;
      afterImg.onload = onLoad;
      beforeImg.onerror = () => reject(new Error('Failed to load before image'));
      afterImg.onerror = () => reject(new Error('Failed to load after image'));

      beforeImg.src = beforeUrl;
      afterImg.src = afterUrl;
    });
  }

  /**
   * Ajoute un watermark (filigrane)
   */
  async addWatermark(
    imageUrl: string,
    watermarkText: string = 'CONFIDENTIEL'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        // Dessiner l'image
        ctx.drawImage(img, 0, 0);

        // Ajouter le watermark
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Rotation du texte
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(watermarkText, 0, 0);
        ctx.restore();

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageUrl;
    });
  }

  /**
   * Filtre pour rechercher des photos
   */
  filterPhotos(
    photos: PatientMedia[],
    filters: {
      category?: 'before' | 'after' | 'progress';
      bodyPart?: string;
      startDate?: string;
      endDate?: string;
    }
  ): PatientMedia[] {
    return photos.filter(photo => {
      if (filters.category && photo.category !== filters.category) return false;
      if (filters.bodyPart && photo.bodyPart !== filters.bodyPart) return false;
      if (filters.startDate && photo.uploadedAt < filters.startDate) return false;
      if (filters.endDate && photo.uploadedAt > filters.endDate) return false;
      return true;
    });
  }

  /**
   * Obtient le stockage total utilisé par un patient
   */
  getTotalStorageUsed(photos: PatientMedia[]): {
    totalSizeMB: number;
    photoCount: number;
  } {
    const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0);
    return {
      totalSizeMB: totalSize / (1024 * 1024),
      photoCount: photos.length
    };
  }

  /**
   * Nettoie les photos non utilisées (plus de 2 ans)
   */
  async cleanupOldPhotos(photos: PatientMedia[], yearsOld: number = 2): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsOld);

    const toDelete = photos.filter(
      photo => new Date(photo.uploadedAt) < cutoffDate && !photo.consent
    );

    // TODO: Supprimer de IndexedDB
    console.log(`Would delete ${toDelete.length} old photos`);

    return toDelete.length;
  }
}

export default new PatientMediaService();
