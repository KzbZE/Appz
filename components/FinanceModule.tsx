import React from 'react';
import { Euro, AlertTriangle } from 'lucide-react';
import { Invoice, Expense, RecurringInvoice } from '../types';

interface FinanceModuleProps {
  invoices: Invoice[];
  expenses: Expense[];
  onInvoiceUpdate: () => void;
}

/**
 * TODO: Module Finances à migrer vers Supabase
 * Module le plus complexe (1440 lignes)
 * Nécessite de nombreuses méthodes dans dataService:
 * - Gestion complète des factures
 * - Gestion des factures récurrentes
 * - Gestion des dépenses
 * - Génération PDF
 * - Upload Google Drive
 * - Statistiques financières
 */
const FinanceModule: React.FC<FinanceModuleProps> = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <Euro size={24} className="text-emerald-600" />
            Module Finances
          </h3>
          <p className="text-sm text-slate-500">Facturation, dépenses et trésorerie</p>
        </div>
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-8 text-center">
        <AlertTriangle size={48} className="text-orange-600 mx-auto mb-4" />
        <h4 className="font-bold text-orange-800 text-lg mb-2">Module en cours de migration</h4>
        <p className="text-orange-700 mb-4">
          Ce module complexe est en cours de migration vers Supabase. Il sera disponible prochainement.
        </p>
        <div className="text-sm text-orange-600 bg-white rounded p-4 text-left">
          <p className="font-bold mb-2">Fonctionnalités à venir :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Création et gestion des factures</li>
            <li>Factures récurrentes (abonnements)</li>
            <li>Gestion des dépenses professionnelles</li>
            <li>Génération de PDF et envoi par email</li>
            <li>Export vers Google Drive</li>
            <li>Tableau de bord financier et statistiques</li>
            <li>Rappels automatiques de paiement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FinanceModule;
