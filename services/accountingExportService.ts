/**
 * Service d'Export Comptable
 *
 * Génère des exports compatibles avec:
 * - Excel (XLSX)
 * - Pennylane
 * - QuickBooks
 * - Format simplifié pour comptable
 */

import * as XLSX from 'xlsx';
import { Invoice, Expense, Appointment } from '../types';

export interface AccountingPeriod {
  startDate: string;
  endDate: string;
}

export interface AccountingExport {
  type: 'excel' | 'pennylane' | 'quickbooks' | 'simple';
  period: AccountingPeriod;
  data: any;
  filename: string;
}

export interface RevenueStatement {
  period: AccountingPeriod;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueByType: Record<string, number>;
  expensesByCategory: Record<string, number>;
  vatCollected: number;
  vatPaid: number;
  invoices: Invoice[];
  expenses: Expense[];
}

export interface TaxDeclaration {
  year: number;
  quarter?: number;
  totalRevenue: number;
  deductibleExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  vatDue: number;
  socialCharges: number;
}

class AccountingExportService {

  /**
   * Génère un export Excel complet
   */
  exportToExcel(statement: RevenueStatement): Blob {
    const workbook = XLSX.utils.book_new();

    // Feuille 1: Résumé
    const summaryData = [
      ['RÉSUMÉ COMPTABLE'],
      ['Période', `${new Date(statement.period.startDate).toLocaleDateString()} - ${new Date(statement.period.endDate).toLocaleDateString()}`],
      [],
      ['REVENUS', statement.totalRevenue.toFixed(2) + ' €'],
      ['CHARGES', statement.totalExpenses.toFixed(2) + ' €'],
      ['RÉSULTAT NET', statement.netProfit.toFixed(2) + ' €'],
      [],
      ['TVA Collectée', statement.vatCollected.toFixed(2) + ' €'],
      ['TVA Payée', statement.vatPaid.toFixed(2) + ' €'],
      ['TVA à Reverser', (statement.vatCollected - statement.vatPaid).toFixed(2) + ' €'],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

    // Feuille 2: Factures
    const invoiceData = [
      ['Date', 'N° Facture', 'Client', 'HT', 'TVA %', 'TVA', 'TTC', 'Payé', 'Statut']
    ];
    statement.invoices.forEach(inv => {
      invoiceData.push([
        new Date(inv.date).toLocaleDateString(),
        inv.number,
        inv.patientName,
        inv.amountHT.toFixed(2),
        inv.vatRate,
        (inv.amountTTC - inv.amountHT).toFixed(2),
        inv.amountTTC.toFixed(2),
        inv.amountPaid.toFixed(2),
        inv.status
      ]);
    });
    const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceData);
    XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Factures');

    // Feuille 3: Dépenses
    const expenseData = [
      ['Date', 'Catégorie', 'Description', 'Montant', 'TVA Récupérable']
    ];
    statement.expenses.forEach(exp => {
      expenseData.push([
        new Date(exp.date).toLocaleDateString(),
        exp.category,
        exp.description,
        exp.amount.toFixed(2),
        ((exp.vatRecoverable || 0) * exp.amount).toFixed(2)
      ]);
    });
    const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Dépenses');

    // Feuille 4: Analyse par Type
    const analysisData = [
      ['REVENUS PAR TYPE'],
      ['Type', 'Montant']
    ];
    Object.entries(statement.revenueByType).forEach(([type, amount]) => {
      analysisData.push([type, amount.toFixed(2) + ' €']);
    });
    analysisData.push([]);
    analysisData.push(['CHARGES PAR CATÉGORIE']);
    analysisData.push(['Catégorie', 'Montant']);
    Object.entries(statement.expensesByCategory).forEach(([cat, amount]) => {
      analysisData.push([cat, amount.toFixed(2) + ' €']);
    });
    const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
    XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analyse');

    // Générer le fichier
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Export format Pennylane
   */
  exportToPennylane(statement: RevenueStatement): string {
    // Format CSV compatible Pennylane
    const rows = [
      ['Date', 'Libellé', 'Débit', 'Crédit', 'Compte', 'Numéro de pièce', 'Lettrage']
    ];

    // Revenus
    statement.invoices.forEach(inv => {
      rows.push([
        inv.date,
        `Facture ${inv.number} - ${inv.patientName}`,
        '',
        inv.amountTTC.toFixed(2),
        '706000', // Compte prestations de services
        inv.number,
        ''
      ]);
    });

    // Dépenses
    statement.expenses.forEach(exp => {
      const account = this.getCategoryAccount(exp.category);
      rows.push([
        exp.date,
        exp.description,
        exp.amount.toFixed(2),
        '',
        account,
        '',
        ''
      ]);
    });

    // Convertir en CSV
    return rows.map(row => row.join(';')).join('\n');
  }

  /**
   * Détermine le compte comptable selon la catégorie
   */
  private getCategoryAccount(category: string): string {
    const accounts: Record<string, string> = {
      'MATERIEL': '606000',
      'FORMATION': '618000',
      'LOYER': '613000',
      'TRANSPORT': '625100',
      'TELEPHONE': '626000',
      'ASSURANCE': '616000',
      'FOURNITURES': '606400',
      'OTHER': '628000'
    };
    return accounts[category] || '628000';
  }

  /**
   * Calcul du relevé comptable
   */
  generateRevenueStatement(
    invoices: Invoice[],
    expenses: Expense[],
    period: AccountingPeriod
  ): RevenueStatement {

    const periodInvoices = invoices.filter(inv =>
      inv.date >= period.startDate && inv.date <= period.endDate
    );

    const periodExpenses = expenses.filter(exp =>
      exp.date >= period.startDate && exp.date <= period.endDate
    );

    const totalRevenue = periodInvoices.reduce((sum, inv) => sum + inv.amountTTC, 0);
    const totalExpenses = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const revenueByType: Record<string, number> = {};
    periodInvoices.forEach(inv => {
      inv.items.forEach(item => {
        revenueByType[item.description] = (revenueByType[item.description] || 0) + (item.quantity * item.unitPrice);
      });
    });

    const expensesByCategory: Record<string, number> = {};
    periodExpenses.forEach(exp => {
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
    });

    const vatCollected = periodInvoices.reduce((sum, inv) =>
      sum + (inv.amountTTC - inv.amountHT), 0
    );

    const vatPaid = periodExpenses.reduce((sum, exp) =>
      sum + ((exp.vatRecoverable || 0) * exp.amount), 0
    );

    return {
      period,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      revenueByType,
      expensesByCategory,
      vatCollected,
      vatPaid,
      invoices: periodInvoices,
      expenses: periodExpenses
    };
  }

  /**
   * Génère une déclaration fiscale
   */
  generateTaxDeclaration(
    invoices: Invoice[],
    expenses: Expense[],
    year: number,
    quarter?: number
  ): TaxDeclaration {

    let startDate: string, endDate: string;

    if (quarter) {
      // Déclaration trimestrielle
      const quarterStarts = ['01-01', '04-01', '07-01', '10-01'];
      const quarterEnds = ['03-31', '06-30', '09-30', '12-31'];
      startDate = `${year}-${quarterStarts[quarter - 1]}`;
      endDate = `${year}-${quarterEnds[quarter - 1]}`;
    } else {
      // Déclaration annuelle
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }

    const statement = this.generateRevenueStatement(invoices, expenses, { startDate, endDate });

    // Calculs fiscaux simplifiés (à adapter selon le régime)
    const deductibleExpenses = statement.totalExpenses;
    const taxableIncome = statement.totalRevenue - deductibleExpenses;

    // Taux forfaitaire micro-BNC: 23% du CA (abattement de 34%)
    const estimatedTax = statement.totalRevenue * 0.23;

    // TVA nette à reverser
    const vatDue = statement.vatCollected - statement.vatPaid;

    // Charges sociales (environ 22% du revenu)
    const socialCharges = taxableIncome * 0.22;

    return {
      year,
      quarter,
      totalRevenue: statement.totalRevenue,
      deductibleExpenses,
      taxableIncome,
      estimatedTax,
      vatDue,
      socialCharges
    };
  }

  /**
   * Export frais kilométriques
   */
  exportMileageExpenses(appointments: Appointment[], year: number): Blob {
    const workbook = XLSX.utils.book_new();

    const data = [
      ['FRAIS KILOMÉTRIQUES ' + year],
      ['Date', 'Patient', 'Trajet', 'Distance (km)', 'Taux', 'Montant']
    ];

    let totalKm = 0;
    let totalAmount = 0;
    const kmRate = 0.52; // Barème fiscal 2025

    appointments
      .filter(a => a.startTime.startsWith(year.toString()) && a.distanceKm)
      .forEach(appt => {
        const km = appt.distanceKm || 0;
        const amount = km * 2 * kmRate; // Aller-retour
        totalKm += km * 2;
        totalAmount += amount;

        data.push([
          new Date(appt.startTime).toLocaleDateString(),
          appt.notes || 'Patient',
          'Aller-Retour',
          (km * 2).toFixed(1),
          kmRate.toFixed(2),
          amount.toFixed(2) + ' €'
        ]);
      });

    data.push([]);
    data.push(['TOTAL', '', '', totalKm.toFixed(1), '', totalAmount.toFixed(2) + ' €']);

    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Frais KM');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Télécharge un export
   */
  downloadExport(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export default new AccountingExportService();
