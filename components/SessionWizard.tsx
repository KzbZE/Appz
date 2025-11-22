import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientType, SessionDocument, AppSettings, Session } from '../types';
import { generateSessionReport } from '../services/geminiService';
import { checkAuth, listDriveFolders, uploadToDriveReal } from '../services/googleApiService';
import { ChevronRight, ChevronLeft, Save, Video, AlertCircle, CheckCircle, Wand2, Upload, Download, Share2, Instagram, Facebook, Camera, Clock, HardDrive } from 'lucide-react';
import { db } from '../db';
import { jsPDF } from 'jspdf';

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
      doc.setFontSize(20);
      doc.text(`Compte-Rendu de Séance`, 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Patient: ${patient.name}`, 20, 40);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
      doc.text(`Type: ${sessionType}`, 20, 60);

      doc.setFontSize(14);
      doc.text("Anamnèse", 20, 80);
      doc.setFontSize(10);
      let y = 90;
      Object.entries(anamnesis).forEach(([k, v]) => {
          if (k !== 'generatedReport' && y < 280) {
            doc.text(`${k}: ${v}`, 20, y);
            y += 10;
          }
      });

      y += 10;
      doc.setFontSize(14);
      doc.text("Rapport", 20, y);
      y += 10;
      doc.setFontSize(10);
      
      const splitText = doc.splitTextToSize(generatedReport || treatmentNotes, 170);
      doc.text(splitText, 20, y);
      
      return doc;
  };

  const handleExportPDF = () => {
    const doc = generatePDF();
    doc.save(`CR_${patient.name}_${new Date().toISOString().split('T')[0]}.pdf`);
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
          setDriveFolders(folders);
          setShowDriveModal(true);
      } else {
          alert("Veuillez d'abord connecter votre compte Google dans les Paramètres");
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

      {/* Anamnèse */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h4 className="text-sm font-bold text-slate-700">Anamnèse & Contexte</h4>
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
       
       {/* Report Section with PDF/Drive */}
       <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h4 className="font-bold text-slate-700">Compte-Rendu</h4>
                <div className="flex space-x-2">
                    <button onClick={openDriveModal} className="p-1.5 bg-white border border-gray-300 rounded-lg text-slate-600 hover:bg-blue-50" title="Sauvegarder sur Drive">
                        <HardDrive size={14} />
                    </button>
                    <button onClick={handleExportPDF} className="p-1.5 bg-white border rounded-lg text-slate-600 hover:bg-gray-50" title="Télécharger PDF">
                        <Download size={14} />
                    </button>
                    <button onClick={handleGenerateReport} disabled={generatingReport} className="flex items-center text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 hover:bg-indigo-100">
                        {generatingReport ? <span className="animate-pulse">Rédaction...</span> : <><Wand2 size={12} className="mr-1"/> Rédiger</>}
                    </button>
                </div>
           </div>
           <div className="p-4">
                <textarea value={generatedReport} onChange={(e) => setGeneratedReport(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 min-h-[100px] outline-none" placeholder="Notes ou rapport généré..."/>
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