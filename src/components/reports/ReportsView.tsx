/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  FileText,
  Printer,
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Package,
  Layers,
  Users,
  Activity,
  Building,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../../constants';
import { BusinessPerformanceChart } from '../dashboard/BusinessPerformanceChart';

type ReportType =
  | 'pnl'
  | 'production'
  | 'flock_health'
  | 'receivables'
  | 'feed'
  | 'analytics'
  | 'executive';

export const ReportsView: React.FC = () => {
  const {
    profile,
    eggProductionLogs,
    flocks,
    flockAdjustments,
    sales,
    expenses,
    customers,
    feedConsumptionLogs,
    eggStockSummary,
    totalAvailableTrays,
    cashOnHand,
    bankAccounts,
  } = useFarm();

  const [activeReport, setActiveReport] = useState<ReportType>('pnl');
  const [dateRange, setDateRange] = useState('All Time');

  // P&L Calculations
  const grossEggSales = sales.reduce((s, sale) => s + sale.total, 0);

  const feedExpensesTotal = feedConsumptionLogs.reduce((s, f) => s + f.cost, 0);
  const grossProfit = grossEggSales - feedExpensesTotal;

  const operatingExpensesTotal = expenses
    .filter(e => e.category !== 'Feed')
    .reduce((s, e) => s + e.amount, 0);

  const netFarmProfit = grossProfit - operatingExpensesTotal;

  // Flock & Mortality
  const totalStartingBirds = flocks.reduce((s, f) => s + f.startingPopulation, 0);
  const totalLiveBirds = flocks.reduce((s, f) => s + f.currentPopulation, 0);
  const totalMortality = flockAdjustments
    .filter(a => a.type === 'mortality')
    .reduce((s, a) => s + a.quantity, 0);
  const totalCulled = flockAdjustments
    .filter(a => a.type === 'cull')
    .reduce((s, a) => s + a.quantity, 0);

  // Production Metrics
  const totalEggsProduced = eggProductionLogs.reduce((s, l) => s + l.totalCollection, 0);
  const totalRejectEggs = eggProductionLogs.reduce(
    (s, l) => s + (l.rejects != null ? l.rejects : (l.brokenEggs || 0) + (l.dirtyEggs || 0)),
    0
  );
  const totalUsableEggs = eggProductionLogs.reduce((s, l) => s + l.usableEggs, 0);
  const totalTraysProduced = Math.floor(totalUsableEggs / (profile.trayCapacity || 30));

  // Customer Receivables
  const getCustomerBalance = (customerId: string) => {
    return sales
      .filter(s => s.customerId === customerId)
      .reduce((sum, s) => sum + s.balance, 0);
  };
  const totalReceivables = customers.reduce((s, c) => s + getCustomerBalance(c.id), 0);

  // Total Liquidity
  const totalBankBalances = bankAccounts.reduce((s, b) => s + b.currentBalance, 0);
  const totalFarmLiquidity = cashOnHand + totalBankBalances;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:m-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Executive & Operational Reports Suite
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official farm accounting ledgers, flock mortality audits, and production performance reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Current Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 print:hidden border-b border-slate-200 pb-3">
        {[
          { key: 'pnl', label: '1. Profit & Loss Statement', icon: DollarSign },
          { key: 'production', label: '2. Egg Production Log', icon: Layers },
          { key: 'flock_health', label: '3. Flock Mortality & Health', icon: Activity },
          { key: 'receivables', label: '4. Accounts Receivable Aging', icon: Users },
          { key: 'feed', label: '5. Feed Consumption & Cost', icon: Package },
          { key: 'analytics', label: '6. Business Performance Charts', icon: TrendingUp },
          { key: 'executive', label: '7. Executive Farm Summary', icon: Building },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveReport(tab.key as ReportType)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeReport === tab.key
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT PAPER CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 print:border-none print:shadow-none print:p-0">
        {/* Printable Letterhead */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900 mb-6">
          <div className="flex items-center gap-3">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={profile.farmName}
                className="h-16 w-auto object-contain"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center font-heading text-lg">
                KIF
              </div>
            )}
            <div>
              <h1 className="font-heading font-bold text-xl text-slate-900 uppercase tracking-tight">
                {profile.farmName}
              </h1>
              <p className="text-xs text-slate-600 font-medium">{profile.tagline || 'Commercial RTL Egg Producing Facility'}</p>
              <p className="text-[11px] text-slate-500">{profile.address} | Tel: {profile.contactNumber}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold font-mono text-emerald-800 block">
              OFFICIAL SYSTEM REPORT
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Generated: {new Date().toLocaleDateString()}
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">
              Prepared by: {profile.ownerManager || 'Farm Manager'}
            </span>
          </div>
        </div>

        {/* REPORT CONTENT: 1. P&L STATEMENT */}
        {activeReport === 'pnl' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="font-heading font-bold text-base text-slate-900">
                Statement of Comprehensive Income (Profit & Loss)
              </h2>
              <span className="text-xs text-slate-500">Period: All Recorded Transactions to Date</span>
            </div>

            <div className="space-y-4 text-xs font-medium">
              {/* Revenue */}
              <div>
                <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-300">
                  <span>I. FARM REVENUE</span>
                  <span></span>
                </div>
                <div className="divide-y divide-slate-100 pl-4">
                  <div className="flex justify-between py-1.5 text-slate-700">
                    <span>Commercial Table Egg Sales (Invoiced)</span>
                    <span className="font-mono font-bold">{formatCurrency(grossEggSales)}</span>
                  </div>
                </div>
                <div className="flex justify-between py-2 pl-4 font-bold text-slate-900 border-t border-slate-200 bg-slate-50/50 px-2 rounded">
                  <span>TOTAL GROSS REVENUE</span>
                  <span className="font-mono text-emerald-800">{formatCurrency(grossEggSales)}</span>
                </div>
              </div>

              {/* Cost of Goods Sold */}
              <div>
                <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-300">
                  <span>II. COST OF GOODS SOLD (COGS)</span>
                  <span></span>
                </div>
                <div className="divide-y divide-slate-100 pl-4">
                  <div className="flex justify-between py-1.5 text-slate-700">
                    <span>Feed Consumed by Flocks</span>
                    <span className="font-mono">{formatCurrency(feedExpensesTotal)}</span>
                  </div>
                </div>
                <div className="flex justify-between py-2 pl-4 font-bold text-slate-900 border-t border-slate-200 bg-slate-50/50 px-2 rounded">
                  <span>TOTAL COGS</span>
                  <span className="font-mono text-rose-700">{formatCurrency(feedExpensesTotal)}</span>
                </div>
              </div>

              {/* Gross Margin */}
              <div className="flex justify-between py-2.5 px-3 bg-emerald-50/60 rounded-lg border border-emerald-200 font-bold text-sm text-emerald-950">
                <span>GROSS FARM PROFIT</span>
                <span className="font-mono text-emerald-800">{formatCurrency(grossProfit)}</span>
              </div>

              {/* Operating Expenses */}
              <div>
                <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-300">
                  <span>III. OPERATING EXPENSES (OPEX)</span>
                  <span></span>
                </div>
                <div className="divide-y divide-slate-100 pl-4">
                  {expenses.filter(e => e.category !== 'Feed').length === 0 ? (
                    <div className="py-2 text-slate-400 italic">No non-feed operational expenses logged yet.</div>
                  ) : (
                    expenses
                      .filter(e => e.category !== 'Feed')
                      .map(e => (
                        <div key={e.id} className="flex justify-between py-1.5 text-slate-700">
                          <span>
                            {e.category} — {e.description}
                          </span>
                          <span className="font-mono">{formatCurrency(e.amount)}</span>
                        </div>
                      ))
                  )}
                </div>
                <div className="flex justify-between py-2 pl-4 font-bold text-slate-900 border-t border-slate-200 bg-slate-50/50 px-2 rounded">
                  <span>TOTAL OPERATING EXPENSES</span>
                  <span className="font-mono text-rose-700">{formatCurrency(operatingExpensesTotal)}</span>
                </div>
              </div>

              {/* Net Farm Profit */}
              <div className="flex justify-between py-3 px-4 bg-slate-900 text-white rounded-lg font-bold text-base">
                <span>NET FARM PROFIT (EBITDA)</span>
                <span className={`font-mono ${netFarmProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(netFarmProfit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* REPORT CONTENT: 2. PRODUCTION LOGS */}
        {activeReport === 'production' && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900">
                  Daily Egg Production & Hen-Day Productivity (HDP) Ledger
                </h2>
                <span className="text-xs text-slate-500">Total Recorded: {eggProductionLogs.length} collection cycles</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">House / Flock</th>
                  <th className="p-2.5 text-right font-bold text-slate-900">Total Collected</th>
                  <th className="p-2.5 text-right font-bold text-emerald-800">Good Eggs</th>
                  <th className="p-2.5 text-right font-bold text-rose-600">Rejects</th>
                  <th className="p-2.5 text-right font-bold text-emerald-700">Trays</th>
                  <th className="p-2.5 text-right font-bold text-indigo-700">HDP %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {eggProductionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No daily production logs found.
                    </td>
                  </tr>
                ) : (
                  eggProductionLogs.map(log => {
                    const flock = flocks.find(f => f.id === log.flockId);
                    const trays = Math.floor(log.usableEggs / (profile.trayCapacity || 30));
                    const rejectCount =
                      log.rejects != null ? log.rejects : (log.brokenEggs || 0) + (log.dirtyEggs || 0);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono text-slate-800">{log.date}</td>
                        <td className="p-2.5">{flock?.batchId || 'House 1'}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">{log.totalCollection}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{log.usableEggs}</td>
                        <td className="p-2.5 text-right font-mono text-rose-600">
                          {rejectCount}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{trays}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-indigo-700">
                          {log.hdp ? formatPercent(log.hdp) : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT CONTENT: 3. FLOCK MORTALITY */}
        {activeReport === 'flock_health' && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="font-heading font-bold text-base text-slate-900">
                Flock Population, Depletion & Mortality Audit
              </h2>
              <span className="text-xs text-slate-500">Live Bird Census Across Houses</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Starting Birds</span>
                <span className="text-base font-bold font-mono text-slate-900">{formatNumber(totalStartingBirds)}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Live Population</span>
                <span className="text-base font-bold font-mono text-emerald-800">{formatNumber(totalLiveBirds)}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <span className="text-[10px] text-rose-700 uppercase font-bold block">Total Mortality</span>
                <span className="text-base font-bold font-mono text-rose-700">{formatNumber(totalMortality)}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">Total Culled</span>
                <span className="text-base font-bold font-mono text-amber-800">{formatNumber(totalCulled)}</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden mt-4">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Flock / Batch</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-right font-bold text-rose-600">Birds Deducted</th>
                  <th className="p-2.5">Reason / Clinical Cause</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {flockAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      Zero mortality or cull incidents recorded. Flock is 100% intact.
                    </td>
                  </tr>
                ) : (
                  flockAdjustments.map(adj => {
                    const flock = flocks.find(f => f.id === adj.flockId);
                    return (
                      <tr key={adj.id}>
                        <td className="p-2.5 font-mono text-slate-800">{adj.date}</td>
                        <td className="p-2.5">{flock?.batchId || 'Flock'}</td>
                        <td className="p-2.5 capitalize">{adj.type}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600">{adj.quantity}</td>
                        <td className="p-2.5 text-slate-700">{adj.reason}</td>
                        <td className="p-2.5 text-slate-400 text-[11px]">{adj.notes || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT CONTENT: 4. RECEIVABLES */}
        {activeReport === 'receivables' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <span className="font-semibold text-slate-700">Total Outstanding Customer Receivables:</span>
              <span className="font-mono font-bold text-rose-600 text-lg">
                {formatCurrency(totalReceivables)}
              </span>
            </div>

            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="p-2.5">Customer Name</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Contact</th>
                  <th className="p-2.5">Terms</th>
                  <th className="p-2.5 text-right">Credit Limit</th>
                  <th className="p-2.5 text-right font-bold text-rose-600">Balance Due (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No customer accounts registered.
                    </td>
                  </tr>
                ) : (
                  customers.map(c => {
                    const bal = getCustomerBalance(c.id);
                    return (
                      <tr key={c.id}>
                        <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                        <td className="p-2.5 text-slate-600">{c.customerType}</td>
                        <td className="p-2.5 font-mono text-slate-500">{c.contactNumber || '—'}</td>
                        <td className="p-2.5 text-slate-600">
                          {c.creditTermsDays === 0 ? 'COD' : `${c.creditTermsDays} Days`}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          {c.creditLimit ? formatCurrency(c.creditLimit) : 'None'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                          {formatCurrency(bal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT CONTENT: 5. FEED */}
        {activeReport === 'feed' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center">
              <span className="font-semibold text-amber-900">Total Feed Consumed:</span>
              <span className="font-mono font-bold text-amber-900 text-base">
                {formatNumber(feedConsumptionLogs.reduce((s, f) => s + f.kgUsed, 0))} kg ({formatCurrency(feedExpensesTotal)})
              </span>
            </div>

            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-right">Bags Used</th>
                  <th className="p-2.5 text-right">KG Used</th>
                  <th className="p-2.5 text-right font-bold text-slate-900">Cost (₱)</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedConsumptionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No feed consumption logged yet.
                    </td>
                  </tr>
                ) : (
                  feedConsumptionLogs.map(l => (
                    <tr key={l.id}>
                      <td className="p-2.5 font-mono text-slate-800">{l.date}</td>
                      <td className="p-2.5 text-right font-mono">{l.bagsUsed}</td>
                      <td className="p-2.5 text-right font-mono">{l.kgUsed}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{formatCurrency(l.cost)}</td>
                      <td className="p-2.5 text-slate-400">{l.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT CONTENT: 6. BUSINESS PERFORMANCE ANALYTICS & CHARTS */}
        {activeReport === 'analytics' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="font-heading font-bold text-base text-slate-900">
                Business Performance Visual Analytics
              </h2>
              <span className="text-xs text-slate-500">
                Multi-metric graphical visualization of revenue, operating costs, profit margin, cashflow, and lay rate
              </span>
            </div>

            <BusinessPerformanceChart />
          </div>
        )}

        {/* REPORT CONTENT: 7. EXECUTIVE SUMMARY */}
        {activeReport === 'executive' && (
          <div className="space-y-6 text-xs">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="font-heading font-bold text-base text-slate-900">
                Farm Executive Command Overview
              </h2>
              <span className="text-xs text-slate-500">Holistic balance sheet and operational efficiency summary</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Cash & Bank Liquidity</span>
                <span className="text-base font-bold font-mono text-emerald-800">{formatCurrency(totalFarmLiquidity)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Stocked Eggs Available</span>
                <span className="text-base font-bold font-mono text-slate-900">{formatNumber(totalAvailableTrays)} trays</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Live Flock Population</span>
                <span className="text-base font-bold font-mono text-indigo-700">{formatNumber(totalLiveBirds)} layers</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-heading font-bold text-xs text-slate-800">Operational Integrity Certification</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                This document certifies that all figures above reflect the actual Kagala Integrated Farm management ledger
                records. Internal banking movements are strictly separated from operational income, mortality adjustments
                strictly decrement physical populations, and egg inventory strictly accounts for grade collections and sales.
              </p>
            </div>
          </div>
        )}

        {/* Printable Sign-off Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
          <div>
            <div className="w-44 border-b border-slate-400 mb-1"></div>
            <span>Prepared By / Farm Auditor</span>
          </div>
          <div>
            <div className="w-44 border-b border-slate-400 mb-1"></div>
            <span>Approved By / {profile.ownerManager || 'General Manager'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
