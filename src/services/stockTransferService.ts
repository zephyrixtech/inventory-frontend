import { apiClient } from './apiClient';
import type { ApiListResponse, ApiResponse, StockTransfer } from '@/types/backend';

export const stockTransferService = {
  async list(params: { page?: number; limit?: number; status?: string; fromStoreId?: string; toStoreId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.status) query.append('status', params.status);
    if (params.fromStoreId) query.append('fromStoreId', params.fromStoreId);
    if (params.toStoreId) query.append('toStoreId', params.toStoreId);

    const path = `/stock-transfers${query.toString() ? `?${query.toString()}` : ''}`;
    return apiClient.get<ApiListResponse<StockTransfer>>(path);
  },

  async create(payload: {
    fromStoreId: string;
    toStoreId: string;
    productId: string;
    quantity: number;
    notes?: string;
  }) {
    return apiClient.post<ApiResponse<StockTransfer>>('/stock-transfers', payload);
  },

  async approve(id: string) {
    return apiClient.post<ApiResponse<StockTransfer>>(`/stock-transfers/${id}/approve`);
  }
};

