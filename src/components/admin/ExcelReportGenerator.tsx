/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Lock,
  CheckCircle2,
  Table,
  Filter,
  Layers,
} from 'lucide-react';
import {
  ExcelReportFilter,
  generateMultiSheetExcelReport,
} from '../../utils/excelReportGenerator';

export const ExcelReportGenerator: React.FC = () => {
  const {
    profile,
    sales,
    payments,
    expenses,
    bankDeposits,
    eggProductionLogs,
    supplyItems,
    activityLogs,
    currentRole,
    isAdminAuthenticated,
  } = useFarm();

  const [periodType, setPeriodType] = useState<ExcelReportFilter['periodType']>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Secure Access: Restricted strictly to Admin/Owner
  const isAuthorized = currentRole === 'admin' || currentRole === 'owner' || isAdminAuthenticated;

  if (!isAuthorized) return null;

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();

    const filter: ExcelReportFilter = {
      periodType,
      selectedDate,
      selectedMonth,
      selectedYear,
    };

    generateMultiSheetExcelReport(
      profile,
      filter,
      sales,
      payments,
      expenses,
      bankDeposits,
      eggProductionLogs,
      supplyItems,
      activityLogs
    );

    setExportSuccess('Multi-Sheet Excel Spreadsheet generated and downloaded successfully!');
    setTimeout(() => setExportSuccess(null), 4000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold font-heading text-white flex items-center gap-2">
              <span>Financial & Inventory Excel Report Engine</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Generate a multi-tab Excel spreadsheet containing formatted data across 6 individual sheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin Restricted Engine</span>
          </span>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-semibold">{exportSuccess}</span>
        </div>
      )}

      <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Filter Dropdown */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-heading flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Report Period Filter</span>
          </label>
          <select
            value={periodType}
            onChange={e => setPeriodType(e.target.value as any)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="daily">Daily Report</option>
            <option value="weekly">Weekly Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="annual">Annual Report</option>
            <option value="all">All Time (Full Ledger)</option>
          </select>
        </div>

        {/* Date / Month Picker based on period */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-heading flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Specific Period</span>
          </label>

          {periodType === 'daily' || periodType === 'weekly' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer font-mono"
            />
          ) : periodType === 'monthly' ? (
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer font-mono"
            />
          ) : periodType === 'annual' ? (
            <input
              type="number"
              min="2020"
              max="2035"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          ) : (
            <div className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-medium italic">
              All transactions & logs
            </div>
          )}
        </div>

        {/* Multi-Sheet Tab Preview Badges */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compiled Multi-Sheet Spreadsheet Structure (6 Tabs):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-emerald-300 font-mono">1. Summary Dashboard</span>
            <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">2. Sales & Collection Log</span>
            <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">3. Farm Expenses Log</span>
            <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">4. Egg Reconciliation</span>
            <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">5. Pest Control Supplies</span>
            <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-amber-300 font-mono">6. Activity Audit Trail</span>
          </div>
        </div>

        {/* Submit Export Button */}
        <div className="md:col-span-4 pt-2">
          <button
            type="submit"
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg hover:shadow-emerald-900/40 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export 6-Sheet Excel Workbook (.xls / .xlsx)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
