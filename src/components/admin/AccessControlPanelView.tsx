/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { ALL_APP_MODULES, USER_ROLES } from '../../constants';
import { UserRole, RoleConfig, RolePermissions } from '../../types';
import {
  ShieldCheck,
  Lock,
  Eye,
  CheckSquare,
  Square,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Shield,
  KeyRound,
  Sparkles,
  Sliders,
  DollarSign,
  Bird,
  ShoppingCart,
  Package,
  PlusCircle,
  Landmark,
  Settings,
  Trash2,
  FileSearch,
} from 'lucide-react';

interface AccessControlPanelViewProps {
  onNavigate?: (tab: string) => void;
}

export const AccessControlPanelView: React.FC<AccessControlPanelViewProps> = ({ onNavigate }) => {
  const {
    currentRole,
    setRole,
    roleConfigs,
    updateRoleConfig,
    resetRoleConfigs,
    adminResetUserPassword,
  } = useFarm();

  const [selectedRole, setSelectedRole] = useState<'manager' | 'staff'>('manager');
  const [editingConfig, setEditingConfig] = useState<RoleConfig>(
    roleConfigs.manager || USER_ROLES.manager
  );
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const [resetRole, setResetRole] = useState<UserRole>('staff');
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Sync editingConfig whenever selectedRole or roleConfigs changes
  useEffect(() => {
    if (roleConfigs[selectedRole]) {
      setEditingConfig({ ...roleConfigs[selectedRole] });
    } else {
      setEditingConfig({ ...USER_ROLES[selectedRole] });
    }
  }, [selectedRole, roleConfigs]);

  const handleRoleTabChange = (role: 'manager' | 'staff') => {
    setSelectedRole(role);
  };

  // Toggle module tab access
  const handleToggleTab = (tabId: string) => {
    const currentTabs = editingConfig.allowedTabs || [];
    const isAllowed = currentTabs.includes(tabId);
    const newTabs = isAllowed
      ? currentTabs.filter(t => t !== tabId)
      : [...currentTabs, tabId];

    setEditingConfig(prev => ({
      ...prev,
      allowedTabs: newTabs,
    }));
  };

  const handleSelectAllTabs = () => {
    const allTabIds = ALL_APP_MODULES.map(m => m.id);
    setEditingConfig(prev => ({
      ...prev,
      allowedTabs: allTabIds,
    }));
  };

  const handleDeselectAllTabs = () => {
    // Keep at least dashboard allowed
    setEditingConfig(prev => ({
      ...prev,
      allowedTabs: ['dashboard'],
    }));
  };

  // Toggle granular action permission
  const handleTogglePermission = (permKey: keyof RolePermissions) => {
    setEditingConfig(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey],
      },
    }));
  };

  const handleSave = () => {
    updateRoleConfig(selectedRole, editingConfig);
    setSaveToast(`Permissions for "${editingConfig.title}" saved and applied across the app!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleResetRole = () => {
    const defaultConfig = USER_ROLES[selectedRole];
    setEditingConfig({ ...defaultConfig });
    updateRoleConfig(selectedRole, { ...defaultConfig });
    setSaveToast(`Reset "${selectedRole}" permissions to default factory settings.`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleResetAll = () => {
    resetRoleConfigs();
    setSaveToast('All role access settings reset to default.');
    setTimeout(() => setSaveToast(null), 4000);
  };

  if (currentRole !== 'admin') {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-heading text-slate-900 mb-2">Access Control Panel Restricted</h2>
        <p className="text-sm text-slate-600 mb-4">
          Only Superuser Admin can configure RBAC permissions for Manager and Staff roles.
        </p>
        <button
          onClick={() => setRole('admin')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          Authenticate as Admin
        </button>
      </div>
    );
  }

  const permissionList: { key: keyof RolePermissions; label: string; description: string; icon: any }[] = [
    {
      key: 'viewFinancialMetrics',
      label: 'Financial Metrics Visibility',
      description: 'Bank balances, Cash on Hand, Sales revenue, Expenses, Cost calculations & P&L',
      icon: DollarSign,
    },
    {
      key: 'viewFlockMetrics',
      label: 'Flock Metrics Visibility',
      description: 'Live bird population, Mortalities, Lay rates & Flock health statistics',
      icon: Bird,
    },
    {
      key: 'viewSalesMetrics',
      label: 'Sales & Orders Visibility',
      description: 'Customer orders, Sales invoices, Payment history & Accounts receivables',
      icon: ShoppingCart,
    },
    {
      key: 'viewInventoryMetrics',
      label: 'Inventory Metrics Visibility',
      description: 'Egg trays available, Feed stock levels & Medicine inventory quantities',
      icon: Package,
    },
    {
      key: 'canLogProduction',
      label: 'Log Egg Production & Mortalities',
      description: 'Add or edit daily egg harvest logs, flock mortality & feed usage entries',
      icon: PlusCircle,
    },
    {
      key: 'canLogSales',
      label: 'Log Sales, Orders & Payments',
      description: 'Create new customer orders, issue sales invoices & record customer payments',
      icon: PlusCircle,
    },
    {
      key: 'canLogExpenses',
      label: 'Log Expenses & Feed Purchases',
      description: 'Add new expense records and log feed batch purchases',
      icon: PlusCircle,
    },
    {
      key: 'canManageBanking',
      label: 'Manage Bank Accounts & Deposits',
      description: 'Add or edit bank accounts, deposit slips & internal cash transfers',
      icon: Landmark,
    },
    {
      key: 'canManageSystem',
      label: 'Manage System Settings & Profile',
      description: 'Modify farm branding, address, currency, database backup/reset',
      icon: Settings,
    },
    {
      key: 'canRunAudits',
      label: 'Run Record Check & Reconciliations',
      description: 'Execute automated audit center checks and mathematical reconciliations',
      icon: FileSearch,
    },
    {
      key: 'canDeleteRecords',
      label: 'Delete Records & Empty Trash',
      description: 'Move records to Trash Bin, restore, or permanently delete trash items',
      icon: Trash2,
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <ShieldCheck className="w-96 h-96 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SUPERUSER ACCESS CONTROL PANEL (RBAC)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-white tracking-tight">
              Role & Access Permissions Management
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              As Admin, customize exactly what the <strong className="text-emerald-300">Manager</strong> and <strong className="text-amber-300">Staff</strong> roles can see and do. Unchecked pages and actions are completely hidden (blinded) for restricted users.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleResetAll}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Defaults</span>
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => handleRoleTabChange('manager')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            selectedRole === 'manager'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Configure Manager Role</span>
        </button>

        <button
          onClick={() => handleRoleTabChange('staff')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            selectedRole === 'staff'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Configure Staff Role</span>
        </button>

        <div className="ml-auto hidden md:flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Test Active Role:</span>
          <button
            onClick={() => setRole(selectedRole)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            title={`Switch to ${editingConfig.title} view to preview restricted UI`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Switch to {editingConfig.title}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Section 1 (Modules) & Section 2 (Permissions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Module Navigation Page Visibility */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Page & Navigation Access</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Checkboxes for pages visible in Sidebar & Routing for {editingConfig.title}.
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleSelectAllTabs}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleDeselectAllTabs}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {ALL_APP_MODULES.map(mod => {
              const isAllowed = (editingConfig.allowedTabs || []).includes(mod.id);

              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleToggleTab(mod.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                    isAllowed
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-500 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="truncate pr-2">{mod.label}</span>
                  {isAllowed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Feature & Action Capabilities */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Feature & Action Permissions</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control granular visibility of financial cards, add buttons, and sensitive features.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {permissionList.map(item => {
              const Icon = item.icon;
              const isEnabled = !!editingConfig.permissions[item.key];

              return (
                <div
                  key={item.key}
                  onClick={() => handleTogglePermission(item.key)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isEnabled
                      ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold font-heading ${isEnabled ? 'text-white' : 'text-slate-800'}`}>
                        {item.label}
                      </span>
                      {isEnabled ? (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          ENABLED
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${isEnabled ? 'text-slate-300' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: OWNER CREDENTIALS RESET PANEL */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
                <span>Owner Credentials Reset Panel</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sole capability for the Owner to generate or designate a new PIN/Password for any user role.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/30 self-start sm:self-auto">
            OWNER SOLE PRIVILEGE
          </span>
        </div>

        {resetMessage && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{resetMessage}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!resetNewPin.trim()) return;
            const res = adminResetUserPassword(resetRole, resetNewPin);
            setResetSuccessMessage(res.message);
            setResetNewPin('');
            setTimeout(() => setResetSuccessMessage(null), 4000);
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-1"
        >
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-heading">
              Select Role to Reset
            </label>
            <select
              value={resetRole}
              onChange={(e) => setResetRole(e.target.value as UserRole)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="admin">Superuser Admin</option>
              <option value="manager">Farm Manager</option>
              <option value="staff">Farm Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-heading">
              New PIN / Password (type="password")
            </label>
            <input
              type="password"
              value={resetNewPin}
              onChange={(e) => setResetNewPin(e.target.value)}
              placeholder="Enter new PIN..."
              required
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Set & Save Role PIN</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Save & Action Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 font-heading">
              Editing: {editingConfig.title}
            </div>
            <div className="text-[11px] text-slate-500">
              {(editingConfig.allowedTabs || []).length} pages open • {Object.values(editingConfig.permissions).filter(Boolean).length} action permissions active
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetRole}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Role</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Immediately</span>
          </button>
        </div>
      </div>
    </div>
  );
};
