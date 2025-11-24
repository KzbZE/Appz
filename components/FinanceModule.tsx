import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus, Expense, PaymentRecord, RecurringInvoice } from '../types';
import { Download, TrendingUp, TrendingDown, Euro, Bell, CreditCard, AlertTriangle, Send, Check, Settings as SettingsIcon, X, HardDrive, Eye, Edit2, Plus, Trash2, Calendar, Repeat } from 'lucide-react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { jsPDF } from 'jspdf';
import { checkAuth, listDriveFolders, uploadToDriveReal } from '../services/googleApiService';
import { sendEmail } from '../services/notificationService';

interface FinanceModuleProps {
  invoices: Invoice[];
  expenses: Expense[];
}

const FinanceModule: React.FC<FinanceModuleProps> = ({ invoices: initialInvoices, expenses }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'recurring' | 'expenses'>('overview');
  const settings = useLiveQuery(() => db.settings.toArray());
  const currentSettings = settings?.[0];
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
      firstReminderDays: 0,
      nextReminderFreq: 7
  });

  // Invoice Detail & Edit State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Invoice>>({});

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
      amount: '',
      method: 'CARD',
      date: new Date().toISOString().split('T')[0]
  });

  // Drive State
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFolders, setDriveFolders] = useState<{id:string, name:string}[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [invoiceToExport, setInvoiceToExport] = useState<Invoice | null>(null);

  // Mail State
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailForm, setMailForm] = useState({ to: '', subject: '', message: '' });

  // Expense State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'MATERIEL',
    description: '',
    amount: 0,
    notes: ''
  });
  const [filterExpenseCategory, setFilterExpenseCategory] = useState<string>('ALL');

  // Recurring Invoice State
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [recurringForm, setRecurringForm] = useState<Partial<RecurringInvoice>>({
    patientName: '',
    subscriptionType: '',
    frequency: 'MONTHLY',
    amountHT: 0,
    vatRate: 0,
    items: [],
    startDate: new Date().toISOString().split('T')[0],
    nextDueDate: new Date().toISOString().split('T')[0],
    isActive: true,
    totalGenerated: 0
  });

  const PAYMENT_METHODS: Record<string, string> = {
      'CASH': 'Espèces',
      'CHECK': 'Chèque',
      'TRANSFER': 'Virement',
      'CARD': 'Carte Bancaire'
  };

  const EXPENSE_CATEGORIES: Record<string, { label: string; icon: string }> = {
      'CARBURANT': { label: 'Carburant', icon: '⛽' },
      'MATERIEL': { label: 'Matériel', icon: '🛠️' },
      'FORMATION': { label: 'Formation', icon: '📚' },
      'ASSURANCES': { label: 'Assurances', icon: '🛡️' },
      'LOYER': { label: 'Loyer', icon: '🏢' },
      'AUTRE': { label: 'Autre', icon: '📦' }
  };

  const FREQUENCIES: Record<string, string> = {
      'WEEKLY': 'Hebdomadaire',
      'MONTHLY': 'Mensuel',
      'QUARTERLY': 'Trimestriel',
      'YEARLY': 'Annuel'
  };

  useEffect(() => {
      if (currentSettings?.finance) {
          setConfigForm(currentSettings.finance);
      }
  }, [currentSettings]);

  const checkReminderNeeded = (inv: Invoice) => {
      if (inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.DRAFT) return false;
      if (!currentSettings?.finance) return false;

      const today = new Date();
      const dueDate = new Date(inv.dueDate);
      
      const firstReminderThreshold = new Date(dueDate);
      firstReminderThreshold.setDate(dueDate.getDate() + currentSettings.finance.firstReminderDays);

      if (inv.reminderSentAt) {
          const lastSent = new Date(inv.reminderSentAt);
          const nextReminderThreshold = new Date(lastSent);
          nextReminderThreshold.setDate(lastSent.getDate() + currentSettings.finance.nextReminderFreq);
          
          return today >= nextReminderThreshold && inv.amountPaid < inv.amountTTC;
      } else {
          return today >= firstReminderThreshold && inv.amountPaid < inv.amountTTC;
      }
  };

  useEffect(() => {
    if (initialInvoices) {
        initialInvoices.forEach(inv => {
            if (inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.DRAFT) {
                const isOverdue = new Date(inv.dueDate) < new Date() && inv.amountPaid < inv.amountTTC;
                if (isOverdue && inv.status !== InvoiceStatus.OVERDUE && inv.id) {
                    db.invoices.update(inv.id, { status: InvoiceStatus.OVERDUE });
                }
            }
        });
    }
  }, [initialInvoices]);

  const totalCA = initialInvoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const pendingCA = initialInvoices.reduce((acc, inv) => acc + (inv.amountTTC - inv.amountPaid), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  const handleSaveConfig = async () => {
      if (currentSettings?.id) {
          await db.settings.update(currentSettings.id, { finance: configForm });
          setIsConfigOpen(false);
      }
  };

  // --- PDF & Drive Functions ---

  const generateInvoicePDF = (inv: Invoice) => {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("FACTURE", 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(currentSettings?.practitionerName || "Praticien", 20, 40);
      doc.text(currentSettings?.cabinetAddress || "Adresse", 20, 45);

      doc.text(`N° Facture: ${inv.number}`, 140, 40);
      doc.text(`Date: ${new Date(inv.date).toLocaleDateString()}`, 140, 45);
      doc.text(`Client: ${inv.patientName}`, 140, 55);

      doc.setFontSize(12);
      doc.text("Désignation", 20, 80);
      doc.text("Prix", 170, 80);
      doc.line(20, 82, 190, 82);

      let y = 90;
      const items = inv.items && inv.items.length > 0 ? inv.items : [{description: "Séance Thérapeutique", price: inv.amountTTC}];
      
      items.forEach(item => {
          doc.text(item.description, 20, y);
          doc.text(`${item.price.toFixed(2)} €`, 170, y);
          y += 10;
      });

      doc.line(20, y, 190, y);
      y += 10;
      doc.setFontSize(14);
      doc.text(`Total TTC: ${inv.amountTTC.toFixed(2)} €`, 140, y);
      
      if(inv.payments && inv.payments.length > 0) {
          y += 15;
          doc.setFontSize(10);
          doc.text("Paiements reçus :", 20, y);
          y += 5;
          inv.payments.forEach(p => {
               doc.text(`- ${new Date(p.date).toLocaleDateString()}: ${p.amount.toFixed(2)} € (${PAYMENT_METHODS[p.method] || p.method})`, 20, y);
               y += 5;
          });
          y += 5;
          doc.setFontSize(12);
          doc.text(`Reste à payer: ${(inv.amountTTC - inv.amountPaid).toFixed(2)} €`, 140, y);
      }

      return doc;
  };

  const handleDownloadPDF = (inv: Invoice) => {
      const doc = generateInvoicePDF(inv);
      doc.save(`Facture_${inv.number}.pdf`);
  };

  const handleExportToDrive = async (inv: Invoice) => {
      setInvoiceToExport(inv);
      const authed = await checkAuth();
      if (authed) {
          const folders = await listDriveFolders();
          setDriveFolders(folders);
          setShowDriveModal(true);
      } else {
          alert("Veuillez d'abord connecter votre compte Google dans les Paramètres");
      }
  };

  const confirmExportToDrive = async () => {
      if (!selectedFolder || !invoiceToExport) return;
      const doc = generateInvoicePDF(invoiceToExport);
      const blob = doc.output('blob');
      const fileName = `Facture_${invoiceToExport.number}.pdf`;
      
      try {
          const url = await uploadToDriveReal(blob, fileName, selectedFolder);
          alert(`Facture sauvegardée sur Drive !`);
          setShowDriveModal(false);
          setInvoiceToExport(null);
      } catch (error) {
          alert("Erreur upload Drive");
          console.error(error);
      }
  };

  // --- Invoice Detail & Editing ---

  const openInvoiceDetail = (inv: Invoice) => {
      setSelectedInvoice(inv);
      setEditForm(JSON.parse(JSON.stringify(inv))); // Deep copy
      setIsEditingInvoice(false);
  };

  const handleSaveEditedInvoice = async () => {
      if (!selectedInvoice?.id || !editForm) return;
      
      // Recalculate total based on items
      const newTotal = (editForm.items || []).reduce((acc, item) => acc + item.price, 0);
      
      const updatedInvoice = {
          ...editForm,
          amountTTC: newTotal,
          amountHT: newTotal, // Simplification (no VAT logic change)
      };

      await db.invoices.update(selectedInvoice.id, updatedInvoice);
      setSelectedInvoice(updatedInvoice as Invoice);
      setIsEditingInvoice(false);
  };

  const handleItemChange = (index: number, field: 'description' | 'price', value: string) => {
      if (!editForm.items) return;
      const newItems = [...editForm.items];
      if (field === 'price') {
          newItems[index].price = parseFloat(value) || 0;
      } else {
          newItems[index].description = value;
      }
      setEditForm({ ...editForm, items: newItems });
  };

  const addItem = () => {
      const newItems = [...(editForm.items || []), { description: 'Nouvel article', price: 0 }];
      setEditForm({ ...editForm, items: newItems });
  };

  const removeItem = (index: number) => {
      if (!editForm.items) return;
      const newItems = editForm.items.filter((_, i) => i !== index);
      setEditForm({ ...editForm, items: newItems });
  };

  // --- Payment Logic ---

  const openPaymentModal = () => {
      if (!selectedInvoice) return;
      const remaining = selectedInvoice.amountTTC - selectedInvoice.amountPaid;
      setPaymentForm({
          amount: remaining.toFixed(2),
          method: 'CARD',
          date: new Date().toISOString().split('T')[0]
      });
      setIsPaymentModalOpen(true);
  };

  const submitPayment = async () => {
      if (!selectedInvoice?.id) return;

      const amount = parseFloat(paymentForm.amount);
      if (isNaN(amount) || amount <= 0) {
          alert("Montant invalide");
          return;
      }

      const newPaid = selectedInvoice.amountPaid + amount;
      const newStatus = newPaid >= (selectedInvoice.amountTTC - 0.01) ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

      const newPayment: PaymentRecord = {
          date: new Date(paymentForm.date).toISOString(),
          amount: amount,
          method: paymentForm.method
      };

      const updatedPayments = [...(selectedInvoice.payments || []), newPayment];

      await db.invoices.update(selectedInvoice.id, {
          amountPaid: newPaid,
          status: newStatus,
          payments: updatedPayments
      });

      // Update local view
      setSelectedInvoice({
          ...selectedInvoice,
          amountPaid: newPaid,
          status: newStatus,
          payments: updatedPayments
      });

      setIsPaymentModalOpen(false);
  };

  // Mail Functions
  const handleSendInvoiceByMail = () => {
      if (!selectedInvoice) return;
      const remaining = selectedInvoice.amountTTC - selectedInvoice.amountPaid;
      setMailForm({
          to: '',
          subject: `Facture ${selectedInvoice.number} - ${currentSettings?.practitionerName || 'Praticien'}`,
          message: `Bonjour ${selectedInvoice.patientName},\n\nVeuillez trouver ci-joint votre facture n°${selectedInvoice.number} d'un montant de ${selectedInvoice.amountTTC.toFixed(2)}€.\n\n${remaining > 0 ? `Montant restant à régler : ${remaining.toFixed(2)}€\nÉchéance : ${new Date(selectedInvoice.dueDate).toLocaleDateString()}\n\n` : ''}Cordialement,\n${currentSettings?.practitionerName || 'Votre Praticien'}`
      });
      setShowMailModal(true);
  };

  const confirmSendInvoiceMail = async () => {
      if (!selectedInvoice || !mailForm.to) return;

      const doc = generateInvoicePDF(selectedInvoice);
      const blob = doc.output('blob');

      try {
          // Send email via API
          const emailSent = await sendEmail({
              to: mailForm.to,
              subject: mailForm.subject,
              message: mailForm.message,
              relatedRequestId: selectedInvoice.id
          });

          if (emailSent) {
              // Download PDF locally for record
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Facture_${selectedInvoice.number}.pdf`;
              link.click();
              URL.revokeObjectURL(url);

              // Marquer le rappel comme envoyé
              if (selectedInvoice.id) {
                  await db.invoices.update(selectedInvoice.id, {
                      reminderSentAt: new Date().toISOString()
                  });
              }

              alert("✅ Facture envoyée par email avec succès ! Le PDF a été téléchargé localement.");
              setShowMailModal(false);
          } else {
              alert("❌ Erreur lors de l'envoi de l'email. Vérifiez la configuration de votre clé API Resend dans les variables d'environnement Netlify.");
          }
      } catch (error) {
          console.error("Erreur envoi email:", error);
          alert("❌ Erreur lors de l'envoi de l'email. Consultez la console pour plus de détails.");
      }
  };

  // --- Renders ---

  const renderConfigModal = () => (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-800 p-4 text-white flex justify-between items-center"><h3 className="font-bold">Configuration Relances</h3><button onClick={() => setIsConfigOpen(false)}><X size={20}/></button></div>
              <div className="p-6 space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Délai Première Relance</label>
                      <div className="flex items-center gap-2">
                        <input type="number" className="p-2 border border-gray-300 rounded-lg w-24 text-center font-bold" value={configForm.firstReminderDays} onChange={e => setConfigForm({...configForm, firstReminderDays: parseInt(e.target.value)})}/>
                        <span className="text-sm text-slate-500">jours après échéance</span>
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Fréquence Suivante</label>
                      <div className="flex items-center gap-2">
                        <input type="number" className="p-2 border border-gray-300 rounded-lg w-24 text-center font-bold" value={configForm.nextReminderFreq} onChange={e => setConfigForm({...configForm, nextReminderFreq: parseInt(e.target.value)})}/>
                        <span className="text-sm text-slate-500">jours</span>
                      </div>
                  </div>
                  <button onClick={handleSaveConfig} className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300">Enregistrer</button>
              </div>
          </div>
      </div>
  );

  const renderPaymentModal = () => (
      <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="bg-green-600 p-4 rounded-t-2xl text-white flex justify-between items-center">
                  <h3 className="font-bold flex items-center"><CreditCard size={20} className="mr-2"/> Encaisser Paiement</h3>
                  <button onClick={() => setIsPaymentModalOpen(false)}><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Montant (€)</label>
                      <input 
                        type="number" step="0.01"
                        className="w-full p-3 border border-gray-300 rounded-xl text-lg font-bold text-slate-800"
                        value={paymentForm.amount}
                        onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Moyen de Paiement</label>
                      <select 
                        className="w-full p-3 border border-gray-300 rounded-xl bg-white"
                        value={paymentForm.method}
                        onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                      >
                          <option value="CASH">Espèces</option>
                          <option value="CHECK">Chèque</option>
                          <option value="TRANSFER">Virement</option>
                          <option value="CARD">Carte Bancaire</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                      <input 
                        type="date"
                        className="w-full p-3 border border-gray-300 rounded-xl"
                        value={paymentForm.date}
                        onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                      />
                  </div>
                  <div className="pt-2">
                      <button onClick={submitPayment} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-colors">
                          Valider l'Encaissement
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderInvoiceDetailModal = () => {
      if (!selectedInvoice) return null;
      
      const remaining = selectedInvoice.amountTTC - selectedInvoice.amountPaid;
      const isPaid = selectedInvoice.status === InvoiceStatus.PAID;

      return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-slideIn" onClick={() => setSelectedInvoice(null)}>
            <div className="w-full md:w-[600px] bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <h2 className="text-2xl font-bold text-slate-800">Facture {selectedInvoice.number}</h2>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold border 
                                ${selectedInvoice.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' : 
                                  selectedInvoice.status === 'OVERDUE' ? 'bg-red-100 text-red-700 border-red-200' : 
                                  'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                {selectedInvoice.status}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium">{selectedInvoice.patientName}</p>
                    </div>
                    <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-gray-200 rounded-full text-slate-500"><X size={24}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Mode Edition vs Lecture */}
                    {isEditingInvoice ? (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm text-yellow-800 mb-4 flex items-center">
                                <AlertTriangle size={16} className="mr-2"/> Mode Édition activé
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date Facture</label>
                                    <input type="date" className="w-full p-2 border border-gray-300 rounded-lg" 
                                        value={editForm.date ? new Date(editForm.date).toISOString().split('T')[0] : ''}
                                        onChange={e => setEditForm({...editForm, date: new Date(e.target.value).toISOString()})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Échéance</label>
                                    <input type="date" className="w-full p-2 border border-gray-300 rounded-lg" 
                                        value={editForm.dueDate ? new Date(editForm.dueDate).toISOString().split('T')[0] : ''}
                                        onChange={e => setEditForm({...editForm, dueDate: new Date(e.target.value).toISOString()})}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Articles</label>
                                    <button onClick={addItem} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 flex items-center"><Plus size={12} className="mr-1"/>Ajouter</button>
                                </div>
                                <div className="space-y-2">
                                    {editForm.items?.map((item, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input type="text" className="flex-1 p-2 border border-gray-300 rounded-lg text-sm" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} />
                                            <input type="number" className="w-24 p-2 border border-gray-300 rounded-lg text-sm text-right" value={item.price} onChange={e => handleItemChange(idx, 'price', e.target.value)} />
                                            <button onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between text-sm">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase">Date</p>
                                    <p className="font-medium">{new Date(selectedInvoice.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs uppercase">Échéance</p>
                                    <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-xs uppercase">Montant Total</p>
                                    <p className="font-bold text-lg">{selectedInvoice.amountTTC.toFixed(2)} €</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 border-b border-gray-100 pb-2 mb-3 text-sm uppercase">Détails Prestation</h4>
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? selectedInvoice.items.map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-2 text-slate-600">{item.description}</td>
                                                <td className="py-2 text-right font-medium">{item.price.toFixed(2)} €</td>
                                            </tr>
                                        )) : (
                                            <tr><td className="py-2 text-slate-600">Consultation Standard</td><td className="py-2 text-right">{selectedInvoice.amountTTC.toFixed(2)} €</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Déjà réglé</span>
                                    <span className="font-bold text-green-600">{selectedInvoice.amountPaid.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-lg border-t border-gray-200 pt-2">
                                    <span className="font-bold text-slate-800">Reste à payer</span>
                                    <span className="font-bold text-orange-600">{remaining.toFixed(2)} €</span>
                                </div>
                            </div>

                            {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-slate-800 border-b border-gray-100 pb-2 mb-3 text-sm uppercase flex items-center">
                                        <Check size={16} className="mr-2 text-green-500"/>Historique Paiements
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedInvoice.payments.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100 text-sm">
                                                <div className="flex items-center">
                                                    <Calendar size={14} className="text-green-600 mr-2"/>
                                                    <span className="font-medium text-green-900">{new Date(p.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="px-2 py-0.5 bg-white rounded text-[10px] uppercase font-bold text-green-600 border border-green-200">
                                                        {PAYMENT_METHODS[p.method] || p.method}
                                                    </span>
                                                    <span className="font-bold text-green-800">{p.amount.toFixed(2)} €</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                    {isEditingInvoice ? (
                        <div className="flex gap-3">
                            <button onClick={() => setIsEditingInvoice(false)} className="flex-1 py-3 bg-white border border-gray-300 text-slate-600 rounded-xl font-bold hover:bg-gray-50">
                                Annuler
                            </button>
                            <button onClick={handleSaveEditedInvoice} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-bold shadow-lg transition-all duration-300">
                                Enregistrer Modifications
                            </button>
                        </div>
                    ) : (
                        <>
                            {!isPaid && (
                                <button onClick={openPaymentModal} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 flex justify-center items-center">
                                    <CreditCard size={18} className="mr-2" /> Encaisser un Paiement
                                </button>
                            )}
                            
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleDownloadPDF(selectedInvoice)} className="flex items-center justify-center py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-gray-100">
                                    <Download size={16} className="mr-2" /> PDF
                                </button>
                                <button onClick={() => handleExportToDrive(selectedInvoice)} className="flex items-center justify-center py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-gray-100">
                                    <HardDrive size={16} className="mr-2" /> Drive
                                </button>
                                <button onClick={handleSendInvoiceByMail} className="flex items-center justify-center py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-gray-100">
                                    <Send size={16} className="mr-2" /> Email
                                </button>
                            </div>
                            
                            {!isPaid && (
                                <div className="flex justify-center mt-2">
                                    <button onClick={() => setIsEditingInvoice(true)} className="text-xs text-slate-400 flex items-center hover:text-teal-600 hover:underline transition-colors">
                                        <Edit2 size={12} className="mr-1"/> Modifier la facture
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
      );
  };

  const renderInvoices = () => (
    <div className="space-y-4 animate-fadeIn">
        <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center space-x-2"><h3 className="font-bold text-slate-800">Factures & Paiements</h3></div>
            <div className="flex gap-2">
                <button onClick={() => setIsConfigOpen(true)} className="p-2 bg-gray-100 text-slate-600 hover:bg-gray-200 rounded-lg"><SettingsIcon size={20} /></button>
                <button onClick={async () => { await db.invoices.add({ number: `F${Date.now()}`, date: new Date().toISOString(), dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), patientName: 'Nouveau Client', amountHT: 0, vatRate: 0, amountTTC: 0, amountPaid: 0, status: InvoiceStatus.DRAFT, items: [], payments: [] }); }} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-sm rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105">+ Créer Facture</button>
            </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-slate-500 font-medium border-b border-gray-100">
                        <tr><th className="p-4">Patient</th><th className="p-4">Échéance</th><th className="p-4">Montant Total</th><th className="p-4 w-1/3">Paiement</th><th className="p-4">État</th><th className="p-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {initialInvoices.map(inv => {
                            const isOverdue = new Date(inv.dueDate) < new Date() && inv.amountPaid < inv.amountTTC;
                            const percentPaid = inv.amountTTC > 0 ? (inv.amountPaid / inv.amountTTC) * 100 : 0;
                            return (
                                <tr key={inv.id} onClick={() => openInvoiceDetail(inv)} className={`hover:bg-gray-50 transition-colors cursor-pointer ${isOverdue ? 'bg-red-50' : ''}`}>
                                    <td className="p-4"><div className="font-bold">{inv.patientName}</div><div className="text-xs">{inv.number}</div></td>
                                    <td className="p-4 text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                    <td className="p-4 font-bold">{inv.amountTTC.toFixed(2)} €</td>
                                    <td className="p-4"><div className="w-full bg-gray-200 rounded-full h-2.5 mb-1"><div className="h-2.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600" style={{width: `${percentPaid}%`}}></div></div></td>
                                    <td className="p-4"><span className="px-2 py-1 rounded bg-gray-100 text-xs">{inv.status}</span></td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><Eye size={18}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  // --- Expense Management Functions ---

  const handleAddExpense = async () => {
      if (!expenseForm.description || !expenseForm.amount || expenseForm.amount <= 0) {
          alert("Veuillez remplir tous les champs obligatoires");
          return;
      }

      await db.expenses.add({
          date: expenseForm.date || new Date().toISOString(),
          category: expenseForm.category as any,
          description: expenseForm.description,
          amount: expenseForm.amount,
          notes: expenseForm.notes,
          receiptUrl: expenseForm.receiptUrl
      });

      setExpenseForm({
          date: new Date().toISOString().split('T')[0],
          category: 'MATERIEL',
          description: '',
          amount: 0,
          notes: ''
      });
      setIsAddingExpense(false);
  };

  const handleDeleteExpense = async (id: number | string) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
          await db.expenses.delete(id);
      }
  };

  // --- Recurring Invoice Management Functions ---

  const handleAddRecurring = async () => {
      if (!recurringForm.patientName || !recurringForm.subscriptionType || !recurringForm.amountHT || recurringForm.amountHT <= 0) {
          alert("Veuillez remplir tous les champs obligatoires");
          return;
      }

      const nextDate = calculateNextDueDate(recurringForm.startDate || new Date().toISOString(), recurringForm.frequency || 'MONTHLY');

      await db.recurringInvoices.add({
          patientName: recurringForm.patientName,
          subscriptionType: recurringForm.subscriptionType,
          frequency: recurringForm.frequency || 'MONTHLY',
          amountHT: recurringForm.amountHT,
          vatRate: recurringForm.vatRate || 0,
          items: recurringForm.items || [],
          startDate: recurringForm.startDate || new Date().toISOString(),
          nextDueDate: nextDate,
          endDate: recurringForm.endDate,
          isActive: true,
          totalGenerated: 0
      } as RecurringInvoice);

      setRecurringForm({
          patientName: '',
          subscriptionType: '',
          frequency: 'MONTHLY',
          amountHT: 0,
          vatRate: 0,
          items: [],
          startDate: new Date().toISOString().split('T')[0],
          nextDueDate: new Date().toISOString().split('T')[0],
          isActive: true,
          totalGenerated: 0
      });
      setIsAddingRecurring(false);
  };

  const calculateNextDueDate = (currentDate: string, frequency: string): string => {
      const date = new Date(currentDate);
      switch (frequency) {
          case 'WEEKLY':
              date.setDate(date.getDate() + 7);
              break;
          case 'MONTHLY':
              date.setMonth(date.getMonth() + 1);
              break;
          case 'QUARTERLY':
              date.setMonth(date.getMonth() + 3);
              break;
          case 'YEARLY':
              date.setFullYear(date.getFullYear() + 1);
              break;
      }
      return date.toISOString().split('T')[0];
  };

  const generateInvoiceFromRecurring = async (recurring: RecurringInvoice) => {
      if (!recurring.id) return;

      const invoiceCount = await db.invoices.count();
      const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const amountTTC = recurring.amountHT * (1 + recurring.vatRate / 100);

      await db.invoices.add({
          number: invoiceNumber,
          date: today,
          dueDate: dueDate.toISOString().split('T')[0],
          patientName: recurring.patientName,
          amountHT: recurring.amountHT,
          vatRate: recurring.vatRate,
          amountTTC: amountTTC,
          amountPaid: 0,
          status: InvoiceStatus.DRAFT,
          items: recurring.items.length > 0 ? recurring.items : [{ description: recurring.subscriptionType, price: amountTTC }],
          payments: []
      } as Invoice);

      // Update recurring invoice
      const nextDate = calculateNextDueDate(recurring.nextDueDate, recurring.frequency);
      await db.recurringInvoices.update(recurring.id, {
          nextDueDate: nextDate,
          lastGeneratedDate: today,
          totalGenerated: (recurring.totalGenerated || 0) + 1
      });

      alert(`Facture ${invoiceNumber} générée avec succès !`);
  };

  const toggleRecurringStatus = async (id: number | string, currentStatus: boolean) => {
      await db.recurringInvoices.update(id, { isActive: !currentStatus });
  };

  const handleDeleteRecurring = async (id: number | string) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer cet abonnement ?")) {
          await db.recurringInvoices.delete(id);
      }
  };

  const filteredExpenses = filterExpenseCategory === 'ALL'
      ? expenses
      : expenses.filter(e => e.category === filterExpenseCategory);

  const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
  }, {} as Record<string, number>);

  const renderExpenses = () => (
    <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <h3 className="font-bold text-slate-800 text-xl">Gestion des Charges & Dépenses</h3>
                <p className="text-sm text-slate-500">Suivez toutes vos dépenses professionnelles</p>
            </div>
            <button
                onClick={() => setIsAddingExpense(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-sm rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105 flex items-center"
            >
                <Plus size={18} className="mr-2" /> Nouvelle Dépense
            </button>
        </div>

        {/* Statistics Cards by Category */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(EXPENSE_CATEGORIES).map(([key, { label, icon }]) => (
                <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                     onClick={() => setFilterExpenseCategory(key)}>
                    <div className="flex flex-col items-center text-center">
                        <div className="text-3xl mb-2">{icon}</div>
                        <div className="text-xs text-slate-500 font-semibold uppercase mb-1">{label}</div>
                        <div className="text-lg font-black text-slate-800">{(expensesByCategory[key] || 0).toFixed(0)}€</div>
                    </div>
                </div>
            ))}
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
            <button
                onClick={() => setFilterExpenseCategory('ALL')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                    filterExpenseCategory === 'ALL'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
            >
                Toutes ({expenses.length})
            </button>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, { label, icon }]) => (
                <button
                    key={key}
                    onClick={() => setFilterExpenseCategory(key)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                        filterExpenseCategory === key
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                >
                    {icon} {label}
                </button>
            ))}
        </div>

        {/* Add Expense Form */}
        {isAddingExpense && (
            <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-6 shadow-lg animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-lg text-slate-800">Nouvelle Dépense</h4>
                    <button onClick={() => setIsAddingExpense(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date</label>
                        <input
                            type="date"
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                            value={expenseForm.date}
                            onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Catégorie</label>
                        <select
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                            value={expenseForm.category}
                            onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})}
                        >
                            {Object.entries(EXPENSE_CATEGORIES).map(([key, { label, icon }]) => (
                                <option key={key} value={key}>{icon} {label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Description *</label>
                        <input
                            type="text"
                            placeholder="Ex: Essence déplacement Paris"
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                            value={expenseForm.description}
                            onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Montant (€) *</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                            value={expenseForm.amount}
                            onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes</label>
                        <textarea
                            rows={2}
                            placeholder="Notes additionnelles..."
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none"
                            value={expenseForm.notes}
                            onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={() => setIsAddingExpense(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleAddExpense}
                        className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-bold shadow-lg transition-all duration-300 flex items-center"
                    >
                        <Plus size={18} className="mr-2" /> Ajouter la Dépense
                    </button>
                </div>
            </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100 text-slate-700">
                        <tr>
                            <th className="p-4 text-left font-black uppercase text-xs">Date</th>
                            <th className="p-4 text-left font-black uppercase text-xs">Catégorie</th>
                            <th className="p-4 text-left font-black uppercase text-xs">Description</th>
                            <th className="p-4 text-right font-black uppercase text-xs">Montant</th>
                            <th className="p-4 text-center font-black uppercase text-xs">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredExpenses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-400">
                                    Aucune dépense enregistrée. Cliquez sur "Nouvelle Dépense" pour commencer.
                                </td>
                            </tr>
                        ) : (
                            filteredExpenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-teal-50 transition-colors">
                                    <td className="p-4 text-slate-600 font-medium">
                                        {new Date(exp.date).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                                            {EXPENSE_CATEGORIES[exp.category]?.icon} {EXPENSE_CATEGORIES[exp.category]?.label}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{exp.description}</div>
                                        {exp.notes && <div className="text-xs text-slate-500 mt-1">{exp.notes}</div>}
                                    </td>
                                    <td className="p-4 text-right font-black text-lg text-slate-800">
                                        {exp.amount.toFixed(2)} €
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => exp.id && handleDeleteExpense(exp.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 rounded-2xl p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Total des Charges</p>
                    <p className="text-4xl font-black">{totalExpenses.toFixed(2)} €</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Marge Nette</p>
                    <p className={`text-3xl font-black ${(totalCA - totalExpenses) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {(totalCA - totalExpenses).toFixed(2)} €
                    </p>
                    <p className="text-xs opacity-70 mt-1">CA Encaissé - Charges</p>
                </div>
            </div>
        </div>
    </div>
  );

  // --- Recurring Invoices Render ---
  const recurringInvoices = useLiveQuery(() => db.recurringInvoices.toArray()) || [];

  const renderRecurringInvoices = () => (
    <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                    <Repeat size={24} className="text-teal-600" />
                    Facturation Récurrente
                </h3>
                <p className="text-sm text-slate-500">Gérez vos abonnements et factures automatiques</p>
            </div>
            <button
                onClick={() => setIsAddingRecurring(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-sm rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105 flex items-center"
            >
                <Plus size={18} className="mr-2" /> Nouvel Abonnement
            </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Abonnements Actifs</div>
                    <Repeat size={20} className="opacity-80" />
                </div>
                <div className="text-3xl font-black">{recurringInvoices.filter(r => r.isActive).length}</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Factures Générées</div>
                    <Calendar size={20} className="opacity-80" />
                </div>
                <div className="text-3xl font-black">
                    {recurringInvoices.reduce((sum, r) => sum + (r.totalGenerated || 0), 0)}
                </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold opacity-90 uppercase tracking-wide">CA Récurrent Mensuel</div>
                    <Euro size={20} className="opacity-80" />
                </div>
                <div className="text-3xl font-black">
                    {recurringInvoices
                        .filter(r => r.isActive && r.frequency === 'MONTHLY')
                        .reduce((sum, r) => sum + (r.amountHT * (1 + r.vatRate / 100)), 0)
                        .toFixed(0)} €
                </div>
            </div>
        </div>

        {/* Add Recurring Form */}
        {isAddingRecurring && (
            <div className="bg-white rounded-xl border-2 border-teal-200 p-6 shadow-lg animate-slideDown">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-lg text-slate-800">Nouvel Abonnement Récurrent</h4>
                    <button onClick={() => setIsAddingRecurring(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Patient / Client *</label>
                        <input
                            type="text"
                            value={recurringForm.patientName || ''}
                            onChange={(e) => setRecurringForm({...recurringForm, patientName: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Nom du patient"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Type d'Abonnement *</label>
                        <input
                            type="text"
                            value={recurringForm.subscriptionType || ''}
                            onChange={(e) => setRecurringForm({...recurringForm, subscriptionType: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Ex: Suivi mensuel, Abonnement hebdo..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fréquence *</label>
                        <select
                            value={recurringForm.frequency || 'MONTHLY'}
                            onChange={(e) => setRecurringForm({...recurringForm, frequency: e.target.value as any})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                            {Object.entries(FREQUENCIES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Montant HT (€) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={recurringForm.amountHT || ''}
                            onChange={(e) => setRecurringForm({...recurringForm, amountHT: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">TVA (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={recurringForm.vatRate || 0}
                            onChange={(e) => setRecurringForm({...recurringForm, vatRate: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Date de Début</label>
                        <input
                            type="date"
                            value={recurringForm.startDate || ''}
                            onChange={(e) => setRecurringForm({...recurringForm, startDate: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Date de Fin (optionnel)</label>
                        <input
                            type="date"
                            value={recurringForm.endDate || ''}
                            onChange={(e) => setRecurringForm({...recurringForm, endDate: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleAddRecurring}
                        className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        Créer l'Abonnement
                    </button>
                    <button
                        onClick={() => setIsAddingRecurring(false)}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        )}

        {/* Recurring Invoices List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100 text-slate-700">
                        <tr>
                            <th className="p-4 text-left font-black uppercase text-xs">Patient</th>
                            <th className="p-4 text-left font-black uppercase text-xs">Abonnement</th>
                            <th className="p-4 text-left font-black uppercase text-xs">Fréquence</th>
                            <th className="p-4 text-right font-black uppercase text-xs">Montant TTC</th>
                            <th className="p-4 text-left font-black uppercase text-xs">Prochaine Échéance</th>
                            <th className="p-4 text-center font-black uppercase text-xs">Générées</th>
                            <th className="p-4 text-center font-black uppercase text-xs">Statut</th>
                            <th className="p-4 text-center font-black uppercase text-xs">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {recurringInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center text-slate-400">
                                    Aucun abonnement récurrent. Cliquez sur "Nouvel Abonnement" pour commencer.
                                </td>
                            </tr>
                        ) : (
                            recurringInvoices.map(recurring => {
                                const amountTTC = recurring.amountHT * (1 + recurring.vatRate / 100);
                                const isUpcoming = new Date(recurring.nextDueDate) <= new Date();

                                return (
                                    <tr key={recurring.id} className={`hover:bg-teal-50 transition-colors ${!recurring.isActive ? 'opacity-50' : ''}`}>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{recurring.patientName}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-700 font-medium">{recurring.subscriptionType}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                                {FREQUENCIES[recurring.frequency]}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-black text-slate-800">
                                            {amountTTC.toFixed(2)} €
                                        </td>
                                        <td className="p-4">
                                            <div className={`font-semibold ${isUpcoming ? 'text-orange-600' : 'text-slate-600'}`}>
                                                {new Date(recurring.nextDueDate).toLocaleDateString('fr-FR')}
                                            </div>
                                            {isUpcoming && recurring.isActive && (
                                                <div className="text-xs text-orange-500 font-bold mt-1">⚠️ À générer</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                                                {recurring.totalGenerated || 0}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => recurring.id && toggleRecurringStatus(recurring.id, recurring.isActive)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                                    recurring.isActive
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {recurring.isActive ? '✓ Actif' : '✗ Inactif'}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => generateInvoiceFromRecurring(recurring)}
                                                    disabled={!recurring.isActive}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        recurring.isActive
                                                            ? 'text-teal-600 hover:bg-teal-50 hover:text-teal-700'
                                                            : 'text-slate-300 cursor-not-allowed'
                                                    }`}
                                                    title="Générer facture maintenant"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                                <button
                                                    onClick={() => recurring.id && handleDeleteRecurring(recurring.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  const renderOverview = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CA Encaissé - Zoho Style */}
          <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 cursor-pointer backdrop-blur-xl border border-white/20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 opacity-20 group-hover:opacity-30 transition-opacity duration-500 group-hover:rotate-12">
                  <TrendingUp size={128} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold opacity-90 uppercase tracking-wider">CA Encaissé</p>
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Euro size={20} className="opacity-90" />
                      </div>
                  </div>
                  <h3 className="text-4xl font-black mb-2 tracking-tight">{totalCA.toFixed(2)} €</h3>
                  <p className="text-sm font-semibold opacity-80">Revenus encaissés</p>
              </div>
          </div>

          {/* Reste à percevoir - Zoho Style */}
          <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 cursor-pointer backdrop-blur-xl border border-white/20 bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 opacity-20 group-hover:opacity-30 transition-opacity duration-500 group-hover:rotate-12">
                  <AlertTriangle size={128} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold opacity-90 uppercase tracking-wider">Reste à percevoir</p>
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Bell size={20} className="opacity-90" />
                      </div>
                  </div>
                  <h3 className="text-4xl font-black mb-2 tracking-tight">{pendingCA.toFixed(2)} €</h3>
                  <p className="text-sm font-semibold opacity-80">Impayés en attente</p>
              </div>
          </div>

          {/* Charges - Zoho Style */}
          <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 cursor-pointer backdrop-blur-xl border border-white/20 bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 opacity-20 group-hover:opacity-30 transition-opacity duration-500 group-hover:rotate-12">
                  <TrendingDown size={128} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold opacity-90 uppercase tracking-wider">Charges</p>
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                          <CreditCard size={20} className="opacity-90" />
                      </div>
                  </div>
                  <h3 className="text-4xl font-black mb-2 tracking-tight">{totalExpenses.toFixed(2)} €</h3>
                  <p className="text-sm font-semibold opacity-80">Dépenses totales</p>
              </div>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">Finance & Compta</h2>
         <div className="flex bg-white rounded-xl p-1.5 shadow-lg border border-slate-200 overflow-x-auto">
            <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === 'overview' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-50'}`}>Vue d'ensemble</button>
            <button onClick={() => setActiveTab('invoices')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === 'invoices' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-50'}`}>Factures</button>
            <button onClick={() => setActiveTab('recurring')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === 'recurring' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-50'}`}>Abonnements</button>
            <button onClick={() => setActiveTab('expenses')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === 'expenses' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-50'}`}>Charges</button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto">
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'invoices' && renderInvoices()}
         {activeTab === 'recurring' && renderRecurringInvoices()}
         {activeTab === 'expenses' && renderExpenses()}
      </div>

      {isConfigOpen && renderConfigModal()}
      {renderInvoiceDetailModal()}
      {isPaymentModalOpen && renderPaymentModal()}

      {showDriveModal && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                <h3 className="font-bold text-lg mb-4">Sauvegarder Facture Drive</h3>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {driveFolders.map(f => (
                        <button key={f.id} onClick={() => setSelectedFolder(f.id)} className={`w-full text-left p-2 rounded text-sm ${selectedFolder === f.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}>
                            <HardDrive size={14} className="mr-2 inline"/> {f.name}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowDriveModal(false)} className="px-3 py-1.5 text-slate-500 text-sm">Annuler</button>
                    <button onClick={confirmExportToDrive} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Sauvegarder</button>
                </div>
            </div>
        </div>
      )}

      {/* Mail Modal */}
      {showMailModal && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center"><Send size={20} className="mr-2 text-blue-600"/> Envoyer Facture par Email</h3>
                    <button onClick={() => setShowMailModal(false)}><X size={20} className="text-slate-400"/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destinataire</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            value={mailForm.to}
                            onChange={e => setMailForm({...mailForm, to: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objet</label>
                        <input
                            type="text"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            value={mailForm.subject}
                            onChange={e => setMailForm({...mailForm, subject: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                        <textarea
                            rows={6}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            value={mailForm.message}
                            onChange={e => setMailForm({...mailForm, message: e.target.value})}
                        />
                    </div>
                    <button onClick={confirmSendInvoiceMail} disabled={!mailForm.to} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 hover:bg-blue-700">
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;