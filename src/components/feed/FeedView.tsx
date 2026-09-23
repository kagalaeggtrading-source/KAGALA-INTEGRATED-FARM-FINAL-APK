/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Wheat,
  PlusCircle,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  Layers,
  History,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../constants';
import { FeedItem } from '../../types';

export const FeedView: React.FC = () => {
  const {
    feedItems,
    addFeedItem,
    deleteFeedItem,
    feedConsumptionLogs,
    feedPurchaseLogs,
    recordFeedPurchase,
    recordFeedConsumption,
    flocks,
    houses,
    bankAccounts,
  } = useFarm();

  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);

  // New Feed Type Form
  const [feedType, setFeedType] = useState('Layer 1 Mash');
  const [brand, setBrand] = useState('B-Meg');
  const [supplier, setSupplier] = useState('Provincial Feed Distributor');
  const [bagWeightKg, setBagWeightKg] = useState<number>(50);
  const [costPerBag, setCostPerBag] = useState<number>(1750);
  const [initialBags, setInitialBags] = useState<number>(0);
  const [minimumBagsAlert, setMinimumBagsAlert] = useState<number>(10);
  const [notes, setNotes] = useState('');

  // Purchase Form
  const [purchFeedId, setPurchFeedId] = useState('');
  const [purchDate, setPurchDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchBags, setPurchBags] = useState<number>(20);
  const [purchCostPerBag, setPurchCostPerBag] = useState<number>(1750);
  const [purchSupplier, setPurchSupplier] = useState('');
  const [paymentAccount, setPaymentAccount] = useState<'cash_on_hand' | 'bank_account'>('cash_on_hand');
  const [bankAccountId, setBankAccountId] = useState('');

  // Consumption Form
  const [consDate, setConsDate] = useState(new Date().toISOString().split('T')[0]);
  const [consFlockId, setConsFlockId] = useState(flocks[0]?.id || '');
  const [consFeedId, setConsFeedId] = useState(feedItems[0]?.id || '');
  const [consBags, setConsBags] = useState<number>(2);
  const [consKg, setConsKg] = useState<number>(100);
  const [consNotes, setConsNotes] = useState('');

  // Calculations
  const totalStockBags = feedItems.reduce((s, f) => s + f.currentBags, 0);
  const totalStockKg = feedItems.reduce((s, f) => s + f.currentKg, 0);
  const totalStockValue = feedItems.reduce((s, f) => s + f.currentBags * f.costPerBag, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayConsumptionLogs = feedConsumptionLogs.filter(f => f.date === todayStr);
  const todayKgConsumed = todayConsumptionLogs.reduce((s, f) => s + f.kgUsed, 0);
  const todayBagsConsumed = todayConsumptionLogs.reduce((s, f) => s + f.bagsUsed, 0);

  // Average daily usage (past 7 days or total logs)
  const totalKgAllTime = feedConsumptionLogs.reduce((s, f) => s + f.kgUsed, 0);
  const uniqueDatesCount = new Set(feedConsumptionLogs.map(l => l.date)).size || 1;
  const avgDailyKg = feedConsumptionLogs.length > 0 ? totalKgAllTime / uniqueDatesCount : 0;
  const daysRemainingEstimate = avgDailyKg > 0 ? Math.floor(totalStockKg / avgDailyKg) : 0;

  const handleCreateFeedType = (e: React.FormEvent) => {
    e.preventDefault();
    addFeedItem(
      {
        feedType,
        brand,
        supplier,
        bagWeightKg: Number(bagWeightKg),
        costPerBag: Number(costPerBag),
        purchaseDate: new Date().toISOString().split('T')[0],
        minimumBagsAlert: Number(minimumBagsAlert),
        notes,
      },
      Number(initialBags)
    );
    setShowAddFeedModal(false);
  };

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const item = feedItems.find(f => f.id === purchFeedId) || feedItems[0];
    if (!item) return;

    const totalCost = purchBags * purchCostPerBag;

    recordFeedPurchase({
      date: purchDate,
      feedItemId: item.id,
      feedName: `${item.brand} - ${item.feedType}`,
      supplier: purchSupplier || item.supplier,
      bags: Number(purchBags),
      kg: Number(purchBags) * item.bagWeightKg,
      costPerBag: Number(purchCostPerBag),
      totalCost,
      paymentAccount,
      bankAccountId: paymentAccount === 'bank_account' ? bankAccountId : undefined,
    });

    setShowPurchaseModal(false);
  };

  const handleConsumption = (e: React.FormEvent) => {
    e.preventDefault();
    const item = feedItems.find(f => f.id === consFeedId) || feedItems[0];
    const flock = flocks.find(f => f.id === consFlockId) || flocks[0];
    if (!item) return;

    recordFeedConsumption({
      date: consDate,
      farmId: flock?.farmId || 'default',
      houseId: flock?.houseId || 'default',
      flockId: flock?.id || 'default',
      feedItemId: item.id,
      bagsUsed: Number(consBags),
      kgUsed: Number(consKg > 0 ? consKg : consBags * item.bagWeightKg),
      notes: consNotes,
    });

    setShowConsumptionModal(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-amber-700" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Feed Inventory & Daily Consumption
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track stock, daily grams per bird, purchases, and feed cost of production.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (feedItems.length === 0) {
                alert('Please add a Feed Type first.');
                return;
              }
              setPurchFeedId(feedItems[0].id);
              setShowPurchaseModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Record Feed Purchase</span>
          </button>

          <button
            onClick={() => {
              if (feedItems.length === 0) {
                alert('Please add a Feed Type first.');
                return;
              }
              setConsFeedId(feedItems[0].id);
              setShowConsumptionModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Feed Used</span>
          </button>

          <button
            onClick={() => setShowAddFeedModal(true)}
            className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <span>+ Feed Product</span>
          </button>
        </div>
      </div>

      {/* Aggregate Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Current Stock</div>
          <div className="text-xl font-bold text-amber-800 font-heading mt-1">
            {formatNumber(totalStockBags)} <span className="text-xs font-normal text-slate-500">bags</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatNumber(totalStockKg)} kg total</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Stock Asset Value</div>
          <div className="text-xl font-bold text-slate-900 font-heading mt-1">
            {formatCurrency(totalStockValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Inventory value</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Feed Used Today</div>
          <div className="text-xl font-bold text-slate-900 font-heading mt-1">
            {todayBagsConsumed} <span className="text-xs font-normal text-slate-500">bags</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{todayKgConsumed} kg today</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Avg Daily Usage</div>
          <div className="text-xl font-bold text-slate-700 font-heading mt-1">
            {avgDailyKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg/day</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Historical average</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Days Stock Remaining</div>
          <div className="text-xl font-bold text-emerald-700 font-heading mt-1">
            {daysRemainingEstimate > 0 ? `${daysRemainingEstimate} days` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Runway before stockout</div>
        </div>
      </div>

      {/* Feed Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Feed Items In Stock ({feedItems.length})
          </h3>
          <span className="text-xs text-slate-500">Formula: Beginning + Purchases - Consumption = Stock</span>
        </div>

        {feedItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Wheat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">Zero feed items registered</p>
            <p className="mt-1 text-slate-400 max-w-sm mx-auto">
              Add your farm's feed brands (e.g., Layer 1, Layer 2) to track bag inventories and daily flock consumption.
            </p>
            <button
              onClick={() => setShowAddFeedModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Feed Brand / Type</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Feed Type</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Bag Weight</th>
                  <th className="p-3 text-right font-bold text-amber-800">Current Bags</th>
                  <th className="p-3 text-right font-bold">Current KG</th>
                  <th className="p-3 text-right">Cost / Bag</th>
                  <th className="p-3 text-right">Cost / KG</th>
                  <th className="p-3 text-center">Alert Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {feedItems.map(item => {
                  const isLow = item.currentBags <= item.minimumBagsAlert;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-semibold text-slate-900">{item.feedType}</td>
                      <td className="p-3 text-slate-700">{item.brand}</td>
                      <td className="p-3 text-slate-500">{item.supplier}</td>
                      <td className="p-3 text-right font-mono">{item.bagWeightKg} kg</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-900 text-sm">
                        {item.currentBags}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatNumber(item.currentKg)} kg
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        {formatCurrency(item.costPerBag)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        {formatCurrency(item.costPerKg)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLow ? `Low Stock (≤${item.minimumBagsAlert})` : 'Normal'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Delete feed item ${item.brand} ${item.feedType}?`)) {
                              deleteFeedItem(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete Feed Item"
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

      {/* Consumption History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Daily Feed Consumption History ({feedConsumptionLogs.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Linked to flock records</span>
        </div>

        {feedConsumptionLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
            No feed consumption logs recorded yet.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Flock</th>
                  <th className="p-2.5">Feed Item</th>
                  <th className="p-2.5 text-right">Bags Used</th>
                  <th className="p-2.5 text-right">KG Used</th>
                  <th className="p-2.5 text-right">Grams / Bird</th>
                  <th className="p-2.5 text-right font-bold text-slate-800">Feed Cost</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {feedConsumptionLogs.map(log => {
                  const flock = flocks.find(f => f.id === log.flockId);
                  const feed = feedItems.find(f => f.id === log.feedItemId);
                  const birds = flock ? flock.currentPopulation : 0;
                  const gramsPerBird = birds > 0 ? (log.kgUsed * 1000) / birds : 0;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-semibold text-slate-700">{log.date}</td>
                      <td className="p-2.5 text-slate-800">{flock?.batchId || 'All Flocks'}</td>
                      <td className="p-2.5 text-slate-800">{feed?.brand} - {feed?.feedType}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-amber-900">{log.bagsUsed}</td>
                      <td className="p-2.5 text-right font-mono text-slate-900">{log.kgUsed} kg</td>
                      <td className="p-2.5 text-right font-mono text-indigo-700">{gramsPerBird.toFixed(1)} g</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(log.cost)}
                      </td>
                      <td className="p-2.5 text-slate-400">{log.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD FEED PRODUCT */}
      {showAddFeedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Register Feed Product
              </h3>
              <button
                onClick={() => setShowAddFeedModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFeedType} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Feed Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Layer 1 Mash"
                    value={feedType}
                    onChange={e => setFeedType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-Meg / Purina / Uno"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight / Bag (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={bagWeightKg}
                    onChange={e => setBagWeightKg(parseFloat(e.target.value) || 50)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost / Bag (₱)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPerBag}
                    onChange={e => setCostPerBag(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={minimumBagsAlert}
                    onChange={e => setMinimumBagsAlert(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier / Feed Mill</label>
                <input
                  type="text"
                  placeholder="Feed distributor name"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddFeedModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Feed Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD FEED PURCHASE */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Record Feed Purchase & Stock In
              </h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePurchase} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Feed Product</label>
                <select
                  value={purchFeedId}
                  onChange={e => {
                    setPurchFeedId(e.target.value);
                    const sel = feedItems.find(f => f.id === e.target.value);
                    if (sel) setPurchCostPerBag(sel.costPerBag);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-semibold"
                >
                  {feedItems.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.brand} - {f.feedType} (Current: {f.currentBags} bags)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bags Purchased *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchBags}
                    onChange={e => setPurchBags(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price per Bag (₱)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchCostPerBag}
                    onChange={e => setPurchCostPerBag(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-bold">
                <span className="text-slate-700">Total Purchase Cost:</span>
                <span className="text-emerald-700 text-sm font-mono">
                  {formatCurrency(purchBags * purchCostPerBag)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method / Account</label>
                  <select
                    value={paymentAccount}
                    onChange={e => setPaymentAccount(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="cash_on_hand">Cash on Hand</option>
                    <option value="bank_account">Bank Account</option>
                  </select>
                </div>

                {paymentAccount === 'bank_account' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Account</label>
                    <select
                      value={bankAccountId}
                      onChange={e => setBankAccountId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Record Purchase & Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG FEED CONSUMPTION */}
      {showConsumptionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Log Daily Feed Consumption
              </h3>
              <button
                onClick={() => setShowConsumptionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConsumption} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Flock</label>
                  <select
                    value={consFlockId}
                    onChange={e => setConsFlockId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {flocks.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.batchId} ({f.currentPopulation} birds)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Feed Item</label>
                  <select
                    value={consFeedId}
                    onChange={e => setConsFeedId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {feedItems.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.brand} - {f.feedType} ({f.currentBags} bags avail)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bags Consumed *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={consBags}
                    onChange={e => {
                      const bags = Math.max(1, parseInt(e.target.value) || 1);
                      setConsBags(bags);
                      setConsKg(bags * 50);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">KG Consumed</label>
                  <input
                    type="number"
                    min="1"
                    value={consKg}
                    onChange={e => setConsKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={consDate}
                  onChange={e => setConsDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConsumptionModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
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
