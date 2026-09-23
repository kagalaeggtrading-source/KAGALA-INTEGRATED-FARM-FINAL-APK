/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Users,
  PlusCircle,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Eye,
  Trash2,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';
import { formatCurrency } from '../../constants';
import { Customer, CustomerType } from '../../types';

export const CustomersView: React.FC = () => {
  const {
    customers,
    addCustomer,
    deleteCustomer,
    sales,
    payments,
  } = useFarm();

  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Wholesale');
  const [priceLevel, setPriceLevel] = useState('Standard');
  const [creditTermsDays, setCreditTermsDays] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Helper calculation for customer balances
  const getCustomerMetrics = (customerId: string) => {
    const custSales = sales.filter(s => s.customerId === customerId);
    const totalPurchases = custSales.reduce((sum, s) => sum + s.total, 0);
    const outstandingBalance = custSales.reduce((sum, s) => sum + s.balance, 0);
    const custPayments = payments.filter(p => p.customerId === customerId);
    const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);

    return { totalPurchases, outstandingBalance, totalPaid, countOrders: custSales.length };
  };

  const totalReceivables = customers.reduce((sum, c) => {
    return sum + getCustomerMetrics(c.id).outstandingBalance;
  }, 0);

  const totalSalesAll = sales.reduce((sum, s) => sum + s.total, 0);

  const filteredCustomers = customers.filter(
    c => filterType === 'all' || c.customerType.toLowerCase() === filterType.toLowerCase()
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const customerCode = 'CUST-' + (customers.length + 1).toString().padStart(3, '0');

    addCustomer({
      customerCode,
      name: name.trim(),
      businessName: businessName.trim() || undefined,
      contactNumber: contactNumber.trim(),
      address: address.trim(),
      customerType,
      priceLevel,
      creditTermsDays: Number(creditTermsDays) || 0,
      creditLimit: Number(creditLimit) || 0,
      notes: notes.trim() || undefined,
    });

    setShowAddModal(false);
    setName('');
    setBusinessName('');
    setContactNumber('');
    setAddress('');
    setCreditLimit(0);
    setCreditTermsDays(0);
    setNotes('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Customer Management & Accounts Receivable
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Directory of buyers, wholesale outlets, credit terms, and real-time ledger tracking.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Aggregate Receivables Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Registered Buyers</div>
          <div className="text-2xl font-bold text-slate-900 font-heading mt-1">
            {customers.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active retail & suki accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Accounts Receivable</div>
          <div className="text-2xl font-bold text-rose-600 font-heading mt-1">
            {formatCurrency(totalReceivables)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Uncollected credit balances</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Cumulative Gross Sales</div>
          <div className="text-2xl font-bold text-emerald-700 font-heading mt-1">
            {formatCurrency(totalSalesAll)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all client accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Credit Customers</div>
          <div className="text-2xl font-bold text-amber-700 font-heading mt-1">
            {customers.filter(c => c.creditTermsDays > 0).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Approved term accounts</div>
        </div>
      </div>

      {/* Customer Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'Wholesale', 'Retail', 'Suki/Regular', 'Restaurant', 'Store', 'Reseller'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
              filterType.toLowerCase() === t.toLowerCase()
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Customer Directory ({filteredCustomers.length})
          </h3>
          <span className="text-xs text-slate-500">Live updated balances</span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No customer accounts registered</p>
            <p className="mt-1 text-slate-400 max-w-sm mx-auto">
              Add your egg wholesalers, bakery clients, market vendors, and suki buyers to track deliveries and credit.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register First Buyer</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Customer / Business</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Contact & Address</th>
                  <th className="p-3">Terms & Limit</th>
                  <th className="p-3 text-right">Total Purchases</th>
                  <th className="p-3 text-right font-bold text-rose-600">Receivable Balance</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCustomers.map(cust => {
                  const metrics = getCustomerMetrics(cust.id);
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm font-heading">{cust.name}</div>
                        {cust.businessName && (
                          <div className="text-[11px] text-slate-500">{cust.businessName}</div>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">{cust.customerCode}</span>
                      </td>

                      <td className="p-3">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                          {cust.customerType}
                        </span>
                      </td>

                      <td className="p-3 space-y-0.5 text-slate-600">
                        {cust.contactNumber && (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.contactNumber}</span>
                          </div>
                        )}
                        {cust.address && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 max-w-xs truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{cust.address}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="text-slate-800 font-semibold">
                          {cust.creditTermsDays === 0 ? 'Cash on Delivery (COD)' : `${cust.creditTermsDays} Days Term`}
                        </div>
                        {cust.creditLimit > 0 && (
                          <div className="text-[11px] text-slate-400">
                            Limit: {formatCurrency(cust.creditLimit)}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(metrics.totalPurchases)}
                        <span className="text-[10px] text-slate-400 block">{metrics.countOrders} orders</span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-sm">
                        <span
                          className={
                            metrics.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                          }
                        >
                          {formatCurrency(metrics.outstandingBalance)}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="View Statement of Account"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete customer ${cust.name}?`)) {
                                deleteCustomer(cust.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* MODAL: REGISTER CUSTOMER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Register Customer Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer / Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business / Store Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Santos Egg Wholesaler"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Type</label>
                  <select
                    value={customerType}
                    onChange={e => setCustomerType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Wholesale">Wholesale Outlet</option>
                    <option value="Retail">Retail Walk-in</option>
                    <option value="Suki/Regular">Suki / Regular</option>
                    <option value="Restaurant">Restaurant / Bakery</option>
                    <option value="Store">Sari-Sari Store / Supermarket</option>
                    <option value="Reseller">Reseller / Dealer</option>
                    <option value="Delivery customer">Delivery Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="0917-000-0000"
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery / Physical Address</label>
                <input
                  type="text"
                  placeholder="Market stall #, Street, City"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for COD"
                    value={creditTermsDays}
                    onChange={e => setCreditTermsDays(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">0 = Cash on delivery</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₱)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Unlimited / COD"
                    value={creditLimit}
                    onChange={e => setCreditLimit(parseFloat(e.target.value) || 0)}
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Register Buyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER STATEMENT OF ACCOUNT */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {selectedCustomer.customerCode}
                </span>
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  {selectedCustomer.name}
                </h3>
                {selectedCustomer.businessName && (
                  <p className="text-xs text-slate-500">{selectedCustomer.businessName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Summary Metrics */}
              {(() => {
                const metrics = getCustomerMetrics(selectedCustomer.id);
                const custSales = sales.filter(s => s.customerId === selectedCustomer.id);
                const custPayments = payments.filter(p => p.customerId === selectedCustomer.id);

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[10px] block">Total Invoiced</span>
                        <span className="text-base font-bold font-mono text-slate-800">
                          {formatCurrency(metrics.totalPurchases)}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-emerald-700 text-[10px] block">Total Remitted</span>
                        <span className="text-base font-bold font-mono text-emerald-800">
                          {formatCurrency(metrics.totalPaid)}
                        </span>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                        <span className="text-rose-700 text-[10px] block">Current Balance Due</span>
                        <span className="text-base font-bold font-mono text-rose-700">
                          {formatCurrency(metrics.outstandingBalance)}
                        </span>
                      </div>
                    </div>

                    {/* Invoices List */}
                    <div className="mt-4">
                      <h4 className="font-heading font-bold text-xs text-slate-800 mb-2">
                        Sales Invoices & Deliveries ({custSales.length})
                      </h4>
                      {custSales.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 border border-dashed rounded-lg">
                          No sales recorded for this customer yet.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                              <tr>
                                <th className="p-2">Invoice #</th>
                                <th className="p-2">Date</th>
                                <th className="p-2 text-right">Total (₱)</th>
                                <th className="p-2 text-right">Paid (₱)</th>
                                <th className="p-2 text-right font-bold text-rose-600">Balance</th>
                                <th className="p-2 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {custSales.map(s => (
                                <tr key={s.id}>
                                  <td className="p-2 font-mono font-bold text-slate-800">{s.saleNumber}</td>
                                  <td className="p-2 text-slate-600">{s.date}</td>
                                  <td className="p-2 text-right font-mono">{formatCurrency(s.total)}</td>
                                  <td className="p-2 text-right font-mono text-emerald-700">{formatCurrency(s.paidAmount)}</td>
                                  <td className="p-2 text-right font-mono font-bold text-rose-600">{formatCurrency(s.balance)}</td>
                                  <td className="p-2 text-center">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100">
                                      {s.paymentStatus}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Payments List */}
                    <div className="mt-4">
                      <h4 className="font-heading font-bold text-xs text-slate-800 mb-2">
                        Payment Remittances ({custPayments.length})
                      </h4>
                      {custPayments.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 border border-dashed rounded-lg">
                          No payments recorded yet.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                              <tr>
                                <th className="p-2">OR / Payment #</th>
                                <th className="p-2">Date</th>
                                <th className="p-2">Method</th>
                                <th className="p-2">Account</th>
                                <th className="p-2 text-right font-bold text-emerald-700">Amount (₱)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {custPayments.map(p => (
                                <tr key={p.id}>
                                  <td className="p-2 font-mono font-bold text-slate-800">{p.paymentNumber}</td>
                                  <td className="p-2 text-slate-600">{p.paymentDate}</td>
                                  <td className="p-2">{p.paymentMethod}</td>
                                  <td className="p-2 text-slate-600">
                                    {p.accountReceivedInto === 'cash_on_hand' ? 'Cash on Hand' : 'Bank Account'}
                                  </td>
                                  <td className="p-2 text-right font-mono font-bold text-emerald-700">
                                    {formatCurrency(p.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
