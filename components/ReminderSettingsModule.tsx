import React, { useState } from 'react';
import { Bell, Send, Clock, CheckCircle, XCircle, MessageSquare, Mail, Settings as SettingsIcon, Play, List } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import reminderAutomationService, { ReminderTemplate, ReminderLog } from '../services/reminderAutomationService';

const ReminderSettingsModule: React.FC = () => {
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];
  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toArray())?.[0];

  const [activeTab, setActiveTab] = useState<'settings' | 'logs' | 'test'>('settings');
  const [templates, setTemplates] = useState<ReminderTemplate[]>([
    {
      id: 'sms_24h',
      name: 'SMS 24h avant',
      type: 'sms',
      timing: 24,
      enabled: true,
      content: 'Bonjour {{patientName}}, rappel de votre rendez-vous demain à {{time}} avec {{practitionerName}}. Confirmez: {{confirmLink}}'
    },
    {
      id: 'email_48h',
      name: 'Email 48h avant',
      type: 'email',
      timing: 48,
      enabled: true,
      subject: 'Rendez-vous avec {{practitionerName}}',
      content: 'Bonjour {{patientName}},\n\nVotre rendez-vous est prévu le {{date}} à {{time}}.\n\nÀ bientôt!'
    }
  ]);

  const [testForm, setTestForm] = useState({
    patientId: '',
    method: 'sms' as 'sms' | 'email',
    templateId: 'sms_24h'
  });

  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [sending, setSending] = useState(false);

  const handleSendTestReminder = async () => {
    const patient = patients.find(p => p.id === Number(testForm.patientId));
    if (!patient) {
      alert('Veuillez sélectionner un patient');
      return;
    }

    setSending(true);

    try {
      // Simuler un rendez-vous pour le test
      const mockAppointment = {
        id: 999,
        patientId: patient.id as number,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: '',
        type: 'CABINET',
        status: 'CONFIRMED' as const,
        notes: 'Test de rappel automatique'
      };

      const practitionerInfo = {
        name: settings?.practitionerName || 'Praticien',
        phone: '+33612345678',
        address: settings?.cabinetAddress || 'Cabinet'
      };

      const reminder = await reminderAutomationService.prepareReminder(
        mockAppointment,
        patient,
        practitionerInfo,
        testForm.templateId
      );

      if (testForm.method === 'sms' && reminder.sms) {
        console.log('📱 SMS à envoyer:', reminder.sms);
        alert(`SMS préparé pour ${patient.phone}:\n\n${reminder.sms}`);
      } else if (testForm.method === 'email' && reminder.email) {
        console.log('📧 Email à envoyer:', reminder.email);
        alert(`Email préparé pour ${patient.email || 'email@example.com'}:\n\nSujet: ${reminder.email.subject}\n\n${reminder.email.html.substring(0, 200)}...`);
      }

      // Ajouter au log
      const newLog: ReminderLog = {
        id: Date.now(),
        appointmentId: mockAppointment.id,
        patientId: patient.id as number,
        patientName: patient.name,
        type: testForm.method,
        status: 'sent',
        sentAt: new Date().toISOString(),
        templateUsed: testForm.templateId,
        recipient: testForm.method === 'sms' ? patient.phone || '' : patient.email || ''
      };

      setReminderLogs([newLog, ...reminderLogs]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du test:', error);
      alert('Erreur lors de l\'envoi du test de rappel');
    } finally {
      setSending(false);
    }
  };

  const handleToggleTemplate = (templateId: string) => {
    setTemplates(templates.map(t =>
      t.id === templateId ? { ...t, enabled: !t.enabled } : t
    ));
  };

  const getStats = () => {
    const total = reminderLogs.length;
    const sent = reminderLogs.filter(log => log.status === 'sent').length;
    const failed = reminderLogs.filter(log => log.status === 'failed').length;
    const confirmed = reminderLogs.filter(log => log.patientResponse === 'confirmed').length;

    return { total, sent, failed, confirmed };
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">🔔 Rappels Automatiques</h1>
            <p className="text-orange-100">Configuration SMS/Email pour rendez-vous</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black">{stats.total}</div>
            <div className="text-sm text-orange-100">Rappels envoyés</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total envoyés</p>
              <p className="text-3xl font-black text-gray-800">{stats.sent}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Send className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Confirmés</p>
              <p className="text-3xl font-black text-green-600">{stats.confirmed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Échecs</p>
              <p className="text-3xl font-black text-red-600">{stats.failed}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Taux confirmation</p>
              <p className="text-3xl font-black text-purple-600">
                {stats.sent > 0 ? Math.round((stats.confirmed / stats.sent) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Bell className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${
            activeTab === 'settings'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <SettingsIcon className="inline mr-2" size={18} />
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${
            activeTab === 'test'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Play className="inline mr-2" size={18} />
          Test d'envoi
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${
            activeTab === 'logs'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <List className="inline mr-2" size={18} />
          Historique
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="font-bold text-blue-900 mb-2">ℹ️ Configuration requise</h3>
            <p className="text-sm text-blue-700">
              Pour activer les rappels automatiques, vous devez configurer vos clés API Twilio (SMS) et SendGrid (Email) dans les paramètres de l'application.
            </p>
          </div>

          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    template.type === 'sms' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {template.type === 'sms' ? (
                      <MessageSquare className={template.type === 'sms' ? 'text-blue-600' : 'text-green-600'} size={24} />
                    ) : (
                      <Mail className={template.type === 'sms' ? 'text-blue-600' : 'text-green-600'} size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{template.name}</h3>
                    <p className="text-sm text-gray-500">
                      <Clock className="inline" size={14} /> Envoi {template.timing}h avant le RDV
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.enabled}
                    onChange={() => handleToggleTemplate(template.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {template.subject && (
                <div className="mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sujet</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 font-mono">
                    {template.subject}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Contenu du message
                </label>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap">
                  {template.content}
                </div>
              </div>

              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <strong>Variables disponibles:</strong> {'{'}{'{'} patientName {'}'}{'}'}, {'{'}{'{'} date {'}'}{'}'}, {'{'}{'{'} time {'}'}{'}'}, {'{'}{'{'} practitionerName {'}'}{'}'}, {'{'}{'{'} confirmLink {'}'}{'}'}, {'{'}{'{'} cancelLink {'}'}{'}'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🧪 Envoyer un rappel de test</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Patient</label>
              <select
                value={testForm.patientId}
                onChange={(e) => setTestForm({ ...testForm, patientId: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
              >
                <option value="">-- Sélectionner un patient --</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} {patient.phone ? `- ${patient.phone}` : ''} {patient.email ? `- ${patient.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Méthode d'envoi</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setTestForm({ ...testForm, method: 'sms' })}
                  className={`flex-1 p-4 rounded-xl border-2 font-bold transition-all ${
                    testForm.method === 'sms'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="inline mr-2" size={20} />
                  SMS
                </button>
                <button
                  onClick={() => setTestForm({ ...testForm, method: 'email' })}
                  className={`flex-1 p-4 rounded-xl border-2 font-bold transition-all ${
                    testForm.method === 'email'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Mail className="inline mr-2" size={20} />
                  Email
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Template à utiliser</label>
              <select
                value={testForm.templateId}
                onChange={(e) => setTestForm({ ...testForm, templateId: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
              >
                {templates
                  .filter(t => t.type === testForm.method)
                  .map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={handleSendTestReminder}
              disabled={!testForm.patientId || sending}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="inline mr-2" size={20} />
                  Envoyer le test
                </>
              )}
            </button>

            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-600">
                💡 <strong>Note:</strong> En mode test, les SMS et emails ne sont pas réellement envoyés. Le contenu sera affiché dans une alerte.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {reminderLogs.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <List className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-bold text-gray-600 mb-2">Aucun historique</h3>
              <p className="text-gray-500">Les rappels envoyés apparaîtront ici</p>
            </div>
          ) : (
            reminderLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      log.status === 'sent' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {log.status === 'sent' ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <XCircle className="text-red-600" size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{log.patientName}</h3>
                      <p className="text-sm text-gray-500">
                        {log.type === 'sms' ? '📱 SMS' : '📧 Email'} • {log.recipient}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.sentAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {log.patientResponse && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        log.patientResponse === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {log.patientResponse === 'confirmed' ? '✅ Confirmé' : '❌ Annulé'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderSettingsModule;
