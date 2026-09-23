/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Egg,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Activity,
  Layers,
  Calendar,
  Wallet,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, EGG_GRADES } from '../../constants';
import { EggGradeKey } from '../../types';

interface BusinessPerformanceChartProps {
  onNavigate?: (tab: string) => void;
}

type MetricView = 'financial' | 'cashflow' | 'production' | 'grades';
type TimeRange = '7d' | '14d' | '30d' | '6m';

const GRADE_COLORS: Record<EggGradeKey, string> = {
  peewee: '#cbd5e1', // slate-300
  xs: '#94a3b8',     // slate-400
  small: '#64748b',  // slate-500
  medium: '#0ea5e9', // sky-500
  large: '#10b981',  // emerald-500
  xl: '#6366f1',     // indigo-500
  jumbo: '#f59e0b',  // amber-500
  oversize: '#ec4899', // pink-500
  superJumbo: '#ec4899', // legacy
};

export const BusinessPerformanceChart: React.FC<BusinessPerformanceChartProps> = ({ onNavigate }) => {
  const {
    sales,
    payments,
    expenses,
    eggProductionLogs,
    flocks,
    feedConsumptionLogs,
  } = useFarm();

  const [metricView, setMetricView] = useState<MetricView>('financial');
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');

  // Compute date intervals based on selected TimeRange
  const dateBuckets = useMemo(() => {
    const buckets: { key: string; label: string; dateStart: string; dateEnd: string }[] = [];
    const today = new Date();

    if (timeRange === '6m') {
      // Monthly aggregation for last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const monthKey = `${yyyy}-${mm}`;
        const label = d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' });
        
        // Month end
        const lastDayOfMonth = new Date(yyyy, d.getMonth() + 1, 0).getDate();
        const dateStart = `${monthKey}-01`;
        const dateEnd = `${monthKey}-${String(lastDayOfMonth).padStart(2, '0')}`;
        buckets.push({ key: monthKey, label, dateStart, dateEnd });
      }
    } else {
      // Daily aggregation for 7, 14, or 30 days
      const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const label =
          daysCount <= 7
            ? d.toLocaleDateString('en-PH', { weekday: 'short', month: 'numeric', day: 'numeric' })
            : d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
        buckets.push({ key: dateKey, label, dateStart: dateKey, dateEnd: dateKey });
      }
    }
    return buckets;
  }, [timeRange]);

  // Aggregate Performance Metrics into time series data
  const chartData = useMemo(() => {
    const totalFlockPopulation = flocks.reduce((sum, f) => sum + f.currentPopulation, 0);

    return dateBuckets.map(b => {
      // In range filter helper
      const isDateInRange = (dateStr: string) => {
        if (timeRange === '6m') {
          return dateStr >= b.dateStart && dateStr <= b.dateEnd;
        }
        return dateStr === b.key;
      };

      // 1. Sales Revenue
      const periodSales = sales.filter(s => isDateInRange(s.date));
      const revenue = periodSales.reduce((sum, s) => sum + s.total, 0);

      // 2. Expenses (Feed consumed cost + Operating Expenses)
      const periodOpExpenses = expenses.filter(e => isDateInRange(e.date));
      const opExpenses = periodOpExpenses.reduce((sum, e) => sum + e.amount, 0);

      const periodFeedConsumed = feedConsumptionLogs.filter(f => isDateInRange(f.date));
      const feedCost = periodFeedConsumed.reduce((sum, f) => sum + f.cost, 0);

      const totalCost = opExpenses + feedCost;
      const netProfit = revenue - totalCost;

      // 3. Cash Flow
      const periodPayments = payments.filter(p => isDateInRange(p.paymentDate));
      const cashInflow = periodPayments.reduce((sum, p) => sum + p.amount, 0);

      const cashExpenses = periodOpExpenses
        .filter(e => e.paymentAccount === 'cash_on_hand')
        .reduce((sum, e) => sum + e.amount, 0);
      const netCashFlow = cashInflow - cashExpenses;

      // 4. Production & HDP
      const periodProdLogs = eggProductionLogs.filter(l => isDateInRange(l.date));
      const totalEggs = periodProdLogs.reduce((sum, l) => sum + l.totalCollection, 0);
      const usableEggs = periodProdLogs.reduce((sum, l) => sum + l.usableEggs, 0);
      const rejectEggs = periodProdLogs.reduce(
        (sum, l) => sum + (l.rejects != null ? l.rejects : (l.brokenEggs || 0) + (l.dirtyEggs || 0)),
        0
      );
      
      // Calculate lay rate percentage (HDP)
      let hdp = 0;
      if (totalFlockPopulation > 0) {
        if (timeRange === '6m') {
          // Average daily usable eggs in month / population
          const daysInMonth = 30;
          hdp = Number(((usableEggs / daysInMonth / totalFlockPopulation) * 100).toFixed(1));
        } else {
          hdp = Number(((usableEggs / totalFlockPopulation) * 100).toFixed(1));
        }
      }

      return {
        key: b.key,
        label: b.label,
        revenue,
        feedCost,
        opExpenses,
        totalCost,
        netProfit,
        cashInflow,
        cashExpenses,
        netCashFlow,
        totalEggs,
        usableEggs,
        rejectEggs,
        hdp,
      };
    });
  }, [dateBuckets, sales, expenses, feedConsumptionLogs, payments, eggProductionLogs, flocks, timeRange]);

  // Aggregate Sales Volume and Revenue by Grade across all period
  const gradeContributionData = useMemo(() => {
    const minDate = dateBuckets[0]?.dateStart || '';
    const maxDate = dateBuckets[dateBuckets.length - 1]?.dateEnd || '';

    const periodSales = sales.filter(s => s.date >= minDate && s.date <= maxDate);
    
    const gradeMap: Record<EggGradeKey, { revenue: number; trays: number; pieces: number }> = {
      peewee: { revenue: 0, trays: 0, pieces: 0 },
      xs: { revenue: 0, trays: 0, pieces: 0 },
      small: { revenue: 0, trays: 0, pieces: 0 },
      medium: { revenue: 0, trays: 0, pieces: 0 },
      large: { revenue: 0, trays: 0, pieces: 0 },
      xl: { revenue: 0, trays: 0, pieces: 0 },
      jumbo: { revenue: 0, trays: 0, pieces: 0 },
      oversize: { revenue: 0, trays: 0, pieces: 0 },
      superJumbo: { revenue: 0, trays: 0, pieces: 0 },
    };

    periodSales.forEach(sale => {
      sale.items.forEach(item => {
        if (gradeMap[item.grade]) {
          gradeMap[item.grade].revenue += item.subtotal;
          gradeMap[item.grade].trays += item.quantityTrays;
          gradeMap[item.grade].pieces += item.quantityPieces;
        }
      });
    });

    return EGG_GRADES.map(grade => ({
      key: grade.key,
      name: grade.label,
      revenue: gradeMap[grade.key].revenue,
      trays: gradeMap[grade.key].trays,
      pieces: gradeMap[grade.key].pieces,
      color: GRADE_COLORS[grade.key],
    })).filter(g => g.revenue > 0 || g.trays > 0);
  }, [sales, dateBuckets]);

  // Summary KPI Totals for Selected Time Window
  const periodTotals = useMemo(() => {
    const totalRev = chartData.reduce((acc, d) => acc + d.revenue, 0);
    const totalCost = chartData.reduce((acc, d) => acc + d.totalCost, 0);
    const netProfit = totalRev - totalCost;
    const margin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;
    const totalEggs = chartData.reduce((acc, d) => acc + d.totalEggs, 0);
    const daysWithProd = chartData.filter(d => d.totalEggs > 0).length || 1;
    const avgDailyEggs = Math.round(totalEggs / daysWithProd);
    const avgHdp = Number((chartData.reduce((acc, d) => acc + d.hdp, 0) / (chartData.length || 1)).toFixed(1));

    return {
      totalRev,
      totalCost,
      netProfit,
      margin,
      totalEggs,
      avgDailyEggs,
      avgHdp,
    };
  }, [chartData]);

  const hasActivity =
    periodTotals.totalRev > 0 ||
    periodTotals.totalCost > 0 ||
    periodTotals.totalEggs > 0;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs min-w-[180px] z-50">
        <div className="font-semibold text-slate-200 pb-1.5 mb-1.5 border-b border-slate-700">
          {label}
        </div>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const isCurrency =
              entry.dataKey === 'revenue' ||
              entry.dataKey === 'totalCost' ||
              entry.dataKey === 'netProfit' ||
              entry.dataKey === 'cashInflow' ||
              entry.dataKey === 'cashExpenses' ||
              entry.dataKey === 'netCashFlow' ||
              entry.dataKey === 'feedCost' ||
              entry.dataKey === 'opExpenses';
            
            const isPercent = entry.dataKey === 'hdp';
            
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  <span className="text-slate-300">{entry.name}:</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {isCurrency
                    ? formatCurrency(entry.value)
                    : isPercent
                    ? `${entry.value}%`
                    : formatNumber(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
      {/* Header & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-heading font-bold text-base text-slate-900 tracking-tight">
              Business Performance Analytics
            </h3>
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              Executive Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic trends of farm revenue, operating costs, profit margins, and production lay curves.
          </p>
        </div>

        {/* Filters: Metric Switcher & Date Range */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric View Tabs */}
          <div className="inline-flex bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200">
            <button
              onClick={() => setMetricView('financial')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                metricView === 'financial'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>P&L Trend</span>
            </button>
            <button
              onClick={() => setMetricView('cashflow')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                metricView === 'cashflow'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-teal-600" />
              <span>Cash Flow</span>
            </button>
            <button
              onClick={() => setMetricView('production')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                metricView === 'production'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Egg className="w-3.5 h-3.5 text-amber-600" />
              <span>Lay & HDP%</span>
            </button>
            <button
              onClick={() => setMetricView('grades')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                metricView === 'grades'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Grade Mix</span>
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200">
            {(['7d', '14d', '30d', '6m'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : range === '30d' ? '30 Days' : '6 Months'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Performance Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">Period Gross Revenue</span>
          <div className="text-base font-bold text-slate-900 font-heading mt-0.5">
            {formatCurrency(periodTotals.totalRev)}
          </div>
          <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            Egg Invoices & Sales
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">Period Operating Costs</span>
          <div className="text-base font-bold text-slate-900 font-heading mt-0.5">
            {formatCurrency(periodTotals.totalCost)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Feed COGS + OpEx</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">Net Farm Profit</span>
          <div
            className={`text-base font-bold font-heading mt-0.5 ${
              periodTotals.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(periodTotals.netProfit)}
          </div>
          <span
            className={`text-[10px] font-semibold flex items-center gap-0.5 mt-0.5 ${
              periodTotals.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {periodTotals.netProfit >= 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            Margin: {periodTotals.margin.toFixed(1)}%
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">Egg Output / Avg HDP</span>
          <div className="text-base font-bold text-slate-900 font-heading mt-0.5">
            {formatNumber(periodTotals.totalEggs)} <span className="text-xs font-normal text-slate-500">eggs</span>
          </div>
          <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
            Avg Lay Rate: {periodTotals.avgHdp}% HDP
          </span>
        </div>
      </div>

      {/* Main Chart Visualization Area */}
      <div className="h-[320px] w-full pt-2">
        {!hasActivity ? (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
            <Activity className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Business Activity in Selected Period</p>
            <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
              As you record egg collections, sales invoices, feed usage, and expenses, live graphical analytics will automatically plot here.
            </p>
            <div className="flex items-center gap-2">
              {onNavigate && (
                <>
                  <button
                    onClick={() => onNavigate('sales')}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    + Record Sale
                  </button>
                  <button
                    onClick={() => onNavigate('production')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    + Log Egg Collection
                  </button>
                </>
              )}
            </div>
          </div>
        ) : metricView === 'financial' ? (
          // 1. FINANCIAL VIEW: REVENUE vs EXPENSES vs NET PROFIT
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={val => `₱${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar dataKey="revenue" name="Sales Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="totalCost" name="Operating Costs" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Line
                type="monotone"
                dataKey="netProfit"
                name="Net Profit"
                stroke="#0f172a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0f172a', strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : metricView === 'cashflow' ? (
          // 2. CASH FLOW VIEW: INFLOWS vs EXPENSES OUTFLOWS
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={val => `₱${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar dataKey="cashInflow" name="Cash Received" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="cashExpenses" name="Cash Paid Out" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Area
                type="monotone"
                dataKey="netCashFlow"
                name="Net Cash Movement"
                fill="#0284c7"
                fillOpacity={0.15}
                stroke="#0284c7"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : metricView === 'production' ? (
          // 3. PRODUCTION VIEW: USABLE EGGS, REJECTS & HDP %
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={val => formatNumber(val)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#d97706' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={val => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar
                yAxisId="left"
                dataKey="usableEggs"
                name="Good Eggs"
                fill="#10b981"
                stackId="eggs"
                radius={[0, 0, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                yAxisId="left"
                dataKey="rejectEggs"
                name="Rejects"
                fill="#f59e0b"
                stackId="eggs"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="hdp"
                name="Lay Rate (HDP %)"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#d97706', strokeWidth: 1, stroke: '#ffffff' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          // 4. GRADE MIX VIEW: REVENUE CONTRIBUTION BY EGG SIZE
          <div className="grid grid-cols-1 md:grid-cols-2 h-full items-center gap-4">
            {gradeContributionData.length === 0 ? (
              <div className="col-span-2 text-center text-slate-400 text-xs py-8">
                <Layers className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p>No egg sales logged for this period yet to plot grade breakdown.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={gradeContributionData}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {gradeContributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Revenue & Trays Sold by Grade
                  </span>
                  {gradeContributionData.map(grade => {
                    const percent =
                      periodTotals.totalRev > 0
                        ? ((grade.revenue / periodTotals.totalRev) * 100).toFixed(1)
                        : '0.0';

                    return (
                      <div
                        key={grade.key}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: grade.color }}
                          />
                          <span className="font-semibold text-slate-800">{grade.name}</span>
                          <span className="text-[10px] text-slate-400">({grade.trays} trays)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 font-mono">
                            {formatCurrency(grade.revenue)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Insight Banner */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Calculated directly from validated farm ledger entries and actual sales receipts.</span>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('reports')}
            className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            Detailed Financial & P&L Statement →
          </button>
        )}
      </div>
    </div>
  );
};
