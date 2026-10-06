/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Wrench,
  Trash2,
} from 'lucide-react';
import { AuditCheckItem, AuditReport } from '../../types';

interface AuditCenterViewProps {
  onNavigate?: (view: string) => void;
}

export const AuditCenterView: React.FC<AuditCenterViewProps> = ({ onNavigate }) => {
  const {
    runFullRecordCheck,
    auditReport,
    payments,
    sales,
    deletePaymentRemittance,
  } = useFarm();

  const [report, setReport] = useState<AuditReport>(() => auditReport || runFullRecordCheck());
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // INSTRUCTION 1: STATE MANAGEMENT FOR DISCREPANCY SCANNER
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [discrepancyList, setDiscrepancyList] = useState<
    Array<{
      id: string;
      type: string;
      module: string;
      description: string;
      rawData: any;
    }>
  >([]);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanExecuted, setScanExecuted] = useState<boolean>(false);

  // INSTRUCTION 2: INTERACTIVE ENGINE SCAN LOGIC
  const triggerFullRecordScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setDiscrepancyList([]);
    setScanLogs(['Initializing core integrity engines...']);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);

          // EXECUTE ACTUAL CRITICAL AUDIT ONCE PROGRESS COMPLETES
          const foundErrors: Array<{
            id: string;
            type: string;
            module: string;
            description: string;
            rawData: any;
          }> = [];

          // Audit Check: Cross-match payment remittances vs sales invoices
          if (payments && sales) {
            const dangling = payments.filter(
              p => p.saleId && !sales.some(s => s.id === p.saleId)
            );

            dangling.forEach(badPayment => {
              foundErrors.push({
                id: badPayment.id,
                type: 'CRITICAL MISMATCH',
                module: 'Customer Payments / Remittances',
                description: `Dangling payment ${badPayment.paymentNumber || badPayment.id} of ₱${badPayment.amount.toLocaleString()} has no valid matching sales invoice.`,
                rawData: badPayment,
              });
            });
          }

          const newReport = runFullRecordCheck();
          setReport(newReport);
          setDiscrepancyList(foundErrors);
          setIsScanning(false);
          setScanExecuted(true);
          return 100;
        }

        // Update intermediate log ticks based on percentage tiers
        if (prev === 25) setScanLogs(l => [...l, 'Scanning egg inventories vs dispatch logs...']);
        if (prev === 50) setScanLogs(l => [...l, 'Auditing sales invoice database rows...']);
        if (prev === 75) setScanLogs(l => [...l, 'Cross-checking payment remittance ledgers...']);

        return prev + 5;
      });
    }, 100);
  };

  const handleFixLinkInvoice = (errId: string) => {
    if (onNavigate) {
      onNavigate('sales');
    } else {
      alert(`Redirecting to sales invoice manager to link entry: ${errId}`);
    }
  };

  const handleVoidRecord = (errId: string) => {
    if (confirm(`Void unlinked remittance record ${errId}? Record will be moved to trash.`)) {
      deletePaymentRemittance(errId);
      setDiscrepancyList(prev => prev.filter(e => e.id !== errId));
    }
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
          onClick={triggerFullRecordScan}
          disabled={isScanning}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? `Scanning System (${scanProgress}%)` : 'Run Full Record Check'}</span>
        </button>
      </div>

      {/* VIRUS-SCAN PROGRESS ANIMATION BAR */}
      {isScanning && (
        <div className="p-5 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-400 font-mono">Real-time Telemetry Deep Scan in Progress...</span>
            <span className="font-mono text-white">{scanProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-100 shadow-xs"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <div className="text-xs text-slate-300 font-mono animate-pulse flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{scanLogs[scanLogs.length - 1]}</span>
          </div>
        </div>
      )}

      {/* INSTRUCTION 3: GENERIC CONDITIONAL RENDER FOR DISCREPANCY REPAIR HUB */}
      {scanExecuted && !isScanning && (
        <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-slate-900 font-bold font-heading text-sm flex items-center gap-2">
              {discrepancyList.length === 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>✅ Ledger Integrity Operational</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>🚨 Anomalies Detected for Remediation</span>
                </>
              )}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${discrepancyList.length === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {discrepancyList.length} Action Items Found
            </span>
          </div>

          {discrepancyList.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg border border-rose-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-rose-100/60 border-b border-rose-200 text-rose-950 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Module Layer</th>
                    <th className="p-3">Issue Fault Description</th>
                    <th className="p-3 text-center">Diagnostic Repair Utilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 font-medium">
                  {discrepancyList.map((issue) => (
                    <tr key={issue.id} className="border-b border-slate-100 hover:bg-rose-50/50 transition-colors">
                      <td className="p-3 font-bold text-rose-700">{issue.module}</td>
                      <td className="p-3 text-slate-800">{issue.description}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleFixLinkInvoice(issue.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Fix / Link Invoice</span>
                          </button>
                          <button
                            onClick={() => handleVoidRecord(issue.id)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Void Record</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-emerald-800 text-xs font-medium bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-sm text-emerald-900">General Ledger Verified & Operational</p>
              <p className="text-slate-600">
                No orphaned or unlinked database rows detected. General ledger matches system state variables perfectly.
              </p>
            </div>
          )}
        </div>
      )}

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
