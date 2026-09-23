/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EggGradeConfig, FarmProfile, ExpenseCategory, UserRole, RoleConfig, RoleCredentials } from './types';

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

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  pin: '8888',
};

export const MANAGER_CREDENTIALS = {
  username: 'manager',
  pin: '1234',
};

export const STAFF_CREDENTIALS = {
  username: 'staff',
  pin: '0000',
};

export const DEFAULT_ROLE_CREDENTIALS: RoleCredentials = {
  admin: 'admin123',
  manager: '1234',
  staff: '0000',
};

export const DEFAULT_USER_ROLE: UserRole = 'admin';

export const ALL_APP_MODULES = [
  { id: 'dashboard', label: 'Command Center / Dashboard' },
  { id: 'flock', label: 'Flock / RTL Birds' },
  { id: 'production', label: 'Daily Egg Production' },
  { id: 'inventory', label: 'Egg Inventory' },
  { id: 'feed', label: 'Feed & Consumption' },
  { id: 'supplies', label: 'Medicine & Supplies' },
  { id: 'customers', label: 'Customer Management' },
  { id: 'orders', label: 'Order Management' },
  { id: 'sales', label: 'Sales & Invoicing' },
  { id: 'payments', label: 'Customer Payments' },
  { id: 'expenses', label: 'Expense Management' },
  { id: 'bank-deposits', label: 'Bank & Deposits' },
  { id: 'cashflow', label: 'Cashflow Accounts' },
  { id: 'production-cost', label: 'Cost of Production' },
  { id: 'record-check', label: '🔍 Record Check / Audit' },
  { id: 'trash', label: 'Trash Bin' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'settings', label: 'Farm Profile & Settings' },
];

export const USER_ROLES: Record<UserRole, RoleConfig> = {
  admin: {
    id: 'admin',
    title: 'Superuser Admin',
    badge: '👑 Admin (Superuser)',
    color: 'emerald',
    description: 'Full superuser authority with access to Access Control Panel, financial management, settings, and full system configuration.',
    boundarySummary: 'Superuser access. Zero boundaries. Can manage Access Control for Manager and Staff.',
    allowedTabs: [
      'access-control',
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
      canManageAccessControl: true,
      canDeleteRecords: true,
    },
  },

  manager: {
    id: 'manager',
    title: 'Farm Manager',
    badge: '📋 Manager',
    color: 'blue',
    description: 'Oversees daily farm operations, inventory, orders, sales, and operational expenses as permitted by Admin.',
    boundarySummary: 'Operational & management access as configured by Admin. Access Control Panel and system wipe restricted.',
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
      viewFinancialMetrics: true,
      viewFlockMetrics: true,
      viewSalesMetrics: true,
      viewInventoryMetrics: true,
      canLogProduction: true,
      canLogSales: true,
      canLogExpenses: true,
      canManageBanking: false,
      canManageSystem: false,
      canRunAudits: true,
      canManageAccessControl: false,
      canDeleteRecords: true,
    },
  },

  staff: {
    id: 'staff',
    title: 'Farm Staff',
    badge: '🧑‍🌾 Staff',
    color: 'amber',
    description: 'Field & sales staff. Performs daily egg logging, feed usage, order taking, or stock checks as permitted by Admin.',
    boundarySummary: 'Restricted operational access. Unallowed financial, banking, and management modules are blinded.',
    allowedTabs: [
      'dashboard',
      'flock',
      'production',
      'inventory',
      'feed',
      'supplies',
      'orders',
    ],
    permissions: {
      viewFinancialMetrics: false,
      viewFlockMetrics: true,
      viewSalesMetrics: false,
      viewInventoryMetrics: true,
      canLogProduction: true,
      canLogSales: true,
      canLogExpenses: false,
      canManageBanking: false,
      canManageSystem: false,
      canRunAudits: false,
      canManageAccessControl: false,
      canDeleteRecords: false,
    },
  },

  // Legacy compatibility mappings
  owner: {
    id: 'owner',
    title: 'Superuser Admin',
    badge: '👑 Admin (Superuser)',
    color: 'emerald',
    description: 'Full superuser authority with access to Access Control Panel, financial management, settings, and full system configuration.',
    boundarySummary: 'Superuser access. Zero boundaries. Can manage Access Control for Manager and Staff.',
    allowedTabs: [
      'access-control',
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
      canManageAccessControl: true,
      canDeleteRecords: true,
    },
  },

  collector: {
    id: 'collector',
    title: 'Farm Staff',
    badge: '🧑‍🌾 Staff',
    color: 'amber',
    description: 'Field & sales staff.',
    boundarySummary: 'Restricted operational access.',
    allowedTabs: ['dashboard', 'flock', 'production', 'inventory', 'feed', 'supplies'],
    permissions: {
      viewFinancialMetrics: false,
      viewFlockMetrics: true,
      viewSalesMetrics: false,
      viewInventoryMetrics: true,
      canLogProduction: true,
      canLogSales: false,
      canLogExpenses: false,
      canManageBanking: false,
      canManageSystem: false,
      canRunAudits: false,
      canManageAccessControl: false,
      canDeleteRecords: false,
    },
  },

  sales_clerk: {
    id: 'sales_clerk',
    title: 'Farm Staff',
    badge: '🧑‍🌾 Staff',
    color: 'purple',
    description: 'Field & sales staff.',
    boundarySummary: 'Restricted operational access.',
    allowedTabs: ['dashboard', 'customers', 'orders', 'sales', 'payments', 'inventory'],
    permissions: {
      viewFinancialMetrics: false,
      viewFlockMetrics: false,
      viewSalesMetrics: true,
      viewInventoryMetrics: true,
      canLogProduction: false,
      canLogSales: true,
      canLogExpenses: false,
      canManageBanking: false,
      canManageSystem: false,
      canRunAudits: false,
      canManageAccessControl: false,
      canDeleteRecords: false,
    },
  },

  auditor: {
    id: 'auditor',
    title: 'Farm Staff',
    badge: '🧑‍🌾 Staff',
    color: 'indigo',
    description: 'Field & sales staff.',
    boundarySummary: 'Restricted operational access.',
    allowedTabs: ['dashboard', 'sales', 'payments', 'expenses', 'reports'],
    permissions: {
      viewFinancialMetrics: true,
      viewFlockMetrics: false,
      viewSalesMetrics: true,
      viewInventoryMetrics: false,
      canLogProduction: false,
      canLogSales: false,
      canLogExpenses: false,
      canManageBanking: false,
      canManageSystem: false,
      canRunAudits: true,
      canManageAccessControl: false,
      canDeleteRecords: false,
    },
  },
};
