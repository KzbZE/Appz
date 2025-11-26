import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, UserCheck, Calendar, DollarSign, BarChart3, Shield, Star, Award } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

interface Practitioner {
  id?: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  role: 'admin' | 'practitioner' | 'assistant';
  color: string;
  avatar?: string;
  active: boolean;
  permissions: {
    managePatients: boolean;
    manageAppointments: boolean;
    viewFinance: boolean;
    manageFinance: boolean;
    manageSettings: boolean;
  };
  stats?: {
    totalAppointments: number;
    totalRevenue: number;
    avgRating: number;
  };
}

const MultiPractitionerModule: React.FC = () => {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([
    {
      id: 1,
      name: 'Dr. Marie Dubois',
      email: 'marie@theraflow.app',
      phone: '+33612345678',
      specialty: 'Kinésithérapie Sportive',
      role: 'admin',
      color: '#0066ff',
      active: true,
      permissions: {
        managePatients: true,
        manageAppointments: true,
        viewFinance: true,
        manageFinance: true,
        manageSettings: true
      },
      stats: {
        totalAppointments: 247,
        totalRevenue: 18500,
        avgRating: 4.9
      }
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPractitioner, setEditingPractitioner] = useState<Practitioner | null>(null);
  const [formData, setFormData] = useState<Practitioner>({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    role: 'practitioner',
    color: '#10b981',
    active: true,
    permissions: {
      managePatients: true,
      manageAppointments: true,
      viewFinance: false,
      manageFinance: false,
      manageSettings: false
    }
  });

  const roleLabels = {
    admin: 'Administrateur',
    practitioner: 'Praticien',
    assistant: 'Assistant(e)'
  };

  const roleIcons = {
    admin: Shield,
    practitioner: Users,
    assistant: UserCheck
  };

  const colors = [
    '#0066ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  const handleAddPractitioner = () => {
    if (editingPractitioner) {
      setPractitioners(practitioners.map(p =>
        p.id === editingPractitioner.id ? { ...formData, id: p.id } : p
      ));
    } else {
      const newPractitioner = {
        ...formData,
        id: Date.now(),
        stats: {
          totalAppointments: 0,
          totalRevenue: 0,
          avgRating: 0
        }
      };
      setPractitioners([...practitioners, newPractitioner]);
    }

    setShowAddModal(false);
    setEditingPractitioner(null);
    resetForm();
  };

  const handleEdit = (practitioner: Practitioner) => {
    setFormData(practitioner);
    setEditingPractitioner(practitioner);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce praticien?')) {
      setPractitioners(practitioners.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      role: 'practitioner',
      color: '#10b981',
      active: true,
      permissions: {
        managePatients: true,
        manageAppointments: true,
        viewFinance: false,
        manageFinance: false,
        manageSettings: false
      }
    });
  };

  const totalStats = {
    appointments: practitioners.reduce((sum, p) => sum + (p.stats?.totalAppointments || 0), 0),
    revenue: practitioners.reduce((sum, p) => sum + (p.stats?.totalRevenue || 0), 0),
    avgRating: practitioners.reduce((sum, p) => sum + (p.stats?.avgRating || 0), 0) / practitioners.length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">👥 Gestion Multi-Praticiens</h1>
            <p className="text-blue-100">Cabinet collaboratif avec permissions et statistiques</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
          >
            <Plus className="inline mr-2" size={20} />
            Ajouter un praticien
          </button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Praticiens actifs</p>
            <Users className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-800">{practitioners.filter(p => p.active).length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">RDV total</p>
            <Calendar className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-800">{totalStats.appointments}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">CA total</p>
            <DollarSign className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-800">{totalStats.revenue.toLocaleString()}€</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Note moyenne</p>
            <Star className="text-yellow-500" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-800">{totalStats.avgRating.toFixed(1)}</p>
        </div>
      </div>

      {/* Practitioners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {practitioners.map((practitioner) => {
          const RoleIcon = roleIcons[practitioner.role];

          return (
            <div
              key={practitioner.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
            >
              {/* Header with color */}
              <div
                className="h-24 relative"
                style={{ background: `linear-gradient(135deg, ${practitioner.color} 0%, ${practitioner.color}dd 100%)` }}
              >
                <div className="absolute -bottom-10 left-6">
                  <div
                    className="w-20 h-20 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white text-2xl font-black"
                    style={{ backgroundColor: practitioner.color }}
                  >
                    {practitioner.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>

                {!practitioner.active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Inactif
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="pt-12 px-6 pb-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{practitioner.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{practitioner.specialty}</p>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                      <RoleIcon size={14} className="text-gray-600" />
                      <span className="text-xs font-bold text-gray-700">{roleLabels[practitioner.role]}</span>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="mb-4 space-y-1 text-sm text-gray-600">
                  <p>📧 {practitioner.email}</p>
                  <p>📱 {practitioner.phone}</p>
                </div>

                {/* Stats */}
                {practitioner.stats && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-600 mb-1">RDV</p>
                      <p className="text-lg font-black text-blue-700">{practitioner.stats.totalAppointments}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-green-600 mb-1">CA</p>
                      <p className="text-lg font-black text-green-700">{(practitioner.stats.totalRevenue / 1000).toFixed(0)}k€</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-yellow-600 mb-1">Note</p>
                      <p className="text-lg font-black text-yellow-700">{practitioner.stats.avgRating.toFixed(1)}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(practitioner)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    <Edit className="inline mr-1" size={16} />
                    Éditer
                  </button>
                  <button
                    onClick={() => handleDelete(practitioner.id!)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    <Trash2 className="inline mr-1" size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-gray-800 mb-6">
              {editingPractitioner ? 'Modifier le praticien' : 'Ajouter un praticien'}
            </h2>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="jean@cabinet.fr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="+33612345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Spécialité</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Kinésithérapie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="practitioner">Praticien</option>
                    <option value="admin">Administrateur</option>
                    <option value="assistant">Assistant(e)</option>
                  </select>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Couleur d'identification</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-full transition-all ${
                        formData.color === color ? 'ring-4 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2 bg-gray-50 p-4 rounded-xl">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, [key]: e.target.checked }
                        })}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {key === 'managePatients' && 'Gérer les patients'}
                        {key === 'manageAppointments' && 'Gérer les rendez-vous'}
                        {key === 'viewFinance' && 'Voir les finances'}
                        {key === 'manageFinance' && 'Gérer les finances'}
                        {key === 'manageSettings' && 'Gérer les paramètres'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPractitioner(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddPractitioner}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {editingPractitioner ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiPractitionerModule;
