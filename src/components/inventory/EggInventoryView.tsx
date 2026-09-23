/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  PackageCheck,
  PlusCircle,
  AlertTriangle,
  Layers,
  ArrowDownUp,
  History,
  ShieldCheck,
} from 'lucide-react';
import { EGG_GRADES, formatNumber } from '../../constants';
import { EggGradeKey, EggInventoryAdjustment } from '../../types';

export const EggInventoryView: React.FC = () => {
  const {
    eggStockSummary,
    totalPhysicalEggs,
    totalAvailableEggs,
    totalAvailableTrays,
    totalReservedEggs,
    eggAdjustments,
    addEggAdjustment,
  } = useFarm();

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [grade, setGrade] = useState<EggGradeKey>('medium');
  const [type, setType] = useState<EggInventoryAdjustment['type']>('adjustment_out');
  const [quantityPieces, setQuantityPieces] = useState<number>(30);
  const [isTrayUnit, setIsTrayUnit] = useState<boolean>(true);
  const [reason, setReason] = useState('Storage Breakage');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuantity = isTrayUnit ? quantityPieces * 30 : quantityPieces;

    if (finalQuantity <= 0) return;

    addEggAdjustment({
      date,
      grade,
      type,
      quantityPieces: finalQuantity,
      reason: reason.trim(),
      notes: notes.trim(),
    });

    setShowAdjustmentModal(false);
    setQuantityPieces(30);
    setReason('Storage Breakage');
    setNotes('');
  };

  const totalSoldAllTime = Object.values(eggStockSummary).reduce((s, g) => s + g.sold, 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Live Egg Inventory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock equation: Beginning + Production + Adjustments In - Sales - Damaged - Adjustments Out = Ending Stock.
          </p>
        </div>

        <button
          onClick={() => setShowAdjustmentModal(true)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <ArrowDownUp className="w-4 h-4" />
          <span>Record Stock Adjustment</span>
        </button>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Available for Sale</div>
          <div className="text-2xl font-bold text-emerald-700 font-heading mt-1">
            {formatNumber(totalAvailableTrays)} <span className="text-xs font-normal text-slate-500">trays</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {formatNumber(totalAvailableEggs)} pcs unreserved
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Physical Warehouse Stock</div>
          <div className="text-2xl font-bold text-slate-900 font-heading mt-1">
            {formatNumber(Math.floor(totalPhysicalEggs / 30))} <span className="text-xs font-normal text-slate-500">trays</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {formatNumber(totalPhysicalEggs)} pcs total in storage
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Reserved in Pending Orders</div>
          <div className="text-2xl font-bold text-sky-700 font-heading mt-1">
            {formatNumber(Math.floor(totalReservedEggs / 30))} <span className="text-xs font-normal text-slate-500">trays</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {formatNumber(totalReservedEggs)} pcs reserved
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Sold to Date</div>
          <div className="text-2xl font-bold text-slate-700 font-heading mt-1">
            {formatNumber(Math.floor(totalSoldAllTime / 30))} <span className="text-xs font-normal text-slate-500">trays</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {formatNumber(totalSoldAllTime)} pcs dispatched
          </div>
        </div>
      </div>

      {/* Grade Inventory Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Grade-by-Grade Inventory Breakdown
            </h3>
            <p className="text-xs text-slate-500">Standard 30-egg tray packing logic</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Real-time Anti-Overselling Protection Active</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3">Egg Grade</th>
                <th className="p-3">Weight Class</th>
                <th className="p-3 text-right">Produced</th>
                <th className="p-3 text-right">Adj In</th>
                <th className="p-3 text-right text-rose-600">Adj Out</th>
                <th className="p-3 text-right">Sold</th>
                <th className="p-3 text-right font-bold text-slate-800">Physical Pcs</th>
                <th className="p-3 text-right text-sky-700 font-bold">Reserved</th>
                <th className="p-3 text-right font-bold text-emerald-700 bg-emerald-50/50">
                  Available Trays
                </th>
                <th className="p-3 text-right font-bold text-emerald-800 bg-emerald-50/50">
                  Available Loose
                </th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {EGG_GRADES.map(gradeItem => {
                const stock = eggStockSummary[gradeItem.key];
                const status =
                  stock.availableTrays >= 10
                    ? 'In Stock'
                    : stock.availableTrays > 0
                    ? 'Low Stock'
                    : 'Depleted';

                return (
                  <tr key={gradeItem.key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{gradeItem.label}</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{gradeItem.weightRange}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{formatNumber(stock.produced)}</td>
                    <td className="p-3 text-right font-mono text-emerald-600">+{formatNumber(stock.adjustmentsIn)}</td>
                    <td className="p-3 text-right font-mono text-rose-600">-{formatNumber(stock.adjustmentsOut)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{formatNumber(stock.sold)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatNumber(stock.totalPhysical)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-sky-700">
                      {formatNumber(stock.reserved)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      {stock.availableTrays} trays
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700 bg-emerald-50/30">
                      {stock.availableLoose} pcs
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          status === 'In Stock'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'Low Stock'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustments History Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Stock Adjustment Log ({eggAdjustments.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Damage, breakage & manual audit reconciliations</span>
        </div>

        {eggAdjustments.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
            No stock adjustments recorded yet.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Grade</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-right">Quantity</th>
                  <th className="p-2.5">Reason</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eggAdjustments.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-slate-700">{adj.date}</td>
                    <td className="p-2.5 font-semibold text-slate-800 uppercase">{adj.grade}</td>
                    <td className="p-2.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          adj.type === 'adjustment_in'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {adj.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      {adj.quantityPieces} pcs ({Math.floor(adj.quantityPieces / 30)}t)
                    </td>
                    <td className="p-2.5 text-slate-700">{adj.reason}</td>
                    <td className="p-2.5 text-slate-400">{adj.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: RECORD STOCK ADJUSTMENT */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Record Egg Inventory Adjustment
              </h3>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Egg Grade</label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-semibold"
                  >
                    {EGG_GRADES.map(g => (
                      <option key={g.key} value={g.key}>
                        {g.label} ({g.weightRange})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adjustment Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  >
                    <option value="adjustment_out">Stock Out (Breakage / Damage)</option>
                    <option value="adjustment_in">Stock In (Found / Found Surplus)</option>
                    <option value="spoilage">Spoilage / Expired</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Quantity</label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={isTrayUnit}
                        onChange={() => setIsTrayUnit(true)}
                      />
                      <span>Trays (x30)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isTrayUnit}
                        onChange={() => setIsTrayUnit(false)}
                      />
                      <span>Pieces</span>
                    </label>
                  </div>
                </div>

                <input
                  type="number"
                  min="1"
                  required
                  value={quantityPieces}
                  onChange={e => setQuantityPieces(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Total adjustment: {isTrayUnit ? quantityPieces * 30 : quantityPieces} individual eggs
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken in packaging, tray drop, moisture damage..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Apply Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
