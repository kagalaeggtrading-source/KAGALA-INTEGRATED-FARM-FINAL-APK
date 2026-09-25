/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { AccessRestrictedView } from './components/common/AccessRestrictedView';
import { AdminLoginModal } from './components/common/AdminLoginModal';
import { LoginPage } from './components/auth/LoginPage';
import { AdminOverrideModal } from './components/auth/AdminOverrideModal';

import { AccessControlPanelView } from './components/admin/AccessControlPanelView';
import { ActivityAuditLogsView } from './components/admin/ActivityAuditLogsView';
import { DashboardView } from './components/dashboard/DashboardView';
import { FlockView } from './components/flock/FlockView';
import { EggProductionView } from './components/production/EggProductionView';
import { EggInventoryView } from './components/inventory/EggInventoryView';
import { FeedView } from './components/feed/FeedView';
import { SuppliesView } from './components/supplies/SuppliesView';
import { CustomersView } from './components/customers/CustomersView';
import { SalesOrdersView } from './components/sales/SalesOrdersView';
import { ExpenseView } from './components/expenses/ExpenseView';
import { BankingView } from './components/banking/BankingView';
import { CostOfProductionView } from './components/cost/CostOfProductionView';
import { AuditCenterView } from './components/audit/AuditCenterView';
import { TrashView } from './components/audit/TrashView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { Menu, X } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { isAuthenticated, isTabAllowed } = useFarm();

  // Universal Login Gate: Completely blocks layout if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveView = () => {
    // If the active tab is blocked by current role boundaries, show AccessRestrictedView
    if (!isTabAllowed(activeTab)) {
      return <AccessRestrictedView attemptedTab={activeTab} onNavigate={handleNavigate} />;
    }

    switch (activeTab) {
      case 'access-control':
        return <AccessControlPanelView onNavigate={handleNavigate} />;
      case 'activity-logs':
        return <ActivityAuditLogsView />;
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'flock':
        return <FlockView />;
      case 'production':
        return <EggProductionView />;
      case 'inventory':
        return <EggInventoryView />;
      case 'feed':
        return <FeedView />;
      case 'supplies':
        return <SuppliesView />;
      case 'customers':
        return <CustomersView />;
      case 'orders':
        return <SalesOrdersView initialTab="orders" />;
      case 'sales':
        return <SalesOrdersView initialTab="sales" />;
      case 'payments':
        return <SalesOrdersView initialTab="payments" />;
      case 'expenses':
        return <ExpenseView />;
      case 'bank-deposits':
      case 'cashflow':
        return <BankingView />;
      case 'production-cost':
        return <CostOfProductionView />;
      case 'record-check':
        return <AuditCenterView onNavigate={handleNavigate} />;
      case 'trash':
        return <TrashView onNavigate={handleNavigate} />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Admin Credential Verification Modal */}
      <AdminLoginModal />

      {/* Mandatory Admin Password Logout Override Modal */}
      <AdminOverrideModal />

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 transform md:transform-none transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar activeTab={activeTab} onNavigate={handleNavigate} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <div className="relative">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden absolute left-4 top-4 z-40 p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Header activeTab={activeTab} onNavigate={handleNavigate} />
        </div>

        {/* Dynamic View Scroll Container */}
        <main className="flex-1 overflow-y-auto custom-scrollbar focus:outline-hidden">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FarmProvider>
      <AppContent />
    </FarmProvider>
  );
}
