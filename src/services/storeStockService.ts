import { apiClient } from './apiClient';
import type { ApiListResponse, ApiResponse, StoreStock } from '@/types/backend';

// Helper function to get user role from localStorage
const getUserRole = (): string | null => {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.role_name || user.role || null;
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
  }
  return null;
};

export const storeStockService = {
  async list(params: { page?: number; limit?: number; search?: string; storeId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.storeId) query.append('storeId', params.storeId);

    // Add user role to the request (this will be handled by the auth middleware on backend)
    const userRole = getUserRole();
    if (userRole) {
      query.append('userRole', userRole);
    }

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

