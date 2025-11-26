import React, { useState } from 'react';
import { CreditCard, Send, DollarSign, Package, Calendar, CheckCircle, XCircle, Link as LinkIcon, Copy, ExternalLink, Users } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import stripeIntegrationService, { StripePaymentLink, StripeSubscription } from '../services/stripeIntegrationService';
import { Invoice } from '../types';

const StripePaymentsModule: React.FC = () => {
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toArray())?.[0];

  const [activeTab, setActiveTab] = useState<'invoices' | 'subscriptions' | 'settings'>('invoices');
  const [paymentLinks, setPaymentLinks] = useState<StripePaymentLink[]>([]);
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [creatingLink, setCreatingLink] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [linkOptions, setLinkOptions] = useState({
    type: 'full' as 'full' | 'deposit',
    depositPercentage: 30
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    patientId: '',
    plan: 'pack_5' as 'pack_5' | 'pack_10' | 'monthly_unlimited'
  });

  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: '',
    enabled: false
  });

  const unpaidInvoices = invoices.filter(inv => inv.status === 'UNPAID' || inv.status === 'PARTIAL');

  const handleCreatePaymentLink = async (invoice: Invoice) => {
    setCreatingLink(true);
    setSelectedInvoice(invoice);

    try {
      // Check if Stripe is configured
      if (!stripeConfig.enabled || !stripeConfig.publishableKey) {
        alert('⚠️ Stripe n\'est pas configuré. Veuillez configurer vos clés API dans l\'onglet Paramètres.');
        return;
      }

      await stripeIntegrationService.initialize(stripeConfig.publishableKey);

      const link = await stripeIntegrationService.createPaymentLink(invoice, linkOptions);

      setPaymentLinks([...paymentLinks, link]);
      alert(`✅ Lien de paiement créé!\n\nURL: ${link.url}\n\nCe lien a été copié dans le presse-papier.`);

      // Copy to clipboard
      navigator.clipboard.writeText(link.url);
    } catch (error) {
      console.error('Erreur lors de la création du lien:', error);
      alert('❌ Erreur lors de la création du lien de paiement. Vérifiez votre configuration Stripe.');
    } finally {
      setCreatingLink(false);
      setSelectedInvoice(null);
    }
  };

  const handleCreateSubscription = async () => {
    const patient = patients.find(p => p.id === Number(subscriptionForm.patientId));
    if (!patient) {
      alert('Veuillez sélectionner un patient');
      return;
    }

    if (!patient.email) {
      alert('Ce patient n\'a pas d\'adresse email. Veuillez l\'ajouter d\'abord.');
      return;
    }

    try {
      if (!stripeConfig.enabled || !stripeConfig.publishableKey) {
        alert('⚠️ Stripe n\'est pas configuré.');
        return;
      }

      await stripeIntegrationService.initialize(stripeConfig.publishableKey);

      const subscription = await stripeIntegrationService.createSubscription(
        patient.email,
        patient.name,
        patient.id as number,
        subscriptionForm.plan
      );

      setSubscriptions([...subscriptions, subscription]);
      alert(`✅ Abonnement créé pour ${patient.name}!`);

      setSubscriptionForm({ patientId: '', plan: 'pack_5' });
    } catch (error) {
      console.error('Erreur lors de la création de l\'abonnement:', error);
      alert('❌ Erreur lors de la création de l\'abonnement.');
    }
  };

  const planDetails = {
    pack_5: { name: 'Pack 5 séances', price: '250€', sessions: 5 },
    pack_10: { name: 'Pack 10 séances', price: '450€', sessions: 10 },
    monthly_unlimited: { name: 'Abonnement mensuel illimité', price: '400€/mois', sessions: '∞' }
  };

  const getPaymentLinkForInvoice = (invoiceId: number) => {
    return paymentLinks.find(link => link.invoiceId === invoiceId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">💳 Paiements en Ligne (Stripe)</h1>
            <p className="text-blue-100">Liens de paiement, acomptes et abonnements</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black">{paymentLinks.length}</div>
            <div className="text-sm text-blue-100">Liens créés</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Factures impayées</p>
              <p className="text-3xl font-black text-red-600">{unpaidInvoices.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <DollarSign className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Abonnements actifs</p>
              <p className="text-3xl font-black text-green-600">
                {subscriptions.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Package className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Liens actifs</p>
              <p className="text-3xl font-black text-blue-600">{paymentLinks.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <LinkIcon className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="inline mr-2" size={18} />
          Factures à payer
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${
            activeTab === 'subscriptions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="inline mr-2" size={18} />
          Abonnements
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="inline mr-2" size={18} />
          Configuration Stripe
        </button>
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {unpaidInvoices.length === 0 ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-12 text-center">
              <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
              <h3 className="text-xl font-bold text-green-700 mb-2">Toutes les factures sont payées!</h3>
              <p className="text-green-600">Aucune facture en attente de paiement</p>
            </div>
          ) : (
            unpaidInvoices.map((invoice) => {
              const existingLink = getPaymentLinkForInvoice(invoice.id as number);

              return (
                <div key={invoice.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <CreditCard className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">
                          Facture {invoice.number} - {invoice.patientName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(invoice.date).toLocaleDateString()} • Montant: {invoice.amountTTC}€
                        </p>
                        {invoice.status === 'PARTIAL' && (
                          <p className="text-sm text-orange-600 font-bold mt-1">
                            Partiellement payé: {invoice.amountPaid}€ / {invoice.amountTTC}€
                          </p>
                        )}
                      </div>
                    </div>

                    {existingLink ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(existingLink.url);
                            alert('✅ Lien copié dans le presse-papier!');
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all"
                        >
                          <Copy className="inline mr-2" size={16} />
                          Copier le lien
                        </button>
                        <a
                          href={existingLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-all"
                        >
                          <ExternalLink className="inline mr-2" size={16} />
                          Ouvrir
                        </a>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setLinkOptions({ type: 'deposit', depositPercentage: 30 });
                            handleCreatePaymentLink(invoice);
                          }}
                          disabled={creatingLink}
                          className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-bold hover:bg-orange-200 transition-all disabled:opacity-50"
                        >
                          <Send className="inline mr-2" size={16} />
                          Acompte 30%
                        </button>
                        <button
                          onClick={() => {
                            setLinkOptions({ type: 'full', depositPercentage: 30 });
                            handleCreatePaymentLink(invoice);
                          }}
                          disabled={creatingLink}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        >
                          <Send className="inline mr-2" size={16} />
                          Paiement complet
                        </button>
                      </div>
                    )}
                  </div>

                  {existingLink && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        <LinkIcon className="inline mr-2" size={14} />
                        <strong>Lien actif:</strong> {existingLink.url.substring(0, 60)}...
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Expire le: {new Date(existingLink.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Create Subscription */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📦 Créer un nouvel abonnement
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Patient</label>
                <select
                  value={subscriptionForm.patientId}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, patientId: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Sélectionner un patient --</option>
                  {patients
                    .filter(p => p.email) // Seulement les patients avec email
                    .map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} - {patient.email}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Formule</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(planDetails).map(([key, details]) => (
                    <button
                      key={key}
                      onClick={() => setSubscriptionForm({ ...subscriptionForm, plan: key as any })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        subscriptionForm.plan === key
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">📦</div>
                        <div className="font-bold text-gray-800">{details.name}</div>
                        <div className="text-2xl font-black text-blue-600 my-2">{details.price}</div>
                        <div className="text-sm text-gray-600">{details.sessions} séances</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateSubscription}
                disabled={!subscriptionForm.patientId}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Package className="inline mr-2" size={20} />
                Créer l'abonnement
              </button>
            </div>
          </div>

          {/* Active Subscriptions */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Abonnements actifs</h3>
            {subscriptions.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <Package className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-xl font-bold text-gray-600 mb-2">Aucun abonnement</h3>
                <p className="text-gray-500">Créez votre premier abonnement ci-dessus</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          sub.status === 'active' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {sub.status === 'active' ? (
                            <CheckCircle className="text-green-600" size={24} />
                          ) : (
                            <XCircle className="text-red-600" size={24} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">
                            {planDetails[sub.plan].name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Patient ID: {sub.patientId} • {sub.sessionsRemaining !== -1 && `${sub.sessionsRemaining} séances restantes`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            <Calendar className="inline" size={12} /> Renouv: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full font-bold text-sm ${
                        sub.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {sub.status === 'active' ? '✅ Actif' : '❌ Inactif'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <h3 className="font-bold text-yellow-900 mb-2">⚠️ Configuration Stripe requise</h3>
            <p className="text-sm text-yellow-700 mb-2">
              Pour utiliser les paiements en ligne, vous devez créer un compte Stripe et obtenir vos clés API.
            </p>
            <a
              href="https://dashboard.stripe.com/register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline hover:text-blue-800"
            >
              → Créer un compte Stripe
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🔑 Clés API Stripe</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Publishable Key (clé publique)
                </label>
                <input
                  type="text"
                  value={stripeConfig.publishableKey}
                  onChange={(e) => setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })}
                  placeholder="pk_test_..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Trouvez votre clé publique dans le{' '}
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Dashboard Stripe
                  </a>
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="stripe-enabled"
                  checked={stripeConfig.enabled}
                  onChange={(e) => setStripeConfig({ ...stripeConfig, enabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="stripe-enabled" className="text-sm font-bold text-gray-700">
                  Activer les paiements Stripe
                </label>
              </div>

              {stripeConfig.enabled && stripeConfig.publishableKey && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-700">
                    ✅ Stripe est configuré et prêt à être utilisé!
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Configuration Netlify Functions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Les fonctions serverless suivantes doivent être déployées sur Netlify pour gérer les paiements:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ <code className="bg-gray-100 px-2 py-1 rounded">/.netlify/functions/create-payment-link</code></li>
              <li>✅ <code className="bg-gray-100 px-2 py-1 rounded">/.netlify/functions/create-subscription</code></li>
              <li>✅ <code className="bg-gray-100 px-2 py-1 rounded">/.netlify/functions/cancel-subscription</code></li>
              <li>✅ <code className="bg-gray-100 px-2 py-1 rounded">/.netlify/functions/check-payment</code></li>
              <li>✅ <code className="bg-gray-100 px-2 py-1 rounded">/.netlify/functions/stripe-webhook</code></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default StripePaymentsModule;
