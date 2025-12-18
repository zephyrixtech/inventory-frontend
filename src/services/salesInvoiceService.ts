import { apiClient } from './apiClient';
import type { ApiListResponse, ApiResponse } from '@/types/backend';

export interface SalesInvoiceItem {
  item: string | { _id: string; name: string; code?: string };
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  vat?: number; // VAT percentage (0-100)
  vatAmount?: number; // Calculated VAT amount
  totalPrice: number;
}

export interface SalesInvoice {
  email: any;
  _id: string;
  id?: string;
  company?: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: string | { _id: string; name: string; customerId?: string; email?: string; phone?: string };
  store: string | { _id: string; name: string; code?: string };
  subTotal: number;
  discountTotal: number;
  vatTotal?: number; // Total VAT amount for all items
  netAmount: number;
  taxAmount: number;
  notes?: string;
  createdBy?: string;
  items: SalesInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesInvoicePayload {
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string;
  storeId: string;
  items: Array<{
    itemId: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    vat?: number; // VAT percentage (0-100)
  }>;
  taxAmount?: number;
  notes?: string;
}

export interface UpdateSalesInvoicePayload {
  invoiceDate?: string;
  items?: Array<{
    itemId: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    vat?: number; // VAT percentage (0-100)
  }>;
  taxAmount?: number;
  notes?: string;
}

export interface ListSalesInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const salesInvoiceService = {
  async listInvoices(params: ListSalesInvoicesParams = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.customerId && params.customerId !== 'all') queryParams.append('customerId', params.customerId);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.get<ApiListResponse<SalesInvoice>>(`/sales-invoices${queryString}`);
  },

  async getInvoice(id: string) {
    return apiClient.get<ApiResponse<SalesInvoice>>(`/sales-invoices/${id}`);
  },

  async createInvoice(payload: CreateSalesInvoicePayload) {
    return apiClient.post<ApiResponse<SalesInvoice>>('/sales-invoices', payload);
  },

  async updateInvoice(id: string, payload: UpdateSalesInvoicePayload) {
    return apiClient.put<ApiResponse<SalesInvoice>>(`/sales-invoices/${id}`, payload);
  },

  async deleteInvoice(id: string) {
    return apiClient.delete<ApiResponse<{ success: boolean }>>(`/sales-invoices/${id}`);
  }
};

