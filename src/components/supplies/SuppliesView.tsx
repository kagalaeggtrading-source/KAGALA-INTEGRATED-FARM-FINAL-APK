/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Pill,
  PlusCircle,
  AlertTriangle,
  Calendar,
  History,
  Trash2,
  Package,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../constants';
import { SupplyCategory, SupplyItem } from '../../types';

export const SuppliesView: React.FC = () => {
  const {
    supplyItems,
    addSupplyItem,
    deleteSupplyItem,
    supplyUsageLogs,
    recordSupplyUsage,
    houses,
    flocks,
  } = useFarm();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);

  // Add Item State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SupplyCategory>('medicine');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState('bottles');
  const [costPerUnit, setCostPerUnit] = useState<number>(250);
  const [supplier, setSupplier] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [batchLot, setBatchLot] = useState('');
  const [minimumStock, setMinimumStock] = useState<number>(3);
  const [notes, setNotes] = useState('');

  // Usage State
  const [usageItemId, setUsageItemId] = useState('');
  const [usageQty, setUsageQty] = useState<number>(1);
  const [usageReason, setUsageReason] = useState('Routine Flock Vaccination');
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0]);
  const [usageHouseId, setUsageHouseId] = useState('');
  const [usageFlockId, setUsageFlockId] = useState('');

  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(now.getDate() + 30);

  // Check alerts
  const expiredItems = supplyItems.filter(
    s => s.expirationDate && new Date(s.expirationDate) < now
  );
  const expiringSoonItems = supplyItems.filter(
    s =>
      s.expirationDate &&
      new Date(s.expirationDate) >= now &&
      new Date(s.expirationDate) <= in30Days
  );
  const lowStockItems = supplyItems.filter(s => s.quantity <= s.minimumStock);

  const filteredItems = supplyItems.filter(
    s => filterCategory === 'all' || s.category === filterCategory
  );

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addSupplyItem({
      name: name.trim(),
      category,
      quantity: Number(quantity),
      unit,
      costPerUnit: Number(costPerUnit),
      supplier: supplier.trim(),
      expirationDate: expirationDate || undefined,
      batchLot: batchLot.trim() || undefined,
      minimumStock: Number(minimumStock),
      notes: notes.trim(),
    });

    setShowAddModal(false);
    setName('');
    setNotes('');
  };

  const handleRecordUsage = (e: React.FormEvent) => {
    e.preventDefault();
    const item = supplyItems.find(s => s.id === usageItemId) || supplyItems[0];
    if (!item) return;

    recordSupplyUsage({
      date: usageDate,
      supplyItemId: item.id,
      supplyName: item.name,
      quantity: Number(usageQty),
      unit: item.unit,
      reason: usageReason.trim(),
      houseId: usageHouseId || undefined,
      flockId: usageFlockId || undefined,
    });

    setShowUsageModal(false);
    setUsageQty(1);
    setUsageReason('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Medicine, Vitamins & Farm Supplies
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain stock of veterinary medicines, electrolytes, disinfectants, egg trays, and packaging materials with expiration audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (supplyItems.length === 0) {
                alert('Please register a supply item first.');
                return;
              }
              setUsageItemId(supplyItems[0].id);
              setShowUsageModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <span>Log Usage / Application</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Supply Item</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(expiredItems.length > 0 || expiringSoonItems.length > 0 || lowStockItems.length > 0) && (
        <div className="space-y-2">
          {expiredItems.map(item => (
            <div
              key={item.id}
              className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between font-medium"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  EXPIRED: <strong className="font-bold">{item.name}</strong> expired on{' '}
                  {item.expirationDate}. Do not administer to flocks!
                </span>
              </div>
            </div>
          ))}

          {expiringSoonItems.map(item => (
            <div
              key={item.id}
              className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-center justify-between font-medium"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  EXPIRING SOON: <strong>{item.name}</strong> expires on {item.expirationDate}. Plan usage accordingly.
                </span>
              </div>
            </div>
          ))}

          {lowStockItems.map(item => (
            <div
              key={item.id}
              className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-center justify-between font-medium"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  LOW STOCK: <strong>{item.name}</strong> has only {item.quantity} {item.unit} remaining (Minimum threshold: {item.minimumStock}).
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'medicine', 'vitamin', 'supplement', 'disinfectant', 'cleaning', 'pest_control', 'fly_control', 'egg_tray', 'packaging', 'other'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
              filterCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Supply Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Supplies Inventory ({filteredItems.length})
          </h3>
          <span className="text-xs text-slate-500">Real physical inventory</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">Zero supplies in this category</p>
            <p className="mt-1 text-slate-400 max-w-sm mx-auto">
              Add medications, vitamins, vaccine stocks, egg trays, and cleaning supplies to track inventories.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register First Supply Item</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right font-bold text-slate-900">Current Stock</th>
                  <th className="p-3 text-right">Cost / Unit</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Batch / Lot</th>
                  <th className="p-3">Expiration Date</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredItems.map(item => {
                  const isExpired = item.expirationDate && new Date(item.expirationDate) < now;
                  const isLow = item.quantity <= item.minimumStock;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-3 capitalize text-slate-600">{item.category.replace('_', ' ')}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        {formatCurrency(item.costPerUnit)}
                      </td>
                      <td className="p-3 text-slate-600">{item.supplier || '—'}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{item.batchLot || '—'}</td>
                      <td className="p-3 font-mono text-slate-600">{item.expirationDate || 'N/A'}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isExpired
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isExpired ? 'EXPIRED' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Delete supply item ${item.name}?`)) {
                              deleteSupplyItem(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage History Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Supply Application & Usage History ({supplyUsageLogs.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Audit trail of medications and consumables used</span>
        </div>

        {supplyUsageLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
            No supply usage records logged yet.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Item Name</th>
                  <th className="p-2.5 text-right">Qty Used</th>
                  <th className="p-2.5">Reason / Protocol</th>
                  <th className="p-2.5">Target House/Flock</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplyUsageLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 font-medium">
                    <td className="p-2.5 text-slate-700">{log.date}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{log.supplyName}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      {log.quantity} {log.unit}
                    </td>
                    <td className="p-2.5 text-slate-700">{log.reason}</td>
                    <td className="p-2.5 text-slate-500">{log.houseId || 'All Houses'}</td>
                    <td className="p-2.5 text-slate-400">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD SUPPLY ITEM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Register Supply / Veterinary Item
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrolife Electrolytes, Virkon Disinfectant, Paper Egg Trays"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 capitalize font-medium"
                  >
                    <option value="medicine">Medicine</option>
                    <option value="vitamin">Vitamin / Electrolyte</option>
                    <option value="supplement">Supplement</option>
                    <option value="disinfectant">Disinfectant</option>
                    <option value="cleaning">Cleaning Supply</option>
                    <option value="pest_control">Pest Control (General)</option>
                    <option value="fly_control">Fly Control & Spraying</option>
                    <option value="egg_tray">Egg Trays</option>
                    <option value="packaging">Packaging Box/Pouch</option>
                    <option value="other">Other Supply</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pcs, bottles, sachets, bundles"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost / Unit (₱)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPerUnit}
                    onChange={e => setCostPerUnit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={minimumStock}
                    onChange={e => setMinimumStock(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={e => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch / Lot #</label>
                  <input
                    type="text"
                    placeholder="Lot number"
                    value={batchLot}
                    onChange={e => setBatchLot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier / Pharmacy</label>
                <input
                  type="text"
                  placeholder="Veterinary supply dealer"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD USAGE */}
      {showUsageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Log Supply Usage / Administration
              </h3>
              <button
                onClick={() => setShowUsageModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordUsage} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supply Item</label>
                <select
                  value={usageItemId}
                  onChange={e => setUsageItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-semibold"
                >
                  {supplyItems.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Stock: {s.quantity} {s.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Used *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={usageQty}
                    onChange={e => setUsageQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={usageDate}
                    onChange={e => setUsageDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Treatment Protocol</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Newcastle Disease Booster, coop biosecurity misting, tray packaging"
                  value={usageReason}
                  onChange={e => setUsageReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUsageModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Deduct from Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
