import { jsPDF } from 'jspdf';
import { db } from '../db';
import { Patient, AppSettings } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Service de gestion des documents légaux et conformité RGPD
 * Templates personnalisables : Devis, CGV, Consentements, etc.
 */

export interface LegalDocument {
  id?: number;
  type: 'CGV' | 'CONSENT' | 'QUOTE' | 'PRIVACY_POLICY' | 'INVOICE_TERMS' | 'MEDICAL_FORM';
  title: string;
  content: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface SignedDocument {
  id?: number;
  documentId: number;
  patientId: number | string;
  patientName: string;
  signatureData: string; // Base64 signature image
  signedAt: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

/**
 * Générateur de Conditions Générales de Vente (CGV)
 */
export function generateCGV(settings: AppSettings): string {
  const practitionerName = settings.practitioner?.name || 'Praticien';
  const address = settings.practitioner?.address || 'Adresse du cabinet';
  const email = settings.practitioner?.email || 'contact@example.com';
  const phone = settings.practitioner?.phone || '01 23 45 67 89';

  return `
CONDITIONS GÉNÉRALES DE VENTE

Dernière mise à jour : ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}

ARTICLE 1 - IDENTIFICATION DU PRATICIEN

${practitionerName}
${address}
Email : ${email}
Téléphone : ${phone}

ARTICLE 2 - OBJET

Les présentes Conditions Générales de Vente (CGV) régissent les prestations de soins proposées par ${practitionerName}, praticien en kinésiologie et massage thérapeutique.

ARTICLE 3 - PRESTATIONS

Le praticien propose des séances de :
- Kinésiologie (humaine, équine, canine)
- Massage thérapeutique
- Consultations de bien-être

Les prestations sont réalisées au cabinet ou à domicile selon disponibilité.

ARTICLE 4 - TARIFS

Les tarifs sont affichés en euros TTC et sont disponibles sur demande ou affichés au cabinet.

Les tarifs incluent :
- La consultation ou séance
- Les frais de déplacement le cas échéant (selon barème kilométrique)

ARTICLE 5 - MODALITÉS DE PAIEMENT

Moyens de paiement acceptés :
- Espèces
- Chèque
- Carte bancaire
- Virement

Le paiement est exigible à l'issue de chaque séance sauf accord contraire.

ARTICLE 6 - ANNULATION ET REPORT

Toute annulation ou report de rendez-vous doit être effectué au moins 24 heures à l'avance.

En cas d'annulation tardive (moins de 24h) ou d'absence non justifiée, le praticien se réserve le droit de facturer 50% du montant de la séance.

ARTICLE 7 - PROTECTION DES DONNÉES PERSONNELLES

Conformément au RGPD (Règlement Général sur la Protection des Données), le client dispose d'un droit d'accès, de rectification, de suppression et de portabilité de ses données personnelles.

Les données collectées sont :
- Informations d'identité (nom, prénom, date de naissance)
- Coordonnées (adresse, téléphone, email)
- Informations de santé (nécessaires à la pratique)

Ces données sont conservées de manière sécurisée et ne sont jamais partagées avec des tiers.

ARTICLE 8 - RESPONSABILITÉ

Le praticien s'engage à exercer ses prestations avec soin et professionnalisme.

Les techniques proposées ne se substituent en aucun cas à un avis médical. En cas de pathologie, il est recommandé de consulter un médecin.

ARTICLE 9 - DROIT APPLICABLE

Les présentes CGV sont régies par le droit français.

En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, le litige sera porté devant les tribunaux compétents.

ARTICLE 10 - ACCEPTATION

Le client reconnaît avoir pris connaissance des présentes CGV et les accepte sans réserve.

Fait à ${settings.practitioner?.city || '[Ville]'}, le ${format(new Date(), 'dd/MM/yyyy')}

${practitionerName}
  `.trim();
}

/**
 * Générateur de Formulaire de Consentement RGPD
 */
export function generateConsentForm(patientName: string, settings: AppSettings): string {
  const practitionerName = settings.practitioner?.name || 'Praticien';

  return `
FORMULAIRE DE CONSENTEMENT
Protection des Données Personnelles (RGPD)

Je soussigné(e) ${patientName}, autorise ${practitionerName} à collecter et traiter mes données personnelles dans le cadre de ma prise en charge thérapeutique.

DONNÉES COLLECTÉES :
☑ Identité (nom, prénom, date de naissance)
☑ Coordonnées (adresse, téléphone, email)
☑ Informations de santé (anamnèse, antécédents, séances)
☑ Photos (si nécessaire pour suivi thérapeutique)

FINALITÉS DU TRAITEMENT :
✓ Assurer le suivi thérapeutique
✓ Gérer les rendez-vous et la facturation
✓ Communiquer des informations relatives aux soins

DROITS DU PATIENT :
Conformément au RGPD, vous disposez des droits suivants :
- Droit d'accès à vos données
- Droit de rectification
- Droit à l'effacement ("droit à l'oubli")
- Droit à la portabilité de vos données
- Droit d'opposition au traitement

Pour exercer vos droits, contactez : ${settings.practitioner?.email || 'contact@example.com'}

DURÉE DE CONSERVATION :
Les données sont conservées pendant la durée de la prise en charge et 10 ans après la dernière consultation (conformément aux obligations légales).

SÉCURITÉ :
Les données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers sans votre consentement explicite.

Date : ${format(new Date(), 'dd/MM/yyyy')}

Signature du patient :


_________________________
${patientName}
  `.trim();
}

/**
 * Générateur de Politique de Confidentialité
 */
export function generatePrivacyPolicy(settings: AppSettings): string {
  const practitionerName = settings.practitioner?.name || 'Praticien';

  return `
POLITIQUE DE CONFIDENTIALITÉ

${practitionerName} s'engage à protéger la vie privée et les données personnelles de ses patients.

1. RESPONSABLE DU TRAITEMENT
${practitionerName}
Email : ${settings.practitioner?.email || 'contact@example.com'}

2. DONNÉES COLLECTÉES
Nous collectons les données suivantes :
- Informations d'identité
- Coordonnées de contact
- Informations médicales et de santé
- Historique des consultations
- Photos (avec consentement)

3. FINALITÉ DU TRAITEMENT
- Gestion du dossier patient
- Suivi thérapeutique
- Facturation
- Communication relative aux soins

4. BASE LÉGALE
Le traitement repose sur :
- Votre consentement explicite
- L'exécution du contrat de soins
- Les obligations légales

5. DURÉE DE CONSERVATION
- Données actives : pendant la durée des soins
- Archives : 10 ans après dernière consultation

6. SÉCURITÉ
Mesures de sécurité mises en place :
- Chiffrement des données sensibles
- Accès restreint et protégé par mot de passe
- Sauvegardes régulières sécurisées
- Journal d'accès aux dossiers

7. VOS DROITS
Vous pouvez à tout moment :
- Accéder à vos données
- Demander leur rectification
- Demander leur suppression
- Vous opposer au traitement
- Demander la portabilité

Contact : ${settings.practitioner?.email || 'contact@example.com'}

8. COOKIES
Notre application utilise des cookies techniques nécessaires au fonctionnement. Aucun cookie publicitaire n'est utilisé.

9. MODIFICATIONS
Cette politique peut être mise à jour. La version en vigueur est toujours disponible dans l'application.

Dernière mise à jour : ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}
  `.trim();
}

/**
 * Générateur de Devis
 */
export function generateQuote(
  patient: Patient,
  services: Array<{ description: string; price: number }>,
  settings: AppSettings
): string {
  const practitionerName = settings.practitioner?.name || 'Praticien';
  const quoteNumber = `DEV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  const total = services.reduce((sum, service) => sum + service.price, 0);

  let servicesText = '';
  services.forEach((service, index) => {
    servicesText += `${index + 1}. ${service.description} : ${service.price.toFixed(2)} €\n`;
  });

  return `
DEVIS N° ${quoteNumber}

Date : ${format(new Date(), 'dd/MM/yyyy')}
Valable jusqu'au : ${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}

PRATICIEN :
${practitionerName}
${settings.practitioner?.address || ''}
${settings.practitioner?.email || ''}
${settings.practitioner?.phone || ''}

CLIENT :
${patient.name}
${patient.address || ''}
${patient.email || ''}
${patient.phone || ''}

PRESTATIONS :
${servicesText}

TOTAL : ${total.toFixed(2)} € TTC

CONDITIONS :
- Devis valable 30 jours
- Paiement à l'issue de chaque séance
- Annulation possible jusqu'à 24h avant

Signature du praticien        Signature du client (pour accord)



_____________________        _____________________
  `.trim();
}

/**
 * Export des données patient (RGPD - Droit d'accès)
 */
export async function exportPatientData(patientId: number | string): Promise<void> {
  try {
    // Récupérer toutes les données du patient
    const patient = await db.patients.get(patientId);
    const sessions = await db.sessions.where('patientId').equals(patientId).toArray();
    const invoices = await db.invoices.where('patientId').equals(patientId).toArray();
    const appointments = await db.appointments.where('patientId').equals(patientId).toArray();

    const exportData = {
      patient,
      sessions,
      invoices,
      appointments,
      exportDate: new Date().toISOString(),
      notice: 'Export de données personnelles conformément au RGPD (Article 20 - Droit à la portabilité)'
    };

    // Créer fichier JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donnees_patient_${patient?.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);

    // Logger l'export (journal d'accès RGPD)
    await logDataAccess(patientId, 'EXPORT', 'Patient data exported');

    console.log('✅ Patient data exported successfully');
  } catch (error) {
    console.error('Error exporting patient data:', error);
    throw error;
  }
}

/**
 * Suppression des données patient (RGPD - Droit à l'oubli)
 */
export async function deletePatientData(patientId: number | string): Promise<void> {
  if (!confirm('⚠️ ATTENTION : Cette action est irréversible.\n\nToutes les données du patient seront définitivement supprimées.\n\nContinuer ?')) {
    return;
  }

  if (!confirm('Confirmer la suppression définitive ?')) {
    return;
  }

  try {
    // Supprimer toutes les données liées
    await db.sessions.where('patientId').equals(patientId).delete();
    await db.invoices.where('patientId').equals(patientId).delete();
    await db.appointments.where('patientId').equals(patientId).delete();
    // TODO: Ajouter suppression photos, documents, etc.

    // Supprimer le patient
    await db.patients.delete(patientId);

    // Logger la suppression (obligatoire RGPD)
    await logDataAccess(patientId, 'DELETE', 'Patient data permanently deleted (GDPR right to erasure)');

    alert('✅ Données patient supprimées définitivement');
    console.log('✅ Patient data deleted successfully (GDPR compliance)');
  } catch (error) {
    console.error('Error deleting patient data:', error);
    alert('❌ Erreur lors de la suppression des données');
    throw error;
  }
}

/**
 * Journal d'accès aux données (RGPD - Traçabilité)
 */
export async function logDataAccess(
  patientId: number | string,
  action: 'VIEW' | 'EDIT' | 'EXPORT' | 'DELETE' | 'CREATE',
  details: string
): Promise<void> {
  const log = {
    patientId,
    action,
    details,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    ipAddress: 'N/A' // TODO: Get from server if needed
  };

  // TODO: Implémenter table db.accessLogs dans schema
  console.log('[GDPR Access Log]', log);

  // En production, sauvegarder dans une table dédiée
  // await db.accessLogs.add(log);
}

/**
 * Génère un PDF pour un document légal
 */
export function generateLegalDocumentPDF(title: string, content: string): void {
  const doc = new jsPDF();

  // Titre
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 20, { align: 'center' });

  // Contenu
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const lines = doc.splitTextToSize(content, 170);
  doc.text(lines, 20, 35);

  // Télécharger
  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

/**
 * Chiffrement basique des données sensibles (à améliorer avec vraie crypto)
 */
export function encryptSensitiveData(data: string, key: string): string {
  // ATTENTION: Ceci est un exemple basique
  // En production, utiliser crypto-js ou Web Crypto API
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
}

export function decryptSensitiveData(encrypted: string, key: string): string {
  const data = atob(encrypted);
  let decrypted = '';
  for (let i = 0; i < data.length; i++) {
    decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return decrypted;
}
