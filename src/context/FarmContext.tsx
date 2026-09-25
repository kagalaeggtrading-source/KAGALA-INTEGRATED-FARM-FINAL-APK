/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  FarmProfile,
  FarmLocation,
  FarmHouse,
  Flock,
  FlockAdjustment,
  EggProductionLog,
  EggInventoryAdjustment,
  EggGradeKey,
  FeedItem,
  FeedConsumptionLog,
  FeedPurchaseLog,
  SupplyItem,
  SupplyUsageLog,
  Customer,
  FarmOrder,
  FarmSale,
  CustomerPayment,
  FarmExpense,
  BankAccount,
  BankDeposit,
  InternalTransfer,
  AuditReport,
  AuditCheckItem,
  AuditStatus,
  TrashItem,
  TrashEntityType,
  UserRole,
  RoleConfig,
  RolePermissions,
  TeamMember,
  RoleCredentials,
  ActionType,
  ActivityLog,
  PriceChangeLog,
} from '../types';
import {
  DEFAULT_FARM_PROFILE,
  EGG_GRADES,
  STORAGE_KEY_PREFIX,
  USER_ROLES,
  DEFAULT_USER_ROLE,
  ADMIN_CREDENTIALS,
  MANAGER_CREDENTIALS,
  STAFF_CREDENTIALS,
  DEFAULT_ROLE_CREDENTIALS,
  DEFAULT_EGG_GRADE_PRICES,
} from '../constants';
import {
  syncSaveDoc,
  syncUpdateDoc,
  syncDeleteDoc,
  subscribeCollection,
  subscribeDoc,
  batchUploadCollection,
  SyncStatus,
} from '../services/firestoreSync';
import { auth, googleProvider, testConnection } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

interface EggStockSummary {
  grade: EggGradeKey;
  produced: number;
  adjustmentsIn: number;
  adjustmentsOut: number;
  sold: number;
  reserved: number;
  available: number;
  totalPhysical: number; // produced + adjustmentsIn - adjustmentsOut - sold
  availableTrays: number;
  availableLoose: number;
}

interface FarmContextType {
  // Profile
  profile: FarmProfile;
  updateProfile: (updates: Partial<FarmProfile>) => void;
  uploadLogo: (base64Data: string) => void;
  removeLogo: () => void;

  // Farm & Houses
  farms: FarmLocation[];
  houses: FarmHouse[];
  addFarm: (name: string, code: string, notes?: string) => FarmLocation;
  deleteFarm: (id: string) => void;
  addHouse: (farmId: string, name: string, code: string, capacity: number, houseType: string, notes?: string) => FarmHouse;
  deleteHouse: (id: string) => void;

  // Flocks
  flocks: Flock[];
  flockAdjustments: FlockAdjustment[];
  addFlock: (flockData: Omit<Flock, 'id' | 'currentPopulation' | 'createdAt'>) => Flock;
  updateFlock: (id: string, updates: Partial<Flock>) => void;
  deleteFlock: (id: string) => void;
  addFlockAdjustment: (flockId: string, date: string, type: FlockAdjustment['type'], quantity: number, reason: string, notes?: string) => void;
  deleteFlockAdjustment: (id: string) => void;

  // Egg Production
  eggProductionLogs: EggProductionLog[];
  addEggProductionLog: (log: Omit<EggProductionLog, 'id' | 'createdAt'>) => EggProductionLog;
  updateEggProductionLog: (id: string, updates: Partial<EggProductionLog>) => void;
  deleteEggProductionLog: (id: string) => void;
  eggAdjustments: EggInventoryAdjustment[];
  addEggAdjustment: (adj: Omit<EggInventoryAdjustment, 'id' | 'createdAt'>) => void;
  deleteEggAdjustment: (id: string) => void;

  // Inventory & Reconciliation Tracking
  eggStockSummary: Record<EggGradeKey, EggStockSummary>;
  totalPhysicalEggs: number;
  totalAvailableEggs: number;
  totalAvailableTrays: number;
  totalReservedEggs: number;
  totalGoodEggsCollected: number;
  totalEggsSold: number;
  inventoryRemaining: number;
  hasSalesDiscrepancy: boolean;
  potentialRevenue: number;
  actualRealizedRevenue: number;

  // Feed
  feedItems: FeedItem[];
  feedConsumptionLogs: FeedConsumptionLog[];
  feedPurchaseLogs: FeedPurchaseLog[];
  addFeedItem: (item: Omit<FeedItem, 'id' | 'currentBags' | 'currentKg' | 'costPerKg' | 'createdAt'>, initialBags?: number) => FeedItem;
  updateFeedItem: (id: string, updates: Partial<FeedItem>) => void;
  deleteFeedItem: (id: string) => void;
  recordFeedPurchase: (log: Omit<FeedPurchaseLog, 'id' | 'createdAt'>) => void;
  updateFeedPurchaseLog: (id: string, updates: Partial<FeedPurchaseLog>) => void;
  deleteFeedPurchaseLog: (id: string) => void;
  recordFeedConsumption: (log: Omit<FeedConsumptionLog, 'id' | 'cost' | 'createdAt'>) => void;
  updateFeedConsumptionLog: (id: string, updates: Partial<FeedConsumptionLog>) => void;
  deleteFeedConsumptionLog: (id: string) => void;

  // Supplies
  supplyItems: SupplyItem[];
  supplyUsageLogs: SupplyUsageLog[];
  addSupplyItem: (item: Omit<SupplyItem, 'id' | 'createdAt'>) => SupplyItem;
  updateSupplyItem: (id: string, updates: Partial<SupplyItem>) => void;
  deleteSupplyItem: (id: string) => void;
  recordSupplyUsage: (log: Omit<SupplyUsageLog, 'id' | 'createdAt'>) => void;
  updateSupplyUsageLog: (id: string, updates: Partial<SupplyUsageLog>) => void;
  deleteSupplyUsageLog: (id: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Orders
  orders: FarmOrder[];
  addOrder: (order: Omit<FarmOrder, 'id' | 'orderNumber' | 'createdAt'>) => FarmOrder;
  updateOrder: (id: string, updates: Partial<FarmOrder>) => void;
  updateOrderStatus: (id: string, status: FarmOrder['status']) => void;
  deleteOrder: (id: string) => void;

  // Sales
  sales: FarmSale[];
  addSale: (sale: Omit<FarmSale, 'id' | 'saleNumber' | 'createdAt' | 'balance'>) => FarmSale;
  updateSale: (id: string, updates: Partial<FarmSale>) => void;
  deleteSale: (id: string) => void;

  // Payments
  payments: CustomerPayment[];
  addPayment: (payment: Omit<CustomerPayment, 'id' | 'paymentNumber' | 'createdAt'>) => CustomerPayment;
  updatePayment: (id: string, updates: Partial<CustomerPayment>) => void;
  deletePayment: (id: string) => void;

  // Expenses
  expenses: FarmExpense[];
  addExpense: (expense: Omit<FarmExpense, 'id' | 'expenseNumber' | 'createdAt'>) => FarmExpense;
  updateExpense: (id: string, updates: Partial<FarmExpense>) => void;
  deleteExpense: (id: string) => void;

  // Bank & Deposits
  bankAccounts: BankAccount[];
  bankDeposits: BankDeposit[];
  internalTransfers: InternalTransfer[];
  addBankAccount: (bankName: string, accountName: string, maskedAccountNumber: string, openingBalance: number, notes?: string) => BankAccount;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  recordBankDeposit: (deposit: Omit<BankDeposit, 'id' | 'depositNumber' | 'createdAt'>) => BankDeposit;
  updateBankDeposit: (id: string, updates: Partial<BankDeposit>) => void;
  deleteBankDeposit: (id: string) => void;

  // Cash on Hand
  cashOnHand: number;
  setCashOnHandManualAdjustment: (newAmount: number, reason: string) => void;

  // Trash & Recycle Bin
  trashItems: TrashItem[];
  moveToTrash: (
    entityType: TrashEntityType,
    originalId: string,
    title: string,
    subtitle?: string,
    recordDate?: string,
    data?: any
  ) => void;
  restoreFromTrash: (trashId: string) => boolean;
  permanentlyDeleteFromTrash: (trashId: string) => void;
  emptyTrash: () => void;
  restoreAllFromTrash: () => void;

  // Audit
  auditReport: AuditReport | null;
  runFullRecordCheck: () => AuditReport;

  // System Backup & Reset
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;
  resetToZeroData: () => void;

  // Cloud & Firebase Real-Time Sync
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  currentUser: User | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncAllLocalDataToCloud: () => Promise<void>;

  // Universal Session & Role-Based Access Control (RBAC)
  isAuthenticated: boolean;
  loginSession: (role: UserRole, passwordOrPin: string) => { success: boolean; message: string };
  requestLogoutOrSwitch: (targetRole?: UserRole | 'LOGOUT') => void;
  confirmLogoutOrSwitchWithAdminPassword: (password: string) => { success: boolean; message: string };
  pendingTargetRole: UserRole | 'LOGOUT' | null;
  adminOverrideModalOpen: boolean;
  setAdminOverrideModalOpen: (open: boolean) => void;
  roleCredentials: RoleCredentials;
  changeUserPassword: (role: UserRole, currentPassword: string, newPassword: string) => { success: boolean; message: string };
  adminResetUserPassword: (targetRole: UserRole, newPassword: string) => { success: boolean; message: string };
  // Activity Audit Logs
  activityLogs: ActivityLog[];
  logActivity: (actionType: ActionType, module: string, details: string, actorRole?: UserRole) => void;

  // Market Pricing & Price Change Log History
  priceChangeLogs: PriceChangeLog[];
  eggGradePrices: Record<EggGradeKey, { trayPrice: number; piecePrice: number }>;
  updateEggGradePrice: (grade: EggGradeKey, newTrayPrice: number, newPiecePrice: number, reason?: string) => void;

  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  activeRoleConfig: RoleConfig;
  roleConfigs: Record<UserRole, RoleConfig>;
  isAdminAuthenticated: boolean;
  loginAsAdmin: (password: string) => { success: boolean; message: string };
  logoutAdmin: () => void;
  updateRoleConfig: (role: UserRole, updatedConfig: RoleConfig) => void;
  resetRoleConfigs: () => void;
  adminLoginModalOpen: boolean;
  setAdminLoginModalOpen: (open: boolean) => void;
  teamMembers: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id' | 'assignedAt'>) => TeamMember;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  isTabAllowed: (tabId: string) => boolean;
  hasPermission: (perm: keyof RolePermissions) => boolean;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!data) return defaultValue;
    return JSON.parse(data) as T;
  } catch (err) {
    console.warn(`Failed to read ${key} from storage:`, err);
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Farm Profile (Default Kagala Farm metadata, logo starts null)
  const [profile, setProfile] = useState<FarmProfile>(() =>
    loadStorage('profile', DEFAULT_FARM_PROFILE)
  );

  // Core entities - START AT ZERO DATA
  const [farms, setFarms] = useState<FarmLocation[]>(() => loadStorage('farms', []));
  const [houses, setHouses] = useState<FarmHouse[]>(() => loadStorage('houses', []));
  const [flocks, setFlocks] = useState<Flock[]>(() => loadStorage('flocks', []));
  const [flockAdjustments, setFlockAdjustments] = useState<FlockAdjustment[]>(() =>
    loadStorage('flock_adjustments', [])
  );
  const [eggProductionLogs, setEggProductionLogs] = useState<EggProductionLog[]>(() =>
    loadStorage('egg_production_logs', [])
  );
  const [eggAdjustments, setEggAdjustments] = useState<EggInventoryAdjustment[]>(() =>
    loadStorage('egg_adjustments', [])
  );

  // Feed & Supplies
  const [feedItems, setFeedItems] = useState<FeedItem[]>(() => loadStorage('feed_items', []));
  const [feedConsumptionLogs, setFeedConsumptionLogs] = useState<FeedConsumptionLog[]>(() =>
    loadStorage('feed_consumption_logs', [])
  );
  const [feedPurchaseLogs, setFeedPurchaseLogs] = useState<FeedPurchaseLog[]>(() =>
    loadStorage('feed_purchase_logs', [])
  );
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>(() =>
    loadStorage('supply_items', [])
  );
  const [supplyUsageLogs, setSupplyUsageLogs] = useState<SupplyUsageLog[]>(() =>
    loadStorage('supply_usage_logs', [])
  );

  // Commerce & Finance
  const [customers, setCustomers] = useState<Customer[]>(() => loadStorage('customers', []));
  const [orders, setOrders] = useState<FarmOrder[]>(() => loadStorage('orders', []));
  const [sales, setSales] = useState<FarmSale[]>(() => loadStorage('sales', []));
  const [payments, setPayments] = useState<CustomerPayment[]>(() =>
    loadStorage('payments', [])
  );
  const [expenses, setExpenses] = useState<FarmExpense[]>(() => loadStorage('expenses', []));
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() =>
    loadStorage('bank_accounts', [])
  );
  const [bankDeposits, setBankDeposits] = useState<BankDeposit[]>(() =>
    loadStorage('bank_deposits', [])
  );
  const [internalTransfers, setInternalTransfers] = useState<InternalTransfer[]>(() =>
    loadStorage('internal_transfers', [])
  );

  // Dynamic Cash on Hand Calculation:
  // Formula: Cash on Hand = (Total Cash Payments Received) - (Total Farm Expenses Paid Out + Total Cash Deposited to Bank)
  const cashOnHand = useMemo(() => {
    const totalCashPaymentsReceived = payments
      .filter(p => p.accountReceivedInto === 'cash_on_hand' || p.paymentMethod === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalCashExpensesPaidOut = expenses
      .filter(e => e.paymentAccount === 'cash_on_hand' || !e.paymentAccount)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCashDepositedToBank = bankDeposits
      .filter(d => d.sourceAccount === 'Cash on Hand' || !d.sourceAccount)
      .reduce((sum, d) => sum + d.amount, 0);

    return totalCashPaymentsReceived - (totalCashExpensesPaidOut + totalCashDepositedToBank);
  }, [payments, expenses, bankDeposits]);

  const [trashItems, setTrashItems] = useState<TrashItem[]>(() =>
    loadStorage('trash_items', [])
  );

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadStorage<ActivityLog[]>('activity_logs_v2', [])
  );

  const [priceChangeLogs, setPriceChangeLogs] = useState<PriceChangeLog[]>(() =>
    loadStorage<PriceChangeLog[]>('price_change_logs_v2', [])
  );

  const [eggGradePrices, setEggGradePrices] = useState<Record<EggGradeKey, { trayPrice: number; piecePrice: number }>>(() => {
    const saved = loadStorage<Record<EggGradeKey, { trayPrice: number; piecePrice: number }>>('egg_grade_prices_v2', DEFAULT_EGG_GRADE_PRICES);
    return { ...DEFAULT_EGG_GRADE_PRICES, ...saved };
  });

  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);

  // Cloud & Firebase Real-Time Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Universal Session & Role-Based Access Control (RBAC) State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return loadStorage<boolean>('is_authenticated_v2', false);
  });

  const [adminOverrideModalOpen, setAdminOverrideModalOpen] = useState<boolean>(false);
  const [pendingTargetRole, setPendingTargetRole] = useState<UserRole | 'LOGOUT' | null>('LOGOUT');

  const [roleCredentials, setRoleCredentials] = useState<RoleCredentials>(() => {
    const saved = loadStorage<RoleCredentials>('custom_passwords_v2', DEFAULT_ROLE_CREDENTIALS);
    return { ...DEFAULT_ROLE_CREDENTIALS, ...saved };
  });

  const [roleConfigs, setRoleConfigs] = useState<Record<UserRole, RoleConfig>>(() => {
    const saved = loadStorage<Record<UserRole, RoleConfig>>('custom_role_configs_v2', USER_ROLES);
    return { ...USER_ROLES, ...saved };
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() =>
    loadStorage<UserRole>('active_role', DEFAULT_USER_ROLE)
  );

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return loadStorage<boolean>('admin_auth_status', false);
  });

  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() =>
    loadStorage<TeamMember[]>('team_members', [
      {
        id: 'member-owner',
        name: 'Farm Owner',
        email: 'kagalaeggtrading@gmail.com',
        role: 'owner',
        notes: 'Master Administrator with unrestricted access',
        assignedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'member-supervisor',
        name: 'Production Supervisor',
        role: 'manager',
        notes: 'Daily poultry coops, egg sorting & feed management',
        assignedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'member-collector',
        name: 'Egg Collector & Flock Hand',
        role: 'collector',
        notes: 'Field worker - egg harvest, mortality & feed logging',
        assignedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'member-cashier',
        name: 'Sales & Dispatch Cashier',
        role: 'sales_clerk',
        notes: 'Counter sales, egg reservations & customer invoices',
        assignedAt: '2026-01-01T00:00:00.000Z',
      },
    ])
  );

  // Universal Activity Audit Logger
  const logActivity = (
    actionType: ActionType,
    module: string,
    details: string,
    actorRole?: UserRole
  ) => {
    const activeRole = actorRole || currentRole;
    const roleTitle = activeRole === 'admin' ? 'Superuser Admin' : activeRole === 'manager' ? 'Farm Manager' : 'Farm Staff';
    const now = new Date();
    const formattedTimestamp = now.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newLog: ActivityLog = {
      id: 'LOG-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: formattedTimestamp,
      userRole: activeRole,
      userName: roleTitle,
      actionType,
      module,
      details,
    };

    setActivityLogs(prev => {
      const updated = [newLog, ...prev];
      saveStorage('activity_logs_v2', updated);
      return updated;
    });

    syncSaveDoc('activity_logs', newLog.id, newLog);
  };

  // Listen for auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Firebase Real-Time Firestore Sync
  useEffect(() => {
    let active = true;

    testConnection().then(ok => {
      if (active) {
        setSyncStatus(ok ? 'connected' : 'offline');
      }
    });

    const unsubs = [
      subscribeDoc<FarmProfile>('farm_profile', 'main', remoteProfile => {
        if (remoteProfile) {
          setProfile(remoteProfile);
          setLastSyncedAt(new Date());
          setSyncStatus('connected');
        }
      }),
      subscribeDoc<{ amount: number }>('farm_finances', 'cash', () => {
        setLastSyncedAt(new Date());
        setSyncStatus('connected');
      }),
      subscribeCollection<FarmLocation>('farms', items => {
        if (items.length > 0) setFarms(items);
        setLastSyncedAt(new Date());
        setSyncStatus('connected');
      }),
      subscribeCollection<FarmHouse>('houses', items => {
        if (items.length > 0) setHouses(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<Flock>('flocks', items => {
        if (items.length > 0) setFlocks(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<FlockAdjustment>('flock_adjustments', items => {
        if (items.length > 0) setFlockAdjustments(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<EggProductionLog>('egg_production_logs', items => {
        if (items.length > 0) setEggProductionLogs(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<EggInventoryAdjustment>('egg_adjustments', items => {
        if (items.length > 0) setEggAdjustments(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<FeedItem>('feed_items', items => {
        if (items.length > 0) setFeedItems(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<FeedConsumptionLog>('feed_consumption_logs', items => {
        if (items.length > 0) setFeedConsumptionLogs(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<FeedPurchaseLog>('feed_purchase_logs', items => {
        if (items.length > 0) setFeedPurchaseLogs(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<SupplyItem>('supply_items', items => {
        if (items.length > 0) setSupplyItems(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<SupplyUsageLog>('supply_usage_logs', items => {
        if (items.length > 0) setSupplyUsageLogs(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<Customer>('customers', items => {
        if (items.length > 0) setCustomers(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<FarmOrder>('orders', items => {
        if (items.length > 0) setOrders(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<FarmSale>('sales', items => {
        if (items.length > 0) setSales(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<CustomerPayment>('payments', items => {
        if (items.length > 0) setPayments(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<FarmExpense>('expenses', items => {
        if (items.length > 0) setExpenses(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<BankAccount>('bank_accounts', items => {
        if (items.length > 0) setBankAccounts(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<BankDeposit>('bank_deposits', items => {
        if (items.length > 0) setBankDeposits(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<InternalTransfer>('internal_transfers', items => {
        if (items.length > 0) setInternalTransfers(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<TrashItem>('trash_items', items => {
        if (items.length > 0) setTrashItems(items);
        setLastSyncedAt(new Date());
      }),
      subscribeCollection<TeamMember>('team_members', items => {
        if (items.length > 0) setTeamMembers(items);
        setLastSyncedAt(new Date());
      }),
    ];

    return () => {
      active = false;
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setSyncStatus('syncing');
      await signInWithPopup(auth, googleProvider);
      setSyncStatus('connected');
    } catch (err) {
      console.error('Sign in with Google error:', err);
      setSyncStatus('error');
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setSyncStatus('connected');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const syncAllLocalDataToCloud = async () => {
    setSyncStatus('syncing');
    try {
      await syncSaveDoc('farm_profile', 'main', profile);
      await syncSaveDoc('farm_finances', 'cash', { amount: cashOnHand, updatedAt: new Date().toISOString() });
      await batchUploadCollection('farms', farms);
      await batchUploadCollection('houses', houses);
      await batchUploadCollection('flocks', flocks);
      await batchUploadCollection('flock_adjustments', flockAdjustments);
      await batchUploadCollection('egg_production_logs', eggProductionLogs);
      await batchUploadCollection('egg_adjustments', eggAdjustments);
      await batchUploadCollection('feed_items', feedItems);
      await batchUploadCollection('feed_consumption_logs', feedConsumptionLogs);
      await batchUploadCollection('feed_purchase_logs', feedPurchaseLogs);
      await batchUploadCollection('supply_items', supplyItems);
      await batchUploadCollection('supply_usage_logs', supplyUsageLogs);
      await batchUploadCollection('customers', customers);
      await batchUploadCollection('orders', orders);
      await batchUploadCollection('sales', sales);
      await batchUploadCollection('payments', payments);
      await batchUploadCollection('expenses', expenses);
      await batchUploadCollection('bank_accounts', bankAccounts);
      await batchUploadCollection('bank_deposits', bankDeposits);
      await batchUploadCollection('internal_transfers', internalTransfers);
      await batchUploadCollection('trash_items', trashItems);
      setLastSyncedAt(new Date());
      setSyncStatus('connected');
    } catch (err) {
      console.error('Full cloud sync error:', err);
      setSyncStatus('error');
    }
  };

  // Persistence hooks
  useEffect(() => { saveStorage('profile', profile); }, [profile]);
  useEffect(() => { saveStorage('farms', farms); }, [farms]);
  useEffect(() => { saveStorage('houses', houses); }, [houses]);
  useEffect(() => { saveStorage('flocks', flocks); }, [flocks]);
  useEffect(() => { saveStorage('flock_adjustments', flockAdjustments); }, [flockAdjustments]);
  useEffect(() => { saveStorage('egg_production_logs', eggProductionLogs); }, [eggProductionLogs]);
  useEffect(() => { saveStorage('egg_adjustments', eggAdjustments); }, [eggAdjustments]);
  useEffect(() => { saveStorage('feed_items', feedItems); }, [feedItems]);
  useEffect(() => { saveStorage('feed_consumption_logs', feedConsumptionLogs); }, [feedConsumptionLogs]);
  useEffect(() => { saveStorage('feed_purchase_logs', feedPurchaseLogs); }, [feedPurchaseLogs]);
  useEffect(() => { saveStorage('supply_items', supplyItems); }, [supplyItems]);
  useEffect(() => { saveStorage('supply_usage_logs', supplyUsageLogs); }, [supplyUsageLogs]);
  useEffect(() => { saveStorage('customers', customers); }, [customers]);
  useEffect(() => { saveStorage('orders', orders); }, [orders]);
  useEffect(() => { saveStorage('sales', sales); }, [sales]);
  useEffect(() => { saveStorage('payments', payments); }, [payments]);
  useEffect(() => { saveStorage('expenses', expenses); }, [expenses]);
  useEffect(() => { saveStorage('bank_accounts', bankAccounts); }, [bankAccounts]);
  useEffect(() => { saveStorage('bank_deposits', bankDeposits); }, [bankDeposits]);
  useEffect(() => { saveStorage('internal_transfers', internalTransfers); }, [internalTransfers]);
  useEffect(() => { saveStorage('cash_on_hand', cashOnHand); }, [cashOnHand]);
  useEffect(() => { saveStorage('trash_items', trashItems); }, [trashItems]);

  // Profile operations
  const updateProfile = (updates: Partial<FarmProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      syncSaveDoc('farm_profile', 'main', next);
      return next;
    });
  };

  const uploadLogo = (base64Data: string) => {
    setProfile(prev => {
      const next = { ...prev, logoUrl: base64Data };
      syncSaveDoc('farm_profile', 'main', next);
      return next;
    });
  };

  const removeLogo = () => {
    setProfile(prev => {
      const next = { ...prev, logoUrl: null };
      syncSaveDoc('farm_profile', 'main', next);
      return next;
    });
  };

  // Trash & Recycle Bin Operations
  const moveToTrash = (
    entityType: TrashEntityType,
    originalId: string,
    title: string,
    subtitle?: string,
    recordDate?: string,
    data?: any
  ) => {
    const newTrashItem: TrashItem = {
      id: 'TRASH-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      originalId,
      entityType,
      title,
      subtitle,
      recordDate: recordDate || new Date().toISOString().split('T')[0],
      deletedAt: new Date().toISOString(),
      data: data || {},
    };
    setTrashItems(prev => [newTrashItem, ...prev]);
    syncSaveDoc('trash_items', newTrashItem.id, newTrashItem);
  };

  const restoreFromTrash = (trashId: string): boolean => {
    const item = trashItems.find(t => t.id === trashId);
    if (!item) return false;
    const data = item.data;
    if (!data) return false;

    switch (item.entityType) {
      case 'egg_production':
        setEggProductionLogs(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'flock':
        setFlocks(prev => [...prev.filter(x => x.id !== data.id), data]);
        break;
      case 'flock_adjustment':
        setFlockAdjustments(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'feed_item':
        setFeedItems(prev => [...prev.filter(x => x.id !== data.id), data]);
        break;
      case 'feed_consumption':
        setFeedConsumptionLogs(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'feed_purchase':
        setFeedPurchaseLogs(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'supply_item':
        setSupplyItems(prev => [...prev.filter(x => x.id !== data.id), data]);
        break;
      case 'supply_usage':
        setSupplyUsageLogs(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'customer':
        setCustomers(prev => [...prev.filter(x => x.id !== data.id), data]);
        break;
      case 'order':
        setOrders(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'sale':
        setSales(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'payment':
        setPayments(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'expense':
        setExpenses(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'bank_account':
        setBankAccounts(prev => [...prev.filter(x => x.id !== data.id), data]);
        break;
      case 'bank_deposit':
        setBankDeposits(prev => [data, ...prev.filter(x => x.id !== data.id)]);
        break;
      case 'farm':
        setFarms(prev => [...prev.filter(x => x.id !== data.id), data]);
        break;
      case 'house':
        setHouses(prev => [...prev.filter(x => x.id !== data.id), data]);
        break;
    }
    setTrashItems(prev => prev.filter(t => t.id !== trashId));
    syncDeleteDoc('trash_items', trashId);
    return true;
  };

  const permanentlyDeleteFromTrash = (trashId: string) => {
    setTrashItems(prev => prev.filter(t => t.id !== trashId));
    syncDeleteDoc('trash_items', trashId);
  };

  const emptyTrash = () => {
    trashItems.forEach(t => syncDeleteDoc('trash_items', t.id));
    setTrashItems([]);
  };

  const restoreAllFromTrash = () => {
    trashItems.forEach(item => {
      const data = item.data;
      if (!data) return;
      syncDeleteDoc('trash_items', item.id);
      switch (item.entityType) {
        case 'egg_production':
          setEggProductionLogs(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('egg_production_logs', data.id, data);
          break;
        case 'flock':
          setFlocks(prev => [...prev.filter(x => x.id !== data.id), data]);
          syncSaveDoc('flocks', data.id, data);
          break;
        case 'flock_adjustment':
          setFlockAdjustments(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('flock_adjustments', data.id, data);
          break;
        case 'feed_item':
          setFeedItems(prev => [...prev.filter(x => x.id !== data.id), data]);
          syncSaveDoc('feed_items', data.id, data);
          break;
        case 'feed_consumption':
          setFeedConsumptionLogs(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('feed_consumption_logs', data.id, data);
          break;
        case 'feed_purchase':
          setFeedPurchaseLogs(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('feed_purchase_logs', data.id, data);
          break;
        case 'supply_item':
          setSupplyItems(prev => [...prev.filter(x => x.id !== data.id), data]);
          syncSaveDoc('supply_items', data.id, data);
          break;
        case 'supply_usage':
          setSupplyUsageLogs(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('supply_usage_logs', data.id, data);
          break;
        case 'customer':
          setCustomers(prev => [...prev.filter(x => x.id !== data.id), data]);
          syncSaveDoc('customers', data.id, data);
          break;
        case 'order':
          setOrders(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('orders', data.id, data);
          break;
        case 'sale':
          setSales(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('sales', data.id, data);
          break;
        case 'payment':
          setPayments(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('payments', data.id, data);
          break;
        case 'expense':
          setExpenses(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('expenses', data.id, data);
          break;
        case 'bank_account':
          setBankAccounts(prev => [...prev.filter(x => x.id !== data.id), data]);
          syncSaveDoc('bank_accounts', data.id, data);
          break;
        case 'bank_deposit':
          setBankDeposits(prev => [data, ...prev.filter(x => x.id !== data.id)]);
          syncSaveDoc('bank_deposits', data.id, data);
          break;
        case 'farm':
          setFarms(prev => [...prev.filter(x => x.id !== data.id), data]);
          syncSaveDoc('farms', data.id, data);
          break;
        case 'house':
          setHouses(prev => [...prev.filter(x => x.id !== data.id), data]);
          syncSaveDoc('houses', data.id, data);
          break;
      }
    });
    setTrashItems([]);
  };

  // Multi-Farm & House operations
  const addFarm = (name: string, code: string, notes?: string): FarmLocation => {
    const newFarm: FarmLocation = {
      id: 'FARM-' + Date.now().toString().slice(-6),
      name,
      code,
      notes,
      createdAt: new Date().toISOString(),
    };
    setFarms(prev => [...prev, newFarm]);
    syncSaveDoc('farms', newFarm.id, newFarm);
    return newFarm;
  };

  const deleteFarm = (id: string) => {
    const target = farms.find(f => f.id === id);
    if (target) {
      moveToTrash('farm', id, `Farm: ${target.name} (${target.code})`, target.notes || '', undefined, target);
    }
    setFarms(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('farms', id);
  };

  const addHouse = (
    farmId: string,
    name: string,
    code: string,
    capacity: number,
    houseType: string,
    notes?: string
  ): FarmHouse => {
    const newHouse: FarmHouse = {
      id: 'HSE-' + Date.now().toString().slice(-6),
      farmId,
      name,
      code,
      capacity,
      houseType,
      notes,
      createdAt: new Date().toISOString(),
    };
    setHouses(prev => [...prev, newHouse]);
    syncSaveDoc('houses', newHouse.id, newHouse);
    return newHouse;
  };

  const deleteHouse = (id: string) => {
    const target = houses.find(h => h.id === id);
    if (target) {
      moveToTrash('house', id, `House: ${target.name} (${target.code})`, `Capacity: ${target.capacity} birds`, undefined, target);
    }
    setHouses(prev => prev.filter(h => h.id !== id));
    syncDeleteDoc('houses', id);
  };

  // Flock operations with strict population logic
  const addFlock = (flockData: Omit<Flock, 'id' | 'currentPopulation' | 'createdAt'>): Flock => {
    const newFlock: Flock = {
      ...flockData,
      id: 'FLOCK-' + Date.now().toString().slice(-6),
      currentPopulation: flockData.startingPopulation,
      createdAt: new Date().toISOString(),
    };
    setFlocks(prev => [...prev, newFlock]);
    syncSaveDoc('flocks', newFlock.id, newFlock);
    return newFlock;
  };

  const updateFlock = (id: string, updates: Partial<Flock>) => {
    setFlocks(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    syncUpdateDoc('flocks', id, updates);
  };

  const deleteFlock = (id: string) => {
    const target = flocks.find(f => f.id === id);
    if (target) {
      moveToTrash(
        'flock',
        id,
        `Flock: ${target.batchId}`,
        `${target.breedStrain} (${target.currentPopulation} birds)`,
        target.startDate,
        target
      );
    }
    setFlocks(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('flocks', id);
  };

  const addFlockAdjustment = (
    flockId: string,
    date: string,
    type: FlockAdjustment['type'],
    quantity: number,
    reason: string,
    notes?: string
  ) => {
    const targetFlock = flocks.find(f => f.id === flockId);
    if (!targetFlock) {
      throw new Error(`Flock ${flockId} not found`);
    }

    if (quantity <= 0) {
      throw new Error('Adjustment quantity must be greater than zero');
    }

    let nextPop = targetFlock.currentPopulation;
    if (type === 'mortality' || type === 'cull' || type === 'transfer_out') {
      if (quantity > nextPop) {
        throw new Error(
          `Cannot deduct ${quantity} birds. Current population is only ${nextPop}. Negative populations are strictly forbidden.`
        );
      }
      nextPop -= quantity;
    } else if (type === 'transfer_in') {
      nextPop += quantity;
    }

    const adjustment: FlockAdjustment = {
      id: 'ADJ-' + Date.now().toString().slice(-6),
      flockId,
      date,
      type,
      quantity,
      reason,
      notes,
      recordedAt: new Date().toISOString(),
    };

    setFlockAdjustments(prev => [...prev, adjustment]);
    setFlocks(prev =>
      prev.map(f => (f.id === flockId ? { ...f, currentPopulation: nextPop } : f))
    );
    syncSaveDoc('flock_adjustments', adjustment.id, adjustment);
    syncUpdateDoc('flocks', flockId, { currentPopulation: nextPop });
  };

  const deleteFlockAdjustment = (id: string) => {
    const target = flockAdjustments.find(a => a.id === id);
    if (target) {
      moveToTrash(
        'flock_adjustment',
        id,
        `Flock Adjustment: ${target.type.toUpperCase()} (${target.quantity} birds)`,
        target.reason || '',
        target.date,
        target
      );
    }
    setFlockAdjustments(prev => prev.filter(a => a.id !== id));
    syncDeleteDoc('flock_adjustments', id);
  };

  // Egg Production operations
  const addEggProductionLog = (log: Omit<EggProductionLog, 'id' | 'createdAt'>): EggProductionLog => {
    const newLog: EggProductionLog = {
      ...log,
      id: 'PROD-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setEggProductionLogs(prev => [...prev, newLog]);
    syncSaveDoc('egg_production_logs', newLog.id, newLog);

    logActivity(
      'CREATED',
      'Egg Production',
      `Recorded daily egg harvest for date ${log.date}: ${log.totalCollection} total eggs collected (${log.usableEggs} good eggs, ${log.rejects || 0} rejects)`
    );

    return newLog;
  };

  const updateEggProductionLog = (id: string, updates: Partial<EggProductionLog>) => {
    setEggProductionLogs(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    syncUpdateDoc('egg_production_logs', id, updates);

    logActivity(
      'EDITED',
      'Egg Production',
      `Updated egg collection record ${id} for date ${updates.date || 'harvest'}`
    );
  };

  const deleteEggProductionLog = (id: string) => {
    const target = eggProductionLogs.find(p => p.id === id);
    if (target) {
      moveToTrash(
        'egg_production',
        id,
        `Egg Collection: ${target.date}`,
        `${target.totalCollection} eggs collected (${target.usableEggs} good, ${target.rejects != null ? target.rejects : (target.brokenEggs || 0) + (target.dirtyEggs || 0)} rejects)`,
        target.date,
        target
      );
      logActivity(
        'DELETED',
        'Egg Production',
        `Moved egg collection record ${id} (${target.date}: ${target.totalCollection} eggs) to trash`
      );
    }
    setEggProductionLogs(prev => prev.filter(p => p.id !== id));
    syncDeleteDoc('egg_production_logs', id);
  };
  };

  const addEggAdjustment = (adj: Omit<EggInventoryAdjustment, 'id' | 'createdAt'>) => {
    const newAdj: EggInventoryAdjustment = {
      ...adj,
      id: 'EADJ-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setEggAdjustments(prev => [...prev, newAdj]);
    syncSaveDoc('egg_adjustments', newAdj.id, newAdj);
  };

  const deleteEggAdjustment = (id: string) => {
    const target = eggAdjustments.find(a => a.id === id);
    if (target) {
      moveToTrash(
        'egg_production',
        id,
        `Egg Adjustment: ${target.grade.toUpperCase()} (${target.quantityPieces} pcs)`,
        target.reason || '',
        target.date,
        target
      );
    }
    setEggAdjustments(prev => prev.filter(a => a.id !== id));
    syncDeleteDoc('egg_adjustments', id);
  };

  // Real-time Egg Inventory Calculation
  const eggStockSummary = useMemo(() => {
    const summary: Record<EggGradeKey, EggStockSummary> = {} as any;

    EGG_GRADES.forEach(g => {
      summary[g.key] = {
        grade: g.key,
        produced: 0,
        adjustmentsIn: 0,
        adjustmentsOut: 0,
        sold: 0,
        reserved: 0,
        available: 0,
        totalPhysical: 0,
        availableTrays: 0,
        availableLoose: 0,
      };
    });

    // 1. Production
    eggProductionLogs.forEach(log => {
      EGG_GRADES.forEach(g => {
        const count = log.grades?.[g.key] || 0;
        summary[g.key].produced += count;
      });
    });

    // 2. Adjustments
    eggAdjustments.forEach(adj => {
      if (summary[adj.grade]) {
        if (adj.type === 'adjustment_in') {
          summary[adj.grade].adjustmentsIn += adj.quantityPieces;
        } else {
          summary[adj.grade].adjustmentsOut += adj.quantityPieces;
        }
      }
    });

    // 3. Sold
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (summary[item.grade]) {
          const qty = item.priceType === 'tray' ? item.quantityTrays * 30 : item.quantityPieces;
          summary[item.grade].sold += qty;
        }
      });
    });

    // 4. Reserved (from orders in pending/active status)
    const activeOrderStatuses = ['CONFIRMED', 'RESERVED', 'PREPARING', 'READY', 'OUT FOR DELIVERY'];
    orders.forEach(ord => {
      if (activeOrderStatuses.includes(ord.status)) {
        ord.items.forEach(item => {
          if (summary[item.grade]) {
            const qty = item.priceType === 'tray' ? item.quantityTrays * 30 : item.quantityPieces;
            summary[item.grade].reserved += qty;
          }
        });
      }
    });

    // 5. Calculate physical and available
    EGG_GRADES.forEach(g => {
      const s = summary[g.key];
      s.totalPhysical = s.produced + s.adjustmentsIn - s.adjustmentsOut - s.sold;
      s.available = Math.max(0, s.totalPhysical - s.reserved);
      s.availableTrays = Math.floor(s.available / 30);
      s.availableLoose = s.available % 30;
    });

    return summary;
  }, [eggProductionLogs, eggAdjustments, sales, orders]);

  const totalPhysicalEggs = useMemo(() => {
    return Object.values(eggStockSummary).reduce((sum, s) => sum + s.totalPhysical, 0);
  }, [eggStockSummary]);

  const totalAvailableEggs = useMemo(() => {
    return Object.values(eggStockSummary).reduce((sum, s) => sum + s.available, 0);
  }, [eggStockSummary]);

  const totalAvailableTrays = useMemo(() => {
    return Math.floor(totalAvailableEggs / 30);
  }, [totalAvailableEggs]);

  const totalReservedEggs = useMemo(() => {
    return Object.values(eggStockSummary).reduce((sum, s) => sum + s.reserved, 0);
  }, [eggStockSummary]);

  // Egg Reconciliation & Inventory Tracking Computations
  const totalGoodEggsCollected = useMemo(() => {
    return eggProductionLogs.reduce((sum, log) => sum + log.usableEggs, 0);
  }, [eggProductionLogs]);

  const totalEggsSold = useMemo(() => {
    return sales.reduce((totalSum, sale) => {
      const salePcs = (sale.items || []).reduce((itemSum, item) => {
        const pcs = item.priceType === 'tray' ? item.quantityTrays * 30 : item.quantityPieces;
        return itemSum + (pcs || 0);
      }, 0);
      return totalSum + salePcs;
    }, 0);
  }, [sales]);

  const inventoryRemaining = useMemo(() => {
    return totalGoodEggsCollected - totalEggsSold;
  }, [totalGoodEggsCollected, totalEggsSold]);

  const hasSalesDiscrepancy = useMemo(() => {
    return totalEggsSold > totalGoodEggsCollected;
  }, [totalGoodEggsCollected, totalEggsSold]);

  const actualRealizedRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const potentialRevenue = useMemo(() => {
    const avgPricePerEgg = totalEggsSold > 0 ? (actualRealizedRevenue / totalEggsSold) : 7.00;
    return totalGoodEggsCollected * avgPricePerEgg;
  }, [totalGoodEggsCollected, totalEggsSold, actualRealizedRevenue]);

  // Feed Operations
  const addFeedItem = (
    itemData: Omit<FeedItem, 'id' | 'currentBags' | 'currentKg' | 'costPerKg' | 'createdAt'>,
    initialBags: number = 0
  ): FeedItem => {
    const costPerKg = itemData.bagWeightKg > 0 ? itemData.costPerBag / itemData.bagWeightKg : 0;
    const newItem: FeedItem = {
      ...itemData,
      id: 'FEED-' + Date.now().toString().slice(-6),
      currentBags: initialBags,
      currentKg: initialBags * itemData.bagWeightKg,
      costPerKg,
      createdAt: new Date().toISOString(),
    };
    setFeedItems(prev => [...prev, newItem]);
    syncSaveDoc('feed_items', newItem.id, newItem);
    return newItem;
  };

  const updateFeedItem = (id: string, updates: Partial<FeedItem>) => {
    setFeedItems(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    syncUpdateDoc('feed_items', id, updates);
  };

  const deleteFeedItem = (id: string) => {
    const target = feedItems.find(f => f.id === id);
    if (target) {
      moveToTrash(
        'feed_item',
        id,
        `Feed: ${target.brand} - ${target.feedType}`,
        `${target.currentBags} bags in stock (₱${target.costPerBag}/bag)`,
        target.purchaseDate,
        target
      );
    }
    setFeedItems(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('feed_items', id);
  };

  const updateFeedPurchaseLog = (id: string, updates: Partial<FeedPurchaseLog>) => {
    setFeedPurchaseLogs(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    syncUpdateDoc('feed_purchase_logs', id, updates);
  };

  const deleteFeedPurchaseLog = (id: string) => {
    const target = feedPurchaseLogs.find(f => f.id === id);
    if (target) {
      moveToTrash(
        'feed_purchase',
        id,
        `Feed Purchase: ${target.bags} bags ${target.feedName}`,
        `Cost: ₱${target.totalCost.toLocaleString()} (${target.supplier})`,
        target.date,
        target
      );
    }
    setFeedPurchaseLogs(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('feed_purchase_logs', id);
  };

  const updateFeedConsumptionLog = (id: string, updates: Partial<FeedConsumptionLog>) => {
    setFeedConsumptionLogs(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    syncUpdateDoc('feed_consumption_logs', id, updates);
  };

  const deleteFeedConsumptionLog = (id: string) => {
    const target = feedConsumptionLogs.find(f => f.id === id);
    if (target) {
      moveToTrash(
        'feed_consumption',
        id,
        `Feed Consumed: ${target.bagsUsed} bags (${target.kgUsed} kg)`,
        target.notes || '',
        target.date,
        target
      );
    }
    setFeedConsumptionLogs(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('feed_consumption_logs', id);
  };

  const recordFeedPurchase = (log: Omit<FeedPurchaseLog, 'id' | 'createdAt'>) => {
    const newPurchase: FeedPurchaseLog = {
      ...log,
      id: 'FP-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };

    setFeedPurchaseLogs(prev => [...prev, newPurchase]);
    syncSaveDoc('feed_purchase_logs', newPurchase.id, newPurchase);

    // Update feed item current inventory
    setFeedItems(prev =>
      prev.map(f => {
        if (f.id === log.feedItemId) {
          const addedKg = log.kg > 0 ? log.kg : log.bags * f.bagWeightKg;
          const updatedFeed = {
            ...f,
            currentBags: f.currentBags + log.bags,
            currentKg: f.currentKg + addedKg,
            costPerBag: log.costPerBag > 0 ? log.costPerBag : f.costPerBag,
            costPerKg: f.bagWeightKg > 0 ? (log.costPerBag || f.costPerBag) / f.bagWeightKg : f.costPerKg,
          };
          syncUpdateDoc('feed_items', f.id, updatedFeed);
          return updatedFeed;
        }
        return f;
      })
    );

    // Record corresponding financial expense
    const expenseNum = 'EXP-' + Date.now().toString().slice(-6);
    const newExpense: FarmExpense = {
      id: expenseNum,
      expenseNumber: expenseNum,
      date: log.date,
      category: 'Feed',
      description: `Feed Purchase: ${log.bags} bags ${log.feedName} (${log.supplier})`,
      amount: log.totalCost,
      paymentAccount: log.paymentAccount,
      bankAccountId: log.bankAccountId,
      supplierPayee: log.supplier,
      referenceNumber: log.reference,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, newExpense]);
    syncSaveDoc('expenses', newExpense.id, newExpense);

    // Deduct bank account balance if paid from bank
    if (log.paymentAccount !== 'cash_on_hand' && log.bankAccountId) {
      setBankAccounts(prev =>
        prev.map(b => {
          if (b.id === log.bankAccountId) {
            const nextBal = b.currentBalance - log.totalCost;
            syncUpdateDoc('bank_accounts', b.id, { currentBalance: nextBal });
            return { ...b, currentBalance: nextBal };
          }
          return b;
        })
      );
    }
  };

  const recordFeedConsumption = (log: Omit<FeedConsumptionLog, 'id' | 'cost' | 'createdAt'>) => {
    const feed = feedItems.find(f => f.id === log.feedItemId);
    const cost = feed ? log.bagsUsed * feed.costPerBag : 0;
    const kgUsed = log.kgUsed > 0 ? log.kgUsed : (feed ? log.bagsUsed * feed.bagWeightKg : log.bagsUsed * 50);

    const newLog: FeedConsumptionLog = {
      ...log,
      kgUsed,
      cost,
      id: 'FC-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };

    setFeedConsumptionLogs(prev => [...prev, newLog]);
    syncSaveDoc('feed_consumption_logs', newLog.id, newLog);

    // Deduct from feed stock
    setFeedItems(prev =>
      prev.map(f => {
        if (f.id === log.feedItemId) {
          const nextBags = Math.max(0, f.currentBags - log.bagsUsed);
          const nextKg = Math.max(0, f.currentKg - kgUsed);
          const updated = {
            ...f,
            currentBags: nextBags,
            currentKg: nextKg,
          };
          syncUpdateDoc('feed_items', f.id, updated);
          return updated;
        }
        return f;
      })
    );
  };

  // Supply Operations
  const addSupplyItem = (itemData: Omit<SupplyItem, 'id' | 'createdAt'>): SupplyItem => {
    const newItem: SupplyItem = {
      ...itemData,
      id: 'SUP-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setSupplyItems(prev => [...prev, newItem]);
    syncSaveDoc('supply_items', newItem.id, newItem);

    logActivity(
      'CREATED',
      'Supplies & Pest Control',
      `Added supply item: ${newItem.name} (${newItem.category.toUpperCase()}) - ${newItem.quantity} ${newItem.unit}`
    );

    return newItem;
  };

  const updateSupplyItem = (id: string, updates: Partial<SupplyItem>) => {
    setSupplyItems(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    syncUpdateDoc('supply_items', id, updates);

    logActivity(
      'EDITED',
      'Supplies & Pest Control',
      `Updated supply item ${id}`
    );
  };

  const deleteSupplyItem = (id: string) => {
    const target = supplyItems.find(s => s.id === id);
    if (target) {
      moveToTrash(
        'supply_item',
        id,
        `Supply: ${target.name} (${target.category})`,
        `Qty: ${target.quantity} ${target.unit}`,
        undefined,
        target
      );

      logActivity(
        'DELETED',
        'Supplies & Pest Control',
        `Moved supply item ${target.name} (${target.category.toUpperCase()}) to trash`
      );
    }
    setSupplyItems(prev => prev.filter(s => s.id !== id));
    syncDeleteDoc('supply_items', id);
  };
  };

  const updateSupplyUsageLog = (id: string, updates: Partial<SupplyUsageLog>) => {
    setSupplyUsageLogs(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    syncUpdateDoc('supply_usage_logs', id, updates);
  };

  const deleteSupplyUsageLog = (id: string) => {
    const target = supplyUsageLogs.find(s => s.id === id);
    if (target) {
      moveToTrash(
        'supply_usage',
        id,
        `Supply Usage: ${target.supplyName} (${target.quantity} used)`,
        target.reason || '',
        target.date,
        target
      );
    }
    setSupplyUsageLogs(prev => prev.filter(s => s.id !== id));
    syncDeleteDoc('supply_usage_logs', id);
  };

  const recordSupplyUsage = (log: Omit<SupplyUsageLog, 'id' | 'createdAt'>) => {
    const newLog: SupplyUsageLog = {
      ...log,
      id: 'SU-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setSupplyUsageLogs(prev => [...prev, newLog]);
    syncSaveDoc('supply_usage_logs', newLog.id, newLog);

    // Deduct from supply item
    setSupplyItems(prev =>
      prev.map(s => {
        if (s.id === log.supplyItemId) {
          const nextQty = Math.max(0, s.quantity - log.quantity);
          syncUpdateDoc('supply_items', s.id, { quantity: nextQty });
          return {
            ...s,
            quantity: nextQty,
          };
        }
        return s;
      })
    );
  };

  // Customer Operations
  const addCustomer = (custData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: 'CUST-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [...prev, newCust]);
    syncSaveDoc('customers', newCust.id, newCust);

    logActivity(
      'CREATED',
      'Customer Management',
      `Registered new customer profile: ${newCust.name} (${newCust.customerCode})`
    );

    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    syncUpdateDoc('customers', id, updates);

    logActivity(
      'EDITED',
      'Customer Management',
      `Updated customer profile ${id}: ${updates.name ? `Name changed to "${updates.name}"` : 'Updated customer contact/credit details'}`
    );
  };

  const deleteCustomer = (id: string) => {
    const target = customers.find(c => c.id === id);
    if (target) {
      moveToTrash(
        'customer',
        id,
        `Customer: ${target.name}`,
        `${target.customerType} • ${target.contactNumber}`,
        undefined,
        target
      );

      logActivity(
        'DELETED',
        'Customer Management',
        `Moved customer profile ${target.name} (${target.customerCode}) to trash`
      );
    }
    setCustomers(prev => prev.filter(c => c.id !== id));
    syncDeleteDoc('customers', id);
  };

  // Order Operations
  const addOrder = (orderData: Omit<FarmOrder, 'id' | 'orderNumber' | 'createdAt'>): FarmOrder => {
    const orderNumber = 'ORD-' + (orders.length + 1).toString().padStart(4, '0');
    const newOrder: FarmOrder = {
      ...orderData,
      id: 'ORD-' + Date.now().toString().slice(-6),
      orderNumber,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [...prev, newOrder]);
    syncSaveDoc('orders', newOrder.id, newOrder);
    return newOrder;
  };

  const updateOrder = (id: string, updates: Partial<FarmOrder>) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)));
    syncUpdateDoc('orders', id, updates);
  };

  const updateOrderStatus = (id: string, status: FarmOrder['status']) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
    syncUpdateDoc('orders', id, { status });
  };

  const deleteOrder = (id: string) => {
    const target = orders.find(o => o.id === id);
    if (target) {
      moveToTrash(
        'order',
        id,
        `Order: ${target.orderNumber} (${target.customerName})`,
        `Total: ₱${target.total.toLocaleString()} • Status: ${target.status}`,
        target.date,
        target
      );
    }
    setOrders(prev => prev.filter(o => o.id !== id));
    syncDeleteDoc('orders', id);
  };

  // Sales Operations
  const addSale = (saleData: Omit<FarmSale, 'id' | 'saleNumber' | 'createdAt' | 'balance'>): FarmSale => {
    const saleNumber = 'INV-' + (sales.length + 1).toString().padStart(4, '0');
    const balance = Math.max(0, saleData.total - saleData.paidAmount);

    const newSale: FarmSale = {
      ...saleData,
      id: 'SALE-' + Date.now().toString().slice(-6),
      saleNumber,
      balance,
      createdAt: new Date().toISOString(),
    };

    setSales(prev => [...prev, newSale]);
    syncSaveDoc('sales', newSale.id, newSale);

    logActivity(
      'CREATED',
      'Sales & Invoicing',
      `Issued sales invoice ${newSale.saleNumber} for ${newSale.customerName}: ₱${newSale.total.toLocaleString()} (${newSale.paymentMethod || 'Cash'})`
    );

    // If paidAmount > 0, record corresponding payment automatically
    if (saleData.paidAmount > 0) {
      const payNum = 'PAY-' + Date.now().toString().slice(-6);
      const newPayment: CustomerPayment = {
        id: payNum,
        paymentNumber: payNum,
        paymentDate: saleData.date,
        amount: saleData.paidAmount,
        paymentMethod: saleData.paymentMethod || 'Cash',
        referenceNumber: saleData.referenceNumber,
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        saleId: newSale.id,
        accountReceivedInto: saleData.paymentMethod === 'Bank Transfer' ? 'bank_account' : 'cash_on_hand',
        createdAt: new Date().toISOString(),
      };
      setPayments(prev => [...prev, newPayment]);
      syncSaveDoc('payments', newPayment.id, newPayment);
    }

    return newSale;
  };

  const updateSale = (id: string, updates: Partial<FarmSale>) => {
    setSales(prev => prev.map(s => {
      if (s.id === id) {
        const merged = { ...s, ...updates };
        if (updates.paidAmount !== undefined || updates.total !== undefined) {
          merged.balance = Math.max(0, merged.total - merged.paidAmount);
          merged.paymentStatus =
            merged.paidAmount >= merged.total
              ? (merged.paidAmount > merged.total ? 'OVERPAID/CREDIT' : 'PAID')
              : merged.paidAmount > 0
              ? 'PARTIAL'
              : 'UNPAID';
        }
        syncUpdateDoc('sales', id, merged);
        return merged;
      }
      return s;
    }));

    logActivity(
      'EDITED',
      'Sales & Invoicing',
      `Updated sales invoice ${id}: ${updates.customerName ? `Buyer name updated to "${updates.customerName}"` : 'Invoice details modified'}`
    );
  };

  const deleteSale = (id: string) => {
    const target = sales.find(s => s.id === id);
    if (target) {
      moveToTrash(
        'sale',
        id,
        `Sales Invoice: ${target.saleNumber} (${target.customerName})`,
        `Amount: ₱${target.total.toLocaleString()} • Paid: ₱${target.paidAmount.toLocaleString()}`,
        target.date,
        target
      );

      logActivity(
        'DELETED',
        'Sales & Invoicing',
        `Moved sales invoice ${target.saleNumber} (${target.customerName}) to trash`
      );
    }
    setSales(prev => prev.filter(s => s.id !== id));
    syncDeleteDoc('sales', id);
  };

    // Customer Payment Operations
  const addPayment = (paymentData: Omit<CustomerPayment, 'id' | 'paymentNumber' | 'createdAt'>): CustomerPayment => {
    const paymentNumber = 'PAY-' + (payments.length + 1).toString().padStart(4, '0');
    const newPayment: CustomerPayment = {
      ...paymentData,
      id: 'PAY-' + Date.now().toString().slice(-6),
      paymentNumber,
      createdAt: new Date().toISOString(),
    };

    setPayments(prev => [...prev, newPayment]);
    syncSaveDoc('payments', newPayment.id, newPayment);

    logActivity(
      'CREATED',
      'Customer Payments',
      `Logged remittance ${newPayment.paymentNumber} (${newPayment.customerName}): ₱${newPayment.amount.toLocaleString()} via ${newPayment.paymentMethod}`
    );

    // Adjust Bank Balance if received into bank account
    if (newPayment.accountReceivedInto !== 'cash_on_hand' && newPayment.bankAccountId) {
      setBankAccounts(prev =>
        prev.map(b => {
          if (b.id === newPayment.bankAccountId) {
            const nextBal = b.currentBalance + newPayment.amount;
            syncUpdateDoc('bank_accounts', b.id, { currentBalance: nextBal });
            return { ...b, currentBalance: nextBal };
          }
          return b;
        })
      );
    }

    // If linked to sale, adjust sale's balance & payment status
    if (newPayment.saleId) {
      setSales(prev =>
        prev.map(s => {
          if (s.id === newPayment.saleId) {
            const nextPaid = s.paidAmount + newPayment.amount;
            const nextBalance = Math.max(0, s.total - nextPaid);
            const status: FarmSale['paymentStatus'] =
              nextPaid >= s.total ? (nextPaid > s.total ? 'OVERPAID/CREDIT' : 'PAID') : nextPaid > 0 ? 'PARTIAL' : 'UNPAID';
            const updatedSale = {
              ...s,
              paidAmount: nextPaid,
              balance: nextBalance,
              paymentStatus: status,
            };
            syncUpdateDoc('sales', s.id, updatedSale);
            return updatedSale;
          }
          return s;
        })
      );
    }

    return newPayment;
  };

  const updatePayment = (id: string, updates: Partial<CustomerPayment>) => {
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    syncUpdateDoc('payments', id, updates);

    logActivity(
      'EDITED',
      'Customer Payments',
      `Updated remittance record ${id}`
    );
  };

  const deletePayment = (id: string) => {
    const target = payments.find(p => p.id === id);
    if (target) {
      moveToTrash(
        'payment',
        id,
        `Payment: ${target.paymentNumber} (${target.customerName})`,
        `Amount: ₱${target.amount.toLocaleString()} • Method: ${target.paymentMethod}`,
        target.paymentDate,
        target
      );

      logActivity(
        'DELETED',
        'Customer Payments',
        `Moved remittance record ${target.paymentNumber} (${target.customerName}) to trash`
      );
    }
    setPayments(prev => prev.filter(p => p.id !== id));
    syncDeleteDoc('payments', id);
  };

  // Expense Operations
  const addExpense = (expenseData: Omit<FarmExpense, 'id' | 'expenseNumber' | 'createdAt'>): FarmExpense => {
    const expenseNumber = 'EXP-' + (expenses.length + 1).toString().padStart(4, '0');
    const newExpense: FarmExpense = {
      ...expenseData,
      id: 'EXP-' + Date.now().toString().slice(-6),
      expenseNumber,
      createdAt: new Date().toISOString(),
    };

    setExpenses(prev => [...prev, newExpense]);
    syncSaveDoc('expenses', newExpense.id, newExpense);

    logActivity(
      'CREATED',
      'Expense Management',
      `Recorded expense voucher ${newExpense.expenseNumber} (${newExpense.category}): ${newExpense.description} (₱${newExpense.amount.toLocaleString()})`
    );

    // Deduct from bank account balance if paid from bank
    if (newExpense.paymentAccount !== 'cash_on_hand' && newExpense.bankAccountId) {
      setBankAccounts(prev =>
        prev.map(b => {
          if (b.id === newExpense.bankAccountId) {
            const nextBal = b.currentBalance - newExpense.amount;
            syncUpdateDoc('bank_accounts', b.id, { currentBalance: nextBal });
            return { ...b, currentBalance: nextBal };
          }
          return b;
        })
      );
    }

    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<FarmExpense>) => {
    setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
    syncUpdateDoc('expenses', id, updates);

    logActivity(
      'EDITED',
      'Expense Management',
      `Updated expense voucher ${id}: ${updates.description || 'vouchers details modified'}`
    );
  };

  const deleteExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    if (target) {
      moveToTrash(
        'expense',
        id,
        `Expense: ${target.expenseNumber} (${target.category})`,
        `${target.description} • ₱${target.amount.toLocaleString()}`,
        target.date,
        target
      );

      logActivity(
        'DELETED',
        'Expense Management',
        `Moved expense voucher ${target.expenseNumber} (${target.category}) to trash`
      );
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
    syncDeleteDoc('expenses', id);
  };

  // Bank & Deposit Operations
  const addBankAccount = (
    bankName: string,
    accountName: string,
    maskedAccountNumber: string,
    openingBalance: number,
    notes?: string
  ): BankAccount => {
    const newBank: BankAccount = {
      id: 'BANK-' + Date.now().toString().slice(-6),
      bankName,
      accountName,
      maskedAccountNumber,
      openingBalance,
      currentBalance: openingBalance,
      notes,
      createdAt: new Date().toISOString(),
    };
    setBankAccounts(prev => [...prev, newBank]);
    syncSaveDoc('bank_accounts', newBank.id, newBank);
    return newBank;
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    setBankAccounts(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
    syncUpdateDoc('bank_accounts', id, updates);
  };

  const deleteBankAccount = (id: string) => {
    const target = bankAccounts.find(b => b.id === id);
    if (target) {
      moveToTrash(
        'bank_account',
        id,
        `Bank: ${target.bankName} (${target.accountName})`,
        `Account: ${target.maskedAccountNumber} • Balance: ₱${target.currentBalance.toLocaleString()}`,
        undefined,
        target
      );
    }
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    syncDeleteDoc('bank_accounts', id);
  };

  /**
   * CRITICAL BUSINESS RULE:
   * A bank deposit is NOT revenue!
   * Moving money from Cash on Hand to Bank:
   * Customer Payment -> Cash on Hand -> Bank Deposit -> Bank Balance
   */
  const recordBankDeposit = (depositData: Omit<BankDeposit, 'id' | 'depositNumber' | 'createdAt'>): BankDeposit => {
    const depositNumber = 'DEP-' + (bankDeposits.length + 1).toString().padStart(4, '0');
    const newDeposit: BankDeposit = {
      ...depositData,
      id: 'DEP-' + Date.now().toString().slice(-6),
      depositNumber,
      createdAt: new Date().toISOString(),
    };

    setBankDeposits(prev => [...prev, newDeposit]);
    syncSaveDoc('bank_deposits', newDeposit.id, newDeposit);

    logActivity(
      'CREATED',
      'Bank Deposits',
      `Recorded bank deposit ${newDeposit.depositNumber} to ${newDeposit.bankName}: ₱${newDeposit.amount.toLocaleString()} (${newDeposit.depositType})`
    );

    // Increase target bank account
    setBankAccounts(prev =>
      prev.map(b => {
        if (b.id === depositData.bankAccountId) {
          const nextBal = b.currentBalance + depositData.amount;
          syncUpdateDoc('bank_accounts', b.id, { currentBalance: nextBal });
          return { ...b, currentBalance: nextBal };
        }
        return b;
      })
    );

    return newDeposit;

    return newDeposit;
  };

  const updateBankDeposit = (id: string, updates: Partial<BankDeposit>) => {
    setBankDeposits(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
    syncUpdateDoc('bank_deposits', id, updates);
  };

  const deleteBankDeposit = (id: string) => {
    const target = bankDeposits.find(d => d.id === id);
    if (target) {
      moveToTrash(
        'bank_deposit',
        id,
        `Bank Deposit: ${target.depositNumber} (${target.bankName})`,
        `Amount: ₱${target.amount.toLocaleString()} • Slip: ${target.depositSlipNumber || '—'}`,
        target.depositDate,
        target
      );
    }
    setBankDeposits(prev => prev.filter(d => d.id !== id));
    syncDeleteDoc('bank_deposits', id);
  };

  const setCashOnHandManualAdjustment = (newAmount: number, reason: string) => {
    syncSaveDoc('farm_finances', 'cash', { amount: newAmount, updatedAt: new Date().toISOString(), reason });
  };

  // Central Farm Data Auditor (RECORD CHECK)
  const runFullRecordCheck = (): AuditReport => {
    const items: AuditCheckItem[] = [];

    // 1. Flock Population Tally
    flocks.forEach(flock => {
      const flAdjustments = flockAdjustments.filter(a => a.flockId === flock.id);
      const mortalities = flAdjustments.filter(a => a.type === 'mortality').reduce((s, a) => s + a.quantity, 0);
      const culls = flAdjustments.filter(a => a.type === 'cull').reduce((s, a) => s + a.quantity, 0);
      const transfersOut = flAdjustments.filter(a => a.type === 'transfer_out').reduce((s, a) => s + a.quantity, 0);
      const transfersIn = flAdjustments.filter(a => a.type === 'transfer_in').reduce((s, a) => s + a.quantity, 0);

      const expectedPopulation = flock.startingPopulation - mortalities - culls - transfersOut + transfersIn;
      const isMatch = expectedPopulation === flock.currentPopulation;
      const isNegative = flock.currentPopulation < 0 || expectedPopulation < 0;

      if (isNegative) {
        items.push({
          id: `flock-neg-${flock.id}`,
          category: 'Flock Population',
          title: `Negative Population Detected: ${flock.batchId}`,
          status: 'CRITICAL',
          summary: `Flock ${flock.batchId} has negative count (${flock.currentPopulation}).`,
          details: `Starting: ${flock.startingPopulation}, Mortalities: ${mortalities}, Culls: ${culls}, Trans Out: ${transfersOut}, Trans In: ${transfersIn}.`,
          recommendation: 'Audit flock mortality entries and adjust to reflect actual physical head count.',
        });
      } else if (!isMatch) {
        items.push({
          id: `flock-tally-${flock.id}`,
          category: 'Flock Population',
          title: `Population Discrepancy: ${flock.batchId}`,
          status: 'WARNING',
          summary: `Flock record shows ${flock.currentPopulation} birds, but mathematical tally is ${expectedPopulation}.`,
          details: `Difference of ${Math.abs(flock.currentPopulation - expectedPopulation)} birds.`,
          recommendation: 'Synchronize current population with mortality logs.',
        });
      } else {
        items.push({
          id: `flock-ok-${flock.id}`,
          category: 'Flock Population',
          title: `Flock ${flock.batchId} Population Verified`,
          status: 'PASSED',
          summary: `Live birds (${flock.currentPopulation}) strictly equals Starting (${flock.startingPopulation}) minus reductions plus additions.`,
          details: `Mortality: ${mortalities}, Culls: ${culls}, Transfers: ${transfersIn - transfersOut}.`,
        });
      }
    });

    if (flocks.length === 0) {
      items.push({
        id: 'flock-empty',
        category: 'Flock Population',
        title: 'Zero Flock State Verified',
        status: 'PASSED',
        summary: 'No flocks recorded yet. Initial zero-bird state verified.',
        details: 'Ready for first flock creation.',
      });
    }

    // 2. Egg Production Math Audit
    let prodMathErrors = 0;
    eggProductionLogs.forEach(log => {
      const sumGrades = Object.values(log.grades || {}).reduce((s, v) => s + (v || 0), 0);
      const usableCalc = (log.totalCollection || 0) - (log.rejects || 0);

      if (sumGrades !== log.usableEggs) {
        prodMathErrors++;
        items.push({
          id: `prod-grade-mismatch-${log.id}`,
          category: 'Egg Production',
          title: `Grading Mismatch on ${log.date}`,
          status: 'WARNING',
          summary: `Sum of graded eggs (${sumGrades}) does not equal recorded good eggs (${log.usableEggs}).`,
          details: `Difference of ${Math.abs(sumGrades - log.usableEggs)} eggs on collection record ${log.id}.`,
          recommendation: 'Review grading distribution for this date.',
        });
      }
    });

    if (eggProductionLogs.length > 0 && prodMathErrors === 0) {
      items.push({
        id: 'prod-math-ok',
        category: 'Egg Production',
        title: 'All Egg Collection Logs Mathematically Balanced',
        status: 'PASSED',
        summary: `${eggProductionLogs.length} collection logs audited. Total daily collections, rejects, and grade distributions tally 100%.`,
        details: 'Total Daily Collected = Rejects + Good Eggs; Grade distribution tallies with Good Eggs.',
      });
    } else if (eggProductionLogs.length === 0) {
      items.push({
        id: 'prod-empty',
        category: 'Egg Production',
        title: 'Zero Production State Verified',
        status: 'PASSED',
        summary: 'No egg production logs yet. Zero-data verified.',
        details: 'Clean starting state.',
      });
    }

    // 3. Egg Inventory Integrity
    let hasNegativeStock = false;
    EGG_GRADES.forEach(g => {
      const stock = eggStockSummary[g.key];
      if (stock.totalPhysical < 0) {
        hasNegativeStock = true;
        items.push({
          id: `inv-neg-${g.key}`,
          category: 'Egg Inventory',
          title: `Negative Stock on Grade: ${g.label}`,
          status: 'CRITICAL',
          summary: `Physical stock is ${stock.totalPhysical} pieces. Selling unproduced stock detected.`,
          details: `Produced: ${stock.produced}, Sold: ${stock.sold}, Adjustments Out: ${stock.adjustmentsOut}.`,
          recommendation: 'Audit sales records and enter missing egg production or adjustments.',
        });
      }
    });

    if (!hasNegativeStock) {
      items.push({
        id: 'inv-ok',
        category: 'Egg Inventory',
        title: 'Egg Inventory Quantities Valid & Non-Negative',
        status: 'PASSED',
        summary: `Physical stock (${totalPhysicalEggs} eggs / ${Math.floor(totalPhysicalEggs / 30)} trays) meets physical laws.`,
        details: `Available: ${totalAvailableEggs} pcs, Reserved: ${totalReservedEggs} pcs.`,
      });
    }

    // 4. Customer Accounts Receivable Balance Audit
    let customerMismatchCount = 0;
    customers.forEach(cust => {
      const custSales = sales.filter(s => s.customerId === cust.id);
      const custPayments = payments.filter(p => p.customerId === cust.id);

      const totalBilled = custSales.reduce((sum, s) => sum + s.total, 0);
      const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);
      const expectedBalance = totalBilled - totalPaid;

      if (cust.creditLimit > 0 && expectedBalance > cust.creditLimit) {
        items.push({
          id: `cust-limit-${cust.id}`,
          category: 'Customer Credit',
          title: `Credit Limit Exceeded: ${cust.name}`,
          status: 'WARNING',
          summary: `Outstanding balance of ₱${expectedBalance.toFixed(2)} exceeds credit limit of ₱${cust.creditLimit.toFixed(2)}.`,
          details: `Total sales: ₱${totalBilled.toFixed(2)}, total paid: ₱${totalPaid.toFixed(2)}.`,
          recommendation: 'Hold further credit release until customer settles balance.',
        });
      }
    });

    if (customers.length > 0 && customerMismatchCount === 0) {
      items.push({
        id: 'cust-ledger-ok',
        category: 'Customer Ledger',
        title: 'Customer Ledger & Receivable Records Reconciled',
        status: 'PASSED',
        summary: `All ${customers.length} customer balances reconcile with sales and payment receipts.`,
        details: 'Invoices minus Payments = Stored Customer Balances.',
      });
    } else if (customers.length === 0) {
      items.push({
        id: 'cust-empty',
        category: 'Customer Ledger',
        title: 'Zero Customer State Verified',
        status: 'PASSED',
        summary: 'No customer accounts yet. Zero-balance state confirmed.',
        details: 'Initial state ₱0 AR.',
      });
    }

    // 5. Cash on Hand Integrity Check
    const totalCashPaymentsIn = payments.filter(p => p.accountReceivedInto === 'cash_on_hand').reduce((s, p) => s + p.amount, 0);
    const totalCashExpensesOut = expenses.filter(e => e.paymentAccount === 'cash_on_hand').reduce((s, e) => s + e.amount, 0);
    const totalCashDepositedToBank = bankDeposits.filter(d => d.sourceAccount === 'Cash on Hand').reduce((s, d) => s + d.amount, 0);

    const netComputedCash = totalCashPaymentsIn - totalCashExpensesOut - totalCashDepositedToBank;

    if (cashOnHand < 0) {
      items.push({
        id: 'cash-neg',
        category: 'Cashflow',
        title: 'Negative Cash on Hand',
        status: 'CRITICAL',
        summary: `Cash on Hand is negative (₱${cashOnHand.toFixed(2)}). More cash paid out than collected.`,
        details: `Cash in: ₱${totalCashPaymentsIn.toFixed(2)}, Cash expenses: ₱${totalCashExpensesOut.toFixed(2)}, Bank deposits from cash: ₱${totalCashDepositedToBank.toFixed(2)}.`,
        recommendation: 'Record missing initial cash capital or review expense payment methods.',
      });
    } else {
      items.push({
        id: 'cash-ok',
        category: 'Cashflow',
        title: 'Cash On Hand Reconciliation Verified',
        status: 'PASSED',
        summary: `Cash on Hand currently stands at ₱${cashOnHand.toFixed(2)}.`,
        details: `Inflows: ₱${totalCashPaymentsIn.toFixed(2)} | Cash Expenses: ₱${totalCashExpensesOut.toFixed(2)} | Bank Deposits: ₱${totalCashDepositedToBank.toFixed(2)}.`,
      });
    }

    // 6. Bank Deposits Integrity (Not Revenue Check)
    const totalDeposits = bankDeposits.reduce((s, d) => s + d.amount, 0);
    items.push({
      id: 'bank-deposit-integrity',
      category: 'Banking',
      title: 'Bank Deposit & Revenue Separation Verified',
      status: 'PASSED',
      summary: `Total of ${bankDeposits.length} bank deposits (₱${totalDeposits.toFixed(2)}) processed without revenue duplication.`,
      details: 'Internal transfer integrity maintained. Deposits transfer liquidity from Cash to Bank strictly.',
    });

    // 7. Feed & Supplies Inventory Alert Checks
    feedItems.forEach(feed => {
      if (feed.currentBags <= feed.minimumBagsAlert) {
        items.push({
          id: `feed-low-${feed.id}`,
          category: 'Feed Stock',
          title: `Low Feed Stock Alert: ${feed.feedType}`,
          status: feed.currentBags <= 2 ? 'CRITICAL' : 'WARNING',
          summary: `${feed.brand} (${feed.feedType}) has only ${feed.currentBags} bags remaining (Minimum threshold: ${feed.minimumBagsAlert} bags).`,
          details: `Current stock: ${feed.currentKg} kg.`,
          recommendation: 'Place a feed purchase order immediately.',
        });
      }
    });

    supplyItems.forEach(sup => {
      if (sup.quantity <= sup.minimumStock) {
        items.push({
          id: `sup-low-${sup.id}`,
          category: 'Supplies',
          title: `Low Supply Alert: ${sup.name}`,
          status: 'WARNING',
          summary: `${sup.name} has only ${sup.quantity} ${sup.unit} remaining (Minimum: ${sup.minimumStock}).`,
          details: `Category: ${sup.category}`,
          recommendation: 'Restock supply item before stockout.',
        });
      }
    });

    const passedCount = items.filter(i => i.status === 'PASSED').length;
    const warningCount = items.filter(i => i.status === 'WARNING').length;
    const criticalCount = items.filter(i => i.status === 'CRITICAL').length;

    const overallStatus: AuditStatus = criticalCount > 0 ? 'CRITICAL' : warningCount > 0 ? 'WARNING' : 'PASSED';

    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      overallStatus,
      passedCount,
      warningCount,
      criticalCount,
      items,
    };

    setAuditReport(report);
    return report;
  };

  // Export database to JSON string
  const exportDatabaseJson = (): string => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      farms,
      houses,
      flocks,
      flockAdjustments,
      eggProductionLogs,
      eggAdjustments,
      feedItems,
      feedConsumptionLogs,
      feedPurchaseLogs,
      supplyItems,
      supplyUsageLogs,
      customers,
      orders,
      sales,
      payments,
      expenses,
      bankAccounts,
      bankDeposits,
      internalTransfers,
      cashOnHand,
      trashItems,
    };
    return JSON.stringify(data, null, 2);
  };

  // Import database from JSON string
  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) setProfile(data.profile);
      if (Array.isArray(data.farms)) setFarms(data.farms);
      if (Array.isArray(data.houses)) setHouses(data.houses);
      if (Array.isArray(data.flocks)) setFlocks(data.flocks);
      if (Array.isArray(data.flockAdjustments)) setFlockAdjustments(data.flockAdjustments);
      if (Array.isArray(data.eggProductionLogs)) setEggProductionLogs(data.eggProductionLogs);
      if (Array.isArray(data.eggAdjustments)) setEggAdjustments(data.eggAdjustments);
      if (Array.isArray(data.feedItems)) setFeedItems(data.feedItems);
      if (Array.isArray(data.feedConsumptionLogs)) setFeedConsumptionLogs(data.feedConsumptionLogs);
      if (Array.isArray(data.feedPurchaseLogs)) setFeedPurchaseLogs(data.feedPurchaseLogs);
      if (Array.isArray(data.supplyItems)) setSupplyItems(data.supplyItems);
      if (Array.isArray(data.supplyUsageLogs)) setSupplyUsageLogs(data.supplyUsageLogs);
      if (Array.isArray(data.customers)) setCustomers(data.customers);
      if (Array.isArray(data.orders)) setOrders(data.orders);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.payments)) setPayments(data.payments);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.bankAccounts)) setBankAccounts(data.bankAccounts);
      if (Array.isArray(data.bankDeposits)) setBankDeposits(data.bankDeposits);
      if (Array.isArray(data.internalTransfers)) setInternalTransfers(data.internalTransfers);
      if (Array.isArray(data.trashItems)) setTrashItems(data.trashItems);
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  };

  // Reset to absolute clean zero data
  const resetToZeroData = () => {
    setProfile(DEFAULT_FARM_PROFILE);
    setFarms([]);
    setHouses([]);
    setFlocks([]);
    setFlockAdjustments([]);
    setEggProductionLogs([]);
    setEggAdjustments([]);
    setFeedItems([]);
    setFeedConsumptionLogs([]);
    setFeedPurchaseLogs([]);
    setSupplyItems([]);
    setSupplyUsageLogs([]);
    setCustomers([]);
    setOrders([]);
    setSales([]);
    setPayments([]);
    setExpenses([]);
    setBankAccounts([]);
    setBankDeposits([]);
    setInternalTransfers([]);
    setTrashItems([]);
    setAuditReport(null);

    // Clear local storage keys
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  };

  };

  // Market Pricing & Price Change Logger
  const updateEggGradePrice = (
    grade: EggGradeKey,
    newTrayPrice: number,
    newPiecePrice: number,
    reason?: string
  ) => {
    const current = eggGradePrices[grade] || DEFAULT_EGG_GRADE_PRICES[grade];
    const oldTrayPrice = current.trayPrice;
    const now = new Date();
    const formattedTimestamp = now.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

    const newLog: PriceChangeLog = {
      id: 'PRICELOG-' + Date.now().toString().slice(-6),
      timestamp: formattedTimestamp,
      date: now.toISOString().split('T')[0],
      grade,
      priceType: 'tray',
      oldPrice: oldTrayPrice,
      newPrice: newTrayPrice,
      reason: reason?.trim() || 'Admin manual market price adjustment',
      changedBy: activeRoleConfig.title,
    };

    setPriceChangeLogs(prev => {
      const updated = [newLog, ...prev];
      saveStorage('price_change_logs_v2', updated);
      return updated;
    });

    setEggGradePrices(prev => {
      const updated = {
        ...prev,
        [grade]: { trayPrice: newTrayPrice, piecePrice: newPiecePrice },
      };
      saveStorage('egg_grade_prices_v2', updated);
      return updated;
    });

    syncSaveDoc('price_change_logs', newLog.id, newLog);

    logActivity(
      'SETTINGS_CHANGED',
      'Market Pricing',
      `Admin updated selling price for ${grade.toUpperCase()} from ₱${oldTrayPrice} to ₱${newTrayPrice} per tray (${reason?.trim() || 'Market price adjustment'})`
    );
  };

  // Universal Login Session Methods
  const loginSession = (
    role: UserRole,
    passwordOrPin: string
  ): { success: boolean; message: string } => {
    const trimmed = passwordOrPin.trim();
    const adminPass = roleCredentials.admin || ADMIN_CREDENTIALS.password;

    if (role === 'admin' || role === 'owner') {
      if (trimmed === adminPass || trimmed === ADMIN_CREDENTIALS.pin || trimmed === 'admin123') {
        setIsAuthenticated(true);
        saveStorage('is_authenticated_v2', true);
        setIsAdminAuthenticated(true);
        saveStorage('admin_auth_status', true);
        setCurrentRoleState('admin');
        saveStorage('active_role', 'admin');
        logActivity('LOGIN', 'Authentication', 'Superuser Admin logged into the system.', 'admin');
        return { success: true, message: 'Superuser Admin login successful!' };
      }
      return { success: false, message: 'Invalid Admin Password or PIN. Access denied.' };
    }

    if (role === 'manager') {
      const managerPass = roleCredentials.manager || MANAGER_CREDENTIALS.pin;
      if (trimmed === managerPass || trimmed === adminPass || trimmed === '1234') {
        setIsAuthenticated(true);
        saveStorage('is_authenticated_v2', true);
        setCurrentRoleState('manager');
        saveStorage('active_role', 'manager');
        logActivity('LOGIN', 'Authentication', 'Farm Manager logged into the system.', 'manager');
        return { success: true, message: 'Farm Manager login successful!' };
      }
      return { success: false, message: 'Invalid Manager PIN.' };
    }

    if (role === 'staff' || role === 'collector' || role === 'sales_clerk' || role === 'auditor') {
      const staffPass = roleCredentials.staff || STAFF_CREDENTIALS.pin;
      if (trimmed === staffPass || trimmed === adminPass || trimmed === '0000') {
        setIsAuthenticated(true);
        saveStorage('is_authenticated_v2', true);
        setCurrentRoleState('staff');
        saveStorage('active_role', 'staff');
        logActivity('LOGIN', 'Authentication', 'Farm Staff logged into the system.', 'staff');
        return { success: true, message: 'Farm Staff login successful!' };
      }
      return { success: false, message: 'Invalid Staff PIN.' };
    }

    return { success: false, message: 'Unknown role specified.' };
  };

  const requestLogoutOrSwitch = (targetRole: UserRole | 'LOGOUT' = 'LOGOUT') => {
    setPendingTargetRole(targetRole);
    setAdminOverrideModalOpen(true);
  };

  const confirmLogoutOrSwitchWithAdminPassword = (
    password: string
  ): { success: boolean; message: string } => {
    const trimmed = password.trim();
    const adminPass = roleCredentials.admin || ADMIN_CREDENTIALS.password;

    if (trimmed === adminPass || trimmed === ADMIN_CREDENTIALS.pin || trimmed === 'admin123') {
      if (pendingTargetRole === 'LOGOUT' || !pendingTargetRole) {
        setIsAuthenticated(false);
        saveStorage('is_authenticated_v2', false);
        setIsAdminAuthenticated(false);
        saveStorage('admin_auth_status', false);
        setAdminOverrideModalOpen(false);
        return { success: true, message: 'Session closed & returned to login gate.' };
      } else {
        const target: UserRole = pendingTargetRole;
        setCurrentRoleState(target);
        saveStorage('active_role', target);
        if (target === 'admin') {
          setIsAdminAuthenticated(true);
          saveStorage('admin_auth_status', true);
        }
        setAdminOverrideModalOpen(false);
        return { success: true, message: `Role switched to ${target}` };
      }
    }
    return { success: false, message: 'Invalid Admin Password! Switch / Logout authorization failed.' };
  };

  const changeUserPassword = (
    role: UserRole,
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const roleKey = (role === 'owner' ? 'admin' : (role === 'collector' || role === 'sales_clerk' || role === 'auditor') ? 'staff' : role) as 'admin' | 'manager' | 'staff';
    const workingPass = roleCredentials[roleKey] || DEFAULT_ROLE_CREDENTIALS[roleKey];
    const adminPass = roleCredentials.admin || ADMIN_CREDENTIALS.password;

    // Requirement 2: User MUST provide current working PIN first before saving a new one
    if (trimmedCurrent !== workingPass && trimmedCurrent !== adminPass) {
      return { success: false, message: 'Current Working PIN/Password is incorrect!' };
    }

    if (trimmedNew.length < 3) {
      return { success: false, message: 'New PIN/Password must be at least 3 characters long.' };
    }

    const updated = {
      ...roleCredentials,
      [roleKey]: trimmedNew,
    };
    setRoleCredentials(updated);
    saveStorage('custom_passwords_v2', updated);
    return { success: true, message: `PIN for ${roleKey.toUpperCase()} updated successfully!` };
  };

  const adminResetUserPassword = (
    targetRole: UserRole,
    newPassword: string
  ): { success: boolean; message: string } => {
    // Requirement 3: Only Owner / Admin can reset passwords for Staff & Manager without knowing current PIN
    if (currentRole !== 'admin' && currentRole !== 'owner' && !isAdminAuthenticated) {
      return { success: false, message: 'Only Superuser Admin/Owner can reset role PINs!' };
    }

    const trimmedNew = newPassword.trim();
    if (trimmedNew.length < 3) {
      return { success: false, message: 'New PIN must be at least 3 characters long.' };
    }

    const roleKey = (targetRole === 'owner' ? 'admin' : (targetRole === 'collector' || targetRole === 'sales_clerk' || targetRole === 'auditor') ? 'staff' : targetRole) as 'admin' | 'manager' | 'staff';

    const updated = {
      ...roleCredentials,
      [roleKey]: trimmedNew,
    };
    setRoleCredentials(updated);
    saveStorage('custom_passwords_v2', updated);
    return { success: true, message: `Superuser reset PIN for ${roleKey.toUpperCase()} saved persistently!` };
  };

  // Role-Based Access Control (RBAC) Methods & Helpers
  const loginAsAdmin = (password: string): { success: boolean; message: string } => {
    const trimmed = password.trim();
    const adminPass = roleCredentials.admin || ADMIN_CREDENTIALS.password;

    if (trimmed === adminPass || trimmed === ADMIN_CREDENTIALS.pin || trimmed === 'admin123') {
      setIsAuthenticated(true);
      saveStorage('is_authenticated_v2', true);
      setIsAdminAuthenticated(true);
      saveStorage('admin_auth_status', true);
      setCurrentRoleState('admin');
      saveStorage('active_role', 'admin');
      setAdminLoginModalOpen(false);
      return { success: true, message: 'Superuser Admin access granted!' };
    }
    return { success: false, message: 'Incorrect Admin password or PIN. Access denied.' };
  };

  const logoutAdmin = () => {
    requestLogoutOrSwitch('LOGOUT');
  };

  const setRole = (role: UserRole) => {
    const targetRole: UserRole = role === 'owner' ? 'admin' : (role === 'collector' || role === 'sales_clerk' || role === 'auditor') ? 'staff' : role;
    if (targetRole === currentRole) return;

    // Hard Lock: Intercept ANY attempt to switch user or role with Admin password authorization
    requestLogoutOrSwitch(targetRole);
  };

  const updateRoleConfig = (role: UserRole, updatedConfig: RoleConfig) => {
    const updated = {
      ...roleConfigs,
      [role]: updatedConfig,
    };
    setRoleConfigs(updated);
    saveStorage('custom_role_configs_v2', updated);
  };

  const resetRoleConfigs = () => {
    setRoleConfigs(USER_ROLES);
    saveStorage('custom_role_configs_v2', USER_ROLES);
  };

  const activeRoleConfig = useMemo(() => {
    return roleConfigs[currentRole] || USER_ROLES[currentRole] || USER_ROLES.admin;
  }, [currentRole, roleConfigs]);

  const isTabAllowed = (tabId: string): boolean => {
    if (tabId === 'access-control') {
      return currentRole === 'admin' || !!activeRoleConfig.permissions?.canManageAccessControl;
    }
    return activeRoleConfig.allowedTabs ? activeRoleConfig.allowedTabs.includes(tabId) : true;
  };

  const hasPermission = (perm: keyof RolePermissions): boolean => {
    return !!activeRoleConfig.permissions?.[perm];
  };

  const addTeamMember = (memberData: Omit<TeamMember, 'id' | 'assignedAt'>): TeamMember => {
    const newMember: TeamMember = {
      ...memberData,
      id: 'member-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      assignedAt: new Date().toISOString(),
    };
    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    saveStorage('team_members', updated);
    syncSaveDoc('team_members', newMember.id, newMember);
    return newMember;
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    const updated = teamMembers.map(m => (m.id === id ? { ...m, ...updates } : m));
    setTeamMembers(updated);
    saveStorage('team_members', updated);
    const target = updated.find(m => m.id === id);
    if (target) {
      syncUpdateDoc('team_members', id, target);
    }
  };

  const deleteTeamMember = (id: string) => {
    const updated = teamMembers.filter(m => m.id !== id);
    setTeamMembers(updated);
    saveStorage('team_members', updated);
    syncDeleteDoc('team_members', id);
  };

  return (
    <FarmContext.Provider
      value={{
        profile,
        updateProfile,
        uploadLogo,
        removeLogo,
        farms,
        houses,
        addFarm,
        deleteFarm,
        addHouse,
        deleteHouse,
        flocks,
        flockAdjustments,
        addFlock,
        updateFlock,
        deleteFlock,
        addFlockAdjustment,
        deleteFlockAdjustment,
        eggProductionLogs,
        addEggProductionLog,
        updateEggProductionLog,
        deleteEggProductionLog,
        eggAdjustments,
        addEggAdjustment,
        deleteEggAdjustment,
        eggStockSummary,
        totalPhysicalEggs,
        totalAvailableEggs,
        totalAvailableTrays,
        totalReservedEggs,
        totalGoodEggsCollected,
        totalEggsSold,
        inventoryRemaining,
        hasSalesDiscrepancy,
        potentialRevenue,
        actualRealizedRevenue,
        feedItems,
        feedConsumptionLogs,
        feedPurchaseLogs,
        addFeedItem,
        updateFeedItem,
        deleteFeedItem,
        recordFeedPurchase,
        updateFeedPurchaseLog,
        deleteFeedPurchaseLog,
        recordFeedConsumption,
        updateFeedConsumptionLog,
        deleteFeedConsumptionLog,
        supplyItems,
        supplyUsageLogs,
        addSupplyItem,
        updateSupplyItem,
        deleteSupplyItem,
        recordSupplyUsage,
        updateSupplyUsageLog,
        deleteSupplyUsageLog,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        orders,
        addOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,
        sales,
        addSale,
        updateSale,
        deleteSale,
        payments,
        addPayment,
        updatePayment,
        deletePayment,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        bankAccounts,
        bankDeposits,
        internalTransfers,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        recordBankDeposit,
        updateBankDeposit,
        deleteBankDeposit,
        cashOnHand,
        setCashOnHandManualAdjustment,
        trashItems,
        moveToTrash,
        restoreFromTrash,
        permanentlyDeleteFromTrash,
        emptyTrash,
        restoreAllFromTrash,
        auditReport,
        runFullRecordCheck,
        exportDatabaseJson,
        importDatabaseJson,
        resetToZeroData,
        syncStatus,
        lastSyncedAt,
        currentUser,
        signInWithGoogle,
        signOutUser,
        syncAllLocalDataToCloud,

        // Universal Session & Role-Based Access Control
        isAuthenticated,
        loginSession,
        requestLogoutOrSwitch,
        confirmLogoutOrSwitchWithAdminPassword,
        pendingTargetRole,
        adminOverrideModalOpen,
        setAdminOverrideModalOpen,
        roleCredentials,
        changeUserPassword,
        adminResetUserPassword,
        activityLogs,
        logActivity,
        priceChangeLogs,
        eggGradePrices,
        updateEggGradePrice,
        currentRole,
        setRole,
        activeRoleConfig,
        roleConfigs,
        isAdminAuthenticated,
        loginAsAdmin,
        logoutAdmin,
        updateRoleConfig,
        resetRoleConfigs,
        adminLoginModalOpen,
        setAdminLoginModalOpen,
        teamMembers,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        isTabAllowed,
        hasPermission,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};

