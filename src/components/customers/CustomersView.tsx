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
  Eye,
  Edit2,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { formatCurrency } from '../../constants';
import { Customer, CustomerType } from '../../types';

export const CustomersView: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    sales,
    payments,
    currentRole,
    hasPermission,
  } = useFarm();

  const canEdit = currentRole === 'admin' || currentRole === 'manager' || hasPermission('canManageSystem');

  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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

  // Requirement 2: Dynamically sort customers from highest lifetime purchase amount to lowest
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => filterType === 'all' || c.customerType.toLowerCase() === filterType.toLowerCase())
      .sort((a, b) => {
        const purchasesA = getCustomerMetrics(a.id).totalPurchases;
        const purchasesB = getCustomerMetrics(b.id).totalPurchases;
        return purchasesB - purchasesA;
      });
  }, [customers, filterType, sales]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setBusinessName('');
    setContactNumber('');
    setAddress('');
    setCustomerType('Wholesale');
    setPriceLevel('Standard');
    setCreditLimit(0);
    setCreditTermsDays(0);
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setBusinessName(cust.businessName || '');
    setContactNumber(cust.contactNumber || '');
    setAddress(cust.address || '');
    setCustomerType(cust.customerType || 'Wholesale');
    setPriceLevel(cust.priceLevel || 'Standard');
    setCreditTermsDays(cust.creditTermsDays || 0);
    setCreditLimit(cust.creditLimit || 0);
    setNotes(cust.notes || '');
    setShowAddModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
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
    } else {
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
    }

    setShowAddModal(false);
    setEditingCustomer(null);
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
          onClick={handleOpenAddModal}
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
          <div className="text-xs text-slate-500 font-medium">Total Receivables (A/R)</div>
          <div className="text-2xl font-bold text-rose-600 font-heading mt-1">
            {formatCurrency(totalReceivables)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Outstanding customer debt</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Lifetime Revenue Billed</div>
          <div className="text-2xl font-bold text-emerald-700 font-heading mt-1">
            {formatCurrency(totalSalesAll)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all issued invoices</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Overdue / Credit Risk</div>
          <div className="text-2xl font-bold text-slate-800 font-heading mt-1">
            {customers.filter(c => getCustomerMetrics(c.id).outstandingBalance > 0).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Accounts with open balance</div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-heading font-bold text-sm text-slate-900">
            Customer Directory & Credit Terms ({filteredCustomers.length})
          </h3>

          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {['all', 'Wholesale', 'Retail', 'Suki/Regular', 'Reseller', 'Restaurant', 'Store'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filterType.toLowerCase() === type.toLowerCase()
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'all' ? 'All Buyers' : type}
              </button>
            ))}
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No customer profiles found</p>
            <p className="mt-1 text-slate-400 max-w-sm mx-auto">
              Register buyers, wholesale stores, and suki customers to track sales invoices and credit balances.
            </p>
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
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="View Statement of Account"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Customer Button (Admin/Manager only) */}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(cust)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Edit Customer Profile"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => {
                                if (confirm(`Move customer ${cust.name} to trash?`)) {
                                  deleteCustomer(cust.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-heading font-bold text-sm">
                  {editingCustomer ? `Edit Customer Profile (${editingCustomer.customerCode})` : 'Register New Customer Account'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCustomer(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store / Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Santos Egg Trading"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="0917XXXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Category</label>
                  <select
                    value={customerType}
                    onChange={e => setCustomerType(e.target.value as CustomerType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Wholesale">Wholesale</option>
                    <option value="Retail">Retail</option>
                    <option value="Suki/Regular">Suki / Regular</option>
                    <option value="Reseller">Reseller</option>
                    <option value="Restaurant">Restaurant / Bakery</option>
                    <option value="Store">Grocery / Store</option>
                    <option value="Delivery customer">Delivery Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price Level tier</label>
                  <select
                    value={priceLevel}
                    onChange={e => setPriceLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Standard">Standard Retail</option>
                    <option value="Wholesale">Wholesale Tier</option>
                    <option value="Special Suki">Special Suki Discount</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={creditTermsDays}
                    onChange={e => setCreditTermsDays(parseInt(e.target.value) || 0)}
                    placeholder="0 for COD"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₱)</label>
                  <input
                    type="number"
                    min="0"
                    value={creditLimit}
                    onChange={e => setCreditLimit(parseFloat(e.target.value) || 0)}
                    placeholder="0 for unlimited"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Street, Barangay, City/Town"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Notes / Internal Remarks</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Special delivery instructions, preferred sizes..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCustomer ? 'Update Customer' : 'Save Customer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Statement Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedCustomer.customerCode} • {selectedCustomer.customerType} Account
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs custom-scrollbar">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px]">Contact:</span>
                  <p className="font-bold text-slate-900">{selectedCustomer.contactNumber || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Address:</span>
                  <p className="font-bold text-slate-900 truncate">{selectedCustomer.address || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Outstanding Balance:</span>
                  <p className="font-bold text-rose-700 text-sm">
                    {formatCurrency(getCustomerMetrics(selectedCustomer.id).outstandingBalance)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-heading font-bold text-slate-800 mb-2">Invoice History</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2">Invoice #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 text-right">Paid</th>
                        <th className="p-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sales
                        .filter(s => s.customerId === selectedCustomer.id)
                        .map(s => (
                          <tr key={s.id}>
                            <td className="p-2 font-mono font-semibold text-slate-900">{s.saleNumber}</td>
                            <td className="p-2 text-slate-600">{s.date}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(s.total)}</td>
                            <td className="p-2 text-right font-mono text-emerald-700">{formatCurrency(s.paidAmount)}</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-600">{formatCurrency(s.balance)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
