/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Landmark,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  AlertCircle,
  FileText,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '../../constants';
import { BankAccount, BankDeposit, DepositType } from '../../types';

export const BankingView: React.FC = () => {
  const {
    cashOnHand,
    bankAccounts,
    addBankAccount,
    deleteBankAccount,
    bankDeposits,
    recordBankDeposit,
    payments,
    expenses,
  } = useFarm();

  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // New Account State
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newMaskedNumber, setNewMaskedNumber] = useState('');
  const [newOpeningBalance, setNewOpeningBalance] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');

  // Deposit Form State
  const [targetBankId, setTargetBankId] = useState(bankAccounts[0]?.id || '');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositType, setDepositType] = useState<DepositType>('Cash Deposit');
  const [sourceAccount, setSourceAccount] = useState<BankDeposit['sourceAccount']>('Cash on Hand');
  const [depositSlipNumber, setDepositSlipNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [depositedBy, setDepositedBy] = useState('');
  const [depositNotes, setDepositNotes] = useState('');

  // Computed Financial Totals
  const totalBankBalance = bankAccounts.reduce((s, b) => s + b.currentBalance, 0);
  const totalFarmLiquidity = cashOnHand + totalBankBalance;

  const totalCashCollected = payments
    .filter(p => p.accountReceivedInto === 'cash_on_hand')
    .reduce((s, p) => s + p.amount, 0);

  const totalCashExpenses = expenses
    .filter(e => e.paymentAccount === 'cash_on_hand')
    .reduce((s, e) => s + e.amount, 0);

  const totalDepositedFromCash = bankDeposits
    .filter(d => d.sourceAccount === 'Cash on Hand')
    .reduce((s, d) => s + d.amount, 0);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccountName.trim()) return;

    addBankAccount(
      newBankName.trim(),
      newAccountName.trim(),
      newMaskedNumber.trim() || '****-****',
      Number(newOpeningBalance) || 0,
      newNotes.trim() || undefined
    );

    setShowAddAccountModal(false);
    setNewBankName('');
    setNewAccountName('');
    setNewMaskedNumber('');
    setNewOpeningBalance(0);
    setNewNotes('');
  };

  const handleRecordDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const bank = bankAccounts.find(b => b.id === targetBankId) || bankAccounts[0];
    if (!bank) {
      alert('Please add a farm bank account first.');
      return;
    }

    if (depositAmount <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    if (sourceAccount === 'Cash on Hand' && depositAmount > cashOnHand) {
      alert(
        `Insufficient Cash on Hand! Current Cash on Hand is ₱${cashOnHand.toLocaleString()}, but trying to deposit ₱${depositAmount.toLocaleString()}.`
      );
      return;
    }

    recordBankDeposit({
      depositDate,
      bankAccountId: bank.id,
      bankName: bank.bankName,
      amount: depositAmount,
      depositType,
      sourceAccount,
      depositSlipNumber: depositSlipNumber.trim() || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
      branch: branch.trim() || undefined,
      depositedBy: depositedBy.trim() || undefined,
      notes: depositNotes.trim() || undefined,
    });

    setShowDepositModal(false);
    setDepositAmount(0);
    setDepositSlipNumber('');
    setReferenceNumber('');
    setBranch('');
    setDepositedBy('');
    setDepositNotes('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Banking, Vault & Liquidity Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enforces strict financial segregation: A bank deposit is an internal transfer of cash, NOT farm revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddAccountModal(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Bank Account</span>
          </button>

          <button
            onClick={() => {
              if (bankAccounts.length === 0) {
                alert('Please add a bank account first.');
                return;
              }
              setTargetBankId(bankAccounts[0].id);
              setShowDepositModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Record Bank Deposit</span>
          </button>
        </div>
      </div>

      {/* Aggregate Liquidity Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Farm Liquidity</div>
          <div className="text-2xl font-bold text-slate-900 font-heading mt-1">
            {formatCurrency(totalFarmLiquidity)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cash in Vault + All Bank Balances</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Cash on Hand (Vault / Register)</div>
          <div
            className={`text-2xl font-bold font-heading mt-1 ${
              cashOnHand < 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {formatCurrency(cashOnHand)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Physical un-deposited currency</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Bank Deposits</div>
          <div className="text-2xl font-bold text-indigo-700 font-heading mt-1">
            {formatCurrency(totalBankBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across {bankAccounts.length} bank accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Deposited to Date</div>
          <div className="text-2xl font-bold text-slate-800 font-heading mt-1">
            {formatCurrency(totalDepositedFromCash)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {bankDeposits.length} recorded bank deposit slips
          </div>
        </div>
      </div>

      {/* Strict Financial Rule Advisory */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
        <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Accounting Rule Enforced: </span>
          <span>
            Recording a bank deposit transfers funds from <strong>Cash on Hand</strong> to the designated{' '}
            <strong>Bank Account</strong>. It will NEVER be counted twice as egg sales revenue. Total farm revenue is
            strictly derived from Customer Sales & Collections.
          </span>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Registered Farm Bank Accounts ({bankAccounts.length})
          </h3>
          <span className="text-xs text-slate-500">Live reconciled balances</span>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400 shadow-2xs">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No bank accounts registered</p>
            <p className="mt-1 text-slate-400 max-w-sm mx-auto">
              Add your BDO, BPI, Landbank, or Metrobank accounts to record daily cash deposits and direct bank transfers.
            </p>
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Farm Bank Account</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {bankAccounts.map(account => (
              <div
                key={account.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">
                        Commercial Depository
                      </span>
                      <h4 className="font-heading font-bold text-base text-slate-900">
                        {account.bankName}
                      </h4>
                      <p className="text-xs text-slate-500">{account.accountName}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete account ${account.bankName}?`)) {
                          deleteBankAccount(account.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 font-mono text-xs text-slate-600">
                    Account: {account.maskedAccountNumber}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Balance</span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {formatCurrency(account.currentBalance)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Opening: {formatCurrency(account.openingBalance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank Deposits Journal */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Bank Deposits & Liquidity Movements Journal ({bankDeposits.length})
          </h3>
          <span className="text-xs text-slate-500">Official deposit slip archive</span>
        </div>

        {bankDeposits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No bank deposits logged</p>
            <p className="mt-1 text-slate-400 max-w-sm mx-auto">
              When sales cash is transferred from the farm safe to the bank, record the deposit slip here to balance the books.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Deposit #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Destination Bank</th>
                  <th className="p-3">Deposit Type</th>
                  <th className="p-3">Source Account</th>
                  <th className="p-3">Deposit Slip #</th>
                  <th className="p-3 text-right font-bold text-slate-900">Amount (₱)</th>
                  <th className="p-3">Deposited By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bankDeposits.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-900">{d.depositNumber}</td>
                    <td className="p-3 text-slate-600">{d.depositDate}</td>
                    <td className="p-3 font-semibold text-slate-900">{d.bankName}</td>
                    <td className="p-3">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                        {d.depositType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{d.sourceAccount}</td>
                    <td className="p-3 font-mono text-slate-500">{d.depositSlipNumber || '—'}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="p-3 text-slate-600">{d.depositedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD BANK ACCOUNT */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Register Farm Bank Account
              </h3>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BDO Unibank, BPI, Landbank"
                  value={newBankName}
                  onChange={e => setNewBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Holder / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kagala Integrated Farm"
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Number (Masked)</label>
                  <input
                    type="text"
                    placeholder="e.g. ****-4921"
                    value={newMaskedNumber}
                    onChange={e => setNewMaskedNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Balance (₱)</label>
                  <input
                    type="number"
                    min="0"
                    value={newOpeningBalance}
                    onChange={e => setNewOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD BANK DEPOSIT */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Record Bank Deposit Slip
              </h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordDeposit} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Available Cash on Hand:</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {formatCurrency(cashOnHand)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Bank *</label>
                  <select
                    value={targetBankId}
                    onChange={e => setTargetBankId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-semibold"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} ({b.maskedAccountNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deposit Date *</label>
                  <input
                    type="date"
                    required
                    value={depositDate}
                    onChange={e => setDepositDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount to Deposit (₱) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={depositAmount}
                    onChange={e => setDepositAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deposit Type</label>
                  <select
                    value={depositType}
                    onChange={e => setDepositType(e.target.value as DepositType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="Check Deposit">Check Deposit</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Slip / Ref Number</label>
                  <input
                    type="text"
                    placeholder="DS-10042"
                    value={depositSlipNumber}
                    onChange={e => setDepositSlipNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deposited By (Staff)</label>
                  <input
                    type="text"
                    placeholder="e.g. Juan De La Cruz"
                    value={depositedBy}
                    onChange={e => setDepositedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Branch</label>
                <input
                  type="text"
                  placeholder="e.g. Caramoan Branch"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Bank Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
