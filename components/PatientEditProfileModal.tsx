import React, { useState } from 'react';
import { X, User, Phone, MapPin, Save } from 'lucide-react';
import { Patient } from '../types';

interface PatientEditProfileModalProps {
  patient: Patient;
  onSave: (updatedData: { name?: string; phone?: string; address?: string }) => Promise<void>;
  onClose: () => void;
}

const PatientEditProfileModal: React.FC<PatientEditProfileModalProps> = ({
  patient,
  onSave,
  onClose
}) => {
  const [name, setName] = useState(patient.name);
  const [phone, setPhone] = useState(patient.phone || '');
  const [address, setAddress] = useState(patient.address || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined
      });
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Modifier mon profil</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <User size={16} className="inline mr-1" />
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="Jean Dupont"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <Phone size={16} className="inline mr-1" />
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="0612345678"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Adresse
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
              placeholder="123 Rue Exemple, 75001 Paris"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSaving ? (
                'Enregistrement...'
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientEditProfileModal;
