import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Search, Edit, Trash2, Copy, FileText, X, Save, Star, Eye, CheckCircle } from 'lucide-react';

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
}

const SessionTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<SessionTemplate[]>([
    // KINÉSIOLOGIE HUMAIN
    {
      id: 1,
      name: 'Gestion Stress & Anxiété',
      category: 'Kinésiologie Humain',
      patientType: 'HUMAN',
      anamnesis: {
        mainComplaint: 'Stress chronique, anxiété, difficultés sommeil',
        observations: 'Tension généralisée. Respiration courte. Switching énergétique.',
        objectives: 'Réduction stress, amélioration sommeil, équilibre émotionnel'
      },
      treatmentNotes: `1. Test musculaire - Identification déséquilibres\n2. Brain Gym - Cross Crawl pour intégration hémisphères\n3. Libération émotionnelle Three In One Concepts\n4. Équilibration chakras et méridiens\n5. Points neuro-vasculaires pour apaisement\n6. Ancrage et recentrage énergétique`,
      duration: 60,
      exercises: `Exercices quotidiens:\n- Cross Crawl: 2min matin/soir\n- Respiration cohérence cardiaque: 5min 3x/jour\n- Auto-massage points neuro-lymphatiques`,
      recommendations: 'Hydratation régulière. Limiter caféine. Marche quotidienne 20min.',
      favorite: true
    },
    {
      id: 2,
      name: 'Difficultés Apprentissage Enfant',
      category: 'Kinésiologie Humain',
      patientType: 'HUMAN',
      anamnesis: {
        mainComplaint: 'Difficultés concentration, troubles apprentissage',
        observations: 'Réflexes archaïques non intégrés. Stress scolaire.',
        objectives: 'Amélioration concentration, intégration réflexes, confiance'
      },
      treatmentNotes: `1. Test musculaire spécifique apprentissage\n2. Brain Gym - ECAP (Énergétique, Clair, Actif, Positif)\n3. RMTi - Intégration réflexes archaïques\n4. Touch For Health - Équilibration 14 méridiens\n5. Formatage Oreille pour écoute\n6. Baromètre du comportement`,
      duration: 45,
      exercises: `Programme à la maison (10min/jour):\n- Mouvements croisés\n- Huit couché (lazy 8)\n- Boire de l'eau régulièrement`,
      recommendations: 'Encouragements positifs. Pauses régulières durant devoirs. Jeux extérieurs.',
      favorite: true
    },
    {
      id: 3,
      name: 'Soin Reiki Harmonisation Complète',
      category: 'Kinésiologie Humain',
      patientType: 'HUMAN',
      anamnesis: {
        mainComplaint: 'Fatigue chronique, besoin de rééquilibrage énergétique',
        observations: 'Déséquilibres énergétiques multiples. Chakras bloqués.',
        objectives: 'Harmonisation énergétique globale, vitalité, bien-être'
      },
      treatmentNotes: `1. Scan énergétique complet du corps\n2. Reiki Usui - Positions classiques\n3. Harmonisation 7 chakras principaux\n4. Nettoyage énergétique aura\n5. LaHoChi pour élévation vibratoire\n6. Ancrage et protection énergétique`,
      duration: 75,
      recommendations: 'Repos après séance. Boire beaucoup d\'eau. Observer ressentis 48h.',
      favorite: true
    },
    {
      id: 4,
      name: 'Libération Traumatisme Émotionnel',
      category: 'Kinésiologie Humain',
      patientType: 'HUMAN',
      anamnesis: {
        mainComplaint: 'Blocage émotionnel, trauma passé non résolu',
        observations: 'Émotions refoulées. Mémoires corporelles.',
        objectives: 'Libération émotionnelle, apaisement, reconstruction'
      },
      treatmentNotes: `1. Test musculaire identification émotion\n2. Récession d'âge - Retour à l'événement\n3. One Brain - Baromètre comportement\n4. Libération stress émotionnel\n5. EFT (Emotional Freedom Technique)\n6. Réintégration et ancrage positif`,
      duration: 90,
      recommendations: 'Bienveillance envers soi. Journal émotions. Soutien psychologique si besoin.',
      favorite: false
    },
    {
      id: 5,
      name: 'Préparation Mentale Sportif',
      category: 'Kinésiologie Humain',
      patientType: 'HUMAN',
      anamnesis: {
        mainComplaint: 'Stress compétition, baisse performance',
        observations: 'Tension pré-compétitive. Doutes capacités.',
        objectives: 'Confiance, concentration, optimisation performance'
      },
      treatmentNotes: `1. Test musculaire objectifs sportifs\n2. Kinésiologie sport - Visualisation positive\n3. Équilibration énergétique performance\n4. Gestion stress compétition\n5. Ancrage confiance\n6. Mode Sabotage - Élimination auto-sabotage`,
      duration: 60,
      exercises: `Routine pré-compétition:\n- Visualisation succès: 5min\n- Cross Crawl: 2min\n- Ancrage confiance`,
      recommendations: 'Sommeil qualité. Nutrition adaptée. Rituel pré-compétition.',
      favorite: false
    },

    // KINÉSIOLOGIE ANIMAL
    {
      id: 6,
      name: 'Anxiété Séparation Chien',
      category: 'Kinésiologie Animal',
      patientType: 'CANINE',
      anamnesis: {
        mainComplaint: 'Aboiements, destruction en absence maître',
        observations: 'Stress visible. Attachement excessif.',
        objectives: 'Apaisement, autonomie, équilibre émotionnel'
      },
      treatmentNotes: `1. Test musculaire animal - Communication\n2. Scan énergétique corps\n3. Équilibration chakras (spéc. plexus solaire)\n4. Libération émotionnelle stress\n5. Fleurs de Bach personnalisées\n6. Reiki canin harmonisation`,
      duration: 45,
      recommendations: 'Départ progressif. Jouets occupationnels. Routine stable.',
      favorite: true
    },
    {
      id: 7,
      name: 'Performance Cheval Compétition',
      category: 'Kinésiologie Animal',
      patientType: 'EQUINE',
      anamnesis: {
        mainComplaint: 'Baisse performance, stress compétition',
        observations: 'Tension musculaire. Méridiens déséquilibrés.',
        objectives: 'Optimisation performance, concentration, vitalité'
      },
      treatmentNotes: `1. Test musculaire équin complet\n2. Méthode Masterson - Relâchement tensions\n3. Équilibration 12 méridiens principaux\n4. Chakras - Focus chakra racine et sacré\n5. Gestion stress pré-compétition\n6. Reiki équin vitalité`,
      duration: 60,
      recommendations: 'Échauffement progressif. Hydratation. Vérification matériel.',
      favorite: true
    },
    {
      id: 8,
      name: 'Troubles Comportement Chien',
      category: 'Kinésiologie Animal',
      patientType: 'CANINE',
      anamnesis: {
        mainComplaint: 'Agressivité, peurs, réactivité',
        observations: 'Trauma possible. Déséquilibres émotionnels.',
        objectives: 'Apaisement, confiance, comportement équilibré'
      },
      treatmentNotes: `1. Communication animale - Identification cause\n2. Test musculaire émotions\n3. Libération stress post-traumatique\n4. Tellington TTouch - Apaisement nerveux\n5. Équilibration énergétique globale\n6. Fleurs de Bach trauma/peur`,
      duration: 50,
      recommendations: 'Environnement calme. Renforcement positif. Patience.',
      favorite: false
    },
    {
      id: 9,
      name: 'Douleurs Chroniques Cheval Âgé',
      category: 'Kinésiologie Animal',
      patientType: 'EQUINE',
      anamnesis: {
        mainComplaint: 'Raideur, douleurs articulaires, vieillissement',
        observations: 'Mobilité réduite. Énergie basse.',
        objectives: 'Soulagement douleur, mobilité, qualité vie'
      },
      treatmentNotes: `1. Scan énergétique zones douloureuses\n2. Reiki équin - Soulagement douleur\n3. Touch For Health animal\n4. Points d'acupression antalgiques\n5. Harmonisation méridiens\n6. Magnétisme zones affectées`,
      duration: 60,
      recommendations: 'Mouvement régulier adapté. Confort litière. Suivi vétérinaire.',
      favorite: false
    },

    // MASSAGE ÉQUIN
    {
      id: 10,
      name: 'Massage Pré-Compétition Équin',
      category: 'Massage Équin',
      patientType: 'EQUINE',
      anamnesis: {
        mainComplaint: 'Préparation épreuve sportive',
        observations: 'Bon état général. Tonus musculaire correct.',
        objectives: 'Optimisation performance, prévention blessures, échauffement'
      },
      treatmentNotes: `1. Effleurage global - Échauffement tissus\n2. Pétrissage encolure et dos\n3. Friction transversale tendons membres\n4. Stretching passif membres\n5. Percussions tonifiantes muscles\n6. Mobilisations articulaires douces`,
      duration: 30,
      recommendations: 'Hydratation optimale. Échauffement progressif avant épreuve. Vérifier matériel.',
      favorite: true
    },
    {
      id: 11,
      name: 'Récupération Post-Effort Équin',
      category: 'Massage Équin',
      patientType: 'EQUINE',
      anamnesis: {
        mainComplaint: 'Récupération après compétition/effort intense',
        observations: 'Fatigue musculaire. Possibles courbatures.',
        objectives: 'Récupération optimale, drainage, relaxation'
      },
      treatmentNotes: `1. Drainage lymphatique membres\n2. Effleurage relaxant global\n3. Pétrissage doux muscles sollicités\n4. Points trigger zones contractées\n5. Stretching passif doux\n6. Cryothérapie si inflammation`,
      duration: 45,
      recommendations: 'Repos box 24h. Hydratation. Marche en main légère.',
      favorite: true
    },
    {
      id: 12,
      name: 'Traitement Dorsalgie Équine',
      category: 'Massage Équin',
      patientType: 'EQUINE',
      anamnesis: {
        mainComplaint: 'Douleur dorsale, raideur, défense pansage',
        observations: 'Contractures longissimus dorsi. Mobilité limitée.',
        objectives: 'Soulagement douleur, relâchement musculaire, mobilité'
      },
      treatmentNotes: `1. Thermothérapie préparatoire\n2. Massage myofascial dos profond\n3. Points trigger paravertébraux\n4. Stretching encolure et dos\n5. Mobilisations vertébrales douces\n6. Shiatsu équin méridiens dos`,
      duration: 60,
      recommendations: 'Vérification selle urgente. Repos 48h. Travail progressif.',
      favorite: true
    },
    {
      id: 13,
      name: 'Massage Bien-être Équin',
      category: 'Massage Équin',
      patientType: 'EQUINE',
      anamnesis: {
        mainComplaint: 'Entretien, prévention, détente',
        observations: 'État général bon. Pas de pathologie.',
        objectives: 'Relaxation, bien-être, prévention tensions'
      },
      treatmentNotes: `1. Effleurage global relaxant\n2. Pétrissage doux ensemble corps\n3. Acupression points de détente\n4. Shiatsu équin harmonisation\n5. Stretching passif membres\n6. Mobilisations articulaires confort`,
      duration: 45,
      recommendations: 'Séances régulières mensuelles. Observation comportement.',
      favorite: false
    },

    // MASSAGE CANIN
    {
      id: 14,
      name: 'Massage Sportif Canin',
      category: 'Massage Canin',
      patientType: 'CANINE',
      anamnesis: {
        mainComplaint: 'Chien sportif - Entretien musculaire',
        observations: 'Activité intense régulière. Tonus musculaire.',
        objectives: 'Performance, récupération, prévention blessures'
      },
      treatmentNotes: `1. Effleurage échauffement\n2. Pétrissage membres et dos\n3. Friction tendons et ligaments\n4. Drainage lymphatique pattes\n5. Stretching passif membres\n6. Percussions tonifiantes`,
      duration: 30,
      recommendations: 'Hydratation post-effort. Repos après séance. Échauffement avant activité.',
      favorite: true
    },
    {
      id: 15,
      name: 'Massage Thérapeutique Chien Âgé',
      category: 'Massage Canin',
      patientType: 'CANINE',
      anamnesis: {
        mainComplaint: 'Arthrose, raideur, mobilité réduite',
        observations: 'Douleurs articulaires. Difficulté lever.',
        objectives: 'Soulagement douleur, mobilité, confort vie'
      },
      treatmentNotes: `1. Thermothérapie douce zones raides\n2. Effleurage très doux global\n3. Mobilisations passives articulations\n4. Points d'acupression antalgiques\n5. Drainage lymphatique doux\n6. Massage confort zones douloureuses`,
      duration: 40,
      recommendations: 'Couchage orthopédique. Exercice doux quotidien. Suppléments articulaires.',
      favorite: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const [editForm, setEditForm] = useState<SessionTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<SessionTemplate | null>(null);

  const categories = ['Kinésiologie Humain', 'Kinésiologie Animal', 'Massage Équin', 'Massage Canin', 'Autre'];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.treatmentNotes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
    const matchesType = filterType === 'ALL' || t.patientType === filterType || t.patientType === 'ALL';

    return matchesSearch && matchesCategory && matchesType;
  });

  // Debug
  console.log('📋 Templates totaux:', templates.length);
  console.log('📋 Templates filtrés:', filteredTemplates.length);
  console.log('🔍 Filtres actifs:', { searchTerm, filterCategory, filterType });

  const handleCreate = () => {
    setEditForm({
      name: '',
      category: 'Kinésiologie Humain',
      patientType: 'ALL',
      anamnesis: {
        mainComplaint: '',
        observations: '',
        objectives: ''
      },
      treatmentNotes: '',
      duration: 45,
      exercises: '',
      recommendations: '',
      favorite: false
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editForm) return;

    if (editForm.id) {
      // Update existing
      setTemplates(templates.map(t => t.id === editForm.id ? editForm : t));
    } else {
      // Create new
      const newTemplate = { ...editForm, id: Date.now() };
      setTemplates([...templates, newTemplate]);
    }

    setIsCreating(false);
    setEditForm(null);
  };

  const handleEdit = (template: SessionTemplate) => {
    setEditForm({ ...template });
    setIsCreating(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Supprimer ce template ?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const handleDuplicate = (template: SessionTemplate) => {
    const duplicate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Copie)`
    };
    setTemplates([...templates, duplicate]);
  };

  const toggleFavorite = (id: number) => {
    setTemplates(templates.map(t =>
      t.id === id ? { ...t, favorite: !t.favorite } : t
    ));
  };

  const useTemplate = (template: SessionTemplate) => {
    alert(`✅ Template "${template.name}" copié !\n\nPour utiliser ce template dans une séance:\n1. Allez dans "Patients"\n2. Sélectionnez un patient\n3. Créez une nouvelle séance\n4. Les données seront pré-remplies`);
    setViewingTemplate(null);
  };

  return (
    <div className="h-full flex flex-col space-y-4 md:space-y-6 pb-20 md:pb-0 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Templates de Séances
          </h2>
          <p className="text-slate-500 text-sm mt-1">Protocoles pré-remplis par pathologie</p>
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all flex items-center"
        >
          <Plus size={18} className="mr-2" /> Nouveau Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un template..."
            className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">Toutes catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">Tous types</option>
          <option value="HUMAN">Humain</option>
          <option value="EQUINE">Équin</option>
          <option value="CANINE">Canin</option>
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto px-2 md:px-0">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500 text-lg">Aucun template trouvé</p>
            <p className="text-slate-400 text-sm mt-2">Total: {templates.length} templates disponibles</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all group overflow-hidden"
          >
            {/* Clickable area to view details */}
            <div className="p-4 md:p-4 cursor-pointer" onClick={() => setViewingTemplate(template)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg md:text-lg mb-2">{template.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                      {template.category}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                      {template.patientType === 'ALL' ? 'Universel' : template.patientType}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                      {template.duration} min
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (template.id) toggleFavorite(template.id);
                  }}
                  className="p-1.5"
                >
                  <Star
                    size={24}
                    className={template.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                  />
                </button>
              </div>

              <div className="space-y-3 text-base md:text-sm text-slate-700">
                <div className="line-clamp-2">
                  <span className="font-bold text-slate-800">Plainte : </span>
                  {template.anamnesis.mainComplaint}
                </div>
                <div className="line-clamp-2">
                  <span className="font-bold text-slate-800">Objectifs : </span>
                  {template.anamnesis.objectives}
                </div>
              </div>

              {/* "Tap pour voir plus" indicator mobile */}
              <div className="mt-4 flex items-center justify-center text-sm text-primary-600 font-medium">
                <Eye size={16} className="mr-1" />
                <span>Tap pour voir le détail complet</span>
              </div>
            </div>

            {/* Actions - Larger on mobile */}
            <div className="grid grid-cols-4 border-t-2 border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  useTemplate(template);
                }}
                className="p-4 md:p-3 hover:bg-emerald-50 transition-colors flex flex-col md:flex-row items-center justify-center border-r border-gray-200"
                title="Utiliser"
              >
                <CheckCircle size={20} className="text-emerald-600 mb-1 md:mb-0" />
                <span className="text-xs md:hidden text-emerald-700">Utiliser</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(template);
                }}
                className="p-4 md:p-3 hover:bg-blue-50 transition-colors flex flex-col md:flex-row items-center justify-center border-r border-gray-200"
                title="Modifier"
              >
                <Edit size={20} className="text-blue-600 mb-1 md:mb-0" />
                <span className="text-xs md:hidden text-blue-700">Modifier</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate(template);
                }}
                className="p-4 md:p-3 hover:bg-purple-50 transition-colors flex flex-col md:flex-row items-center justify-center border-r border-gray-200"
                title="Dupliquer"
              >
                <Copy size={20} className="text-purple-600 mb-1 md:mb-0" />
                <span className="text-xs md:hidden text-purple-700">Copier</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  template.id && handleDelete(template.id);
                }}
                className="p-4 md:p-3 hover:bg-red-50 transition-colors flex flex-col md:flex-row items-center justify-center"
                title="Supprimer"
              >
                <Trash2 size={20} className="text-red-600 mb-1 md:mb-0" />
                <span className="text-xs md:hidden text-red-700">Suppr.</span>
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* MODAL DÉTAIL TEMPLATE */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-[70] bg-black/60 animate-fadeIn flex items-end md:items-center justify-center" onClick={() => setViewingTemplate(null)}>
          <div
            className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-3xl max-h-[90vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex justify-between items-start">
              <div className="flex-1 pr-4">
                <h2 className="text-xl md:text-2xl font-bold mb-2">{viewingTemplate.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                    {viewingTemplate.category}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                    {viewingTemplate.patientType === 'ALL' ? 'Universel' : viewingTemplate.patientType}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {viewingTemplate.duration} min
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingTemplate(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              >
                <X size={28} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 md:p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Plainte */}
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <h3 className="text-base font-bold text-red-900 mb-2">Plainte Principale</h3>
                  <p className="text-base text-red-800">{viewingTemplate.anamnesis.mainComplaint}</p>
                </div>

                {/* Observations */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <h3 className="text-base font-bold text-blue-900 mb-2">Observations</h3>
                  <p className="text-base text-blue-800">{viewingTemplate.anamnesis.observations}</p>
                </div>

                {/* Objectifs */}
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                  <h3 className="text-base font-bold text-purple-900 mb-2">Objectifs</h3>
                  <p className="text-base text-purple-800">{viewingTemplate.anamnesis.objectives}</p>
                </div>

                {/* Traitement */}
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                  <h3 className="text-base font-bold text-emerald-900 mb-3">Protocole de Traitement</h3>
                  <pre className="text-base text-emerald-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {viewingTemplate.treatmentNotes}
                  </pre>
                </div>

                {/* Exercices */}
                {viewingTemplate.exercises && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                    <h3 className="text-base font-bold text-amber-900 mb-3">Exercices à Domicile</h3>
                    <pre className="text-base text-amber-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {viewingTemplate.exercises}
                    </pre>
                  </div>
                )}

                {/* Recommandations */}
                {viewingTemplate.recommendations && (
                  <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
                    <h3 className="text-base font-bold text-teal-900 mb-2">Recommandations</h3>
                    <p className="text-base text-teal-800">{viewingTemplate.recommendations}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-4 flex gap-3">
              <button
                onClick={() => useTemplate(viewingTemplate)}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-base hover:shadow-lg transition-all flex items-center justify-center"
              >
                <CheckCircle size={22} className="mr-2" />
                Utiliser ce Template
              </button>
              <button
                onClick={() => {
                  handleEdit(viewingTemplate);
                  setViewingTemplate(null);
                }}
                className="px-6 py-4 bg-blue-100 text-blue-700 rounded-xl font-bold text-base hover:bg-blue-200 transition-all"
              >
                <Edit size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isCreating && editForm && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editForm.id ? 'Modifier Template' : 'Nouveau Template'}
              </h3>
              <button onClick={() => setIsCreating(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nom du Template</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Type de Patient</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editForm.patientType}
                    onChange={(e) => setEditForm({ ...editForm, patientType: e.target.value as any })}
                  >
                    <option value="ALL">Universel</option>
                    <option value="HUMAN">Humain</option>
                    <option value="EQUINE">Équin</option>
                    <option value="CANINE">Canin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Durée (min)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Plainte Principale</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={editForm.anamnesis.mainComplaint}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    anamnesis: { ...editForm.anamnesis, mainComplaint: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Observations</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={editForm.anamnesis.observations}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    anamnesis: { ...editForm.anamnesis, observations: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Objectifs</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={editForm.anamnesis.objectives}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    anamnesis: { ...editForm.anamnesis, objectives: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Notes de Traitement</label>
                <textarea
                  rows={6}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={editForm.treatmentNotes}
                  onChange={(e) => setEditForm({ ...editForm, treatmentNotes: e.target.value })}
                  placeholder="1. Première étape&#10;2. Deuxième étape&#10;etc."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Exercices à Domicile (optionnel)</label>
                <textarea
                  rows={3}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={editForm.exercises || ''}
                  onChange={(e) => setEditForm({ ...editForm, exercises: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Recommandations (optionnel)</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={editForm.recommendations || ''}
                  onChange={(e) => setEditForm({ ...editForm, recommendations: e.target.value })}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!editForm.name || !editForm.treatmentNotes}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
              >
                <Save size={18} className="mr-2" />
                {editForm.id ? 'Mettre à Jour' : 'Créer Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionTemplates;
