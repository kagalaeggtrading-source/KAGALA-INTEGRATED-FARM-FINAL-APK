/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { formatCurrency, formatNumber } from '../../constants';
import {
  Bird,
  Egg,
  TrendingUp,
  Skull,
  Wheat,
  PackageCheck,
  ShoppingCart,
  Receipt,
  CreditCard,
  TrendingDown,
  Landmark,
  CircleDollarSign,
  Users,
  AlertTriangle,
  PlusCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  Scale,
  Calculator,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    flocks,
    eggProductionLogs,
    feedConsumptionLogs,
    feedItems,
    orders,
    sales,
    payments,
    expenses,
    bankAccounts,
    bankDeposits,
    flockAdjustments,
    supplyItems,
    cashOnHand,
    hasPermission,
    isTabAllowed,
    totalAvailableTrays,
    totalPhysicalEggs,
    totalGoodEggsCollected,
    totalEggsSold,
    inventoryRemaining,
    hasSalesDiscrepancy,
    potentialRevenue,
    actualRealizedRevenue,
  } = useFarm();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Live Birds
  const liveBirds = flocks.reduce((sum, f) => sum + f.currentPopulation, 0);

  // 2. Eggs Produced Today
  const todayProdLogs = eggProductionLogs.filter(l => l.date === todayStr);
  const eggsProducedToday = todayProdLogs.reduce((sum, l) => sum + l.totalCollection, 0);
  const usableEggsToday = todayProdLogs.reduce((sum, l) => sum + l.usableEggs, 0);

  // 3. HDP / Lay Rate % Today
  const hdpToday = liveBirds > 0 ? (usableEggsToday / liveBirds) * 100 : 0;

  // 4. Mortality Today
  const todayAdjustments = flockAdjustments.filter(a => a.date === todayStr);
  const mortalityToday = todayAdjustments
    .filter(a => a.type === 'mortality')
    .reduce((sum, a) => sum + a.quantity, 0);

  // 5. Feed Used Today
  const todayFeedLogs = feedConsumptionLogs.filter(f => f.date === todayStr);
  const feedBagsUsedToday = todayFeedLogs.reduce((sum, f) => sum + f.bagsUsed, 0);
  const feedKgUsedToday = todayFeedLogs.reduce((sum, f) => sum + f.kgUsed, 0);

  // 6. Pending Orders
  const pendingOrders = orders.filter(
    o => o.status === 'NEW' || o.status === 'CONFIRMED' || o.status === 'RESERVED'
  );

  // 7. Sales Today
  const todaySales = sales.filter(s => s.date === todayStr);
  const salesAmountToday = todaySales.reduce((sum, s) => sum + s.total, 0);

  // 8. Payments Received Today
  const todayPayments = payments.filter(p => p.paymentDate === todayStr);
  const paymentsAmountToday = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  // 9. Expenses Today
  const todayExpenses = expenses.filter(e => e.date === todayStr);
  const expensesAmountToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 10. RULE 1: Total Bank Deposits + Direct Bank Transfer Sales
  const completedBankDeposits = bankDeposits.reduce((sum, d) => sum + d.amount, 0);
  const directBankTransferSales = payments
    .filter(p => p.accountReceivedInto === 'bank_account' || p.paymentMethod === 'Bank Transfer')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalBankDepositsAndTransfers = completedBankDeposits + directBankTransferSales;

  // 11. RULE 2: Dynamic Cash on Hand Breakdown
  const totalCashPaymentsReceived = payments
    .filter(p => p.accountReceivedInto === 'cash_on_hand' || p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCashExpensesPaidOut = expenses
    .filter(e => e.paymentAccount === 'cash_on_hand' || !e.paymentAccount)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCashDepositedToBank = bankDeposits
    .filter(d => d.sourceAccount === 'Cash on Hand' || !d.sourceAccount)
    .reduce((sum, d) => sum + d.amount, 0);

  // Net Cash Movement Today
  const cashPaymentsToday = todayPayments
    .filter(p => p.accountReceivedInto === 'cash_on_hand')
    .reduce((sum, p) => sum + p.amount, 0);
  const cashExpensesToday = todayExpenses
    .filter(e => e.paymentAccount === 'cash_on_hand')
    .reduce((sum, e) => sum + e.amount, 0);
  const netCashMovementToday = cashPaymentsToday - cashExpensesToday;

  // Accounts Receivable Total
  const totalBilledAllTime = sales.reduce((sum, s) => sum + s.total, 0);
  const totalPaidAllTime = payments.reduce((sum, p) => sum + p.amount, 0);
  const accountsReceivable = Math.max(0, totalBilledAllTime - totalPaidAllTime);

  // Active alerts from real records
  const alerts: { id: string; type: 'warning' | 'critical' | 'info'; message: string; actionTab: string }[] = [];

  feedItems.forEach(f => {
    if (f.currentBags <= f.minimumBagsAlert) {
      alerts.push({
        id: `feed-${f.id}`,
        type: f.currentBags <= 2 ? 'critical' : 'warning',
        message: `Low Feed Alert: ${f.brand} (${f.feedType}) has ${f.currentBags} bags left (min: ${f.minimumBagsAlert})`,
        actionTab: 'feed',
      });
    }
  });

  supplyItems.forEach(s => {
    if (s.quantity <= s.minimumStock) {
      alerts.push({
        id: `sup-${s.id}`,
        type: 'warning',
        message: `Low Supply Alert: ${s.name} has only ${s.quantity} ${s.unit} remaining`,
        actionTab: 'supplies',
      });
    }
  });

  if (liveBirds > 0 && mortalityToday > liveBirds * 0.01) {
    alerts.push({
      id: 'high-mortality',
      type: 'critical',
      message: `High Mortality Alert: ${mortalityToday} deaths today exceed 1.0% flock threshold`,
      actionTab: 'flock',
    });
  }

  // 7-day Production trend
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const productionByDay = last7Days.map(date => {
    const logs = eggProductionLogs.filter(l => l.date === date);
    const total = logs.reduce((sum, l) => sum + l.totalCollection, 0);
    const usable = logs.reduce((sum, l) => sum + l.usableEggs, 0);
    const dayLabel = new Date(date).toLocaleDateString('en-PH', { weekday: 'short' });
    return { date, dayLabel, total, usable };
  });

  const maxProdIn7Days = Math.max(...productionByDay.map(p => p.total), 10);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Farm Command Center Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold font-heading text-slate-900 tracking-tight">
              Farm Command Center
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
              Live Operations & Finance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry and management records for Kagala Integrated Farm.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('canLogProduction') && isTabAllowed('production') && (
            <button
              onClick={() => onNavigate('production')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Daily Eggs</span>
            </button>
          )}
          {hasPermission('canLogSales') && isTabAllowed('sales') && (
            <button
              onClick={() => onNavigate('sales')}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Receipt className="w-4 h-4" />
              <span>New Sale</span>
            </button>
          )}
          {hasPermission('canLogSales') && isTabAllowed('orders') && (
            <button
              onClick={() => onNavigate('orders')}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>New Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Alerts Banner if any */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                alert.type === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${alert.type === 'critical' ? 'text-rose-600' : 'text-amber-600'}`}
                />
                <span>{alert.message}</span>
              </div>
              <button
                onClick={() => onNavigate(alert.actionTab)}
                className="underline hover:no-underline font-semibold text-[11px] shrink-0 cursor-pointer"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* EGG RECONCILIATION & INVENTORY TRACKING MODULE */}
      {hasPermission('viewInventoryMetrics') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Egg Reconciliation & Inventory Tracking</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated audit comparing recorded harvest production, sales dispatches, and potential revenue.
                </p>
              </div>
            </div>

            {hasSalesDiscrepancy ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>DISCREPANCY ALERT</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>LOGS BALANCED</span>
              </span>
            )}
          </div>

          {/* Prominent Yellow/Amber Discrepancy Warning Label if Sales > Production */}
          {hasSalesDiscrepancy && (
            <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center gap-3 text-amber-950 text-xs font-bold shadow-xs animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <span className="text-amber-900 font-extrabold uppercase tracking-wide">
                  Discrepancy Warning:
                </span>{' '}
                <span>Sales exceed recorded production. Please check logs.</span>
                <p className="text-[11px] font-normal text-amber-800 mt-0.5">
                  Total Eggs Sold ({formatNumber(totalEggsSold)} pcs) is greater than Total Good Eggs Collected ({formatNumber(totalGoodEggsCollected)} pcs).
                </p>
              </div>
              <button
                onClick={() => onNavigate('record-check')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                Inspect Logs
              </button>
            </div>
          )}

          {/* 4 RECONCILIATION KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* 1. Total Good Eggs Collected */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
                <span>🥚 Total Good Eggs Collected</span>
                <Egg className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-heading text-slate-900">
                {formatNumber(totalGoodEggsCollected)} <span className="text-xs font-semibold text-slate-500">pcs</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                ~{formatNumber(Math.floor(totalGoodEggsCollected / 30))} trays usable harvest
              </div>
            </div>

            {/* 2. Total Eggs Sold */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
                <span>🛒 Total Eggs Sold</span>
                <ShoppingCart className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-bold font-heading text-slate-900">
                {formatNumber(totalEggsSold)} <span className="text-xs font-semibold text-slate-500">pcs</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                ~{formatNumber(Math.floor(totalEggsSold / 30))} trays dispatched
              </div>
            </div>

            {/* 3. Inventory Remaining (Calculation Card) */}
            <div className={`p-3.5 rounded-xl border space-y-1 ${
              inventoryRemaining < 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <div className="text-xs font-medium flex items-center justify-between text-slate-600">
                <span>📊 Inventory Remaining</span>
                <PackageCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className={`text-xl font-bold font-heading ${
                inventoryRemaining < 0 ? 'text-rose-700' : 'text-emerald-800'
              }`}>
                {formatNumber(inventoryRemaining)} <span className="text-xs font-semibold text-slate-600">pcs</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                {inventoryRemaining < 0
                  ? 'Deficit in inventory count'
                  : `~${formatNumber(Math.floor(inventoryRemaining / 30))} trays (${inventoryRemaining % 30} loose) in stock`}
              </div>
            </div>

            {/* 4. Financial Overview: Potential Revenue vs Realized Revenue */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>💰 Revenue Realization</span>
                <Calculator className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Potential Revenue:</span>
                  <span className="font-bold text-amber-300 font-mono">{formatCurrency(potentialRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Realized Revenue:</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatCurrency(actualRealizedRevenue)}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-800 truncate">
                {potentialRevenue > 0
                  ? `${((actualRealizedRevenue / potentialRevenue) * 100).toFixed(1)}% revenue realized from harvest`
                  : '100% revenue realization'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TODAY'S CORE OPERATIONAL TELEMETRY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading">
            Today's Operational Telemetry ({todayStr})
          </h3>
          <span className="text-[11px] text-slate-400">All figures calculated from validated logs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* 1. Live Birds */}
          {hasPermission('viewFlockMetrics') && (
            <div
              onClick={() => onNavigate('flock')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>🐔 Live Birds</span>
                <Bird className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-lg font-bold text-slate-900 font-heading">
                {formatNumber(liveBirds)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {flocks.length} Active Flock{flocks.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* 2. Eggs Produced Today */}
          {hasPermission('viewFlockMetrics') && (
            <div
              onClick={() => onNavigate('production')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>🥚 Eggs Today</span>
                <Egg className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-lg font-bold text-slate-900 font-heading">
                {formatNumber(eggsProducedToday)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {Math.floor(eggsProducedToday / 30)} Trays today
              </div>
            </div>
          )}

          {/* 3. HDP / Lay Rate */}
          {hasPermission('viewFlockMetrics') && (
            <div
              onClick={() => onNavigate('production')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>📊 Lay Rate (HDP)</span>
                <TrendingUp className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-lg font-bold text-slate-900 font-heading">
                {hdpToday.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                Hen-Day Production
              </div>
            </div>
          )}

          {/* 4. Mortality Today */}
          {hasPermission('viewFlockMetrics') && (
            <div
              onClick={() => onNavigate('flock')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>💀 Mortality</span>
                <Skull className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className={`text-lg font-bold font-heading ${mortalityToday > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatNumber(mortalityToday)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {liveBirds > 0 ? ((mortalityToday / liveBirds) * 100).toFixed(2) : 0}% of flock
              </div>
            </div>
          )}

          {/* 5. Feed Used Today */}
          {hasPermission('viewInventoryMetrics') && (
            <div
              onClick={() => onNavigate('feed')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>🌾 Feed Used</span>
                <Wheat className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-lg font-bold text-slate-900 font-heading">
                {feedBagsUsedToday} <span className="text-xs font-normal text-slate-500">bags</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {feedKgUsedToday} kg consumed
              </div>
            </div>
          )}

          {/* 6. Egg Inventory Total */}
          {hasPermission('viewInventoryMetrics') && (
            <div
              onClick={() => onNavigate('inventory')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>📦 Egg Stock</span>
                <PackageCheck className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-lg font-bold text-slate-900 font-heading">
                {formatNumber(totalAvailableTrays)} <span className="text-xs font-normal text-slate-500">trays</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {formatNumber(totalPhysicalEggs)} pcs physical
              </div>
            </div>
          )}

          {/* 7. Pending Orders */}
          {hasPermission('viewSalesMetrics') && (
            <div
              onClick={() => onNavigate('orders')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>🛒 Pending Orders</span>
                <ShoppingCart className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-lg font-bold text-slate-900 font-heading">
                {pendingOrders.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                In dispatch queue
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FINANCIAL SUMMARY ROW (7 KPIs RE-FORMULATED) */}
      {hasPermission('viewFinancialMetrics') && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading">
              Financial Summary & Vault Reconciliations
            </h3>
            <span className="text-[11px] text-slate-400">Strict double-entry accounting rules</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {/* 1. Sales Today */}
            <div
              onClick={() => onNavigate('sales')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>💰 Sales Today</span>
                <Receipt className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-base font-bold text-slate-900 font-heading">
                {formatCurrency(salesAmountToday)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {todaySales.length} invoice{todaySales.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* 2. Payments Received Today */}
            <div
              onClick={() => onNavigate('payments')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>💵 Payments Recv</span>
                <CreditCard className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-base font-bold text-slate-900 font-heading">
                {formatCurrency(paymentsAmountToday)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {todayPayments.length} collection{todayPayments.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* 3. Expenses Today */}
            <div
              onClick={() => onNavigate('expenses')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>📉 Expenses Today</span>
                <TrendingDown className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-base font-bold text-slate-900 font-heading">
                {formatCurrency(expensesAmountToday)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {todayExpenses.length} record{todayExpenses.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* 4. RULE 1: Total Bank Deposits & Direct Transfers */}
            <div
              onClick={() => onNavigate('bank-deposits')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>🏦 Bank Deposits & Transfers</span>
                <Landmark className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-base font-bold text-indigo-900 font-heading">
                {formatCurrency(totalBankDepositsAndTransfers)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={`Deposits: ${formatCurrency(completedBankDeposits)} + Direct Transfers: ${formatCurrency(directBankTransferSales)}`}>
                Deposits + Direct Transfers
              </div>
            </div>

            {/* 5. RULE 2: Cash on Hand (Vault / Register) */}
            <div
              onClick={() => onNavigate('cashflow')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>💵 Cash on Hand</span>
                <CircleDollarSign className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className={`text-base font-bold font-heading ${cashOnHand < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {formatCurrency(cashOnHand)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={`Cash Recv (${formatCurrency(totalCashPaymentsReceived)}) - [Cash Exp (${formatCurrency(totalCashExpensesPaidOut)}) + Cash Dep (${formatCurrency(totalCashDepositedToBank)})]`}>
                Vault / Register Balance
              </div>
            </div>

            {/* 6. Net Cash Movement Today */}
            <div
              onClick={() => onNavigate('cashflow')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>🔄 Today's Cash Flow</span>
                <BarChart3 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className={`text-base font-bold font-heading ${netCashMovementToday < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatCurrency(netCashMovementToday)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                Net cash inflow today
              </div>
            </div>

            {/* 7. Accounts Receivable */}
            <div
              onClick={() => onNavigate('customers')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
                <span>👥 Customer Debt (AR)</span>
                <Users className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-base font-bold text-slate-900 font-heading">
                {formatCurrency(accountsReceivable)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                Uncollected invoices
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-DAY EGG PRODUCTION TREND CHART */}
      {hasPermission('viewFlockMetrics') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>7-Day Egg Harvest Trend</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily total eggs vs usable graded eggs collected across all houses
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Live Production
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-4 items-end h-40 border-b border-slate-100 pb-2">
            {productionByDay.map(day => {
              const heightTotalPct = Math.min(100, Math.max(10, (day.total / maxProdIn7Days) * 100));
              const heightUsablePct = Math.min(100, Math.max(8, (day.usable / maxProdIn7Days) * 100));

              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatNumber(day.total)}
                  </div>

                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-md h-full flex items-end justify-center relative overflow-hidden">
                    {/* Total Bar */}
                    <div
                      style={{ height: `${heightTotalPct}%` }}
                      className="w-full bg-emerald-200 rounded-t-md absolute bottom-0 transition-all duration-300"
                    />
                    {/* Usable Bar */}
                    <div
                      style={{ height: `${heightUsablePct}%` }}
                      className="w-full bg-emerald-600 rounded-t-md absolute bottom-0 transition-all duration-300"
                    />
                  </div>

                  <div className="text-[11px] font-semibold text-slate-600 font-heading">
                    {day.dayLabel}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600" />
                <span>Usable Graded Eggs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-200" />
                <span>Total Collection</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">Hover bars for exact numbers</span>
          </div>
        </div>
      )}
    </div>
  );
};
