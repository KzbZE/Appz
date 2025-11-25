import * as XLSX from 'xlsx';
import { db } from '../db';
import { Invoice, Session, Expense, InvoiceStatus } from '../types';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Service d'export comptable
 * Génère des exports compatibles Pennylane, QuickBooks, Excel, CSV
 * et récapitulatifs fiscaux URSSAF
 */

export interface AccountingPeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface AccountingData {
  invoices: Invoice[];
  sessions: Session[];
  expenses: Expense[];
  period: AccountingPeriod;
}

/**
 * Récupère les données comptables pour une période
 */
export async function getAccountingData(period: AccountingPeriod): Promise<AccountingData> {
  const invoices = await db.invoices
    .filter(inv => {
      const invDate = new Date(inv.date);
      return invDate >= period.start && invDate <= period.end;
    })
    .toArray();

  const sessions = await db.sessions
    .filter(sess => {
      const sessDate = new Date(sess.date);
      return sessDate >= period.start && sessDate <= period.end;
    })
    .toArray();

  const expenses = await db.expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= period.start && expDate <= period.end;
    })
    .toArray();

  return { invoices, sessions, expenses, period };
}

/**
 * Export Excel générique (multi-feuilles)
 */
export async function exportToExcel(data: AccountingData): Promise<void> {
  const workbook = XLSX.utils.book_new();

  // Feuille 1 : Factures
  const invoicesData = data.invoices.map(inv => ({
    'N° Facture': inv.invoiceNumber,
    'Date': format(new Date(inv.date), 'dd/MM/yyyy'),
    'Client': inv.patientName,
    'Description': inv.items.map(it => it.description).join(', '),
    'HT': inv.totalHT?.toFixed(2) || '0.00',
    'TVA': inv.totalTVA?.toFixed(2) || '0.00',
    'TTC': inv.totalTTC.toFixed(2),
    'Payé': inv.amountPaid?.toFixed(2) || '0.00',
    'Reste': (inv.totalTTC - (inv.amountPaid || 0)).toFixed(2),
    'Statut': inv.status,
    'Mode Paiement': inv.paymentMethod || 'N/A'
  }));

  const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
  XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Factures');

  // Feuille 2 : Séances
  const sessionsData = await Promise.all(data.sessions.map(async sess => {
    const patient = await db.patients.get(sess.patientId);
    return {
      'Date': format(new Date(sess.date), 'dd/MM/yyyy'),
      'Patient': patient?.name || 'Inconnu',
      'Type': sess.type,
      'Prix': sess.price?.toFixed(2) || '0.00',
      'Notes': sess.treatmentNotes?.substring(0, 50) || ''
    };
  }));

  const sessionsSheet = XLSX.utils.json_to_sheet(sessionsData);
  XLSX.utils.book_append_sheet(workbook, sessionsSheet, 'Séances');

  // Feuille 3 : Dépenses
  const expensesData = data.expenses.map(exp => ({
    'Date': format(new Date(exp.date), 'dd/MM/yyyy'),
    'Catégorie': exp.category,
    'Description': exp.description,
    'Montant HT': exp.amountHT.toFixed(2),
    'TVA': exp.tvaAmount.toFixed(2),
    'Montant TTC': exp.amountTTC.toFixed(2),
    'Fournisseur': exp.supplier || 'N/A',
    'Mode Paiement': exp.paymentMethod
  }));

  const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Dépenses');

  // Feuille 4 : Résumé
  const totalRevenue = data.invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
  const totalPaid = data.invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalExpenses = data.expenses.reduce((sum, exp) => sum + exp.amountTTC, 0);
  const netResult = totalPaid - totalExpenses;

  const summaryData = [
    { 'Indicateur': 'Total Facturé (TTC)', 'Valeur': `${totalRevenue.toFixed(2)} €` },
    { 'Indicateur': 'Total Encaissé', 'Valeur': `${totalPaid.toFixed(2)} €` },
    { 'Indicateur': 'Total Dépenses', 'Valeur': `${totalExpenses.toFixed(2)} €` },
    { 'Indicateur': 'Résultat Net', 'Valeur': `${netResult.toFixed(2)} €` },
    { 'Indicateur': 'Nombre de Factures', 'Valeur': data.invoices.length },
    { 'Indicateur': 'Nombre de Séances', 'Valeur': data.sessions.length },
    { 'Indicateur': 'Période', 'Valeur': data.period.label }
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

  // Télécharger le fichier
  const fileName = `comptabilite_${format(data.period.start, 'yyyy-MM')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export CSV simple (factures uniquement)
 */
export async function exportToCSV(data: AccountingData): Promise<void> {
  const invoicesData = data.invoices.map(inv => ({
    'N° Facture': inv.invoiceNumber,
    'Date': format(new Date(inv.date), 'dd/MM/yyyy'),
    'Client': inv.patientName,
    'Montant TTC': inv.totalTTC.toFixed(2),
    'Payé': inv.amountPaid?.toFixed(2) || '0.00',
    'Statut': inv.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(invoicesData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // Télécharger le CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `factures_${format(data.period.start, 'yyyy-MM')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export format Pennylane
 * Format CSV spécifique à Pennylane
 */
export async function exportToPennylane(data: AccountingData): Promise<void> {
  const pennylaneData = data.invoices.map(inv => ({
    'Date': format(new Date(inv.date), 'dd/MM/yyyy'),
    'N° Facture': inv.invoiceNumber,
    'Client': inv.patientName,
    'Libellé': inv.items.map(it => it.description).join(', '),
    'Montant HT': (inv.totalHT || 0).toFixed(2),
    'TVA': (inv.totalTVA || 0).toFixed(2),
    'Montant TTC': inv.totalTTC.toFixed(2),
    'Type': 'Vente',
    'Catégorie': 'Prestations de services',
    'Compte': '706000', // Compte comptable prestations de services
    'Mode de paiement': inv.paymentMethod || 'Espèces',
    'Statut': inv.status === InvoiceStatus.PAID ? 'Payée' : 'En attente'
  }));

  const worksheet = XLSX.utils.json_to_sheet(pennylaneData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `pennylane_export_${format(data.period.start, 'yyyy-MM')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export format QuickBooks
 * Format IIF (Intuit Interchange Format)
 */
export async function exportToQuickBooks(data: AccountingData): Promise<void> {
  // QuickBooks utilise le format IIF
  let iifContent = '!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO\n';
  iifContent += '!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tMEMO\n';
  iifContent += '!ENDTRNS\n';

  data.invoices.forEach((inv, index) => {
    const date = format(new Date(inv.date), 'MM/dd/yyyy');
    const trnsId = `INV${index + 1}`;

    // Ligne de transaction
    iifContent += `TRNS\t${trnsId}\tINVOICE\t${date}\tAccounts Receivable\t${inv.patientName}\t${inv.totalTTC.toFixed(2)}\t${inv.invoiceNumber}\n`;

    // Ligne de détail (split)
    iifContent += `SPL\t${trnsId}\tINVOICE\t${date}\tSales Income\t${(-inv.totalTTC).toFixed(2)}\t${inv.items.map(it => it.description).join(', ')}\n`;

    iifContent += 'ENDTRNS\n';
  });

  // Télécharger le fichier IIF
  const blob = new Blob([iifContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `quickbooks_export_${format(data.period.start, 'yyyy-MM')}.iif`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Génère un récapitulatif fiscal annuel pour l'URSSAF
 */
export async function generateURSSAFReport(year: number): Promise<void> {
  const period: AccountingPeriod = {
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 11, 31)),
    label: `Année ${year}`
  };

  const data = await getAccountingData(period);

  // Calculs pour URSSAF
  const totalRevenue = data.invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
  const totalExpenses = data.expenses.reduce((sum, exp) => sum + exp.amountTTC, 0);
  const netIncome = totalRevenue - totalExpenses;

  // Répartition par trimestre
  const quarters = [
    { q: 'Q1', start: new Date(year, 0, 1), end: new Date(year, 2, 31) },
    { q: 'Q2', start: new Date(year, 3, 1), end: new Date(year, 5, 30) },
    { q: 'Q3', start: new Date(year, 6, 1), end: new Date(year, 8, 30) },
    { q: 'Q4', start: new Date(year, 9, 1), end: new Date(year, 11, 31) }
  ];

  const quarterlyData = await Promise.all(
    quarters.map(async (q) => {
      const qData = await getAccountingData({
        start: q.start,
        end: q.end,
        label: q.q
      });

      const revenue = qData.invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
      const expenses = qData.expenses.reduce((sum, exp) => sum + exp.amountTTC, 0);

      return {
        'Trimestre': q.q,
        'Recettes TTC': revenue.toFixed(2),
        'Dépenses TTC': expenses.toFixed(2),
        'Résultat': (revenue - expenses).toFixed(2)
      };
    })
  );

  // Créer le rapport Excel
  const workbook = XLSX.utils.book_new();

  // Feuille 1 : Synthèse annuelle
  const summaryData = [
    { 'Indicateur': 'Année fiscale', 'Valeur': year },
    { 'Indicateur': '', 'Valeur': '' },
    { 'Indicateur': 'RECETTES', 'Valeur': '' },
    { 'Indicateur': 'Total Chiffre d\'Affaires TTC', 'Valeur': `${totalRevenue.toFixed(2)} €` },
    { 'Indicateur': 'Nombre de factures', 'Valeur': data.invoices.length },
    { 'Indicateur': 'Nombre de séances', 'Valeur': data.sessions.length },
    { 'Indicateur': '', 'Valeur': '' },
    { 'Indicateur': 'DÉPENSES', 'Valeur': '' },
    { 'Indicateur': 'Total Dépenses TTC', 'Valeur': `${totalExpenses.toFixed(2)} €` },
    { 'Indicateur': 'Nombre de dépenses', 'Valeur': data.expenses.length },
    { 'Indicateur': '', 'Valeur': '' },
    { 'Indicateur': 'RÉSULTAT', 'Valeur': '' },
    { 'Indicateur': 'Bénéfice Net', 'Valeur': `${netIncome.toFixed(2)} €` },
    { 'Indicateur': '', 'Valeur': '' },
    { 'Indicateur': 'COTISATIONS ESTIMÉES (indicatif)', 'Valeur': '' },
    { 'Indicateur': 'Base de cotisations (CA)', 'Valeur': `${totalRevenue.toFixed(2)} €` },
    { 'Indicateur': 'Cotisations sociales ~22%', 'Valeur': `${(totalRevenue * 0.22).toFixed(2)} €` },
    { 'Indicateur': 'Reste après cotisations', 'Valeur': `${(totalRevenue - (totalRevenue * 0.22)).toFixed(2)} €` }
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Synthèse Annuelle');

  // Feuille 2 : Détail trimestriel
  const quarterlySheet = XLSX.utils.json_to_sheet(quarterlyData);
  XLSX.utils.book_append_sheet(workbook, quarterlySheet, 'Détail Trimestriel');

  // Feuille 3 : Détail des recettes
  const revenueDetail = data.invoices.map(inv => ({
    'Date': format(new Date(inv.date), 'dd/MM/yyyy'),
    'N° Facture': inv.invoiceNumber,
    'Client': inv.patientName,
    'Montant TTC': inv.totalTTC.toFixed(2),
    'Statut': inv.status
  }));

  const revenueSheet = XLSX.utils.json_to_sheet(revenueDetail);
  XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Détail Recettes');

  // Feuille 4 : Détail des dépenses
  const expensesDetail = data.expenses.map(exp => ({
    'Date': format(new Date(exp.date), 'dd/MM/yyyy'),
    'Catégorie': exp.category,
    'Description': exp.description,
    'Montant TTC': exp.amountTTC.toFixed(2)
  }));

  const expensesSheet = XLSX.utils.json_to_sheet(expensesDetail);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Détail Dépenses');

  // Télécharger
  const fileName = `URSSAF_Declaration_${year}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  console.log(`✅ Récapitulatif URSSAF ${year} généré`);
}

/**
 * Fonctions utilitaires pour les périodes comptables
 */
export function getCurrentMonthPeriod(): AccountingPeriod {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
    label: format(now, 'MMMM yyyy', { locale: fr })
  };
}

export function getCurrentYearPeriod(): AccountingPeriod {
  const now = new Date();
  return {
    start: startOfYear(now),
    end: endOfYear(now),
    label: `Année ${now.getFullYear()}`
  };
}

export function getCustomPeriod(startDate: Date, endDate: Date): AccountingPeriod {
  return {
    start: startDate,
    end: endDate,
    label: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
  };
}
