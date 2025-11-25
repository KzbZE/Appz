/**
 * Composant Paramètres Avancés
 *
 * Centralise la configuration de toutes les nouvelles fonctionnalités:
 * - Automatisation (Email/SMS)
 * - Paiements en ligne (Stripe/PayPal)
 * - Planning intelligent
 * - RGPD
 * - Multi-praticien
 */

import React, { useState } from 'react';
import {
  Settings, Bell, CreditCard, Calendar, Shield, Users,
  Mail, MessageSquare, Zap, Download, Trash2, Lock,
  Save, Check, AlertCircle
} from 'lucide-react';
import automationService, { EmailConfig, SMSConfig, ReminderConfig } from '../services/automationService';
import advancedFinanceService, { StripeConfig, PayPalConfig } from '../services/advancedFinanceService';
import smartSchedulingService, { GoogleCalendarConfig, WorkingHours } from '../services/smartSchedulingService';
import rgpdService from '../services/rgpdComplianceService';

type Tab = 'automation' | 'payments' | 'calendar' | 'rgpd' | 'multipractitioner';

const AdvancedSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('automation');
  const [saved, setSaved] = useState(false);

  // Automatisation
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(
    automationService.getReminderConfig()
  );
  const [emailConfig, setEmailConfig] = useState<Partial<EmailConfig>>({
    provider: 'sendgrid',
    senderEmail: '',
    senderName: 'TheraFlow',
    apiKey: ''
  });
  const [smsConfig, setSmsConfig] = useState<Partial<SMSConfig>>({
    provider: 'twilio',
    apiKey: '',
    senderNumber: ''
  });

  // Paiements
  const [stripeConfig, setStripeConfig] = useState<Partial<StripeConfig>>({
    publishableKey: '',
    secretKey: '',
    currency: 'eur'
  });
  const [paypalConfig, setPaypalConfig] = useState<Partial<PayPalConfig>>({
    clientId: '',
    clientSecret: '',
    mode: 'sandbox'
  });

  // Google Calendar
  const [googleCalConfig, setGoogleCalConfig] = useState<Partial<GoogleCalendarConfig>>({
    enabled: false,
    clientId: '',
    calendarId: '',
    syncDirection: 'two_way'
  });

  const handleSave = () => {
    switch (activeTab) {
      case 'automation':
        automationService.setReminderConfig(reminderConfig);
        if (emailConfig.provider && emailConfig.senderEmail && emailConfig.apiKey) {
          automationService.setEmailConfig(emailConfig as EmailConfig);
        }
        if (smsConfig.provider && smsConfig.apiKey && smsConfig.senderNumber) {
          automationService.setSMSConfig(smsConfig as SMSConfig);
        }
        break;

      case 'payments':
        if (stripeConfig.publishableKey && stripeConfig.secretKey) {
          advancedFinanceService.configureStripe(stripeConfig as StripeConfig);
        }
        if (paypalConfig.clientId && paypalConfig.clientSecret) {
          advancedFinanceService.configurePayPal(paypalConfig as PayPalConfig);
        }
        break;

      case 'calendar':
        if (googleCalConfig.enabled) {
          smartSchedulingService.configureGoogleCalendar(googleCalConfig);
        }
        break;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'automation' as const, label: 'Automatisation', icon: Zap },
    { id: 'payments' as const, label: 'Paiements', icon: CreditCard },
    { id: 'calendar' as const, label: 'Calendrier', icon: Calendar },
    { id: 'rgpd' as const, label: 'RGPD', icon: Shield },
    { id: 'multipractitioner' as const, label: 'Multi-praticien', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg">
              <Settings className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Paramètres Avancés</h1>
              <p className="text-slate-600">Configuration des fonctionnalités professionnelles</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Automatisation */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Bell className="text-purple-600" />
                Automatisation & Communication
              </h2>

              {/* Rappels automatiques */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Rappels automatiques</h3>

                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={reminderConfig.enabled}
                    onChange={e => setReminderConfig({ ...reminderConfig, enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-purple-600"
                  />
                  <span className="font-medium">Activer les rappels automatiques</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Délai avant RDV (heures)
                    </label>
                    <input
                      type="number"
                      value={reminderConfig.hoursBeforeAppointment}
                      onChange={e => setReminderConfig({
                        ...reminderConfig,
                        hoursBeforeAppointment: parseInt(e.target.value)
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Canaux de communication
                    </label>
                    <div className="space-y-2">
                      {['email', 'sms', 'push', 'whatsapp'].map(channel => (
                        <label key={channel} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={reminderConfig.channels.includes(channel as any)}
                            onChange={e => {
                              const channels = e.target.checked
                                ? [...reminderConfig.channels, channel as any]
                                : reminderConfig.channels.filter(c => c !== channel);
                              setReminderConfig({ ...reminderConfig, channels });
                            }}
                            className="rounded text-purple-600"
                          />
                          <span className="capitalize">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Email */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Mail className="text-blue-600" />
                  Configuration Email
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Provider</label>
                    <select
                      value={emailConfig.provider}
                      onChange={e => setEmailConfig({ ...emailConfig, provider: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    >
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="ses">Amazon SES</option>
                      <option value="smtp">SMTP Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email expéditeur</label>
                    <input
                      type="email"
                      value={emailConfig.senderEmail}
                      onChange={e => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                      placeholder="contact@votrecabinet.fr"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom expéditeur</label>
                    <input
                      type="text"
                      value={emailConfig.senderName}
                      onChange={e => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                      placeholder="Votre Cabinet"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                    <input
                      type="password"
                      value={emailConfig.apiKey}
                      onChange={e => setEmailConfig({ ...emailConfig, apiKey: e.target.value })}
                      placeholder="Votre clé API"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Configuration SMS */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="text-green-600" />
                  Configuration SMS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Provider</label>
                    <select
                      value={smsConfig.provider}
                      onChange={e => setSmsConfig({ ...smsConfig, provider: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    >
                      <option value="twilio">Twilio</option>
                      <option value="vonage">Vonage</option>
                      <option value="messagebird">MessageBird</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Numéro expéditeur</label>
                    <input
                      type="text"
                      value={smsConfig.senderNumber}
                      onChange={e => setSmsConfig({ ...smsConfig, senderNumber: e.target.value })}
                      placeholder="+33612345678"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                    <input
                      type="password"
                      value={smsConfig.apiKey}
                      onChange={e => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                      placeholder="Votre clé API"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <p className="text-sm text-slate-700">
                  Les rappels automatiques nécessitent une configuration valide. Consultez la documentation de votre provider (SendGrid, Twilio, etc.) pour obtenir les clés API.
                </p>
              </div>
            </div>
          )}

          {/* Paiements */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <CreditCard className="text-emerald-600" />
                Paiements en Ligne
              </h2>

              {/* Stripe */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Configuration Stripe</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Publishable Key (pk_...)
                    </label>
                    <input
                      type="text"
                      value={stripeConfig.publishableKey}
                      onChange={e => setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })}
                      placeholder="pk_test_..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Secret Key (sk_...)
                    </label>
                    <input
                      type="password"
                      value={stripeConfig.secretKey}
                      onChange={e => setStripeConfig({ ...stripeConfig, secretKey: e.target.value })}
                      placeholder="sk_test_..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Devise</label>
                    <select
                      value={stripeConfig.currency}
                      onChange={e => setStripeConfig({ ...stripeConfig, currency: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    >
                      <option value="eur">EUR (€)</option>
                      <option value="usd">USD ($)</option>
                      <option value="gbp">GBP (£)</option>
                      <option value="chf">CHF</option>
                    </select>
                  </div>
                </div>

                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  → Obtenir vos clés API Stripe
                </a>
              </div>

              {/* PayPal */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800">Configuration PayPal</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Client ID</label>
                    <input
                      type="text"
                      value={paypalConfig.clientId}
                      onChange={e => setPaypalConfig({ ...paypalConfig, clientId: e.target.value })}
                      placeholder="AXxxx..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Client Secret</label>
                    <input
                      type="password"
                      value={paypalConfig.clientSecret}
                      onChange={e => setPaypalConfig({ ...paypalConfig, clientSecret: e.target.value })}
                      placeholder="EXxxx..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mode</label>
                    <select
                      value={paypalConfig.mode}
                      onChange={e => setPaypalConfig({ ...paypalConfig, mode: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    >
                      <option value="sandbox">Sandbox (Test)</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                </div>

                <a
                  href="https://developer.paypal.com/dashboard/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  → Obtenir vos clés API PayPal
                </a>
              </div>

              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <AlertCircle className="text-emerald-600 flex-shrink-0" size={20} />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Sécurité des paiements</p>
                  <p>Les clés API sont stockées localement et chiffrées. Utilisez toujours le mode Sandbox pour les tests avant de passer en Production.</p>
                </div>
              </div>
            </div>
          )}

          {/* Calendar */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Calendar className="text-blue-600" />
                Synchronisation Calendrier
              </h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={googleCalConfig.enabled}
                    onChange={e => setGoogleCalConfig({ ...googleCalConfig, enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-600"
                  />
                  <div>
                    <span className="font-medium block">Activer Google Calendar</span>
                    <span className="text-sm text-slate-600">Synchronisation automatique bidirectionnelle</span>
                  </div>
                </label>

                {googleCalConfig.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Google Client ID
                        </label>
                        <input
                          type="text"
                          value={googleCalConfig.clientId}
                          onChange={e => setGoogleCalConfig({ ...googleCalConfig, clientId: e.target.value })}
                          placeholder="xxx.apps.googleusercontent.com"
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Calendar ID
                        </label>
                        <input
                          type="text"
                          value={googleCalConfig.calendarId}
                          onChange={e => setGoogleCalConfig({ ...googleCalConfig, calendarId: e.target.value })}
                          placeholder="primary ou xxx@group.calendar.google.com"
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Direction de synchronisation
                        </label>
                        <select
                          value={googleCalConfig.syncDirection}
                          onChange={e => setGoogleCalConfig({ ...googleCalConfig, syncDirection: e.target.value as any })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                        >
                          <option value="one_way">Un sens (TheraFlow → Google)</option>
                          <option value="two_way">Bidirectionnelle (↔)</option>
                        </select>
                      </div>
                    </div>

                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      → Configuration Google Cloud Console
                    </a>
                  </>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Export iCal / Outlook</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Exportez vos rendez-vous au format iCalendar (.ics) compatible avec Outlook, Apple Calendar, etc.
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
                  <Download size={18} className="inline mr-2" />
                  Exporter au format iCal
                </button>
              </div>
            </div>
          )}

          {/* RGPD */}
          {activeTab === 'rgpd' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Shield className="text-red-600" />
                Conformité RGPD
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                  <Lock className="text-blue-600 mb-3" size={32} />
                  <h3 className="font-bold text-slate-900 mb-2">Chiffrement</h3>
                  <p className="text-sm text-slate-600">Données sensibles chiffrées AES-256</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <Download className="text-green-600 mb-3" size={32} />
                  <h3 className="font-bold text-slate-900 mb-2">Export données</h3>
                  <p className="text-sm text-slate-600">Droit d'accès (Art. 15 RGPD)</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl">
                  <Trash2 className="text-red-600 mb-3" size={32} />
                  <h3 className="font-bold text-slate-900 mb-2">Droit à l'oubli</h3>
                  <p className="text-sm text-slate-600">Suppression complète (Art. 17)</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Politique de rétention</h3>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="text-green-600" size={18} />
                      <span>Dossiers patients: 10 ans après dernier contact</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="text-green-600" size={18} />
                      <span>Factures: 10 ans (obligation légale)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="text-green-600" size={18} />
                      <span>Logs d'accès: 3 ans maximum</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="text-green-600" size={18} />
                      <span>Archivage automatique activé</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Documents légaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition-colors">
                    <p className="font-semibold text-slate-900">Politique de confidentialité</p>
                    <p className="text-sm text-slate-600">Version 1.0 - Actif</p>
                  </button>
                  <button className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition-colors">
                    <p className="font-semibold text-slate-900">Formulaire de consentement</p>
                    <p className="text-sm text-slate-600">Version 1.0 - Actif</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Multi-praticien */}
          {activeTab === 'multipractitioner' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Users className="text-indigo-600" />
                Gestion Multi-Praticien
              </h2>

              <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                <p className="text-slate-700 mb-4">
                  <strong>Fonctionnalité Premium:</strong> La gestion multi-praticien permet de gérer plusieurs thérapeutes avec des agendas séparés, le partage de dossiers patients, et la répartition automatique des revenus.
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                  Activer Multi-Praticien
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800">Fonctionnalités incluses:</h3>
                <ul className="space-y-2">
                  {[
                    'Agendas séparés par praticien',
                    'Partage sélectif de dossiers patients',
                    'Gestion des salles et ressources partagées',
                    'Répartition automatique des revenus',
                    'Statistiques par praticien',
                    'Permissions et rôles personnalisables'
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                        <Check className="text-white" size={14} />
                      </div>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="border-t pt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {saved && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check size={20} />
                  <span className="font-medium">Modifications sauvegardées</span>
                </div>
              )}
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Save size={20} />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
