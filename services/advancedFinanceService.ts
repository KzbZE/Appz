/**
 * Service de Gestion Financière Avancée
 *
 * Fonctionnalités:
 * - Exports comptables (Pennylane, QuickBooks, Excel)
 * - Déclarations fiscales (URSSAF, impôts)
 * - Suivi trésorerie avec prévisions
 * - Frais professionnels (km, achats, formations)
 * - Paiements en ligne (Stripe, PayPal)
 * - Acomptes et abonnements
 */

import { Appointment, Patient } from '../types';

// Types
export interface Invoice {
  id: string;
  number: string;
  patientId: string;
  appointmentId?: string;
  date: Date;
  dueDate: Date;
  amount: number;
  amountPaid: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  taxRate: number; // TVA en %
  notes?: string;
  paymentMethod?: 'cash' | 'check' | 'card' | 'transfer' | 'online';
  paidAt?: Date;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
}

export interface Expense {
  id: string;
  date: Date;
  category: 'km' | 'equipment' | 'training' | 'rent' | 'insurance' | 'software' | 'other';
  description: string;
  amount: number;
  taxDeductible: boolean;
  receipt?: string; // URL du justificatif
  notes?: string;
}

export interface TreasuryForecast {
  month: string;
  expectedRevenue: number;
  expectedExpenses: number;
  balance: number;
  confidence: number; // 0-100
}

export interface FiscalReport {
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  taxableIncome: number;
  vatCollected: number;
  vatPaid: number;
  socialContributions: number;
  byMonth: {
    month: string;
    revenue: number;
    expenses: number;
  }[];
  byCategory: {
    category: string;
    amount: number;
  }[];
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
  currency: string;
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'production';
}

export interface Subscription {
  id: string;
  patientId: string;
  type: 'sessions_5' | 'sessions_10' | 'sessions_20' | 'monthly' | 'quarterly';
  sessionsIncluded: number;
  sessionsUsed: number;
  amount: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual' | 'one_time';
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
}

export interface Deposit {
  id: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  percentage: number;
  status: 'pending' | 'paid' | 'refunded';
  paidAt?: Date;
  refundedAt?: Date;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
}

class AdvancedFinanceService {
  private invoices: Invoice[] = [];
  private expenses: Expense[] = [];
  private subscriptions: Subscription[] = [];
  private deposits: Deposit[] = [];
  private stripeConfig: StripeConfig | null = null;
  private paypalConfig: PayPalConfig | null = null;

  constructor() {
    this.loadData();
  }

  /**
   * Configuration paiements en ligne
   */

  configureStripe(config: StripeConfig): void {
    this.stripeConfig = config;
    this.saveData();
  }

  configurePayPal(config: PayPalConfig): void {
    this.paypalConfig = config;
    this.saveData();
  }

  getStripeConfig(): StripeConfig | null {
    return this.stripeConfig;
  }

  getPayPalConfig(): PayPalConfig | null {
    return this.paypalConfig;
  }

  /**
   * Gestion factures
   */

  createInvoice(data: Omit<Invoice, 'id' | 'number' | 'status' | 'amountPaid'>): Invoice {
    const invoice: Invoice = {
      ...data,
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      number: this.generateInvoiceNumber(),
      status: 'draft',
      amountPaid: 0
    };

    this.invoices.push(invoice);
    this.saveData();
    return invoice;
  }

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const count = this.invoices.filter(inv =>
      new Date(inv.date).getFullYear() === year
    ).length + 1;

    return `F${year}-${count.toString().padStart(4, '0')}`;
  }

  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const invoice = this.invoices.find(inv => inv.id === id);
    if (!invoice) return null;

    Object.assign(invoice, updates);
    this.saveData();
    return invoice;
  }

  markInvoiceAsPaid(id: string, paymentMethod: Invoice['paymentMethod'], paymentDate?: Date): Invoice | null {
    const invoice = this.invoices.find(inv => inv.id === id);
    if (!invoice) return null;

    invoice.status = 'paid';
    invoice.amountPaid = invoice.amount;
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = paymentDate || new Date();

    this.saveData();
    return invoice;
  }

  getInvoices(filters?: {
    patientId?: string;
    status?: Invoice['status'];
    fromDate?: Date;
    toDate?: Date;
  }): Invoice[] {
    let result = [...this.invoices];

    if (filters) {
      if (filters.patientId) {
        result = result.filter(inv => inv.patientId === filters.patientId);
      }
      if (filters.status) {
        result = result.filter(inv => inv.status === filters.status);
      }
      if (filters.fromDate) {
        result = result.filter(inv => new Date(inv.date) >= filters.fromDate!);
      }
      if (filters.toDate) {
        result = result.filter(inv => new Date(inv.date) <= filters.toDate!);
      }
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getOverdueInvoices(): Invoice[] {
    const now = new Date();
    return this.invoices.filter(inv =>
      inv.status === 'sent' &&
      new Date(inv.dueDate) < now &&
      inv.amountPaid < inv.amount
    );
  }

  /**
   * Gestion dépenses
   */

  addExpense(data: Omit<Expense, 'id'>): Expense {
    const expense: Expense = {
      ...data,
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.expenses.push(expense);
    this.saveData();
    return expense;
  }

  getExpenses(filters?: {
    category?: Expense['category'];
    fromDate?: Date;
    toDate?: Date;
    taxDeductible?: boolean;
  }): Expense[] {
    let result = [...this.expenses];

    if (filters) {
      if (filters.category) {
        result = result.filter(exp => exp.category === filters.category);
      }
      if (filters.fromDate) {
        result = result.filter(exp => new Date(exp.date) >= filters.fromDate!);
      }
      if (filters.toDate) {
        result = result.filter(exp => new Date(exp.date) <= filters.toDate!);
      }
      if (filters.taxDeductible !== undefined) {
        result = result.filter(exp => exp.taxDeductible === filters.taxDeductible);
      }
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Exports comptables
   */

  exportToExcel(year: number): string {
    const invoicesYear = this.invoices.filter(inv =>
      new Date(inv.date).getFullYear() === year
    );
    const expensesYear = this.expenses.filter(exp =>
      new Date(exp.date).getFullYear() === year
    );

    // Format CSV pour Excel
    let csv = 'Type,Date,Description,Montant HT,TVA,Montant TTC,Catégorie,Statut\n';

    // Recettes
    for (const inv of invoicesYear) {
      const htAmount = inv.amount / (1 + inv.taxRate / 100);
      const tva = inv.amount - htAmount;
      csv += `Recette,${new Date(inv.date).toLocaleDateString('fr-FR')},Facture ${inv.number},${htAmount.toFixed(2)},${tva.toFixed(2)},${inv.amount.toFixed(2)},Consultation,${inv.status}\n`;
    }

    // Dépenses
    for (const exp of expensesYear) {
      csv += `Dépense,${new Date(exp.date).toLocaleDateString('fr-FR')},${exp.description},${exp.amount.toFixed(2)},0,${exp.amount.toFixed(2)},${exp.category},payé\n`;
    }

    return csv;
  }

  exportToPennylane(year: number): any {
    // Format Pennylane
    const invoicesYear = this.invoices.filter(inv =>
      new Date(inv.date).getFullYear() === year && inv.status === 'paid'
    );

    return {
      invoices: invoicesYear.map(inv => ({
        date: inv.date,
        label: `Facture ${inv.number}`,
        amount: inv.amount,
        currency: 'EUR',
        invoice_number: inv.number,
        customer: {
          customer_id: inv.patientId
        },
        line_items: inv.items.map(item => ({
          label: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          vat_rate: item.taxRate
        }))
      }))
    };
  }

  exportToQuickBooks(year: number): any {
    // Format QuickBooks
    const invoicesYear = this.invoices.filter(inv =>
      new Date(inv.date).getFullYear() === year && inv.status === 'paid'
    );

    return {
      Invoice: invoicesYear.map(inv => ({
        TxnDate: new Date(inv.date).toISOString().split('T')[0],
        CustomerRef: { value: inv.patientId },
        Line: inv.items.map((item, idx) => ({
          Id: `${idx + 1}`,
          LineNum: idx + 1,
          Amount: item.total,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            Qty: item.quantity,
            UnitPrice: item.unitPrice,
            TaxCodeRef: { value: 'TAX' }
          }
        })),
        TotalAmt: inv.amount
      }))
    };
  }

  /**
   * Rapports fiscaux
   */

  generateFiscalReport(year: number): FiscalReport {
    const invoicesYear = this.invoices.filter(inv =>
      new Date(inv.date).getFullYear() === year && inv.status === 'paid'
    );
    const expensesYear = this.expenses.filter(exp =>
      new Date(exp.date).getFullYear() === year
    );

    const totalRevenue = invoicesYear.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpenses = expensesYear.reduce((sum, exp) => sum + (exp.taxDeductible ? exp.amount : 0), 0);

    const vatCollected = invoicesYear.reduce((sum, inv) => {
      const ht = inv.amount / (1 + inv.taxRate / 100);
      return sum + (inv.amount - ht);
    }, 0);

    const byMonth: FiscalReport['byMonth'] = [];
    for (let month = 0; month < 12; month++) {
      const monthInvoices = invoicesYear.filter(inv =>
        new Date(inv.date).getMonth() === month
      );
      const monthExpenses = expensesYear.filter(exp =>
        new Date(exp.date).getMonth() === month
      );

      byMonth.push({
        month: new Date(year, month).toLocaleDateString('fr-FR', { month: 'long' }),
        revenue: monthInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        expenses: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      });
    }

    const byCategory = Object.entries(
      expensesYear.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, amount]) => ({ category, amount }));

    // Calcul cotisations sociales (estimation approximative)
    const taxableIncome = totalRevenue - totalExpenses;
    const socialContributions = taxableIncome * 0.22; // ~22% pour professions libérales

    return {
      year,
      totalRevenue,
      totalExpenses,
      taxableIncome,
      vatCollected,
      vatPaid: 0,
      socialContributions,
      byMonth,
      byCategory
    };
  }

  /**
   * Prévisions de trésorerie
   */

  forecastTreasury(months: number = 6): TreasuryForecast[] {
    const forecasts: TreasuryForecast[] = [];
    const now = new Date();

    // Calculer moyennes historiques
    const last12Months = this.invoices.filter(inv => {
      const invDate = new Date(inv.date);
      const monthsAgo = (now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo <= 12 && inv.status === 'paid';
    });

    const avgMonthlyRevenue = last12Months.reduce((sum, inv) => sum + inv.amount, 0) / 12;

    const last12MonthsExpenses = this.expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const monthsAgo = (now.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo <= 12;
    });

    const avgMonthlyExpenses = last12MonthsExpenses.reduce((sum, exp) => sum + exp.amount, 0) / 12;

    for (let i = 0; i < months; i++) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = forecastDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      // Ajuster selon saisonnalité (basique)
      const seasonalityFactor = 1 + (Math.sin((forecastDate.getMonth() / 12) * 2 * Math.PI) * 0.1);

      forecasts.push({
        month: monthName,
        expectedRevenue: Math.round(avgMonthlyRevenue * seasonalityFactor),
        expectedExpenses: Math.round(avgMonthlyExpenses),
        balance: Math.round((avgMonthlyRevenue * seasonalityFactor) - avgMonthlyExpenses),
        confidence: Math.max(30, 90 - (i * 10)) // Confiance décroit avec le temps
      });
    }

    return forecasts;
  }

  /**
   * Abonnements
   */

  createSubscription(data: Omit<Subscription, 'id' | 'sessionsUsed' | 'status'>): Subscription {
    const subscription: Subscription = {
      ...data,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionsUsed: 0,
      status: 'active'
    };

    this.subscriptions.push(subscription);
    this.saveData();
    return subscription;
  }

  useSubscriptionSession(subscriptionId: string): boolean {
    const sub = this.subscriptions.find(s => s.id === subscriptionId);
    if (!sub || sub.status !== 'active') return false;

    if (sub.sessionsUsed >= sub.sessionsIncluded) {
      return false;
    }

    sub.sessionsUsed++;

    if (sub.sessionsUsed >= sub.sessionsIncluded) {
      sub.status = 'expired';
    }

    this.saveData();
    return true;
  }

  getActiveSubscriptions(patientId?: string): Subscription[] {
    let subs = this.subscriptions.filter(s => s.status === 'active');
    if (patientId) {
      subs = subs.filter(s => s.patientId === patientId);
    }
    return subs;
  }

  /**
   * Acomptes
   */

  createDeposit(data: Omit<Deposit, 'id' | 'status'>): Deposit {
    const deposit: Deposit = {
      ...data,
      id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending'
    };

    this.deposits.push(deposit);
    this.saveData();
    return deposit;
  }

  markDepositAsPaid(depositId: string, paymentMethod: string, stripePaymentIntentId?: string): Deposit | null {
    const deposit = this.deposits.find(d => d.id === depositId);
    if (!deposit) return null;

    deposit.status = 'paid';
    deposit.paidAt = new Date();
    deposit.paymentMethod = paymentMethod;
    deposit.stripePaymentIntentId = stripePaymentIntentId;

    this.saveData();
    return deposit;
  }

  /**
   * Paiements en ligne
   */

  async createStripePaymentIntent(amount: number, currency: string = 'eur', metadata?: any): Promise<any> {
    if (!this.stripeConfig) {
      throw new Error('Stripe non configuré');
    }

    // En production, appeler l'API Stripe
    console.log('Création Stripe Payment Intent:', {
      amount: amount * 100, // Centimes
      currency,
      metadata
    });

    // Simuler réponse Stripe
    return {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_secret_${Math.random().toString(36).substr(2, 20)}`,
      amount: amount * 100,
      currency,
      status: 'requires_payment_method'
    };
  }

  async createPayPalOrder(amount: number, currency: string = 'EUR', metadata?: any): Promise<any> {
    if (!this.paypalConfig) {
      throw new Error('PayPal non configuré');
    }

    // En production, appeler l'API PayPal
    console.log('Création PayPal Order:', {
      amount,
      currency,
      metadata
    });

    // Simuler réponse PayPal
    return {
      id: `PAYPAL-${Date.now()}`,
      status: 'CREATED',
      links: [
        {
          rel: 'approve',
          href: `https://www.paypal.com/checkoutnow?token=PAYPAL-${Date.now()}`
        }
      ]
    };
  }

  /**
   * Statistiques
   */

  getFinancialStats(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): {
    revenue: number;
    expenses: number;
    profit: number;
    unpaidInvoices: number;
    avgTransactionValue: number;
  } {
    const now = new Date();
    let fromDate = new Date();

    switch (period) {
      case 'week':
        fromDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        fromDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const periodInvoices = this.invoices.filter(inv =>
      new Date(inv.date) >= fromDate && inv.status === 'paid'
    );

    const periodExpenses = this.expenses.filter(exp =>
      new Date(exp.date) >= fromDate
    );

    const revenue = periodInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const expenses = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const unpaidInvoices = this.invoices.filter(inv =>
      inv.status === 'sent' && inv.amountPaid < inv.amount
    ).length;

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      unpaidInvoices,
      avgTransactionValue: periodInvoices.length > 0 ? revenue / periodInvoices.length : 0
    };
  }

  /**
   * Persistence
   */

  private loadData(): void {
    try {
      const saved = localStorage.getItem('theraflow_advanced_finance');
      if (saved) {
        const data = JSON.parse(saved);
        this.invoices = (data.invoices || []).map((inv: any) => ({
          ...inv,
          date: new Date(inv.date),
          dueDate: new Date(inv.dueDate),
          paidAt: inv.paidAt ? new Date(inv.paidAt) : undefined
        }));
        this.expenses = (data.expenses || []).map((exp: any) => ({
          ...exp,
          date: new Date(exp.date)
        }));
        this.subscriptions = (data.subscriptions || []).map((sub: any) => ({
          ...sub,
          startDate: new Date(sub.startDate),
          endDate: sub.endDate ? new Date(sub.endDate) : undefined,
          nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate) : undefined
        }));
        this.deposits = (data.deposits || []).map((dep: any) => ({
          ...dep,
          paidAt: dep.paidAt ? new Date(dep.paidAt) : undefined,
          refundedAt: dep.refundedAt ? new Date(dep.refundedAt) : undefined
        }));
        this.stripeConfig = data.stripeConfig || null;
        this.paypalConfig = data.paypalConfig || null;
      }
    } catch (error) {
      console.error('Erreur chargement données finance:', error);
    }
  }

  private saveData(): void {
    try {
      const data = {
        invoices: this.invoices,
        expenses: this.expenses,
        subscriptions: this.subscriptions,
        deposits: this.deposits,
        stripeConfig: this.stripeConfig,
        paypalConfig: this.paypalConfig
      };
      localStorage.setItem('theraflow_advanced_finance', JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde données finance:', error);
    }
  }
}

// Export singleton
const advancedFinanceServiceInstance = new AdvancedFinanceService();
export default advancedFinanceServiceInstance;

// Fonctions helper
export function createInvoice(data: Omit<Invoice, 'id' | 'number' | 'status' | 'amountPaid'>): Invoice {
  return advancedFinanceServiceInstance.createInvoice(data);
}

export function getFinancialStats(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  return advancedFinanceServiceInstance.getFinancialStats(period);
}

export function generateFiscalReport(year: number): FiscalReport {
  return advancedFinanceServiceInstance.generateFiscalReport(year);
}

export function exportToExcel(year: number): string {
  return advancedFinanceServiceInstance.exportToExcel(year);
}

export function forecastTreasury(months: number = 6): TreasuryForecast[] {
  return advancedFinanceServiceInstance.forecastTreasury(months);
}
