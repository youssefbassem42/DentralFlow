export interface DashboardReportData {
  patients: {
    total: number;
    registeredThisMonth: number;
  };
  doctors: {
    total: number;
    active: number;
  };
  appointments: {
    total: number;
    todayCount: number;
    statusBreakdown: {
      Scheduled: number;
      Completed: number;
      Cancelled: number;
      Missed: number;
    };
  };
  revenue: {
    total: number;
    thisMonth: number;
    paymentMethodBreakdown: {
      Cash: number;
      Visa: number;
      Insurance: number;
      Wallet: number;
    };
  };
  inventory: {
    totalItems: number;
    lowStockCount: number;
  };
}

export interface RevenueReportData {
  totalRevenue: number;
  paymentMethodBreakdown: {
    Cash: number;
    Visa: number;
    Insurance: number;
    Wallet: number;
  };
  transactionsCount: number;
  payments: Array<{
    id: string;
    invoiceNumber: string | null;
    amount: number;
    paymentMethod: 'Cash' | 'Visa' | 'Insurance' | 'Wallet';
    paymentDate: string;
  }>;
}

export interface InventoryReportData {
  totalItemsCount: number;
  lowStockCount: number;
  totalWarehouseValue: number;
  suppliersBreakdown: Array<{
    supplier: string;
    itemsCount: number;
    totalQuantity: number;
  }>;
  lowStockItems: Array<{
    id: string;
    item: string;
    quantity: number;
    minimumQuantity: number;
    supplier: string | null;
    price: number;
  }>;
  allCatalogItems: Array<{
    id: string;
    item: string;
    quantity: number;
    minimumQuantity: number;
    supplier: string | null;
    price: number;
    isLowStock: boolean;
  }>;
}
