import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, Sparkles, Users, Calendar, DollarSign, Settings, Zap } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  practitionerName: string;
  cabinetName: string;
  specialties: string[];
  phone: string;
  email: string;
  address: string;
  tariffs: {
    human: number;
    equine: number;
    canine: number;
  };
  workHours: {
    start: string;
    end: string;
  };
  features: string[];
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    practitionerName: '',
    cabinetName: '',
    specialties: [],
    phone: '',
    email: '',
    address: '',
    tariffs: {
      human: 65,
      equine: 80,
      canine: 50
    },
    workHours: {
      start: '08:00',
      end: '18:00'
    },
    features: []
  });

  const steps = [
    {
      title: 'Bienvenue! 👋',
      subtitle: 'Configurons votre cabinet en 5 minutes',
      icon: Sparkles,
      color: 'from-purple-600 to-pink-600'
    },
    {
      title: 'Informations Praticien',
      subtitle: 'Parlez-nous de vous',
      icon: Users,
      color: 'from-blue-600 to-cyan-600'
    },
    {
      title: 'Tarifs & Horaires',
      subtitle: 'Configuration de base',
      icon: DollarSign,
      color: 'from-green-600 to-emerald-600'
    },
    {
      title: 'Fonctionnalités',
      subtitle: 'Choisissez vos modules',
      icon: Zap,
      color: 'from-orange-600 to-red-600'
    },
    {
      title: 'C\'est prêt! 🎉',
      subtitle: 'Votre cabinet est configuré',
      icon: Check,
      color: 'from-indigo-600 to-purple-600'
    }
  ];

  const features = [
    { id: 'calendar', name: 'Agenda & Planning', icon: '📅', recommended: true },
    { id: 'patients', name: 'Gestion Patients', icon: '👥', recommended: true },
    { id: 'invoices', name: 'Facturation', icon: '💰', recommended: true },
    { id: 'ocr', name: 'Scanner OCR', icon: '📄', recommended: false },
    { id: 'voice', name: 'Notes Vocales', icon: '🎤', recommended: false },
    { id: 'ai', name: 'Assistant IA', icon: '✨', recommended: true },
    { id: 'stripe', name: 'Paiements en ligne', icon: '💳', recommended: false },
    { id: 'stats', name: 'Statistiques Avancées', icon: '📊', recommended: true }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleFeature = (featureId: string) => {
    setData({
      ...data,
      features: data.features.includes(featureId)
        ? data.features.filter(f => f !== featureId)
        : [...data.features, featureId]
    });
  };

  const toggleSpecialty = (specialty: string) => {
    setData({
      ...data,
      specialties: data.specialties.includes(specialty)
        ? data.specialties.filter(s => s !== specialty)
        : [...data.specialties, specialty]
    });
  };

  const availableSpecialties = [
    { id: 'kinesio-humain', name: 'Kinésiologie Humaine', icon: '🧘', color: 'blue' },
    { id: 'kinesio-animal', name: 'Kinésiologie Animale', icon: '🐴', color: 'green' },
    { id: 'reiki', name: 'Reiki', icon: '✨', color: 'purple' },
    { id: 'massage-equin', name: 'Massage Équin', icon: '🐎', color: 'amber' },
    { id: 'massage-animaux', name: 'Massage Animaux', icon: '🐕', color: 'pink' },
    { id: 'kinesitherapie', name: 'Kinésithérapie', icon: '💪', color: 'indigo' },
    { id: 'osteopathie', name: 'Ostéopathie', icon: '🦴', color: 'teal' },
    { id: 'autre', name: 'Autre', icon: '⚕️', color: 'gray' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <Sparkles className="text-purple-600" size={64} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-800 mb-4">
                Bienvenue sur TheraFlow! 👋
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                L'ERP intelligent pour praticiens. Gérez votre cabinet avec puissance et simplicité.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="text-4xl mb-2">📅</div>
                <h3 className="font-bold text-gray-800 mb-1">Planning Optimisé</h3>
                <p className="text-sm text-gray-600">Agenda intelligent avec IA</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <div className="text-4xl mb-2">💰</div>
                <h3 className="font-bold text-gray-800 mb-1">Finance Automatisée</h3>
                <p className="text-sm text-gray-600">Facturation & comptabilité</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="text-4xl mb-2">✨</div>
                <h3 className="font-bold text-gray-800 mb-1">IA Intégrée</h3>
                <p className="text-sm text-gray-600">Assistant intelligent</p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Votre nom complet *
                </label>
                <input
                  type="text"
                  value={data.practitionerName}
                  onChange={(e) => setData({ ...data, practitionerName: e.target.value })}
                  placeholder="Dr. Marie Dubois"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nom du cabinet
                </label>
                <input
                  type="text"
                  value={data.cabinetName}
                  onChange={(e) => setData({ ...data, cabinetName: e.target.value })}
                  placeholder="Cabinet TheraFlow"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Spécialité(s) * <span className="text-blue-600 text-xs font-normal">(Sélection multiple)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSpecialties.map((specialty) => (
                    <button
                      key={specialty.id}
                      type="button"
                      onClick={() => toggleSpecialty(specialty.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        data.specialties.includes(specialty.id)
                          ? `border-${specialty.color}-500 bg-${specialty.color}-50 shadow-md scale-105`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-3xl mb-2">{specialty.icon}</div>
                      <div className={`text-sm font-bold ${
                        data.specialties.includes(specialty.id) ? `text-${specialty.color}-900` : 'text-gray-700'
                      }`}>
                        {data.specialties.includes(specialty.id) && '✓ '}
                        {specialty.name}
                      </div>
                    </button>
                  ))}
                </div>
                {data.specialties.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-800">
                      ✓ {data.specialties.length} spécialité(s) sélectionnée(s): {availableSpecialties.filter(s => data.specialties.includes(s.id)).map(s => s.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email professionnel
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="contact@cabinet.fr"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Adresse du cabinet
                </label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => setData({ ...data, address: e.target.value })}
                  placeholder="12 rue de la Santé, 75014 Paris"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-slide-up">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">💰 Tarifs par défaut</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    👤 Humains
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={data.tariffs.human}
                      onChange={(e) => setData({
                        ...data,
                        tariffs: { ...data.tariffs, human: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 text-lg pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🐴 Chevaux
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={data.tariffs.equine}
                      onChange={(e) => setData({
                        ...data,
                        tariffs: { ...data.tariffs, equine: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 text-lg pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🐕 Chiens
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={data.tariffs.canine}
                      onChange={(e) => setData({
                        ...data,
                        tariffs: { ...data.tariffs, canine: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 text-lg pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">⏰ Horaires de travail</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Début de journée
                  </label>
                  <input
                    type="time"
                    value={data.workHours.start}
                    onChange={(e) => setData({
                      ...data,
                      workHours: { ...data.workHours, start: e.target.value }
                    })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Fin de journée
                  </label>
                  <input
                    type="time"
                    value={data.workHours.end}
                    onChange={(e) => setData({
                      ...data,
                      workHours: { ...data.workHours, end: e.target.value }
                    })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 text-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Choisissez vos fonctionnalités
              </h3>
              <p className="text-gray-600">Vous pourrez les activer/désactiver à tout moment</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature) => {
                const isSelected = data.features.includes(feature.id);

                return (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-4xl">{feature.icon}</span>
                      {isSelected && (
                        <div className="p-2 bg-orange-500 rounded-full">
                          <Check className="text-white" size={20} />
                        </div>
                      )}
                      {feature.recommended && !isSelected && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                          Recommandé
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-800 text-left">{feature.name}</h4>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-8 animate-scale-in">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <Check className="text-green-600" size={64} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-800 mb-4">
                Tout est prêt! 🎉
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Votre cabinet <strong>{data.cabinetName || 'TheraFlow'}</strong> est configuré et prêt à l'emploi.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Récapitulatif</h3>
              <div className="space-y-2 text-left">
                <p className="text-gray-700">👤 <strong>Praticien:</strong> {data.practitionerName}</p>
                <p className="text-gray-700">🏥 <strong>Cabinet:</strong> {data.cabinetName || 'Non renseigné'}</p>
                <p className="text-gray-700">⏰ <strong>Horaires:</strong> {data.workHours.start} - {data.workHours.end}</p>
                <p className="text-gray-700">💰 <strong>Tarif humains:</strong> {data.tariffs.human}€</p>
                <p className="text-gray-700">✨ <strong>Modules activés:</strong> {data.features.length}</p>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              💡 Conseil: Explorez le panneau admin (Ctrl+Shift+A) pour la configuration avancée
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-pink-50 z-[300] overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        {/* Progress Bar */}
        <div className="bg-white shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 bg-gradient-to-br ${currentStepData.color} rounded-xl text-white`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800">{currentStepData.title}</h2>
                  <p className="text-sm text-gray-600">{currentStepData.subtitle}</p>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Étape {currentStep + 1} sur {steps.length}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full bg-gradient-to-r ${currentStepData.color} transition-all duration-500`}
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl">
            {renderStepContent()}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white shadow-xl border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <ArrowLeft className="inline mr-2" size={20} />
              Précédent
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === 1 && (!data.practitionerName || !data.phone)}
              className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 ${
                currentStep === steps.length - 1
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                  : `bg-gradient-to-r ${currentStepData.color} text-white`
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="inline mr-2" size={20} />
                  Commencer à utiliser TheraFlow
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="inline ml-2" size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
