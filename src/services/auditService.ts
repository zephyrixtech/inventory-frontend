import { apiClient } from './apiClient';
import type { ApiListResponse } from '@/types/backend';

export interface AuditLog {
  id: string;
  _id: string; // fallback in case raw MongoDB id is passed
  user?: string;
  actionBy: string;
  role: string;
  scope: string;
  module: string;
  key: string;
  log: string;
  ipAddress: string;
  userAgent: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  location: string;
  transactionDate: string;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  scope?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const buildQueryString = (params: ListAuditLogsParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.scope && params.scope !== 'all') searchParams.set('scope', params.scope);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const auditService = {
  list(params: ListAuditLogsParams = {}) {
    const query = buildQueryString(params);
    return apiClient.get<ApiListResponse<AuditLog>>(`/audit-logs${query}`);
  }
};
