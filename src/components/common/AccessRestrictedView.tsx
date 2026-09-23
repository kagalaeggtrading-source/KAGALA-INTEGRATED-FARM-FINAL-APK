/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { Lock, ShieldAlert, ArrowLeft, RotateCcw } from 'lucide-react';

interface AccessRestrictedViewProps {
  attemptedTab: string;
  onNavigate: (tab: string) => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  attemptedTab,
  onNavigate,
}) => {
  const { currentRole, setRole, activeRoleConfig } = useFarm();

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'expenses':
        return 'Expense Management';
      case 'bank-deposits':
        return 'Bank & Deposits';
      case 'cashflow':
        return 'Cashflow Accounts';
      case 'production-cost':
        return 'Cost of Production Analysis';
      case 'record-check':
        return 'Reconciliation Record Check';
      case 'trash':
        return 'Trash Bin';
      case 'settings':
        return 'Farm Profile & Database Settings';
      case 'flock':
        return 'Flock / RTL Birds';
      case 'feed':
        return 'Feed & Inventory';
      case 'supplies':
        return 'Medicine & Supplies';
      case 'sales':
        return 'Sales & Invoicing';
      case 'orders':
        return 'Order Management';
      case 'payments':
        return 'Customer Payments';
      case 'reports':
        return 'Executive Reports';
      default:
        return tab.toUpperCase();
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-2xl mx-auto flex flex-col items-center justify-center text-center min-h-[60vh]">
      <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mb-5 text-amber-600 shadow-sm">
        <Lock className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-3">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
        <span>Role Boundary Restriction</span>
      </div>

      <h2 className="text-xl md:text-2xl font-bold font-heading text-slate-900 mb-2">
        Access to "{getTabLabel(attemptedTab)}" is Restricted
      </h2>

      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        Your active role is <strong className="text-slate-900">{activeRoleConfig.badge}</strong>.
        Under farm access boundaries, {activeRoleConfig.boundarySummary.toLowerCase()}
      </p>

      <div className="w-full bg-white p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2 mb-6 shadow-2xs">
        <div className="font-bold text-slate-700 font-heading uppercase tracking-wider text-[11px]">
          Why is this boundary in place?
        </div>
        <p className="text-slate-500 leading-relaxed">
          {currentRole === 'collector' &&
            'Field caretakers focus purely on bird health, daily egg harvest counts, and feed usage. Financial figures, invoices, and bank accounts are restricted to preserve enterprise privacy.'}
          {currentRole === 'sales_clerk' &&
            'Sales and dispatch cashiers manage customer orders and deliveries. Flock mortalities, feed ration formulas, operating expenses, and bank accounts are restricted.'}
          {currentRole === 'manager' &&
            'Farm supervisors manage operational logs and day-to-day sales. Direct bank ledger adjustments, database wipe/reset, and farm branding are reserved exclusively for the Farm Owner.'}
          {currentRole === 'auditor' &&
            'Auditors perform read-only financial compliance reviews and are restricted from logging operational flock data.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Command Center</span>
        </button>

        {currentRole !== 'owner' && (
          <button
            onClick={() => setRole('owner')}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Switch to Owner (Full Access)</span>
          </button>
        )}
      </div>
    </div>
  );
};
