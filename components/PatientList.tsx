import React, { useState } from 'react';
import { Patient, PatientType } from '../types';
import { Search, MapPin, Phone, Mail, Calendar, Activity, ChevronRight, User, Zap, DollarSign, Save, X, Plus, Trash2, Edit } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onAddPatient?: () => void;
  onInstantSession: (patient: Patient) => void;
  onUpdatePatient: (updatedPatient: Patient) => void;
}

const PatientList: React.FC<PatientListProps> = ({ patients, onSelectPatient, onAddPatient, onInstantSession, onUpdatePatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PatientType | 'ALL'>('ALL');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditingTariffs, setIsEditingTariffs] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const [tempTariffs, setTempTariffs] = useState<Record<string, number>>({});
  const [newTariffKey, setNewTariffKey] = useState('');
  const [newTariffPrice, setNewTariffPrice] = useState('');

  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCardClick = (p: Patient) => {
    setSelectedPatient(p);
    setIsEditingTariffs(false);
    setIsEditingInfo(false);
    setTempTariffs(p.customTariffs || {});
    setEditFormData({ ...p });
    setNewTariffKey('');
    setNewTariffPrice('');
  };

  const saveCustomTariffs = () => {
      if (selectedPatient) {
          const updated = { ...selectedPatient, customTariffs: tempTariffs };
          onUpdatePatient(updated);
          setSelectedPatient(updated);
          setIsEditingTariffs(false);
      }
  };

  const savePatientInfo = () => {
      if (selectedPatient && editFormData) {
          const updated = { ...selectedPatient, ...editFormData } as Patient;
          onUpdatePatient(updated);
          setSelectedPatient(updated);
          setIsEditingInfo(false);
      }
  };

  const handleAddTariff = () => {
      if (newTariffKey && newTariffPrice) {
          const price = parseFloat(newTariffPrice);
          if (!isNaN(price)) {
              setTempTariffs({ ...tempTariffs, [newTariffKey]: price });
              setNewTariffKey('');
              setNewTariffPrice('');
          }
      }
  };

  const handleRemoveTariff = (key: string) => {
      const updated = { ...tempTariffs };
      delete updated[key];
      setTempTariffs(updated);
  };

  const renderPatientInfoEditor = () => (
      <div className="bg-white border-2 border-teal-200 rounded-xl p-5 mb-6 shadow-lg animate-fadeIn">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Edit size={18} className="mr-2 text-teal-500" />
              Modifier les informations
          </h3>

          <div className="space-y-4">
              {/* Nom */}
              <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Nom complet *</label>
                  <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                      placeholder="Nom du patient"
                  />
              </div>

              {/* Type de patient */}
              <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Type de patient *</label>
                  <select
                      value={editFormData.type || PatientType.HUMAN}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as PatientType })}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                  >
                      <option value={PatientType.HUMAN}>Humain (Cabinet)</option>
                      <option value={PatientType.EQUINE}>Cheval</option>
                      <option value={PatientType.CANINE}>Chien</option>
                  </select>
              </div>

              {/* Propriétaire (si animal) */}
              {editFormData.type !== PatientType.HUMAN && (
                  <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Nom du propriétaire *</label>
                      <input
                          type="text"
                          value={editFormData.ownerName || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                          placeholder="Nom du propriétaire"
                      />
                  </div>
              )}

              {/* Email */}
              <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Email</label>
                  <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                      placeholder="email@exemple.com"
                  />
              </div>

              {/* Téléphone */}
              <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Téléphone *</label>
                  <input
                      type="tel"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                      placeholder="06 12 34 56 78"
                  />
              </div>

              {/* Adresse avec autocomplete */}
              <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Adresse complète *</label>
                  <AddressAutocomplete
                      value={editFormData.address || ''}
                      onChange={(address) => setEditFormData({ ...editFormData, address })}
                      onPlaceSelected={(place) => {
                          setEditFormData({
                              ...editFormData,
                              address: place.address,
                              city: place.city,
                              postalCode: place.postalCode,
                              lat: place.lat,
                              lng: place.lng
                          });
                      }}
                      placeholder="Commencez à taper une adresse..."
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                  />
              </div>

              {/* Ville et Code postal (auto-remplis par autocomplete) */}
              <div className="grid grid-cols-2 gap-3">
                  <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Ville</label>
                      <input
                          type="text"
                          value={editFormData.city || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                          placeholder="Ville"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Code postal</label>
                      <input
                          type="text"
                          value={editFormData.postalCode || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                          placeholder="75001"
                      />
                  </div>
              </div>

              {/* Location (localisation générale) */}
              <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Localisation générale</label>
                  <input
                      type="text"
                      value={editFormData.location || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                      placeholder="Ex: Paris 15e, Lyon Centre..."
                  />
              </div>

              {/* Coordonnées GPS (affichage si présentes) */}
              {editFormData.lat && editFormData.lng && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <p className="text-xs text-teal-700">
                          📍 Coordonnées GPS : {editFormData.lat.toFixed(6)}, {editFormData.lng.toFixed(6)}
                      </p>
                      <p className="text-[10px] text-teal-600 mt-1">
                          Utilisées pour l'optimisation de tournées
                      </p>
                  </div>
              )}
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                  onClick={() => {
                      setIsEditingInfo(false);
                      setEditFormData({ ...selectedPatient });
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                  <X size={16} className="inline mr-1" />
                  Annuler
              </button>
              <button
                  onClick={savePatientInfo}
                  disabled={!editFormData.name || !editFormData.phone}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg text-sm font-bold flex items-center shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Save size={16} className="mr-2" />
                  Enregistrer les modifications
              </button>
          </div>
      </div>
  );

  const renderTariffEditor = () => (
      <div className="bg-white p-4 rounded-xl border border-gray-200 mt-4 animate-fadeIn shadow-inner bg-gray-50/50">
          <h4 className="font-bold text-slate-700 mb-3 text-sm flex items-center justify-between">
              <span>Tarifs Spéciaux pour {selectedPatient?.name}</span>
          </h4>
          
          <div className="space-y-2 mb-4">
              {Object.entries(tempTariffs).length === 0 && (
                  <p className="text-xs text-slate-400 italic">Aucun tarif personnalisé défini.</p>
              )}
              {Object.entries(tempTariffs).map(([key, price]) => (
                  <div key={key} className="flex items-center space-x-2">
                      <div className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-slate-600 font-medium">
                          {key}
                      </div>
                      <div className="w-24 relative">
                          <input
                            type="number"
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold text-right pr-6 focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                            value={price}
                            onChange={e => setTempTariffs({...tempTariffs, [key]: parseFloat(e.target.value) || 0})}
                          />
                          <span className="absolute right-2 top-2 text-xs text-gray-400">€</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveTariff(key)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                          <Trash2 size={16} />
                      </button>
                  </div>
              ))}
          </div>

          <div className="border-t border-gray-200 pt-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ajouter un tarif</label>
              <div className="flex items-center space-x-2">
                  <input
                      type="text"
                      placeholder="Ex: Tarif Étudiant..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                      value={newTariffKey}
                      onChange={e => setNewTariffKey(e.target.value)}
                  />
                  <div className="w-24 relative">
                      <input
                          type="number"
                          placeholder="Prix"
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm text-right pr-6 focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                          value={newTariffPrice}
                          onChange={e => setNewTariffPrice(e.target.value)}
                      />
                      <span className="absolute right-2 top-2 text-xs text-gray-400">€</span>
                  </div>
                  <button
                      onClick={handleAddTariff}
                      disabled={!newTariffKey || !newTariffPrice}
                      className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                  >
                      <Plus size={18} />
                  </button>
              </div>
              <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                  {['KINESIO', 'MASSAGE', 'SUIVI', 'URGENCE'].map(suggestion => (
                      <button 
                        key={suggestion}
                        onClick={() => setNewTariffKey(suggestion)}
                        className="px-2 py-1 text-[10px] bg-gray-100 text-slate-500 rounded hover:bg-gray-200 border border-gray-200"
                      >
                        {suggestion}
                      </button>
                  ))}
              </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4 pt-2 border-t border-gray-100">
              <button onClick={() => setIsEditingTariffs(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
              <button onClick={saveCustomTariffs} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg text-xs font-bold flex items-center shadow-lg transition-all duration-300">
                  <Save size={14} className="mr-1.5"/> Enregistrer Modifications
              </button>
          </div>
      </div>
  );

  const renderPatientDetail = (p: Patient) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end animate-fadeIn" onClick={() => setSelectedPatient(null)}>
      <div className="w-full md:w-[500px] bg-white h-full shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
         <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg mr-4
                    ${p.type === PatientType.HUMAN ? 'bg-teal-500' : p.type === PatientType.EQUINE ? 'bg-amber-600' : 'bg-indigo-500'}`}>
                    {(p.name || '??').substring(0,2).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{p.name}</h2>
                    <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">
                        {p.type === PatientType.HUMAN ? 'Patient Cabinet' : `Propriétaire: ${p.ownerName}`}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                    className="p-2 hover:bg-teal-50 text-teal-600 rounded-full transition-colors"
                    title="Modifier les informations"
                >
                    <Edit size={20} />
                </button>
                <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X size={20} />
                </button>
            </div>
         </div>

         {isEditingInfo && renderPatientInfoEditor()}

         <button
            onClick={() => { onInstantSession(p); setSelectedPatient(null); }}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl shadow-lg shadow-teal-200 font-bold text-lg flex items-center justify-center mb-6 hover:scale-[1.02] transition-all duration-300"
         >
             <Zap size={24} className="mr-2 text-yellow-300" fill="currentColor" /> Démarrer Séance Immédiate
         </button>

         <div className="flex justify-center mb-4">
             <button onClick={() => setIsEditingTariffs(!isEditingTariffs)} className="text-xs text-slate-400 underline flex items-center hover:text-teal-600 transition-colors">
                 <DollarSign size={14} className="mr-1" />
                 {isEditingTariffs ? 'Masquer configuration tarifs' : 'Gérer les tarifs personnalisés'}
             </button>
         </div>
         {isEditingTariffs && renderTariffEditor()}

         <div className="grid grid-cols-3 gap-3 mb-8 mt-4">
            <a href={`tel:${p.phone}`} className="flex flex-col items-center justify-center p-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors">
                <Phone size={20} className="mb-1" />
                <span className="text-xs font-bold">Appeler</span>
            </a>
            <button 
                onClick={() => {
                    const encoded = encodeURIComponent(p.address);
                    window.open(`https://www.waze.com/ul?q=${encoded}`, '_blank');
                }}
                className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors">
                <MapPin size={20} className="mb-1" />
                <span className="text-xs font-bold">Waze/Maps</span>
            </button>
            <button 
                onClick={() => { onSelectPatient(p); setSelectedPatient(null); }}
                className="flex flex-col items-center justify-center p-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
                <Calendar size={20} className="mb-1" />
                <span className="text-xs font-bold">Planifier</span>
            </button>
         </div>

         <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
                    <Activity size={16} className="mr-2 text-teal-500" />
                    {p.type === PatientType.HUMAN ? 'Suivi Thérapeutique' : 'Suivi Vétérinaire'}
                </h3>
                
                {p.medicalHistory && (
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-slate-500">Dernière visite</span>
                            <span className="font-medium">{p.lastVisit || 'Aucune'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-slate-500">Pathologies connues</span>
                            <div className="flex gap-1">
                                {p.medicalHistory.pathologies.map(path => (
                                    <span key={path} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full font-medium">{path}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Coordonnées</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                        <MapPin size={16} className="text-slate-400 mr-3 mt-0.5" />
                        <div>
                            <p className="font-medium text-slate-800">{p.location}</p>
                            <p className="text-slate-500">{p.address}</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Mail size={16} className="text-slate-400 mr-3" />
                        <span className="text-slate-600">{p.email || 'email@exemple.com'}</span>
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white md:rounded-tl-2xl">
      {selectedPatient && renderPatientDetail(selectedPatient)}

      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Patients</h2>
            <button
              onClick={onAddPatient}
              className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
            >
                <Plus size={20} />
            </button>
        </div>

        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
                type="text"
                placeholder="Rechercher nom, propriétaire..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
            {[
                { id: 'ALL', label: 'Tous' },
                { id: PatientType.HUMAN, label: 'Humains' },
                { id: PatientType.EQUINE, label: 'Chevaux' },
                { id: PatientType.CANINE, label: 'Chiens' }
            ].map(type => (
                <button
                    key={type.id}
                    onClick={() => setFilterType(type.id as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300
                        ${filterType === type.id ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
                >
                    {type.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
            {filteredPatients.map(patient => (
                <div 
                    key={patient.id} 
                    onClick={() => handleCardClick(patient)}
                    className="flex items-center p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0
                         ${patient.type === PatientType.HUMAN ? 'bg-teal-500' : patient.type === PatientType.EQUINE ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                        {(patient.name || '??').substring(0,2).toUpperCase()}
                    </div>
                    
                    <div className="ml-4 flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate">{patient.name}</h4>
                        <p className="text-xs text-slate-500 truncate flex items-center">
                           {patient.type !== PatientType.HUMAN && <User size={12} className="mr-1"/>}
                           {patient.type === PatientType.HUMAN ? 'Cabinet' : patient.ownerName} 
                           <span className="mx-1">•</span> 
                           <span className="text-slate-400">{patient.location}</span>
                        </p>
                    </div>

                    <div className="flex items-center">
                         <ChevronRight size={18} className="text-gray-300 group-hover:text-teal-600 transition-colors" />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PatientList;