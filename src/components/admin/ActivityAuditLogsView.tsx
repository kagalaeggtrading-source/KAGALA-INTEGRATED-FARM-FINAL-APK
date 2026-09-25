/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  ShieldAlert,
  Search,
  Filter,
  Lock,
  UserCheck,
  Shield,
  KeyRound,
  FileText,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ActionType, ActivityLog } from '../../types';
import { ExcelReportGenerator } from './ExcelReportGenerator';

export const ActivityAuditLogsView: React.FC = () => {
  const {
    activityLogs,
    currentRole,
    isAdminAuthenticated,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const isAuthorized = currentRole === 'admin' || currentRole === 'owner' || isAdminAuthenticated;

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-heading text-slate-900 mb-2">Activity Audit Logs Restricted</h2>
        <p className="text-sm text-slate-600 mb-4">
          The System Activity Audit Trail is strictly hidden from Staff and Manager accounts. Only Superuser Admin can inspect audit logs.
        </p>
      </div>
    );
  }

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch =
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.module || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = selectedActionType === 'all' || log.actionType === selectedActionType;
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;

    return matchesSearch && matchesAction && matchesModule;
  });

  const getActionBadge = (action: ActionType) => {
    switch (action) {
      case 'CREATED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'EDITED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DELETED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'SWITCH_AUTHORIZED':
      case 'LOGIN':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'SETTINGS_CHANGED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const uniqueModules = Array.from(new Set(activityLogs.map(l => l.module))).filter(Boolean);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* EXCEL REPORT GENERATOR COMPONENT */}
      <ExcelReportGenerator />

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
                <span>System Activity & Security Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive immutable timeline capturing user actions, modifications, deletions, and security overrides.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>SUPERUSER AUDIT TRAIL</span>
            </span>
          </div>
        </div>

        {/* Read-Only Rule Advisory */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0 text-amber-700" />
          <span className="font-semibold">STRICTLY READ-ONLY AUDIT TRAIL: </span>
          <span>
            Activity log entries are immutable and cannot be deleted by any user account to preserve historical integrity.
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search audit details, staff name, or module..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Action:</span>
          </div>
          <select
            value={selectedActionType}
            onChange={e => setSelectedActionType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Actions</option>
            <option value="CREATED">CREATED</option>
            <option value="EDITED">EDITED</option>
            <option value="DELETED">DELETED</option>
            <option value="SWITCH_AUTHORIZED">SWITCH AUTHORIZED</option>
            <option value="LOGIN">LOGIN</option>
            <option value="SETTINGS_CHANGED">SETTINGS CHANGED</option>
          </select>

          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 shrink-0 ml-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Module:</span>
          </div>
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Modules</option>
            {uniqueModules.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Audit Trail History ({filteredLogs.length} entries)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Immutable Log Ledger</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No activity log entries found</p>
            <p className="mt-1 text-slate-400 max-w-sm mx-auto">
              System activities, user logins, and data edits will automatically record here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User / Actor</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Activity Trail & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.userName || log.userRole.toUpperCase()}</div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{log.userRole}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">{log.module}</td>
                    <td className="p-3 text-slate-700 leading-relaxed max-w-xl">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
