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
    {
      id: 1,
      name: 'Lombalgie Aiguë',
      category: 'Kinésithérapie',
      patientType: 'HUMAN',
      anamnesis: {
        mainComplaint: 'Douleur lombaire aiguë depuis X jours',
        observations: 'Limitation amplitude flexion/extension. Contracture paravertébrale.',
        objectives: 'Réduction douleur, récupération amplitude, reprise activités'
      },
      treatmentNotes: `1. Mise en décharge - Position antalgique\n2. Massage décontracturant paravertébraux\n3. Mobilisations douces rachis lombaire\n4. Renforcement gainage progressif\n5. Éducation thérapeutique postures`,
      duration: 45,
      exercises: `À domicile (2x/jour):\n- Étirement psoas: 3x30sec chaque côté\n- Gainage planche: 3x20sec\n- Chat-chameau: 10 répétitions`,
      recommendations: 'Éviter port de charges lourdes. Maintenir activité physique adaptée. Glace si douleur.',
      favorite: true
    },
    {
      id: 2,
      name: 'Tendinite Membre Antérieur',
      category: 'Équine',
      patientType: 'EQUINE',
      anamnesis: {
        mainComplaint: 'Boiterie membre antérieur, chaleur tendon',
        observations: 'Œdème tendon fléchisseur. Sensibilité palpation.',
        objectives: 'Réduction inflammation, cicatrisation tendineuse, reprise travail progressive'
      },
      treatmentNotes: `1. Cryothérapie 15min\n2. Massage drainant lymphatique membre\n3. Ultrasons pulsés zone tendineuse\n4. Mobilisations passives articulations\n5. Pose bandes de contention`,
      duration: 60,
      recommendations: 'Repos box strict 10j. Contrôle vétérinaire J+7. Reprise au pas en main.',
      favorite: false
    },
    {
      id: 3,
      name: 'Rééducation Post-Chirurgie LCA',
      category: 'Kinésithérapie',
      patientType: 'HUMAN',
      anamnesis: {
        mainComplaint: 'Post-op LCA J+30',
        observations: 'Cicatrice en cours. Amplitude limitée genou. Amyotrophie quadriceps.',
        objectives: 'Récupération amplitude complète, renforcement musculaire, proprioception'
      },
      treatmentNotes: `1. Mobilisations passives puis actives genou\n2. Renforcement quadriceps isométrique\n3. Travail proprioceptif plateau instable\n4. Mobilisation patella\n5. Massage cicatrice`,
      duration: 60,
      exercises: `Programme domicile quotidien:\n- Flexion/extension genou: 3x20\n- Squats partiels: 3x15\n- Équilibre unipodal: 3x30sec`,
      recommendations: 'Port attelle selon protocole. Glace post-séance. Pas de course avant J+90.',
      favorite: true
    },
    {
      id: 4,
      name: 'Dorsalgie Équine',
      category: 'Équine',
      patientType: 'EQUINE',
      anamnesis: {
        mainComplaint: 'Raideur dorsale, défense au pansage',
        observations: 'Contractures musculaires longissimus dorsi. Limitation flexion latérale.',
        objectives: 'Relâchement musculaire, récupération souplesse, amélioration locomotion'
      },
      treatmentNotes: `1. Stretching myofascial encolure/dos\n2. Massage profond muscles dorsaux\n3. Mobilisations articulaires vertébrales\n4. Travail en longe assouplissement\n5. Électrostimulation si disponible`,
      duration: 45,
      recommendations: 'Vérification selle/harnachement. Échauffement progressif avant travail.',
      favorite: false
    },
    {
      id: 5,
      name: 'Massage Sportif Pré-Compétition',
      category: 'Massage',
      patientType: 'ALL',
      anamnesis: {
        mainComplaint: 'Préparation compétition',
        observations: 'Bon état général. Pas de douleur particulière.',
        objectives: 'Optimisation performance, prévention blessures, récupération'
      },
      treatmentNotes: `1. Échauffement tissulaire effleurages\n2. Pétrissages musculaires membres\n3. Frictions transversales tendons\n4. Percussions toniques\n5. Étirements activo-passifs`,
      duration: 30,
      recommendations: 'Hydratation optimale. Échauffement dynamique avant épreuve.',
      favorite: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const [editForm, setEditForm] = useState<SessionTemplate | null>(null);

  const categories = ['Kinésithérapie', 'Équine', 'Massage', 'Ostéopathie', 'Autre'];

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
      category: 'Kinésithérapie',
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
