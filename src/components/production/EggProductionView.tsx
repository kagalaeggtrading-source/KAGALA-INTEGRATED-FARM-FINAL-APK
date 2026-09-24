/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Egg,
  PlusCircle,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Filter,
  Eye,
  Edit2,
} from 'lucide-react';
import { EGG_GRADES, formatNumber } from '../../constants';
import { EggGradeBreakdown, EggGradeKey, EggProductionLog } from '../../types';

export const EggProductionView: React.FC = () => {
  const {
    eggProductionLogs,
    addEggProductionLog,
    updateEggProductionLog,
    deleteEggProductionLog,
    flocks,
    houses,
    currentRole,
    hasPermission,
  } = useFarm();

  const canEdit = currentRole === 'admin' || currentRole === 'manager' || hasPermission('canLogProduction');

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<EggProductionLog | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [flockId, setFlockId] = useState<string>(flocks[0]?.id || '');
  const [totalCollection, setTotalCollection] = useState<number>(0);
  const [rejects, setRejects] = useState<number>(0);
  const [collectorName, setCollectorName] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Grade Breakdown Form State (8 Grades)
  const [grades, setGrades] = useState<EggGradeBreakdown>({
    peewee: 0,
    xs: 0,
    small: 0,
    medium: 0,
    large: 0,
    xl: 0,
    jumbo: 0,
    oversize: 0,
  });

  const selectedFlock = flocks.find(f => f.id === flockId) || flocks[0];
  const liveBirds = selectedFlock ? selectedFlock.currentPopulation : 0;

  // Auto Calculations: Good Eggs = totalCollection - rejects
  const usableEggs = Math.max(0, totalCollection - rejects);
  const sumGraded = Object.values(grades).reduce((a, b) => a + (b || 0), 0);
  const hdp = liveBirds > 0 ? (usableEggs / liveBirds) * 100 : 0;
  const eggsPerHen = liveBirds > 0 ? usableEggs / liveBirds : 0;
  const trays = Math.floor(usableEggs / 30);
  const loose = usableEggs % 30;

  // Aggregate Metrics
  const totalProducedAllTime = eggProductionLogs.reduce((s, l) => s + l.totalCollection, 0);
  const totalUsableAllTime = eggProductionLogs.reduce((s, l) => s + l.usableEggs, 0);
  const totalRejectsAllTime = eggProductionLogs.reduce(
    (s, l) => s + (l.rejects != null ? l.rejects : (l.brokenEggs || 0) + (l.dirtyEggs || 0)),
    0
  );
  const avgHdpAllTime =
    eggProductionLogs.length > 0
      ? eggProductionLogs.reduce((s, l) => s + l.hdp, 0) / eggProductionLogs.length
      : 0;

  const handleGradeChange = (key: EggGradeKey, value: number) => {
    setGrades(prev => ({
      ...prev,
      [key]: Math.max(0, value || 0),
    }));
  };

  const handleQuickDistribute = () => {
    // Distribute good eggs according to typical commercial bell curve
    if (usableEggs <= 0) return;
    const m = Math.round(usableEggs * 0.35);
    const l = Math.round(usableEggs * 0.30);
    const s = Math.round(usableEggs * 0.15);
    const xl = Math.round(usableEggs * 0.12);
    const jumbo = Math.round(usableEggs * 0.05);
    const remainder = usableEggs - (m + l + s + xl + jumbo);

    setGrades({
      peewee: 0,
      xs: Math.max(0, remainder > 0 ? Math.floor(remainder / 2) : 0),
      small: s,
      medium: m,
      large: l,
      xl: xl,
      jumbo: jumbo,
      oversize: Math.max(0, remainder > 0 ? Math.ceil(remainder / 2) : 0),
    });
  };

  const handleOpenNewLog = () => {
    setEditingLogId(null);
    setDate(new Date().toISOString().split('T')[0]);
    if (flocks.length > 0 && !flockId) {
      setFlockId(flocks[0].id);
    }
    setTotalCollection(0);
    setRejects(0);
    setCollectorName('');
    setNotes('');
    setGrades({
      peewee: 0,
      xs: 0,
      small: 0,
      medium: 0,
      large: 0,
      xl: 0,
      jumbo: 0,
      oversize: 0,
    });
    setFormError(null);
    setShowLogModal(true);
  };

  const handleEditClick = (log: EggProductionLog) => {
    setEditingLogId(log.id);
    setDate(log.date);
    setFlockId(log.flockId);
    setTotalCollection(log.totalCollection);
    setRejects(log.rejects != null ? log.rejects : (log.brokenEggs || 0) + (log.dirtyEggs || 0));
    setCollectorName(log.collectorName || '');
    setNotes(log.notes || '');
    setGrades({
      peewee: log.grades?.peewee || 0,
      xs: log.grades?.xs || 0,
      small: log.grades?.small || 0,
      medium: log.grades?.medium || 0,
      large: log.grades?.large || 0,
      xl: log.grades?.xl || 0,
      jumbo: log.grades?.jumbo || 0,
      oversize: log.grades?.oversize || 0,
    });
    setFormError(null);
    setShowLogModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (totalCollection <= 0) {
      setFormError('Total daily collected eggs must be greater than zero');
      return;
    }

    if (rejects > totalCollection) {
      setFormError('Reject eggs cannot exceed total daily collected eggs');
      return;
    }

    if (sumGraded !== usableEggs) {
      setFormError(
        `Graded eggs sum (${sumGraded}) does not match good eggs (${usableEggs}). Difference: ${Math.abs(sumGraded - usableEggs)} eggs.`
      );
      return;
    }

    if (!flockId && flocks.length > 0) {
      setFlockId(flocks[0].id);
    }

    const currentFlock = flocks.find(f => f.id === flockId) || flocks[0];

    if (editingLogId) {
      updateEggProductionLog(editingLogId, {
        date,
        farmId: currentFlock?.farmId || 'default',
        houseId: currentFlock?.houseId || 'default',
        flockId: currentFlock?.id || 'default',
        totalCollection,
        rejects,
        usableEggs,
        grades,
        eggsPerHen,
        hdp,
        collectorName: collectorName.trim(),
        notes: notes.trim(),
      });
    } else {
      addEggProductionLog({
        date,
        farmId: currentFlock?.farmId || 'default',
        houseId: currentFlock?.houseId || 'default',
        flockId: currentFlock?.id || 'default',
        totalCollection,
        rejects,
        usableEggs,
        grades,
        eggsPerHen,
        hdp,
        collectorName: collectorName.trim(),
        notes: notes.trim(),
      });
    }

    setShowLogModal(false);
    setEditingLogId(null);
    // Reset form
    setTotalCollection(0);
    setRejects(0);
    setGrades({
      peewee: 0,
      xs: 0,
      small: 0,
      medium: 0,
      large: 0,
      xl: 0,
      jumbo: 0,
      oversize: 0,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Egg className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Daily Egg Production Log
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total daily collected eggs, good eggs, and rejects with 8-tier grade distribution.
          </p>
        </div>

        <button
          onClick={handleOpenNewLog}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Daily Collection</span>
        </button>
      </div>

      {/* Aggregate Production Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Daily Collected</div>
          <div className="text-xl font-bold text-slate-900 font-heading mt-1">
            {formatNumber(totalProducedAllTime)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Gross daily count</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Good Eggs</div>
          <div className="text-xl font-bold text-emerald-700 font-heading mt-1">
            {formatNumber(totalUsableAllTime)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {Math.floor(totalUsableAllTime / 30)} trays
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Reject Eggs</div>
          <div className="text-xl font-bold text-rose-600 font-heading mt-1">
            {formatNumber(totalRejectsAllTime)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cracked / dirty / deform</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Average Lay Rate (HDP)</div>
          <div className="text-xl font-bold text-indigo-700 font-heading mt-1">
            {avgHdpAllTime.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Hen-Day Production</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500 font-medium">Recorded Log Days</div>
          <div className="text-xl font-bold text-slate-900 font-heading mt-1">
            {eggProductionLogs.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Collection days</div>
        </div>
      </div>

      {/* Production Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Egg Production Register ({eggProductionLogs.length})
          </h3>
          <span className="text-xs text-slate-500">Sorted by newest record</span>
        </div>

        {eggProductionLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Egg className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">Zero egg production logs recorded</p>
            <p className="mt-1 max-w-sm mx-auto text-slate-400">
              The system starts completely clean. Click "Record Daily Collection" to log today's egg harvest.
            </p>
            <button
              onClick={() => setShowLogModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record First Collection</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Flock / House</th>
                  <th className="p-3 text-right font-bold text-slate-900">Total Collected</th>
                  <th className="p-3 text-right font-bold text-emerald-800">Good Eggs</th>
                  <th className="p-3 text-right font-bold text-rose-600">Rejects</th>
                  <th className="p-3 text-right text-indigo-700 font-bold">HDP %</th>
                  <th className="p-3 text-right font-bold">Trays</th>
                  <th className="p-3 text-center">Grades</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {eggProductionLogs.map(log => {
                  const flock = flocks.find(f => f.id === log.flockId);
                  const house = houses.find(h => h.id === log.houseId);
                  const totalTrays = Math.floor(log.usableEggs / 30);
                  const loosePcs = log.usableEggs % 30;
                  const rejectCount =
                    log.rejects != null ? log.rejects : (log.brokenEggs || 0) + (log.dirtyEggs || 0);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">{log.date}</td>
                      <td className="p-3 text-slate-600">
                        <div>{flock?.batchId || 'Default Flock'}</div>
                        <div className="text-[10px] text-slate-400">{house?.name || 'Main House'}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {log.totalCollection}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {log.usableEggs}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">
                        {rejectCount}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700">
                        {log.hdp.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right font-mono text-slate-800">
                        {totalTrays}t {loosePcs > 0 ? `${loosePcs}p` : ''}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedLogForDetail(log)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => handleEditClick(log)}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => {
                                if (confirm(`Move egg production record for ${log.date} to trash?`)) {
                                  deleteEggProductionLog(log.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL: GRADES BREAKDOWN FOR SELECTED RECORD */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Egg Quality & Grade Distribution
                </h3>
                <p className="text-xs text-slate-500">Harvest Date: {selectedLogForDetail.date}</p>
              </div>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Harvest</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {selectedLogForDetail.totalCollection}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 block">Good Eggs</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {selectedLogForDetail.usableEggs}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-500 block">Rejects</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    {selectedLogForDetail.rejects != null
                      ? selectedLogForDetail.rejects
                      : (selectedLogForDetail.brokenEggs || 0) + (selectedLogForDetail.dirtyEggs || 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="font-semibold text-slate-700 block mb-1">Graded Breakdown:</span>
                {EGG_GRADES.map(grade => {
                  const count = selectedLogForDetail.grades?.[grade.key] || 0;
                  const pct = selectedLogForDetail.usableEggs > 0 ? (count / selectedLogForDetail.usableEggs) * 100 : 0;
                  return (
                    <div
                      key={grade.key}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{grade.label}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({grade.weightRange})</span>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        {count} pcs <span className="text-[10px] font-normal text-slate-400">({pct.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedLogForDetail.collectorName && (
                <div className="pt-2 text-slate-500 text-[11px]">
                  Collector: <span className="font-semibold text-slate-700">{selectedLogForDetail.collectorName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD DAILY EGG COLLECTION */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  {editingLogId ? 'Edit Daily Egg Production Record' : 'Record Daily Egg Collection'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingLogId
                    ? 'Update total collected eggs, good eggs, rejects, and grade sorting'
                    : 'Total collected eggs, good eggs, rejects, and grade sorting'}
                </p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
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

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Flock & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harvest Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Flock / Batch *</label>
                  <select
                    value={flockId}
                    onChange={e => setFlockId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  >
                    {flocks.length === 0 ? (
                      <option value="">No flocks yet (Creates unassigned)</option>
                    ) : (
                      flocks.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.batchId} ({f.currentPopulation} live birds)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Harvest & Quality: Total Daily Collected, Rejects, and Calculated Good Eggs */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">1. Daily Egg Harvest & Quality</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Total Daily Collected *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={totalCollection || ''}
                      onChange={e => setTotalCollection(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-base"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Total collected eggs</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-rose-700 mb-1">
                      Reject Eggs *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={rejects || ''}
                      onChange={e => setRejects(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg font-mono font-bold text-rose-600 text-base"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Cracked, dirty, soft, deform</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-emerald-800 mb-1">
                      Good Eggs (Usable)
                    </label>
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg font-mono font-bold text-emerald-800 text-base">
                      {usableEggs} eggs
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                      {trays} trays {loose > 0 ? `+ ${loose} pcs` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Egg Grading Distribution */}
              <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 block">2. Egg Grading Breakdown (Good Eggs)</span>
                  <button
                    type="button"
                    onClick={handleQuickDistribute}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold bg-white border border-emerald-300 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Auto-Estimate Distribution
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {EGG_GRADES.map(grade => (
                    <div key={grade.key} className="bg-white p-2 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-800">
                        {grade.label}
                      </label>
                      <span className="text-[10px] text-slate-400 block mb-1">{grade.weightRange}</span>
                      <input
                        type="number"
                        min="0"
                        value={grades[grade.key] || ''}
                        onChange={e => handleGradeChange(grade.key, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-900 text-right"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200">
                  <span className="text-slate-600">Sum of Graded Eggs:</span>
                  <span
                    className={`font-mono font-bold ${
                      sumGraded === usableEggs ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {sumGraded} / {usableEggs} eggs {sumGraded === usableEggs ? '✓ Balanced' : `(Diff: ${sumGraded - usableEggs})`}
                  </span>
                </div>
              </div>

              {/* Telemetry Summary */}
              <div className="grid grid-cols-3 gap-2 text-center p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Lay Rate (HDP)</span>
                  <span className="font-mono font-bold text-indigo-700">{hdp.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Eggs / Hen</span>
                  <span className="font-mono font-bold text-slate-800">{eggsPerHen.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Trays</span>
                  <span className="font-mono font-bold text-emerald-800">{trays} trays</span>
                </div>
              </div>

              {/* Collector & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Collector / Staff Name</label>
                  <input
                    type="text"
                    placeholder="Staff in-charge"
                    value={collectorName}
                    onChange={e => setCollectorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Weather, temperature..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingLogId ? 'Update Production Record' : 'Save Daily Production Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
