/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  LayoutDashboard,
  Bird,
  Egg,
  PackageCheck,
  Wheat,
  Pill,
  Users,
  ShoppingCart,
  Receipt,
  CreditCard,
  TrendingDown,
  Landmark,
  CircleDollarSign,
  Calculator,
  FileCheck2,
  Settings,
  Upload,
  Trash2,
  Shield,
  ShieldCheck,
  Lock,
  Clock,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate }) => {
  const {
    profile,
    orders,
    auditReport,
    trashItems,
    activeRoleConfig,
    isTabAllowed,
    currentRole,
    requestLogoutOrSwitch,
  } = useFarm();

  const pendingOrdersCount = orders.filter(
    o => o.status === 'NEW' || o.status === 'CONFIRMED' || o.status === 'RESERVED'
  ).length;

  const allNavItems = [
    ...(currentRole === 'admin' || currentRole === 'owner'
      ? [
          { id: 'access-control', label: '🛡️ Access Control Panel', icon: ShieldCheck },
          { id: 'activity-logs', label: '📜 Activity Audit Logs', icon: Clock },
        ]
      : []),
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'flock', label: 'Flock / RTL Birds', icon: Bird },
    { id: 'production', label: 'Daily Egg Production', icon: Egg },
    { id: 'inventory', label: 'Egg Inventory', icon: PackageCheck },
    { id: 'feed', label: 'Feed & Consumption', icon: Wheat },
    { id: 'supplies', label: 'Medicine & Supplies', icon: Pill },
    { id: 'customers', label: 'Customer Management', icon: Users },
    { id: 'orders', label: 'Order Management', icon: ShoppingCart, badge: pendingOrdersCount },
    { id: 'sales', label: 'Sales & Invoicing', icon: Receipt },
    { id: 'payments', label: 'Customer Payments', icon: CreditCard },
    { id: 'expenses', label: 'Expense Management', icon: TrendingDown },
    { id: 'bank-deposits', label: 'Bank & Deposits', icon: Landmark },
    { id: 'cashflow', label: 'Cashflow Accounts', icon: CircleDollarSign },
    { id: 'production-cost', label: 'Cost of Production', icon: Calculator },
    {
      id: 'record-check',
      label: '🔍 Record Check',
      icon: FileCheck2,
      badgeText: auditReport?.overallStatus === 'CRITICAL' ? 'ALERT' : auditReport?.overallStatus === 'WARNING' ? 'WARN' : undefined,
      badgeColor: auditReport?.overallStatus === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-500',
    },
    {
      id: 'trash',
      label: 'Trash Bin',
      icon: Trash2,
      badge: trashItems.length > 0 ? trashItems.length : undefined,
    },
    { id: 'settings', label: 'Farm Profile & Branding', icon: Settings },
  ];

  const navItems = allNavItems.filter(item => isTabAllowed(item.id));
  const hiddenCount = allNavItems.length - navItems.length;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {profile.logoUrl ? (
            <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden border border-slate-700 shadow-xs">
              <img
                src={profile.logoUrl}
                alt="Kagala Integrated Farm Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <button
              onClick={() => onNavigate('settings')}
              className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-600 hover:border-emerald-500 bg-slate-800/50 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 text-[10px] p-1 text-center transition-colors group cursor-pointer"
              title="Click to Upload Official Farm Logo"
            >
              <Upload className="w-4 h-4 mb-0.5 group-hover:scale-110 transition-transform" />
              <span>Upload Logo</span>
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-sm tracking-wide text-white truncate leading-tight">
              {profile.farmName}
            </h1>
            <p className="text-[11px] font-medium text-emerald-400 tracking-wider uppercase mt-0.5 truncate">
              {profile.tagline || 'Grow Raise Sustain'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/70 px-2.5 py-1.5 rounded-md border border-slate-700/60">
          <span className="truncate">COMMAND CENTER</span>
          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">v1.0</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1 custom-scrollbar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isRecordCheck = item.id === 'record-check';

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left group cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : isRecordCheck
                  ? 'text-amber-300 hover:bg-slate-800/80 hover:text-amber-200'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : isRecordCheck ? 'text-amber-400' : 'text-slate-400 group-hover:text-emerald-400'
                }`}
              />
              <span className="flex-1 truncate">{item.label}</span>

              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}

              {item.badgeText && (
                <span className={`${item.badgeColor || 'bg-amber-500'} text-white text-[9px] font-bold px-1.5 py-0.5 rounded`}>
                  {item.badgeText}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Boundary Status in Sidebar */}
      <div className="px-3 py-2.5 border-t border-slate-800 bg-slate-950/60 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            Active Session
          </span>
          {(currentRole === 'admin' || currentRole === 'owner') && (
            <button
              onClick={requestLogoutOrSwitch}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
            >
              Lock Session
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-white flex items-center justify-between">
          <span className="truncate">{activeRoleConfig.badge}</span>
        </div>

        {hiddenCount > 0 ? (
          <div className="flex items-center gap-1 text-[10px] text-amber-400/90 mt-0.5">
            <Lock className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{hiddenCount} modules hidden by role boundaries</span>
          </div>
        ) : (
          <div className="text-[10px] text-emerald-400/80">Full unrestricted farm access</div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[10px]">Contact:</span>
          <span className="font-mono text-slate-300 text-[10px]">{profile.contactNumber}</span>
        </div>
        <div className="text-[10px] text-slate-500 truncate">{profile.address}</div>
      </div>
    </aside>
  );
};
