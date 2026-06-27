import api from '@/lib/api';
import type {
  InventoryItem,
  InventoryFilters,
  InventoryResponse,
} from './types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getInventory = async (params?: InventoryFilters): Promise<InventoryResponse> => {
  return api.get('/inventory', {
    params: {
      ...params,
      lowStock: params?.lowStock !== undefined ? String(params.lowStock) : undefined,
    },
  });
};

export const createInventoryItem = async (
  data: Omit<InventoryItem, 'id' | 'lastUpdated' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<InventoryItem>> => {
  return api.post('/inventory', data);
};

export const updateInventoryItem = async (
  id: string,
  data: Partial<Omit<InventoryItem, 'id' | 'lastUpdated' | 'createdBy' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<InventoryItem>> => {
  return api.patch(`/inventory/${id}`, data);
};

export const deleteInventoryItem = async (id: string): Promise<ApiResponse<null>> => {
  return api.delete(`/inventory/${id}`);
};
