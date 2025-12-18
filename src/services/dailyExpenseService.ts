import { apiClient } from './apiClient';
import type { ApiListResponse, ApiResponse } from '@/types/backend';

export interface DailyExpense {
  id: string;
  supplier?: {
    id: string;
    name: string;
  };
  description: string;
  amount: number;
  date: string;
  type: 'purchase' | 'petty';
  paymentType?: 'cash' | 'card' | 'upi';
  transactionId?: string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface OpeningBalance {
  _id?: string;
  amount: number;
  description: string;
  date: string;
  totalExpenses: number;
  remainingBalance: number;
  createdBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  updatedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const dailyExpenseService = {
  async list(params: { page?: number; limit?: number; from?: string; to?: string; supplierId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.supplierId) query.append('supplierId', params.supplierId);

    const path = `/expenses${query.toString() ? `?${query.toString()}` : ''}`;
    return apiClient.get<ApiListResponse<DailyExpense>>(path);
  },

  async listOpeningBalances(params: { page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const path = `/expenses/opening-balance/list${query.toString() ? `?${query.toString()}` : ''}`;
    return apiClient.get<ApiListResponse<OpeningBalance>>(path);
  },

  async getCurrentOpeningBalance() {
    return apiClient.get<ApiResponse<OpeningBalance>>('/expenses/opening-balance/current');
  },

  async createOpeningBalance(payload: { amount: number; description: string }) {
    return apiClient.post<ApiResponse<OpeningBalance>>('/expenses/opening-balance', payload);
  },

  async updateOpeningBalance(id: string, payload: { amount: number; description: string }) {
    return apiClient.put<ApiResponse<OpeningBalance>>(`/expenses/opening-balance/${id}`, payload);
  },

  async deleteOpeningBalance(id: string) {
    return apiClient.delete<ApiResponse<{ success: boolean }>>(`/expenses/opening-balance/${id}`);
  },

  create(payload: {
    supplierId?: string;
    description: string;
    amount: number;
    date?: string;
    type: 'purchase' | 'petty';
    paymentType?: 'cash' | 'card' | 'upi';
    transactionId?: string;
  }) {
    return apiClient.post<ApiResponse<DailyExpense>>('/expenses', payload);
  },

  async update(id: string, payload: Partial<{
    supplierId?: string;
    description: string;
    amount: number;
    date?: string;
    type: 'purchase' | 'petty';
    paymentType?: 'cash' | 'card' | 'upi';
    transactionId?: string;
  }>) {
    return apiClient.put<ApiResponse<DailyExpense>>(`/expenses/${id}`, payload);
  },

  async delete(id: string) {
    return apiClient.delete<ApiResponse<{ success: boolean }>>(`/expenses/${id}`);
  }
};