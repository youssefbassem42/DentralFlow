import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Package,
  Calendar,
  Users,
  Printer,
  Filter,
  Loader2,
  FileSpreadsheet,
  AlertOctagon,
  CreditCard,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import {
  getDashboardReport,
  getRevenueReport,
  getInventoryReport,
} from './api';

export function ReportsPage() {
  const { user } = useAuth();

  // Tabs: 'dashboard' | 'revenue' | 'inventory'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'revenue' | 'inventory'>('dashboard');

  // Revenue filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Role Access Guard
  const isAdmin = user?.role === 'ADMIN';

  // Fetch Dashboard Stats
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['report-dashboard'],
    queryFn: getDashboardReport,
    enabled: isAdmin && activeTab === 'dashboard',
  });
  const dbReport = dashboardData?.data;

  // Fetch Revenue Report
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['report-revenue', startDate, endDate],
    queryFn: () => getRevenueReport({ startDate: startDate || undefined, endDate: endDate || undefined }),
    enabled: isAdmin && activeTab === 'revenue',
  });
  const revReport = revenueData?.data;

  // Fetch Inventory Report
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: getInventoryReport,
    enabled: isAdmin && activeTab === 'inventory',
  });
  const invReport = inventoryData?.data;

  // Access Denied Shield
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4">
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full">
          <AlertOctagon size={48} />
        </div>
        <h3 className="text-xl font-extrabold text-foreground">Access Denied</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The reports module compiles confidential clinical and billing logs and is restricted to administrators.
        </p>
      </div>
    );
  }

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export helper (real CSV download)
  const handleExportCSV = () => {
    try {
      let csvContent = '';
      let filename = 'report.csv';

      if (activeTab === 'revenue' && revReport) {
        filename = `Revenue_Report_${startDate || 'all'}_to_${endDate || 'all'}.csv`;
        csvContent = 'Invoice Number,Amount ($),Payment Method,Date\n';
        revReport.payments.forEach((p) => {
          csvContent += `"${p.invoiceNumber || 'N/A'}",${p.amount},"${p.paymentMethod}","${new Date(
            p.paymentDate
          ).toLocaleDateString()}"\n`;
        });
      } else if (activeTab === 'inventory' && invReport) {
        filename = 'Inventory_Catalog_Report.csv';
        csvContent = 'Item Name,Quantity,Min Threshold,Price ($),Supplier,Status\n';
        invReport.allCatalogItems.forEach((i) => {
          csvContent += `"${i.item}",${i.quantity},${i.minimumQuantity},${i.price},"${i.supplier || 'N/A'}","${
            i.isLowStock ? 'Low Stock' : 'Good'
          }"\n`;
        });
      } else {
        toast.error('Export not supported for the dashboard overview tab.');
        return;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('CSV exported successfully.');
    } catch {
      toast.error('Failed to export CSV.');
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 print:p-0">
      {/* ------------------ REPORT CONTROLS BAR ------------------ */}
      <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-sm print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeTab === 'dashboard'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            Dashboard Analytics
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              activeTab === 'revenue'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            <TrendingUp size={12} /> Revenue & Billing
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            <Package size={12} /> Supply Inventory
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-end">
          {activeTab !== 'dashboard' && (
            <button
              onClick={handleExportCSV}
              className="bg-surface hover:bg-surface-container-low border border-outline-variant text-foreground py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" /> Export Excel (CSV)
            </button>
          )}
          <button
            onClick={handlePrint}
            className="bg-surface hover:bg-surface-container-low border border-outline-variant text-foreground py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* ------------------ PRINT TITLE COVER (VISIBLE ONLY WHEN PRINTING) ------------------ */}
      <div className="hidden print:block border-b border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold text-black uppercase tracking-wide">DentalFlow - Analytical Reports</h1>
        <p className="text-xs text-black/60 mt-1">Generated by Admin User on {new Date().toLocaleString()}</p>
      </div>

      {/* ------------------ TAB: DASHBOARD REPORT ------------------ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {isLoadingDashboard ? (
            <div className="flex items-center justify-center flex-col gap-2 text-muted-foreground py-16">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Compiling dashboard analytics...</p>
            </div>
          ) : (
            dbReport && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Patients */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Patients Index</span>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">{dbReport.patients.total}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        +{dbReport.patients.registeredThisMonth} registered this month
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                      <Users size={20} />
                    </div>
                  </div>

                  {/* Doctors */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Medical Practitioners</span>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">{dbReport.doctors.total}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {dbReport.doctors.active} active staff profiles
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg">
                      <Briefcase size={20} />
                    </div>
                  </div>

                  {/* Appointments */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Appointments Logs</span>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">{dbReport.appointments.total}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {dbReport.appointments.todayCount} sessions scheduled today
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
                      <Calendar size={20} />
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Clinic Revenue</span>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">
                        ${dbReport.revenue.total.toLocaleString()}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        ${dbReport.revenue.thisMonth.toLocaleString()} this month
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                </div>

                {/* Sub breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Appointment Status Breakdown */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-foreground border-b border-outline-variant pb-2">
                      Appointment Bookings Status
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(dbReport.appointments.statusBreakdown).map(([status, count]) => {
                        const total = dbReport.appointments.total || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={status} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{status}</span>
                              <span className="text-muted-foreground">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full bg-primary rounded-full"
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Revenue Payment Method breakdown */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-foreground border-b border-outline-variant pb-2">
                      Revenue Channels Breakdown
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(dbReport.revenue.paymentMethodBreakdown).map(([method, amount]) => {
                        const total = dbReport.revenue.total || 1;
                        const pct = Math.round((amount / total) * 100);
                        return (
                          <div key={method} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{method} Billing</span>
                              <span className="text-muted-foreground">
                                ${amount.toLocaleString()} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full bg-amber-500 rounded-full"
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ------------------ TAB: REVENUE & DATE FILTERS ------------------ */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Date Picker Toolbar */}
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Date Filter Range</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-rose-500 font-bold hover:underline ml-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {isLoadingRevenue ? (
            <div className="flex items-center justify-center flex-col gap-2 text-muted-foreground py-16">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Loading billing aggregates...</p>
            </div>
          ) : (
            revReport && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Filtered Net Revenue</span>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">
                        ${revReport.totalRevenue.toLocaleString()}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">Total revenue collected within range</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                      <TrendingUp size={22} />
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Transaction Receipts</span>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">{revReport.transactionsCount}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1">Total recorded invoice payments</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
                      <CreditCard size={22} />
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Average Invoice Value</span>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">
                        $
                        {revReport.transactionsCount > 0
                          ? Math.round(revReport.totalRevenue / revReport.transactionsCount).toLocaleString()
                          : 0}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">Calculated per transactions average</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg">
                      <Layers size={22} />
                    </div>
                  </div>
                </div>

                {/* Main transactions list */}
                <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-outline-variant bg-surface-container-low font-bold text-xs text-foreground uppercase tracking-wide">
                    Ledging Logs
                  </div>
                  <div className="overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="p-3 pl-4">Invoice Ref</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Payment Method</th>
                          <th className="p-3">Payment Date</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                        {revReport.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-primary/5 transition-colors">
                            <td className="p-3 pl-4 font-mono font-bold text-primary">{p.invoiceNumber || 'N/A'}</td>
                            <td className="p-3 font-semibold">${p.amount.toLocaleString()}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-low border border-outline-variant">
                                {p.paymentMethod}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">{new Date(p.paymentDate).toLocaleString()}</td>
                          </tr>
                        ))}
                        {revReport.payments.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground font-semibold">
                              No payments found in selected date ranges.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ------------------ TAB: WAREHOUSE REPORTS ------------------ */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {isLoadingInventory ? (
            <div className="flex items-center justify-center flex-col gap-2 text-muted-foreground py-16">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Loading supply summaries...</p>
            </div>
          ) : (
            invReport && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Inventory Valuation</span>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">
                        ${invReport.totalWarehouseValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">Total value of all stocked items</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg">
                      <Layers size={22} />
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Catalog Items</span>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">{invReport.totalItemsCount}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1">Unique item categories registered</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
                      <Package size={22} />
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Reorder Alerts</span>
                      <h3 className="text-2xl font-extrabold text-rose-500 mt-1">{invReport.lowStockCount}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1">Items at or below critical threshold</p>
                    </div>
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-lg">
                      <AlertOctagon size={22} />
                    </div>
                  </div>
                </div>

                {/* Sub tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Suppliers Breakdown */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-outline-variant bg-surface-container-low font-bold text-xs text-foreground uppercase tracking-wide">
                      Suppliers Breakdown
                    </div>
                    <div className="overflow-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <th className="p-3 pl-4">Supplier Partner</th>
                            <th className="p-3">Product Catalog Count</th>
                            <th className="p-3">Total Quantities Supplied</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                          {invReport.suppliersBreakdown.map((s) => (
                            <tr key={s.supplier} className="hover:bg-primary/5 transition-colors">
                              <td className="p-3 pl-4 font-semibold">{s.supplier}</td>
                              <td className="p-3 font-semibold text-primary">{s.itemsCount} products</td>
                              <td className="p-3 font-bold text-muted-foreground">{s.totalQuantity} units</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Low Stock Items List */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-outline-variant bg-surface-container-low font-bold text-xs text-foreground uppercase tracking-wide">
                      Low Stock / Critical Items
                    </div>
                    <div className="overflow-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <th className="p-3 pl-4">Item Name</th>
                            <th className="p-3">Current Stock</th>
                            <th className="p-3">Min Threshold</th>
                            <th className="p-3">Unit Price</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                          {invReport.lowStockItems.map((i) => (
                            <tr key={i.id} className="bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                              <td className="p-3 pl-4 font-semibold text-rose-700 dark:text-rose-400">{i.item}</td>
                              <td className="p-3 font-bold text-rose-700 dark:text-rose-400">{i.quantity} units</td>
                              <td className="p-3 text-muted-foreground">{i.minimumQuantity} units</td>
                              <td className="p-3 font-semibold">${i.price}</td>
                            </tr>
                          ))}
                          {invReport.lowStockItems.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-muted-foreground font-semibold">
                                No items currently low in stock.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
