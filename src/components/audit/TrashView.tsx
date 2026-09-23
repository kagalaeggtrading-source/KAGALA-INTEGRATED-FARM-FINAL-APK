/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Egg,
  Bird,
  Wheat,
  Pill,
  Users,
  ShoppingCart,
  Receipt,
  CreditCard,
  TrendingDown,
  Landmark,
  Building,
} from 'lucide-react';
import { TrashEntityType, TrashItem } from '../../types';

interface TrashViewProps {
  onNavigate?: (tab: string) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ onNavigate }) => {
  const {
    trashItems,
    restoreFromTrash,
    permanentlyDeleteFromTrash,
    emptyTrash,
    restoreAllFromTrash,
  } = useFarm();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [confirmEmptyModal, setConfirmEmptyModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 4000);
  };

  const getEntityBadge = (type: TrashEntityType) => {
    switch (type) {
      case 'egg_production':
        return { label: 'Egg Production', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Egg };
      case 'flock':
      case 'flock_adjustment':
        return { label: type === 'flock' ? 'Flock' : 'Flock Adjustment', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Bird };
      case 'feed_item':
      case 'feed_purchase':
      case 'feed_consumption':
        return { label: 'Feed & Consumption', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Wheat };
      case 'supply_item':
      case 'supply_usage':
        return { label: 'Medicine / Supply', color: 'bg-teal-100 text-teal-800 border-teal-200', icon: Pill };
      case 'customer':
        return { label: 'Customer', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Users };
      case 'order':
        return { label: 'Order', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: ShoppingCart };
      case 'sale':
        return { label: 'Sales Invoice', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: Receipt };
      case 'payment':
        return { label: 'Payment Receipt', color: 'bg-violet-100 text-violet-800 border-violet-200', icon: CreditCard };
      case 'expense':
        return { label: 'Farm Expense', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: TrendingDown };
      case 'bank_account':
      case 'bank_deposit':
        return { label: 'Banking / Deposit', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Landmark };
      case 'farm':
      case 'house':
        return { label: 'Facility', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Building };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Trash2 };
    }
  };

  const filteredItems = useMemo(() => {
    return trashItems.filter(item => {
      const matchType = selectedType === 'all' || item.entityType === selectedType;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.originalId && item.originalId.toLowerCase().includes(q)) ||
        (item.recordDate && item.recordDate.toLowerCase().includes(q));

      return matchType && matchQuery;
    });
  }, [trashItems, selectedType, searchQuery]);

  const handleRestore = (id: string, title: string) => {
    restoreFromTrash(id);
    showFeedback(`Successfully restored: "${title}" back to active records.`);
  };

  const handleDeletePermanently = (id: string, title: string) => {
    if (confirm(`Permanently delete "${title}"? This action cannot be reversed.`)) {
      permanentlyDeleteFromTrash(id);
      showFeedback(`Permanently removed: "${title}" from trash.`);
    }
  };

  const handleRestoreAll = () => {
    if (trashItems.length === 0) return;
    if (confirm(`Restore all ${trashItems.length} deleted records back to active records?`)) {
      restoreAllFromTrash();
      showFeedback(`Successfully restored all ${trashItems.length} records.`);
    }
  };

  const handleEmptyTrash = () => {
    emptyTrash();
    setConfirmEmptyModal(false);
    showFeedback('Trash bin emptied successfully.');
  };

  // Group count by entity type
  const entityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: trashItems.length };
    trashItems.forEach(item => {
      counts[item.entityType] = (counts[item.entityType] || 0) + 1;
    });
    return counts;
  }, [trashItems]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Trash & Recycle Bin
            </h2>
            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full border border-rose-200">
              {trashItems.length} items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage deleted records: retrieve (restore) back to active logs or delete permanently.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {trashItems.length > 0 && (
            <>
              <button
                onClick={handleRestoreAll}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Restore all items currently in trash"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retrieve All ({trashItems.length})</span>
              </button>

              <button
                onClick={() => setConfirmEmptyModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Permanently remove all items in trash"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Action Feedback Notification */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search deleted records by title, ID, date..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            Showing {filteredItems.length} of {trashItems.length} items
          </div>
        </div>

        {/* Entity Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs custom-scrollbar">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
              selectedType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items ({entityCounts.all || 0})
          </button>

          {Object.entries({
            egg_production: 'Egg Production',
            flock: 'Flocks',
            flock_adjustment: 'Flock Adjustments',
            feed_item: 'Feed Inventory',
            feed_consumption: 'Feed Usage',
            feed_purchase: 'Feed Purchases',
            supply_item: 'Supplies',
            supply_usage: 'Supply Usage',
            customer: 'Customers',
            order: 'Orders',
            sale: 'Sales Invoices',
            payment: 'Payments',
            expense: 'Expenses',
            bank_account: 'Bank Accounts',
            bank_deposit: 'Bank Deposits',
            farm: 'Farms',
            house: 'Houses',
          }).map(([key, label]) => {
            const count = entityCounts[key] || 0;
            if (count === 0 && selectedType !== key) return null;

            return (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`px-2.5 py-1.5 rounded-lg font-medium shrink-0 cursor-pointer transition-colors ${
                  selectedType === key
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Trash Items List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 text-sm">
              {trashItems.length === 0 ? 'Trash Bin is Empty' : 'No matching deleted records'}
            </p>
            <p className="mt-1 max-w-sm mx-auto text-slate-400">
              {trashItems.length === 0
                ? 'Any log or record deleted across the farm system will safely be moved here first, giving you full control to retrieve or permanently purge.'
                : 'Try adjusting your search query or entity category filter above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Record Details</th>
                  <th className="p-3">Record Date</th>
                  <th className="p-3">Deleted On</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredItems.map(item => {
                  const badge = getEntityBadge(item.entityType);
                  const Icon = badge.icon;
                  const deletedDate = new Date(item.deletedAt);
                  const formattedDeletedAt = deletedDate.toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-slate-500 text-[11px] mt-0.5">{item.subtitle}</div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {item.originalId}
                        </div>
                      </td>

                      <td className="p-3 text-slate-600">
                        {item.recordDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{item.recordDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="p-3 text-slate-500 text-[11px]">
                        {formattedDeletedAt}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRestore(item.id, item.title)}
                            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer border border-emerald-200"
                            title="Retrieve this record back to active records"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retrieve</span>
                          </button>

                          <button
                            onClick={() => handleDeletePermanently(item.id, item.title)}
                            className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer border border-rose-200"
                            title="Permanently remove this record forever"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Permanently</span>
                          </button>
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

      {/* Confirmation Modal for Empty Trash */}
      {confirmEmptyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-heading font-bold text-base text-slate-900">
                Empty Entire Trash Bin?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete all <strong className="text-slate-900">{trashItems.length} records</strong> currently in the trash bin. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmEmptyModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Yes, Empty Trash Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
