import React, { useState, useEffect } from 'react';
import { FileText, Save, User, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreateConsultationReportProps {
  appointmentId?: number;
  patientId?: number;
  onSaved?: () => void;
}

const CreateConsultationReport: React.FC<CreateConsultationReportProps> = ({
  appointmentId,
  patientId,
  onSaved,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    appointment_id: appointmentId || '',
    patient_id: patientId || '',
    diagnosis: '',
    treatment: '',
    recommendations: '',
    next_appointment_date: '',
    is_visible_to_patient: true,
  });

  useEffect(() => {
    if (!appointmentId) loadAppointments();
    if (!patientId) loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, patient_id, patients(name)')
        .eq('status', 'COMPLETED')
        .order('start_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.diagnosis) {
      alert('Veuillez remplir au minimum le patient et le diagnostic');
      return;
    }

    try {
      setIsLoading(true);

      const reportData: any = {
        practitioner_id: user?.id,
        patient_id: formData.patient_id,
        date: new Date().toISOString(),
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        recommendations: formData.recommendations,
        is_visible_to_patient: formData.is_visible_to_patient,
      };

      if (formData.appointment_id) {
        reportData.appointment_id = formData.appointment_id;
      }

      if (formData.next_appointment_date) {
        reportData.next_appointment_date = new Date(formData.next_appointment_date).toISOString();
      }

      const { error } = await supabase
        .from('consultation_reports')
        .insert([reportData]);

      if (error) throw error;

      alert('✅ Compte rendu créé avec succès !');

      // Reset form
      setFormData({
        appointment_id: appointmentId || '',
        patient_id: patientId || '',
        diagnosis: '',
        treatment: '',
        recommendations: '',
        next_appointment_date: '',
        is_visible_to_patient: true,
      });

      if (onSaved) onSaved();
    } catch (error: any) {
      console.error('Error creating consultation report:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white">
          <FileText size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Créer un Compte Rendu</h2>
          <p className="text-sm text-slate-600">Documentation de la consultation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        {!patientId && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <User className="inline mr-2" size={16} />
              Patient *
            </label>
            <select
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              required
            >
              <option value="">Sélectionnez un patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Appointment Selection (optional) */}
        {!appointmentId && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <Calendar className="inline mr-2" size={16} />
              Lié à un rendez-vous (optionnel)
            </label>
            <select
              value={formData.appointment_id}
              onChange={(e) => setFormData({ ...formData, appointment_id: parseInt(e.target.value) || '' })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Aucun rendez-vous</option>
              {appointments.map((appt: any) => (
                <option key={appt.id} value={appt.id}>
                  {new Date(appt.start_time).toLocaleDateString('fr-FR')} - {appt.patients?.name || 'Patient'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Diagnosis */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Diagnostic *
          </label>
          <textarea
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            placeholder="Diagnostic établi lors de la consultation..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            required
          />
        </div>

        {/* Treatment */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Traitement effectué
          </label>
          <textarea
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            placeholder="Détails du traitement appliqué..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
          />
        </div>

        {/* Recommendations */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Recommandations
          </label>
          <textarea
            value={formData.recommendations}
            onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
            placeholder="Conseils et recommandations pour le patient..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
          />
        </div>

        {/* Next Appointment Date */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Prochain rendez-vous suggéré
          </label>
          <input
            type="date"
            value={formData.next_appointment_date}
            onChange={(e) => setFormData({ ...formData, next_appointment_date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <input
            type="checkbox"
            id="visible-to-patient"
            checked={formData.is_visible_to_patient}
            onChange={(e) => setFormData({ ...formData, is_visible_to_patient: e.target.checked })}
            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <label htmlFor="visible-to-patient" className="text-sm font-bold text-slate-700 cursor-pointer">
            Visible par le patient
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={24} />
          {isLoading ? 'Enregistrement...' : 'Enregistrer le compte rendu'}
        </button>
      </form>
    </div>
  );
};

export default CreateConsultationReport;
