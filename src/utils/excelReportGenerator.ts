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
  bankDeposits: BankDeposit[],
  eggProductionLogs: EggProductionLog[],
  supplyItems: SupplyItem[],
  activityLogs: ActivityLog[]
) {
  // 1. Filter Data by Selected Period
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

  // Pest Control Supplies Filter
  const pestControlSupplies = supplyItems.filter(
    s => s.category === 'pest_control' || s.category === 'disinfectant' || s.category === 'cleaning'
  );

  // Financial Totals for Summary Dashboard Sheet
  const totalCashReceived = periodPayments
    .filter(p => p.accountReceivedInto === 'cash_on_hand' || p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalBankTransfersReceived = periodPayments
    .filter(p => p.accountReceivedInto === 'bank_account' || p.paymentMethod === 'Bank Transfer')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpensesPaidOut = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBankDepositsCompleted = periodDeposits.reduce((sum, d) => sum + d.amount, 0);

  const netCashOnHandBalance = totalCashReceived - (totalExpensesPaidOut + totalBankDepositsCompleted);

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
      : 'All Time Comprehensive Financial Report';

  // Helper to escape XML special characters
  const xmlXml = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // Helper XML Row
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

 <!-- SHEET 1: SUMMARY DASHBOARD -->
 <Worksheet ss:Name="Summary Dashboard">
  <Table>
   <Column ss:Width="200"/>
   <Column ss:Width="180"/>
   ${createXmlRow(['FARM ENTERPRISE FINANCIAL SUMMARY DASHBOARD', ''], true)}
   ${createXmlRow(['Farm Name', profile.farmName])}
   ${createXmlRow(['Reporting Period', periodLabel])}
   ${createXmlRow(['Generated On', new Date().toLocaleString()])}
   ${createXmlRow(['', ''])}
   ${createXmlRow(['FINANCIAL KPI METRIC', 'AMOUNT (PHP)'], true)}
   ${createXmlRow(['Total Cash Payments Received (₱)', totalCashReceived])}
   ${createXmlRow(['Total Bank Transfers Received (₱)', totalBankTransfersReceived])}
   ${createXmlRow(['Total Farm Expenses Paid Out (₱)', totalExpensesPaidOut])}
   ${createXmlRow(['Total Completed Bank Deposits (₱)', totalBankDepositsCompleted])}
   ${createXmlRow(['NET CASH ON HAND BALANCE (₱)', netCashOnHandBalance])}
   ${createXmlRow(['', ''])}
   ${createXmlRow(['PRODUCTION & INVENTORY KPI', 'QUANTITY'], true)}
   ${createXmlRow(['Total Good Eggs Collected (Pcs)', totalGoodEggsCollectedPcs])}
   ${createXmlRow(['Total Good Eggs Collected (Trays)', Math.floor(totalGoodEggsCollectedPcs / 30)])}
   ${createXmlRow(['Total Eggs Sold (Pcs)', totalEggsSoldPcs])}
   ${createXmlRow(['Total Eggs Sold (Trays)', Math.floor(totalEggsSoldPcs / 30)])}
   ${createXmlRow(['Remaining Unsold Inventory (Pcs)', totalGoodEggsCollectedPcs - totalEggsSoldPcs])}
  </Table>
 </Worksheet>

 <!-- SHEET 2: SALES & COLLECTION LOG -->
 <Worksheet ss:Name="Sales &amp; Collection Log">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="160"/>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   ${createXmlRow(['Date', 'Invoice #', 'Customer Name', 'Items Summary', 'Total Amount (₱)', 'Paid (₱)', 'Balance (₱)', 'Payment Method'], true)}
   ${periodSales.length === 0 ? createXmlRow(['No sales records for this period', '', '', '', 0, 0, 0, '']) : ''}
   ${periodSales
     .map(s => {
       const itemsDesc = (s.items || [])
         .map(i => `${i.quantityTrays || Math.floor(i.quantityPieces / 30)}t ${i.grade}`)
         .join(', ');
       return createXmlRow([
         s.date,
         s.saleNumber,
         s.customerName,
         itemsDesc,
         s.total,
         s.paidAmount,
         s.balance,
         s.paymentMethod || 'Cash',
       ]);
     })
     .join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 3: FARM EXPENSES LOG -->
 <Worksheet ss:Name="Farm Expenses Log">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="140"/>
   <Column ss:Width="220"/>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   ${createXmlRow(['Date', 'Voucher #', 'Category', 'Description & Particulars', 'Supplier / Payee', 'Disbursed From', 'Amount (₱)'], true)}
   ${periodExpenses.length === 0 ? createXmlRow(['No expense records for this period', '', '', '', '', '', 0]) : ''}
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
       ])
     )
     .join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 4: EGG INVENTORY & RECONCILIATION -->
 <Worksheet ss:Name="Egg Inventory &amp; Reconciliation">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="140"/>
   ${createXmlRow(['Date', 'Total Harvest', 'Rejects (Pcs)', 'Good Eggs (Pcs)', 'Good Trays', 'Variance Status', 'Collector / Staff'], true)}
   ${periodEggLogs.length === 0 ? createXmlRow(['No egg collection logs for this period', 0, 0, 0, 0, 'No Data', '']) : ''}
   ${periodEggLogs
     .map(l =>
       createXmlRow([
         l.date,
         l.totalCollection,
         l.rejects,
         l.usableEggs,
         Math.floor(l.usableEggs / 30),
         l.totalCollection === l.usableEggs + l.rejects ? 'Balanced' : 'Discrepancy',
         l.collectorName || 'Farm Caretaker',
       ])
     )
     .join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 5: PEST CONTROL SUPPLIES -->
 <Worksheet ss:Name="Pest Control Supplies">
  <Table>
   <Column ss:Width="160"/>
   <Column ss:Width="130"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="140"/>
   ${createXmlRow(['Supply Item Name', 'Category', 'Stock Qty', 'Unit', 'Unit Cost (₱)', 'Stock Value (₱)', 'Supplier / Notes'], true)}
   ${pestControlSupplies.length === 0
     ? createXmlRow(['No pest control supplies in inventory', 'Pest Control', 0, 'pcs', 0, 0, ''])
     : ''}
   ${pestControlSupplies
     .map(s =>
       createXmlRow([
         s.name,
         s.category.toUpperCase(),
         s.quantity,
         s.unit,
         s.costPerUnit,
         s.quantity * s.costPerUnit,
         s.supplier || 'Farm Supplier',
       ])
     )
     .join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 6: AUDIT TRAIL / ACTIVITY LOGS -->
 <Worksheet ss:Name="Audit Trail &amp; Activity Logs">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Column ss:Width="300"/>
   ${createXmlRow(['Timestamp', 'User Role', 'Action Type', 'Module', 'Log Details'], true)}
   ${periodLogs.length === 0 ? createXmlRow(['No activity logs captured for this period', '', '', '', '']) : ''}
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
</Workbook>`;

  // Create Blob & Trigger Multi-Sheet File Download
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `Kagala_Farm_MultiSheet_Report_${filter.periodType}_${new Date().toISOString().split('T')[0]}.xls`;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
