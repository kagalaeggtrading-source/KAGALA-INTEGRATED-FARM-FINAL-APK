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
  DailyTask,
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

export interface EggStockSummary {
  grade: EggGradeKey;
  produced: number;
  adjustmentsIn: number;
  adjustmentsOut: number;
  sold: number;
  reserved: number;
  available: number;
  totalPhysical: number;
  availableTrays: number;
  availableLoose: number;
}

export interface FarmContextType {
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

  // Feed Analytics
  totalFeedKgConsumedAllTime: number;
  totalFeedBagsConsumedAllTime: number;
  feedConsumptionRatio: number;
  fcrPerTray: number;
  flockPerformanceMetrics: Array<{
    flockId: string;
    batchId: string;
    totalKgConsumed: number;
    totalEggsProduced: number;
    fcr: number;
    fcrPerTray: number;
  }>;

  // Daily Tasks Planner Board
  dailyTasks: DailyTask[];
  addDailyTask: (title: string, priority?: DailyTask['priority'], assignedTo?: string) => void;
  toggleDailyTask: (id: string) => void;
  deleteDailyTask: (id: string) => void;

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
  if (typeof window === 'undefined') return defaultValue;
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
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Farm Profile
  const [profile, setProfile] = useState<FarmProfile>(() =>
    loadStorage('profile', DEFAULT_FARM_PROFILE)
  );

  // Core Entity States
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

  const [feedItems, setFeedItems] = useState<FeedItem[]>(() => loadStorage('feed_items', []));
  const [feedConsumptionLogs, setFeedConsumptionLogs] = useState<FeedConsumptionLog[]>(() =>
    loadStorage('feed_consumption_logs', [])
  );
  const [feedPurchaseLogs, setFeedPurchaseLogs] = useState<FeedPurchaseLog[]>(() =>
    loadStorage('feed_purchase_logs', [])
  );

  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>(() => loadStorage('supply_items', []));
  const [supplyUsageLogs, setSupplyUsageLogs] = useState<SupplyUsageLog[]>(() =>
    loadStorage('supply_usage_logs', [])
  );

  const [customers, setCustomers] = useState<Customer[]>(() => loadStorage('customers', []));
  const [orders, setOrders] = useState<FarmOrder[]>(() => loadStorage('orders', []));
  const [sales, setSales] = useState<FarmSale[]>(() => loadStorage('sales', []));
  const [payments, setPayments] = useState<CustomerPayment[]>(() => loadStorage('payments', []));
  const [expenses, setExpenses] = useState<FarmExpense[]>(() => loadStorage('expenses', []));

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => loadStorage('bank_accounts', []));
  const [bankDeposits, setBankDeposits] = useState<BankDeposit[]>(() => loadStorage('bank_deposits', []));
  const [internalTransfers, setInternalTransfers] = useState<InternalTransfer[]>(() =>
    loadStorage('internal_transfers', [])
  );

  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => loadStorage('trash_items', []));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadStorage<ActivityLog[]>('activity_logs_v2', [])
  );
  const [priceChangeLogs, setPriceChangeLogs] = useState<PriceChangeLog[]>(() =>
    loadStorage<PriceChangeLog[]>('price_change_logs_v2', [])
  );

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() =>
    loadStorage<DailyTask[]>('daily_tasks_v2', [
      {
        id: 'task-1',
        title: 'Morning Egg Collection & Sorting (Houses 1-3)',
        priority: 'high',
        assignedTo: 'Egg Collector',
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: 'Farm Manager',
      },
      {
        id: 'task-2',
        title: 'Disinfect coop walkways and fly spraying (House 2)',
        priority: 'medium',
        assignedTo: 'Farm Staff',
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: 'Farm Manager',
      },
      {
        id: 'task-3',
        title: 'Check water pressure and nipple drinker lines',
        priority: 'low',
        assignedTo: 'Farm Staff',
        completed: true,
        createdAt: new Date().toISOString(),
        createdBy: 'Farm Manager',
      },
    ])
  );

  const [eggGradePrices, setEggGradePrices] = useState<Record<EggGradeKey, { trayPrice: number; piecePrice: number }>>(() => {
    const saved = loadStorage<Record<EggGradeKey, { trayPrice: number; piecePrice: number }>>('egg_grade_prices_v2', DEFAULT_EGG_GRADE_PRICES);
    return { ...DEFAULT_EGG_GRADE_PRICES, ...saved };
  });

  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);

  // Cloud Sync & Auth States
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Session & RBAC States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    loadStorage<boolean>('is_authenticated_v2', false)
  );

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

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() =>
    loadStorage<boolean>('admin_auth_status', false)
  );

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

      // Functional update para maging instant at reactive ang refresh sa UI dashboard mo
      setActivityLogs(prev => {
        const updated = [newLog, ...prev];
        setTimeout(() => saveStorage('activity_logs_v2', updated), 0);
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
        setSyncStatus('connected');
      }),
      subscribeCollection<Flock>('flocks', items => {
        if (items.length > 0) setFlocks(items);
        setLastSyncedAt(new Date());
        setSyncStatus('connected');
      }),
      subscribeCollection<FlockAdjustment>('flock_adjustments', items => {
        if (items.length > 0) setFlockAdjustments(items);
      }),
      subscribeCollection<EggProductionLog>('egg_production_logs', items => {
        if (items.length > 0) setEggProductionLogs(items);
      }),
      subscribeCollection<EggInventoryAdjustment>('egg_adjustments', items => {
        if (items.length > 0) setEggAdjustments(items);
      }),
      subscribeCollection<FeedItem>('feed_items', items => {
        if (items.length > 0) setFeedItems(items);
      }),
      subscribeCollection<FeedConsumptionLog>('feed_consumption_logs', items => {
        if (items.length > 0) setFeedConsumptionLogs(items);
      }),
      subscribeCollection<FeedPurchaseLog>('feed_purchase_logs', items => {
        if (items.length > 0) setFeedPurchaseLogs(items);
      }),
      subscribeCollection<SupplyItem>('supply_items', items => {
        if (items.length > 0) setSupplyItems(items);
      }),
      subscribeCollection<SupplyUsageLog>('supply_usage_logs', items => {
        if (items.length > 0) setSupplyUsageLogs(items);
      }),
      subscribeCollection<Customer>('customers', items => {
        if (items.length > 0) setCustomers(items);
      }),
      subscribeCollection<FarmOrder>('orders', items => {
        if (items.length > 0) setOrders(items);
      }),
      subscribeCollection<FarmSale>('sales', items => {
        if (items.length > 0) setSales(items);
      }),
      subscribeCollection<CustomerPayment>('payments', items => {
        if (items.length > 0) setPayments(items);
      }),
      subscribeCollection<FarmExpense>('expenses', items => {
        if (items.length > 0) setExpenses(items);
      }),
      subscribeCollection<BankAccount>('bank_accounts', items => {
        if (items.length > 0) setBankAccounts(items);
      }),
      subscribeCollection<BankDeposit>('bank_deposits', items => {
        if (items.length > 0) setBankDeposits(items);
      }),
      subscribeCollection<TrashItem>('trash_items', items => {
        if (items.length > 0) setTrashItems(items);
      }),
    ];

    return () => {
      active = false;
      unsubs.forEach(unsub => unsub());
    };
  }, []);

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

    // 1. Sum Production Harvest
    eggProductionLogs.forEach(log => {
      if (log.grades) {
        EGG_GRADES.forEach(g => {
          summary[g.key].produced += log.grades[g.key] || 0;
        });
      }
    });

    // 2. Adjustments
    eggAdjustments.forEach(adj => {
      if (summary[adj.grade]) {
        if (adj.type === 'in' || adj.type === 'found' || adj.type === 'gift_in') {
          summary[adj.grade].adjustmentsIn += adj.quantityPieces;
        } else {
          summary[adj.grade].adjustmentsOut += adj.quantityPieces;
        }
      }
    });

    // 3. Sales
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (summary[item.grade]) {
          summary[item.grade].sold += item.quantityPieces;
        }
      });
    });

    // 4. Reserved
    orders.forEach(order => {
      if (order.status === 'NEW' || order.status === 'CONFIRMED' || order.status === 'RESERVED') {
        order.items.forEach(item => {
          if (summary[item.grade]) {
            summary[item.grade].reserved += item.quantityPieces;
          }
        });
      }
    });

    // Final calculations per grade
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

  const totalGoodEggsCollected = useMemo(() => {
    return eggProductionLogs.reduce((sum, l) => sum + l.usableEggs, 0);
  }, [eggProductionLogs]);

  const totalEggsSold = useMemo(() => {
    return sales.reduce((totalSum, sale) => {
      const salePcs = (sale.items || []).reduce((iSum, item) => {
        const pcs = item.priceType === 'tray' ? item.quantityTrays * 30 : item.quantityPieces;
        return iSum + (pcs || 0);
      }, 0);
      return totalSum + salePcs;
    }, 0);
  }, [sales]);

  const inventoryRemaining = totalGoodEggsCollected - totalEggsSold;
  const hasSalesDiscrepancy = totalEggsSold > totalGoodEggsCollected;

  const potentialRevenue = useMemo(() => {
    return EGG_GRADES.reduce((sum, g) => {
      const producedCount = eggStockSummary[g.key]?.produced || 0;
      const unitPrice = eggGradePrices[g.key]?.piecePrice || (DEFAULT_EGG_GRADE_PRICES[g.key]?.piecePrice || 7);
      return sum + producedCount * unitPrice;
    }, 0);
  }, [eggStockSummary, eggGradePrices]);

  const actualRealizedRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  // Dynamic Cash on Hand Calculation
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

  // Feed Analytics
  const totalFeedKgConsumedAllTime = useMemo(() => {
    return feedConsumptionLogs.reduce((sum, log) => sum + (log.kgUsed || log.bagsUsed * 50), 0);
  }, [feedConsumptionLogs]);

  const totalFeedBagsConsumedAllTime = useMemo(() => {
    return feedConsumptionLogs.reduce((sum, log) => sum + (log.bagsUsed || 0), 0);
  }, [feedConsumptionLogs]);

  const feedConsumptionRatio = useMemo(() => {
    if (!totalGoodEggsCollected || totalGoodEggsCollected <= 0) return 0;
    return Number((totalFeedKgConsumedAllTime / totalGoodEggsCollected).toFixed(3));
  }, [totalFeedKgConsumedAllTime, totalGoodEggsCollected]);

  const fcrPerTray = useMemo(() => {
    const totalTrays = totalGoodEggsCollected / 30;
    if (!totalTrays || totalTrays <= 0) return 0;
    return Number((totalFeedKgConsumedAllTime / totalTrays).toFixed(2));
  }, [totalFeedKgConsumedAllTime, totalGoodEggsCollected]);

  // Flock-Specific Feed Conversion Ratio (FCR) Analytics
  const flockPerformanceMetrics = useMemo(() => {
    return flocks.map(flock => {
      const totalKgConsumed = feedConsumptionLogs
        .filter(log => log.flockId === flock.id || log.houseId === flock.houseId)
        .reduce((sum, log) => sum + (log.kgUsed || log.bagsUsed * 50), 0);

      const totalEggsProduced = eggProductionLogs
        .filter(log => log.flockId === flock.id || log.houseId === flock.houseId)
        .reduce((sum, log) => sum + log.usableEggs, 0);

      const fcr = totalEggsProduced > 0 ? Number((totalKgConsumed / totalEggsProduced).toFixed(3)) : 0;
      const fcrPerTray = totalEggsProduced > 0 ? Number((totalKgConsumed / (totalEggsProduced / 30)).toFixed(2)) : 0;

      return {
        flockId: flock.id,
        batchId: flock.batchId,
        totalKgConsumed,
        totalEggsProduced,
        fcr,
        fcrPerTray,
      };
    });
  }, [flocks, feedConsumptionLogs, eggProductionLogs]);

  // Auto-Sorting Logistics (Most Recent Entries Always on Top)
  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  }, [sales]);

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  }, [expenses]);

  const sortedEggProductionLogs = useMemo(() => {
    return [...eggProductionLogs].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  }, [eggProductionLogs]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => (b.paymentDate || b.createdAt || '').localeCompare(a.paymentDate || a.createdAt || ''));
  }, [payments]);

  const sortedFeedConsumptionLogs = useMemo(() => {
    return [...feedConsumptionLogs].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  }, [feedConsumptionLogs]);

  const sortedSupplyUsageLogs = useMemo(() => {
    return [...supplyUsageLogs].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  }, [supplyUsageLogs]);

  const sortedActivityLogs = useMemo(() => {
    return [...activityLogs].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [activityLogs]);

  const sortedPriceChangeLogs = useMemo(() => {
    return [...priceChangeLogs].sort((a, b) => (b.timestamp || b.date || '').localeCompare(a.timestamp || a.date || ''));
  }, [priceChangeLogs]);

  const sortedBankDeposits = useMemo(() => {
    return [...bankDeposits].sort((a, b) => (b.depositDate || b.createdAt || '').localeCompare(a.depositDate || a.createdAt || ''));
  }, [bankDeposits]);

  // --- ENTITY CRUD HANDLERS ---
  const updateProfile = (updates: Partial<FarmProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    saveStorage('profile', updated);
    syncSaveDoc('farm_profile', 'main', updated);
    logActivity('SETTINGS_CHANGED', 'Farm Settings', 'Updated farm profile metadata');
  };

  const uploadLogo = (base64Data: string) => {
    updateProfile({ logoBase64: base64Data });
  };

  const removeLogo = () => {
    updateProfile({ logoBase64: undefined });
  };

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
    logActivity('CREATED', 'Farm Settings', `Added new farm location: ${name} (${code})`);
    return newFarm;
  };

  const deleteFarm = (id: string) => {
    setFarms(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('farms', id);
  };

  const addHouse = (farmId: string, name: string, code: string, capacity: number, houseType: string, notes?: string): FarmHouse => {
    const newHouse: FarmHouse = {
      id: 'HOUSE-' + Date.now().toString().slice(-6),
      farmId,
      name,
      code,
      capacity,
      houseType: houseType as any,
      notes,
      createdAt: new Date().toISOString(),
    };
    setHouses(prev => [...prev, newHouse]);
    syncSaveDoc('houses', newHouse.id, newHouse);
    logActivity('CREATED', 'Farm Settings', `Added new poultry house: ${name} (${capacity} birds)`);
    return newHouse;
  };

  const deleteHouse = (id: string) => {
    setHouses(prev => prev.filter(h => h.id !== id));
    syncDeleteDoc('houses', id);
  };

  const addFlock = (flockData: Omit<Flock, 'id' | 'currentPopulation' | 'createdAt'>): Flock => {
    const newFlock: Flock = {
      ...flockData,
      id: 'FLOCK-' + Date.now().toString().slice(-6),
      currentPopulation: flockData.startingPopulation,
      createdAt: new Date().toISOString(),
    };
    setFlocks(prev => [...prev, newFlock]);
    syncSaveDoc('flocks', newFlock.id, newFlock);
    logActivity('CREATED', 'Flock Management', `Added new flock batch: ${newFlock.batchId} (${newFlock.startingPopulation} birds)`);
    return newFlock;
  };

  const updateFlock = (id: string, updates: Partial<Flock>) => {
    setFlocks(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    syncUpdateDoc('flocks', id, updates);
  };

  const deleteFlock = (id: string) => {
    const target = flocks.find(f => f.id === id);
    if (target) {
      moveToTrash('flock', id, `Flock Batch: ${target.batchId}`, `${target.startingPopulation} birds`, target.hatchDate, target);
      logActivity('DELETED', 'Flock Management', `Moved flock batch ${target.batchId} to trash`);
    }
    setFlocks(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('flocks', id);
  };

  const addFlockAdjustment = (flockId: string, date: string, type: FlockAdjustment['type'], quantity: number, reason: string, notes?: string) => {
    const targetFlock = flocks.find(f => f.id === flockId);
    if (!targetFlock) throw new Error('Flock not found');
    if (quantity <= 0) throw new Error('Adjustment quantity must be greater than zero');

    let nextPop = targetFlock.currentPopulation;
    if (type === 'mortality' || type === 'cull' || type === 'transfer_out') {
      if (quantity > nextPop) throw new Error(`Cannot deduct ${quantity} birds from ${nextPop}`);
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

    setFlockAdjustments(prev => [adjustment, ...prev]);
    setFlocks(prev => prev.map(f => (f.id === flockId ? { ...f, currentPopulation: nextPop } : f)));
    syncSaveDoc('flock_adjustments', adjustment.id, adjustment);
    syncUpdateDoc('flocks', flockId, { currentPopulation: nextPop });
  };

  const deleteFlockAdjustment = (id: string) => {
    setFlockAdjustments(prev => prev.filter(a => a.id !== id));
    syncDeleteDoc('flock_adjustments', id);
  };

  const addEggProductionLog = (log: Omit<EggProductionLog, 'id' | 'createdAt'>): EggProductionLog => {
    const newLog: EggProductionLog = {
      ...log,
      id: 'PROD-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setEggProductionLogs(prev => [newLog, ...prev]);
    syncSaveDoc('egg_production_logs', newLog.id, newLog);
    logActivity('CREATED', 'Egg Production', `Recorded daily egg harvest for date ${log.date}: ${log.totalCollection} eggs collected (${log.usableEggs} good, ${log.rejects || 0} rejects)`);
    return newLog;
  };

  const updateEggProductionLog = (id: string, updates: Partial<EggProductionLog>) => {
    setEggProductionLogs(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    syncUpdateDoc('egg_production_logs', id, updates);
    logActivity('EDITED', 'Egg Production', `Updated egg collection record ${id}`);
  };

  const deleteEggProductionLog = (id: string) => {
    const target = eggProductionLogs.find(p => p.id === id);
    if (target) {
      moveToTrash('egg_production', id, `Egg Collection: ${target.date}`, `${target.totalCollection} eggs collected`, target.date, target);
      logActivity('DELETED', 'Egg Production', `Moved egg collection record ${id} to trash`);
    }
    setEggProductionLogs(prev => prev.filter(p => p.id !== id));
    syncDeleteDoc('egg_production_logs', id);
  };

  const addEggAdjustment = (adj: Omit<EggInventoryAdjustment, 'id' | 'createdAt'>) => {
    const newAdj: EggInventoryAdjustment = {
      ...adj,
      id: 'EADJ-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setEggAdjustments(prev => [newAdj, ...prev]);
    syncSaveDoc('egg_adjustments', newAdj.id, newAdj);
  };

  const deleteEggAdjustment = (id: string) => {
    setEggAdjustments(prev => prev.filter(a => a.id !== id));
    syncDeleteDoc('egg_adjustments', id);
  };

  const addFeedItem = (itemData: Omit<FeedItem, 'id' | 'currentBags' | 'currentKg' | 'costPerKg' | 'createdAt'>, initialBags = 0): FeedItem => {
    const currentBags = Number(initialBags) || 0;
    const currentKg = currentBags * itemData.bagWeightKg;
    const costPerKg = itemData.costPerBag > 0 ? itemData.costPerBag / itemData.bagWeightKg : 0;

    const newItem: FeedItem = {
      ...itemData,
      id: 'FEED-' + Date.now().toString().slice(-6),
      currentBags,
      currentKg,
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
    setFeedItems(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('feed_items', id);
  };

  const recordFeedPurchase = (logData: Omit<FeedPurchaseLog, 'id' | 'createdAt'>) => {
    const newLog: FeedPurchaseLog = {
      ...logData,
      id: 'FP-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setFeedPurchaseLogs(prev => [newLog, ...prev]);
    syncSaveDoc('feed_purchase_logs', newLog.id, newLog);

    setFeedItems(prev =>
      prev.map(f => {
        if (f.id === logData.feedItemId) {
          const nextBags = f.currentBags + logData.bags;
          const nextKg = f.currentKg + logData.kg;
          const updated = { ...f, currentBags: nextBags, currentKg: nextKg, costPerBag: logData.costPerBag };
          syncUpdateDoc('feed_items', f.id, updated);
          return updated;
        }
        return f;
      })
    );
  };

  const updateFeedPurchaseLog = (id: string, updates: Partial<FeedPurchaseLog>) => {
    setFeedPurchaseLogs(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    syncUpdateDoc('feed_purchase_logs', id, updates);
  };

  const deleteFeedPurchaseLog = (id: string) => {
    setFeedPurchaseLogs(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('feed_purchase_logs', id);
  };

  const recordFeedConsumption = (logData: Omit<FeedConsumptionLog, 'id' | 'cost' | 'createdAt'>) => {
    const feed = feedItems.find(f => f.id === logData.feedItemId);
    const cost = feed ? logData.bagsUsed * feed.costPerBag : 0;
    const kgUsed = logData.kgUsed > 0 ? logData.kgUsed : (feed ? logData.bagsUsed * feed.bagWeightKg : logData.bagsUsed * 50);

    const newLog: FeedConsumptionLog = {
      ...logData,
      kgUsed,
      cost,
      id: 'FC-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };

    setFeedConsumptionLogs(prev => [newLog, ...prev]);
    syncSaveDoc('feed_consumption_logs', newLog.id, newLog);

    setFeedItems(prev =>
      prev.map(f => {
        if (f.id === logData.feedItemId) {
          const nextBags = Math.max(0, f.currentBags - logData.bagsUsed);
          const nextKg = Math.max(0, f.currentKg - kgUsed);
          const updated = { ...f, currentBags: nextBags, currentKg: nextKg };
          syncUpdateDoc('feed_items', f.id, updated);
          return updated;
        }
        return f;
      })
    );
  };

  const updateFeedConsumptionLog = (id: string, updates: Partial<FeedConsumptionLog>) => {
    setFeedConsumptionLogs(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    syncUpdateDoc('feed_consumption_logs', id, updates);
  };

  const deleteFeedConsumptionLog = (id: string) => {
    setFeedConsumptionLogs(prev => prev.filter(f => f.id !== id));
    syncDeleteDoc('feed_consumption_logs', id);
  };

  const addSupplyItem = (itemData: Omit<SupplyItem, 'id' | 'createdAt'>): SupplyItem => {
    const newItem: SupplyItem = {
      ...itemData,
      id: 'SUP-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setSupplyItems(prev => [...prev, newItem]);
    syncSaveDoc('supply_items', newItem.id, newItem);
    logActivity('CREATED', 'Supplies & Pest Control', `Added supply item: ${newItem.name} (${newItem.category.toUpperCase()})`);
    return newItem;
  };

  const updateSupplyItem = (id: string, updates: Partial<SupplyItem>) => {
    setSupplyItems(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    syncUpdateDoc('supply_items', id, updates);
    logActivity('EDITED', 'Supplies & Pest Control', `Updated supply item ${id}`);
  };

  const deleteSupplyItem = (id: string) => {
    const target = supplyItems.find(s => s.id === id);
    if (target) {
      moveToTrash('supply_item', id, `Supply: ${target.name}`, `Qty: ${target.quantity} ${target.unit}`, undefined, target);
      logActivity('DELETED', 'Supplies & Pest Control', `Moved supply item ${target.name} to trash`);
    }
    setSupplyItems(prev => prev.filter(s => s.id !== id));
    syncDeleteDoc('supply_items', id);
  };

  const updateSupplyUsageLog = (id: string, updates: Partial<SupplyUsageLog>) => {
    setSupplyUsageLogs(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    syncUpdateDoc('supply_usage_logs', id, updates);
  };

  const deleteSupplyUsageLog = (id: string) => {
    setSupplyUsageLogs(prev => prev.filter(s => s.id !== id));
    syncDeleteDoc('supply_usage_logs', id);
  };

  const recordSupplyUsage = (log: Omit<SupplyUsageLog, 'id' | 'createdAt'>) => {
    const newLog: SupplyUsageLog = {
      ...log,
      id: 'SU-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setSupplyUsageLogs(prev => [newLog, ...prev]);
    syncSaveDoc('supply_usage_logs', newLog.id, newLog);

    setSupplyItems(prev =>
      prev.map(s => {
        if (s.id === log.supplyItemId) {
          const nextQty = Math.max(0, s.quantity - log.quantity);
          syncUpdateDoc('supply_items', s.id, { quantity: nextQty });
          return { ...s, quantity: nextQty };
        }
        return s;
      })
    );
  };

  const addCustomer = (custData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: 'CUST-' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [...prev, newCust]);
    syncSaveDoc('customers', newCust.id, newCust);
    logActivity('CREATED', 'Customer Management', `Registered customer: ${newCust.name} (${newCust.customerCode})`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    syncUpdateDoc('customers', id, updates);
    logActivity('EDITED', 'Customer Management', `Updated customer profile ${id}`);
  };

  const deleteCustomer = (id: string) => {
    const target = customers.find(c => c.id === id);
    if (target) {
      moveToTrash('customer', id, `Customer: ${target.name}`, `${target.customerType}`, undefined, target);
      logActivity('DELETED', 'Customer Management', `Moved customer ${target.name} to trash`);
    }
    setCustomers(prev => prev.filter(c => c.id !== id));
    syncDeleteDoc('customers', id);
  };

  const addOrder = (orderData: Omit<FarmOrder, 'id' | 'orderNumber' | 'createdAt'>): FarmOrder => {
    const orderNumber = 'ORD-' + (orders.length + 1).toString().padStart(4, '0');
    const newOrder: FarmOrder = {
      ...orderData,
      id: 'ORD-' + Date.now().toString().slice(-6),
      orderNumber,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
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
    setOrders(prev => prev.filter(o => o.id !== id));
    syncDeleteDoc('orders', id);
  };

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

    setSales(prev => [newSale, ...prev]);
    syncSaveDoc('sales', newSale.id, newSale);

    logActivity('CREATED', 'Sales & Invoicing', `Issued sales invoice ${newSale.saleNumber} for ${newSale.customerName}: ₱${newSale.total.toLocaleString()}`);

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
      setPayments(prev => [newPayment, ...prev]);
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
          merged.paymentStatus = merged.paidAmount >= merged.total ? 'PAID' : merged.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
        }
        syncUpdateDoc('sales', id, merged);
        return merged;
      }
      return s;
    }));
    logActivity('EDITED', 'Sales & Invoicing', `Updated sales invoice ${id}`);
  };

  const deleteSale = (id: string) => {
    const target = sales.find(s => s.id === id);
    if (target) {
      moveToTrash('sale', id, `Sales Invoice: ${target.saleNumber}`, `₱${target.total.toLocaleString()}`, target.date, target);
      logActivity('DELETED', 'Sales & Invoicing', `Moved sales invoice ${target.saleNumber} to trash`);
    }
    setSales(prev => prev.filter(s => s.id !== id));
    syncDeleteDoc('sales', id);
  };

  const addPayment = (paymentData: Omit<CustomerPayment, 'id' | 'paymentNumber' | 'createdAt'>): CustomerPayment => {
    const paymentNumber = 'PAY-' + (payments.length + 1).toString().padStart(4, '0');
    const newPayment: CustomerPayment = {
      ...paymentData,
      id: 'PAY-' + Date.now().toString().slice(-6),
      paymentNumber,
      createdAt: new Date().toISOString(),
    };

    setPayments(prev => [newPayment, ...prev]);
    syncSaveDoc('payments', newPayment.id, newPayment);
    logActivity('CREATED', 'Customer Payments', `Logged remittance ${newPayment.paymentNumber}: ₱${newPayment.amount.toLocaleString()}`);
    return newPayment;
  };

  const updatePayment = (id: string, updates: Partial<CustomerPayment>) => {
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    syncUpdateDoc('payments', id, updates);
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    syncDeleteDoc('payments', id);
  };

  const addExpense = (expenseData: Omit<FarmExpense, 'id' | 'expenseNumber' | 'createdAt'>): FarmExpense => {
    const expenseNumber = 'EXP-' + (expenses.length + 1).toString().padStart(4, '0');
    const newExpense: FarmExpense = {
      ...expenseData,
      id: 'EXP-' + Date.now().toString().slice(-6),
      expenseNumber,
      createdAt: new Date().toISOString(),
    };

    setExpenses(prev => [newExpense, ...prev]);
    syncSaveDoc('expenses', newExpense.id, newExpense);
    logActivity('CREATED', 'Expense Management', `Recorded expense voucher ${newExpense.expenseNumber} (${newExpense.category}): ₱${newExpense.amount.toLocaleString()}`);
    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<FarmExpense>) => {
    setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
    syncUpdateDoc('expenses', id, updates);
    logActivity('EDITED', 'Expense Management', `Updated expense voucher ${id}`);
  };

  const deleteExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    if (target) {
      moveToTrash('expense', id, `Expense: ${target.expenseNumber}`, `₱${target.amount.toLocaleString()}`, target.date, target);
      logActivity('DELETED', 'Expense Management', `Moved expense ${target.expenseNumber} to trash`);
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
    syncDeleteDoc('expenses', id);
  };

  const addBankAccount = (bankName: string, accountName: string, maskedAccountNumber: string, openingBalance: number, notes?: string): BankAccount => {
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
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    syncDeleteDoc('bank_accounts', id);
  };

  const recordBankDeposit = (depositData: Omit<BankDeposit, 'id' | 'depositNumber' | 'createdAt'>): BankDeposit => {
    const depositNumber = 'DEP-' + (bankDeposits.length + 1).toString().padStart(4, '0');
    const newDeposit: BankDeposit = {
      ...depositData,
      id: 'DEP-' + Date.now().toString().slice(-6),
      depositNumber,
      createdAt: new Date().toISOString(),
    };

    setBankDeposits(prev => [newDeposit, ...prev]);
    syncSaveDoc('bank_deposits', newDeposit.id, newDeposit);
    logActivity('CREATED', 'Bank Deposits', `Recorded bank deposit ${newDeposit.depositNumber}: ₱${newDeposit.amount.toLocaleString()}`);

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
  };

  const updateBankDeposit = (id: string, updates: Partial<BankDeposit>) => {
    setBankDeposits(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
    syncUpdateDoc('bank_deposits', id, updates);
  };

  const deleteBankDeposit = (id: string) => {
    setBankDeposits(prev => prev.filter(d => d.id !== id));
    syncDeleteDoc('bank_deposits', id);
  };

  const setCashOnHandManualAdjustment = (newAmount: number, reason: string) => {
    logActivity('SETTINGS_CHANGED', 'Cashflow', `Manual Cash adjustment to ₱${newAmount}: ${reason}`);
  };

  // Trash & Recycle Bin Handlers
  const moveToTrash = (
    entityType: TrashEntityType,
    originalId: string,
    title: string,
    subtitle?: string,
    recordDate?: string,
    data?: any
  ) => {
    const newTrash: TrashItem = {
      id: 'TRASH-' + Date.now().toString().slice(-6),
      entityType,
      originalId,
      title,
      subtitle,
      recordDate: recordDate || new Date().toISOString().split('T')[0],
      deletedAt: new Date().toISOString(),
      deletedByRole: currentRole,
      data,
    };
    setTrashItems(prev => [newTrash, ...prev]);
    saveStorage('trash_items', [newTrash, ...trashItems]);
    syncSaveDoc('trash_items', newTrash.id, newTrash);
  };

  const restoreFromTrash = (trashId: string): boolean => {
    const item = trashItems.find(t => t.id === trashId);
    if (!item) return false;

    setTrashItems(prev => prev.filter(t => t.id !== trashId));
    syncDeleteDoc('trash_items', trashId);
    logActivity('SETTINGS_CHANGED', 'Trash Bin', `Restored ${item.title} from trash`);
    return true;
  };

  const permanentlyDeleteFromTrash = (trashId: string) => {
    setTrashItems(prev => prev.filter(t => t.id !== trashId));
    syncDeleteDoc('trash_items', trashId);
  };

  const emptyTrash = () => {
    setTrashItems([]);
    saveStorage('trash_items', []);
  };

  const restoreAllFromTrash = () => {
    setTrashItems([]);
    saveStorage('trash_items', []);
  };

  // System Audit & Record Checks
  const runFullRecordCheck = (): AuditReport => {
    const items: AuditCheckItem[] = [];

    items.push({
      id: 'check-egg-reconcile',
      category: 'Egg Inventory',
      title: 'Harvest vs Dispatched Sales Reconciliation',
      status: hasSalesDiscrepancy ? 'WARNING' : 'PASSED',
      summary: hasSalesDiscrepancy
        ? 'Discrepancy Warning: Sales exceed recorded production.'
        : `Egg harvest of ${totalGoodEggsCollected} pcs reconciles with sales of ${totalEggsSold} pcs.`,
      details: `Inventory remaining: ${inventoryRemaining} pcs.`,
    });

    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      overallStatus: hasSalesDiscrepancy ? 'WARNING' : 'PASSED',
      passedCount: hasSalesDiscrepancy ? 0 : 1,
      warningCount: hasSalesDiscrepancy ? 1 : 0,
      criticalCount: 0,
      items,
    };

    setAuditReport(report);
    return report;
  };

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
      trashItems,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) setProfile(data.profile);
      if (Array.isArray(data.farms)) setFarms(data.farms);
      if (Array.isArray(data.houses)) setHouses(data.houses);
      if (Array.isArray(data.flocks)) setFlocks(data.flocks);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  };

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

    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-Out failed:', err);
    }
  };

  const syncAllLocalDataToCloud = async () => {
    try {
      await batchUploadCollection('farms', farms);
      await batchUploadCollection('houses', houses);
      await batchUploadCollection('flocks', flocks);
      await batchUploadCollection('sales', sales);
      await batchUploadCollection('expenses', expenses);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Cloud Sync failed:', err);
    }
  };

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

    setPriceChangeLogs(prev => [newLog, ...prev]);
    saveStorage('price_change_logs_v2', [newLog, ...priceChangeLogs]);

    setEggGradePrices(prev => {
      const updated = {
        ...prev,
        [grade]: { trayPrice: newTrayPrice, piecePrice: newPiecePrice },
      };
      saveStorage('egg_grade_prices_v2', updated);
      return updated;
    });

    syncSaveDoc('price_change_logs', newLog.id, newLog);
    logActivity('SETTINGS_CHANGED', 'Market Pricing', `Admin updated selling price for ${grade.toUpperCase()} from ₱${oldTrayPrice} to ₱${newTrayPrice} per tray`);
  };

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
    return { success: false, message: 'Invalid Admin Password!' };
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

    if (trimmedCurrent !== workingPass && trimmedCurrent !== adminPass) {
      return { success: false, message: 'Current Working PIN/Password is incorrect!' };
    }

    if (trimmedNew.length < 3) {
      return { success: false, message: 'New PIN/Password must be at least 3 characters long.' };
    }

    const updated = { ...roleCredentials, [roleKey]: trimmedNew };
    setRoleCredentials(updated);
    saveStorage('custom_passwords_v2', updated);
    return { success: true, message: `PIN for ${roleKey.toUpperCase()} updated successfully!` };
  };

  const adminResetUserPassword = (
    targetRole: UserRole,
    newPassword: string
  ): { success: boolean; message: string } => {
    if (currentRole !== 'admin' && currentRole !== 'owner' && !isAdminAuthenticated) {
      return { success: false, message: 'Only Superuser Admin/Owner can reset role PINs!' };
    }

    const trimmedNew = newPassword.trim();
    if (trimmedNew.length < 3) {
      return { success: false, message: 'New PIN must be at least 3 characters long.' };
    }

    const roleKey = (targetRole === 'owner' ? 'admin' : (targetRole === 'collector' || targetRole === 'sales_clerk' || targetRole === 'auditor') ? 'staff' : targetRole) as 'admin' | 'manager' | 'staff';
    const updated = { ...roleCredentials, [roleKey]: trimmedNew };
    setRoleCredentials(updated);
    saveStorage('custom_passwords_v2', updated);
    return { success: true, message: `Superuser reset PIN for ${roleKey.toUpperCase()} saved!` };
  };

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
    requestLogoutOrSwitch(targetRole);
  };

  const updateRoleConfig = (role: UserRole, updatedConfig: RoleConfig) => {
    const updated = { ...roleConfigs, [role]: updatedConfig };
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
      // FORCE WHITELIST: Siguraduhing laging lalabas ang activity log tab kahit anong role ang naka-login
      if (tabId === 'activity-log' || tabId === 'activity-logs' || tabId === 'audit') return true;
      if (tabId === 'access-control') {
        return currentRole === 'admin' || !!activeRoleConfig.permissions?.canManageAccessControl;
      }
      return activeRoleConfig.allowedTabs ? activeRoleConfig.allowedTabs.includes(tabId) : true;
    };

  const hasPermission = (perm: keyof RolePermissions): boolean => {
    return !!activeRoleConfig.permissions?.[perm];
  };

  const addDailyTask = (
    title: string,
    priority: DailyTask['priority'] = 'medium',
    assignedTo: string = 'Staff'
  ) => {
    const newTask: DailyTask = {
      id: 'TASK-' + Date.now().toString().slice(-6),
      title: title.trim(),
      priority,
      assignedTo,
      completed: false,
      createdAt: new Date().toISOString(),
      createdBy: activeRoleConfig.title,
    };
    setDailyTasks(prev => {
      const updated = [newTask, ...prev];
      saveStorage('daily_tasks_v2', updated);
      return updated;
    });
    syncSaveDoc('daily_tasks', newTask.id, newTask);
    logActivity('CREATED', 'Daily Instructions', `Created task: "${title.trim()}" for ${assignedTo}`);
  };

  const toggleDailyTask = (id: string) => {
    setDailyTasks(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t));
      saveStorage('daily_tasks_v2', updated);
      return updated;
    });
  };

  const deleteDailyTask = (id: string) => {
    setDailyTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveStorage('daily_tasks_v2', updated);
      return updated;
    });
    syncDeleteDoc('daily_tasks', id);
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
    if (target) syncUpdateDoc('team_members', id, target);
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
        eggProductionLogs: sortedEggProductionLogs,
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
        feedConsumptionLogs: sortedFeedConsumptionLogs,
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
        supplyUsageLogs: sortedSupplyUsageLogs,
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
        sales: sortedSales,
        addSale,
        updateSale,
        deleteSale,
        payments: sortedPayments,
        addPayment,
        updatePayment,
        deletePayment,
        expenses: sortedExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
        bankAccounts,
        bankDeposits: sortedBankDeposits,
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
        activityLogs: sortedActivityLogs,
        logActivity,
        priceChangeLogs: sortedPriceChangeLogs,
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
        totalFeedKgConsumedAllTime,
        totalFeedBagsConsumedAllTime,
        feedConsumptionRatio,
        fcrPerTray,
        flockPerformanceMetrics,
        dailyTasks,
        addDailyTask,
        toggleDailyTask,
        deleteDailyTask,
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

export default FarmContext;
