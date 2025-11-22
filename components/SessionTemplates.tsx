import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Search, Edit, Trash2, Copy, FileText, X, Save, Star } from 'lucide-react';

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

  const categories = ['Kinésiologie Humain', 'Kinésiologie Animal', 'Massage Équin', 'Massage Canin', 'Autre'];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.treatmentNotes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
    const matchesType = filterType === 'ALL' || t.patientType === filterType || t.patientType === 'ALL';

    return matchesSearch && matchesCategory && matchesType;
  });

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
    // This would open the session wizard with pre-filled data
    alert(`Utilisation du template "${template.name}".\nDans une version complète, cela ouvrirait le wizard de séance avec les données pré-remplies.`);
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-20 md:pb-0">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{template.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                      {template.category}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {template.patientType === 'ALL' ? 'Universel' : template.patientType}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (template.id) toggleFavorite(template.id);
                  }}
                  className="p-1"
                >
                  <Star
                    size={20}
                    className={template.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                  />
                </button>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div>
                  <span className="font-bold text-slate-700">Plainte :</span> {template.anamnesis.mainComplaint}
                </div>
                <div>
                  <span className="font-bold text-slate-700">Objectifs :</span> {template.anamnesis.objectives}
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-xs">
                  <div className="font-bold text-slate-700 mb-1">Traitement :</div>
                  <div className="line-clamp-3 whitespace-pre-wrap">{template.treatmentNotes}</div>
                </div>
              </div>

              <div className="flex items-center text-xs text-slate-500 mt-3">
                <span className="font-bold">Durée :</span>
                <span className="ml-1">{template.duration} min</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-4 border-t border-gray-100">
              <button
                onClick={() => useTemplate(template)}
                className="p-3 hover:bg-emerald-50 transition-colors flex items-center justify-center border-r border-gray-100"
              >
                <FileText size={16} className="text-emerald-600" />
              </button>
              <button
                onClick={() => handleEdit(template)}
                className="p-3 hover:bg-blue-50 transition-colors flex items-center justify-center border-r border-gray-100"
              >
                <Edit size={16} className="text-blue-600" />
              </button>
              <button
                onClick={() => handleDuplicate(template)}
                className="p-3 hover:bg-purple-50 transition-colors flex items-center justify-center border-r border-gray-100"
              >
                <Copy size={16} className="text-purple-600" />
              </button>
              <button
                onClick={() => template.id && handleDelete(template.id)}
                className="p-3 hover:bg-red-50 transition-colors flex items-center justify-center"
              >
                <Trash2 size={16} className="text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

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
