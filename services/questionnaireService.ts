import { db } from '../db';

/**
 * Service de questionnaires pré/post-séance
 * Permet aux patients de remplir des formulaires avant et après leurs séances
 */

export interface QuestionnaireQuestion {
  id: string;
  type: 'TEXT' | 'NUMBER' | 'SCALE' | 'CHOICE' | 'MULTICHOICE' | 'BOOLEAN' | 'TEXTAREA';
  question: string;
  required: boolean;
  options?: string[]; // Pour CHOICE et MULTICHOICE
  min?: number; // Pour SCALE et NUMBER
  max?: number; // Pour SCALE et NUMBER
  placeholder?: string;
}

export interface QuestionnaireTemplate {
  id?: number;
  name: string;
  type: 'PRE_SESSION' | 'POST_SESSION' | 'INITIAL_CONSULTATION' | 'FOLLOW_UP';
  description: string;
  questions: QuestionnaireQuestion[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface QuestionnaireResponse {
  id?: number;
  templateId: number;
  templateName: string;
  patientId: number;
  patientName: string;
  appointmentId?: number;
  responses: Record<string, any>; // questionId -> réponse
  completedAt: string;
  sessionDate?: string;
}

class QuestionnaireService {
  /**
   * Templates de questionnaires par défaut
   */
  static getDefaultTemplates(): QuestionnaireTemplate[] {
    return [
      {
        name: 'Questionnaire Pré-Séance',
        type: 'PRE_SESSION',
        description: 'À remplir avant chaque séance',
        active: true,
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: 'pain_level',
            type: 'SCALE',
            question: 'Sur une échelle de 0 à 10, quel est votre niveau de douleur actuel ?',
            required: true,
            min: 0,
            max: 10
          },
          {
            id: 'pain_location',
            type: 'TEXT',
            question: 'Où ressentez-vous principalement la douleur ?',
            required: false,
            placeholder: 'Ex: Dos, épaules, genoux...'
          },
          {
            id: 'sleep_quality',
            type: 'CHOICE',
            question: 'Comment avez-vous dormi cette semaine ?',
            required: true,
            options: ['Très bien', 'Bien', 'Moyen', 'Mal', 'Très mal']
          },
          {
            id: 'stress_level',
            type: 'SCALE',
            question: 'Niveau de stress actuel (0 = zen, 10 = très stressé)',
            required: true,
            min: 0,
            max: 10
          },
          {
            id: 'physical_activity',
            type: 'BOOLEAN',
            question: 'Avez-vous fait de l\'activité physique cette semaine ?',
            required: true
          },
          {
            id: 'notes',
            type: 'TEXTAREA',
            question: 'Avez-vous des remarques ou préoccupations particulières ?',
            required: false,
            placeholder: 'Décrivez ce que vous ressentez...'
          }
        ]
      },
      {
        name: 'Feedback Post-Séance',
        type: 'POST_SESSION',
        description: 'À remplir après la séance',
        active: true,
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: 'satisfaction',
            type: 'SCALE',
            question: 'Comment évaluez-vous cette séance ? (0 = pas satisfait, 10 = très satisfait)',
            required: true,
            min: 0,
            max: 10
          },
          {
            id: 'immediate_relief',
            type: 'SCALE',
            question: 'Ressentez-vous un soulagement immédiat ? (0 = aucun, 10 = total)',
            required: true,
            min: 0,
            max: 10
          },
          {
            id: 'techniques_used',
            type: 'MULTICHOICE',
            question: 'Quelles techniques avez-vous particulièrement appréciées ?',
            required: false,
            options: [
              'Massage',
              'Manipulation',
              'Points trigger',
              'Stretching',
              'Tests musculaires',
              'Autre'
            ]
          },
          {
            id: 'comfort',
            type: 'SCALE',
            question: 'Niveau de confort pendant la séance (0 = inconfortable, 10 = très confortable)',
            required: true,
            min: 0,
            max: 10
          },
          {
            id: 'practitioner_communication',
            type: 'SCALE',
            question: 'Clarté des explications du praticien (0 = peu clair, 10 = très clair)',
            required: true,
            min: 0,
            max: 10
          },
          {
            id: 'recommend',
            type: 'BOOLEAN',
            question: 'Recommanderiez-vous ce praticien à vos proches ?',
            required: true
          },
          {
            id: 'comments',
            type: 'TEXTAREA',
            question: 'Commentaires ou suggestions d\'amélioration',
            required: false,
            placeholder: 'Partagez votre expérience...'
          }
        ]
      },
      {
        name: 'Première Consultation',
        type: 'INITIAL_CONSULTATION',
        description: 'Anamnèse complète pour nouveaux patients',
        active: true,
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: 'chief_complaint',
            type: 'TEXTAREA',
            question: 'Quelle est la raison principale de votre venue ?',
            required: true,
            placeholder: 'Décrivez vos symptômes...'
          },
          {
            id: 'symptom_duration',
            type: 'CHOICE',
            question: 'Depuis combien de temps ressentez-vous ces symptômes ?',
            required: true,
            options: ['Moins d\'une semaine', '1-4 semaines', '1-6 mois', '6 mois à 1 an', 'Plus d\'un an']
          },
          {
            id: 'medical_history',
            type: 'TEXTAREA',
            question: 'Antécédents médicaux importants',
            required: false,
            placeholder: 'Opérations, maladies chroniques, allergies...'
          },
          {
            id: 'current_medications',
            type: 'TEXT',
            question: 'Médicaments actuels',
            required: false,
            placeholder: 'Liste des médicaments'
          },
          {
            id: 'previous_treatments',
            type: 'TEXTAREA',
            question: 'Traitements déjà essayés pour ce problème',
            required: false,
            placeholder: 'Kinésithérapie, ostéopathie, médicaments...'
          },
          {
            id: 'lifestyle',
            type: 'MULTICHOICE',
            question: 'Mode de vie (sélectionner tout ce qui s\'applique)',
            required: true,
            options: [
              'Activité physique régulière',
              'Travail sédentaire',
              'Travail physique',
              'Stress élevé',
              'Sommeil perturbé',
              'Alimentation équilibrée'
            ]
          },
          {
            id: 'goals',
            type: 'TEXTAREA',
            question: 'Quels sont vos objectifs avec ce traitement ?',
            required: true,
            placeholder: 'Réduction douleur, amélioration mobilité, retour au sport...'
          }
        ]
      }
    ];
  }

  /**
   * Créer un template de questionnaire
   */
  static async createTemplate(template: QuestionnaireTemplate): Promise<number> {
    try {
      // TODO: Ajouter table questionnaireTemplates dans db
      const templates = await this.loadTemplates();
      const newTemplate = {
        ...template,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      templates.push(newTemplate);
      localStorage.setItem('questionnaire_templates', JSON.stringify(templates));

      console.log(`✅ Template "${template.name}" créé`);
      return newTemplate.id!;
    } catch (error) {
      console.error('❌ Erreur création template:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les templates actifs
   */
  static async getActiveTemplates(type?: QuestionnaireTemplate['type']): Promise<QuestionnaireTemplate[]> {
    try {
      let templates = await this.loadTemplates();

      // Si aucun template, créer les templates par défaut
      if (templates.length === 0) {
        const defaults = this.getDefaultTemplates();
        for (const template of defaults) {
          await this.createTemplate(template);
        }
        templates = await this.loadTemplates();
      }

      const activeTemplates = templates.filter(t => t.active);

      if (type) {
        return activeTemplates.filter(t => t.type === type);
      }

      return activeTemplates;
    } catch (error) {
      console.error('❌ Erreur récupération templates:', error);
      return [];
    }
  }

  /**
   * Sauvegarder une réponse de questionnaire
   */
  static async saveResponse(response: QuestionnaireResponse): Promise<number> {
    try {
      // TODO: Ajouter table questionnaireResponses dans db
      const responses = await this.loadResponses();
      const newResponse = {
        ...response,
        id: Date.now(),
        completedAt: new Date().toISOString()
      };
      responses.push(newResponse);
      localStorage.setItem('questionnaire_responses', JSON.stringify(responses));

      console.log(`✅ Réponse questionnaire "${response.templateName}" sauvegardée pour ${response.patientName}`);
      return newResponse.id!;
    } catch (error) {
      console.error('❌ Erreur sauvegarde réponse:', error);
      throw error;
    }
  }

  /**
   * Récupérer les réponses d'un patient
   */
  static async getPatientResponses(patientId: number): Promise<QuestionnaireResponse[]> {
    try {
      const responses = await this.loadResponses();
      return responses
        .filter(r => r.patientId === patientId)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    } catch (error) {
      console.error('❌ Erreur récupération réponses patient:', error);
      return [];
    }
  }

  /**
   * Récupérer les réponses pour un rendez-vous
   */
  static async getAppointmentResponse(appointmentId: number): Promise<QuestionnaireResponse | null> {
    try {
      const responses = await this.loadResponses();
      return responses.find(r => r.appointmentId === appointmentId) || null;
    } catch (error) {
      console.error('❌ Erreur récupération réponse RDV:', error);
      return null;
    }
  }

  /**
   * Analyser les tendances d'un patient
   */
  static async analyzePatientTrends(patientId: number): Promise<any> {
    try {
      const responses = await this.getPatientResponses(patientId);

      // Extraire les données de douleur et satisfaction
      const painLevels: number[] = [];
      const stressLevels: number[] = [];
      const satisfactionLevels: number[] = [];

      responses.forEach(response => {
        if (response.responses.pain_level !== undefined) {
          painLevels.push(Number(response.responses.pain_level));
        }
        if (response.responses.stress_level !== undefined) {
          stressLevels.push(Number(response.responses.stress_level));
        }
        if (response.responses.satisfaction !== undefined) {
          satisfactionLevels.push(Number(response.responses.satisfaction));
        }
      });

      const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      return {
        totalResponses: responses.length,
        averagePainLevel: average(painLevels).toFixed(1),
        averageStressLevel: average(stressLevels).toFixed(1),
        averageSatisfaction: average(satisfactionLevels).toFixed(1),
        trend: {
          pain: painLevels.length >= 2 ? (painLevels[0] < painLevels[painLevels.length - 1] ? 'increasing' : 'decreasing') : 'stable',
          stress: stressLevels.length >= 2 ? (stressLevels[0] < stressLevels[stressLevels.length - 1] ? 'increasing' : 'decreasing') : 'stable',
          satisfaction: satisfactionLevels.length >= 2 ? (satisfactionLevels[0] < satisfactionLevels[satisfactionLevels.length - 1] ? 'increasing' : 'decreasing') : 'stable'
        }
      };
    } catch (error) {
      console.error('❌ Erreur analyse tendances:', error);
      return null;
    }
  }

  // ===== MÉTHODES PRIVÉES DE STOCKAGE =====
  // TODO: Migrer vers IndexedDB avec Dexie

  private static async loadTemplates(): Promise<QuestionnaireTemplate[]> {
    try {
      const stored = localStorage.getItem('questionnaire_templates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static async loadResponses(): Promise<QuestionnaireResponse[]> {
    try {
      const stored = localStorage.getItem('questionnaire_responses');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

export default QuestionnaireService;

/**
 * TODO: Migrer vers IndexedDB avec Dexie
 *
 * Ajouter dans db.ts:
 *
 * questionnaireTemplates: '++id, name, type, active',
 * questionnaireResponses: '++id, templateId, patientId, appointmentId, completedAt'
 */
