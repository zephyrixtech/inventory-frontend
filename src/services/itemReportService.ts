import { apiClient } from './apiClient';

export type ItemReportRow = {
  itemId: string;
  itemName: string;
  itemDate: string | null;
  supplierName: string | null;
  packingListDetails: string | null;
  cargoNumber: string | null;
  shipmentDate: string | null;
  customerName: string | null;
};

export const itemReportService = {
  async getItemReport(params: {
    from?: string;
    to?: string;
    itemIds: string[];
  }): Promise<ItemReportRow[]> {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    query.append('itemIds', params.itemIds.join(','));

    const response = (await apiClient.get(`/reports/items?${query.toString()}`)) as {
      data: ItemReportRow[];
    };

    return Array.isArray(response?.data) ? response.data : [];
  }
};

