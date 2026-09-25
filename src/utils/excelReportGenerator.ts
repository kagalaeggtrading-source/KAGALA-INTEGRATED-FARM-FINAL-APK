/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FarmProfile,
  FarmSale,
  FarmExpense,
  EggProductionLog,
  SupplyItem,
  ActivityLog,
  CustomerPayment,
  BankDeposit,
  BankAccount,
  PriceChangeLog,
} from '../types';

export interface ExcelReportFilter {
  periodType: 'daily' | 'weekly' | 'monthly' | 'annual' | 'all';
  selectedDate?: string;  // YYYY-MM-DD
  selectedMonth?: string; // YYYY-MM
  selectedYear?: string;  // YYYY
}

export function generateMultiSheetExcelReport(
  profile: FarmProfile,
  filter: ExcelReportFilter,
  sales: FarmSale[],
  payments: CustomerPayment[],
  expenses: FarmExpense[],
  bankAccounts: BankAccount[],
  bankDeposits: BankDeposit[],
  eggProductionLogs: EggProductionLog[],
  supplyItems: SupplyItem[],
  activityLogs: ActivityLog[],
  priceChangeLogs: PriceChangeLog[] = []
) {
  // Filter helper for selected period
  const filterDateMatch = (dateStr: string) => {
    if (!dateStr) return false;
    if (filter.periodType === 'all') return true;

    if (filter.periodType === 'daily' && filter.selectedDate) {
      return dateStr.startsWith(filter.selectedDate);
    }
    if (filter.periodType === 'monthly' && filter.selectedMonth) {
      return dateStr.startsWith(filter.selectedMonth);
    }
    if (filter.periodType === 'annual' && filter.selectedYear) {
      return dateStr.startsWith(filter.selectedYear);
    }
    if (filter.periodType === 'weekly' && filter.selectedDate) {
      const target = new Date(filter.selectedDate);
      const logDate = new Date(dateStr);
      const diffTime = Math.abs(logDate.getTime() - target.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    return true;
  };

  const periodSales = sales.filter(s => filterDateMatch(s.date));
  const periodPayments = payments.filter(p => filterDateMatch(p.paymentDate));
  const periodExpenses = expenses.filter(e => filterDateMatch(e.date));
  const periodDeposits = bankDeposits.filter(d => filterDateMatch(d.depositDate));
  const periodEggLogs = eggProductionLogs.filter(l => filterDateMatch(l.date));
  const periodLogs = activityLogs.filter(l => filterDateMatch(l.timestamp.split(' ')[0]));
  const periodPriceLogs = priceChangeLogs.filter(p => filterDateMatch(p.date || p.timestamp.split(' ')[0]));

  // Pest Control & Cleaning Supplies Filter
  const pestControlSupplies = supplyItems.filter(
    s => s.category === 'pest_control' || s.category === 'disinfectant' || s.category === 'cleaning' || s.category === 'medicine'
  );

  // --- SHEET 1: FINANCIAL CALCULATIONS ---
  // Gross Revenue
  const totalGrossRevenue = periodSales.reduce((sum, s) => sum + s.total, 0);
  const totalEggSalesRevenue = totalGrossRevenue;
  const totalUncollectedAR = periodSales.reduce((sum, s) => sum + s.balance, 0);

  // Collected Revenue (Cash vs Bank Transfer)
  const totalCashCollected = periodPayments
    .filter(p => p.accountReceivedInto === 'cash_on_hand' || p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalBankTransfersCollected = periodPayments
    .filter(p => p.accountReceivedInto === 'bank_account' || p.paymentMethod === 'Bank Transfer')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCollectionsReceived = totalCashCollected + totalBankTransfersCollected;

  // Operating Expenses Breakdown
  const expenseFeed = periodExpenses.filter(e => e.category === 'Feed').reduce((sum, e) => sum + e.amount, 0);
  const expenseLabor = periodExpenses.filter(e => e.category === 'Labor & Salaries').reduce((sum, e) => sum + e.amount, 0);
  const expenseUtilities = periodExpenses.filter(e => e.category === 'Water' || e.category === 'Electricity').reduce((sum, e) => sum + e.amount, 0);
  const expensePestControl = periodExpenses.filter(e => e.category === 'Medicine & Vitamins' || e.category === 'Other Farm Supplies').reduce((sum, e) => sum + e.amount, 0);
  const expenseOther = periodExpenses.filter(e => e.category !== 'Feed' && e.category !== 'Labor & Salaries' && e.category !== 'Water' && e.category !== 'Electricity' && e.category !== 'Medicine & Vitamins' && e.category !== 'Other Farm Supplies').reduce((sum, e) => sum + e.amount, 0);

  const totalOperatingExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Profit / Loss Formula: Total Revenue - Total Expenses
  const netOperatingIncome = totalGrossRevenue - totalOperatingExpenses;
  const netCashflowIncome = totalCollectionsReceived - totalOperatingExpenses;

  // Ending Liquidity Balances
  const totalBankDepositsCompleted = periodDeposits.reduce((sum, d) => sum + d.amount, 0);
  const netCashOnHandBalance = totalCashCollected - (totalOperatingExpenses + totalBankDepositsCompleted);
  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
  const totalFarmLiquidity = netCashOnHandBalance + totalBankBalance;

  // Egg Quantities
  const totalGoodEggsCollectedPcs = periodEggLogs.reduce((sum, l) => sum + l.usableEggs, 0);
  const totalEggsSoldPcs = periodSales.reduce((totalSum, sale) => {
    const salePcs = (sale.items || []).reduce((iSum, item) => {
      const pcs = item.priceType === 'tray' ? item.quantityTrays * 30 : item.quantityPieces;
      return iSum + (pcs || 0);
    }, 0);
    return totalSum + salePcs;
  }, 0);

  const periodLabel =
    filter.periodType === 'daily'
      ? `Daily Report (${filter.selectedDate || 'Today'})`
      : filter.periodType === 'monthly'
      ? `Monthly Report (${filter.selectedMonth || 'Current Month'})`
      : filter.periodType === 'annual'
      ? `Annual Report (${filter.selectedYear || 'Current Year'})`
      : 'All Time Comprehensive Financial Accounting Package';

  // Helper to escape XML special characters
  const xmlXml = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // Helper XML Row Builder
  const createXmlRow = (cells: (string | number)[], isHeader = false) => {
    return `<Row>${cells
      .map(c => {
        const isNum = typeof c === 'number';
        const style = isHeader ? ' StyleID="HeaderStyle"' : isNum ? ' StyleID="NumStyle"' : '';
        const type = isNum ? 'Number' : 'String';
        return `<Cell${style}><Data ss:Type="${type}">${xmlXml(c)}</Data></Cell>`;
      })
      .join('')}</Row>`;
  };

  // Build Excel 2003 XML Workbook (Natively Multi-Sheet SpreadsheetML)
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="NumStyle">
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
 </Styles>

 <!-- SHEET 1: EXECUTIVE FINANCIAL SUMMARY -->
 <Worksheet ss:Name="Executive Financial Summary">
  <Table>
   <Column ss:Width="250"/>
   <Column ss:Width="160"/>
   ${createXmlRow(['EXECUTIVE FINANCIAL SUMMARY STATEMENT', ''], true)}
   ${createXmlRow(['Farm Entity Name', profile.farmName])}
   ${createXmlRow(['Reporting Period', periodLabel])}
   ${createXmlRow(['Report Generated Date', new Date().toLocaleString()])}
   ${createXmlRow(['', ''])}
   ${createXmlRow(['1. GROSS REVENUE ANALYSIS', 'AMOUNT (PHP)'], true)}
   ${createXmlRow(['Total Gross Sales Billed (₱)', totalGrossRevenue])}
   ${createXmlRow(['Egg Sales Revenue (₱)', totalEggSalesRevenue])}
   ${createXmlRow(['Uncollected Accounts Receivable (₱)', totalUncollectedAR])}
   ${createXmlRow(['', ''])}
   ${createXmlRow(['2. REVENUE COLLECTIONS RECONCILIATION', 'AMOUNT (PHP)'], true)}
   ${createXmlRow(['Cash on Hand Collections Received (₱)', totalCashCollected])}
   ${createXmlRow(['Direct Bank Transfer Collections (₱)', totalBankTransfersCollected])}
   ${createXmlRow(['TOTAL REVENUE COLLECTIONS RECEIVED (₱)', totalCollectionsReceived])}
   ${createXmlRow(['', ''])}
   ${createXmlRow(['3. OPERATING EXPENSES BREAKDOWN', 'AMOUNT (PHP)'], true)}
   ${createXmlRow(['Feed Expenditures (₱)', expenseFeed])}
   ${createXmlRow(['Labor & Salaries (₱)', expenseLabor])}
   ${createXmlRow(['Utilities - Water & Electricity (₱)', expenseUtilities])}
   ${createXmlRow(['Pest Control, Medicine & Disinfectants (₱)', expensePestControl])}
   ${createXmlRow(['Other Operating Expenditures (₱)', expenseOther])}
   ${createXmlRow(['TOTAL OPERATING EXPENSES (₱)', totalOperatingExpenses])}
   ${createXmlRow(['', ''])}
   ${createXmlRow(['4. NET PROFIT / LOSS STATEMENT', 'AMOUNT (PHP)'], true)}
   ${createXmlRow(['Net Operating Income (Revenue - Expenses) (₱)', netOperatingIncome])}
   ${createXmlRow(['Net Cashflow Income (Collections - Expenses) (₱)', netCashflowIncome])}
   ${createXmlRow(['', ''])}
   ${createXmlRow(['5. ENDING LIQUIDITY BALANCES', 'AMOUNT (PHP)'], true)}
   ${createXmlRow(['Ending Cash on Hand (Vault / Register) (₱)', netCashOnHandBalance])}
   ${createXmlRow(['Total Bank Accounts Balance (₱)', totalBankBalance])}
   ${createXmlRow(['TOTAL FARM LIQUIDITY (₱)', totalFarmLiquidity])}
  </Table>
 </Worksheet>

 <!-- SHEET 2: SALES & COLLECTION LEDGER -->
 <Worksheet ss:Name="Sales &amp; Collection Ledger">
  <Table>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="160"/>
   <Column ss:Width="180"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="130"/>
   ${createXmlRow(['Date', 'Invoice #', 'Customer Name', 'Egg Sizes &amp; Trays Sold', 'Total (₱)', 'Paid (₱)', 'Balance (₱)', 'Payment Channel'], true)}
   ${periodSales.length === 0 ? createXmlRow(['No sales transactions for this period', '', '', '', 0, 0, 0, '']) : ''}
   ${periodSales
     .map(s => {
       const itemsSummary = (s.items || [])
         .map(i => `${i.quantityTrays || Math.floor(i.quantityPieces / 30)}t ${i.grade}`)
         .join(', ');
       return createXmlRow([
         s.date,
         s.saleNumber,
         s.customerName,
         itemsSummary,
         s.total,
         s.paidAmount,
         s.balance,
         s.paymentMethod === 'Bank Transfer' ? 'Direct Bank Transfer' : 'Cash on Hand',
       ]);
     })
     .join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 3: EXPENSE REGISTRY -->
 <Worksheet ss:Name="Expense Registry">
  <Table>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="140"/>
   <Column ss:Width="220"/>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   ${createXmlRow(['Date', 'Voucher #', 'Category', 'Description &amp; Particulars', 'Supplier / Payee', 'Disbursed Account', 'Cost (₱)', 'Supervisor / Role'], true)}
   ${periodExpenses.length === 0 ? createXmlRow(['No expense records for this period', '', '', '', '', '', 0, '']) : ''}
   ${periodExpenses
     .map(e =>
       createXmlRow([
         e.date,
         e.expenseNumber,
         e.category,
         e.description,
         e.supplierPayee || '—',
         e.paymentAccount === 'cash_on_hand' ? 'Cash on Hand (Vault)' : 'Bank Account',
         e.amount,
         'Authorized Supervisor',
       ])
     )
     .join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 4: EGG PRODUCTION & INVENTORY RECONCILIATION -->
 <Worksheet ss:Name="Egg Production &amp; Reconciliation">
  <Table>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="130"/>
   <Column ss:Width="120"/>
   ${createXmlRow(['Date', 'Total Harvest (Pcs)', 'Rejects (Pcs)', 'Usable Good Eggs (Pcs)', 'Good Trays', 'Eggs Sold (Pcs)', 'Stock Variance (Pcs)', 'Reconciliation Status'], true)}
   ${periodEggLogs.length === 0 ? createXmlRow(['No collection records for this period', 0, 0, 0, 0, 0, 0, 'No Data']) : ''}
   ${periodEggLogs
     .map(l => {
       const soldForDay = periodSales
         .filter(s => s.date === l.date)
         .reduce((sum, s) => sum + (s.items || []).reduce((iSum, i) => iSum + (i.priceType === 'tray' ? i.quantityTrays * 30 : i.quantityPieces), 0), 0);
       const variance = l.usableEggs - soldForDay;
       return createXmlRow([
         l.date,
         l.totalCollection,
         l.rejects,
         l.usableEggs,
         Math.floor(l.usableEggs / 30),
         soldForDay,
         variance,
         variance >= 0 ? 'Balanced' : 'Discrepancy Warning',
       ]);
     })
     .join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 5: PEST CONTROL & SUPPLIES INVENTORY -->
 <Worksheet ss:Name="Pest Control &amp; Supplies">
  <Table>
   <Column ss:Width="160"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="70"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="140"/>
   ${createXmlRow(['Supply Item Name', 'Category', 'Stock Qty', 'Unit', 'Min Alert', 'Restock Status', 'Unit Cost (₱)', 'Stock Value (₱)', 'Supplier / Notes'], true)}
   ${pestControlSupplies.length === 0
     ? createXmlRow(['No pest control or disinfectant supplies', 'Pest Control', 0, 'pcs', 0, 'Sufficient', 0, 0, ''])
     : ''}
   ${pestControlSupplies
     .map(s =>
       createXmlRow([
         s.name,
         s.category.toUpperCase(),
         s.quantity,
         s.unit,
         s.minimumStock,
         s.quantity <= s.minimumStock ? 'RESTOCK REQUIRED' : 'Sufficient Stock',
         s.costPerUnit,
         s.quantity * s.costPerUnit,
         s.supplier || 'Farm Supplier',
       ])
     )
     .join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 6: COMPLETE SYSTEM AUDIT TRAIL -->
 <Worksheet ss:Name="Complete System Audit Trail">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="130"/>
   <Column ss:Width="150"/>
   <Column ss:Width="320"/>
   ${createXmlRow(['Timestamp', 'User / Role', 'Action Type', 'Module', 'Uneditable Activity Log Details'], true)}
   ${periodLogs.length === 0 ? createXmlRow(['No audit activity entries for this period', '', '', '', '']) : ''}
   ${periodLogs
     .map(l =>
       createXmlRow([
         l.timestamp,
         l.userName || l.userRole.toUpperCase(),
         l.actionType,
         l.module,
         l.details,
       ])
     )
     .join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 7: PRICE CHANGE AUDIT HISTORY -->
 <Worksheet ss:Name="Price Change Audit History">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="250"/>
   <Column ss:Width="140"/>
   ${createXmlRow(['Timestamp', 'Date', 'Egg Grade', 'Old Price (₱)', 'New Price (₱)', 'Price Delta (₱)', 'Reason for Price Change', 'Updated By'], true)}
   ${periodPriceLogs.length === 0
     ? createXmlRow(['No manual price adjustments recorded for this period', '', '', 0, 0, 0, '', ''])
     : ''}
   ${periodPriceLogs
     .map(p =>
       createXmlRow([
         p.timestamp,
         p.date,
         p.grade.toUpperCase(),
         p.oldPrice,
         p.newPrice,
         p.newPrice - p.oldPrice,
         p.reason || 'Admin market price adjustment',
         p.changedBy || 'Superuser Admin',
       ])
     )
     .join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  // Create Blob & Trigger Download
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `Kagala_Farm_Comprehensive_Accounting_Package_${filter.periodType}_${new Date().toISOString().split('T')[0]}.xls`;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
