import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, CheckCircle, AlertCircle, Key, Mail, Calendar, Percent, Package } from 'lucide-react';
import PaymentService, { PaymentConfig } from '../services/paymentService';

interface PaymentSettingsProps {
  onSave: (config: PaymentConfig) => void;
}

const PaymentSettings: React.FC<PaymentSettingsProps> = ({ onSave }) => {
  const [config, setConfig] = useState<PaymentConfig>({
    stripePublicKey: '',
    stripeSecretKey: '',
    enabled: false,
    currency: 'EUR',
    acceptedMethods: ['card'],
    autoReminders: true,
    reminderDaysBefore: [7, 3, 1],
    depositPercentage: 30,
    allowInstallments: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Charger la configuration sauvegardée
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      const stored = localStorage.getItem('payment_config');
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement config paiement:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sauvegarder dans localStorage
      localStorage.setItem('payment_config', JSON.stringify(config));

      // Initialiser Stripe si activé
      if (config.enabled && config.stripePublicKey) {
        await PaymentService.initStripe(config.stripePublicKey);
      }

      onSave(config);
      alert('✅ Configuration des paiements sauvegardée !');
    } catch (error) {
      console.error('Erreur sauvegarde config:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    if (!config.stripePublicKey) {
      setTestResult({
        success: false,
        message: 'Veuillez entrer une clé publique Stripe'
      });
      return;
    }

    try {
      const stripe = await PaymentService.initStripe(config.stripePublicKey);
      if (stripe) {
        setTestResult({
          success: true,
          message: 'Connexion Stripe réussie !'
        });
      } else {
        setTestResult({
          success: false,
          message: 'Échec de la connexion à Stripe'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erreur: Clé publique invalide'
      });
    }
  };

  const togglePaymentMethod = (method: PaymentConfig['acceptedMethods'][number]) => {
    const updated = config.acceptedMethods.includes(method)
      ? config.acceptedMethods.filter(m => m !== method)
      : [...config.acceptedMethods, method];
    setConfig({ ...config, acceptedMethods: updated });
  };

  const toggleReminderDay = (day: number) => {
    const updated = config.reminderDaysBefore.includes(day)
      ? config.reminderDaysBefore.filter(d => d !== day)
      : [...config.reminderDaysBefore, day].sort((a, b) => b - a);
    setConfig({ ...config, reminderDaysBefore: updated });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configuration des Paiements</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configurez Stripe pour accepter les paiements en ligne
        </p>
      </div>

      {/* Activation */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <CreditCard size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Paiements en ligne</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.enabled ? 'Activé - Les patients peuvent payer en ligne' : 'Désactivé'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              config.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Clés API Stripe */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Key className="mr-2 text-blue-500" size={20} />
          Clés API Stripe
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Clé Publique (Publishable Key)
            </label>
            <input
              type="text"
              value={config.stripePublicKey}
              onChange={(e) => setConfig({ ...config, stripePublicKey: e.target.value })}
              placeholder="pk_test_..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Clé Secrète (Secret Key) - ⚠️ Ne jamais exposer côté client
            </label>
            <input
              type="password"
              value={config.stripeSecretKey}
              onChange={(e) => setConfig({ ...config, stripeSecretKey: e.target.value })}
              placeholder="sk_test_..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ En production, cette clé doit être stockée côté serveur uniquement
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Tester la connexion
          </button>

          {testResult && (
            <div
              className={`flex items-center space-x-2 p-3 rounded-xl ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {testResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>Comment obtenir vos clés Stripe :</strong>
          </p>
          <ol className="text-sm text-blue-700 dark:text-blue-400 mt-2 ml-4 space-y-1 list-decimal">
            <li>Créez un compte sur <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="underline">stripe.com</a></li>
            <li>Accédez à l'onglet "Développeurs" → "Clés API"</li>
            <li>Copiez vos clés de test (pk_test_ et sk_test_)</li>
            <li>En production, utilisez les clés réelles (pk_live_ et sk_live_)</li>
          </ol>
        </div>
      </div>

      {/* Méthodes de paiement acceptées */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <DollarSign className="mr-2 text-green-500" size={20} />
          Méthodes de paiement
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'card', label: 'Cartes bancaires', icon: '💳' },
            { value: 'apple_pay', label: 'Apple Pay', icon: '' },
            { value: 'google_pay', label: 'Google Pay', icon: 'G' },
            { value: 'sepa_debit', label: 'Prélèvement SEPA', icon: '🏦' }
          ].map((method) => (
            <button
              key={method.value}
              onClick={() => togglePaymentMethod(method.value as any)}
              className={`p-4 border-2 rounded-xl transition-all text-left ${
                config.acceptedMethods.includes(method.value as any)
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{method.icon}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{method.label}</span>
                </div>
                {config.acceptedMethods.includes(method.value as any) && (
                  <CheckCircle size={20} className="text-green-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Options avancées */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Options avancées</h3>

        <div className="space-y-4">
          {/* Acomptes */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Percent className="mr-2 text-purple-600" size={18} />
                Acomptes pour réservation
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Pourcentage du montant total requis lors de la réservation
              </p>
            </div>
            <div className="ml-4 flex items-center space-x-3">
              <input
                type="number"
                value={config.depositPercentage}
                onChange={(e) => setConfig({ ...config, depositPercentage: Number(e.target.value) })}
                min="0"
                max="100"
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center"
              />
              <span className="text-gray-600 dark:text-gray-400">%</span>
            </div>
          </div>

          {/* Paiements fractionnés */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Package className="mr-2 text-orange-600" size={18} />
                Paiements fractionnés
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Permettre aux patients de payer en plusieurs fois
              </p>
            </div>
            <button
              onClick={() => setConfig({ ...config, allowInstallments: !config.allowInstallments })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                config.allowInstallments ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  config.allowInstallments ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Rappels automatiques */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Mail className="mr-2 text-blue-600" size={18} />
                Rappels de paiement automatiques
              </h4>
              <button
                onClick={() => setConfig({ ...config, autoReminders: !config.autoReminders })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  config.autoReminders ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    config.autoReminders ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.autoReminders && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Envoyer des rappels avant l'échéance :
                </p>
                <div className="flex flex-wrap gap-2">
                  {[14, 7, 3, 1].map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleReminderDay(day)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        config.reminderDaysBefore.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      J-{day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </button>
      </div>
    </div>
  );
};

export default PaymentSettings;
