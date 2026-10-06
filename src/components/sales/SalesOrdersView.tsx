/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  ShoppingBag,
  PlusCircle,
  CheckCircle2,
  Truck,
  Printer,
  XCircle,
  Eye,
  Receipt,
  CreditCard,
  ShoppingCart,
  Users,
  Search,
  Check,
  AlertTriangle,
  ArrowRight,
  Download,
  Trash2,
  Edit2,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../constants';
import {
  CustomerPayment,
  FarmOrder,
  FarmSale,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  SaleItem,
} from '../../types';

interface SalesOrdersViewProps {
  initialTab?: 'orders' | 'sales' | 'payments';
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({ initialTab = 'orders' }) => {
  const {
    orders,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    sales,
    addSale,
    updateSale,
    deleteSale,
    payments,
    addPayment,
    updatePaymentRemittance,
    deletePaymentRemittance,
    customers,
    eggStockSummary,
    bankAccounts,
    profile,
    currentRole,
    hasPermission,
  } = useFarm();

  const canEdit = currentRole === 'admin' || currentRole === 'manager' || hasPermission('canLogSales');

  const [activeTab, setActiveTab] = useState<'orders' | 'sales' | 'payments'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showCreateSaleModal, setShowCreateSaleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [invoiceToPrint, setInvoiceToPrint] = useState<FarmSale | null>(null);
  const [paymentTargetSale, setPaymentTargetSale] = useState<FarmSale | null>(null);

  // Requirement 1 & 2: Remittance Management State
  const [editingPayment, setEditingPayment] = useState<CustomerPayment | null>(null);
  const [viewingPaymentReceipt, setViewingPaymentReceipt] = useState<CustomerPayment | null>(null);

  // Edit Sale Form State
  const [editingSale, setEditingSale] = useState<FarmSale | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('Cash');
  const [editReferenceNumber, setEditReferenceNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleOpenEditSaleModal = (sale: FarmSale) => {
    setEditingSale(sale);
    setEditDate(sale.date);
    setEditCustomerName(sale.customerName);
    setEditPaidAmount(sale.paidAmount);
    setEditPaymentMethod(sale.paymentMethod || 'Cash');
    setEditReferenceNumber(sale.referenceNumber || '');
    setEditNotes(sale.notes || '');
  };

  const handleSaveEditSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    updateSale(editingSale.id, {
      date: editDate,
      customerName: editCustomerName.trim(),
      paidAmount: Number(editPaidAmount) || 0,
      paymentMethod: editPaymentMethod,
      referenceNumber: editReferenceNumber.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });

    setEditingSale(null);
  };

  // New Order Form State
  const [orderCustomerId, setOrderCustomerId] = useState(customers[0]?.id || '');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [fulfillmentType, setFulfillmentType] = useState<'Pickup' | 'Delivery'>('Pickup');
  const [paymentTerms, setPaymentTerms] = useState('Cash on Delivery');
  const [orderDeliveryFee, setOrderDeliveryFee] = useState<number>(0);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      grade: 'medium',
      quantityPieces: 300,
      quantityTrays: 10,
      unitPrice: 220,
      priceType: 'tray',
      subtotal: 2200,
    },
  ]);

  // Direct Sale Form State
  const [saleCustomerId, setSaleCustomerId] = useState(customers[0]?.id || '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleDeliveryFee, setSaleDeliveryFee] = useState<number>(0);
  const [saleDiscount, setSaleDiscount] = useState<number>(0);
  const [salePaidAmount, setSalePaidAmount] = useState<number>(0);
  const [salePaymentMethod, setSalePaymentMethod] = useState<PaymentMethod>('Cash');
  const [saleAccountReceived, setSaleAccountReceived] = useState<'cash_on_hand' | 'bank_account'>('cash_on_hand');
  const [saleBankAccountId, setSaleBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    {
      grade: 'large',
      quantityPieces: 300,
      quantityTrays: 10,
      unitPrice: 235,
      priceType: 'tray',
      subtotal: 2350,
    },
  ]);

  // Payment Form State
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentAccount, setPaymentAccount] = useState<'cash_on_hand' | 'bank_account'>('cash_on_hand');
  const [paymentBankId, setPaymentBankId] = useState(bankAccounts[0]?.id || '');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Calculations for Order creation
  const handleAddOrderItem = () => {
    setOrderItems(prev => [
      ...prev,
      {
        grade: 'large',
        quantityPieces: 300,
        quantityTrays: 10,
        unitPrice: 235,
        priceType: 'tray',
        subtotal: 2350,
      },
    ]);
  };

  const handleUpdateOrderItem = (index: number, updates: Partial<OrderItem>) => {
    setOrderItems(prev => {
      const copy = [...prev];
      const current = { ...copy[index], ...updates };

      if (updates.quantityTrays !== undefined || updates.unitPrice !== undefined || updates.priceType !== undefined) {
        if (current.priceType === 'tray') {
          current.quantityPieces = current.quantityTrays * 30;
          current.subtotal = current.quantityTrays * current.unitPrice;
        } else {
          current.subtotal = current.quantityPieces * current.unitPrice;
        }
      }
      copy[index] = current;
      return copy;
    });
  };

  const handleRemoveOrderItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const orderSubtotal = orderItems.reduce((s, it) => s + it.subtotal, 0);
  const orderTotal = Math.max(0, orderSubtotal + orderDeliveryFee - orderDiscount);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === orderCustomerId) || customers[0];
    if (!cust) {
      alert('Please add a customer before creating an order.');
      return;
    }

    addOrder({
      date: orderDate,
      customerId: cust.id,
      customerName: cust.name,
      contactNumber: cust.contactNumber,
      deliveryAddress: cust.address,
      fulfillmentType,
      deliveryDate,
      status: 'CONFIRMED',
      paymentTerms,
      items: orderItems,
      subtotal: orderSubtotal,
      deliveryFee: orderDeliveryFee,
      discount: orderDiscount,
      total: orderTotal,
      notes: orderNotes,
    });

    setShowCreateOrderModal(false);
  };

  // Calculations for Direct Sale creation
  const handleAddSaleItem = () => {
    setSaleItems(prev => [
      ...prev,
      {
        grade: 'large',
        quantityPieces: 300,
        quantityTrays: 10,
        unitPrice: 235,
        priceType: 'tray',
        subtotal: 2350,
      },
    ]);
  };

  const handleUpdateSaleItem = (index: number, updates: Partial<SaleItem>) => {
    setSaleItems(prev => {
      const copy = [...prev];
      const current = { ...copy[index], ...updates };

      if (updates.quantityTrays !== undefined || updates.unitPrice !== undefined || updates.priceType !== undefined) {
        if (current.priceType === 'tray') {
          current.quantityPieces = current.quantityTrays * 30;
          current.subtotal = current.quantityTrays * current.unitPrice;
        } else {
          current.subtotal = current.quantityPieces * current.unitPrice;
        }
      }
      copy[index] = current;
      return copy;
    });
  };

  const handleRemoveSaleItem = (index: number) => {
    setSaleItems(prev => prev.filter((_, i) => i !== index));
  };

  const saleSubtotal = saleItems.reduce((s, it) => s + it.subtotal, 0);
  const saleTotal = Math.max(0, saleSubtotal + saleDeliveryFee - saleDiscount);

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === saleCustomerId) || customers[0];
    if (!cust) {
      alert('Please register at least one customer.');
      return;
    }

    const paymentStatus =
      salePaidAmount >= saleTotal
        ? 'PAID'
        : salePaidAmount > 0
        ? 'PARTIAL'
        : 'UNPAID';

    addSale({
      date: saleDate,
      customerId: cust.id,
      customerName: cust.name,
      items: saleItems,
      subtotal: saleSubtotal,
      deliveryFee: saleDeliveryFee,
      discount: saleDiscount,
      total: saleTotal,
      paymentStatus,
      paidAmount: salePaidAmount,
      paymentMethod: salePaymentMethod,
    });

    setShowCreateSaleModal(false);
    setSalePaidAmount(0);
  };

  // Process manual payment against sale or update existing payment remittance
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    if (editingPayment) {
      updatePaymentRemittance(editingPayment.id, {
        paymentDate,
        amount: Number(paymentAmount) || 0,
        paymentMethod,
        referenceNumber: paymentRef.trim() || undefined,
        accountReceivedInto: paymentAccount,
        bankAccountId: paymentAccount === 'bank_account' ? paymentBankId : undefined,
        notes: paymentNotes.trim() || undefined,
      });
      setEditingPayment(null);
    } else if (paymentTargetSale) {
      addPayment({
        paymentDate,
        amount: Number(paymentAmount) || 0,
        paymentMethod,
        referenceNumber: paymentRef.trim() || undefined,
        customerId: paymentTargetSale.customerId,
        customerName: paymentTargetSale.customerName,
        saleId: paymentTargetSale.id,
        accountReceivedInto: paymentAccount,
        bankAccountId: paymentAccount === 'bank_account' ? paymentBankId : undefined,
        notes: paymentNotes.trim() || undefined,
      });
    }

    setShowPaymentModal(false);
    setPaymentTargetSale(null);
    setEditingPayment(null);
    setPaymentAmount(0);
    setPaymentRef('');
    setPaymentNotes('');
  };

  const handleEditPayment = (payment: CustomerPayment) => {
    setEditingPayment(payment);
    setPaymentDate(payment.paymentDate);
    setPaymentAmount(payment.amount);
    setPaymentMethod(payment.paymentMethod || 'Cash');
    setPaymentAccount(payment.accountReceivedInto || 'cash_on_hand');
    setPaymentBankId(payment.bankAccountId || bankAccounts[0]?.id || '');
    setPaymentRef(payment.referenceNumber || '');
    setPaymentNotes(payment.notes || '');
    setShowPaymentModal(true);
  };

  const handleDeletePaymentRemittance = (paymentId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this payment remittance? This action will move the record to the trash.'
      )
    ) {
      deletePaymentRemittance(paymentId);
    }
  };

  // Convert order to direct sales invoice
  const handleFulfillOrderToSale = (order: FarmOrder) => {
    const saleItemsConverted: SaleItem[] = order.items.map(it => ({
      grade: it.grade,
      quantityPieces: it.quantityPieces,
      quantityTrays: it.quantityTrays,
      unitPrice: it.unitPrice,
      priceType: it.priceType,
      subtotal: it.subtotal,
    }));

    addSale({
      date: new Date().toISOString().split('T')[0],
      orderId: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      items: saleItemsConverted,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      paymentMethod: 'Cash',
      notes: `Generated from order #${order.orderNumber}`,
    });

    updateOrderStatus(order.id, 'COMPLETED');
    setActiveTab('sales');
  };

  // FIX UNPAID RECEIVABLES COMPUTATION: Direct balance aggregation from global sales array
  const grossInvoicedRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (parseFloat(String(s.total)) || 0), 0);
  }, [sales]);

  const totalRemittedClean = useMemo(() => {
    return payments.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
  }, [payments]);

  const calculatedUnpaidReceivables = useMemo(() => {
    return sales.reduce((sum, invoice) => sum + (parseFloat(String(invoice.balance)) || 0), 0);
  }, [sales]);

  const openInvoicesCount = useMemo(() => {
    return sales.filter(invoice => (invoice.balance || 0) > 0).length;
  }, [sales]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Orders, Sales Invoicing & Collections
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end commercial workflow: Client Orders → Inventory Dispatch → Official Invoicing → Cash/Bank Payment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (customers.length === 0) {
                alert('Please register at least one customer first.');
                return;
              }
              setOrderCustomerId(customers[0].id);
              setShowCreateOrderModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Order</span>
          </button>

          <button
            onClick={() => {
              if (customers.length === 0) {
                alert('Please register at least one customer first.');
                return;
              }
              setSaleCustomerId(customers[0].id);
              setShowCreateSaleModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Receipt className="w-4 h-4" />
            <span>Direct Sale / Invoice</span>
          </button>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Gross Invoiced Revenue</div>
          <div className="text-2xl font-bold text-slate-900 font-heading mt-1">
            {formatCurrency(grossInvoicedRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{sales.length} sales invoices issued</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Cash/Bank Remitted</div>
          <div className="text-2xl font-bold text-emerald-700 font-heading mt-1">
            {formatCurrency(totalRemittedClean)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{payments.length} payment transactions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Unpaid Receivables</div>
          <div className="text-2xl font-bold text-rose-600 font-heading mt-1">
            {formatCurrency(calculatedUnpaidReceivables)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{openInvoicesCount} open invoices ({sales.length} total)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Active Advance Orders</div>
          <div className="text-2xl font-bold text-indigo-700 font-heading mt-1">
            {orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Orders to prepare & dispatch</div>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2.5 text-xs font-bold font-heading transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Customer Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-2.5 text-xs font-bold font-heading transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'sales'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Sales Invoices ({sales.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-2.5 text-xs font-bold font-heading transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Remittances ({payments.length})</span>
        </button>
      </div>

      {/* TAB 1: ADVANCE ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Customer Advance Orders Queue
            </h3>
            <span className="text-xs text-slate-500">Reservations & Dispatches</span>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No advance orders placed</p>
              <p className="mt-1 text-slate-400 max-w-sm mx-auto">
                Record buyer egg reservations and delivery dates to hold inventory in reserve.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Delivery Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Total (₱)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="p-3 text-slate-600">{o.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{o.customerName}</td>
                      <td className="p-3 font-mono text-slate-700">{o.deliveryDate}</td>
                      <td className="p-3 text-slate-600">{o.fulfillmentType}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            o.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && canEdit && (
                            <button
                              onClick={() => handleFulfillOrderToSale(o)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Convert Order to Sales Invoice & Fulfill"
                            >
                              <span>Fulfill & Invoice</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => {
                                if (confirm(`Move order #${o.orderNumber} to trash?`)) {
                                  deleteOrder(o.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SALES INVOICES MASTER LEDGER */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Sales Invoices Master Ledger ({sales.length})
            </h3>
            <span className="text-xs text-slate-500">Official commercial transactions</span>
          </div>

          {sales.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No sales invoices issued</p>
              <p className="mt-1 text-slate-400 max-w-sm mx-auto">
                Record egg dispatches and counter sales to generate official customer invoices.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-right font-bold text-slate-900">Total Amount</th>
                    <th className="p-3 text-right text-emerald-700 font-bold">Paid</th>
                    <th className="p-3 text-right text-rose-600 font-bold">Balance</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">{s.saleNumber}</td>
                      <td className="p-3 text-slate-600">{s.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{s.customerName}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(s.total)}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                        {formatCurrency(s.paidAmount)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 text-sm">
                        {formatCurrency(s.balance)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.balance > 0 && canEdit && (
                            <button
                              onClick={() => {
                                setPaymentTargetSale(s);
                                setEditingPayment(null);
                                setPaymentAmount(s.balance);
                                setShowPaymentModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                              title="Collect Remittance for this Invoice"
                            >
                              Collect Payment
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditSaleModal(s)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer"
                              title="Edit Sales Invoice"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => {
                                if (confirm(`Move sales invoice ${s.saleNumber} to trash?`)) {
                                  deleteSale(s.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Delete Sales Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENT REMITTANCES JOURNAL */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Payment Remittances Journal ({payments.length})
            </h3>
            <span className="text-xs text-slate-500 font-mono">Remittances Credited</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No payment remittances recorded</p>
              <p className="mt-1 text-slate-400 max-w-sm mx-auto">
                Customer payments will be logged here, automatically crediting Cash on Hand or the selected Bank Account.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Payment #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Account Credited</th>
                    <th className="p-3">Reference / Slip</th>
                    <th className="p-3 text-right font-bold text-emerald-700">Amount (₱)</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3 text-right font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map(p => {
                    const bank = bankAccounts.find(b => b.id === p.bankAccountId);
                    const accountLabel =
                      p.accountReceivedInto === 'cash_on_hand'
                        ? 'Cash on Hand (Vault)'
                        : `Bank: ${bank?.bankName || 'Default Bank'}`;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                        <td className="p-3 text-slate-600">{p.paymentDate}</td>
                        <td className="p-3 font-semibold text-slate-900">{p.customerName}</td>
                        <td className="p-3">
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">{accountLabel}</td>
                        <td className="p-3 font-mono text-slate-500">{p.referenceNumber || '—'}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs truncate">{p.notes || '—'}</td>
                        {/* Requirement 2: JOURNAL TABLE VIEW ACTIONS COLUMN */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingPaymentReceipt(p)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="View Payment Remittance Slip"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleEditPayment(p)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                title="Edit Remittance Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => handleDeletePaymentRemittance(p.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete Remittance Record"
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
      )}

      {/* MODAL: VIEW PAYMENT REMITTANCE RECEIPT */}
      {viewingPaymentReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Payment Remittance Slip
                </h3>
              </div>
              <button
                onClick={() => setViewingPaymentReceipt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-medium">
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">Transaction Code:</span>
                <span className="font-mono font-bold text-slate-900">{viewingPaymentReceipt.paymentNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">Date Billed/Paid:</span>
                <span className="font-mono text-slate-800">{viewingPaymentReceipt.paymentDate}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-900">{viewingPaymentReceipt.customerName}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-indigo-700">{viewingPaymentReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">Account Credited:</span>
                <span className="font-semibold text-emerald-700">
                  {viewingPaymentReceipt.accountReceivedInto === 'cash_on_hand' ? 'Cash on Hand (Vault)' : 'Bank Account'}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold">
                <span className="text-slate-700">Remitted Amount:</span>
                <span className="font-mono text-emerald-700">{formatCurrency(viewingPaymentReceipt.amount)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingPaymentReceipt(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COLLECT OR EDIT PAYMENT */}
      {showPaymentModal && (editingPayment || paymentTargetSale) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  {editingPayment ? `Edit Payment Remittance (${editingPayment.paymentNumber})` : 'Collect Customer Payment'}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {editingPayment ? editingPayment.customerName : paymentTargetSale?.customerName}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setEditingPayment(null);
                  setPaymentTargetSale(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              {paymentTargetSale && !editingPayment && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Outstanding Balance Due:</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    {formatCurrency(paymentTargetSale.balance)}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₱) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="GCash">GCash / Maya</option>
                    <option value="Check">Check</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Into Account</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Destination Bank Account</label>
                  <select
                    value={paymentBankId}
                    onChange={e => setPaymentBankId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.maskedAccountNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">OR / Bank Slip Reference #</label>
                <input
                  type="text"
                  placeholder="Official receipt / reference #"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setEditingPayment(null);
                    setPaymentTargetSale(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {editingPayment ? 'Save Changes' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SALES INVOICE MODAL */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Edit Sales Invoice ({editingSale.saleNumber})
              </h3>
              <button
                onClick={() => setEditingSale(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSale} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Buyer / Customer Name</label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={e => setEditCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Paid (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editPaidAmount}
                    onChange={e => setEditPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={editPaymentMethod}
                  onChange={e => setEditPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="GCash">GCash / Maya</option>
                  <option value="Check">Check</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={editReferenceNumber}
                  onChange={e => setEditReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
