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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Egg,
  ArrowUpRight,
  PieChart as PieIcon,
  Wallet,
  Tag,
  Sliders,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { formatCurrency, formatNumber, EGG_GRADES } from '../../constants';
import { EggGradeKey } from '../../types';

interface BusinessPerformanceChartProps {
  onNavigate?: (tab: string) => void;
}

type MetricView = 'financial' | 'cashflow' | 'production' | 'grades' | 'pricing';
type TimeRange = '7d' | '14d' | '30d' | '6m';

const GRADE_COLORS: Record<EggGradeKey, string> = {
  peewee: '#cbd5e1',
  xs: '#94a3b8',
  small: '#64748b',
  medium: '#0ea5e9',
  large: '#10b981',
  xl: '#6366f1',
  jumbo: '#f59e0b',
  oversize: '#ec4899',
  superJumbo: '#a855f7',
};

export const BusinessPerformanceChart: React.FC<BusinessPerformanceChartProps> = ({ onNavigate }) => {
  const {
    sales,
    payments,
    expenses,
    eggProductionLogs,
    flocks,
    priceChangeLogs,
    eggGradePrices,
    updateEggGradePrice,
    currentRole,
    isAdminAuthenticated,
  } = useFarm();

  const [metricView, setMetricView] = useState<MetricView>('financial');
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');

  // Pricing Form State
  const [selectedGrade, setSelectedGrade] = useState<EggGradeKey>('medium');
  const [newTrayPrice, setNewTrayPrice] = useState<number>(eggGradePrices.medium?.trayPrice || 200);
  const [newPiecePrice, setNewPiecePrice] = useState<number>(eggGradePrices.medium?.piecePrice || 6.7);
  const [priceChangeReason, setPriceChangeReason] = useState<string>('');
  const [priceSuccessMsg, setPriceSuccessMsg] = useState<string | null>(null);

  const isAuthorizedAdmin = currentRole === 'admin' || currentRole === 'owner' || isAdminAuthenticated;

  // Compute date intervals based on selected TimeRange
  const dateBuckets = useMemo(() => {
    const buckets: { key: string; label: string; dateStart: string; dateEnd: string }[] = [];
    const today = new Date();

    if (timeRange === '6m') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const monthKey = `${yyyy}-${mm}`;
        const label = d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' });
        const lastDayOfMonth = new Date(yyyy, d.getMonth() + 1, 0).getDate();
        const dateStart = `${monthKey}-01`;
        const dateEnd = `${monthKey}-${String(lastDayOfMonth).padStart(2, '0')}`;
        buckets.push({ key: monthKey, label, dateStart, dateEnd });
      }
    } else {
      const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const label = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
        buckets.push({ key: dateKey, label, dateStart: dateKey, dateEnd: dateKey });
      }
    }

    return buckets;
  }, [timeRange]);

  // Aggregate telemetry data & Price Change Event Markers for chart
  const chartData = useMemo(() => {
    const totalFlockPopulation = flocks.reduce((sum, f) => sum + f.currentPopulation, 0) || 1;

    return dateBuckets.map(bucket => {
      const bucketSales = sales.filter(s => s.date >= bucket.dateStart && s.date <= bucket.dateEnd);
      const bucketPayments = payments.filter(p => p.paymentDate >= bucket.dateStart && p.paymentDate <= bucket.dateEnd);
      const bucketExpenses = expenses.filter(e => e.date >= bucket.dateStart && e.date <= bucket.dateEnd);
      const bucketEggs = eggProductionLogs.filter(l => l.date >= bucket.dateStart && l.date <= bucket.dateEnd);

      const revenue = bucketSales.reduce((acc, s) => acc + s.total, 0);
      const totalCost = bucketExpenses.reduce((acc, e) => acc + e.amount, 0);
      const netProfit = revenue - totalCost;

      const cashInflow = bucketPayments.filter(p => p.accountReceivedInto === 'cash_on_hand').reduce((acc, p) => acc + p.amount, 0);
      const cashExpenses = bucketExpenses.filter(e => e.paymentAccount === 'cash_on_hand').reduce((acc, e) => acc + e.amount, 0);
      const netCashFlow = cashInflow - cashExpenses;

      const totalEggs = bucketEggs.reduce((acc, l) => acc + l.usableEggs, 0);
      const hdp = Number(((totalEggs / totalFlockPopulation) * 100).toFixed(1));

      // Match Price Change Event Log Markers for this date interval
      const priceEvents = priceChangeLogs.filter(
        p => p.date >= bucket.dateStart && p.date <= bucket.dateEnd
      );

      // Average Medium Tray Price on this date interval
      const lastPriceEvent = priceEvents[0];
      const mediumTrayPrice = lastPriceEvent
        ? lastPriceEvent.newPrice
        : eggGradePrices.medium?.trayPrice || 200;

      return {
        label: bucket.label,
        key: bucket.key,
        revenue,
        totalCost,
        netProfit,
        cashInflow,
        cashExpenses,
        netCashFlow,
        totalEggs,
        hdp,
        mediumTrayPrice,
        priceEvents,
        hasPriceChange: priceEvents.length > 0,
      };
    });
  }, [dateBuckets, sales, payments, expenses, eggProductionLogs, flocks, priceChangeLogs, eggGradePrices]);

  // Handle Price Adjustment Form Submit
  const handleSavePriceChange = (e: React.FormEvent) => {
    e.preventDefault();
    updateEggGradePrice(
      selectedGrade,
      Number(newTrayPrice) || 0,
      Number(newPiecePrice) || 0,
      priceChangeReason.trim()
    );
    setPriceSuccessMsg(`Price for ${selectedGrade.toUpperCase()} updated and event marker logged on chart!`);
    setPriceChangeReason('');
    setTimeout(() => setPriceSuccessMsg(null), 4000);
  };

  // Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const currentPoint = payload[0]?.payload;
    const priceEvents: PriceChangeLog[] = currentPoint?.priceEvents || [];

    return (
      <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs min-w-[220px] z-50 space-y-2">
        <div className="font-bold font-heading text-slate-200 pb-1 border-b border-slate-700 flex items-center justify-between">
          <span>{label}</span>
          {priceEvents.length > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
              🏷️ {priceEvents.length} PRICE CHANGE
            </span>
          )}
        </div>

        {/* Visual Callout for Manual Price Change Events */}
        {priceEvents.length > 0 && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-300">
              <Tag className="w-3 h-3 text-amber-400" />
              <span>Admin Manual Price Action:</span>
            </div>
            {priceEvents.map((p, idx) => (
              <div key={idx} className="leading-relaxed">
                • Admin updated <strong>{p.grade.toUpperCase()}</strong> from ₱{p.oldPrice} to <strong className="text-emerald-400">₱{p.newPrice}</strong> per {p.priceType}.
                {p.reason && <div className="text-[10px] text-slate-300 italic mt-0.5 font-mono">Reason: "{p.reason}"</div>}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const isCurrency =
              entry.dataKey === 'revenue' ||
              entry.dataKey === 'totalCost' ||
              entry.dataKey === 'netProfit' ||
              entry.dataKey === 'mediumTrayPrice';
            
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                  <span className="text-slate-300">{entry.name}:</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {isCurrency ? formatCurrency(entry.value) : formatNumber(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-heading font-bold text-base text-slate-900 tracking-tight">
              Business Performance & Price Action Chart
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry, P&L trends, and interactive admin manual price action event markers.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200">
            <button
              onClick={() => setMetricView('financial')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                metricView === 'financial' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>P&L</span>
            </button>
            <button
              onClick={() => setMetricView('pricing')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                metricView === 'pricing' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Price Trend</span>
            </button>
            <button
              onClick={() => setMetricView('cashflow')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                metricView === 'cashflow' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-teal-600" />
              <span>Cash Flow</span>
            </button>
            <button
              onClick={() => setMetricView('production')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                metricView === 'production' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
              }`}
            >
              <Egg className="w-3.5 h-3.5 text-indigo-600" />
              <span>Harvest</span>
            </button>
          </div>

          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200">
            {(['7d', '14d', '30d', '6m'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeRange === range ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Responsive Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'pricing' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Line
                type="monotone"
                dataKey="mediumTrayPrice"
                name="Medium Tray Price (₱)"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.hasPriceChange) {
                    return (
                      <circle
                        key={props.index}
                        cx={cx}
                        cy={cy}
                        r={7}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth={3}
                        className="animate-pulse cursor-pointer"
                      />
                    );
                  }
                  return <circle key={props.index} cx={cx} cy={cy} r={3} fill="#f59e0b" />;
                }}
              />
            </LineChart>
          ) : metricView === 'financial' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="revenue" name="Sales Revenue (₱)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalCost" name="Operating Expenses (₱)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="netProfit" name="Net Operating Income (₱)" stroke="#0ea5e9" strokeWidth={2.5} />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="totalEggs" name="Usable Eggs (Pcs)" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ADMIN MARKET PRICE ADJUSTMENT FORM PANEL */}
      {isAuthorizedAdmin && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-white">
                Admin Selling Price Adjustment & Event Logger
              </h4>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
              LOGS DIRECTLY TO CHART MARKERS
            </span>
          </div>

          {priceSuccessMsg && (
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{priceSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSavePriceChange} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs items-end">
            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Select Egg Grade</label>
              <select
                value={selectedGrade}
                onChange={e => {
                  const g = e.target.value as EggGradeKey;
                  setSelectedGrade(g);
                  const currentP = eggGradePrices[g] || { trayPrice: 200, piecePrice: 6.7 };
                  setNewTrayPrice(currentP.trayPrice);
                  setNewPiecePrice(currentP.piecePrice);
                }}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white"
              >
                {EGG_GRADES.map(g => (
                  <option key={g.key} value={g.key}>
                    {g.label} ({g.weightRange})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">New Tray Price (₱)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newTrayPrice}
                onChange={e => setNewTrayPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-bold mb-1">New Piece Price (₱)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newPiecePrice}
                onChange={e => setNewPiecePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono font-bold text-white"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-[11px] text-slate-300 font-bold mb-1">Reason for Change</label>
              <input
                type="text"
                value={priceChangeReason}
                onChange={e => setPriceChangeReason(e.target.value)}
                placeholder="e.g. Feed cost inflation, market surge"
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Log Price Event</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
