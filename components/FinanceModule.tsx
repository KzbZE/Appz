import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus, Expense, PaymentRecord } from '../types';
import { Download, TrendingUp, TrendingDown, Euro, Bell, CreditCard, AlertTriangle, Send, Check, Settings as SettingsIcon, X, HardDrive, Eye, Edit2, Plus, Trash2, Calendar } from 'lucide-react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { jsPDF } from 'jspdf';
import { checkAuth, listDriveFolders, uploadToDriveReal } from '../services/googleApiService';

interface FinanceModuleProps {
  invoices: Invoice[];
  expenses: Expense[];
}

const FinanceModule: React.FC<FinanceModuleProps> = ({ invoices: initialInvoices, expenses }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'expenses'>('overview');
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

  const PAYMENT_METHODS: Record<string, string> = {
      'CASH': 'Espèces',
      'CHECK': 'Chèque',
      'TRANSFER': 'Virement',
      'CARD': 'Carte Bancaire'
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
                  <button onClick={handleSaveConfig} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg">Enregistrer</button>
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
                            <button onClick={handleSaveEditedInvoice} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg">
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
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleDownloadPDF(selectedInvoice)} className="flex items-center justify-center py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-gray-100">
                                    <Download size={16} className="mr-2" /> PDF
                                </button>
                                <button onClick={() => handleExportToDrive(selectedInvoice)} className="flex items-center justify-center py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-gray-100">
                                    <HardDrive size={16} className="mr-2" /> Drive
                                </button>
                            </div>
                            
                            {!isPaid && (
                                <div className="flex justify-center mt-2">
                                    <button onClick={() => setIsEditingInvoice(true)} className="text-xs text-slate-400 flex items-center hover:text-primary-600 hover:underline">
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
                <button onClick={async () => { await db.invoices.add({ number: `F${Date.now()}`, date: new Date().toISOString(), dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), patientName: 'Nouveau Client', amountHT: 0, vatRate: 0, amountTTC: 0, amountPaid: 0, status: InvoiceStatus.DRAFT, items: [], payments: [] }); }} className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg font-medium">+ Créer Facture</button>
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
                                    <td className="p-4"><div className="w-full bg-gray-200 rounded-full h-2.5 mb-1"><div className="h-2.5 rounded-full bg-primary-500" style={{width: `${percentPaid}%`}}></div></div></td>
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

  const renderOverview = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-slate-500 text-sm">CA Encaissé</h3>
              <p className="text-3xl font-bold">{totalCA.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-slate-500 text-sm">Reste à percevoir</h3>
              <p className="text-3xl font-bold text-orange-600">{pendingCA.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-slate-500 text-sm">Charges</h3>
              <p className="text-3xl font-bold text-red-600">{totalExpenses.toFixed(2)} €</p>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">Finance & Compta</h2>
         <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-1.5 text-sm rounded-md ${activeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Vue d'ensemble</button>
            <button onClick={() => setActiveTab('invoices')} className={`px-4 py-1.5 text-sm rounded-md ${activeTab === 'invoices' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Factures</button>
            <button onClick={() => setActiveTab('expenses')} className={`px-4 py-1.5 text-sm rounded-md ${activeTab === 'expenses' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Charges</button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto">
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'invoices' && renderInvoices()}
         {activeTab === 'expenses' && <div className="p-12 text-center text-slate-400">Module Notes de Frais en développement.</div>}
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
    </div>
  );
};

export default FinanceModule;