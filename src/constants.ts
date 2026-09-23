/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EggGradeConfig, FarmProfile, ExpenseCategory, UserRole, RoleConfig } from './types';

export const EGG_GRADES: EggGradeConfig[] = [
  { key: 'peewee', label: 'Peewee', weightRange: '<45g', description: 'Under 45g' },
  { key: 'xs', label: 'XS', weightRange: '45-49g', description: '45 to 49g' },
  { key: 'small', label: 'Small', weightRange: '50-55g', description: '50 to 55g' },
  { key: 'medium', label: 'Medium', weightRange: '56-60g', description: '56 to 60g' },
  { key: 'large', label: 'Large', weightRange: '61-65g', description: '61 to 65g' },
  { key: 'xl', label: 'XL', weightRange: '66-69g', description: '66 to 69g' },
  { key: 'jumbo', label: 'Jumbo', weightRange: '70-75g', description: '70 to 75g' },
  { key: 'oversize', label: 'Oversize', weightRange: '>76g', description: 'Over 76g' },
];

export const DEFAULT_FARM_PROFILE: FarmProfile = {
  farmName: 'Kagala Integrated Farm',
  tagline: 'Grow Raise Sustain',
  address: 'Brgy. Tabog, Caramoan, Camarines Sur',
  contactNumber: '09063001601',
  email: 'kagalaeggtrading@gmail.com',
  facebookPage: 'facebook.com/KagalaIntegratedFarm',
  ownerManager: 'Owner / Manager',
  logoUrl: null, // Critical: Starts with null - shows "Upload Farm Logo"
  currency: '₱',
  trayCapacity: 30, // 30 eggs per tray
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Feed',
  'RTL Birds',
  'Chicks',
  'Medicine & Vitamins',
  'Labor & Salaries',
  'Water',
  'Electricity',
  'Transport & Fuel',
  'Egg Trays & Packaging',
  'Repairs & Maintenance',
  'Equipment',
  'Permits & Licenses',
  'Marketing',
  'Other Farm Supplies',
  'Miscellaneous',
];

export const STORAGE_KEY_PREFIX = 'kagala_farm_';

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-PH');
}

export function formatPercent(val: number): string {
  return `${val.toFixed(1)}%`;
}

export const DEFAULT_USER_ROLE: UserRole = 'owner';

export const USER_ROLES: Record<UserRole, RoleConfig> = {
  owner: {
    id: 'owner',
    title: 'Farm Owner',
    badge: '👑 Owner / Admin',
    color: 'emerald',
    description: 'Master owner authority with full financial and administrative control over the entire farm enterprise.',
    boundarySummary: 'Zero boundaries. Full visibility into bank balances, cash reserves, profit/loss, cost per tray, settings, and database backups.',
    allowedTabs: [
      'dashboard',
      'flock',
      'production',
      'inventory',
      'feed',
      'supplies',
      'customers',
      'orders',
      'sales',
      'payments',
      'expenses',
      'bank-deposits',
      'cashflow',
      'production-cost',
      'record-check',
      'trash',
      'reports',
      'settings',
    ],
    permissions: {
      viewFinancialMetrics: true,
      viewFlockMetrics: true,
      viewSalesMetrics: true,
      viewInventoryMetrics: true,
      canLogProduction: true,
      canLogSales: true,
      canLogExpenses: true,
      canManageBanking: true,
      canManageSystem: true,
      canRunAudits: true,
    },
  },

  manager: {
    id: 'manager',
    title: 'Farm Supervisor / Manager',
    badge: '📋 Farm Supervisor',
    color: 'blue',
    description: 'Oversees daily poultry operations, egg inventories, flock health, customer dispatches, and operational expenses.',
    boundarySummary: 'Full operational & commercial visibility. Sensitive bank reserves, raw bank account balances, database reset, and branding are restricted.',
    allowedTabs: [
      'dashboard',
      'flock',
      'production',
      'inventory',
      'feed',
      'supplies',
      'customers',
      'orders',
      'sales',
      'payments',
      'expenses',
      'production-cost',
      'record-check',
      'reports',
    ],
    permissions: {
      viewFinancialMetrics: true, // Sees sales, collections, expenses, AR
      viewFlockMetrics: true,
      viewSalesMetrics: true,
      viewInventoryMetrics: true,
      canLogProduction: true,
      canLogSales: true,
      canLogExpenses: true,
      canManageBanking: false, // Bank accounts reserved for Owner
      canManageSystem: false,  // Database reset/backup reserved for Owner
      canRunAudits: true,
    },
  },

  collector: {
    id: 'collector',
    title: 'Flock & Egg Hand / Caretaker',
    badge: '🥚 Flock & Egg Hand',
    color: 'amber',
    description: 'Poultry house caretaker. Enters egg collection logs, mortality counts, sorting breakdown, and feed bag usage.',
    boundarySummary: 'Strict operational focus. Confidential financial figures (sales revenue, cash on hand, bank balances, customer debt, profit margins) are completely hidden.',
    allowedTabs: [
      'dashboard',
      'flock',
      'production',
      'inventory',
      'feed',
      'supplies',
    ],
    permissions: {
      viewFinancialMetrics: false, // STRICT PRIVACY: No sales, bank balances, cash, expenses
      viewFlockMetrics: true,
      viewSalesMetrics: false,
      viewInventoryMetrics: true,  // Sees trays & feed bags
      canLogProduction: true,      // Can log eggs, mortalities, feed used
      canLogSales: false,
      canLogExpenses: false,
      canManageBanking: false,
      canManageSystem: false,
      canRunAudits: false,
    },
  },

  sales_clerk: {
    id: 'sales_clerk',
    title: 'Sales & Dispatch Cashier',
    badge: '🧾 Sales & Dispatch Clerk',
    color: 'purple',
    description: 'Customer point of contact. Processes customer orders, generates egg sales invoices, receives payments, and checks tray availability.',
    boundarySummary: 'Commercial boundaries enforced. Flock mortalities, bird ages/strains, feed stock formulas, bank accounts, and farm operating expenses are hidden.',
    allowedTabs: [
      'dashboard',
      'customers',
      'orders',
      'sales',
      'payments',
      'inventory',
    ],
    permissions: {
      viewFinancialMetrics: false, // No bank balances, no operating expenses, no cash on hand
      viewFlockMetrics: false,     // No mortality, no bird headcounts
      viewSalesMetrics: true,      // Orders, sales invoices, payments, receivables
      viewInventoryMetrics: true,  // Available trays for delivery
      canLogProduction: false,
      canLogSales: true,
      canLogExpenses: false,
      canManageBanking: false,
      canManageSystem: false,
      canRunAudits: false,
    },
  },

  auditor: {
    id: 'auditor',
    title: 'Financial Auditor / Accountant',
    badge: '🔍 Auditor / Bookkeeper',
    color: 'indigo',
    description: 'Financial auditor and bookkeeper. Reviews transactions, verifies cashflow reconciliations, sales receipts, and bank deposit slips.',
    boundarySummary: 'Financial oversight & compliance focus. Cannot log daily egg collections or alter flock populations.',
    allowedTabs: [
      'dashboard',
      'sales',
      'payments',
      'expenses',
      'bank-deposits',
      'cashflow',
      'production-cost',
      'record-check',
      'reports',
    ],
    permissions: {
      viewFinancialMetrics: true,
      viewFlockMetrics: false,
      viewSalesMetrics: true,
      viewInventoryMetrics: false,
      canLogProduction: false,
      canLogSales: false,
      canLogExpenses: false,
      canManageBanking: true,
      canManageSystem: false,
      canRunAudits: true,
    },
  },
};
