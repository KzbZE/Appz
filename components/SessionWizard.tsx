import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientType, SessionDocument, AppSettings, Session } from '../types';
import { generateSessionReport } from '../services/geminiService';
import { checkAuth, listDriveFolders, uploadToDriveReal } from '../services/googleApiService';
import { ChevronRight, ChevronLeft, Save, Video, AlertCircle, CheckCircle, Wand2, Upload, Download, Share2, Instagram, Facebook, Camera, Clock, HardDrive, FileText, Eye, Edit3, Mail } from 'lucide-react';
import { db } from '../db';
import { jsPDF } from 'jspdf';
import { sendEmailWithPDF } from '../services/notificationService';

interface SessionTemplate {
  id?: number;
  name: string;
  category: string;
  patientType: 'HUMAN' | 'EQUINE' | 'CANINE' | 'ALL';
  anamnesis: {
    mainComplaint: string;
    observations: string;
    objectives: string;
  };
  treatmentNotes: string;
  duration: number;
  exercises?: string;
  recommendations?: string;
  favorite: boolean;
  techniques?: string[]; // Techniques utilisées dans ce template
}

interface SessionWizardProps {
  patient: Patient;
  settings: AppSettings;
  onComplete: () => void;
}

const SessionWizard: React.FC<SessionWizardProps> = ({ patient, settings, onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [anamnesis, setAnamnesis] = useState<Record<string, string>>({});
  const [tensions, setTensions] = useState<{x: number, y: number, id: string, level: number, notes: string}[]>([]);
  const [treatmentNotes, setTreatmentNotes] = useState<string>("");
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [generatedReport, setGeneratedReport] = useState("");
  const [documents, setDocuments] = useState<SessionDocument[]>([]);
  const [sessionType, setSessionType] = useState<string>('KINESIO');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFolders, setDriveFolders] = useState<{id:string, name:string}[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');

  // Templates selection
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);

  // Available templates library
  const availableTemplates: SessionTemplate[] = [
    // KINÉSIOLOGIE HUMAIN
    { id: 1, name: 'Gestion Stress & Anxiété', category: 'Kinésiologie Humain', patientType: 'HUMAN', anamnesis: { mainComplaint: 'Stress chronique, anxiété, difficultés sommeil', observations: 'Tension généralisée. Respiration courte. Switching énergétique.', objectives: 'Réduction stress, amélioration sommeil, équilibre émotionnel' }, treatmentNotes: `1. Test musculaire - Identification déséquilibres\n2. Brain Gym - Cross Crawl pour intégration hémisphères\n3. Libération émotionnelle Three In One Concepts\n4. Équilibration chakras et méridiens\n5. Points neuro-vasculaires pour apaisement\n6. Ancrage et recentrage énergétique`, duration: 60, exercises: `Exercices quotidiens:\n- Cross Crawl: 2min matin/soir\n- Respiration cohérence cardiaque: 5min 3x/jour\n- Auto-massage points neuro-lymphatiques`, recommendations: 'Hydratation régulière. Limiter caféine. Marche quotidienne 20min.', favorite: true, techniques: ['Brain Gym (Edu-K)', 'Three In One Concepts', 'Équilibration énergétique', 'Points neuro-vasculaires'] },
    { id: 2, name: 'Difficultés Apprentissage Enfant', category: 'Kinésiologie Humain', patientType: 'HUMAN', anamnesis: { mainComplaint: 'Difficultés concentration, troubles apprentissage', observations: 'Réflexes archaïques non intégrés. Stress scolaire.', objectives: 'Amélioration concentration, intégration réflexes, confiance' }, treatmentNotes: `1. Test musculaire spécifique apprentissage\n2. Brain Gym - ECAP (Énergétique, Clair, Actif, Positif)\n3. RMTi - Intégration réflexes archaïques\n4. Touch For Health - Équilibration 14 méridiens\n5. Formatage Oreille pour écoute\n6. Baromètre du comportement`, duration: 45, exercises: `Programme à la maison (10min/jour):\n- Mouvements croisés\n- Huit couché (lazy 8)\n- Boire de l'eau régulièrement`, recommendations: 'Encouragements positifs. Pauses régulières durant devoirs. Jeux extérieurs.', favorite: true, techniques: ['Brain Gym (Edu-K)', 'RMTi (Réflexes archaïques)', 'Touch For Health (TFH)', 'Formatage Oreille'] },
    { id: 3, name: 'Soin Reiki Harmonisation Complète', category: 'Kinésiologie Humain', patientType: 'HUMAN', anamnesis: { mainComplaint: 'Fatigue chronique, besoin de rééquilibrage énergétique', observations: 'Déséquilibres énergétiques multiples. Chakras bloqués.', objectives: 'Harmonisation énergétique globale, vitalité, bien-être' }, treatmentNotes: `1. Scan énergétique complet du corps\n2. Reiki Usui - Positions classiques\n3. Harmonisation 7 chakras principaux\n4. Nettoyage énergétique aura\n5. LaHoChi pour élévation vibratoire\n6. Ancrage et protection énergétique`, duration: 75, recommendations: 'Repos après séance. Boire beaucoup d\'eau. Observer ressentis 48h.', favorite: true, techniques: ['Équilibration chakras', 'Harmonisation énergétique', 'Ancrage/enracinement', 'Nettoyage énergétique'] },
    { id: 4, name: 'Libération Traumatisme Émotionnel', category: 'Kinésiologie Humain', patientType: 'HUMAN', anamnesis: { mainComplaint: 'Blocage émotionnel, trauma passé non résolu', observations: 'Émotions refoulées. Mémoires corporelles.', objectives: 'Libération émotionnelle, apaisement, reconstruction' }, treatmentNotes: `1. Test musculaire identification émotion\n2. Récession d'âge - Retour à l'événement\n3. One Brain - Baromètre comportement\n4. Libération stress émotionnel\n5. EFT (Emotional Freedom Technique)\n6. Réintégration et ancrage positif`, duration: 90, recommendations: 'Bienveillance envers soi. Journal émotions. Soutien psychologique si besoin.', favorite: false, techniques: ['One Brain', 'Récession d\'âge', 'Baromètre du comportement', 'Libération émotionnelle'] },
    { id: 5, name: 'Préparation Mentale Sportif', category: 'Kinésiologie Humain', patientType: 'HUMAN', anamnesis: { mainComplaint: 'Stress compétition, baisse performance', observations: 'Tension pré-compétitive. Doutes capacités.', objectives: 'Confiance, concentration, optimisation performance' }, treatmentNotes: `1. Test musculaire objectifs sportifs\n2. Kinésiologie sport - Visualisation positive\n3. Équilibration énergétique performance\n4. Gestion stress compétition\n5. Ancrage confiance\n6. Mode Sabotage - Élimination auto-sabotage`, duration: 60, exercises: `Routine pré-compétition:\n- Visualisation succès: 5min\n- Cross Crawl: 2min\n- Ancrage confiance`, recommendations: 'Sommeil qualité. Nutrition adaptée. Rituel pré-compétition.', favorite: false, techniques: ['Kinésiologie sport', 'Mode Sabotage', 'Équilibration énergétique', 'Stress Release'] },
    // KINÉSIOLOGIE ANIMAL
    { id: 6, name: 'Anxiété Séparation Chien', category: 'Kinésiologie Animal', patientType: 'CANINE', anamnesis: { mainComplaint: 'Aboiements, destruction en absence maître', observations: 'Stress visible. Attachement excessif.', objectives: 'Apaisement, autonomie, équilibre émotionnel' }, treatmentNotes: `1. Test musculaire animal - Communication\n2. Scan énergétique corps\n3. Équilibration chakras (spéc. plexus solaire)\n4. Libération émotionnelle stress\n5. Fleurs de Bach personnalisées\n6. Reiki canin harmonisation`, duration: 45, recommendations: 'Départ progressif. Jouets occupationnels. Routine stable.', favorite: true, techniques: ['Test musculaire', 'Équilibration chakras', 'Libération émotionnelle'] },
    { id: 7, name: 'Performance Cheval Compétition', category: 'Kinésiologie Animal', patientType: 'EQUINE', anamnesis: { mainComplaint: 'Baisse performance, stress compétition', observations: 'Tension musculaire. Méridiens déséquilibrés.', objectives: 'Optimisation performance, concentration, vitalité' }, treatmentNotes: `1. Test musculaire équin complet\n2. Méthode Masterson - Relâchement tensions\n3. Équilibration 12 méridiens principaux\n4. Chakras - Focus chakra racine et sacré\n5. Gestion stress pré-compétition\n6. Reiki équin vitalité`, duration: 60, recommendations: 'Échauffement progressif. Hydratation. Vérification matériel.', favorite: true, techniques: ['Test musculaire', 'Correctifs méridiens', 'Équilibration chakras', 'Équilibration énergétique'] },
    { id: 8, name: 'Troubles Comportement Chien', category: 'Kinésiologie Animal', patientType: 'CANINE', anamnesis: { mainComplaint: 'Agressivité, peurs, réactivité', observations: 'Trauma possible. Déséquilibres émotionnels.', objectives: 'Apaisement, confiance, comportement équilibré' }, treatmentNotes: `1. Communication animale - Identification cause\n2. Test musculaire émotions\n3. Libération stress post-traumatique\n4. Tellington TTouch - Apaisement nerveux\n5. Équilibration énergétique globale\n6. Fleurs de Bach trauma/peur`, duration: 50, recommendations: 'Environnement calme. Renforcement positif. Patience.', favorite: false, techniques: ['Test musculaire', 'Libération émotionnelle', 'Équilibration énergétique'] },
    { id: 9, name: 'Douleurs Chroniques Cheval Âgé', category: 'Kinésiologie Animal', patientType: 'EQUINE', anamnesis: { mainComplaint: 'Raideur, douleurs articulaires, vieillissement', observations: 'Mobilité réduite. Énergie basse.', objectives: 'Soulagement douleur, mobilité, qualité vie' }, treatmentNotes: `1. Scan énergétique zones douloureuses\n2. Reiki équin - Soulagement douleur\n3. Touch For Health animal\n4. Points d'acupression antalgiques\n5. Harmonisation méridiens\n6. Magnétisme zones affectées`, duration: 60, recommendations: 'Mouvement régulier adapté. Confort litière. Suivi vétérinaire.', favorite: false, techniques: ['Touch For Health (TFH)', 'Acupression', 'Correctifs méridiens', 'Harmonisation énergétique'] },
    // MASSAGE ÉQUIN
    { id: 10, name: 'Massage Pré-Compétition Équin', category: 'Massage Équin', patientType: 'EQUINE', anamnesis: { mainComplaint: 'Préparation épreuve sportive', observations: 'Bon état général. Tonus musculaire correct.', objectives: 'Optimisation performance, prévention blessures, échauffement' }, treatmentNotes: `1. Effleurage global - Échauffement tissus\n2. Pétrissage encolure et dos\n3. Friction transversale tendons membres\n4. Stretching passif membres\n5. Percussions tonifiantes muscles\n6. Mobilisations articulaires douces`, duration: 30, recommendations: 'Hydratation optimale. Échauffement progressif avant épreuve. Vérifier matériel.', favorite: true, techniques: ['Effleurage', 'Pétrissage', 'Friction', 'Stretching passif', 'Mobilisations articulaires'] },
    { id: 11, name: 'Récupération Post-Effort Équin', category: 'Massage Équin', patientType: 'EQUINE', anamnesis: { mainComplaint: 'Récupération après compétition/effort intense', observations: 'Fatigue musculaire. Possibles courbatures.', objectives: 'Récupération optimale, drainage, relaxation' }, treatmentNotes: `1. Drainage lymphatique membres\n2. Effleurage relaxant global\n3. Pétrissage doux muscles sollicités\n4. Points trigger zones contractées\n5. Stretching passif doux\n6. Cryothérapie si inflammation`, duration: 45, recommendations: 'Repos box 24h. Hydratation. Marche en main légère.', favorite: true, techniques: ['Drainage lymphatique', 'Effleurage', 'Points trigger/gâchettes', 'Stretching passif', 'Cryothérapie (froid)'] },
    { id: 12, name: 'Traitement Dorsalgie Équine', category: 'Massage Équin', patientType: 'EQUINE', anamnesis: { mainComplaint: 'Douleur dorsale, raideur, défense pansage', observations: 'Contractures longissimus dorsi. Mobilité limitée.', objectives: 'Soulagement douleur, relâchement musculaire, mobilité' }, treatmentNotes: `1. Thermothérapie préparatoire\n2. Massage myofascial dos profond\n3. Points trigger paravertébraux\n4. Stretching encolure et dos\n5. Mobilisations vertébrales douces\n6. Shiatsu équin méridiens dos`, duration: 60, recommendations: 'Vérification selle urgente. Repos 48h. Travail progressif.', favorite: true, techniques: ['Thermothérapie (chaud)', 'Myofascial', 'Points trigger/gâchettes', 'Stretching passif', 'Shiatsu équin'] },
    { id: 13, name: 'Massage Bien-être Équin', category: 'Massage Équin', patientType: 'EQUINE', anamnesis: { mainComplaint: 'Entretien, prévention, détente', observations: 'État général bon. Pas de pathologie.', objectives: 'Relaxation, bien-être, prévention tensions' }, treatmentNotes: `1. Effleurage global relaxant\n2. Pétrissage doux ensemble corps\n3. Acupression points de détente\n4. Shiatsu équin harmonisation\n5. Stretching passif membres\n6. Mobilisations articulaires confort`, duration: 45, recommendations: 'Séances régulières mensuelles. Observation comportement.', favorite: false, techniques: ['Relaxant/Bien-être', 'Effleurage', 'Acupression', 'Shiatsu équin', 'Stretching passif'] },
    // MASSAGE CANIN
    { id: 14, name: 'Massage Sportif Canin', category: 'Massage Canin', patientType: 'CANINE', anamnesis: { mainComplaint: 'Chien sportif - Entretien musculaire', observations: 'Activité intense régulière. Tonus musculaire.', objectives: 'Performance, récupération, prévention blessures' }, treatmentNotes: `1. Effleurage échauffement\n2. Pétrissage membres et dos\n3. Friction tendons et ligaments\n4. Drainage lymphatique pattes\n5. Stretching passif membres\n6. Percussions tonifiantes`, duration: 30, recommendations: 'Hydratation post-effort. Repos après séance. Échauffement avant activité.', favorite: true, techniques: ['Pré-compétition', 'Effleurage', 'Pétrissage', 'Friction', 'Drainage lymphatique', 'Stretching passif'] },
    { id: 15, name: 'Massage Thérapeutique Chien Âgé', category: 'Massage Canin', patientType: 'CANINE', anamnesis: { mainComplaint: 'Arthrose, raideur, mobilité réduite', observations: 'Douleurs articulaires. Difficulté lever.', objectives: 'Soulagement douleur, mobilité, confort vie' }, treatmentNotes: `1. Thermothérapie douce zones raides\n2. Effleurage très doux global\n3. Mobilisations passives articulations\n4. Points d'acupression antalgiques\n5. Drainage lymphatique doux\n6. Massage confort zones douloureuses`, duration: 40, recommendations: 'Couchage orthopédique. Exercice doux quotidien. Suppléments articulaires.', favorite: true, techniques: ['Thermothérapie (chaud)', 'Relaxant/Bien-être', 'Effleurage', 'Acupression', 'Drainage lymphatique'] }
  ];

  const STORAGE_KEY = `theraflow_draft_${patient.id}`;

  const stateRef = useRef({
    anamnesis,
    tensions,
    treatmentNotes,
    videoUploaded,
    generatedReport,
    documents,
    sessionType,
    selectedTechniques,
    step
  });

  useEffect(() => {
    stateRef.current = {
      anamnesis,
      tensions,
      treatmentNotes,
      videoUploaded,
      generatedReport,
      documents,
      sessionType,
      selectedTechniques,
      step
    };
  }, [anamnesis, tensions, treatmentNotes, videoUploaded, generatedReport, documents, sessionType, selectedTechniques, step]);

  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
        try {
            const data = JSON.parse(savedDraft);
            const isRecent = new Date().getTime() - new Date(data.timestamp).getTime() < 24 * 60 * 60 * 1000; 
            
            if (isRecent && confirm(`Un brouillon de séance datant de ${new Date(data.timestamp).toLocaleTimeString()} a été trouvé. Voulez-vous le restaurer ?`)) {
                if (data.anamnesis) setAnamnesis(data.anamnesis);
                if (data.tensions) setTensions(data.tensions);
                if (data.treatmentNotes) setTreatmentNotes(data.treatmentNotes);
                if (data.videoUploaded) setVideoUploaded(data.videoUploaded);
                if (data.generatedReport) setGeneratedReport(data.generatedReport);
                if (data.documents) setDocuments(data.documents);
                if (data.sessionType) setSessionType(data.sessionType);
                if (data.selectedTechniques) setSelectedTechniques(data.selectedTechniques);
                if (data.step) setStep(data.step);
                setLastSaved(new Date(data.timestamp));
            }
        } catch (e) {
            console.error("Error parsing draft", e);
        }
    }
  }, [STORAGE_KEY]);

  useEffect(() => {
    const interval = setInterval(() => {
        const dataToSave = {
            ...stateRef.current,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        setLastSaved(new Date());
    }, 60000); 

    return () => clearInterval(interval);
  }, [STORAGE_KEY]);

  useEffect(() => {
    let basePrice = 0;
    if (patient.customTariffs && patient.customTariffs[sessionType]) {
        basePrice = patient.customTariffs[sessionType];
    } 
    else if (settings?.defaultTariffs) {
        if (sessionType === 'MASSAGE') {
            basePrice = settings.defaultTariffs.MASSAGE || 0;
        } else {
            switch(patient.type) {
                case PatientType.HUMAN: basePrice = settings.defaultTariffs.HUMAN_KINESIO || 0; break;
                case PatientType.EQUINE: basePrice = settings.defaultTariffs.EQUINE_KINESIO || 0; break;
                case PatientType.CANINE: basePrice = settings.defaultTariffs.CANINE_KINESIO || 0; break;
                default: basePrice = 80;
            }
        }
    }

    if (patient.type !== PatientType.HUMAN && patient.distanceKm && settings?.kmRate) {
        basePrice += patient.distanceKm * settings.kmRate;
    }

    setCalculatedPrice(Math.round(basePrice * 100) / 100);
  }, [patient, sessionType, settings]);


  const handleGenerateReport = async () => {
      setGeneratingReport(true);
      const sessionData = { anamnesis, tensions, treatmentNotes, exercises: ['Repos 2 jours', 'Hydratation'] };
      const report = await generateSessionReport(sessionData, patient.type);
      setGeneratedReport(report);
      setGeneratingReport(false);
  };

  const generatePDF = (): jsPDF => {
      const doc = new jsPDF();
      let y = 20;

      // Helper function to add colored section
      const addSection = (title: string, content: string, color: [number, number, number], bgColor: [number, number, number]) => {
        // Section title with colored bar
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(15, y - 2, 2, 6, 'F'); // Colored bar

        doc.setTextColor(color[0] * 0.6, color[1] * 0.6, color[2] * 0.6);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 20, y + 3);

        y += 8;

        // Background box
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        const contentLines = doc.splitTextToSize(content || 'Non renseigné', 170);
        const boxHeight = Math.max(12, contentLines.length * 5 + 4);
        doc.roundedRect(15, y, 180, boxHeight, 2, 2, 'F');

        // Content text
        doc.setTextColor(color[0] * 0.5, color[1] * 0.5, color[2] * 0.5);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(contentLines, 18, y + 5);

        y += boxHeight + 6;
      };

      // ========== HEADER ==========
      // TheraFlow branding with teal border
      doc.setDrawColor(20, 184, 166); // Teal
      doc.setLineWidth(3);
      doc.line(15, 15, 195, 15);

      doc.setTextColor(51, 65, 85); // Slate-800
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('TheraFlow', 15, 25);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(settings?.practitioner?.name || 'Praticien', 15, 31);
      if (settings?.practitioner?.email) {
        doc.setFontSize(8);
        doc.text(settings.practitioner.email, 15, 36);
      }

      // Date and "Compte-Rendu" label on right
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('COMPTE-RENDU', 195, 21, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(new Date().toLocaleDateString('fr-FR'), 195, 27, { align: 'right' });

      y = 45;

      // ========== PATIENT INFORMATION BOX ==========
      // Teal gradient box
      doc.setFillColor(240, 253, 250); // Teal-50
      doc.roundedRect(15, y, 180, 26, 2, 2, 'F');

      // Teal left border
      doc.setFillColor(20, 184, 166);
      doc.rect(15, y, 3, 26, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(19, 78, 74); // Teal-900
      doc.text('Informations Patient', 21, y + 6);

      // Patient details in grid
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      // Left column
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(19, 78, 74);
      doc.text('Patient :', 21, y + 13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(patient.name, 42, y + 13);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(19, 78, 74);
      doc.text('Séance :', 21, y + 20);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(sessionType === 'KINESIO' ? 'Kinésiologie' : 'Massage', 42, y + 20);

      // Right column
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(19, 78, 74);
      doc.text('Type :', 110, y + 13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(patient.type, 125, y + 13);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(19, 78, 74);
      doc.text('Date :', 110, y + 20);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(new Date().toLocaleDateString('fr-FR'), 125, y + 20);

      y += 34;

      // ========== SECTIONS ==========
      // Plainte Principale (Red)
      addSection('Plainte Principale', anamnesis.mainComplaint || '', [220, 38, 38], [254, 242, 242]);

      // Check if need new page
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Observations (Blue)
      addSection('Observations', anamnesis.observations || '', [59, 130, 246], [239, 246, 255]);

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Objectifs (Purple)
      addSection('Objectifs de la Séance', anamnesis.objectives || '', [168, 85, 247], [250, 245, 255]);

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Techniques (Amber - if any)
      if (selectedTechniques.length > 0) {
        doc.setFillColor(255, 251, 235); // Amber-50
        const techBoxHeight = 8 + Math.ceil(selectedTechniques.length / 3) * 5;
        doc.roundedRect(15, y, 180, techBoxHeight, 2, 2, 'F');

        doc.setFillColor(245, 158, 11);
        doc.rect(15, y, 3, techBoxHeight, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 53, 15);
        doc.text('Techniques Utilisées', 21, y + 5);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        let xTech = 21;
        let yTech = y + 10;
        selectedTechniques.forEach((tech, i) => {
          const textWidth = doc.getTextWidth(tech);
          if (xTech + textWidth + 4 > 190) {
            xTech = 21;
            yTech += 5;
          }
          doc.setFillColor(252, 211, 77); // Amber-300
          doc.roundedRect(xTech, yTech - 3, textWidth + 4, 4, 1, 1, 'F');
          doc.setTextColor(120, 53, 15);
          doc.text(tech, xTech + 2, yTech);
          xTech += textWidth + 7;
        });

        y += techBoxHeight + 6;
      }

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Protocole (Emerald)
      addSection('Protocole & Déroulement', treatmentNotes || '', [16, 185, 129], [236, 253, 245]);

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Notes Complémentaires (Slate)
      addSection('Notes Complémentaires & Rapport', generatedReport || '', [100, 116, 139], [248, 250, 252]);

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Recommandations (Teal)
      addSection('Recommandations & Conseils', anamnesis.recommendations || '', [20, 184, 166], [240, 253, 250]);

      // ========== FOOTER ==========
      // Go to last page
      const pageCount = doc.getNumberOfPages();
      doc.setPage(pageCount);

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(1);
      doc.line(15, 280, 195, 280);

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      const footerText = `Document généré par TheraFlow - ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      doc.text(footerText, 105, 286, { align: 'center' });

      return doc;
  };

  const handleExportPDF = () => {
    const doc = generatePDF();
    doc.save(`CR_${patient.name}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleEmailPDF = async () => {
    // Vérifier si le patient a un email
    const patientData = await db.patients.get(patient.id!);

    if (!patientData?.email) {
      alert('❌ Ce patient n\'a pas d\'adresse email renseignée.\n\nVeuillez ajouter l\'email dans la fiche patient pour pouvoir envoyer le compte-rendu.');
      return;
    }

    // Générer le PDF
    const doc = generatePDF();
    const blob = doc.output('blob');
    const fileName = `CR_${patient.name}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Confirmation
    if (!confirm(`Envoyer le compte-rendu par email à ${patientData.email} ?`)) {
      return;
    }

    try {
      const message = `Bonjour ${patient.name},

Veuillez trouver ci-joint le compte-rendu de votre séance du ${new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})}.

N'hésitez pas à me contacter si vous avez des questions.

Cordialement,
${settings?.practitioner?.name || 'Votre praticien'}
TheraFlow`;

      const success = await sendEmailWithPDF(
        patientData.email,
        `Compte-rendu de séance - ${new Date().toLocaleDateString('fr-FR')}`,
        message,
        blob,
        fileName
      );

      if (success) {
        alert('✅ Compte-rendu envoyé par email avec succès !');
      } else {
        alert('❌ Erreur lors de l\'envoi de l\'email.\n\nVérifiez votre connexion et réessayez.');
      }
    } catch (error) {
      console.error('Error sending PDF email:', error);
      alert('❌ Erreur lors de l\'envoi de l\'email.');
    }
  };

  const handleSaveToDrive = async () => {
    if (!selectedFolder) {
        alert("Veuillez sélectionner un dossier");
        return;
    }
    const doc = generatePDF();
    const blob = doc.output('blob');
    
    const fileName = `CR_${patient.name}_${new Date().toISOString().split('T')[0]}.pdf`;
    try {
        const url = await uploadToDriveReal(blob, fileName, selectedFolder);
        alert(`Fichier sauvegardé sur Google Drive !`);
        setShowDriveModal(false);
    } catch (error) {
        alert("Erreur lors de l'upload Drive");
        console.error(error);
    }
  };

  const openDriveModal = async () => {
      const authed = await checkAuth();
      if (authed) {
          const folders = await listDriveFolders();
          if (folders.length === 0) {
              alert("⚠️ Impossible de récupérer vos dossiers Drive.\nVotre session Google a peut-être expiré.\n\nReconnectez-vous dans Paramètres → Google.");
              return;
          }
          setDriveFolders(folders);
          setShowDriveModal(true);
      } else {
          alert("🔐 Connexion Google requise\n\nPour sauvegarder sur Drive :\n1. Allez dans Paramètres\n2. Cliquez sur 'Se connecter avec Google'\n3. Autorisez l'accès à Drive\n\nNote : La session Google expire après 1h.");
      }
  };

  const handleSocialShare = async () => {
      const shareData = {
          title: 'TheraFlow Session',
          text: `Super séance avec ${patient.name} aujourd'hui ! 🌟 #${settings?.social?.instagramHandle || 'TheraFlow'} #Kinesio`,
          url: 'https://theraflow.app'
      };
      if (navigator.share) {
          try { await navigator.share(shareData); } catch (err) { console.log("Partage annulé", err); }
      } else {
          alert(`Simulation: Ouverture de l'app pour partage.\n\nTexte copié: "${shareData.text}"`);
      }
  };

  const handleFileUpload = () => {
    const newDoc: SessionDocument = {
      id: `doc_${Date.now()}`,
      name: `Document_${documents.length + 1}.jpg`,
      type: 'IMAGE',
      url: '#',
      date: new Date().toLocaleDateString()
    };
    setDocuments([...documents, newDoc]);
  };

  // Template management functions
  const getRelevantTemplates = (): SessionTemplate[] => {
    return availableTemplates.filter(template => {
      const matchesPatient = template.patientType === patient.type || template.patientType === 'ALL';
      const matchesType = sessionType === 'KINESIO' ?
        (template.category.includes('Kinésiologie')) :
        (template.category.includes('Massage'));
      return matchesPatient && matchesType;
    });
  };

  const toggleTemplate = (templateId: number) => {
    if (selectedTemplates.includes(templateId)) {
      setSelectedTemplates(selectedTemplates.filter(id => id !== templateId));
    } else {
      setSelectedTemplates([...selectedTemplates, templateId]);
    }
  };

  const applySelectedTemplates = () => {
    const templates = availableTemplates.filter(t => t.id && selectedTemplates.includes(t.id));
    if (templates.length === 0) return;

    // Combine template data
    const combinedComplaints = templates.map(t => t.anamnesis.mainComplaint).join(' | ');
    const combinedObservations = templates.map(t => t.anamnesis.observations).join(' | ');
    const combinedObjectives = templates.map(t => t.anamnesis.objectives).join(' | ');
    const combinedTreatment = templates.map(t => `${t.name}:\n${t.treatmentNotes}`).join('\n\n');
    const combinedRecommendations = templates.map(t => t.recommendations).filter(Boolean).join(' | ');

    // Combine techniques from all selected templates (without duplicates)
    const allTechniques = templates.flatMap(t => t.techniques || []);
    const uniqueTechniques = Array.from(new Set([...selectedTechniques, ...allTechniques]));

    setAnamnesis({
      ...anamnesis,
      mainComplaint: combinedComplaints,
      observations: combinedObservations,
      objectives: combinedObjectives,
      recommendations: combinedRecommendations
    });
    setTreatmentNotes(combinedTreatment);
    setSelectedTechniques(uniqueTechniques);
  };

  const handleFinishSession = async () => {
      if (!patient.id) return;
      const sessionData: Session = {
          patientId: patient.id,
          date: new Date().toISOString(),
          type: sessionType,
          anamnesis: {
            ...anamnesis,
            generatedReport,
            techniques: selectedTechniques.join(', ')
          },
          tensions: tensions,
          treatmentNotes: treatmentNotes,
          exercises: ['Repos', 'Hydratation'],
          documents: documents,
          price: calculatedPrice,
      };
      await db.sessions.add(sessionData);
      localStorage.removeItem(STORAGE_KEY);
      onComplete();
  };

  // Définir les techniques disponibles selon le type de patient et de séance
  const getTechniquesByType = (): { category: string; techniques: string[] }[] => {
    if (sessionType === 'MASSAGE' && (patient.type === PatientType.EQUINE || patient.type === PatientType.CANINE)) {
      return [
        {
          category: 'Massage Sportif',
          techniques: ['Pré-compétition', 'Post-compétition', 'Récupération musculaire', 'Entretien régulier', 'Préparation physique', 'Optimisation performance']
        },
        {
          category: 'Massage Thérapeutique',
          techniques: ['Relaxant/Bien-être', 'Drainage lymphatique', 'Points trigger/gâchettes', 'Myofascial', 'Tissus profonds', 'Décontractant']
        },
        {
          category: 'Techniques Manuelles',
          techniques: ['Stretching passif', 'Stretching actif', 'Mobilisations articulaires', 'Shiatsu équin', 'Acupression', 'Effleurage', 'Pétrissage', 'Friction']
        },
        {
          category: 'Spécialisations',
          techniques: ['Massage dos/colonne', 'Massage membres', 'Massage encolure', 'Traitement tendinites', 'Traitement contractures', 'Soin sabots/pieds']
        },
        {
          category: 'Approches Complémentaires',
          techniques: ['Thermothérapie (chaud)', 'Cryothérapie (froid)', 'Ventouses', 'Kinésiotaping', 'Laser thérapeutique', 'Ultrasons']
        }
      ];
    } else if (sessionType === 'KINESIO' && patient.type === PatientType.HUMAN) {
      return [
        {
          category: 'Kinésiologie Éducative',
          techniques: ['Brain Gym (Edu-K)', 'Touch For Health (TFH)', 'Santé par le Toucher', 'RMTi (Réflexes archaïques)', 'Edu-Kinésiologie', 'LEAP (Learning Enhancement)', 'Kinésiologie apprentissage']
        },
        {
          category: 'Kinésiologie Émotionnelle',
          techniques: ['Three In One Concepts', 'One Brain', 'Libération émotionnelle', 'Baromètre du comportement', 'Récession d\'âge', 'Stress Release', 'PKP (Professional Kinesiology)', 'SIPS (Stress Indicator Point System)']
        },
        {
          category: 'Kinésiologie Structurelle',
          techniques: ['Équilibration énergétique', 'Test musculaire', 'Points neuro-lymphatiques', 'Points neuro-vasculaires', 'Correctifs méridiens', 'Mode Sabotage', 'Formatage Oreille', 'Cross Crawl']
        },
        {
          category: 'Techniques Énergétiques',
          techniques: ['Équilibration chakras', 'Travail méridiens', 'Harmonisation énergétique', 'Ancrage/enracinement', 'Nettoyage énergétique', 'Protection énergétique']
        },
        {
          category: 'Kinésiologie Spécialisée',
          techniques: ['Kinésiologie périnatale', 'Kinésiologie enfants', 'Kinésiologie sport', 'Kinésiologie nutrition', 'TFH métaphores', 'Wellness Kinesiology']
        },
        {
          category: 'Soins Énergétiques & Reiki',
          techniques: ['Reiki Usui', 'Reiki Karuna', 'Reiki tibétain', 'LaHoChi', 'Magnétisme', 'Soin énergétique global', 'Harmonisation énergétique Reiki']
        },
        {
          category: 'Techniques Complémentaires',
          techniques: ['EFT (Emotional Freedom)', 'TAT (Tapas Acupressure)', 'Fleurs de Bach', 'Chromothérapie', 'Lithothérapie', 'Aromathérapie énergétique']
        }
      ];
    } else if (sessionType === 'KINESIO' && (patient.type === PatientType.EQUINE || patient.type === PatientType.CANINE)) {
      return [
        {
          category: 'Kinésiologie Animale Base',
          techniques: ['Test musculaire animal', 'Équilibration énergétique', 'Travail méridiens', 'Équilibration chakras', 'Harmonisation corps énergétique', 'Scan corporel énergétique']
        },
        {
          category: 'Travail Émotionnel Animal',
          techniques: ['Libération émotionnelle', 'Fleurs de Bach', 'Stress post-traumatique', 'Anxiété séparation', 'Peurs/phobies', 'Comportement', 'Communication animale']
        },
        {
          category: 'Techniques Spécialisées',
          techniques: ['Touch For Health animal', 'Méthode Masterson (équin)', 'Tellington TTouch', 'Shiatsu animal', 'Acupression animale', 'Ostéo-kinésio']
        },
        {
          category: 'Énergétique & Performance',
          techniques: ['Optimisation performance', 'Préparation compétition', 'Récupération', 'Gestion stress', 'Vitalité/tonus', 'Concentration']
        },
        {
          category: 'Soins Énergétiques & Reiki',
          techniques: ['Reiki animal', 'Reiki équin', 'Reiki canin', 'Magnétisme animal', 'LaHoChi animal', 'Soin énergétique global', 'Harmonisation Reiki']
        },
        {
          category: 'Problématiques Spécifiques',
          techniques: ['Douleurs chroniques', 'Boiteries énergétiques', 'Troubles digestifs', 'Problèmes dermatologiques', 'Vieillissement', 'Fin de vie/accompagnement']
        }
      ];
    }
    return [];
  };

  const toggleTechnique = (technique: string) => {
    if (selectedTechniques.includes(technique)) {
      setSelectedTechniques(selectedTechniques.filter(t => t !== technique));
    } else {
      setSelectedTechniques([...selectedTechniques, technique]);
    }
  };

  // Renders...
  const renderAnamnesis = () => {
    const availableTechniques = getTechniquesByType();

    return (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">1. Type de Séance & Techniques</h3>

      {/* Sélection Type de Séance */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-center mb-4 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setSessionType('KINESIO');
                setSelectedTechniques([]);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${sessionType === 'KINESIO' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}
            >
              Kinésiologie
            </button>
            <button
              onClick={() => {
                setSessionType('MASSAGE');
                setSelectedTechniques([]);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${sessionType === 'MASSAGE' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}
            >
              Massage
            </button>
        </div>

        {/* Sélection des Techniques */}
        {availableTechniques.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center">
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
              Techniques utilisées (cliquez pour sélectionner)
            </h4>

            {availableTechniques.map((category, idx) => (
              <div key={idx} className="bg-gradient-to-r from-slate-50 to-white p-3 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase mb-2">{category.category}</p>
                <div className="flex flex-wrap gap-2">
                  {category.techniques.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => toggleTechnique(tech)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border-2 transition-all ${
                        selectedTechniques.includes(tech)
                          ? 'bg-primary-500 text-white border-primary-600 shadow-md'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-primary-400'
                      }`}
                    >
                      {selectedTechniques.includes(tech) && '✓ '}
                      {tech}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {selectedTechniques.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-bold text-green-800 mb-1">
                  ✓ {selectedTechniques.length} technique(s) sélectionnée(s)
                </p>
                <p className="text-xs text-green-700">
                  {selectedTechniques.join(' • ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Templates Suggérés (Optionnel) */}
      {getRelevantTemplates().length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <FileText size={18} className="text-purple-600 mr-2" />
              <h4 className="text-sm font-bold text-purple-900">Templates d'aide (optionnel)</h4>
            </div>
            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              {getRelevantTemplates().length} disponibles
            </span>
          </div>
          <p className="text-xs text-purple-700 mb-3">
            Sélectionnez un ou plusieurs templates pour pré-remplir les champs. Vous pourrez modifier ensuite.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
            {getRelevantTemplates().map((template) => (
              <div
                key={template.id}
                onClick={() => template.id && toggleTemplate(template.id)}
                className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${
                  selectedTemplates.includes(template.id || 0)
                    ? 'bg-purple-500 text-white border-purple-600 shadow-md'
                    : 'bg-white text-slate-700 border-purple-200 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold">{selectedTemplates.includes(template.id || 0) && '✓ '}{template.name}</p>
                    <p className={`text-xs mt-1 ${selectedTemplates.includes(template.id || 0) ? 'text-purple-100' : 'text-slate-500'}`}>
                      {template.anamnesis.mainComplaint.substring(0, 60)}...
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedTemplates.includes(template.id || 0)
                      ? 'bg-purple-400 text-white'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {template.duration}min
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedTemplates.length > 0 && (
            <button
              onClick={applySelectedTemplates}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all"
            >
              Appliquer {selectedTemplates.length} template(s) sélectionné(s)
            </button>
          )}
        </div>
      )}

      {/* Anamnèse */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h4 className="text-sm font-bold text-slate-700">Anamnèse & Contexte</h4>
        <div>
             <label className="block text-sm font-medium text-slate-600 mb-1">Plainte principale</label>
             <input type="text" className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="Ex: Douleur dorsale, stress, anxiété..." value={anamnesis.mainComplaint || ''} onChange={(e) => setAnamnesis({...anamnesis, mainComplaint: e.target.value})} />
        </div>
        <div>
             <label className="block text-sm font-medium text-slate-600 mb-1">Observations</label>
             <textarea className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm" rows={2} placeholder="Tension, posture, état général..." value={anamnesis.observations || ''} onChange={(e) => setAnamnesis({...anamnesis, observations: e.target.value})} />
        </div>
        <div>
             <label className="block text-sm font-medium text-slate-600 mb-1">Objectifs</label>
             <input type="text" className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="Ex: Soulagement douleur, relaxation..." value={anamnesis.objectives || ''} onChange={(e) => setAnamnesis({...anamnesis, objectives: e.target.value})} />
        </div>
        <div>
             <label className="block text-sm font-medium text-slate-600 mb-1">Notes libres</label>
             <textarea className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm" rows={3} placeholder="Observations générales..." value={anamnesis.notes || ''} onChange={(e) => setAnamnesis({...anamnesis, notes: e.target.value})} />
        </div>
      </div>
    </div>
  );
  };

  const renderObservation = () => (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">2. Médias & Observation</h3>
      <div className="grid grid-cols-2 gap-4">
          <div onClick={() => setVideoUploaded(true)} className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer text-center ${videoUploaded ? 'border-green-400 bg-green-50' : 'border-primary-200 bg-primary-50 hover:bg-primary-100'}`}>
              {videoUploaded ? (<><CheckCircle size={32} className="text-green-500 mb-2" /><p className="text-green-800 font-bold text-sm">Vidéo Locomotion OK</p></>) : (<><Video size={32} className="text-primary-400 mb-2" /><p className="text-primary-700 font-medium text-sm">Ajouter Vidéo</p></>)}
          </div>
          <div onClick={handleFileUpload} className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer text-center">
             <Upload size={32} className="text-gray-400 mb-2" />
             <p className="text-gray-600 font-medium text-sm">Ajouter Photo/Doc</p>
             <span className="text-xs text-gray-400 mt-1">{documents.length} doc(s)</span>
          </div>
      </div>
    </div>
  );

  const renderTreatment = () => {
    const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setTensions([...tensions, { x, y, id: Date.now().toString(), level: 5, notes: '' }]);
    };

    return (
      <div className="space-y-4 animate-fadeIn h-full flex flex-col">
        <div className="flex justify-between items-center">
             <h3 className="text-lg font-semibold text-slate-800">3. Soin & Body Mapping</h3>
             <button className="text-xs text-red-500 underline" onClick={() => setTensions([])}>Effacer points</button>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden flex items-center justify-center min-h-[300px]">
            <svg viewBox="0 0 100 100" className="h-full w-full cursor-crosshair" onClick={handleMapClick}>
                {patient.type === PatientType.EQUINE ? (
                    <path d="M20,50 Q25,30 40,35 T60,35 T80,45 L80,80 L70,80 L70,55 L50,55 L50,80 L40,80 L40,55 L25,55 Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
                ) : patient.type === PatientType.CANINE ? (
                    <g>
                      {/* Chien en profil - Tête */}
                      <ellipse cx="20" cy="35" rx="8" ry="10" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5"/>
                      {/* Oreille */}
                      <path d="M18,28 Q15,22 18,26" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5"/>
                      {/* Museau */}
                      <ellipse cx="14" cy="36" rx="4" ry="3" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.2"/>
                      {/* Corps */}
                      <ellipse cx="45" cy="45" rx="25" ry="15" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5"/>
                      {/* Encolure */}
                      <path d="M28,35 Q35,38 35,45" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5"/>
                      {/* Pattes avant gauche */}
                      <line x1="35" y1="60" x2="35" y2="78" stroke="#64748b" strokeWidth="2.5"/>
                      {/* Pattes avant droite */}
                      <line x1="40" y1="60" x2="40" y2="78" stroke="#64748b" strokeWidth="2"/>
                      {/* Pattes arrière gauche */}
                      <line x1="58" y1="60" x2="58" y2="78" stroke="#64748b" strokeWidth="2.5"/>
                      {/* Pattes arrière droite */}
                      <line x1="53" y1="60" x2="53" y2="78" stroke="#64748b" strokeWidth="2"/>
                      {/* Queue */}
                      <path d="M68,42 Q75,38 78,45" fill="none" stroke="#64748b" strokeWidth="2"/>
                      {/* Colonne vertébrale (zone importante) */}
                      <line x1="30" y1="38" x2="65" y2="38" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2"/>
                    </g>
                ) : (
                    <g transform="translate(25, 10) scale(0.5)">
                       <path d="M50,10 Q60,10 60,20 L65,45 L90,40 L95,50 L70,60 L70,100 L80,150 L60,150 L55,100 L45,100 L40,150 L20,150 L30,100 L30,60 L5,50 L10,40 L35,45 L40,20 Q40,10 50,10 Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="3"/>
                    </g>
                )}
                {tensions.map((t, i) => (
                    <circle key={i} cx={t.x} cy={t.y} r="3" fill="#ef4444" className="animate-pulse shadow-lg" />
                ))}
            </svg>
        </div>
        <textarea className="w-full p-3 text-sm border border-gray-200 rounded-lg" placeholder="Notes de traitement détaillées..." value={treatmentNotes} onChange={(e) => setTreatmentNotes(e.target.value)}/>
      </div>
    );
  }

  const renderSummary = () => (
    <div className="space-y-6 animate-fadeIn">
       <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Séance Terminée</h3>
       </div>

       {/* Social Share Section */}
       <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 shadow-sm">
           <div className="flex items-center mb-4">
               <Camera size={20} className="text-purple-600 mr-2" />
               <h4 className="font-bold text-purple-900">Générateur de Story</h4>
           </div>
           <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex flex-col gap-3 justify-center w-full">
                   <button onClick={handleSocialShare} className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow hover:shadow-lg">
                       <Instagram size={18} className="mr-2" /> Partager sur Instagram
                   </button>
               </div>
           </div>
       </div>
       
       {/* Compte-Rendu Éditable - Style Document Word */}
       <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden">
           {/* Toolbar Mobile-Friendly */}
           <div className="p-3 md:p-4 border-b-2 border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex items-center">
                    <FileText size={18} className="text-blue-600 mr-2" />
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">Compte-Rendu Éditable</h4>
                  </div>
                  <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
                      <button onClick={handleGenerateReport} disabled={generatingReport} className="flex items-center text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 md:px-4 py-2 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 whitespace-nowrap">
                          {generatingReport ? <span className="animate-pulse">Génération...</span> : <><Wand2 size={14} className="mr-1.5"/> Générer IA</>}
                      </button>
                      <button onClick={openDriveModal} className="p-2 bg-white border border-gray-300 rounded-lg text-slate-600 hover:bg-blue-50 transition-all" title="Drive">
                          <HardDrive size={16} />
                      </button>
                      <button onClick={handleEmailPDF} className="p-2 bg-white border border-gray-300 rounded-lg text-slate-600 hover:bg-green-50 transition-all" title="Envoyer par email">
                          <Mail size={16} />
                      </button>
                      <button onClick={handleExportPDF} className="p-2 bg-white border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50 transition-all" title="Télécharger PDF">
                          <Download size={16} />
                      </button>
                  </div>
                </div>
           </div>

           {/* Document Word-Style Éditable */}
           <div className="bg-gradient-to-b from-gray-50 to-white p-3 md:p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
             <div className="bg-white shadow-md md:shadow-2xl rounded-lg border border-gray-300 mx-auto p-4 md:p-8" style={{ maxWidth: '800px' }}>

               {/* En-tête Document */}
               <div className="border-b-4 border-teal-600 pb-3 md:pb-4 mb-4 md:mb-6">
                 <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                   <div>
                     <h1 className="text-xl md:text-3xl font-bold text-slate-800 mb-1">TheraFlow</h1>
                     <p className="text-xs md:text-sm text-slate-600">{settings?.practitioner?.name || 'Praticien'}</p>
                     <p className="text-[10px] md:text-xs text-slate-500">{settings?.practitioner?.email || ''}</p>
                   </div>
                   <div className="text-left md:text-right">
                     <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide">Compte-Rendu</p>
                     <p className="text-xs md:text-sm font-bold text-slate-700">{new Date().toLocaleDateString('fr-FR')}</p>
                   </div>
                 </div>
               </div>

               {/* Informations Patient */}
               <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 p-3 md:p-4 rounded-r-lg mb-4 md:mb-6">
                 <h2 className="text-sm md:text-lg font-bold text-teal-900 mb-2 md:mb-3">Informations Patient</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                   <div>
                     <span className="font-semibold text-teal-800">Patient :</span>
                     <span className="ml-2 text-slate-700">{patient.name}</span>
                   </div>
                   <div>
                     <span className="font-semibold text-teal-800">Type :</span>
                     <span className="ml-2 text-slate-700">{patient.type}</span>
                   </div>
                   <div>
                     <span className="font-semibold text-teal-800">Séance :</span>
                     <span className="ml-2 text-slate-700">{sessionType === 'KINESIO' ? 'Kinésiologie' : 'Massage'}</span>
                   </div>
                   <div>
                     <span className="font-semibold text-teal-800">Date :</span>
                     <span className="ml-2 text-slate-700">{new Date().toLocaleDateString('fr-FR')}</span>
                   </div>
                 </div>
               </div>

               {/* Section Éditable: Plainte Principale */}
               <div className="mb-4">
                 <h3 className="text-sm md:text-base font-bold text-red-900 mb-2 flex items-center">
                   <span className="w-1 h-6 bg-red-500 rounded mr-2"></span>
                   Plainte Principale
                 </h3>
                 <textarea
                   value={anamnesis.mainComplaint || ''}
                   onChange={(e) => setAnamnesis({...anamnesis, mainComplaint: e.target.value})}
                   className="w-full p-3 bg-red-50 border-2 border-red-200 rounded-lg text-xs md:text-sm text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none font-sans leading-relaxed resize-none"
                   rows={2}
                   placeholder="Décrivez la plainte principale du patient..."
                 />
               </div>

               {/* Section Éditable: Observations */}
               <div className="mb-4">
                 <h3 className="text-sm md:text-base font-bold text-blue-900 mb-2 flex items-center">
                   <span className="w-1 h-6 bg-blue-500 rounded mr-2"></span>
                   Observations
                 </h3>
                 <textarea
                   value={anamnesis.observations || ''}
                   onChange={(e) => setAnamnesis({...anamnesis, observations: e.target.value})}
                   className="w-full p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-xs md:text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-sans leading-relaxed resize-none"
                   rows={3}
                   placeholder="Notez vos observations (posture, tension, état général...)..."
                 />
               </div>

               {/* Section Éditable: Objectifs */}
               <div className="mb-4">
                 <h3 className="text-sm md:text-base font-bold text-purple-900 mb-2 flex items-center">
                   <span className="w-1 h-6 bg-purple-500 rounded mr-2"></span>
                   Objectifs de la Séance
                 </h3>
                 <textarea
                   value={anamnesis.objectives || ''}
                   onChange={(e) => setAnamnesis({...anamnesis, objectives: e.target.value})}
                   className="w-full p-3 bg-purple-50 border-2 border-purple-200 rounded-lg text-xs md:text-sm text-purple-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none font-sans leading-relaxed resize-none"
                   rows={2}
                   placeholder="Quels sont les objectifs de cette séance..."
                 />
               </div>

               {/* Techniques Utilisées (Read-only mais visible) */}
               {selectedTechniques.length > 0 && (
                 <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg">
                   <h3 className="text-sm md:text-base font-bold text-amber-900 mb-2">Techniques Utilisées</h3>
                   <div className="flex flex-wrap gap-2">
                     {selectedTechniques.map((tech, i) => (
                       <span key={i} className="px-2 md:px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-[10px] md:text-xs font-medium">
                         {tech}
                       </span>
                     ))}
                   </div>
                 </div>
               )}

               {/* Section Éditable: Protocole de Traitement */}
               <div className="mb-4">
                 <h3 className="text-sm md:text-base font-bold text-emerald-900 mb-2 flex items-center">
                   <span className="w-1 h-6 bg-emerald-500 rounded mr-2"></span>
                   Protocole & Déroulement
                 </h3>
                 <textarea
                   value={treatmentNotes}
                   onChange={(e) => setTreatmentNotes(e.target.value)}
                   className="w-full p-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg text-xs md:text-sm text-emerald-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-sans leading-relaxed resize-none"
                   rows={6}
                   placeholder="Décrivez le protocole et le déroulement de la séance (étapes, techniques appliquées, réactions...)..."
                 />
               </div>

               {/* Section Éditable: Notes & Rapport Complet */}
               <div className="mb-4">
                 <h3 className="text-sm md:text-base font-bold text-slate-900 mb-2 flex items-center">
                   <span className="w-1 h-6 bg-slate-500 rounded mr-2"></span>
                   Notes Complémentaires & Rapport
                 </h3>
                 <textarea
                   value={generatedReport}
                   onChange={(e) => setGeneratedReport(e.target.value)}
                   className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-300 rounded-lg text-xs md:text-sm text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none font-sans leading-relaxed resize-none"
                   rows={8}
                   placeholder="Rédigez ici le compte-rendu détaillé de la séance...&#10;&#10;Vous pouvez utiliser le bouton 'Générer IA' ci-dessus pour créer automatiquement un rapport basé sur les informations saisies.&#10;&#10;Contenu suggéré :&#10;- Déroulement détaillé de la séance&#10;- Réactions et ressentis du patient&#10;- Zones spécifiques traitées&#10;- Améliorations constatées&#10;- Points d'attention pour les prochaines séances&#10;- Conseils et recommandations"
                 />
               </div>

               {/* Section Éditable: Recommandations */}
               <div className="mb-6">
                 <h3 className="text-sm md:text-base font-bold text-teal-900 mb-2 flex items-center">
                   <span className="w-1 h-6 bg-teal-500 rounded mr-2"></span>
                   Recommandations & Conseils
                 </h3>
                 <textarea
                   value={anamnesis.recommendations || ''}
                   onChange={(e) => setAnamnesis({...anamnesis, recommendations: e.target.value})}
                   className="w-full p-3 bg-teal-50 border-2 border-teal-200 rounded-lg text-xs md:text-sm text-teal-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none font-sans leading-relaxed resize-none"
                   rows={3}
                   placeholder="Recommandations à donner au patient (repos, hydratation, exercices...)..."
                 />
               </div>

               {/* Footer */}
               <div className="border-t-2 border-gray-300 pt-3 md:pt-4 mt-6 md:mt-8 text-center">
                 <p className="text-[10px] md:text-xs text-slate-500">
                   Document généré par TheraFlow - {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                 </p>
               </div>
             </div>
           </div>
       </div>

       <div className="bg-slate-800 p-4 rounded-xl text-white flex justify-between items-center shadow-lg">
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Total à Facturer</p>
                <div className="flex items-center text-xs text-slate-400 mt-1">
                    <span className="bg-slate-700 px-2 py-0.5 rounded mr-2">{sessionType}</span>
                    {patient.type !== PatientType.HUMAN && <span>+ Frais km</span>}
                </div>
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold">{calculatedPrice.toFixed(2)} €</span>
            </div>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white md:rounded-2xl md:shadow-xl overflow-hidden">
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center">
           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${patient.type === PatientType.HUMAN ? 'bg-teal-500' : 'bg-amber-500'}`}>
              {patient.name.substring(0,2).toUpperCase()}
           </div>
           <div>
             <h2 className="text-sm font-bold">{patient.name}</h2>
             <div className="flex items-center space-x-2">
                 <p className="text-[10px] text-slate-400">{patient.type === PatientType.HUMAN ? 'Consultation Cabinet' : 'Visite Extérieure'}</p>
                 {lastSaved && <span className="text-[9px] text-primary-400 flex items-center"><Clock size={9} className="mr-1"/>Sauvegardé</span>}
             </div>
           </div>
        </div>
        <div className="text-xs font-mono text-primary-300">Étape {String(step).padStart(2, '0')}/04</div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {step === 1 && renderAnamnesis()}
        {step === 2 && renderObservation()}
        {step === 3 && renderTreatment()}
        {step === 4 && renderSummary()}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex justify-between shrink-0">
        {step > 1 ? (<button onClick={() => setStep(step - 1)} className="flex items-center px-4 py-2 text-slate-600 font-medium"><ChevronLeft size={18} className="mr-1" /> Retour</button>) : <div />} 
        {step < 4 ? (
            <button onClick={() => setStep(step + 1)} className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-full font-medium shadow-lg">{step === 3 ? 'Terminer' : 'Suivant'} <ChevronRight size={18} className="ml-1" /></button>
        ) : (
            <button onClick={handleFinishSession} className="flex items-center justify-center px-6 py-3 bg-slate-800 text-white rounded-xl font-medium"><Save size={18} className="mr-2" /> Enregistrer</button>
        )}
      </div>

      {showDriveModal && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                <h3 className="font-bold text-lg mb-4">Sauvegarder sur Drive</h3>
                <p className="text-sm text-slate-500 mb-4">Sélectionnez un dossier de destination :</p>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {driveFolders.map(f => (
                        <button key={f.id} onClick={() => setSelectedFolder(f.id)} className={`w-full text-left p-2 rounded text-sm flex items-center ${selectedFolder === f.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}>
                            <HardDrive size={14} className="mr-2"/> {f.name}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowDriveModal(false)} className="px-3 py-1.5 text-slate-500 text-sm">Annuler</button>
                    <button onClick={handleSaveToDrive} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Sauvegarder</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SessionWizard;