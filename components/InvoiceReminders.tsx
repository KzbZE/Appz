import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { AlertCircle, Send, Clock, Euro, Calendar, Mail, X, Check, TrendingDown, Bell } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { jsPDF } from 'jspdf';

interface ReminderConfig {
  firstReminderDays: number;
  nextReminderFreq: number;
  autoReminder: boolean;
}

const InvoiceReminders: React.FC = () => {
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toArray());
  const currentSettings = settings?.[0];

  const [showMailModal, setShowMailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [mailForm, setMailForm] = useState({ to: '', subject: '', message: '' });
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<ReminderConfig>({
    firstReminderDays: currentSettings?.finance?.firstReminderDays || 0,
    nextReminderFreq: currentSettings?.finance?.nextReminderFreq || 7,
    autoReminder: false
  });

  // Categorize overdue invoices
  const overdueInvoices = useMemo(() => {
    const now = new Date();

    return invoices
      .filter(inv =>
        inv.status !== InvoiceStatus.PAID &&
        new Date(inv.dueDate) < now &&
        inv.amountPaid < inv.amountTTC
      )
      .map(inv => {
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = inv.amountTTC - inv.amountPaid;

        let severity: 'warning' | 'danger' | 'critical' = 'warning';
        if (daysOverdue > 60) severity = 'critical';
        else if (daysOverdue > 30) severity = 'danger';

        const lastReminderDate = inv.reminderSentAt ? new Date(inv.reminderSentAt) : null;
        const daysSinceReminder = lastReminderDate
          ? Math.floor((now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const needsReminder =
          !lastReminderDate ||
          (daysSinceReminder !== null && daysSinceReminder >= config.nextReminderFreq);

        return {
          ...inv,
          daysOverdue,
          remaining,
          severity,
          needsReminder,
          daysSinceReminder
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [invoices, config]);

  const stats = useMemo(() => {
    const total = overdueInvoices.length;
    const totalAmount = overdueInvoices.reduce((sum, inv) => sum + inv.remaining, 0);
    const critical = overdueInvoices.filter(i => i.severity === 'critical').length;
    const needingAction = overdueInvoices.filter(i => i.needsReminder).length;

    return { total, totalAmount, critical, needingAction };
  }, [overdueInvoices]);

  const generateInvoicePDF = (inv: Invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("FACTURE - RAPPEL", 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text(currentSettings?.practitionerName || "Praticien", 20, 40);
    doc.text(currentSettings?.cabinetAddress || "Adresse", 20, 45);

    doc.text(`N° Facture: ${inv.number}`, 140, 40);
    doc.text(`Date: ${new Date(inv.date).toLocaleDateString()}`, 140, 45);
    doc.text(`Échéance: ${new Date(inv.dueDate).toLocaleDateString()}`, 140, 50);
    doc.text(`Client: ${inv.patientName}`, 140, 60);

    doc.setFontSize(12);
    doc.text("Désignation", 20, 80);
    doc.text("Prix", 170, 80);
    doc.line(20, 82, 190, 82);

    let y = 90;
    const items = inv.items && inv.items.length > 0 ? inv.items : [{ description: "Séance Thérapeutique", price: inv.amountTTC }];

    items.forEach(item => {
      doc.text(item.description, 20, y);
      doc.text(`${item.price.toFixed(2)} €`, 170, y);
      y += 10;
    });

    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(14);
    doc.text(`Total TTC: ${inv.amountTTC.toFixed(2)} €`, 140, y);

    if (inv.payments && inv.payments.length > 0) {
      y += 15;
      doc.setFontSize(10);
      doc.text("Paiements reçus :", 20, y);
      y += 5;
      inv.payments.forEach(p => {
        doc.text(`- ${new Date(p.date).toLocaleDateString()}: ${p.amount.toFixed(2)} €`, 20, y);
        y += 5;
      });
    }

    y += 10;
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38);
    doc.text(`RESTE À PAYER: ${(inv.amountTTC - inv.amountPaid).toFixed(2)} €`, 105, y, { align: 'center' });

    return doc;
  };

  const handleSendReminder = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const daysOverdue = Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));

    setMailForm({
      to: '',
      subject: `Rappel Facture ${invoice.number} - Échue depuis ${daysOverdue} jours`,
      message: `Bonjour ${invoice.patientName},\n\nNous constatons que la facture n°${invoice.number} d'un montant de ${invoice.amountTTC.toFixed(2)}€, échue le ${new Date(invoice.dueDate).toLocaleDateString()}, n'a pas encore été réglée.\n\nMontant restant dû : ${(invoice.amountTTC - invoice.amountPaid).toFixed(2)}€\nRetard : ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}\n\nMerci de régulariser votre situation dans les plus brefs délais.\n\nCordialement,\n${currentSettings?.practitionerName || 'Votre Praticien'}`
    });
    setShowMailModal(true);
  };

  const confirmSendReminder = async () => {
    if (!selectedInvoice || !mailForm.to) return;

    const doc = generateInvoicePDF(selectedInvoice);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rappel_Facture_${selectedInvoice.number}.pdf`;
    link.click();
    URL.revokeObjectURL(url);

    const mailtoLink = `mailto:${mailForm.to}?subject=${encodeURIComponent(mailForm.subject)}&body=${encodeURIComponent(mailForm.message)}`;
    window.open(mailtoLink, '_blank');

    // Update reminder date
    if (selectedInvoice.id) {
      await db.invoices.update(selectedInvoice.id, {
        reminderSentAt: new Date().toISOString()
      });
    }

    alert("Rappel envoyé ! Le PDF a été téléchargé.");
    setShowMailModal(false);
    setSelectedInvoice(null);
  };

  const handleBulkReminder = async () => {
    const toRemind = overdueInvoices.filter(i => i.needsReminder);
    if (toRemind.length === 0) {
      alert("Aucune facture ne nécessite de rappel pour le moment.");
      return;
    }

    const confirmed = confirm(`Envoyer ${toRemind.length} rappel(s) ?`);
    if (!confirmed) return;

    for (const inv of toRemind) {
      handleSendReminder(inv);
    }
  };

  const saveConfig = async () => {
    if (currentSettings?.id) {
      await db.settings.update(currentSettings.id, {
        finance: {
          ...currentSettings.finance,
          firstReminderDays: config.firstReminderDays,
          nextReminderFreq: config.nextReminderFreq
        }
      });
      setShowConfig(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'from-red-500 to-pink-600';
      case 'danger': return 'from-orange-500 to-red-500';
      default: return 'from-yellow-400 to-orange-500';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center">
            <Bell size={32} className="mr-3 text-red-600" />
            Gestion des Rappels
          </h2>
          <p className="text-slate-500 text-sm mt-1">Suivi et relance des factures impayées</p>
        </div>
        <button
          onClick={() => setShowConfig(true)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-gray-50"
        >
          ⚙️ Configuration
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle size={24} />
            <span className="text-sm font-medium opacity-90">Total en retard</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.total}</h3>
          <p className="text-sm opacity-90 mt-1">factures</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Euro size={24} />
            <span className="text-sm font-medium opacity-90">Montant total</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.totalAmount.toFixed(0)}€</h3>
          <p className="text-sm opacity-90 mt-1">à recouvrer</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown size={24} />
            <span className="text-sm font-medium opacity-90">Critiques (+60j)</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.critical}</h3>
          <p className="text-sm opacity-90 mt-1">urgence maximale</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Send size={24} />
            <span className="text-sm font-medium opacity-90">Action requise</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.needingAction}</h3>
          <p className="text-sm opacity-90 mt-1">rappels à envoyer</p>
        </div>
      </div>

      {/* Bulk Actions */}
      {stats.needingAction > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center">
            <Clock size={24} className="text-blue-600 mr-3" />
            <div>
              <h4 className="font-bold text-blue-900">Actions Recommandées</h4>
              <p className="text-sm text-blue-700">
                {stats.needingAction} facture{stats.needingAction > 1 ? 's' : ''} nécessite{stats.needingAction > 1 ? 'nt' : ''} un rappel
              </p>
            </div>
          </div>
          <button
            onClick={handleBulkReminder}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg"
          >
            📤 Envoyer tous les rappels
          </button>
        </div>
      )}

      {/* Overdue Invoices List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-slate-800">Factures en Retard</h3>
        </div>

        {overdueInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Check size={48} className="mx-auto mb-4 text-green-500" />
            <p className="font-bold text-lg">Aucune facture en retard ! 🎉</p>
            <p className="text-sm">Tous vos paiements sont à jour.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-slate-600 font-bold">
                <tr>
                  <th className="p-4 text-left">N° Facture</th>
                  <th className="p-4 text-left">Client</th>
                  <th className="p-4 text-right">Montant Dû</th>
                  <th className="p-4 text-center">Retard</th>
                  <th className="p-4 text-center">Dernier Rappel</th>
                  <th className="p-4 text-center">Gravité</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overdueInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700">{inv.number}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{inv.patientName}</div>
                      <div className="text-xs text-slate-500">Échéance: {new Date(inv.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 text-right font-bold text-red-600">{inv.remaining.toFixed(2)} €</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getSeverityColor(inv.severity)} text-white`}>
                        {inv.daysOverdue}j
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-600">
                      {inv.reminderSentAt ? (
                        <div>
                          <div className="text-xs">{new Date(inv.reminderSentAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">il y a {inv.daysSinceReminder}j</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Jamais</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${inv.severity === 'critical' ? 'bg-red-100 text-red-700' : inv.severity === 'danger' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {inv.severity === 'critical' ? '🔴 Critique' : inv.severity === 'danger' ? '🟠 Danger' : '🟡 Attention'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSendReminder(inv)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${inv.needsReminder ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg animate-pulse' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                          }`}
                      >
                        {inv.needsReminder ? '📤 Envoyer Rappel' : '✉️ Relancer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">⚙️ Configuration Rappels</h3>
              <button onClick={() => setShowConfig(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Délai avant 1er rappel (jours après échéance)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                  value={config.firstReminderDays}
                  onChange={(e) => setConfig({ ...config, firstReminderDays: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fréquence rappels suivants (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                  value={config.nextReminderFreq}
                  onChange={(e) => setConfig({ ...config, nextReminderFreq: parseInt(e.target.value) })}
                />
              </div>
              <button
                onClick={saveConfig}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mail Modal */}
      {showMailModal && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center">
                <Mail size={20} className="mr-2 text-blue-600" /> Envoyer Rappel
              </h3>
              <button onClick={() => setShowMailModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destinataire</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={mailForm.to}
                  onChange={(e) => setMailForm({ ...mailForm, to: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objet</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={mailForm.subject}
                  onChange={(e) => setMailForm({ ...mailForm, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                <textarea
                  rows={8}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={mailForm.message}
                  onChange={(e) => setMailForm({ ...mailForm, message: e.target.value })}
                />
              </div>
              <button
                onClick={confirmSendReminder}
                disabled={!mailForm.to}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 hover:bg-blue-700"
              >
                📤 Envoyer le Rappel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceReminders;
