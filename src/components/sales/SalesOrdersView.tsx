/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  ShoppingBag,
  PlusCircle,
  CheckCircle2,
  Truck,
  Printer,
  XCircle,
  Eye,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Receipt,
  Clock,
  Trash2,
} from 'lucide-react';
import { EGG_GRADES, formatCurrency, formatNumber } from '../../constants';
import {
  EggGradeKey,
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
    deleteSale,
    payments,
    addPayment,
    customers,
    eggStockSummary,
    bankAccounts,
    profile,
  } = useFarm();

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
      notes: orderNotes.trim() || undefined,
    });

    setShowCreateOrderModal(false);
    setOrderNotes('');
  };

  // Calculations for Direct Sale creation
  const handleAddSaleItem = () => {
    setSaleItems(prev => [
      ...prev,
      {
        grade: 'medium',
        quantityPieces: 300,
        quantityTrays: 10,
        unitPrice: 220,
        priceType: 'tray',
        subtotal: 2200,
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

  // Process manual payment against sale
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetSale || paymentAmount <= 0) return;

    addPayment({
      paymentDate,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: paymentRef.trim() || undefined,
      customerId: paymentTargetSale.customerId,
      customerName: paymentTargetSale.customerName,
      saleId: paymentTargetSale.id,
      accountReceivedInto: paymentAccount,
      bankAccountId: paymentAccount === 'bank_account' ? paymentBankId : undefined,
      notes: paymentNotes.trim() || undefined,
    });

    setShowPaymentModal(false);
    setPaymentTargetSale(null);
    setPaymentAmount(0);
    setPaymentRef('');
    setPaymentNotes('');
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

  const totalSalesRevenue = sales.reduce((s, sale) => s + sale.total, 0);
  const totalCollections = payments.reduce((s, p) => s + p.amount, 0);
  const totalOutstandingBalance = sales.reduce((s, sale) => s + sale.balance, 0);

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
            {formatCurrency(totalSalesRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{sales.length} sales invoices issued</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Cash/Bank Remitted</div>
          <div className="text-2xl font-bold text-emerald-700 font-heading mt-1">
            {formatCurrency(totalCollections)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{payments.length} payment transactions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Unpaid Receivables</div>
          <div className="text-2xl font-bold text-rose-600 font-heading mt-1">
            {formatCurrency(totalOutstandingBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pending collection from buyers</div>
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

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Orders Queue ({orders.length})
            </h3>
            <span className="text-xs text-slate-500">Real-time order statuses</span>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No active customer orders</p>
              <p className="mt-1 text-slate-400 max-w-sm mx-auto">
                Take advance orders for specific egg sizes and quantities. Once ready, convert them into official sales invoices with 1 click.
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
                    <th className="p-3">Items Summary</th>
                    <th className="p-3 text-right">Order Total</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                      <td className="p-3 text-slate-600">
                        <div>{order.date}</div>
                        <div className="text-[10px] text-slate-400">Target: {order.deliveryDate}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{order.contactNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          {order.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-block text-[11px] bg-slate-100 px-2 py-0.5 rounded mr-1.5 capitalize"
                            >
                              {it.grade}: {it.quantityTrays} trays
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="text-[11px] font-semibold px-2 py-1 rounded border border-slate-200 bg-white"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="RESERVED">RESERVED</option>
                          <option value="PREPARING">PREPARING</option>
                          <option value="READY">READY</option>
                          <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleFulfillOrderToSale(order)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Create Sales Invoice & Dispatch"
                            >
                              Fulfill & Invoice
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Delete order ${order.orderNumber}?`)) {
                                deleteOrder(order.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* TAB 2: SALES INVOICES */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Sales Invoices Master Ledger ({sales.length})
            </h3>
            <span className="text-xs text-slate-500">Official sales records</span>
          </div>

          {sales.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No sales invoices recorded</p>
              <p className="mt-1 text-slate-400 max-w-sm mx-auto">
                Record egg sales directly or fulfill client orders to track revenue and receivables.
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
                    <th className="p-3">Grade Breakdown</th>
                    <th className="p-3 text-right">Total (₱)</th>
                    <th className="p-3 text-right">Paid (₱)</th>
                    <th className="p-3 text-right font-bold text-rose-600">Balance (₱)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">{sale.saleNumber}</td>
                      <td className="p-3 text-slate-600">{sale.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{sale.customerName}</td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          {sale.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-block text-[11px] bg-slate-100 px-2 py-0.5 rounded mr-1 capitalize"
                            >
                              {it.grade}: {it.quantityTrays} trays
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                        {formatCurrency(sale.paidAmount)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sm">
                        <span className={sale.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          {formatCurrency(sale.balance)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sale.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sale.balance > 0 && (
                            <button
                              onClick={() => {
                                setPaymentTargetSale(sale);
                                setPaymentAmount(sale.balance);
                                setShowPaymentModal(true);
                              }}
                              className="px-2 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-[11px] font-semibold cursor-pointer"
                              title="Collect Remittance"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            onClick={() => setInvoiceToPrint(sale)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Print Official Sales Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete invoice ${sale.saleNumber}?`)) {
                                deleteSale(sale.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* TAB 3: CUSTOMER PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Payment Remittances Journal ({payments.length})
            </h3>
            <span className="text-xs text-slate-500">Audit trail of buyer collections</span>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: NEW CUSTOMER ORDER */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Create Customer Advance Order
              </h3>
              <button
                onClick={() => setShowCreateOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
                  <select
                    value={orderCustomerId}
                    onChange={e => setOrderCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-semibold"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                    <option value="Credit 7 Days">Credit 7 Days</option>
                    <option value="Credit 15 Days">Credit 15 Days</option>
                    <option value="Advance Payment">Advance Payment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order Date</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={e => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Delivery / Pickup</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Order Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800">Egg Order Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddOrderItem}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Egg Grade</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-2">Egg Grade</th>
                        <th className="p-2 text-right">Trays</th>
                        <th className="p-2 text-right">Price / Tray (₱)</th>
                        <th className="p-2 text-right font-bold text-slate-900">Subtotal (₱)</th>
                        <th className="p-2 text-center">✕</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {orderItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={item.grade}
                              onChange={e => handleUpdateOrderItem(idx, { grade: e.target.value as EggGradeKey })}
                              className="w-full px-2 py-1 border border-slate-200 rounded capitalize font-semibold"
                            >
                              {EGG_GRADES.map(g => (
                                <option key={g.key} value={g.key}>
                                  {g.label} ({eggStockSummary[g.key]?.availableTrays || 0} trays in stock)
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantityTrays}
                              onChange={e =>
                                handleUpdateOrderItem(idx, { quantityTrays: parseInt(e.target.value) || 0 })
                              }
                              className="w-20 px-2 py-1 border border-slate-200 rounded text-right font-mono font-bold"
                            />
                          </td>

                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.unitPrice}
                              onChange={e =>
                                handleUpdateOrderItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })
                              }
                              className="w-24 px-2 py-1 border border-slate-200 rounded text-right font-mono"
                            />
                          </td>

                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </td>

                          <td className="p-2 text-center">
                            {orderItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOrderItem(idx)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Totals Summary */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">{formatCurrency(orderSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Delivery Fee:</span>
                  <input
                    type="number"
                    min="0"
                    value={orderDeliveryFee}
                    onChange={e => setOrderDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-right font-mono"
                  />
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Special Discount:</span>
                  <input
                    type="number"
                    min="0"
                    value={orderDiscount}
                    onChange={e => setOrderDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-right font-mono text-rose-600"
                  />
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Order Amount:</span>
                  <span className="font-mono text-emerald-700">{formatCurrency(orderTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm & Reserve Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT SALE & CASHIER */}
      {showCreateSaleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Record Direct Sale & Invoice
              </h3>
              <button
                onClick={() => setShowCreateSaleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer / Buyer *</label>
                  <select
                    value={saleCustomerId}
                    onChange={e => setSaleCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-semibold"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Egg Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800">Egg Sale Items</label>
                  <button
                    type="button"
                    onClick={handleAddSaleItem}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Egg Grade</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-2">Egg Grade</th>
                        <th className="p-2 text-right">Trays</th>
                        <th className="p-2 text-right">Price / Tray (₱)</th>
                        <th className="p-2 text-right font-bold text-slate-900">Subtotal (₱)</th>
                        <th className="p-2 text-center">✕</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {saleItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={item.grade}
                              onChange={e => handleUpdateSaleItem(idx, { grade: e.target.value as EggGradeKey })}
                              className="w-full px-2 py-1 border border-slate-200 rounded capitalize font-semibold"
                            >
                              {EGG_GRADES.map(g => (
                                <option key={g.key} value={g.key}>
                                  {g.label} ({eggStockSummary[g.key]?.availableTrays || 0} trays available)
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantityTrays}
                              onChange={e =>
                                handleUpdateSaleItem(idx, { quantityTrays: parseInt(e.target.value) || 0 })
                              }
                              className="w-20 px-2 py-1 border border-slate-200 rounded text-right font-mono font-bold"
                            />
                          </td>

                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.unitPrice}
                              onChange={e =>
                                handleUpdateSaleItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })
                              }
                              className="w-24 px-2 py-1 border border-slate-200 rounded text-right font-mono"
                            />
                          </td>

                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </td>

                          <td className="p-2 text-center">
                            {saleItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSaleItem(idx)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Total Sale:</span>
                  <span className="font-mono text-emerald-700">{formatCurrency(saleTotal)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Amount Paid (₱)</label>
                    <input
                      type="number"
                      min="0"
                      max={saleTotal}
                      value={salePaidAmount}
                      onChange={e => setSalePaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={salePaymentMethod}
                      onChange={e => setSalePaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="GCash">GCash / Maya</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Remaining Balance:</span>
                  <span
                    className={`font-mono font-bold ${
                      saleTotal - salePaidAmount > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatCurrency(Math.max(0, saleTotal - salePaidAmount))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateSaleModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Sale & Deduct Eggs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COLLECT PAYMENT */}
      {showPaymentModal && paymentTargetSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Collect Customer Payment
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {paymentTargetSale.saleNumber} - {paymentTargetSale.customerName}
                </span>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Outstanding Balance Due:</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  {formatCurrency(paymentTargetSale.balance)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₱) *</label>
                  <input
                    type="number"
                    min="1"
                    max={paymentTargetSale.balance}
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
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE MODAL */}
      {invoiceToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-8 border border-slate-200 max-h-[90vh] overflow-y-auto print:m-0 print:p-0">
            {/* Header */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={profile.farmName}
                    className="h-14 w-auto object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center font-heading">
                    KIF
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    {profile.farmName}
                  </h3>
                  <p className="text-[11px] text-slate-500">{profile.address}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{profile.contactNumber}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold uppercase text-emerald-700 block">
                  OFFICIAL SALES INVOICE
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 block mt-0.5">
                  {invoiceToPrint.saleNumber}
                </span>
                <span className="text-[11px] text-slate-500 block">Date: {invoiceToPrint.date}</span>
              </div>
            </div>

            {/* Bill To */}
            <div className="py-4 border-b border-slate-100 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Billed To:</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{invoiceToPrint.customerName}</div>
            </div>

            {/* Items */}
            <div className="py-4">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Trays</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoiceToPrint.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 capitalize font-semibold text-slate-800">Fresh Table Eggs - {it.grade}</td>
                      <td className="py-2 text-right font-mono">{it.quantityTrays}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-2 text-right font-mono font-bold">{formatCurrency(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1 text-xs text-right">
                <div className="text-slate-600">
                  Subtotal: <span className="font-mono font-bold">{formatCurrency(invoiceToPrint.subtotal)}</span>
                </div>
                {invoiceToPrint.deliveryFee > 0 && (
                  <div className="text-slate-600">
                    Delivery Fee: <span className="font-mono">{formatCurrency(invoiceToPrint.deliveryFee)}</span>
                  </div>
                )}
                {invoiceToPrint.discount > 0 && (
                  <div className="text-rose-600">
                    Discount: -<span className="font-mono">{formatCurrency(invoiceToPrint.discount)}</span>
                  </div>
                )}
                <div className="text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
                  Invoice Total: <span className="font-mono text-emerald-800">{formatCurrency(invoiceToPrint.total)}</span>
                </div>
                <div className="text-xs text-emerald-700 font-semibold">
                  Amount Paid: <span className="font-mono">{formatCurrency(invoiceToPrint.paidAmount)}</span>
                </div>
                <div className="text-xs text-rose-600 font-bold">
                  Balance Remaining: <span className="font-mono">{formatCurrency(invoiceToPrint.balance)}</span>
                </div>
              </div>
            </div>

            {/* Print action */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => setInvoiceToPrint(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
