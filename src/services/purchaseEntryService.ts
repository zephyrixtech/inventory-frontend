import { apiClient } from './apiClient';

export interface PurchaseEntryItem {
  item: string;
  description?: string;
}

export interface PurchaseEntry {
  _id?: string;
  purchaseCode?: string;
  billNumber: string;
  date: string;
  supplier: string;
  items: PurchaseEntryItem[];
  totalAmount: number;
  discount: number;
  finalAmount?: number;
  paidAmount: number;
  balanceAmount?: number;
  notes?: string;
  createdBy?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseEntryStats {
  totalEntries: number;
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
  avgAmount: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

class PurchaseEntryService {
  private baseUrl = '/purchase-entries';

  async createPurchaseEntry(data: Omit<PurchaseEntry, '_id' | 'purchaseCode' | 'createdAt' | 'updatedAt' | 'finalAmount' | 'balanceAmount'>) {
    return apiClient.post<ApiResponse<PurchaseEntry>>(this.baseUrl, data);
  }

  async getPurchaseEntries(params?: {
    page?: number;
    limit?: number;
    search?: string;
    supplier?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.supplier) queryParams.append('supplier', params.supplier);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.get<ApiListResponse<PurchaseEntry>>(`${this.baseUrl}${queryString}`);
  }

  async getPurchaseEntryById(id: string) {
    return apiClient.get<ApiResponse<PurchaseEntry>>(`${this.baseUrl}/${id}`);
  }

  async updatePurchaseEntry(id: string, data: Partial<PurchaseEntry>) {
    return apiClient.put<ApiResponse<PurchaseEntry>>(`${this.baseUrl}/${id}`, data);
  }

  async deletePurchaseEntry(id: string) {
    return apiClient.delete<ApiResponse<{ success: boolean }>>(`${this.baseUrl}/${id}`);
  }

  async getPurchaseEntryStats() {
    return apiClient.get<ApiResponse<PurchaseEntryStats>>(`${this.baseUrl}/stats`);
  }
}

export const purchaseEntryService = new PurchaseEntryService();