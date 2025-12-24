import { apiClient } from './apiClient';
import type {  ApiResponse } from '@/types/backend';

export interface Store {
  _id: string;
  id?: string;
  company: string;
  name: string;
  code: string;
  manager?: string;
  purchaser?: string;
  biller?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  ibanCode?: string;
  taxCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListStoresParams {
  search?: string;
  managerId?: string;
  userId?: string;
  userRole?: string;
}

export interface CreateStorePayload {
  name: string;
  code: string;
  managerId?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  ibanCode?: string;
  taxCode?: string;
}

export interface UpdateStorePayload extends Partial<CreateStorePayload> {
  isActive?: boolean;
}

export const storeService = {
  async listStores(params: ListStoresParams = {}) {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.managerId) queryParams.append('managerId', params.managerId);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.userRole) queryParams.append('userRole', params.userRole);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `/stores${queryString}`;
    
    // Enhanced debugging
    console.log('=== Store Service API Call ===');
    console.log('Store API call - params:', params);
    console.log('Store API call - queryParams:', queryParams.toString());
    console.log('Store API call - URL:', url);
    
    try {
      const response = await apiClient.get<ApiResponse<Store[]>>(url);
      console.log('Store API response data:', response.data);
      console.log('=== End Store Service API Call ===');
      return response;
    } catch (error) {
      console.error('Store API call failed:', error);
      throw error;
    }
  },

  async getStore(id: string) {
    return apiClient.get<ApiResponse<Store>>(`/stores/${id}`);
  },

  async createStore(payload: CreateStorePayload) {
    return apiClient.post<ApiResponse<Store>>('/stores', payload);
  },

  async updateStore(id: string, payload: UpdateStorePayload) {
    return apiClient.put<ApiResponse<Store>>(`/stores/${id}`, payload);
  },

  async deleteStore(id: string) {
    return apiClient.delete<ApiResponse<{ success: boolean }>>(`/stores/${id}`);
  }
};