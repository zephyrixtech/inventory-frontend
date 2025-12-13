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

export interface CategoryData {
  name: string;
  stock: number;
  fill?: string;
}

export interface SalesData {
  day: string;
  sales: number;
}

export interface InventoryAlert {
  itemName: string;
  currentQty: number;
  reorderLevel: number;
  maxLevel: number;
  alertType: 'low_stock' | 'excess_stock';
  severity: 'high' | 'medium' | 'low';
}

export interface MovingItem {
  name: string;
  avgQuantity: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  categoryData: CategoryData[];
  salesData: SalesData[];
  fastMovingItems: MovingItem[];
  slowMovingItems: MovingItem[];
  inventoryAlerts: InventoryAlert[];
}

export const dashboardService = {
  async getDashboardData() {
    return apiClient.get<ApiResponse<DashboardData>>('/dashboard');
  }
};