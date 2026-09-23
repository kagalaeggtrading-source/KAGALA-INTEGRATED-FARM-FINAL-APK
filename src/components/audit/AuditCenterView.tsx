/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AuditCheckItem, AuditReport } from '../../types';

interface AuditCenterViewProps {
  onNavigate?: (view: string) => void;
}

export const AuditCenterView: React.FC<AuditCenterViewProps> = ({ onNavigate }) => {
  const { runFullRecordCheck, auditReport } = useFarm();
  const [report, setReport] = useState<AuditReport>(() => auditReport || runFullRecordCheck());
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const newReport = runFullRecordCheck();
      setReport(newReport);
      setIsAuditing(false);
    }, 400);
  };

  const filteredItems = report.items.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.status.toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Farm Record Check & Reconciliation Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated mathematical cross-auditor inspecting egg inventories, bird mortality equations, cash drawers, feed balances, and sales ledgers.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing Ledgers...' : 'Run Full Record Check'}</span>
        </button>
      </div>

      {/* Audit Verdict Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          report.criticalCount > 0
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : report.warningCount > 0
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-start gap-3">
          {report.criticalCount > 0 ? (
            <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          ) : report.warningCount > 0 ? (
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-heading font-bold text-base">
              {report.criticalCount > 0
                ? 'Action Required: Ledger Inconsistencies Detected'
                : report.warningCount > 0
                ? 'Notice: Operational Advisories Detected'
                : 'All Financial, Inventory & Flock Records Are Balanced'}
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              Audited at {new Date(report.timestamp).toLocaleTimeString()} across 7 core integrity engines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-xs text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Passed</span>
            <span className="font-bold font-mono text-emerald-700 text-sm">{report.passedCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-xs text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Warnings</span>
            <span className="font-bold font-mono text-amber-600 text-sm">{report.warningCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-xs text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Critical</span>
            <span className="font-bold font-mono text-rose-600 text-sm">{report.criticalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'CRITICAL', 'WARNING', 'PASSED'].map(f => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
              selectedFilter.toLowerCase() === f.toLowerCase()
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Detailed Check Items List */}
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border bg-white shadow-2xs space-y-2 transition-colors ${
              item.status === 'CRITICAL'
                ? 'border-rose-200'
                : item.status === 'WARNING'
                ? 'border-amber-200'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {item.status === 'CRITICAL' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                    CRITICAL
                  </span>
                ) : item.status === 'WARNING' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    WARNING
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    PASSED
                  </span>
                )}
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  {item.category}
                </span>
                <h3 className="font-heading font-bold text-sm text-slate-900">{item.title}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.summary}</p>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg font-mono">
              {item.details}
            </div>

            {item.recommendation && (
              <div className="text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-lg flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Recommended Correction: </span>
                  <span>{item.recommendation}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
