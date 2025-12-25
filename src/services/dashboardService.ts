import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/backend';

export interface DashboardMetrics {
  totalItems: number;
  totalValue: number;
  totalPurchaseOrders: number;
  totalPurchaseOrderValue: number;
  totalSalesInvoices: number; // Added this new metric
  totalSalesInvoiceValue: number; // Added this new metric
}

export interface SalesData {
  day: string;
  sales: number;
}

export interface PurchaseEntryData {
  day: string;
  purchases: number;
}

export interface MovingItem {
  name: string;
  avgQuantity: number;
}

export interface ItemStockData {
  name: string;
  stock: number;
  fill?: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  itemStockData: ItemStockData[]; // Changed from categoryData to itemStockData
  salesData: SalesData[];
  purchaseEntryData: PurchaseEntryData[]; // Added purchase entry data
  fastMovingItems: MovingItem[];
  slowMovingItems: MovingItem[];
}

export const dashboardService = {
  async getDashboardData() {
    return apiClient.get<ApiResponse<DashboardData>>('/dashboard');
  }
};