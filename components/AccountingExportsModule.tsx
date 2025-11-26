/**
 * Module d'Exports Comptables
 * Interface pour générer exports Excel, Pennylane, etc.
 */

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import accountingExportService from '../services/accountingExportService';
import { Download, FileSpreadsheet, Calendar, TrendingUp, DollarSign } from 'lucide-react';

const AccountingExportsModule: React.FC = () => {
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];

  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const statement = accountingExportService.generateRevenueStatement(
        invoices,
        expenses,
        period
      );

      const blob = accountingExportService.exportToExcel(statement);
      const filename = `export-compta-${period.startDate}_${period.endDate}.xlsx`;
      accountingExportService.downloadExport(blob, filename);

      alert('✅ Export Excel généré avec succès!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Erreur lors de l\'export');
    }
    setExporting(false);
  };

  const handleExportPennylane = async () => {
    setExporting(true);
    try {
      const statement = accountingExportService.generateRevenueStatement(
        invoices,
        expenses,
        period
      );

      const csv = accountingExportService.exportToPennylane(statement);
      const blob = new Blob([csv], { type: 'text/csv' });
      const filename = `export-pennylane-${period.startDate}_${period.endDate}.csv`;
      accountingExportService.downloadExport(blob, filename);

      alert('✅ Export Pennylane généré!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Erreur lors de l\'export');
    }
    setExporting(false);
  };

  const handleExportMileage = async () => {
    setExporting(true);
    try {
      const year = new Date(period.startDate).getFullYear();
      const blob = accountingExportService.exportMileageExpenses(appointments, year);
      const filename = `frais-kilometriques-${year}.xlsx`;
      accountingExportService.downloadExport(blob, filename);

      alert('✅ Frais kilométriques exportés!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Erreur lors de l\'export');
    }
    setExporting(false);
  };

  // Calcul rapide pour preview
  const statement = accountingExportService.generateRevenueStatement(
    invoices,
    expenses,
    period
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-2xl flex items-center gap-2">
            <FileSpreadsheet size={28} className="text-green-600" />
            Exports Comptables
          </h3>
          <p className="text-slate-600 text-sm mt-1">
            Générez vos exports pour votre comptable
          </p>
        </div>
      </div>

      {/* Sélection Période */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          Période
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={period.startDate}
              onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={period.endDate}
              onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Aperçu Chiffres */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase">Revenus</div>
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{statement.totalRevenue.toFixed(0)}€</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase">Charges</div>
            <DollarSign size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{statement.totalExpenses.toFixed(0)}€</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold opacity-90 uppercase">Résultat</div>
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <div className="text-3xl font-black">{statement.netProfit.toFixed(0)}€</div>
        </div>
      </div>

      {/* Boutons Export */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Download size={20} className="text-green-600" />
          Exporter
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <FileSpreadsheet size={32} className="text-green-600" />
            </div>
            <h5 className="font-bold text-slate-800 mb-1">Excel Complet</h5>
            <p className="text-xs text-slate-600 text-center">
              4 feuilles: Résumé, Factures, Dépenses, Analyse
            </p>
          </button>

          {/* Export Pennylane */}
          <button
            onClick={handleExportPennylane}
            disabled={exporting}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <FileSpreadsheet size={32} className="text-blue-600" />
            </div>
            <h5 className="font-bold text-slate-800 mb-1">Pennylane CSV</h5>
            <p className="text-xs text-slate-600 text-center">
              Format compatible comptabilité
            </p>
          </button>

          {/* Export Frais KM */}
          <button
            onClick={handleExportMileage}
            disabled={exporting}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <FileSpreadsheet size={32} className="text-purple-600" />
            </div>
            <h5 className="font-bold text-slate-800 mb-1">Frais Kilométriques</h5>
            <p className="text-xs text-slate-600 text-center">
              Déplacements & remboursements
            </p>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Astuce:</strong> Ces exports sont conçus pour être directement utilisés par votre comptable. Le format Excel inclut toutes les informations nécessaires pour vos déclarations fiscales.
        </p>
      </div>
    </div>
  );
};

export default AccountingExportsModule;
