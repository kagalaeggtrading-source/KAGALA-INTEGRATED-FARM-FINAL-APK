/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Wheat,
  Activity,
  Sliders,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../../constants';

export const CostOfProductionView: React.FC = () => {
  const {
    eggProductionLogs,
    feedConsumptionLogs,
    expenses,
    sales,
    flocks,
  } = useFarm();

  // Unit Economics Calculations
  const totalUsableEggs = eggProductionLogs.reduce((s, l) => s + l.usableEggs, 0);
  const totalTrays = Math.floor(totalUsableEggs / 30);

  const totalFeedCost = feedConsumptionLogs.reduce((s, l) => s + l.cost, 0);
  const totalFeedKg = feedConsumptionLogs.reduce((s, l) => s + l.kgUsed, 0);

  const totalNonFeedExpenses = expenses
    .filter(e => e.category !== 'Feed')
    .reduce((s, e) => s + e.amount, 0);

  const totalProductionCost = totalFeedCost + totalNonFeedExpenses;

  // Cost per unit
  const costPerEgg = totalUsableEggs > 0 ? totalProductionCost / totalUsableEggs : 0;
  const costPerTray = costPerEgg * 30;
  const feedCostPerEgg = totalUsableEggs > 0 ? totalFeedCost / totalUsableEggs : 0;
  const feedCostPerTray = feedCostPerEgg * 30;

  // Sales Revenue & Realized Margins
  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
  const netProfit = totalRevenue - totalProductionCost;
  const avgSellingPricePerTray =
    totalTrays > 0 && totalRevenue > 0 ? totalRevenue / totalTrays : 220;
  const avgSellingPricePerEgg = avgSellingPricePerTray / 30;

  const marginPerEgg = avgSellingPricePerEgg - costPerEgg;
  const marginPerTray = avgSellingPricePerTray - costPerTray;
  const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Bird-Day Metrics
  const currentBirds = flocks.reduce((s, f) => s + f.currentPopulation, 0);
  const uniqueProductionDays = new Set(eggProductionLogs.map(l => l.date)).size || 1;
  const totalBirdDays = currentBirds * uniqueProductionDays;

  const feedKgPerBirdDay =
    totalBirdDays > 0 ? (totalFeedKg / totalBirdDays) * 1000 : 0; // grams/bird/day
  const feedCostPerBirdDay = totalBirdDays > 0 ? totalFeedCost / totalBirdDays : 0;

  // Profitability Simulator Interactive State
  const [simPricePerTray, setSimPricePerTray] = useState<number>(220);
  const [simDailyProductionTrays, setSimDailyProductionTrays] = useState<number>(
    totalTrays > 0 ? Math.round(totalTrays / uniqueProductionDays) : 35
  );

  const simDailyRevenue = simDailyProductionTrays * simPricePerTray;
  const simDailyCost =
    totalTrays > 0 && costPerTray > 0
      ? simDailyProductionTrays * costPerTray
      : simDailyProductionTrays * 175; // realistic fallback cost
  const simDailyProfit = simDailyRevenue - simDailyCost;
  const simMonthlyProfit = simDailyProfit * 30;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Cost of Production & Unit Economics Analyzer
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time calculations for Cost Per Egg, Cost Per Tray, Feed Conversion, and commercial breakeven pricing.
          </p>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Cost per Tray */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">True Cost / Tray (30 pcs)</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-heading mt-1">
            {formatCurrency(costPerTray)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Feed + labor + utilities allocated
          </div>
        </div>

        {/* Cost per Piece */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Cost / Egg Piece</span>
            <Calculator className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-heading mt-1">
            {formatCurrency(costPerEgg)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Feed alone: {formatCurrency(feedCostPerEgg)}
          </div>
        </div>

        {/* Realized Profit Margin */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Average Margin / Tray</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div
            className={`text-2xl font-bold font-heading mt-1 ${
              marginPerTray >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatCurrency(marginPerTray)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {netMarginPercent >= 0 ? '+' : ''}
            {netMarginPercent.toFixed(1)}% net margin
          </div>
        </div>

        {/* Feed Intake per Bird */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Feed Intake / Bird</span>
            <Wheat className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-heading mt-1">
            {feedKgPerBirdDay > 0 ? `${feedKgPerBirdDay.toFixed(1)}g` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Target: 110 - 120 grams/day</div>
        </div>
      </div>

      {/* Two Column Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cost Structure Decomposition */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Cost Structure Allocation
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Total Feed Consumed:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatNumber(totalFeedKg)} kg ({formatCurrency(totalFeedCost)})
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Labor & Staff Overhead:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(
                  expenses
                    .filter(e => e.category === 'Labor & Salaries')
                    .reduce((s, e) => s + e.amount, 0)
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Power, Water & Utilities:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(
                  expenses
                    .filter(e => e.category === 'Water' || e.category === 'Electricity')
                    .reduce((s, e) => s + e.amount, 0)
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Veterinary & Biosecurity:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(
                  expenses
                    .filter(e => e.category === 'Medicine & Vitamins' || e.category === 'Repairs & Maintenance')
                    .reduce((s, e) => s + e.amount, 0)
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Egg Trays & Packaging:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(
                  expenses
                    .filter(e => e.category === 'Egg Trays & Packaging')
                    .reduce((s, e) => s + e.amount, 0)
                )}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 text-sm">
              <span>Total Cost of Goods & Operations:</span>
              <span className="font-mono text-rose-700">{formatCurrency(totalProductionCost)}</span>
            </div>
          </div>
        </div>

        {/* Per-Bird Daily Economics */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Per-Bird Daily Performance Economics
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Feed Cost per Bird / Day:</span>
              <span className="font-mono font-bold text-amber-800">
                {formatCurrency(feedCostPerBirdDay)} / bird
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Feed Cost Percentage of Total:</span>
              <span className="font-mono font-bold text-slate-800">
                {totalProductionCost > 0
                  ? `${((totalFeedCost / totalProductionCost) * 100).toFixed(1)}%`
                  : '—'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Current Live Flock Count:</span>
              <span className="font-mono font-bold text-emerald-800">
                {formatNumber(currentBirds)} layers
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Cumulative Usable Eggs Produced:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatNumber(totalUsableEggs)} pcs ({formatNumber(totalTrays)} trays)
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-slate-900 text-sm">
              <span>Gross Farm Revenue Realized:</span>
              <span className="font-mono text-emerald-800">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Breakeven & Profitability Simulator */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>Interactive Pricing & Profitability Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate daily and monthly farm returns based on target selling price per tray and production volume.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Controls */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-700">Selling Price per Tray (₱)</label>
                <span className="font-mono font-bold text-emerald-800">
                  {formatCurrency(simPricePerTray)}
                </span>
              </div>
              <input
                type="range"
                min="160"
                max="320"
                step="5"
                value={simPricePerTray}
                onChange={e => setSimPricePerTray(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>₱160 (Farmgate Low)</span>
                <span>₱240 (Retail Average)</span>
                <span>₱320 (Premium XL)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-700">Daily Production (Trays)</label>
                <span className="font-mono font-bold text-slate-900">
                  {simDailyProductionTrays} trays / day ({simDailyProductionTrays * 30} eggs)
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={simDailyProductionTrays}
                onChange={e => setSimDailyProductionTrays(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>10 trays (~300 birds)</span>
                <span>50 trays (~1,500 birds)</span>
                <span>200 trays (~6,000 birds)</span>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Projected Daily Revenue:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(simDailyRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Daily Production Cost:</span>
                <span className="font-mono font-bold text-rose-700">{formatCurrency(simDailyCost)}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-semibold pt-1 border-t border-slate-200">
                <span>Projected Daily Net Profit:</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    simDailyProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(simDailyProfit)} / day
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Projected 30-Day Monthly Net Income
                </span>
                <span
                  className={`text-xl font-bold font-mono ${
                    simMonthlyProfit >= 0 ? 'text-emerald-800' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(simMonthlyProfit)}
                </span>
              </div>

              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded">
                {simDailyRevenue > 0 ? `${((simDailyProfit / simDailyRevenue) * 100).toFixed(1)}% Margin` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
