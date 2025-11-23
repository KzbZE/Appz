import React, { useState } from 'react';
import { Invoice, ReminderRecord, ReminderStageConfig } from '../types';
import { Bell, Send, Mail, Calendar, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

interface ReminderModuleProps {
  invoices: Invoice[];
}

const ReminderModule: React.FC<ReminderModuleProps> = ({ invoices }) => {
  const settings = useLiveQuery(() => db.settings.toArray());
  const currentSettings = settings?.[0];

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<'J+7' | 'J+15' | 'J+30' | 'J+45' | 'J+60_FORMAL'>('J+7');
  const [customMessage, setCustomMessage] = useState('');

  // Calculate which invoices need reminders and at what stage
  const getNextReminderStage = (invoice: Invoice): ReminderStageConfig | null => {
    if (!currentSettings?.finance?.reminderStages) return null;
    if (invoice.status === 'PAID' || invoice.status === 'DRAFT') return null;

    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const existingReminderStages = (invoice.reminders || []).map(r => r.stage);

    // Find the next applicable stage
    const nextStage = currentSettings.finance.reminderStages
      .filter(stage => stage.enabled)
      .filter(stage => !existingReminderStages.includes(stage.stage))
      .filter(stage => daysOverdue >= stage.daysAfterDue)
      .sort((a, b) => a.daysAfterDue - b.daysAfterDue)[0];

    return nextStage || null;
  };

  const invoicesNeedingReminders = invoices
    .map(inv => ({
      invoice: inv,
      nextStage: getNextReminderStage(inv)
    }))
    .filter(item => item.nextStage !== null);

  const handleOpenSendModal = (invoice: Invoice, stage: ReminderStageConfig) => {
    setSelectedInvoice(invoice);
    setSelectedStage(stage.stage);
    setCustomMessage(
      stage.message
        .replace('{invoiceNumber}', invoice.number)
        .replace('{amount}', invoice.amountTTC.toFixed(2))
        .replace('{practitioner}', currentSettings?.practitionerName || '')
    );
    setShowSendModal(true);
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice || !selectedInvoice.id) return;

    const reminderRecord: ReminderRecord = {
      date: new Date().toISOString(),
      stage: selectedStage,
      message: customMessage,
      method: 'EMAIL' // Default to email for now
    };

    const existingReminders = selectedInvoice.reminders || [];
    await db.invoices.update(selectedInvoice.id, {
      reminders: [...existingReminders, reminderRecord],
      reminderSentAt: new Date().toISOString()
    });

    alert(`Relance ${selectedStage} envoyée avec succès !`);
    setShowSendModal(false);
    setSelectedInvoice(null);
  };

  const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'J+7': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'J+15': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    'J+30': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    'J+45': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    'J+60_FORMAL': { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-500' }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <Bell size={24} className="text-orange-600" />
            Relances Intelligentes Multi-Niveaux
          </h3>
          <p className="text-sm text-slate-500">Système de relances automatiques J+7, J+15, J+30, J+45, J+60</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Relances à Envoyer</div>
            <Bell size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{invoicesNeedingReminders.length}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Factures en Retard</div>
            <AlertTriangle size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">
            {invoices.filter(inv => inv.status === 'OVERDUE').length}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Relances Envoyées</div>
            <CheckCircle size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">
            {invoices.reduce((sum, inv) => sum + (inv.reminders?.length || 0), 0)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">À Récupérer</div>
            <Calendar size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">
            {invoices.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + (inv.amountTTC - inv.amountPaid), 0).toFixed(0)}€
          </div>
        </div>
      </div>

      {/* Invoices Needing Reminders */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 px-6 py-4 border-b border-slate-200">
          <h4 className="font-black text-slate-800 text-lg">Factures Nécessitant une Relance</h4>
          <p className="text-sm text-slate-600 mt-1">
            {invoicesNeedingReminders.length} facture(s) en attente de relance
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-4 text-left font-black uppercase text-xs">Facture</th>
                <th className="p-4 text-left font-black uppercase text-xs">Client</th>
                <th className="p-4 text-left font-black uppercase text-xs">Échéance</th>
                <th className="p-4 text-right font-black uppercase text-xs">Montant Dû</th>
                <th className="p-4 text-left font-black uppercase text-xs">Retard</th>
                <th className="p-4 text-left font-black uppercase text-xs">Prochaine Relance</th>
                <th className="p-4 text-left font-black uppercase text-xs">Historique</th>
                <th className="p-4 text-center font-black uppercase text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoicesNeedingReminders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    ✓ Aucune relance à envoyer pour le moment. Toutes les factures sont à jour !
                  </td>
                </tr>
              ) : (
                invoicesNeedingReminders.map(({ invoice, nextStage }) => {
                  const dueDate = new Date(invoice.dueDate);
                  const today = new Date();
                  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                  const amountDue = invoice.amountTTC - invoice.amountPaid;
                  const stageColors = STAGE_COLORS[nextStage!.stage];

                  return (
                    <tr key={invoice.id} className="hover:bg-orange-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{invoice.number}</div>
                        <div className="text-xs text-slate-500">{new Date(invoice.date).toLocaleDateString('fr-FR')}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-700">{invoice.patientName}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-600">{dueDate.toLocaleDateString('fr-FR')}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-black text-red-600 text-lg">{amountDue.toFixed(2)} €</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          daysOverdue > 45 ? 'bg-red-100 text-red-700' :
                          daysOverdue > 30 ? 'bg-orange-100 text-orange-700' :
                          daysOverdue > 15 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          +{daysOverdue} jours
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${stageColors.bg} ${stageColors.text}`}>
                          {nextStage!.stage}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-slate-500">
                          {invoice.reminders && invoice.reminders.length > 0 ? (
                            <div className="space-y-1">
                              {invoice.reminders.slice(-2).map((rem, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span className="font-semibold">{rem.stage}</span>
                                  <span>-</span>
                                  <span>{new Date(rem.date).toLocaleDateString('fr-FR')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Aucune relance</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenSendModal(invoice, nextStage!)}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-xs rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                          <Send size={14} />
                          Envoyer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Invoices with Reminder History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-slate-100 to-gray-100 px-6 py-4 border-b border-slate-200">
          <h4 className="font-black text-slate-800 text-lg">Historique Complet des Relances</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-4 text-left font-black uppercase text-xs">Facture</th>
                <th className="p-4 text-left font-black uppercase text-xs">Client</th>
                <th className="p-4 text-left font-black uppercase text-xs">Statut</th>
                <th className="p-4 text-right font-black uppercase text-xs">Montant</th>
                <th className="p-4 text-left font-black uppercase text-xs">Relances Envoyées</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices
                .filter(inv => (inv.reminders && inv.reminders.length > 0) || inv.status === 'OVERDUE')
                .map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{invoice.number}</div>
                      <div className="text-xs text-slate-500">{new Date(invoice.date).toLocaleDateString('fr-FR')}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{invoice.patientName}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-black text-slate-800">{invoice.amountTTC.toFixed(2)} €</div>
                    </td>
                    <td className="p-4">
                      {invoice.reminders && invoice.reminders.length > 0 ? (
                        <div className="space-y-2">
                          {invoice.reminders.map((rem, idx) => {
                            const stageColors = STAGE_COLORS[rem.stage];
                            return (
                              <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border ${stageColors.bg} ${stageColors.border}`}>
                                <span className={`font-bold text-xs ${stageColors.text}`}>{rem.stage}</span>
                                <span className="text-xs text-slate-600">{new Date(rem.date).toLocaleDateString('fr-FR')}</span>
                                <span className="text-xs text-slate-500">via {rem.method}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Aucune relance envoyée</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Reminder Modal */}
      {showSendModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-5 flex justify-between items-center rounded-t-2xl">
              <div>
                <h3 className="font-black text-xl">Envoyer Relance {selectedStage}</h3>
                <p className="text-sm opacity-90 mt-1">Facture {selectedInvoice.number} - {selectedInvoice.patientName}</p>
              </div>
              <button onClick={() => setShowSendModal(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500 font-semibold mb-1">Facture</div>
                    <div className="font-bold text-slate-800">{selectedInvoice.number}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold mb-1">Montant Dû</div>
                    <div className="font-bold text-red-600">{(selectedInvoice.amountTTC - selectedInvoice.amountPaid).toFixed(2)} €</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold mb-1">Échéance</div>
                    <div className="font-bold text-slate-800">{new Date(selectedInvoice.dueDate).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold mb-1">Retard</div>
                    <div className="font-bold text-orange-600">
                      +{Math.floor((new Date().getTime() - new Date(selectedInvoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} jours
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Message de Relance</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                  placeholder="Personnalisez votre message..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Variables disponibles: {'{invoiceNumber}'}, {'{amount}'}, {'{practitioner}'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendReminder}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Envoyer la Relance
                </button>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderModule;
