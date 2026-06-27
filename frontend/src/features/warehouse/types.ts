export interface InventoryItem {
  id: string;
  item: string;
  quantity: number;
  minimumQuantity: number;
  supplier: string | null;
  price: number | string;
  lastUpdated: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean | 'true' | 'false';
}

export interface InventoryResponse {
  success: boolean;
  message: string;
  data: {
    items: InventoryItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
