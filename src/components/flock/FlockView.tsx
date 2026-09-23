/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Bird,
  PlusCircle,
  Skull,
  ArrowRightLeft,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { formatNumber } from '../../constants';
import { Flock, FlockAdjustmentType } from '../../types';

export const FlockView: React.FC = () => {
  const {
    flocks,
    addFlock,
    deleteFlock,
    flockAdjustments,
    addFlockAdjustment,
    farms,
    houses,
    addFarm,
    addHouse,
  } = useFarm();

  const [selectedFlockId, setSelectedFlockId] = useState<string | null>(
    flocks.length > 0 ? flocks[0].id : null
  );

  // Modals state
  const [showAddFlockModal, setShowAddFlockModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<FlockAdjustmentType>('mortality');

  // New Flock Form State
  const [batchId, setBatchId] = useState('');
  const [farmId, setFarmId] = useState('');
  const [houseId, setHouseId] = useState('');
  const [source, setSource] = useState('Local Breeder / RTL Supplier');
  const [startingPopulation, setStartingPopulation] = useState<number>(1000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [ageWeeks, setAgeWeeks] = useState<number>(16);
  const [breedStrain, setBreedStrain] = useState('Lohmann Brown');
  const [rtlStatus, setRtlStatus] = useState<Flock['rtlStatus']>('Active');
  const [notes, setNotes] = useState('');

  // Quick Farm / House Creation inside modal
  const [newFarmName, setNewFarmName] = useState('');
  const [newHouseName, setNewHouseName] = useState('');

  // Adjustment Form State
  const [adjFlockId, setAdjFlockId] = useState('');
  const [adjDate, setAdjDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjQuantity, setAdjQuantity] = useState<number>(1);
  const [adjReason, setAdjReason] = useState('');
  const [adjNotes, setAdjNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Active selected flock
  const activeFlock = flocks.find(f => f.id === (selectedFlockId || flocks[0]?.id));

  // Overall flock metrics
  const totalLiveBirds = flocks.reduce((sum, f) => sum + f.currentPopulation, 0);
  const totalStartingBirds = flocks.reduce((sum, f) => sum + f.startingPopulation, 0);
  const totalMortality = flockAdjustments
    .filter(a => a.type === 'mortality')
    .reduce((sum, a) => sum + a.quantity, 0);
  const totalCulls = flockAdjustments
    .filter(a => a.type === 'cull')
    .reduce((sum, a) => sum + a.quantity, 0);
  const totalTransfersOut = flockAdjustments
    .filter(a => a.type === 'transfer_out')
    .reduce((sum, a) => sum + a.quantity, 0);
  const totalTransfersIn = flockAdjustments
    .filter(a => a.type === 'transfer_in')
    .reduce((sum, a) => sum + a.quantity, 0);

  const cumulativeMortalityRate = totalStartingBirds > 0 ? (totalMortality / totalStartingBirds) * 100 : 0;

  const handleCreateFlock = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!batchId.trim()) {
      setFormError('Batch ID is required (e.g., BATCH-2026-01)');
      return;
    }
    if (startingPopulation <= 0) {
      setFormError('Starting bird population must be greater than zero');
      return;
    }

    // Auto-create default farm / house if user hasn't created any yet
    let targetFarmId = farmId;
    if (!targetFarmId) {
      if (farms.length > 0) {
        targetFarmId = farms[0].id;
      } else {
        const createdFarm = addFarm(newFarmName || 'Main Farm Site', 'MAIN', 'Primary production compound');
        targetFarmId = createdFarm.id;
      }
    }

    let targetHouseId = houseId;
    if (!targetHouseId) {
      if (houses.length > 0) {
        targetHouseId = houses[0].id;
      } else {
        const createdHouse = addHouse(targetFarmId, newHouseName || 'Building 1', 'BLDG-1', startingPopulation, 'Elevated Cage');
        targetHouseId = createdHouse.id;
      }
    }

    const created = addFlock({
      batchId: batchId.trim(),
      farmId: targetFarmId,
      houseId: targetHouseId,
      source: source.trim(),
      startingPopulation: Number(startingPopulation),
      startDate,
      ageWeeks: Number(ageWeeks),
      breedStrain,
      rtlStatus,
      notes: notes.trim(),
    });

    setSelectedFlockId(created.id);
    setShowAddFlockModal(false);
    // Reset form
    setBatchId('');
    setNotes('');
  };

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetFlock = flocks.find(f => f.id === (adjFlockId || activeFlock?.id));
    if (!targetFlock) {
      setFormError('Please select a flock');
      return;
    }

    if (adjQuantity <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }

    if ((adjustmentType === 'mortality' || adjustmentType === 'cull' || adjustmentType === 'transfer_out') &&
        adjQuantity > targetFlock.currentPopulation) {
      setFormError(
        `Cannot deduct ${adjQuantity} birds. Current population is only ${targetFlock.currentPopulation}. Never allow population to become negative.`
      );
      return;
    }

    try {
      addFlockAdjustment(
        targetFlock.id,
        adjDate,
        adjustmentType,
        Number(adjQuantity),
        adjReason || adjustmentType.toUpperCase(),
        adjNotes
      );
      setShowAdjustmentModal(false);
      setAdjQuantity(1);
      setAdjReason('');
      setAdjNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to record adjustment');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Bird className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Flock & RTL Bird Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track starting vs current head count with mathematical population reconciliation (Starting - Mortality - Culls - Transfers Out + Transfers In = Current).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAdjustmentType('mortality');
              setAdjFlockId(activeFlock?.id || (flocks[0]?.id ?? ''));
              setFormError(null);
              setShowAdjustmentModal(true);
            }}
            disabled={flocks.length === 0}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Skull className="w-4 h-4 text-rose-600" />
            <span>Record Mortality / Cull</span>
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setShowAddFlockModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add RTL Flock / Batch</span>
          </button>
        </div>
      </div>

      {/* Aggregate Population Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Live Birds</div>
          <div className="text-xl font-bold text-slate-900 font-heading mt-1">
            {formatNumber(totalLiveBirds)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all houses</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Starting Population</div>
          <div className="text-xl font-bold text-slate-700 font-heading mt-1">
            {formatNumber(totalStartingBirds)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Initial placement</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Cumulative Mortality</div>
          <div className="text-xl font-bold text-rose-600 font-heading mt-1">
            {formatNumber(totalMortality)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {cumulativeMortalityRate.toFixed(2)}% loss rate
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Culls</div>
          <div className="text-xl font-bold text-amber-700 font-heading mt-1">
            {formatNumber(totalCulls)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Unproductive culled</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Net Transfers</div>
          <div className="text-xl font-bold text-indigo-700 font-heading mt-1">
            {totalTransfersIn - totalTransfersOut >= 0 ? '+' : ''}
            {totalTransfersIn - totalTransfersOut}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">In: {totalTransfersIn} | Out: {totalTransfersOut}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Flock Count</div>
          <div className="text-xl font-bold text-slate-900 font-heading mt-1">
            {flocks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active RTL batches</div>
        </div>
      </div>

      {/* Main Flocks Explorer */}
      {flocks.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center max-w-xl mx-auto shadow-2xs">
          <Bird className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 font-heading">
            Zero Flocks In System
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            The system starts completely clean with 0 birds. To begin logging egg production, feed consumption, and flock mortality, create your first RTL flock batch.
          </p>
          <button
            onClick={() => {
              setFormError(null);
              setShowAddFlockModal(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First RTL Flock</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flocks Selector List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading px-1">
              Registered Flocks ({flocks.length})
            </h3>

            <div className="space-y-2">
              {flocks.map(flock => {
                const isSelected = flock.id === (selectedFlockId || activeFlock?.id);
                const house = houses.find(h => h.id === flock.houseId);
                return (
                  <div
                    key={flock.id}
                    onClick={() => setSelectedFlockId(flock.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 font-heading">
                        {flock.batchId}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        {flock.rtlStatus}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Live Birds:</span>
                      <span className="font-bold font-mono text-slate-900">
                        {formatNumber(flock.currentPopulation)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                      <span>House: {house?.name || 'Default House'}</span>
                      <span>Age: {flock.ageWeeks} wks</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Flock Deep Detail Card */}
          {activeFlock && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 font-heading">
                        Flock: {activeFlock.batchId}
                      </h3>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {activeFlock.breedStrain}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Started {activeFlock.startDate} • Age: {activeFlock.ageWeeks} weeks • Source: {activeFlock.source}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAdjustmentType('mortality');
                        setAdjFlockId(activeFlock.id);
                        setFormError(null);
                        setShowAdjustmentModal(true);
                      }}
                      className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      + Mortality
                    </button>
                    <button
                      onClick={() => {
                        setAdjustmentType('cull');
                        setAdjFlockId(activeFlock.id);
                        setFormError(null);
                        setShowAdjustmentModal(true);
                      }}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      + Cull
                    </button>
                    <button
                      onClick={() => {
                        setAdjustmentType('transfer_out');
                        setAdjFlockId(activeFlock.id);
                        setFormError(null);
                        setShowAdjustmentModal(true);
                      }}
                      className="text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Transfer
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete flock ${activeFlock.batchId}? This cannot be undone.`)) {
                          deleteFlock(activeFlock.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                      title="Delete Flock"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mathematical Population Equation Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-heading">
                    Strict Head Count Audit Equation
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">Starting Birds</div>
                      <div className="text-sm font-bold font-mono text-slate-800 mt-1">
                        {formatNumber(activeFlock.startingPopulation)}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-rose-600">- Mortality</div>
                      <div className="text-sm font-bold font-mono text-rose-600 mt-1">
                        -
                        {formatNumber(
                          flockAdjustments
                            .filter(a => a.flockId === activeFlock.id && a.type === 'mortality')
                            .reduce((s, a) => s + a.quantity, 0)
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-amber-700">- Culls</div>
                      <div className="text-sm font-bold font-mono text-amber-700 mt-1">
                        -
                        {formatNumber(
                          flockAdjustments
                            .filter(a => a.flockId === activeFlock.id && a.type === 'cull')
                            .reduce((s, a) => s + a.quantity, 0)
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-indigo-700">± Transfers</div>
                      <div className="text-sm font-bold font-mono text-indigo-700 mt-1">
                        {flockAdjustments
                          .filter(a => a.flockId === activeFlock.id && a.type === 'transfer_in')
                          .reduce((s, a) => s + a.quantity, 0) -
                          flockAdjustments
                            .filter(a => a.flockId === activeFlock.id && a.type === 'transfer_out')
                            .reduce((s, a) => s + a.quantity, 0)}
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-300 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-emerald-800 font-semibold">= Current Live</div>
                      <div className="text-sm font-bold font-mono text-emerald-900 mt-1">
                        {formatNumber(activeFlock.currentPopulation)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Trail: Adjustment History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-heading mb-3">
                    Population Adjustment History ({flockAdjustments.filter(a => a.flockId === activeFlock.id).length})
                  </h4>

                  {flockAdjustments.filter(a => a.flockId === activeFlock.id).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                      No mortality or cull entries recorded for this flock yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5 text-right">Quantity</th>
                            <th className="p-2.5">Reason</th>
                            <th className="p-2.5">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {flockAdjustments
                            .filter(a => a.flockId === activeFlock.id)
                            .map(adj => (
                              <tr key={adj.id} className="hover:bg-slate-50/70">
                                <td className="p-2.5 text-slate-700 font-medium">{adj.date}</td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      adj.type === 'mortality'
                                        ? 'bg-rose-100 text-rose-800'
                                        : adj.type === 'cull'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-indigo-100 text-indigo-800'
                                    }`}
                                  >
                                    {adj.type.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                  {adj.quantity}
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD NEW FLOCK */}
      {showAddFlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Register New RTL Flock / Batch
              </h3>
              <button
                onClick={() => setShowAddFlockModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateFlock} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch / Flock ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RTL-BATCH-01"
                    value={batchId}
                    onChange={e => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Population (Birds) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={startingPopulation}
                    onChange={e => setStartingPopulation(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Placement Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age at Placement (Weeks)</label>
                  <input
                    type="number"
                    min="1"
                    value={ageWeeks}
                    onChange={e => setAgeWeeks(parseInt(e.target.value) || 16)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Breed / Strain</label>
                  <select
                    value={breedStrain}
                    onChange={e => setBreedStrain(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  >
                    <option value="Lohmann Brown">Lohmann Brown</option>
                    <option value="Dekalb White">Dekalb White</option>
                    <option value="Hy-Line Brown">Hy-Line Brown</option>
                    <option value="Novogen Brown">Novogen Brown</option>
                    <option value="Bovans Brown">Bovans Brown</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RTL Status</label>
                  <select
                    value={rtlStatus}
                    onChange={e => setRtlStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  >
                    <option value="Active">Active (Laying)</option>
                    <option value="Molting">Molting</option>
                    <option value="Culled">Culled</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source / Breeder Supplier</label>
                <input
                  type="text"
                  placeholder="Supplier name or hatchery"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Cage Row</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes, house section, cage tier..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddFlockModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Flock Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG MORTALITY / CULL / TRANSFER */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Record Flock Adjustment
              </h3>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdjustment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Flock</label>
                <select
                  value={adjFlockId || activeFlock?.id || ''}
                  onChange={e => setAdjFlockId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-medium"
                >
                  {flocks.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.batchId} (Current Live: {f.currentPopulation} birds)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentType}
                    onChange={e => setAdjustmentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-semibold"
                  >
                    <option value="mortality">💀 Mortality (Death)</option>
                    <option value="cull">✂️ Cull (Unproductive)</option>
                    <option value="transfer_out">📤 Transfer Out</option>
                    <option value="transfer_in">📥 Transfer In</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity (Birds) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjQuantity}
                    onChange={e => setAdjQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={adjDate}
                  onChange={e => setAdjDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Cause of Mortality</label>
                <input
                  type="text"
                  placeholder="e.g. Heat stress, prolapse, natural, age, cage injury..."
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Corrective Action</label>
                <textarea
                  rows={2}
                  placeholder="Optional observations..."
                  value={adjNotes}
                  onChange={e => setAdjNotes(e.target.value)}
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Record Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
