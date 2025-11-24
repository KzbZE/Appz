import React, { useState } from 'react';
import { db } from '../db';
import { AppointmentRequestStatus, PatientType } from '../types';
import { Calendar, Clock, MapPin, Phone, Mail, User, Send, CheckCircle, Home } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';
import { AppointmentNotifications } from '../services/notificationService';

const PublicAppointmentRequest: React.FC = () => {
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientType: 'HUMAN' as 'HUMAN' | 'EQUINE' | 'CANINE',
    ownerName: '',
    address: '',
    city: '',
    postalCode: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    requestedDate: '',
    requestedTime: '10:00',
    appointmentType: 'CABINET' as 'CABINET' | 'DOMICILE' | 'STABLE',
    notes: '',
    durationMin: 60
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.patientName || !formData.patientPhone) {
      setError('Nom et téléphone sont obligatoires');
      return;
    }

    if (!formData.requestedDate || !formData.requestedTime) {
      setError('Date et heure sont obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find or create patient
      let patientId: number | undefined;
      const existingPatients = await db.patients
        .where('phone')
        .equals(formData.patientPhone)
        .toArray();

      if (existingPatients.length > 0) {
        // Patient exists, use existing ID and update info if needed
        patientId = existingPatients[0].id as number;
        await db.patients.update(patientId, {
          name: formData.patientName,
          email: formData.patientEmail || existingPatients[0].email,
          address: formData.address || existingPatients[0].address,
          city: formData.city || existingPatients[0].city,
          postalCode: formData.postalCode || existingPatients[0].postalCode,
          lat: formData.lat || existingPatients[0].lat,
          lng: formData.lng || existingPatients[0].lng,
          ownerName: formData.ownerName || existingPatients[0].ownerName
        });
      } else {
        // Create new patient
        patientId = await db.patients.add({
          name: formData.patientName,
          type: formData.patientType as PatientType,
          phone: formData.patientPhone,
          email: formData.patientEmail,
          ownerName: formData.ownerName,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          lat: formData.lat,
          lng: formData.lng,
          location: formData.appointmentType === 'CABINET' ? 'Cabinet' : formData.city || 'Extérieur'
        }) as number;
      }

      // Create appointment request
      const requestedStartTime = new Date(`${formData.requestedDate}T${formData.requestedTime}`).toISOString();

      // ✅ Générer un token de validation unique et sécurisé
      const validationToken = btoa(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);

      const requestId = await db.appointmentRequests.add({
        patientId,
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        patientEmail: formData.patientEmail,
        requestedStartTime,
        durationMin: formData.durationMin,
        type: formData.appointmentType,
        status: AppointmentRequestStatus.PENDING,
        notes: formData.notes,
        validationToken, // ✅ Token pour validation email
        validated: false, // ✅ Pas encore validé
        history: [
          {
            date: new Date().toISOString(),
            action: 'CREATED',
            by: 'PATIENT',
            message: 'Demande créée par le patient'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        patientAddress: formData.address,
        patientLat: formData.lat,
        patientLng: formData.lng
      });

      // ✅ Notifier le praticien de la nouvelle demande
      try {
        const settings = await db.settings.toCollection().first();
        if (settings?.practitionerEmail || settings?.practitionerPhone) {
          await AppointmentNotifications.notifyPractitionerNewRequest(
            settings.practitionerEmail || '',
            settings.practitionerPhone || '',
            formData.patientName,
            requestedStartTime,
            requestId
          );
          console.log('✅ Praticien notifié de la nouvelle demande RDV');
        } else {
          console.warn('⚠️ Email/téléphone praticien non configuré - notification non envoyée');
        }
      } catch (notifError) {
        console.error('Erreur notification praticien (non bloquant):', notifError);
      }

      // ✅ Envoyer email de validation au patient (Option A)
      if (formData.patientEmail) {
        try {
          const validationUrl = `${window.location.origin}${window.location.pathname}#validate?token=${validationToken}`;
          const dateStr = new Date(requestedStartTime).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const timeStr = new Date(requestedStartTime).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: formData.patientEmail,
              subject: 'Validez votre créneau de rendez-vous',
              message: `Bonjour ${formData.patientName},\n\nLe praticien vous propose un créneau pour votre rendez-vous :\n\nDate : ${dateStr}\nHeure : ${timeStr}\nDurée : ${formData.durationMin} minutes\nLieu : ${formData.appointmentType === 'CABINET' ? 'Cabinet' : formData.address}\n\nPour confirmer ce créneau, cliquez sur le lien ci-dessous :\n${validationUrl}\n\nSi ce créneau ne vous convient pas, vous pourrez le refuser et le praticien vous proposera une alternative.\n\nÀ bientôt !`
            })
          });
          console.log('✅ Email de validation envoyé au patient:', formData.patientEmail);
        } catch (emailError) {
          console.error('Erreur envoi email validation (non bloquant):', emailError);
        }
      }

      // ✅ Envoyer SMS de validation au patient (Option A)
      if (formData.patientPhone) {
        try {
          const validationUrl = `${window.location.origin}${window.location.pathname}#validate?token=${validationToken}`;
          const dateStr = new Date(requestedStartTime).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
          });
          const timeStr = new Date(requestedStartTime).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          await fetch('/.netlify/functions/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: formData.patientPhone,
              message: `Bonjour ${formData.patientName}, votre RDV est proposé pour le ${dateStr} à ${timeStr}. Validez ici : ${validationUrl}`
            })
          });
          console.log('✅ SMS de validation envoyé au patient:', formData.patientPhone);
        } catch (smsError) {
          console.error('Erreur envoi SMS validation (non bloquant):', smsError);
        }
      }

      setStep('SUCCESS');
    } catch (err: any) {
      console.error('Error submitting request:', err);
      // Show more detailed error message
      const errorMessage = err?.message || err?.toString() || 'Une erreur est survenue';
      setError(`Erreur : ${errorMessage}. Veuillez réessayer ou contacter le praticien.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      patientType: 'HUMAN',
      ownerName: '',
      address: '',
      city: '',
      postalCode: '',
      lat: undefined,
      lng: undefined,
      requestedDate: '',
      requestedTime: '10:00',
      appointmentType: 'CABINET',
      notes: '',
      durationMin: 60
    });
    setStep('FORM');
    setError(null);
  };

  if (step === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-fadeIn">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle size={48} className="text-white" />
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-3">Demande Envoyée !</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Votre demande de rendez-vous a été transmise au praticien.
            Vous recevrez une confirmation par <strong>email et SMS</strong> dans les plus brefs délais.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-teal-700 font-semibold">
              📅 Créneau demandé : {new Date(`${formData.requestedDate}T${formData.requestedTime}`).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium mb-2">
              💡 Créez votre espace patient pour suivre vos rendez-vous, séances et factures
            </p>
            <a
              href="#patient-login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              <User size={16} className="mr-2" />
              Accéder à mon espace
            </a>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-bold shadow-lg transition-all"
          >
            Faire une nouvelle demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 overflow-y-auto">
      <div className="min-h-full py-4 px-4 md:py-8">
        <div className="max-w-2xl mx-auto pb-8">
          {/* Header */}
          <div className="text-center mb-4 md:mb-8">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Calendar size={24} className="text-white md:w-8 md:h-8" />
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-800 mb-2">Demande de Rendez-vous</h1>
            <p className="text-sm md:text-base text-slate-600">Remplissez le formulaire ci-dessous pour demander un rendez-vous</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 space-y-4 md:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Type de patient */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Type de patient *</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'HUMAN', label: 'Humain', icon: User },
                { value: 'EQUINE', label: 'Cheval', icon: Home },
                { value: 'CANINE', label: 'Chien', icon: Home }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, patientType: value as any })}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                    formData.patientType === value
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={20} className="inline mr-1" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {formData.patientType === 'HUMAN' ? 'Votre nom complet' : 'Nom de l\'animal'} *
            </label>
            <input
              type="text"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none transition-all"
              placeholder="Ex: Marie Dupont"
              required
            />
          </div>

          {/* Propriétaire (si animal) */}
          {formData.patientType !== 'HUMAN' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nom du propriétaire *</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none transition-all"
                placeholder="Ex: Jean Martin"
                required={formData.patientType !== 'HUMAN'}
              />
            </div>
          )}

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Téléphone *</label>
              <div className="relative">
                <Phone size={20} className="absolute left-4 top-4 text-slate-400" />
                <input
                  type="tel"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                  className="w-full pl-12 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none transition-all"
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                  className="w-full pl-12 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none transition-all"
                  placeholder="email@exemple.com"
                />
              </div>
            </div>
          </div>

          {/* Type de RDV */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Où souhaitez-vous le rendez-vous ? *</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'CABINET', label: 'Cabinet', desc: 'Au cabinet du praticien' },
                { value: 'DOMICILE', label: 'Domicile', desc: 'À votre domicile' },
                { value: 'STABLE', label: 'Écurie', desc: 'À l\'écurie/terrain' }
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, appointmentType: value as any })}
                  className={`py-4 px-3 rounded-xl font-bold text-sm transition-all text-left ${
                    formData.appointmentType === value
                      ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-black mb-1">{label}</div>
                  <div className="text-xs opacity-80">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Adresse (si pas cabinet) */}
          {formData.appointmentType !== 'CABINET' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Adresse *</label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(address) => setFormData({ ...formData, address })}
                onPlaceSelected={(place) => {
                  setFormData({
                    ...formData,
                    address: place.address,
                    city: place.city,
                    postalCode: place.postalCode,
                    lat: place.lat,
                    lng: place.lng
                  });
                }}
                placeholder="Commencez à taper votre adresse..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Date et heure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Date souhaitée *</label>
              <input
                type="date"
                value={formData.requestedDate}
                onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Heure souhaitée *</label>
              <input
                type="time"
                value={formData.requestedTime}
                onChange={(e) => setFormData({ ...formData, requestedTime: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Notes complémentaires</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none transition-all resize-none"
              placeholder="Motif de consultation, informations importantes..."
            />
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700">
              💡 <strong>Cette demande n'est pas automatiquement confirmée.</strong> Le praticien va l'examiner et vous proposera soit de valider ce créneau, soit un créneau alternatif. Vous recevrez une notification par email et SMS.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-black text-lg shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Envoi en cours...
              </>
            ) : (
              <>
                <Send size={20} className="mr-3" />
                Envoyer la demande
              </>
            )}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default PublicAppointmentRequest;
