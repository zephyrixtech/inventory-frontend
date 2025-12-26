import { apiClient } from './apiClient';

export interface PackingListReportItem {
  _id: string;
  boxNumber: string;
  cargoNumber?: string;
  items: Array<{
    product?: {
      _id: string;
      name: string;
      code: string;
      description?: string;
    };
    quantity: number;
    description?: string;
    unitOfMeasure?: string;
  }>;
  totalQuantity: number;
  size?: string;
  description?: string;
  status: string;
  approvalStatus: string;
  store?: {
    _id: string;
    name: string;
  };
  toStore?: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const packingListReportService = {
  async getPackingListReport(from?: string, to?: string): Promise<PackingListReportItem[]> {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      
      console.log('Fetching packing list report with params:', { from, to });
      
      const response = await apiClient.get(`/reports/packing-lists?${params.toString()}`) as { data: PackingListReportItem[] };
      
      console.log('Packing list report response:', response);
      
      // Ensure we return an array
      const data = Array.isArray(response.data) ? response.data : [];
      
      console.log('Processed packing list data:', data.length, 'items');
      if (data.length > 0) {
        console.log('Sample packing list item:', data[0]);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching packing list report:', error);
      throw error;
    }
  }
};