/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFarm } from '../../context/FarmContext';
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
  ArrowUpDown,
  FileSpreadsheet,
  AlertTriangle,
  PlusCircle,
  Clock,
  CheckCircle2,
  Shield,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatNumber, EGG_GRADES } from '../../constants';
import { BusinessPerformanceChart } from './BusinessPerformanceChart';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    flocks,
    eggProductionLogs,
    eggStockSummary,
    totalPhysicalEggs,
    totalAvailableTrays,
    feedConsumptionLogs,
    feedItems,
    orders,
    sales,
    payments,
    expenses,
    bankAccounts,
    cashOnHand,
    flockAdjustments,
    customers,
    supplyItems,
    activeRoleConfig,
    currentRole,
    setRole,
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

  // 10. Bank Balance Total
  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);

  // 11. Net Cash Movement Today (Inflows to Cash - Outflows from Cash)
  const cashPaymentsToday = todayPayments
    .filter(p => p.accountReceivedInto === 'cash_on_hand')
    .reduce((sum, p) => sum + p.amount, 0);
  const cashExpensesToday = todayExpenses
    .filter(e => e.paymentAccount === 'cash_on_hand')
    .reduce((sum, e) => sum + e.amount, 0);
  const netCashMovementToday = cashPaymentsToday - cashExpensesToday;

  // 12. Accounts Receivable Total
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

  // 7-day Production trend from real records
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold font-heading text-slate-900 tracking-tight">
              Farm Command Center
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
              Live Production Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry and management records for Kagala Integrated Farm.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('production')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Daily Eggs</span>
          </button>
          <button
            onClick={() => onNavigate('sales')}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Receipt className="w-4 h-4" />
            <span>New Sale</span>
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Active Alerts Banner if any */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-lg border flex items-center justify-between text-xs font-medium ${
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
                className="underline hover:no-underline font-semibold text-[11px] shrink-0"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TODAY'S CORE 14 OPERATIONAL METRICS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading">
            Today's Operational Telemetry ({todayStr})
          </h3>
          <span className="text-[11px] text-slate-400">All figures calculated from validated logs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* 1. Live Birds */}
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

          {/* 2. Eggs Produced Today */}
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

          {/* 3. HDP / Lay Rate */}
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

          {/* 4. Mortality Today */}
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

          {/* 5. Feed Used Today */}
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

          {/* 6. Egg Inventory Total */}
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

          {/* 7. Pending Orders */}
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
        </div>

        {/* FINANCIAL SUMMARY ROW (7 KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 pt-1">
          {/* 8. Sales Today */}
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

          {/* 9. Payments Received Today */}
          <div
            onClick={() => onNavigate('payments')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span>💵 Payments Recv</span>
              <CreditCard className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-base font-bold text-emerald-700 font-heading">
              {formatCurrency(paymentsAmountToday)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {todayPayments.length} collection{todayPayments.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* 10. Expenses Today */}
          <div
            onClick={() => onNavigate('expenses')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span>💸 Expenses Today</span>
              <TrendingDown className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-base font-bold text-rose-700 font-heading">
              {formatCurrency(expensesAmountToday)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {todayExpenses.length} expense{todayExpenses.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* 11. Bank Balance */}
          <div
            onClick={() => onNavigate('bank-deposits')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span>🏦 Bank Balance</span>
              <Landmark className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-base font-bold text-slate-900 font-heading">
              {formatCurrency(totalBankBalance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {bankAccounts.length} bank account{bankAccounts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* 12. Cash on Hand */}
          <div
            onClick={() => onNavigate('cashflow')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span>💵 Cash on Hand</span>
              <CircleDollarSign className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-base font-bold text-slate-900 font-heading">
              {formatCurrency(cashOnHand)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Physical cash vault
            </div>
          </div>

          {/* 13. Net Cash Movement Today */}
          <div
            onClick={() => onNavigate('cashflow')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span>📊 Net Cash Today</span>
              <ArrowUpDown className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className={`text-base font-bold font-heading ${netCashMovementToday >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {netCashMovementToday >= 0 ? '+' : ''}
              {formatCurrency(netCashMovementToday)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Cash In minus Out
            </div>
          </div>

          {/* 14. Accounts Receivable */}
          <div
            onClick={() => onNavigate('customers')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span>💳 Accounts Recv</span>
              <FileSpreadsheet className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-base font-bold text-amber-800 font-heading">
              {formatCurrency(accountsReceivable)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Uncollected balances
            </div>
          </div>
        </div>
      </div>

      {/* BUSINESS PERFORMANCE ANALYTICS & CHARTS */}
      <BusinessPerformanceChart onNavigate={onNavigate} />

      {/* MID SECTION: PRODUCTION TREND (7 DAYS) & INVENTORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Production Trend Graph */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-heading font-bold text-sm text-slate-900">
                7-Day Egg Production & Usable Trend
              </h4>
              <p className="text-xs text-slate-500">Daily collection totals based on authenticated logs</p>
            </div>
            <button
              onClick={() => onNavigate('production')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View All Logs →
            </button>
          </div>

          {/* Trend Bar Visualizer */}
          {eggProductionLogs.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg">
              <Egg className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No egg collection logged yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-3">
                When you record daily egg collections, daily production curves will render here.
              </p>
              <button
                onClick={() => onNavigate('production')}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Record First Collection
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 h-44 items-end pt-4 pb-2 border-b border-slate-100">
                {productionByDay.map(day => {
                  const heightPercent = maxProdIn7Days > 0 ? (day.total / maxProdIn7Days) * 100 : 0;
                  return (
                    <div key={day.date} className="flex flex-col items-center h-full justify-end group">
                      <div className="text-[10px] font-mono text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.total}
                      </div>
                      <div className="w-full max-w-[32px] bg-slate-100 rounded-t-md relative flex flex-col justify-end overflow-hidden" style={{ height: '100%' }}>
                        <div
                          className="w-full bg-emerald-500 rounded-t-md transition-all duration-300 group-hover:bg-emerald-600"
                          style={{ height: `${Math.max(heightPercent, 2)}%` }}
                          title={`${day.date}: ${day.total} eggs total (${day.usable} usable)`}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 mt-2">
                        {day.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-xs inline-block" />
                  <span>Total Eggs Collected</span>
                </div>
                <span>7-Day Max: {maxProdIn7Days} eggs</span>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Egg Inventory Breakdown by Grade */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-bold text-sm text-slate-900">
                Live Inventory by Grade
              </h4>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Manage Stock →
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Stock available for dispatch (30 eggs = 1 tray)</p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {EGG_GRADES.map(grade => {
                const stock = eggStockSummary[grade.key];
                return (
                  <div
                    key={grade.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{grade.label}</span>
                      <span className="text-[10px] text-slate-400 block">{grade.weightRange}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900 font-mono">
                        {stock.availableTrays} <span className="text-[10px] font-normal text-slate-500">trays</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {stock.available} pcs available
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">Total Available Stock:</span>
            <span className="text-emerald-700 font-bold font-mono">
              {totalAvailableTrays} trays ({formatNumber(totalPhysicalEggs)} pcs)
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RECENT PENDING ORDERS & FLOCK OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-sky-600" />
              <h4 className="font-heading font-bold text-sm text-slate-900">
                Pending Orders ({pendingOrders.length})
              </h4>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Order Desk →
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p>No pending orders at this moment.</p>
              <button
                onClick={() => onNavigate('orders')}
                className="mt-2 text-emerald-700 hover:text-emerald-800 font-medium text-xs"
              >
                + Create New Customer Order
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingOrders.slice(0, 4).map(ord => (
                <div
                  key={ord.id}
                  onClick={() => onNavigate('orders')}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{ord.orderNumber}</span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-1.5 py-0.2 rounded">
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 font-medium">{ord.customerName}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">{formatCurrency(ord.total)}</div>
                    <div className="text-[10px] text-slate-400">{ord.deliveryDate || 'No date set'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Flocks Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bird className="w-4 h-4 text-amber-600" />
              <h4 className="font-heading font-bold text-sm text-slate-900">
                Active Flocks & Houses ({flocks.length})
              </h4>
            </div>
            <button
              onClick={() => onNavigate('flock')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Flock Register →
            </button>
          </div>

          {flocks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Bird className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p>No flocks created yet. The system begins at 0 birds.</p>
              <button
                onClick={() => onNavigate('flock')}
                className="mt-2 text-emerald-700 hover:text-emerald-800 font-medium text-xs"
              >
                + Register First RTL Flock
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {flocks.map(flock => (
                <div
                  key={flock.id}
                  onClick={() => onNavigate('flock')}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{flock.batchId}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.2 rounded">
                        {flock.rtlStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Breed: {flock.breedStrain} • Age: {flock.ageWeeks} wks
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      {formatNumber(flock.currentPopulation)} birds
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Started: {formatNumber(flock.startingPopulation)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
