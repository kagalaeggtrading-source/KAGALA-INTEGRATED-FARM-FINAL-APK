/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  CreditCard,
  PlusCircle,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Tag,
  DollarSign,
  FileText,
  Trash2,
} from 'lucide-react';
import { EXPENSE_CATEGORIES, formatCurrency, formatNumber } from '../../constants';
import { ExpenseCategory, FarmExpense } from '../../types';

export const ExpenseView: React.FC = () => {
  const {
    expenses,
    addExpense,
    deleteExpense,
    cashOnHand,
    bankAccounts,
  } = useFarm();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Labor & Salaries');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentAccount, setPaymentAccount] = useState<'cash_on_hand' | 'bank_account'>('cash_on_hand');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [supplierPayee, setSupplierPayee] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Aggregations
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalFeedExpenses = expenses
    .filter(e => e.category === 'Feed')
    .reduce((s, e) => s + e.amount, 0);
  const totalLaborExpenses = expenses
    .filter(e => e.category === 'Labor & Salaries')
    .reduce((s, e) => s + e.amount, 0);
  const totalUtilitiesExpenses = expenses
    .filter(e => e.category === 'Water' || e.category === 'Electricity')
    .reduce((s, e) => s + e.amount, 0);

  const filteredExpenses = expenses.filter(
    e => activeFilter === 'all' || e.category.toLowerCase() === activeFilter.toLowerCase()
  );

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    if (paymentAccount === 'cash_on_hand' && amount > cashOnHand) {
      if (
        !confirm(
          `Warning: Cash on Hand is ₱${cashOnHand.toLocaleString()}, but expense is ₱${amount.toLocaleString()}. Proceeding will result in a negative cash drawer. Continue?`
        )
      ) {
        return;
      }
    }

    addExpense({
      date,
      category,
      description: description.trim(),
      amount,
      paymentAccount,
      bankAccountId: paymentAccount === 'bank_account' ? bankAccountId : undefined,
      supplierPayee: supplierPayee.trim() || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setShowAddModal(false);
    setDescription('');
    setAmount(0);
    setSupplierPayee('');
    setReferenceNumber('');
    setNotes('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Operational Expenses & Farm Disbursements
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track farm operating expenditures with strict account attribution (Cash on Hand vs. Specific Bank Account).
          </p>
        </div>

        <button
          onClick={() => {
            if (bankAccounts.length > 0 && !bankAccountId) {
              setBankAccountId(bankAccounts[0].id);
            }
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Farm Expense</span>
        </button>
      </div>

      {/* Aggregate Expense Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Farm Disbursements</div>
          <div className="text-2xl font-bold text-slate-900 font-heading mt-1">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{expenses.length} voucher records</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Labor & Staff Salaries</div>
          <div className="text-2xl font-bold text-slate-800 font-heading mt-1">
            {formatCurrency(totalLaborExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Farm workers & management</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Utilities (Power & Water)</div>
          <div className="text-2xl font-bold text-slate-800 font-heading mt-1">
            {formatCurrency(totalUtilitiesExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Electricity, water pumps & lights</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Direct Feed Purchases</div>
          <div className="text-2xl font-bold text-amber-700 font-heading mt-1">
            {formatCurrency(totalFeedExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Feed stock disbursement</div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Categories
        </button>

        {EXPENSE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
              activeFilter.toLowerCase() === cat.toLowerCase()
                ? 'bg-slate-900 text-white'
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
                        <button
                          onClick={() => {
                            if (confirm(`Delete expense ${exp.expenseNumber}?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete Expense"
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

      {/* MODAL: RECORD EXPENSE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Record Farm Operating Expense
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Caretaker salary for 1st half of month"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₱) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid From Account *</label>
                  <select
                    value={paymentAccount}
                    onChange={e => setPaymentAccount(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="cash_on_hand">Cash on Hand (Vault)</option>
                    <option value="bank_account">Bank Account</option>
                  </select>
                </div>
              </div>

              {paymentAccount === 'bank_account' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Bank Account *</label>
                  <select
                    value={bankAccountId}
                    onChange={e => setBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} ({b.maskedAccountNumber}) - Bal: {formatCurrency(b.currentBalance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. Caramoan Agri Supply"
                    value={supplierPayee}
                    onChange={e => setSupplierPayee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Receipt / Ref #</label>
                  <input
                    type="text"
                    placeholder="OR-99120"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Record Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
