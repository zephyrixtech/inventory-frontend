import { apiClient } from './apiClient';
import type { ApiListResponse, ApiResponse, StoreStock } from '@/types/backend';

export const storeStockService = {
  async list(params: { page?: number; limit?: number; search?: string; storeId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.storeId) query.append('storeId', params.storeId);

    const path = `/store-stock${query.toString() ? `?${query.toString()}` : ''}`;
    return apiClient.get<ApiListResponse<StoreStock>>(path);
  },

  async save(payload: { 
    productId: string; 
    storeId?: string; 
    quantity: number; 
    margin?: number; 
    currency?: 'INR' | 'AED';
    unitPrice?: number;
    transmissionData?: {
      originalPriceINR?: number;
      marginPercent?: number;
      unitPriceINR?: number;
      dpPriceAED?: number;
      maxMRPAED?: number;
      exchangeRate?: number;
      transmissionDate?: string;
      fromStoreId?: string;
      packingListId?: string;
    };
  }) {
    return apiClient.post<ApiResponse<StoreStock>>('/store-stock', payload);
  },

  async adjustQuantity(id: string, quantity: number) {
    return apiClient.put<ApiResponse<StoreStock>>(`/store-stock/${id}/quantity`, { quantity });
  },

  async update(id: string, payload: { 
    productId: string; 
    storeId?: string; 
    quantity: number; 
    margin?: number; 
    currency?: 'INR' | 'AED';
    unitPrice?: number;
    transmissionData?: {
      originalPriceINR?: number;
      marginPercent?: number;
      unitPriceINR?: number;
      dpPriceAED?: number;
      maxMRPAED?: number;
      exchangeRate?: number;
      transmissionDate?: string;
      fromStoreId?: string;
      packingListId?: string;
    };
  }) {
    return apiClient.put<ApiResponse<StoreStock>>(`/store-stock/${id}`, payload);
  }
};

