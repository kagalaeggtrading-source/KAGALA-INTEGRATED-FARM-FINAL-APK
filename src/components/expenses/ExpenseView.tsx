/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  TrendingDown,
  PlusCircle,
  FileText,
  Calendar,
  CreditCard,
  Building,
  DollarSign,
  Trash2,
  Edit2,
  X,
  Save,
} from 'lucide-react';
import { formatCurrency, EXPENSE_CATEGORIES } from '../../constants';
import { ExpenseCategory, FarmExpense } from '../../types';

export const ExpenseView: React.FC = () => {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    bankAccounts,
    cashOnHand,
    currentRole,
    hasPermission,
  } = useFarm();

  const canEdit = currentRole === 'admin' || currentRole === 'manager' || hasPermission('canLogExpenses');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FarmExpense | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Feed');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentAccount, setPaymentAccount] = useState<'cash_on_hand' | 'bank_account'>('cash_on_hand');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [supplierPayee, setSupplierPayee] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(
    e => selectedCategory === 'all' || e.category === selectedCategory
  );

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Feed');
    setDescription('');
    setAmount(0);
    setPaymentAccount('cash_on_hand');
    setSupplierPayee('');
    setReferenceNumber('');
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (exp: FarmExpense) => {
    setEditingExpense(exp);
    setDate(exp.date);
    setCategory(exp.category);
    setDescription(exp.description);
    setAmount(exp.amount);
    setPaymentAccount(exp.paymentAccount);
    setBankAccountId(exp.bankAccountId || bankAccounts[0]?.id || '');
    setSupplierPayee(exp.supplierPayee || '');
    setReferenceNumber(exp.referenceNumber || '');
    setNotes(exp.notes || '');
    setShowAddModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        date,
        category,
        description: description.trim(),
        amount: Number(amount) || 0,
        paymentAccount,
        bankAccountId: paymentAccount === 'bank_account' ? bankAccountId : undefined,
        supplierPayee: supplierPayee.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addExpense({
        date,
        category,
        description: description.trim(),
        amount: Number(amount) || 0,
        paymentAccount,
        bankAccountId: paymentAccount === 'bank_account' ? bankAccountId : undefined,
        supplierPayee: supplierPayee.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setShowAddModal(false);
    setEditingExpense(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Farm Expense Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track farm operating expenditures with strict account attribution (Cash on Hand vs. Specific Bank Account).
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Expense Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Expenditures ({formatCurrency(totalExpenseAmount)})
        </button>

        {EXPENSE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expenses Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Expenses Master Journal ({filteredExpenses.length})
          </h3>
          <span className="text-xs text-slate-500">Live operational ledger</span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No expense records found</p>
            <p className="mt-1 text-slate-400 max-w-sm mx-auto">
              Record labor payments, medication, egg trays, electric bills, and farm maintenance to track cost of production.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Voucher #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description & Payee</th>
                  <th className="p-3">Disbursed From</th>
                  <th className="p-3">Reference / Receipt</th>
                  <th className="p-3 text-right font-bold text-slate-900">Amount (₱)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpenses.map(exp => {
                  const bank = bankAccounts.find(b => b.id === exp.bankAccountId);
                  const accountLabel =
                    exp.paymentAccount === 'cash_on_hand'
                      ? 'Cash on Hand (Vault)'
                      : `Bank: ${bank?.bankName || 'Default Bank'}`;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">{exp.expenseNumber}</td>
                      <td className="p-3 text-slate-600">{exp.date}</td>
                      <td className="p-3">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{exp.description}</div>
                        {exp.supplierPayee && (
                          <div className="text-[11px] text-slate-400">Payee: {exp.supplierPayee}</div>
                        )}
                      </td>
                      <td className="p-3 text-slate-700">{accountLabel}</td>
                      <td className="p-3 font-mono text-slate-500">{exp.referenceNumber || '—'}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-700 text-sm">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(exp)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Edit Expense Record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete expense ${exp.expenseNumber}?`)) {
                                  deleteExpense(exp.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Expense"
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

      {/* MODAL: RECORD / EDIT EXPENSE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                {editingExpense ? `Edit Expense Record (${editingExpense.expenseNumber})` : 'Record Farm Operating Expense'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingExpense(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs pt-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Expense Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Particulars *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. 10 bundles egg trays, electricity bill"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Disbursed From Account</label>
                <select
                  value={paymentAccount}
                  onChange={e => setPaymentAccount(e.target.value as 'cash_on_hand' | 'bank_account')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="cash_on_hand">Cash on Hand (Vault)</option>
                  {bankAccounts.length > 0 && <option value="bank_account">Bank Account Transfer / Check</option>}
                </select>
              </div>

              {paymentAccount === 'bank_account' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Bank Account</label>
                  <select
                    value={bankAccountId}
                    onChange={e => setBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountName} ({formatCurrency(b.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Supplier / Payee</label>
                <input
                  type="text"
                  value={supplierPayee}
                  onChange={e => setSupplierPayee(e.target.value)}
                  placeholder="Vendor name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-mono">
                  Receipt / Voucher Ref Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="OR / Ref #"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingExpense ? 'Update Expense' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
