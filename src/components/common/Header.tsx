/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  RefreshCw,
  Cloud,
  Smartphone,
} from 'lucide-react';
import { formatCurrency } from '../../constants';
import { CloudSyncModal } from './CloudSyncModal';
import { RoleSwitcher } from './RoleSwitcher';

interface HeaderProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate }) => {
  const {
    profile,
    cashOnHand,
    totalAvailableTrays,
    flocks,
    auditReport,
    runFullRecordCheck,
    syncStatus,
    activeRoleConfig,
  } = useFarm();
  const [cloudModalOpen, setCloudModalOpen] = useState(false);

  const totalLiveBirds = flocks.reduce((sum, f) => sum + f.currentPopulation, 0);

  const todayStr = new Date().toLocaleDateString('en-PH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left: Current Section & Quick Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs md:text-sm">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-slate-700">{todayStr}</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>{profile.address}</span>
          </div>
        </div>

        {/* Center/Right: Live Key Status Pills + Role Switcher */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Active Role Switcher */}
          <RoleSwitcher />

          {/* Cloud Sync Status Pill */}
          <button
            onClick={() => setCloudModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 text-emerald-900 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            title="Real-time Firebase Firestore active - Click for multi-device & Android connection guide"
          >
            <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-amber-600' : 'text-emerald-600'}`} />
            <span className="font-semibold text-emerald-800">Cloud Synced</span>
            <Smartphone className="w-3 h-3 text-emerald-700 ml-0.5 hidden lg:inline" />
          </button>

          {/* Quick Bird Count (Flock permission only) */}
          {activeRoleConfig.permissions.viewFlockMetrics && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/70 text-amber-900 text-xs px-2.5 py-1 rounded-md">
              <span className="font-semibold">{totalLiveBirds.toLocaleString()}</span>
              <span className="text-amber-700 hidden sm:inline">Live Birds</span>
            </div>
          )}

          {/* Quick Available Trays (Inventory permission only) */}
          {activeRoleConfig.permissions.viewInventoryMetrics && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/70 text-emerald-900 text-xs px-2.5 py-1 rounded-md">
              <span className="font-semibold">{totalAvailableTrays.toLocaleString()}</span>
              <span className="text-emerald-700 hidden sm:inline">Trays Avail</span>
            </div>
          )}

          {/* Cash on Hand (Financial permission only - strictly hidden for workers/sales clerks) */}
          {activeRoleConfig.permissions.viewFinancialMetrics && (
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-md">
              <span className="text-slate-500 hidden sm:inline">Cash:</span>
              <span className="font-semibold">{formatCurrency(cashOnHand)}</span>
            </div>
          )}

          {/* Audit Quick Trigger (Audit permission only) */}
          {activeRoleConfig.permissions.canRunAudits && (
            <button
              onClick={() => {
                runFullRecordCheck();
                onNavigate('record-check');
              }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                auditReport?.overallStatus === 'CRITICAL'
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  : auditReport?.overallStatus === 'WARNING'
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
              title="Run quick data reconciliation audit"
            >
              {auditReport?.overallStatus === 'CRITICAL' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              ) : auditReport?.overallStatus === 'WARNING' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="hidden md:inline">
                {auditReport ? `Audit: ${auditReport.overallStatus}` : 'Audit Records'}
              </span>
            </button>
          )}

          {/* Upload Logo Fast Link if not set (System Admin permission only) */}
          {activeRoleConfig.permissions.canManageSystem && !profile.logoUrl && (
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs px-2.5 py-1 rounded-md font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Farm Logo</span>
            </button>
          )}
        </div>
      </header>

      {/* Cloud Sync & Android Setup Guide Modal */}
      <CloudSyncModal isOpen={cloudModalOpen} onClose={() => setCloudModalOpen(false)} />
    </>
  );
};
