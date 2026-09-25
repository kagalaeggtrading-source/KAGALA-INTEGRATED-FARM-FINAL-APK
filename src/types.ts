/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EggGradeKey =
  | 'peewee'
  | 'xs'
  | 'small'
  | 'medium'
  | 'large'
  | 'xl'
  | 'jumbo'
  | 'oversize'
  | 'superJumbo';

export interface EggGradeConfig {
  key: EggGradeKey;
  label: string;
  weightRange: string;
  description: string;
}

export interface FarmProfile {
  farmName: string;
  tagline: string;
  address: string;
  contactNumber: string;
  email: string;
  facebookPage: string;
  ownerManager: string;
  logoUrl: string | null;
  currency: string;
  trayCapacity: number; // standard 30 eggs per tray
}

export interface FarmLocation {
  id: string;
  name: string;
  code: string;
  notes?: string;
  createdAt: string;
}

export interface FarmHouse {
  id: string;
  farmId: string;
  name: string;
  code: string;
  capacity: number;
  houseType: string; // 'Elevated Cage' | 'Deep Litter' | 'Tunnel Ventilated' | 'Standard'
  notes?: string;
  createdAt: string;
}

export type RtlStatus = 'Active' | 'Molting' | 'Culled' | 'Sold' | 'Completed';

export interface Flock {
  id: string;
  batchId: string;
  farmId: string;
  houseId: string;
  source: string;
  startingPopulation: number;
  currentPopulation: number;
  startDate: string;
  ageWeeks: number;
  breedStrain: string; // e.g. Lohmann Brown, Dekalb White, Hy-Line, Novogen
  rtlStatus: RtlStatus;
  notes?: string;
  createdAt: string;
}

export type FlockAdjustmentType = 'mortality' | 'cull' | 'transfer_in' | 'transfer_out';

export interface FlockAdjustment {
  id: string;
  flockId: string;
  date: string;
  type: FlockAdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
  recordedAt: string;
}

export interface EggGradeBreakdown {
  peewee: number;
  xs: number;
  small: number;
  medium: number;
  large: number;
  xl: number;
  jumbo: number;
  oversize: number;
  superJumbo?: number;
}

export interface EggProductionLog {
  id: string;
  date: string;
  farmId: string;
  houseId: string;
  flockId: string;
  totalCollection: number; // Total daily collected eggs
  rejects: number;         // Rejects
  usableEggs: number;      // Good eggs (usable)
  grades: EggGradeBreakdown;
  eggsPerHen: number;
  hdp: number; // Hen-Day Production percentage
  collectorName?: string;
  notes?: string;
  createdAt: string;
  morningCollection?: number;
  afternoonCollection?: number;
  brokenEggs?: number;
  dirtyEggs?: number;
}

export interface EggInventoryAdjustment {
  id: string;
  date: string;
  grade: EggGradeKey;
  type: 'adjustment_in' | 'adjustment_out' | 'breakage' | 'spoilage';
  quantityPieces: number;
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  feedType: string; // 'Layer 1' | 'Layer 2' | 'Pre-Lay' | 'Grower' | 'Starter'
  brand: string;
  supplier: string;
  bagWeightKg: number; // e.g. 50 kg
  currentBags: number;
  currentKg: number;
  costPerBag: number;
  costPerKg: number;
  purchaseDate: string;
  batchLot?: string;
  expirationDate?: string;
  minimumBagsAlert: number;
  notes?: string;
  createdAt: string;
}

export interface FeedConsumptionLog {
  id: string;
  date: string;
  farmId: string;
  houseId: string;
  flockId: string;
  feedItemId: string;
  bagsUsed: number;
  kgUsed: number;
  cost: number;
  notes?: string;
  createdAt: string;
}

export interface FeedPurchaseLog {
  id: string;
  date: string;
  feedItemId: string;
  feedName: string;
  supplier: string;
  bags: number;
  kg: number;
  costPerBag: number;
  totalCost: number;
  paymentAccount: 'cash_on_hand' | 'bank_account';
  bankAccountId?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export type SupplyCategory =
  | 'medicine'
  | 'vitamin'
  | 'supplement'
  | 'disinfectant'
  | 'cleaning'
  | 'pest_control'
  | 'egg_tray'
  | 'packaging'
  | 'other';

export interface SupplyItem {
  id: string;
  name: string;
  category: SupplyCategory;
  quantity: number;
  unit: string; // 'pcs', 'bottles', 'sachets', 'bundles', 'liters', 'packs'
  costPerUnit: number;
  supplier: string;
  expirationDate?: string;
  batchLot?: string;
  minimumStock: number;
  notes?: string;
  createdAt: string;
}

export interface SupplyUsageLog {
  id: string;
  date: string;
  supplyItemId: string;
  supplyName: string;
  quantity: number;
  unit: string;
  reason: string;
  houseId?: string;
  flockId?: string;
  notes?: string;
  createdAt: string;
}

export type CustomerType =
  | 'Retail'
  | 'Wholesale'
  | 'Suki/Regular'
  | 'Reseller'
  | 'Restaurant'
  | 'Store'
  | 'Delivery customer';

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  businessName?: string;
  contactNumber: string;
  address: string;
  customerType: CustomerType;
  priceLevel: string; // 'Standard' | 'Wholesale' | 'Special Suki'
  creditTermsDays: number; // 0 for COD
  creditLimit: number;
  notes?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'RESERVED'
  | 'PREPARING'
  | 'READY'
  | 'OUT FOR DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'PARTIALLY FULFILLED';

export interface OrderItem {
  grade: EggGradeKey;
  quantityPieces: number;
  quantityTrays: number;
  unitPrice: number; // price per piece or per tray
  priceType: 'piece' | 'tray';
  subtotal: number;
}

export interface FarmOrder {
  id: string;
  orderNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  contactNumber: string;
  deliveryAddress: string;
  fulfillmentType: 'Pickup' | 'Delivery';
  deliveryDate: string;
  deliveryTime?: string;
  staffInCharge?: string;
  status: OrderStatus;
  paymentTerms: string; // 'Cash on Delivery' | 'Credit 7 Days' | 'Bank Transfer Ahead'
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID/CREDIT';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'GCash' | 'Check' | 'Other';

export interface SaleItem {
  grade: EggGradeKey;
  quantityPieces: number;
  quantityTrays: number;
  unitPrice: number;
  priceType: 'piece' | 'tray';
  subtotal: number;
}

export interface FarmSale {
  id: string;
  saleNumber: string;
  date: string;
  orderId?: string; // linked order if applicable
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  balance: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  customerId: string;
  customerName: string;
  saleId?: string;
  accountReceivedInto: 'cash_on_hand' | 'bank_account';
  bankAccountId?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Feed'
  | 'RTL Birds'
  | 'Chicks'
  | 'Medicine & Vitamins'
  | 'Labor & Salaries'
  | 'Water'
  | 'Electricity'
  | 'Transport & Fuel'
  | 'Egg Trays & Packaging'
  | 'Repairs & Maintenance'
  | 'Equipment'
  | 'Permits & Licenses'
  | 'Marketing'
  | 'Other Farm Supplies'
  | 'Miscellaneous';

export interface FarmExpense {
  id: string;
  expenseNumber: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentAccount: 'cash_on_hand' | 'bank_account';
  bankAccountId?: string;
  supplierPayee?: string;
  referenceNumber?: string;
  attachmentName?: string;
  notes?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  maskedAccountNumber: string;
  openingBalance: number;
  currentBalance: number;
  notes?: string;
  createdAt: string;
}

export type DepositType = 'Cash Deposit' | 'Check Deposit' | 'Bank Transfer' | 'Other';

export interface BankDeposit {
  id: string;
  depositNumber: string;
  depositDate: string;
  depositTime?: string;
  bankAccountId: string;
  bankName: string;
  amount: number;
  depositType: DepositType;
  sourceAccount: 'Cash on Hand' | 'Direct Customer Payment' | 'Owner Capital' | 'Other';
  referenceNumber?: string;
  depositSlipNumber?: string;
  branch?: string;
  depositedBy?: string;
  attachmentName?: string;
  notes?: string;
  createdAt: string;
}

export interface InternalTransfer {
  id: string;
  transferNumber: string;
  date: string;
  amount: number;
  fromAccount: 'cash_on_hand' | 'bank_account';
  fromBankAccountId?: string;
  toAccount: 'cash_on_hand' | 'bank_account';
  toBankAccountId?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export type AuditStatus = 'PASSED' | 'WARNING' | 'CRITICAL';

export interface AuditCheckItem {
  id: string;
  category: string;
  title: string;
  status: AuditStatus;
  summary: string;
  details: string;
  recommendation?: string;
}

export interface AuditReport {
  timestamp: string;
  overallStatus: AuditStatus;
  passedCount: number;
  warningCount: number;
  criticalCount: number;
  items: AuditCheckItem[];
}

export type TrashEntityType =
  | 'egg_production'
  | 'flock'
  | 'flock_adjustment'
  | 'feed_item'
  | 'feed_consumption'
  | 'feed_purchase'
  | 'supply_item'
  | 'supply_usage'
  | 'customer'
  | 'order'
  | 'sale'
  | 'payment'
  | 'expense'
  | 'bank_account'
  | 'bank_deposit'
  | 'farm'
  | 'house';

export interface TrashItem {
  id: string;
  originalId: string;
  entityType: TrashEntityType;
  title: string;
  subtitle?: string;
  recordDate?: string;
  deletedAt: string;
  data: any;
}

export type UserRole = 'admin' | 'manager' | 'staff' | 'owner' | 'collector' | 'sales_clerk' | 'auditor';

export interface RolePermissions {
  viewFinancialMetrics: boolean; // Bank balance, Cash on hand, Revenue, Profit/Loss, Expenses
  viewFlockMetrics: boolean;     // Live birds, Mortality, Lay rate %, Production logs
  viewSalesMetrics: boolean;     // Orders, Invoices, Customer balances
  viewInventoryMetrics: boolean; // Egg trays available, Feed stock, Supplies
  canLogProduction: boolean;     // Add egg logs, flock adjustments
  canLogSales: boolean;          // Add orders, sales, payments
  canLogExpenses: boolean;       // Add expenses, feed purchases
  canManageBanking: boolean;     // Bank accounts, deposits, transfers
  canManageSystem: boolean;      // Settings, profile, database reset, trash
  canRunAudits: boolean;         // Record checks, reconciliation
  canManageAccessControl: boolean; // Access Control Panel (Admin only)
  canDeleteRecords: boolean;     // Move items to trash / purge trash
}

export interface RoleConfig {
  id: UserRole;
  title: string;
  badge: string;
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'indigo' | 'slate' | 'rose';
  description: string;
  boundarySummary: string;
  allowedTabs: string[];
  permissions: RolePermissions;
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  phone?: string;
  notes?: string;
  assignedAt: string;
}

export interface RoleCredentials {
  admin: string;
  manager: string;
  staff: string;
}

export type ActionType = 'CREATED' | 'EDITED' | 'DELETED' | 'SWITCH_AUTHORIZED' | 'LOGIN' | 'SETTINGS_CHANGED';

export interface ActivityLog {
  id: string;
  timestamp: string;
  userRole: UserRole;
  userName?: string;
  actionType: ActionType;
  module: string;
  details: string;
}

export interface PriceChangeLog {
  id: string;
  timestamp: string;
  date: string;
  grade: EggGradeKey;
  priceType: 'tray' | 'piece';
  oldPrice: number;
  newPrice: number;
  reason?: string;
  changedBy: string;
}
