import { apiClient } from './apiClient';
import type { ApiListResponse, ApiResponse } from '@/types/backend';

export interface PackingListItemInput {
  productId: string;
  quantity: number;
  description?: string;
  unitOfMeasure?: string;
}

export interface PackingListInput {
  boxNumber: string;
  storeId: string;
  toStoreId?: string;
  items: PackingListItemInput[];
  shipmentDate?: string;
  packingDate?: string;
  image1?: string;
  status?: 'india' | 'uae' | 'pending' | 'in_transit' | 'approved' | 'shipped' | 'rejected';
  approvalStatus?: 'draft' | 'approved';
  // New fields
  cargoNumber?: string;
  fabricDetails?: string;
  size?: string;
  description?: string;
}

export interface PackingList {
  _id: string;
  id?: string;
  company?: string;
  boxNumber: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      code: string;
    };
    quantity: number;
  }>;
  totalQuantity: number;
  image1?: string;
  shipmentDate?: string;
  packingDate?: string;
  store?: {
    _id: string;
    name: string;
    code: string;
  };
  toStore?: {
    _id: string;
    name: string;
    code: string;
  } | string;
  status: 'india' | 'uae' | 'pending' | 'in_transit' | 'approved' | 'shipped' | 'rejected';
  approvalStatus: 'draft' | 'approved';
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  // New fields
  cargoNumber?: string;
  fabricDetails?: string;
}

export const packingListService = {
  async list(params: { page?: number; limit?: number; status?: string; approvalStatus?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.approvalStatus && params.approvalStatus !== 'all') query.append('approvalStatus', params.approvalStatus);
    if (params.search) query.append('search', params.search);

    const path = `/packing-lists${query.toString() ? `?${query.toString()}` : ''}`;
    return apiClient.get<ApiListResponse<PackingList>>(path);
  },

  async get(id: string) {
    return apiClient.get<ApiResponse<PackingList>>(`/packing-lists/${id}`);
  },

  async create(payload: PackingListInput) {
    return apiClient.post<ApiResponse<PackingList>>('/packing-lists', payload);
  },

  async update(id: string, payload: Partial<PackingListInput>) {
    return apiClient.put<ApiResponse<PackingList>>(`/packing-lists/${id}`, payload);
  },

  async approve(id: string) {
    return apiClient.post<ApiResponse<PackingList>>(`/packing-lists/${id}/approve`);
  },

  async delete(id: string) {
    return apiClient.delete<ApiResponse<{ success: boolean }>>(`/packing-lists/${id}`);
  }
};