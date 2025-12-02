import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, Home, Building2, Send, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const PatientRequestAppointment: React.FC = () => {
  const { user } = useAuth();
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    practitioner_id: '',
    requested_date: '',
    requested_time: '',
    duration_min: 60,
    type: 'CABINET' as 'CABINET' | 'DOMICILE' | 'STABLE' | 'VISIO',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadPractitioners();
  }, []);

  const loadPractitioners = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'PRACTITIONER');

      if (error) throw error;
      setPractitioners(data || []);
    } catch (error) {
      console.error('Error loading practitioners:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.practitioner_id || !formData.requested_date || !formData.requested_time) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsLoading(true);

      // Combine date and time
      const requestedDateTime = new Date(`${formData.requested_date}T${formData.requested_time}`);

      const { error } = await supabase
        .from('appointment_requests')
        .insert([{
          patient_id: user?.id,
          practitioner_id: formData.practitioner_id,
          requested_date: requestedDateTime.toISOString(),
          duration_min: formData.duration_min,
          type: formData.type,
          reason: formData.reason,
          notes: formData.notes,
          status: 'PENDING',
        }]);

      if (error) throw error;

      alert('✅ Votre demande de rendez-vous a été envoyée !\n\nVous recevrez une réponse du praticien sous peu.');

      // Reset form
      setFormData({
        practitioner_id: '',
        requested_date: '',
        requested_time: '',
        duration_min: 60,
        type: 'CABINET',
        reason: '',
        notes: '',
      });
    } catch (error: any) {
      console.error('Error creating appointment request:', error);
      alert(`❌ Erreur lors de la création de la demande: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions = [
    { value: 'CABINET', label: 'Cabinet', icon: <Building2 size={20} />, color: 'from-blue-500 to-indigo-600' },
    { value: 'DOMICILE', label: 'Domicile', icon: <Home size={20} />, color: 'from-green-500 to-emerald-600' },
    { value: 'STABLE', label: 'Écurie', icon: <MapPin size={20} />, color: 'from-amber-500 to-orange-600' },
    { value: 'VISIO', label: 'Visio', icon: <Video size={20} />, color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white">
            <Calendar size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Demander un Rendez-vous</h2>
            <p className="text-sm text-slate-600">Votre praticien vous répondra rapidement</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Practitioner Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <User className="inline mr-2" size={16} />
              Praticien *
            </label>
            <select
              value={formData.practitioner_id}
              onChange={(e) => setFormData({ ...formData, practitioner_id: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              required
            >
              <option value="">Sélectionnez un praticien</option>
              {practitioners.map((prac) => (
                <option key={prac.id} value={prac.id}>
                  {prac.name || prac.email}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <Calendar className="inline mr-2" size={16} />
                Date souhaitée *
              </label>
              <input
                type="date"
                value={formData.requested_date}
                onChange={(e) => setFormData({ ...formData, requested_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <Clock className="inline mr-2" size={16} />
                Heure souhaitée *
              </label>
              <input
                type="time"
                value={formData.requested_time}
                onChange={(e) => setFormData({ ...formData, requested_time: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Durée estimée
            </label>
            <select
              value={formData.duration_min}
              onChange={(e) => setFormData({ ...formData, duration_min: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 heure</option>
              <option value={90}>1h30</option>
              <option value={120}>2 heures</option>
            </select>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Type de consultation *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: option.value as any })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === option.value
                      ? `border-blue-500 bg-gradient-to-br ${option.color} text-white shadow-lg`
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {option.icon}
                    <span className="text-sm font-bold">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Motif de consultation *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ex: Douleur au dos, suivi régulier, première consultation..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Notes complémentaires (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires à partager avec le praticien..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={24} />
            {isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>

          <p className="text-sm text-slate-500 text-center">
            * Champs obligatoires - Votre praticien vous répondra sous 24-48h
          </p>
        </form>
      </div>
    </div>
  );
};

export default PatientRequestAppointment;
