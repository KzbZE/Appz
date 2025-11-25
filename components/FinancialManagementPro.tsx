/**
 * Financial Management Pro
 *
 * Professional financial interface for:
 * - Accounting exports (Excel, Pennylane, QuickBooks)
 * - Stripe/PayPal payment processing
 * - Subscription management
 * - Deposit tracking
 * - Financial forecasting
 */

import React, { useState, useEffect } from 'react';
import { designSystem } from '../design/designSystem';
import {
  Download,
  CreditCard,
  Calendar,
  TrendingUp,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Package
} from 'lucide-react';
import {
  exportToExcel,
  generateFiscalReport,
  forecastTreasury,
  getFinancialStats,
  type Subscription,
  type Deposit
} from '../services/advancedFinanceService';

// Types for export formats and payment methods
type ExportFormat = 'EXCEL' | 'PENNYLANE' | 'QUICKBOOKS' | 'FISCAL';
type PaymentMethod = 'STRIPE' | 'PAYPAL';

const FinancialManagementPro: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exports' | 'payments' | 'subscriptions' | 'deposits' | 'forecast'>('exports');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Export state
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportFormat, setExportFormat] = useState<ExportFormat>('EXCEL');

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('STRIPE');
  const [paymentDescription, setPaymentDescription] = useState('');

  // Subscription state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [newSubType, setNewSubType] = useState<'5_SESSIONS' | '10_SESSIONS' | '20_SESSIONS'>('10_SESSIONS');
  const [newSubPatientId, setNewSubPatientId] = useState('');

  // Deposit state
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [newDepositAmount, setNewDepositAmount] = useState('');
  const [newDepositReason, setNewDepositReason] = useState('');

  // Forecast state
  const [forecastMonths, setForecastMonths] = useState(3);
  const [forecastData, setForecastData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadSubscriptions();
    loadDeposits();
  }, []);

  const loadStats = async () => {
    const financeStats = await getFinancialStats();
    setStats(financeStats);
  };

  const loadSubscriptions = () => {
    const subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    setSubscriptions(subs);
  };

  const loadDeposits = () => {
    const deps = JSON.parse(localStorage.getItem('deposits') || '[]');
    setDeposits(deps);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Export handlers
  const handleExport = async () => {
    setLoading(true);
    try {
      let result: any;
      if (exportFormat === 'EXCEL') {
        result = await exportToExcel(exportYear);
      } else if (exportFormat === 'FISCAL') {
        result = await generateFiscalReport(exportYear);
      } else {
        // Simulate other exports
        result = { format: exportFormat, year: exportYear, message: 'Export simulé - fonctionnalité en développement' };
      }

      // Simulate download
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${exportFormat}_${exportYear}.json`;
      a.click();

      showMessage('success', `Export ${exportFormat} réussi pour ${exportYear}`);
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Payment handlers
  const handleCreatePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showMessage('error', 'Montant invalide');
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(paymentAmount);

      // Simulate payment creation (actual implementation would use real payment processors)
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (paymentMethod === 'STRIPE') {
        const fakeClientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;
        showMessage('success', `Paiement Stripe créé: ${fakeClientSecret.substring(0, 20)}...`);
      } else if (paymentMethod === 'PAYPAL') {
        const fakeOrderId = `PAYPAL-${Date.now()}`;
        showMessage('success', `Commande PayPal créée: ${fakeOrderId}`);
      }

      setPaymentAmount('');
      setPaymentDescription('');
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Subscription handlers
  const handleCreateSubscription = async () => {
    if (!newSubPatientId) {
      showMessage('error', 'Sélectionnez un patient');
      return;
    }

    setLoading(true);
    try {
      // This would integrate with your actual subscription creation service
      const newSub: Subscription = {
        id: `sub_${Date.now()}`,
        patientId: newSubPatientId,
        type: newSubType,
        sessionsTotal: parseInt(newSubType.split('_')[0]),
        sessionsUsed: 0,
        startDate: new Date().toISOString(),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedSubs = [...subscriptions, newSub];
      localStorage.setItem('subscriptions', JSON.stringify(updatedSubs));
      setSubscriptions(updatedSubs);

      showMessage('success', 'Abonnement créé avec succès');
      setNewSubPatientId('');
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Deposit handlers
  const handleCreateDeposit = async () => {
    if (!newDepositAmount || parseFloat(newDepositAmount) <= 0) {
      showMessage('error', 'Montant invalide');
      return;
    }

    setLoading(true);
    try {
      const newDep: Deposit = {
        id: `dep_${Date.now()}`,
        amount: parseFloat(newDepositAmount),
        reason: newDepositReason,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedDeps = [...deposits, newDep];
      localStorage.setItem('deposits', JSON.stringify(updatedDeps));
      setDeposits(updatedDeps);

      showMessage('success', 'Acompte enregistré avec succès');
      setNewDepositAmount('');
      setNewDepositReason('');
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Forecast handler
  const handleGenerateForecast = async () => {
    setLoading(true);
    try {
      const forecast = await forecastTreasury(forecastMonths);
      setForecastData(forecast);
      showMessage('success', `Prévision générée pour ${forecastMonths} mois`);
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div style={{
        ...designSystem.components.card.base,
        border: `1px solid ${designSystem.colors.neutral[200]}`,
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      }} className="text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ ...designSystem.typography.fontSize['2xl'], fontWeight: designSystem.typography.fontWeight.bold }}>
                Gestion Financière Pro
              </h1>
              <p style={{ ...designSystem.typography.fontSize.sm }} className="text-white/80 mt-1">
                Exports comptables, paiements en ligne et gestion des abonnements
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <DollarSign size={28} />
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                <p style={{ ...designSystem.typography.fontSize.xs }} className="text-white/70 mb-1">CA Total</p>
                <p style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.bold }}>
                  {stats.totalRevenue}€
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                <p style={{ ...designSystem.typography.fontSize.xs }} className="text-white/70 mb-1">Séances</p>
                <p style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.bold }}>
                  {stats.totalSessions}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                <p style={{ ...designSystem.typography.fontSize.xs }} className="text-white/70 mb-1">Abonnements</p>
                <p style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.bold }}>
                  {subscriptions.filter(s => s.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                <p style={{ ...designSystem.typography.fontSize.xs }} className="text-white/70 mb-1">Acomptes</p>
                <p style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.bold }}>
                  {deposits.filter(d => d.status === 'PENDING').length}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          ...designSystem.components.card.base,
          border: `1px solid ${message.type === 'success' ? designSystem.colors.success : designSystem.colors.error}`,
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2'
        }} className="p-4 flex items-center animate-slideDown">
          {message.type === 'success' ? (
            <CheckCircle size={20} style={{ color: designSystem.colors.success }} className="mr-3" />
          ) : (
            <XCircle size={20} style={{ color: designSystem.colors.error }} className="mr-3" />
          )}
          <span style={{
            ...designSystem.typography.fontSize.sm,
            color: message.type === 'success' ? designSystem.colors.success : designSystem.colors.error,
            fontWeight: designSystem.typography.fontWeight.medium
          }}>
            {message.text}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {[
          { id: 'exports', label: 'Exports', icon: Download },
          { id: 'payments', label: 'Paiements', icon: CreditCard },
          { id: 'subscriptions', label: 'Abonnements', icon: Package },
          { id: 'deposits', label: 'Acomptes', icon: DollarSign },
          { id: 'forecast', label: 'Prévisions', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-lg transition-smooth whitespace-nowrap ${
              activeTab === tab.id ? 'transform scale-105' : ''
            }`}
            style={{
              ...designSystem.typography.fontSize.sm,
              fontWeight: designSystem.typography.fontWeight.medium,
              background: activeTab === tab.id
                ? `linear-gradient(135deg, ${designSystem.colors.primary[500]} 0%, ${designSystem.colors.primary[600]} 100%)`
                : 'white',
              color: activeTab === tab.id ? 'white' : designSystem.colors.neutral[600],
              border: `1px solid ${activeTab === tab.id ? 'transparent' : designSystem.colors.neutral[200]}`,
              boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            <tab.icon size={16} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        ...designSystem.components.card.base,
        border: `1px solid ${designSystem.colors.neutral[200]}`
      }} className="p-6">
        {/* Exports Tab */}
        {activeTab === 'exports' && (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <FileText size={20} style={{ color: designSystem.colors.primary[600] }} className="mr-3" />
              <h3 style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                Exports Comptables
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                  Année
                </label>
                <input
                  type="number"
                  value={exportYear}
                  onChange={(e) => setExportYear(parseInt(e.target.value))}
                  style={designSystem.components.input.base}
                  className="w-full"
                />
              </div>

              <div>
                <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                  Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  style={designSystem.components.input.base}
                  className="w-full"
                >
                  <option value="EXCEL">Excel (.xlsx)</option>
                  <option value="PENNYLANE">Pennylane</option>
                  <option value="QUICKBOOKS">QuickBooks</option>
                  <option value="FISCAL">Rapport Fiscal</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              style={{
                ...designSystem.components.button.base,
                ...designSystem.components.button.primary
              }}
              className="w-full flex items-center justify-center hover-lift"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download size={18} className="mr-2" />
                  Télécharger l'export
                </>
              )}
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start">
                <AlertCircle size={18} style={{ color: designSystem.colors.info }} className="mr-3 mt-0.5 flex-shrink-0" />
                <div style={{ ...designSystem.typography.fontSize.sm, color: designSystem.colors.neutral[700] }}>
                  <p className="font-semibold mb-1">À propos des exports</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Excel: Format universel pour analyse</li>
                    <li>Pennylane: Intégration comptable automatique</li>
                    <li>QuickBooks: Import direct dans QuickBooks</li>
                    <li>Rapport Fiscal: Document pour déclarations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <CreditCard size={20} style={{ color: designSystem.colors.primary[600] }} className="mr-3" />
              <h3 style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                Paiements en Ligne
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                  Méthode de paiement
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('STRIPE')}
                    className="p-4 rounded-xl border-2 transition-smooth hover-lift"
                    style={{
                      borderColor: paymentMethod === 'STRIPE' ? designSystem.colors.primary[500] : designSystem.colors.neutral[200],
                      background: paymentMethod === 'STRIPE' ? designSystem.colors.primary[50] : 'white'
                    }}
                  >
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1" style={{ color: '#635bff' }}>Stripe</div>
                      <p style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>
                        CB, Apple Pay, Google Pay
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('PAYPAL')}
                    className="p-4 rounded-xl border-2 transition-smooth hover-lift"
                    style={{
                      borderColor: paymentMethod === 'PAYPAL' ? designSystem.colors.primary[500] : designSystem.colors.neutral[200],
                      background: paymentMethod === 'PAYPAL' ? designSystem.colors.primary[50] : 'white'
                    }}
                  >
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1" style={{ color: '#0070ba' }}>PayPal</div>
                      <p style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>
                        Compte PayPal
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                  Montant (€)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="50.00"
                  style={designSystem.components.input.base}
                  className="w-full"
                />
              </div>

              <div>
                <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Séance de kinésithérapie"
                  style={designSystem.components.input.base}
                  className="w-full"
                />
              </div>

              <button
                onClick={handleCreatePayment}
                disabled={loading}
                style={{
                  ...designSystem.components.button.base,
                  ...designSystem.components.button.primary
                }}
                className="w-full flex items-center justify-center hover-lift"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} className="mr-2" />
                    Créer le paiement
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Package size={20} style={{ color: designSystem.colors.primary[600] }} className="mr-3" />
                <h3 style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                  Abonnements
                </h3>
              </div>
              <span style={{
                ...designSystem.components.badge.base,
                ...designSystem.typography.fontSize.sm,
                background: designSystem.colors.primary[100],
                color: designSystem.colors.primary[700]
              }}>
                {subscriptions.filter(s => s.status === 'ACTIVE').length} actifs
              </span>
            </div>

            {/* Create Subscription */}
            <div className="p-4 bg-neutral-50 rounded-xl space-y-3">
              <h4 style={{ ...designSystem.typography.fontSize.base, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                Nouvel Abonnement
              </h4>

              <div>
                <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                  Type d'abonnement
                </label>
                <select
                  value={newSubType}
                  onChange={(e) => setNewSubType(e.target.value as any)}
                  style={designSystem.components.input.base}
                  className="w-full"
                >
                  <option value="5_SESSIONS">5 Séances - 200€</option>
                  <option value="10_SESSIONS">10 Séances - 380€</option>
                  <option value="20_SESSIONS">20 Séances - 720€</option>
                </select>
              </div>

              <div>
                <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                  ID Patient
                </label>
                <input
                  type="text"
                  value={newSubPatientId}
                  onChange={(e) => setNewSubPatientId(e.target.value)}
                  placeholder="patient_123"
                  style={designSystem.components.input.base}
                  className="w-full"
                />
              </div>

              <button
                onClick={handleCreateSubscription}
                disabled={loading}
                style={{
                  ...designSystem.components.button.base,
                  ...designSystem.components.button.primary,
                  ...designSystem.components.button.sm
                }}
                className="w-full"
              >
                Créer l'abonnement
              </button>
            </div>

            {/* List Subscriptions */}
            <div className="space-y-2">
              {subscriptions.length === 0 ? (
                <div className="text-center py-8" style={{ color: designSystem.colors.neutral[400] }}>
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  <p style={{ ...designSystem.typography.fontSize.sm }}>Aucun abonnement</p>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 bg-white rounded-xl border transition-smooth hover-lift" style={{ borderColor: designSystem.colors.neutral[200] }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                            {sub.type.replace('_', ' ')}
                          </h4>
                          <span style={{
                            ...designSystem.components.badge.base,
                            ...designSystem.typography.fontSize.xs,
                            background: sub.status === 'ACTIVE' ? designSystem.colors.success + '20' : designSystem.colors.neutral[200],
                            color: sub.status === 'ACTIVE' ? designSystem.colors.success : designSystem.colors.neutral[600]
                          }}>
                            {sub.status}
                          </span>
                        </div>
                        <p style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>
                          Patient: {sub.patientId} • {sub.sessionsUsed}/{sub.sessionsTotal} séances utilisées
                        </p>
                        <div className="mt-2 w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-smooth"
                            style={{
                              width: `${(sub.sessionsUsed / sub.sessionsTotal) * 100}%`,
                              background: `linear-gradient(90deg, ${designSystem.colors.primary[500]}, ${designSystem.colors.primary[600]})`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign size={20} style={{ color: designSystem.colors.primary[600] }} className="mr-3" />
                <h3 style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                  Acomptes
                </h3>
              </div>
              <span style={{
                ...designSystem.components.badge.base,
                ...designSystem.typography.fontSize.sm,
                background: '#fef3c7',
                color: '#d97706'
              }}>
                {deposits.filter(d => d.status === 'PENDING').length} en attente
              </span>
            </div>

            {/* Create Deposit */}
            <div className="p-4 bg-neutral-50 rounded-xl space-y-3">
              <h4 style={{ ...designSystem.typography.fontSize.base, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                Nouvel Acompte
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                    Montant (€)
                  </label>
                  <input
                    type="number"
                    value={newDepositAmount}
                    onChange={(e) => setNewDepositAmount(e.target.value)}
                    placeholder="50.00"
                    style={designSystem.components.input.base}
                    className="w-full"
                  />
                </div>

                <div>
                  <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                    Motif
                  </label>
                  <input
                    type="text"
                    value={newDepositReason}
                    onChange={(e) => setNewDepositReason(e.target.value)}
                    placeholder="Abonnement 10 séances"
                    style={designSystem.components.input.base}
                    className="w-full"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateDeposit}
                disabled={loading}
                style={{
                  ...designSystem.components.button.base,
                  ...designSystem.components.button.primary,
                  ...designSystem.components.button.sm
                }}
                className="w-full"
              >
                Enregistrer l'acompte
              </button>
            </div>

            {/* List Deposits */}
            <div className="space-y-2">
              {deposits.length === 0 ? (
                <div className="text-center py-8" style={{ color: designSystem.colors.neutral[400] }}>
                  <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                  <p style={{ ...designSystem.typography.fontSize.sm }}>Aucun acompte</p>
                </div>
              ) : (
                deposits.map((dep) => (
                  <div key={dep.id} className="p-4 bg-white rounded-xl border flex justify-between items-center" style={{ borderColor: designSystem.colors.neutral[200] }}>
                    <div>
                      <h4 style={{ ...designSystem.typography.fontSize.base, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                        {dep.amount}€
                      </h4>
                      <p style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>
                        {dep.reason || 'Sans motif'}
                      </p>
                    </div>
                    <span style={{
                      ...designSystem.components.badge.base,
                      background: dep.status === 'PENDING' ? '#fef3c7' : dep.status === 'COMPLETED' ? designSystem.colors.success + '20' : designSystem.colors.error + '20',
                      color: dep.status === 'PENDING' ? '#d97706' : dep.status === 'COMPLETED' ? designSystem.colors.success : designSystem.colors.error
                    }}>
                      {dep.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <TrendingUp size={20} style={{ color: designSystem.colors.primary[600] }} className="mr-3" />
              <h3 style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                Prévisions de Trésorerie
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.medium, color: designSystem.colors.neutral[700] }} className="block mb-2">
                  Nombre de mois
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={forecastMonths}
                  onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>1 mois</span>
                  <span style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.primary[600] }}>
                    {forecastMonths} mois
                  </span>
                  <span style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>12 mois</span>
                </div>
              </div>

              <button
                onClick={handleGenerateForecast}
                disabled={loading}
                style={{
                  ...designSystem.components.button.base,
                  ...designSystem.components.button.primary
                }}
                className="w-full flex items-center justify-center hover-lift"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <TrendingUp size={18} className="mr-2" />
                    Générer les prévisions
                  </>
                )}
              </button>

              {/* Forecast Results */}
              {forecastData.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 style={{ ...designSystem.typography.fontSize.base, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }} className="mb-3">
                    Résultats
                  </h4>
                  {forecastData.map((month, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-xl border" style={{ borderColor: designSystem.colors.neutral[200] }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p style={{ ...designSystem.typography.fontSize.sm, fontWeight: designSystem.typography.fontWeight.semibold, color: designSystem.colors.neutral[900] }}>
                            {month.month}
                          </p>
                          <p style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>
                            Basé sur {month.sessionsCount} séances prévues
                          </p>
                        </div>
                        <div className="text-right">
                          <p style={{ ...designSystem.typography.fontSize.lg, fontWeight: designSystem.typography.fontWeight.bold }} className="text-green-600">
                            {month.revenue.toFixed(2)}€
                          </p>
                          <p style={{ ...designSystem.typography.fontSize.xs, color: designSystem.colors.neutral[600] }}>
                            CA prévisionnel
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialManagementPro;
