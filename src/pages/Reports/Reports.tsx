import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  TooltipProvider
} from "@/components/ui/tooltip";
import { format } from 'date-fns';
import {
  CalendarIcon,
  ChartNoAxesCombined,
  Download,
  FileText,
  Printer,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { setPrintData } from '@/redux/features/PurchaseOrderReportPrintSlice';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux';
import { ICompany } from '@/Utils/constants';

import { supplierService } from '@/services/supplierService';
import { storeService } from '@/services/storeService';
import { getItems } from '@/services/itemService';
import { apiClient } from '@/services/apiClient';
import { storeStockService } from '@/services/storeStockService';
import { salesInvoiceService } from '@/services/salesInvoiceService';
import { packingListReportService, type PackingListReportItem } from '@/services/packingListReportService';
import type { Supplier } from '@/types/backend';
import type { Store } from '@/services/storeService';
import type { StoreStock } from '@/types/backend';



// Type Definitions - using imported types

interface PurchaseOrderItem {
  _id: string;
  itemId: string;
  itemName: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  totalValue: number;
  supplier: {
    _id: string;
    name: string;
  };
  orderDate: string; // item created_at date
  status: string;
}

// Sales Report Type Definitions
// type SalesStatus = 'Completed' | 'Pending' | 'Cancelled' | 'Processing' | 'Refunded';

// type SalesReportItem = {
//   id: string;
//   invoice_date: string | null;
//   invoice_number: string | null;
//   invoice_amount: number | null;
//   discount_amount: number | null;
//   tax_amount: number;
//   net_amount: number | null;
// };

type ISalesInvoiceWithTax = {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  discountAmount: number;
  netAmount: number;
  tax_amount: number;
  net_amount: number; // calculated field
  items?: any[]; // Include items array for print preview
  total_items?: number;
  [key: string]: any; // Allow additional properties from original invoice
};
type InventoryStockReport = {
  _id: string;
  itemId: string;
  itemName: string;
  storeName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
};

// Packing List Report Type Definition
interface PackingListReport {
  title: string;
  headers: readonly [
    'Box/Bora Number',
    'Item Description',
    'Quantity',
    'Size',
    'Cargo Number',
    'Remarks'
  ];
  data: PackingListReportItem[];
}

interface SalesReport {
  title: string;
  headers: readonly [
    'Date',
    'Invoice #',
    'Gross Amount',
    'Discount',
    'Tax Amount',
    'Net Amount',
  ];
  data: ISalesInvoiceWithTax[];
}

interface StockReport {
  title: string;
  headers: readonly [
    'Item ID',
    'Item Name',
    'Store Name',
    'Quantity',
    'Unit Price',
    'Total Value',
  ];
  data: InventoryStockReport[];
}

// Purchase Order Report Type Definition
interface PurchaseOrderReport {
  title: string;
  headers: readonly [
    'Item Name',
    'Supplier',
    'Order Date',
    'Quantity',
    'Unit Price',
    'Total Value'
  ];
  data: PurchaseOrderItem[];
}

// Combined Report Data Type
interface ReportData {
  'sales': SalesReport;
  'stock': StockReport;
  'purchase-order': PurchaseOrderReport;
  'packing-list': PackingListReport;
}

// Type for report types
type ReportType = 'sales' | 'stock' | 'purchase-order' | 'packing-list';

type SortFieldSales = 'invoice_date' | 'invoice_number' | 'invoice_amount' | 'net_amount';
type SortField = 'itemName' | 'supplier.name' | 'orderDate' | 'quantity' | 'unitPrice' | 'totalValue';
type SortFieldStock = 'itemId' | 'itemName' | 'storeName' | 'quantity' | 'unitPrice';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

interface SortConfigSales {
  field: SortFieldSales | null;
  direction: SortDirection;
}

interface SortConfigStock {
  field: SortFieldStock | null;
  direction: SortDirection;
}

interface Pagination {
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SalesPaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

// Summary Statistics Interface
interface SummaryStats {
  totalOrders: number;
  totalValue: number;
  pendingDelivery: number;
}

// Sales Summary Statistics Interface
interface SalesSummaryStats {
  totalSales: number;
  totalSalesValue: number;
}

// Sales Summary Statistics Interface
interface StockSummaryStats {
  totalStock: number;
  totalStockValue: number;
}

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<ReportType | ''>('');
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Debug: Log suppliers when they change
  useEffect(() => {
    console.log('Suppliers state updated:', suppliers);
    console.log('Number of suppliers:', suppliers.length);
  }, [suppliers]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>([]);
  const [fullPurchaseOrders, setFullPurchaseOrders] = useState<PurchaseOrderItem[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalOrders: 0,
    totalValue: 0,
    pendingDelivery: 0,
  });
  const [salesSummaryStats, setSalesSummaryStats] = useState<SalesSummaryStats>({
    totalSales: 0,
    totalSalesValue: 0,
  });
  const [stockSummaryStats, setStockSummaryStats] = useState<StockSummaryStats>({
    totalStock: 0,
    totalStockValue: 0,
  });
  const [statusMessages] = useState<{ [key: string]: string }>({});
  const [userData, setUserData] = useState<{ 
    company_id: string, 
    company_data: ICompany,
    role?: string | { name?: string; role_name?: string },
    role_name?: string,
    id?: string,
    _id?: string
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [searchQuerySales, setSearchQuerySales] = useState('');
  const [currentPageSales, setCurrentPageSales] = useState(1);
  const [itemsPerPageSales, setItemsPerPageSales] = useState(10);
  const [salesPagination, setSalesPagination] = useState<SalesPaginationData>({
    currentPage: 1,
    totalPages: 0,
    total: 0,
    itemsPerPage: 10
  });
  const [searchQueryStock, setSearchQueryStock] = useState('');
  const [currentPageStock, setCurrentPageStock] = useState(1);
  const [itemsPerPageStock, setItemsPerPageStock] = useState(10);
  const [stockPagination, setStockPagination] = useState<SalesPaginationData>({
    currentPage: 1,
    totalPages: 0,
    total: 0,
    itemsPerPage: 10
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'orderDate',
    direction: 'desc',
  });
  const [sortConfigSales, setSortConfigSales] = useState<SortConfigSales>({
    field: 'invoice_date',
    direction: 'desc',
  });
  const [sortConfigStock, setSortConfigStock] = useState<SortConfigStock>({
    field: null,
    direction: null,
  });
  const [allSales, setAllSales] = useState<ISalesInvoiceWithTax[]>([])
  const [paginatedSales, setPaginatedSales] = useState<ISalesInvoiceWithTax[]>([])
  const [paginatedStocks, setPaginatedStocks] = useState<InventoryStockReport[]>([])
  const [allStocks, setAllStocks] = useState<InventoryStockReport[]>([])
  const [allStores, setAllStores] = useState<Store[]>([])
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  
  // Packing List Report State
  const [allPackingLists, setAllPackingLists] = useState<PackingListReportItem[]>([]);
  const [paginatedPackingLists, setPaginatedPackingLists] = useState<PackingListReportItem[]>([]);
  const [packingListSummaryStats, setPackingListSummaryStats] = useState({
    totalPackingLists: 0,
    totalItems: 0,
  });
  const [searchQueryPackingList, setSearchQueryPackingList] = useState('');
  const [currentPagePackingList, setCurrentPagePackingList] = useState(1);
  const [itemsPerPagePackingList, setItemsPerPagePackingList] = useState(10);
  const [packingListPagination, setPackingListPagination] = useState<SalesPaginationData>({
    currentPage: 1,
    totalPages: 0,
    total: 0,
    itemsPerPage: 10
  });

  // Debug: Log paginatedSales when it changes (moved after state declaration)
  useEffect(() => {
    console.log('🔍 paginatedSales state updated:', paginatedSales);
    console.log('🔍 paginatedSales length:', paginatedSales.length);
  }, [paginatedSales]);

  /**
   * Get available report types based on user role
   * - Admin/SuperAdmin: All report types
   * - Purchaser: Purchase Order, Stock, Packing List reports
   * - Biller: Sales and Stock reports
   */
  const getAvailableReportTypes = useCallback(() => {
    // Use the same role extraction logic as ProtectedRoute component
    let userRole = 'biller'; // default fallback
    
    if (userData) {
      if (typeof userData.role === 'string') {
        userRole = userData.role;
      } else if (userData.role && typeof userData.role === 'object') {
        userRole = userData.role.name || userData.role.role_name || 'biller';
      } else if (userData.role_name) {
        userRole = userData.role_name;
      }
    }
    
    console.log('🔐 User role for report filtering:', userRole);
    console.log('🔐 Raw userData:', userData);

    const reportTypes = [
      { value: 'purchase-order', label: 'Purchase Order Report', roles: ['admin', 'superadmin', 'purchaser'] },
      { value: 'sales', label: 'Sales Report', roles: ['admin', 'superadmin', 'biller'] },
      { value: 'stock', label: 'Stock Report', roles: ['admin', 'superadmin', 'purchaser', 'biller'] },
      { value: 'packing-list', label: 'Packing List Report', roles: ['admin', 'superadmin', 'purchaser'] }
    ];

    // If no role is found or role is admin/superadmin, return all report types
    if (!userRole || userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'superadmin') {
      console.log('🔐 Admin/SuperAdmin access - showing all report types');
      return reportTypes;
    }

    // Filter report types based on user role
    const filteredReports = reportTypes.filter(reportType => 
      reportType.roles.includes(userRole.toLowerCase())
    );
    
    console.log('🔐 Filtered report types for role', userRole, ':', filteredReports.map(r => r.value));
    return filteredReports;
  }, [userData]);

  /**
   * Extract user role from userData using the same logic as ProtectedRoute
   * @returns {string} User role (defaults to 'biller')
   */
  const getUserRole = useCallback(() => {
    let userRole = 'biller'; // default fallback
    
    if (userData) {
      if (typeof userData.role === 'string') {
        userRole = userData.role;
      } else if (userData.role && typeof userData.role === 'object') {
        userRole = userData.role.name || userData.role.role_name || 'biller';
      } else if (userData.role_name) {
        userRole = userData.role_name;
      }
    }
    
    return userRole;
  }, [userData]);

  /**
   * Fetch supplier-item relationships from the API
   * This creates a mapping between items and their associated suppliers
   * Used for filtering items by supplier in purchase order reports
   * 
   * @returns Array of supplier-item relationship objects with item_id and supplier_id
   */
  const fetchSupplierItems = useCallback(async () => {
    try {
      console.log('Fetching supplier-item relationships...');
      
      // Use the correct endpoint based on documentation: /supplier-items
      const response = await apiClient.get('/supplier-items?limit=1000');
      const data = (response as any).data || (response as any) || [];
      console.log(`✅ Fetched ${data.length} supplier-item relationships`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching supplier-items:', error);
      // Return empty array if endpoint doesn't exist - items might have direct vendor field
      return [];
    }
  }, []);

  const reportData: ReportData = {
    'sales': {
      title: 'Sales Report',
      headers: [
        'Date',
        'Invoice #',
        'Gross Amount',
        'Discount',
        'Tax Amount',
        'Net Amount',
      ] as const,
      data: allSales
    },
    'stock': {
      title: 'Stock Report',
      headers: [
        'Item ID',
        'Item Name',
        'Store Name',
        'Quantity',
        'Unit Price',
        'Total Value',
      ] as const,
      data: allStocks
    },
    'purchase-order': {
      title: 'Purchase Order Report',
      headers: [
        'Item Name',
        'Supplier',
        'Order Date',
        'Quantity',
        'Unit Price',
        'Total Value'
      ] as const,
      data: fullPurchaseOrders
    },
    'packing-list': {
      title: 'Packing List Report',
      headers: [
        'Box/Bora Number',
        'Item Description',
        'Quantity',
        'Size',
        'Cargo Number',
        'Remarks'
      ] as const,
      data: allPackingLists
    }
  };

  // Type-safe helper function for getting report data
  const getReportData = <T extends ReportType>(reportType: T): ReportData[T] => {
    return reportData[reportType];
  };

  // Fetch summary statistics for purchase orders
  const fetchSummaryStats = useCallback(async () => {
    const companyId = userData?.company_id || (userData as any)?.companyId || (userData as any)?.id;
    if (!companyId || selectedReportType !== 'purchase-order') {
      console.log('⚠️ fetchSummaryStats early return:', { companyId, selectedReportType });
      return;
    }

    try {
      console.log('Fetching summary stats...');
      
      // Step 1: Items already have vendor field with supplier information
      // No need to fetch supplier-items relationships - use item.vendor directly
      console.log('Using item.vendor field directly for supplier relationships');
      
      // Fetch all items without pagination for summary
      const itemFilters: any = {};
      const itemsResponse = await getItems(1, 1000, itemFilters);
      
      if (!itemsResponse.data || itemsResponse.data.length === 0) {
        console.log('No items found for summary stats');
        setSummaryStats({
          totalOrders: 0,
          totalValue: 0,
          pendingDelivery: 0,
        });
        return;
      }

      console.log('Total items for summary:', itemsResponse.data.length);

      // Filter items by date range and supplier selection
      let filteredItems = itemsResponse.data.filter((item: any) => {
        // Check date range using item's createdAt (this is the primary filter)
        if (dateRange[0] || dateRange[1]) {
          // Items use createdAt field (not created_at) - API returns createdAt
          const itemCreatedAt = item.createdAt || item.created_at;
          if (!itemCreatedAt) return false; // Skip items without creation date
          
          const itemDate = new Date(itemCreatedAt);
          const start = dateRange[0] ? new Date(dateRange[0]) : null;
          const end = dateRange[1] ? new Date(dateRange[1]) : null;
          
          // Set time to start/end of day for proper date comparison
          if (start) {
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (end) {
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }

        // Check supplier filter using item.vendor field directly
        if (selectedSuppliers.length > 0) {
          // Get supplier ID from item.vendor field
          const itemVendorId = item.vendor?._id || item.vendor?.id || item.vendor;
          if (!itemVendorId || !selectedSuppliers.includes(itemVendorId)) {
            return false;
          }
        } else {
          // If no suppliers selected, only show items that have a vendor
          if (!item.vendor) {
            return false;
          }
        }

        return true;
      });

      console.log('Filtered items for summary:', filteredItems.length);

      // Calculate summary statistics
      const totalOrders = filteredItems.length;
      const totalValue = filteredItems.reduce((sum, item) => {
        const unitPrice = item.unitPrice || (item as any).selling_price || 0;
        const quantity = (item as any).availableQuantity || item.availableStock || (item as any).quantity || 1;
        return sum + (unitPrice * quantity);
      }, 0);
      
      // For pendingDelivery, count items that are active (assuming active items are pending)
      const pendingDelivery = filteredItems.filter(item => (item as any).isActive !== false).length;

      console.log('Summary stats calculated:', { totalOrders, totalValue, pendingDelivery });

      setSummaryStats({
        totalOrders,
        totalValue,
        pendingDelivery,
      });

    } catch (error) {
      console.error('Error fetching summary stats:', error);
      setSummaryStats({
        totalOrders: 0,
        totalValue: 0,
        pendingDelivery: 0,
      });
    }
  }, [userData, dateRange, selectedSuppliers, selectedReportType, fetchSupplierItems]);

  /**
   * Fetch and filter purchase order items based on date range and supplier selection
   * 
   * Flow:
   * 1. Fetch supplier-item relationships to create item->supplier mapping
   * 2. If suppliers are selected, get item IDs that belong to those suppliers
   * 3. Fetch all items (with search filter if provided)
   * 4. Filter items by:
   *    - Date range: items created_at must be within selected date range
   *    - Supplier: items must belong to selected suppliers (via supplier-items table)
   * 5. Transform items to PurchaseOrderItem format with supplier information
   * 6. Apply sorting and pagination
   * 
   * @param queryParams - URL search params containing filters, pagination, and sorting
   */
  const fetchPurchaseOrderItems = useCallback(async (queryParams: URLSearchParams) => {
    try {
      setIsLoading(true);
      
      // Extract parameters from queryParams
      const page = parseInt(queryParams.get('page') || '1');
      const limit = parseInt(queryParams.get('limit') || '10');
      const startDate = queryParams.get('startDate');
      const endDate = queryParams.get('endDate');
      const selectedSupplierIds = queryParams.get('suppliers')?.split(',') || [];
      const search = queryParams.get('search');
      const sortField = queryParams.get('sortField') || 'created_at';
      const sortDirection = queryParams.get('sortDirection') || 'desc';

      console.log('Fetching items with parameters:', {
        page,
        limit,
        startDate,
        endDate,
        selectedSupplierIds,
        search
      });

      // Step 1: Items already have vendor field with supplier information
      // No need to fetch supplier-items relationships - use item.vendor directly
      console.log('Using item.vendor field directly for supplier relationships');

      // Step 4: Fetch items with filters
      const itemFilters: any = {};
      if (search) itemFilters.search = search;

      console.log('Calling getItems with filters:', itemFilters);
      
      // Get a large number of items to ensure we get all items for filtering
      let itemsResponse;
      try {
        itemsResponse = await getItems(1, 1000, itemFilters);
        console.log('✅ getItems call successful');
      } catch (error: any) {
        console.error('❌ getItems call failed:', error);
        setErrorMessage(`Failed to fetch items: ${error?.message || 'Unknown error'}`);
        setPurchaseOrders([]);
        setPagination({
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        });
        return;
      }
      
      console.log('Items API response structure:', {
        hasData: !!itemsResponse.data,
        dataType: typeof itemsResponse.data,
        isArray: Array.isArray(itemsResponse.data),
        dataLength: itemsResponse.data?.length,
        fullResponse: itemsResponse
      });
      
      if (!itemsResponse.data || itemsResponse.data.length === 0) {
        console.log('❌ No items found from API');
        console.log('Items response was:', itemsResponse);
        setPurchaseOrders([]);
        setPagination({
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        });
        return;
      }

      console.log('Total items fetched:', itemsResponse.data.length);
      console.log('Sample item structure:', itemsResponse.data[0]);
     

      // Step 5: Create suppliers map from the suppliers state
      const suppliersMap = new Map<string, Supplier>();
      suppliers.forEach(supplier => {
        suppliersMap.set(supplier._id, supplier);
      });

      console.log('Available suppliers:', Array.from(suppliersMap.keys()));

      // Step 6: Filter items by date range and supplier selection
      let filteredItems = itemsResponse.data.filter((item: any) => {
        // Check date range using item's createdAt (this is the primary filter)
        if (startDate || endDate) {
          // Items use createdAt field - API returns createdAt
          const itemCreatedAt = (item as any).createdAt || (item as any).created_at;
          if (!itemCreatedAt) {
            console.log('Item missing creation date:', (item as any).id || item._id);
            return false; // Skip items without creation date
          }
          
          const itemDate = new Date(itemCreatedAt);
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          
          // Set time to start/end of day for proper date comparison
          if (start) {
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (end) {
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }

        // Check supplier filter using item.vendor field directly
        if (selectedSupplierIds.length > 0) {
          // Get supplier ID from item.vendor field (handle different possible structures)
          const itemVendorId = (item as any).vendor?._id || (item as any).vendor?.id || (item as any).vendor;
          if (!itemVendorId || !selectedSupplierIds.includes(itemVendorId)) {
            return false;
          }
        } else {
          // If no suppliers selected, only show items that have a vendor
          if (!(item as any).vendor) {
            return false;
          }
        }

        return true;
      });

      console.log('Items after filtering:', filteredItems.length);
      
      // Debug: Log why items might be filtered out
      if (filteredItems.length === 0 && itemsResponse.data.length > 0) {
        console.warn('⚠️ No items matched filters. Debugging...');
        const sampleItem = itemsResponse.data[0];
        const sampleItemAny = sampleItem as any;
        console.log('Sample item:', {
          id: sampleItemAny.id || sampleItemAny._id,
          name: sampleItemAny.name,
          item_name: sampleItemAny.item_name,
          createdAt: sampleItemAny.createdAt,
          created_at: sampleItemAny.created_at,
          vendor: sampleItemAny.vendor,
          vendorId: sampleItemAny.vendor?._id || sampleItemAny.vendor?.id,
          selectedSupplierIds,
          matchesSupplier: selectedSupplierIds.length > 0 ? 
            selectedSupplierIds.includes(sampleItemAny.vendor?._id || sampleItemAny.vendor?.id) : 
            !!sampleItemAny.vendor
        });
        
        // Check date range
        if (startDate || endDate) {
          const sampleItemAny = sampleItem as any;
          const itemCreatedAt = sampleItemAny.createdAt || sampleItemAny.created_at;
          if (itemCreatedAt) {
            const itemDate = new Date(itemCreatedAt);
            console.log('Date check:', {
              itemDate: itemDate.toISOString(),
              startDate: startDate,
              endDate: endDate,
              beforeStart: startDate ? itemDate < new Date(startDate) : false,
              afterEnd: endDate ? itemDate > new Date(endDate) : false
            });
          } else {
            console.log('Item has no creation date');
          }
        }
      }

      // Step 7: Transform items to PurchaseOrderItem format
      const purchaseOrderItems: PurchaseOrderItem[] = filteredItems.map((item: any) => {
        // Get supplier from item.vendor field directly
        const itemVendor = item.vendor;
        const vendorId = itemVendor?._id || itemVendor?.id || itemVendor;
        const vendorName = itemVendor?.name || 'Unknown Supplier';
        
        // Try to get full supplier details from suppliersMap
        const supplier = vendorId ? suppliersMap.get(vendorId) : null;
        
        const supplierInfo = supplier ? {
          _id: supplier._id,
          name: supplier.name
        } : {
          _id: vendorId || 'no-supplier',
          name: vendorName
        };
        
        // Use correct field names from API response
        const itemName = item.name || item.item_name || 'Unnamed Item';
        const createdAt = item.created_at;
        const unitPrice = item.unitPrice || item.selling_price || 0;
        const quantity = item.availableStock || item.availableQuantity || item.quantity || 1;
        
        console.log(`Transforming item ${itemName}:`, {
          vendorId,
          vendorName,
          createdAt,
          unitPrice,
          quantity,
          itemVendor,
          rawItem: {
            id: (item as any).id,
            _id: item._id,
            code: (item as any).code,
            createdAt: (item as any).createdAt,
            created_at: (item as any).created_at,
            availableQuantity: (item as any).availableQuantity,
            isActive: (item as any).isActive
          }
        });
        
        // Validate date before using it
        if (!createdAt) {
          console.warn('⚠️ Item has no valid creation date:', itemName, 'Raw item:', item);
        }
        
        return {
          _id: (item as any).id || item._id,
          itemId: (item as any).code || (item as any).item_id || (item as any).id || item._id,
          itemName: itemName,
          description: (item as any).description || undefined,
          unitPrice: unitPrice,
          quantity: quantity,
          totalValue: unitPrice * quantity,
          supplier: supplierInfo,
          orderDate: createdAt || new Date().toISOString(), // Fallback to current date if missing
          status: (item as any).isActive !== false ? 'active' : 'inactive'
        };
      });

      console.log('Transformed purchase order items:', purchaseOrderItems.length);

      // Step 8: Apply sorting
      purchaseOrderItems.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'itemName':
            aValue = a.itemName;
            bValue = b.itemName;
            break;
          case 'supplier.name':
            aValue = a.supplier.name;
            bValue = b.supplier.name;
            break;
          case 'orderDate':
            aValue = new Date(a.orderDate);
            bValue = new Date(b.orderDate);
            break;
          case 'quantity':
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case 'unitPrice':
            aValue = a.unitPrice;
            bValue = b.unitPrice;
            break;
          case 'totalValue':
            aValue = a.totalValue;
            bValue = b.totalValue;
            break;
          default:
            aValue = new Date(a.orderDate);
            bValue = new Date(b.orderDate);
        }

        if (sortDirection === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      // Step 9: Apply pagination to the filtered and sorted results
      const total = purchaseOrderItems.length;
      const totalPages = limit === 0 ? 1 : Math.ceil(total / limit);
      const startIndex = limit === 0 ? 0 : (page - 1) * limit;
      const endIndex = limit === 0 ? total : startIndex + limit;
      const paginatedItems = purchaseOrderItems.slice(startIndex, endIndex);

      console.log('Final paginated items:', paginatedItems.length);

      setPurchaseOrders(paginatedItems);
      setPagination({
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });

    } catch (error) {
      console.error('Error fetching purchase order items:', error);
      setErrorMessage('Failed to fetch purchase order items. Please try again.');
      setPurchaseOrders([]);
      setPagination({
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [suppliers, fetchSupplierItems]);

  // Removed debounce - we want immediate execution when generate is clicked

  const handlePrintPreview = async () => {
    try {
      setIsLoading(true);
      
      let printData;
      
      // For purchase order reports, fetch fresh data directly for printing
      if (selectedReportType === 'purchase-order') {
        console.log('🖨️ Fetching fresh purchase orders data for print preview...');
        
        const companyId = userData?.company_id || (userData as any)?.companyId || (userData as any)?.id;
        if (!companyId) {
          throw new Error('Company ID not found');
        }

        // Fetch fresh data using the same logic as fetchFullPurchaseOrders
        const itemFilters: any = {};
        if (searchQuery.trim()) itemFilters.search = searchQuery.trim();

        const itemsResponse = await getItems(1, 1000, itemFilters);
        
        if (!itemsResponse.data || itemsResponse.data.length === 0) {
          throw new Error('No items found for printing');
        }

        // Create suppliers map
        const suppliersMap = new Map<string, Supplier>();
        suppliers.forEach(supplier => {
          suppliersMap.set(supplier._id, supplier);
        });

        // Filter items by date range and supplier selection
        let filteredItems = itemsResponse.data.filter((item: any) => {
          // Check date range using item's createdAt
          if (dateRange[0] || dateRange[1]) {
            const itemCreatedAt = (item as any).createdAt || (item as any).created_at;
            if (!itemCreatedAt) return false;
            
            const itemDate = new Date(itemCreatedAt);
            const start = dateRange[0] ? new Date(dateRange[0]) : null;
            const end = dateRange[1] ? new Date(dateRange[1]) : null;
            
            if (start) {
              start.setHours(0, 0, 0, 0);
              if (itemDate < start) return false;
            }
            if (end) {
              end.setHours(23, 59, 59, 999);
              if (itemDate > end) return false;
            }
          }

          // Check supplier filter using item.vendor field directly
          if (selectedSuppliers.length > 0) {
            const itemVendorId = item.vendor?._id || item.vendor?.id || item.vendor;
            if (!itemVendorId || !selectedSuppliers.includes(itemVendorId)) {
              return false;
            }
          } else {
            if (!item.vendor) {
              return false;
            }
          }

          return true;
        });

        // Transform items to PurchaseOrderItem format
        const freshPurchaseOrderItems: PurchaseOrderItem[] = filteredItems.map(item => {
          const itemVendor = (item as any).vendor;
          const vendorId = itemVendor?._id || itemVendor?.id || itemVendor;
          const vendorName = itemVendor?.name || 'Unknown Supplier';
          
          const supplier = vendorId ? suppliersMap.get(vendorId) : null;
          
          const supplierInfo = supplier ? {
            _id: supplier._id,
            name: supplier.name
          } : {
            _id: vendorId || 'no-supplier',
            name: vendorName
          };
          
          const itemName = item.name || (item as any).item_name || 'Unnamed Item';
          const createdAt = (item as any).createdAt || (item as any).created_at;
          const unitPrice = item.unitPrice || (item as any).selling_price || 0;
          const quantity = (item as any).availableQuantity || item.availableStock || (item as any).quantity || 1;
          
          return {
            _id: (item as any).id || item._id,
            itemId: (item as any).code || (item as any).item_id || (item as any).id || item._id,
            itemName: itemName,
            description: (item as any).description || undefined,
            unitPrice: unitPrice,
            quantity: quantity,
            totalValue: unitPrice * quantity,
            supplier: supplierInfo,
            orderDate: createdAt || new Date().toISOString(),
            status: (item as any).isActive !== false ? 'active' : 'inactive'
          };
        });

        // Apply sorting
        const sortField = sortConfig.field || 'orderDate';
        const sortDirection = sortConfig.direction || 'desc';
        
        freshPurchaseOrderItems.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (sortField) {
            case 'itemName':
              aValue = a.itemName;
              bValue = b.itemName;
              break;
            case 'supplier.name':
              aValue = a.supplier.name;
              bValue = b.supplier.name;
              break;
            case 'orderDate':
              aValue = new Date(a.orderDate);
              bValue = new Date(b.orderDate);
              break;
            case 'quantity':
              aValue = a.quantity;
              bValue = b.quantity;
              break;
            case 'unitPrice':
              aValue = a.unitPrice;
              bValue = b.unitPrice;
              break;
            case 'totalValue':
              aValue = a.totalValue;
              bValue = b.totalValue;
              break;
            default:
              aValue = new Date(a.orderDate);
              bValue = new Date(b.orderDate);
          }

          if (sortDirection === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          } else {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          }
        });

        console.log('🖨️ Fresh purchase orders for print:', freshPurchaseOrderItems.length);
        console.log('🖨️ Sample items:', freshPurchaseOrderItems.slice(0, 3).map(item => ({
          itemName: item.itemName,
          supplier: item.supplier.name,
          totalValue: item.totalValue
        })));

        printData = {
          ...reportData,
          'purchase-order': {
            ...reportData['purchase-order'],
            data: freshPurchaseOrderItems
          }
        };
      } else {
        // For other report types, use existing data
        printData = selectedReportType === 'sales' 
          ? { ...reportData, 'sales': { ...reportData['sales'], data: allSales } }
          : selectedReportType === 'stock' 
            ? { ...reportData, 'stock': { ...reportData['stock'], data: allStocks } }
            : selectedReportType === 'packing-list'
              ? { ...reportData, 'packing-list': { ...reportData['packing-list'], data: allPackingLists } }
              : reportData;
      }

      dispatch(setPrintData({
        reportData: printData,
        selectedReportType: selectedReportType as ReportType,
        dateRange: dateRange,
        statusMessages: statusMessages
      } as any));

      // Navigate to the print preview page
      navigate('/dashboard/report/preview');
    } catch (error: any) {
      console.error('Error preparing print preview:', error);
      setErrorMessage(`Failed to prepare print preview: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch full (unpaginated) purchase orders for PrintPreview
  const fetchFullPurchaseOrders = useCallback(async () => {
    const companyId = userData?.company_id || (userData as any)?.companyId || (userData as any)?.id;
    if (!companyId || selectedReportType !== 'purchase-order') {
      console.log('⚠️ fetchFullPurchaseOrders early return:', { companyId, selectedReportType });
      return;
    }

    try {
      console.log('Fetching full purchase orders for print preview...');
      
      // Step 1: Items already have vendor field with supplier information
      // No need to fetch supplier-items relationships - use item.vendor directly
      console.log('Using item.vendor field directly for supplier relationships');

      // Step 4: Fetch items with search filter
      const itemFilters: any = {};
      if (searchQuery.trim()) itemFilters.search = searchQuery.trim();

      const itemsResponse = await getItems(1, 1000, itemFilters);
      
      if (!itemsResponse.data || itemsResponse.data.length === 0) {
        setFullPurchaseOrders([]);
        return;
      }

      // Step 5: Create suppliers map
      const suppliersMap = new Map<string, Supplier>();
      suppliers.forEach(supplier => {
        suppliersMap.set(supplier._id, supplier);
      });

      // Step 6: Filter items by date range and supplier selection
      let filteredItems = itemsResponse.data.filter((item: any) => {
        // Check date range using item's createdAt (this is the primary filter)
        if (dateRange[0] || dateRange[1]) {
          // Items use createdAt field - API returns createdAt
          const itemCreatedAt = (item as any).createdAt || (item as any).created_at;
          if (!itemCreatedAt) return false; // Skip items without creation date
          
          const itemDate = new Date(itemCreatedAt);
          const start = dateRange[0] ? new Date(dateRange[0]) : null;
          const end = dateRange[1] ? new Date(dateRange[1]) : null;
          
          // Set time to start/end of day for proper date comparison
          if (start) {
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (end) {
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }

        // Check supplier filter using item.vendor field directly
        if (selectedSuppliers.length > 0) {
          // Get supplier ID from item.vendor field (handle different possible structures)
          const itemVendorId = item.vendor?._id || item.vendor?.id || item.vendor;
          if (!itemVendorId || !selectedSuppliers.includes(itemVendorId)) {
            return false;
          }
        } else {
          // If no suppliers selected, only show items that have a vendor
          if (!item.vendor) {
            return false;
          }
        }

        return true;
      });

      // Step 7: Transform items to PurchaseOrderItem format
      const purchaseOrderItems: PurchaseOrderItem[] = filteredItems.map(item => {
        // Get supplier from item.vendor field directly
        const itemVendor = (item as any).vendor;
        const vendorId = itemVendor?._id || itemVendor?.id || itemVendor;
        const vendorName = itemVendor?.name || 'Unknown Supplier';
        
        // Try to get full supplier details from suppliersMap
        const supplier = vendorId ? suppliersMap.get(vendorId) : null;
        
        const supplierInfo = supplier ? {
          _id: supplier._id,
          name: supplier.name
        } : {
          _id: vendorId || 'no-supplier',
          name: vendorName
        };
        
        // Use correct field names from API response
        const itemName = item.name || (item as any).item_name || 'Unnamed Item';
        const createdAt = (item as any).createdAt || (item as any).created_at;
        const unitPrice = item.unitPrice || (item as any).selling_price || 0;
        const quantity = (item as any).availableQuantity || item.availableStock || (item as any).quantity || 1;
        
        return {
          _id: (item as any).id || item._id,
          itemId: (item as any).code || (item as any).item_id || (item as any).id || item._id,
          itemName: itemName,
          description: (item as any).description || undefined,
          unitPrice: unitPrice,
          quantity: quantity,
          totalValue: unitPrice * quantity,
          supplier: supplierInfo,
          orderDate: createdAt || new Date().toISOString(), // Fallback to current date if missing
          status: (item as any).isActive !== false ? 'active' : 'inactive'
        };
      });

      // Step 8: Apply sorting
      const sortField = sortConfig.field || 'orderDate';
      const sortDirection = sortConfig.direction || 'desc';
      
      purchaseOrderItems.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'itemName':
            aValue = a.itemName;
            bValue = b.itemName;
            break;
          case 'supplier.name':
            aValue = a.supplier.name;
            bValue = b.supplier.name;
            break;
          case 'orderDate':
            aValue = new Date(a.orderDate);
            bValue = new Date(b.orderDate);
            break;
          case 'quantity':
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case 'unitPrice':
            aValue = a.unitPrice;
            bValue = b.unitPrice;
            break;
          case 'totalValue':
            aValue = a.totalValue;
            bValue = b.totalValue;
            break;
          default:
            aValue = new Date(a.orderDate);
            bValue = new Date(b.orderDate);
        }

        if (sortDirection === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      console.log('Full purchase orders fetched:', purchaseOrderItems.length);
      setFullPurchaseOrders(purchaseOrderItems);

    } catch (error) {
      console.error('Error fetching full purchase orders:', error);
      setFullPurchaseOrders([]);
    }
  }, [userData, dateRange, selectedSuppliers, searchQuery, sortConfig, selectedReportType, fetchSupplierItems, suppliers]);

  // Fetch all sales invoices for the given date range
  const fetchAllSales = useCallback(async () => {
    try {
      console.log('📊 Fetching all sales invoices...');
      
      if (!dateRange[0] || !dateRange[1]) {
        console.log('⚠️ No date range provided, setting empty sales data');
        setAllSales([]);
        setSalesSummaryStats({ totalSales: 0, totalSalesValue: 0 });
        return;
      }

      // Format dates for API
      const dateFrom = format(dateRange[0], 'yyyy-MM-dd');
      const dateTo = format(dateRange[1], 'yyyy-MM-dd');
      
      console.log('📅 Fetching sales invoices from', dateFrom, 'to', dateTo);

      // Fetch all sales invoices (use a large limit to get all)
      let allInvoices: any[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 1000; // Large limit to fetch all

      while (hasMore) {
        try {
          console.log(`📄 Fetching page ${page}...`);
          const response = await salesInvoiceService.listInvoices({
            page,
            limit,
            dateFrom,
            dateTo,
            sortBy: 'invoiceDate',
            sortOrder: 'desc',
          });

          console.log('📦 API Response:', {
            hasData: !!response.data,
            dataLength: response.data?.length || 0,
            hasMeta: !!response.meta,
            meta: response.meta
          });

          // Handle different response structures
          let invoices: any[] = [];
          if (response && response.data && Array.isArray(response.data)) {
            invoices = response.data;
          } else if (Array.isArray(response)) {
            invoices = response;
          }

          if (invoices.length > 0) {
            allInvoices = [...allInvoices, ...invoices];
            console.log(`✅ Added ${invoices.length} invoices. Total: ${allInvoices.length}`);
          }
          
          // Check if there are more pages
          if (response.meta) {
            hasMore = response.meta.hasNextPage || false;
            if (hasMore) {
              page++;
            } else {
              console.log('📄 No more pages to fetch');
              hasMore = false;
            }
          } else {
            hasMore = false;
          }

          // Safety check to prevent infinite loops
          if (page > 100) {
            console.warn('⚠️ Reached maximum page limit (100), stopping pagination');
            hasMore = false;
          }
        } catch (pageError: any) {
          console.error(`❌ Error fetching page ${page}:`, pageError);
          hasMore = false;
        }
      }

      console.log(`✅ Fetched ${allInvoices.length} total sales invoices`);

      // Transform to ISalesInvoiceWithTax format
      const transformedSales: ISalesInvoiceWithTax[] = allInvoices.map((invoice: any) => {
        const invoiceAmount = invoice.subTotal || 0;
        const discountAmount = invoice.discountTotal || 0;
        const taxAmount = invoice.taxAmount || 0;
        const netAmount = invoice.netAmount || 0;

        return {
          _id: invoice._id || invoice.id,
          invoiceNumber: invoice.invoiceNumber || '',
          invoiceDate: invoice.invoiceDate || invoice.invoice_date || new Date().toISOString(),
          invoiceAmount,
          discountAmount,
          netAmount,
          tax_amount: taxAmount,
          net_amount: netAmount,
          // Include all original invoice data for print preview
          ...invoice,
          // Ensure items array is preserved
          items: invoice.items || [],
          total_items: invoice.items?.length || 0,
        };
      });

      // Apply search filter if provided
      const filteredSales = searchQuerySales
        ? transformedSales.filter((invoice) =>
            invoice.invoiceNumber.toLowerCase().includes(searchQuerySales.toLowerCase())
          )
        : transformedSales;

      setAllSales(filteredSales);

      // Calculate summary statistics
      const totalSales = filteredSales.length;
      const totalSalesValue = filteredSales.reduce((sum, invoice) => sum + (invoice.net_amount || 0), 0);

      setSalesSummaryStats({
        totalSales,
        totalSalesValue,
      });

      console.log('📊 Sales summary stats:', { totalSales, totalSalesValue });
    } catch (error: any) {
      console.error('❌ Error fetching sales invoices:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        data: error?.response?.data
      });
      setAllSales([]);
      setSalesSummaryStats({ totalSales: 0, totalSalesValue: 0 });
      setErrorMessage(`Failed to fetch sales data: ${error?.message || 'Unknown error'}`);
    }
  }, [dateRange, searchQuerySales]);

  // Fetch paginated sales data
  const fetchAllPaginatedSales = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('📄 Fetching paginated sales invoices...');
      
      if (!dateRange[0] || !dateRange[1]) {
        console.log('⚠️ No date range provided, setting empty paginated sales');
        setPaginatedSales([]);
        setSalesPagination({
          currentPage: 1,
          totalPages: 0,
          total: 0,
          itemsPerPage: itemsPerPageSales,
        });
        setIsLoading(false);
        return;
      }

      // Format dates for API
      const dateFrom = format(dateRange[0], 'yyyy-MM-dd');
      const dateTo = format(dateRange[1], 'yyyy-MM-dd');
      
      console.log('📅 Paginated fetch - Date range:', dateFrom, 'to', dateTo);
      
      // Determine sort field mapping
      let sortBy = 'invoiceDate';
      if (sortConfigSales.field === 'invoice_number') {
        sortBy = 'invoiceNumber';
      } else if (sortConfigSales.field === 'invoice_amount') {
        sortBy = 'subTotal';
      } else if (sortConfigSales.field === 'net_amount') {
        sortBy = 'netAmount';
      }

      console.log('🔍 Fetch params:', {
        page: currentPageSales,
        limit: itemsPerPageSales,
        dateFrom,
        dateTo,
        search: searchQuerySales || undefined,
        sortBy,
        sortOrder: sortConfigSales.direction || 'desc',
      });

      const response = await salesInvoiceService.listInvoices({
        page: currentPageSales,
        limit: itemsPerPageSales,
        dateFrom,
        dateTo,
        search: searchQuerySales || undefined,
        sortBy,
        sortOrder: sortConfigSales.direction || 'desc',
      });

      console.log('📦 Paginated API Response:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        dataLength: response?.data?.length || 0,
        hasMeta: !!response?.meta,
        meta: response?.meta
      });

      // Handle different response structures
      let invoices: any[] = [];
      if (response && response.data && Array.isArray(response.data)) {
        invoices = response.data;
      } else if (Array.isArray(response)) {
        invoices = response;
      }

      if (invoices.length > 0) {
        // Transform to ISalesInvoiceWithTax format
        const transformedSales: ISalesInvoiceWithTax[] = invoices.map((invoice: any) => {
          const invoiceAmount = invoice.subTotal || 0;
          const discountAmount = invoice.discountTotal || 0;
          const taxAmount = invoice.taxAmount || 0;
          const netAmount = invoice.netAmount || 0;

          return {
            _id: invoice._id || invoice.id,
            invoiceNumber: invoice.invoiceNumber || '',
            invoiceDate: invoice.invoiceDate || invoice.invoice_date || new Date().toISOString(),
            invoiceAmount,
            discountAmount,
            netAmount,
            tax_amount: taxAmount,
            net_amount: netAmount,
            // Include all original invoice data for print preview
            ...invoice,
            // Ensure items array is preserved
            items: invoice.items || [],
            total_items: invoice.items?.length || 0,
          };
        });

        console.log('🔍 Setting paginatedSales with data:', transformedSales);
        console.log('🔍 transformedSales length:', transformedSales.length);
        setPaginatedSales(transformedSales);

        // Update pagination
        if (response.meta) {
          setSalesPagination({
            currentPage: response.meta.page || currentPageSales,
            totalPages: response.meta.totalPages || 1,
            total: response.meta.total || 0,
            itemsPerPage: itemsPerPageSales,
          });
        } else {
          setSalesPagination({
            currentPage: currentPageSales,
            totalPages: 1,
            total: transformedSales.length,
            itemsPerPage: itemsPerPageSales,
          });
        }

        console.log(`✅ Fetched ${transformedSales.length} paginated sales invoices`);
      } else {
        console.log('⚠️ No invoices found in response');
        setPaginatedSales([]);
        setSalesPagination({
          currentPage: 1,
          totalPages: 0,
          total: 0,
          itemsPerPage: itemsPerPageSales,
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching paginated sales invoices:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        data: error?.response?.data
      });
      setPaginatedSales([]);
      setSalesPagination({
        currentPage: 1,
        totalPages: 0,
        total: 0,
        itemsPerPage: itemsPerPageSales,
      });
      setErrorMessage(`Failed to fetch paginated sales data: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, currentPageSales, itemsPerPageSales, searchQuerySales, sortConfigSales]);

  // Sorting function for sales report
  const handleSortSales = (field: SortFieldSales) => {
    let direction: SortDirection = 'asc';

    if (sortConfigSales.field === field) {
      if (sortConfigSales.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfigSales.direction === 'desc') {
        direction = null;
      } else {
        direction = 'asc';
      }
    }

    setSortConfigSales({ field: direction ? field : null, direction });
    setCurrentPageSales(1);
  };

  // Get icon function for sales report
  const getSortIconSales = (field: SortFieldSales) => {
    if (sortConfigSales.field !== field || !sortConfigSales.direction) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }

    return sortConfigSales.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  // Main fetchData function for paginated purchase orders
  const fetchData = useCallback(async () => {
    console.log('🔍 fetchData called', {
      hasUserData: !!userData,
      company_id: userData?.company_id,
      companyId: (userData as any)?.companyId,
      id: (userData as any)?.id,
      selectedReportType,
      dateRange,
      selectedSuppliers
    });

    // Check if we have user data (try multiple possible fields)
    const companyId = userData?.company_id || (userData as any)?.companyId || (userData as any)?.id;
    if (!companyId || selectedReportType !== 'purchase-order') {
      console.log('⚠️ fetchData early return:', { companyId, selectedReportType });
      return;
    }

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const queryParams = new URLSearchParams({
      companyId: companyId,
      page: currentPage.toString(),
      limit: itemsPerPage === -1 ? '0' : itemsPerPage.toString(),
      ...(dateRange[0] && { startDate: formatDate(dateRange[0]) }),
      ...(dateRange[1] && { endDate: formatDate(dateRange[1]) }),
      ...(selectedSuppliers.length > 0 && { suppliers: selectedSuppliers.join(',') }),
      ...(searchQuery.trim() && { search: searchQuery.trim() }),
      sortField: sortConfig.field || 'orderDate',
      sortDirection: sortConfig.direction || 'desc'
    });

    console.log('📋 Calling fetchPurchaseOrderItems with params:', Object.fromEntries(queryParams));
    // Call directly instead of debounced to ensure immediate execution
    await fetchPurchaseOrderItems(queryParams);
  }, [userData, dateRange, selectedSuppliers, searchQuery, sortConfig, currentPage, itemsPerPage, selectedReportType, fetchPurchaseOrderItems]);



  // Fetch paginated inventory stock report
  const fetchPaginatedStock = useCallback(async () => {
    if (selectedReportType !== 'stock' || selectedStores.length === 0) {
      setIsLoading(false);
      setPaginatedStocks([]);
      setStockPagination({
        currentPage: 1,
        totalPages: 0,
        total: 0,
        itemsPerPage: itemsPerPageStock,
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching paginated stock data for stores:', selectedStores);

      // Fetch stock data for each selected store
      const allStockPromises = selectedStores.map(storeId =>
        storeStockService.list({
          page: 1,
          limit: 1000, // Get all for filtering
          storeId: storeId,
          search: searchQueryStock.trim() || undefined
        })
      );

      const stockResponses = await Promise.all(allStockPromises);
      
      // Combine all stock data
      let allStockData: StoreStock[] = [];
      stockResponses.forEach(response => {
        if (response.data) {
          allStockData = [...allStockData, ...response.data];
        }
      });

      console.log('Total stock records fetched:', allStockData.length);

      // Transform StoreStock to InventoryStockReport format
      const stockReports: InventoryStockReport[] = allStockData.map((stock: StoreStock) => {
        const product = typeof stock.product === 'object' && stock.product !== null
          ? stock.product
          : null;
        const store = typeof stock.store === 'object' && stock.store !== null
          ? stock.store
          : null;

        // Handle different possible field names for product
        const productName = product?.name || (product as any)?.item_name || 'Unknown Item';
        const productCode = product?.code || product?.id || (product as any)?._id || 'N/A';
        const storeName = store?.name || (store as any)?.store_name || 'Unknown Store';

        return {
          _id: stock.id || (stock as any)._id,
          itemId: productCode,
          itemName: productName,
          storeName: storeName,
          quantity: stock.quantity || 0,
          unitPrice: stock.unitPrice || 0,
          totalValue: (stock.quantity || 0) * (stock.unitPrice || 0)
        };
      });

      // Apply date range filtering if provided
      let filteredStocks = stockReports;
      if (dateRange[0] || dateRange[1]) {
        // Note: StoreStock doesn't have a date field, so we'll skip date filtering for stock
        // If you need date filtering, you'd need to check stock.updatedAt or another date field
        filteredStocks = stockReports;
      }

      // Apply search filtering (already done in API, but can refine here)
      if (searchQueryStock.trim()) {
        const searchLower = searchQueryStock.toLowerCase();
        filteredStocks = filteredStocks.filter((stock: InventoryStockReport) =>
          stock.itemId.toLowerCase().includes(searchLower) ||
          stock.itemName.toLowerCase().includes(searchLower) ||
          stock.storeName.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      const sortField = sortConfigStock.field;
      const sortDirection = sortConfigStock.direction;
      
      if (sortField && sortDirection) {
        filteredStocks.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (sortField) {
            case 'itemId':
              aValue = a.itemId;
              bValue = b.itemId;
              break;
            case 'itemName':
              aValue = a.itemName;
              bValue = b.itemName;
              break;
            case 'storeName':
              aValue = a.storeName;
              bValue = b.storeName;
              break;
            case 'quantity':
              aValue = a.quantity;
              bValue = b.quantity;
              break;
            case 'unitPrice':
              aValue = a.unitPrice;
              bValue = b.unitPrice;
              break;
            default:
              return 0;
          }

          if (sortDirection === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          } else {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          }
        });
      }

      // Apply pagination
      const total = filteredStocks.length;
      const totalPages = itemsPerPageStock === -1 ? 1 : Math.ceil(total / itemsPerPageStock);
      const startIndex = itemsPerPageStock === -1 ? 0 : (currentPageStock - 1) * itemsPerPageStock;
      const endIndex = itemsPerPageStock === -1 ? total : startIndex + itemsPerPageStock;
      const paginatedItems = filteredStocks.slice(startIndex, endIndex);

      console.log('Paginated stock items:', paginatedItems.length, 'of', total);

      setPaginatedStocks(paginatedItems);
      setStockPagination({
        currentPage: currentPageStock,
        totalPages,
        total,
        itemsPerPage: itemsPerPageStock,
      });

    } catch (error: any) {
      console.error('Error fetching paginated stock:', error);
      setErrorMessage(`Failed to fetch stock data: ${error?.message || 'Unknown error'}`);
      setPaginatedStocks([]);
      setStockPagination({
        currentPage: 1,
        totalPages: 0,
        total: 0,
        itemsPerPage: itemsPerPageStock,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedReportType, selectedStores, searchQueryStock, sortConfigStock, currentPageStock, itemsPerPageStock, dateRange]);

  // Fetch all inventory stock for summary and export
  const fetchAllInventoryStock = useCallback(async () => {
    if (selectedReportType !== 'stock' || selectedStores.length === 0) {
      setAllStocks([]);
      setStockSummaryStats({ totalStock: 0, totalStockValue: 0 });
      return;
    }

    try {
      console.log('Fetching all stock data for stores:', selectedStores);

      // Fetch stock data for each selected store
      const allStockPromises = selectedStores.map(storeId =>
        storeStockService.list({
          page: 1,
          limit: 1000, // Get all for export
          storeId: storeId
        })
      );

      const stockResponses = await Promise.all(allStockPromises);
      
      // Combine all stock data
      let allStockData: StoreStock[] = [];
      stockResponses.forEach(response => {
        if (response.data) {
          allStockData = [...allStockData, ...response.data];
        }
      });

      console.log('Total stock records for export:', allStockData.length);

      // Transform StoreStock to InventoryStockReport format
      const stockReports: InventoryStockReport[] = allStockData.map((stock: StoreStock) => {
        const product = typeof stock.product === 'object' && stock.product !== null
          ? stock.product
          : null;
        const store = typeof stock.store === 'object' && stock.store !== null
          ? stock.store
          : null;

        // Handle different possible field names for product
        const productName = product?.name || (product as any)?.item_name || 'Unknown Item';
        const productCode = product?.code || product?.id || (product as any)?._id || 'N/A';
        const storeName = store?.name || (store as any)?.store_name || 'Unknown Store';

        return {
          _id: stock.id || (stock as any)._id,
          itemId: productCode,
          itemName: productName,
          storeName: storeName,
          quantity: stock.quantity || 0,
          unitPrice: stock.unitPrice || 0,
          totalValue: (stock.quantity || 0) * (stock.unitPrice || 0)
        };
      });

      // Apply date range filtering if provided (same as paginated)
      let filteredStocks = stockReports;
      if (dateRange[0] || dateRange[1]) {
        // Date filtering not applicable for stock reports
        filteredStocks = stockReports;
      }

      // Calculate summary statistics
      const totalStock = filteredStocks.length;
      const totalStockValue = filteredStocks.reduce((sum, stock) => sum + stock.totalValue, 0);

      console.log('Stock summary stats:', { totalStock, totalStockValue });

      setAllStocks(filteredStocks);
      setStockSummaryStats({
        totalStock,
        totalStockValue
      });

    } catch (error: any) {
      console.error('Error fetching all stock:', error);
      setAllStocks([]);
      setStockSummaryStats({ totalStock: 0, totalStockValue: 0 });
    }
  }, [selectedReportType, selectedStores, dateRange])

  // Fetch paginated packing list data
  const fetchPaginatedPackingLists = useCallback(async () => {
    if (selectedReportType !== 'packing-list') {
      setIsLoading(false);
      setPaginatedPackingLists([]);
      setPackingListPagination({
        currentPage: 1,
        totalPages: 0,
        total: 0,
        itemsPerPage: itemsPerPagePackingList,
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching paginated packing list data...');

      // Format dates for API
      const dateFrom = dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : undefined;
      const dateTo = dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : undefined;

      // Fetch packing list data
      const packingLists = await packingListReportService.getPackingListReport(dateFrom, dateTo);

      console.log('Total packing lists fetched:', packingLists.length);

      // Apply search filtering
      let filteredPackingLists = packingLists;
      if (searchQueryPackingList.trim()) {
        const searchLower = searchQueryPackingList.toLowerCase();
        filteredPackingLists = packingLists.filter((packingList: PackingListReportItem) =>
          (packingList.boxNumber || '').toLowerCase().includes(searchLower) ||
          (packingList.cargoNumber || '').toLowerCase().includes(searchLower) ||
          (packingList.items || []).some(item => 
            (item.product?.name || '').toLowerCase().includes(searchLower) ||
            (item.description || '').toLowerCase().includes(searchLower)
          )
        );
      }

      // Apply pagination
      const total = filteredPackingLists.length;
      const totalPages = itemsPerPagePackingList === -1 ? 1 : Math.ceil(total / itemsPerPagePackingList);
      const startIndex = itemsPerPagePackingList === -1 ? 0 : (currentPagePackingList - 1) * itemsPerPagePackingList;
      const endIndex = itemsPerPagePackingList === -1 ? total : startIndex + itemsPerPagePackingList;
      const paginatedItems = filteredPackingLists.slice(startIndex, endIndex);

      console.log('Paginated packing list items:', paginatedItems.length, 'of', total);

      setPaginatedPackingLists(paginatedItems);
      setPackingListPagination({
        currentPage: currentPagePackingList,
        totalPages,
        total,
        itemsPerPage: itemsPerPagePackingList,
      });

    } catch (error: any) {
      console.error('Error fetching paginated packing lists:', error);
      setErrorMessage(`Failed to fetch packing list data: ${error?.message || 'Unknown error'}`);
      setPaginatedPackingLists([]);
      setPackingListPagination({
        currentPage: 1,
        totalPages: 0,
        total: 0,
        itemsPerPage: itemsPerPagePackingList,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedReportType, searchQueryPackingList, currentPagePackingList, itemsPerPagePackingList, dateRange]);

  // Fetch all packing lists for summary and export
  const fetchAllPackingLists = useCallback(async () => {
    if (selectedReportType !== 'packing-list') {
      setAllPackingLists([]);
      setPackingListSummaryStats({ totalPackingLists: 0, totalItems: 0 });
      return;
    }

    try {
      console.log('Fetching all packing list data...');

      // Format dates for API
      const dateFrom = dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : undefined;
      const dateTo = dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : undefined;

      // Fetch packing list data
      const packingLists = await packingListReportService.getPackingListReport(dateFrom, dateTo);

      console.log('Total packing lists for export:', packingLists.length);

      // Calculate summary statistics
      const totalPackingLists = packingLists.length;
      const totalItems = packingLists.reduce((sum, packingList) => sum + (packingList.totalQuantity || 0), 0);

      console.log('Packing list summary stats:', { totalPackingLists, totalItems });

      setAllPackingLists(packingLists);
      setPackingListSummaryStats({
        totalPackingLists,
        totalItems
      });

    } catch (error: any) {
      console.error('Error fetching all packing lists:', error);
      setAllPackingLists([]);
      setPackingListSummaryStats({ totalPackingLists: 0, totalItems: 0 });
    }
  }, [selectedReportType, dateRange])

  // Sorting function for sales report
  const handleSortStock = (field: SortFieldStock) => {
    let direction: SortDirection = 'asc';

    if (sortConfigStock.field === field) {
      if (sortConfigStock.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfigStock.direction === 'desc') {
        direction = null;
      } else {
        direction = 'asc';
      }
    }

    setSortConfigStock({ field: direction ? field : null, direction });
    setCurrentPageStock(1);
  };

  // Get icon function for sales report
  const getSortIconStock = (field: SortFieldStock) => {
    if (sortConfigStock.field !== field || !sortConfigStock.direction) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }

    return sortConfigStock.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  /**
   * Generate report based on selected filters
   * 
   * For Purchase Order Reports:
   * - Validates date range and supplier selection are provided
   * - Fetches items filtered by:
   *   1. Date range (item.created_at within selected dates)
   *   2. Supplier ID (items linked to selected suppliers via supplier-items table)
   * - Generates paginated view, full data for export, and summary statistics
   */
  const handleGenerateReport = async () => {
    console.log('🚀 Starting report generation...');
    console.log('Report type:', selectedReportType);
    console.log('Date range:', dateRange);
    console.log('Selected suppliers:', selectedSuppliers);
    console.log('User data:', userData);
    
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (selectedReportType === 'purchase-order') {
        console.log('📊 Generating purchase order report...');
        // Fetch all three: paginated data for table, full data for export, and summary stats
        await Promise.all([fetchData(), fetchFullPurchaseOrders(), fetchSummaryStats()]);
        setIsReportGenerated(true);
        setIsLoading(false);
        console.log('✅ Purchase order report generated successfully');
      } else if (selectedReportType === 'sales') {
        console.log('📊 Generating sales report...');
        await Promise.all([fetchAllPaginatedSales(), fetchAllSales()]);
        setIsReportGenerated(true);
        setIsLoading(false);
        console.log('✅ Sales report generated successfully');
      } else if (selectedReportType === 'stock') {
        console.log('📊 Generating stock report...');
        await Promise.all([fetchPaginatedStock(), fetchAllInventoryStock()]);
        setIsReportGenerated(true);
        setIsLoading(false);
        console.log('✅ Stock report generated successfully');
      } else if (selectedReportType === 'packing-list') {
        console.log('📊 Generating packing list report...');
        await Promise.all([fetchPaginatedPackingLists(), fetchAllPackingLists()]);
        setIsReportGenerated(true);
        setIsLoading(false);
        console.log('✅ Packing list report generated successfully');
      } else {
        console.log('⚠️ Unknown report type, setting as generated');
        setIsReportGenerated(true);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Report generation failed:', error);
      setErrorMessage(`Report generation failed: ${error?.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Type-safe export to CSV function
  const exportToCSV = useCallback(async () => {
    if (!selectedReportType || !isReportGenerated) return;

    let csvContent = '';
    let filename = '';

    if (selectedReportType === 'purchase-order') {
      const headers = ['Item Name', 'Supplier', 'Order Date', 'Quantity', 'Unit Price', 'Total Value'];
      const rows = fullPurchaseOrders.map((item: PurchaseOrderItem) => [
        `"${item.itemName}"`,
        `"${item.supplier?.name || ''}"`,
        `"${format(new Date(item.orderDate), 'dd MMM yyyy')}"`,
        item.quantity,
        `"Rs ${item.unitPrice.toLocaleString('en-IN')}"`,
        `"Rs ${item.totalValue.toLocaleString('en-IN')}"`,
      ]);

      csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.join(','))
      ].join('\n');

      filename = `Purchase_Order_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    } else {
      // Handle other report types with proper typing
      const report = getReportData(selectedReportType);

      const headers = report.headers;
      const rows = report.data.map((item) => {
        if (selectedReportType === 'sales') {
          const salesItem = item as ISalesInvoiceWithTax;
          return [
            `"${format(new Date(salesItem.invoiceDate!), 'dd MMM yyyy')}"`,
            `"${salesItem.invoiceNumber}"`,
            `"${(salesItem.invoiceAmount ?? 0).toFixed(2)}"`,
            `"${(salesItem.discountAmount ?? 0).toFixed(2)}"`,
            `"${(salesItem.tax_amount ?? 0).toFixed(2)}"`,
            `"${(salesItem.net_amount ?? 0).toFixed(2)}"`,
          ];
        } else if (selectedReportType === 'stock') {
          const stockItem = item as unknown as InventoryStockReport;
          return [
            `"${stockItem.itemId}"`,
            `"${stockItem.itemName}"`,
            `"${stockItem.storeName}"`,
            `"${stockItem.quantity}"`,
            `"${stockItem.unitPrice}"`,
            `"${(stockItem.quantity * stockItem.unitPrice)}"`,
          ];
        } else if (selectedReportType === 'packing-list') {
          const packingListItem = item as unknown as PackingListReportItem;
          // Flatten items for CSV export
          return (packingListItem.items || []).map(packingItem => [
            `"${packingListItem.boxNumber || ''}"`,
            `"${packingItem.product?.name || 'Unknown Item'} - ${packingItem.description || ''}"`,
            `"${packingItem.quantity || 0}"`,
            `"${packingListItem.size || ''}"`,
            `"${packingListItem.cargoNumber || ''}"`,
            `"${packingListItem.description || ''}"`,
          ]).flat();
        }
        return [];
      });

      csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.join(','))
      ].join('\n');

      filename = `${report.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    }

    // Create CSV with proper UTF-8 BOM encoding
    const BOM = '\uFEFF'; // UTF-8 BOM
    const csvWithBOM = BOM + csvContent;

    // Trigger CSV download with proper encoding
    const blob = new Blob([csvWithBOM], {
      type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedReportType, isReportGenerated, userData, dateRange, selectedSuppliers, searchQuery, sortConfig]);

  // Fetch user data
  useEffect(() => {
    const mockUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    console.log('User data from localStorage:', mockUserData);
    console.log('Company ID available:', mockUserData?.company_id || mockUserData?.companyId || 'NOT FOUND');
    setUserData(mockUserData);
  }, []);

  // Validate selected report type when user data changes
  useEffect(() => {
    if (userData && selectedReportType) {
      const availableReportTypes = getAvailableReportTypes();
      const isCurrentReportTypeAvailable = availableReportTypes.some(
        reportType => reportType.value === selectedReportType
      );
      
      if (!isCurrentReportTypeAvailable) {
        console.log(`Report type '${selectedReportType}' not available for user role, resetting selection`);
        setSelectedReportType('');
        setIsReportGenerated(false);
      }
    }
  }, [userData, selectedReportType, getAvailableReportTypes]);



  // Fetch suppliers when component mounts
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        console.log('Fetching suppliers using supplierService...');
        
        const response = await supplierService.listSuppliers({
          page: 1,
          limit: 100,
          status: 'approved' // Only get approved suppliers
        });
        
        console.log('Suppliers API response:', response);
        
        if (response && response.data) {
          console.log('Suppliers data:', response.data);
          setSuppliers(response.data);
        } else {
          console.error('No suppliers data in response');
          setErrorMessage('No suppliers found');
        }
      } catch (err: any) {
        console.error('Error fetching suppliers:', err);
        setErrorMessage(err.message || 'An unexpected error occurred while fetching suppliers.');
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch stores data when component mounts
  useEffect(() => {
    const fetchStores = async () => {
      try {
        console.log('Fetching stores using storeService...');
        
        // Get user role and ID for role-based store filtering
        const userRole = getUserRole();
        const userId = userData?.id || userData?._id || userData?.company_id;
        
        console.log('🏪 Store filtering - User role:', userRole);
        console.log('🏪 Store filtering - User ID:', userId);
        
        // Prepare store service parameters based on role
        const storeParams: any = {};
        
        // Admin and SuperAdmin get all stores, others get role-filtered stores
        if (userRole.toLowerCase() !== 'admin' && userRole.toLowerCase() !== 'superadmin') {
          if (userId) {
            storeParams.userId = userId;
          }
          storeParams.userRole = userRole;
          console.log('🏪 Applying role-based store filtering for:', userRole);
        } else {
          console.log('🏪 Admin/SuperAdmin access - fetching all stores');
        }
        
        const response = await storeService.listStores(storeParams);
        
        console.log('Stores API response:', response);
        
        if (response && response.data) {
          console.log('🏪 Stores data filtered by role:', response.data);
          console.log('🏪 Number of stores available:', response.data.length);
          setAllStores(response.data);
        } else {
          console.error('No stores data in response');
          setErrorMessage('No stores found');
        }
      } catch (err: any) {
        console.error('Error fetching stores:', err);
        setErrorMessage(err.message || 'An unexpected error occurred while fetching stores.');
      }
    };

    // Only fetch stores if userData is available
    if (userData) {
      fetchStores();
    }
  }, [userData, getUserRole]); // Add getUserRole as dependency

  // Fetch data when relevant state changes
  useEffect(() => {
    if (isReportGenerated && selectedReportType === 'purchase-order') {
      fetchData();
      fetchFullPurchaseOrders();
      fetchSummaryStats();
    }
  }, [fetchData, fetchFullPurchaseOrders, fetchSummaryStats, isReportGenerated, selectedReportType]);

  useEffect(() => {
    if (isReportGenerated && selectedReportType === 'sales') {
      fetchAllPaginatedSales();
      fetchAllSales();
    }
  }, [fetchAllPaginatedSales, fetchAllSales, isReportGenerated, selectedReportType, sortConfigSales, searchQuerySales, currentPageSales, itemsPerPageSales, dateRange]);

  useEffect(() => {
    if (isReportGenerated && selectedReportType === 'stock') {
      fetchPaginatedStock();
      fetchAllInventoryStock();
    }
  }, [fetchPaginatedStock, fetchAllInventoryStock, isReportGenerated, selectedReportType, searchQueryStock, sortConfigStock, selectedStores, currentPageStock, itemsPerPageStock]);

  useEffect(() => {
    if (isReportGenerated && selectedReportType === 'packing-list') {
      fetchPaginatedPackingLists();
      fetchAllPackingLists();
    }
  }, [fetchPaginatedPackingLists, fetchAllPackingLists, isReportGenerated, selectedReportType, searchQueryPackingList, currentPagePackingList, itemsPerPagePackingList, dateRange]);

  const handleSort = (field: SortField) => {
    let direction: SortDirection = 'asc';

    if (sortConfig.field === field) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      } else {
        direction = 'asc';
      }
    }

    setSortConfig({ field: direction ? field : null, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field || !sortConfig.direction) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  const handleDateRangeChange = (range: [Date | null, Date | null]) => {
    setDateRange(range);
    setIsReportGenerated(false);
    setCurrentPage(1);
  };

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId) ? prev.filter((id) => id !== supplierId) : [...prev, supplierId]
    );
    setIsReportGenerated(false);
    setCurrentPage(1);
  };

  const handleStoreChange = (storeId: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
    setIsReportGenerated(false);
    setCurrentPageStock(1);
  };

  const handleSelectAllSuppliers = (checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(suppliers.map((s) => s._id));
    } else {
      setSelectedSuppliers([]);
    }
    setIsReportGenerated(false);
    setCurrentPage(1);
  };

  const handleSelectAllStores = (checked: boolean) => {
    if (checked) {
      setSelectedStores(allStores.map((s) => s._id));
    } else {
      setSelectedStores([]);
    }
    setIsReportGenerated(false);
    setCurrentPageStock(1);
  };

  const handleReportTypeChange = (value: string) => {
    // Validate the value is a valid report type
    const validReportTypes: ReportType[] = ['sales', 'stock', 'purchase-order', 'packing-list'];

    if (validReportTypes.includes(value as ReportType)) {
      setSelectedReportType(value as ReportType);
    } else {
      setSelectedReportType('');
    }

    setIsReportGenerated(false);
    setPurchaseOrders([]);
    setFullPurchaseOrders([]);
    setSummaryStats({ totalOrders: 0, totalValue: 0, pendingDelivery: 0 });
    setAllPackingLists([]);
    setPackingListSummaryStats({ totalPackingLists: 0, totalItems: 0 });
    setErrorMessage(null);
    setCurrentPage(1);
    setCurrentPagePackingList(1);
  };

  const handleFilterReset = () => {
    setSearchQuery('');
    setCurrentPage(1);
    setSearchQuerySales('');
    setCurrentPageSales(1);
    setSearchQueryStock('');
    setCurrentPageStock(1);
    setSearchQueryPackingList('');
    setCurrentPagePackingList(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };





  const isFormValid = dateRange[0] && dateRange[1] && selectedReportType && (selectedReportType === "purchase-order" ? selectedSuppliers.length > 0 : true) && (selectedReportType === 'stock' ? selectedStores.length > 0 : true);
  const isAllSuppliersSelected = selectedSuppliers.length === suppliers.length && suppliers.length > 0;
  const isAllStoresSelected = selectedStores.length === allStores.length && allStores.length > 0;
  const isIndeterminate = selectedSuppliers.length > 0 && selectedSuppliers.length < suppliers.length;
  const isStoreIndeterminate = selectedStores.length > 0 && selectedStores.length < allStores.length;

  return (
    <TooltipProvider>
      <div className="reports-page-container p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <Card className="min-h-[85vh] shadow-sm">
            <CardHeader className="rounded-t-lg border-b pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-blue-100 shadow-sm">
                    <ChartNoAxesCombined className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Reports</CardTitle>
                    <CardDescription className="mt-1">Generate and analyze inventory reports</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                  {errorMessage}
                </div>
              )}

              <Card className="mb-6 border border-blue-100 bg-blue-50 bg-opacity-50 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-blue-600" />
                      Configure Report
                    </h3>
                    <p className="text-gray-600 text-sm">Select parameters to generate your custom report</p>
                  </div>

                  <div className={`grid gap-4 items-end ${selectedReportType === 'purchase-order' || selectedReportType === 'stock' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Date Range <span className="text-red-500">*</span>
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!dateRange[0] ? 'text-gray-400' : ''}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange[0] ? (
                              dateRange[1] ? (
                                <>
                                  {format(dateRange[0], 'dd MMM')} - {format(dateRange[1], 'dd MMM, yyyy')}
                                </>
                              ) : (
                                format(dateRange[0], 'dd MMM, yyyy')
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={{
                              from: dateRange[0] || undefined,
                              to: dateRange[1] || undefined,
                            }}
                            onSelect={(range) => {
                              handleDateRangeChange([range?.from || null, range?.to || null]);
                            }}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Report Type <span className="text-red-500">*</span>
                      </label>
                      <Select value={selectedReportType} onValueChange={handleReportTypeChange}>
                        <SelectTrigger className="w-full bg-white border-gray-300">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableReportTypes().length > 0 ? (
                            getAvailableReportTypes().map((reportType) => (
                              <SelectItem key={reportType.value} value={reportType.value}>
                                {reportType.label}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1 text-sm text-gray-500">
                              No report types available for your role
                            </div>
                          )}
                          {/* <SelectItem value="supplier">Supplier Report</SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedReportType === 'purchase-order' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Supplier <span className="text-red-500">*</span></label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <Users className="mr-2 h-4 w-4" />
                              {selectedSuppliers.length === 0 ? (
                                <span className="text-gray-400">Select suppliers</span>
                              ) : selectedSuppliers.length === suppliers.length ? (
                                'All suppliers selected'
                              ) : selectedSuppliers.length === 1 ? (
                                suppliers.find((s) => s._id === selectedSuppliers[0])?.name
                              ) : (
                                `${selectedSuppliers.length} suppliers selected`
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-64 p-0 [&[data-side=top]]:hidden" 
                            align="start" 
                            side="bottom" 
                            sideOffset={4} 
                            avoidCollisions={false}
                            collisionPadding={0}
                          >
                            <div className="p-3 space-y-2">
                              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                                <Checkbox
                                  id="select-all"
                                  checked={isAllSuppliersSelected}
                                  onCheckedChange={handleSelectAllSuppliers}
                                  className={isIndeterminate ? 'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600' : ''}
                                />
                                <label
                                  htmlFor="select-all"
                                  className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-blue-700"
                                >
                                  Select All
                                </label>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                {suppliers.map((supplier) => (
                                  <div key={supplier._id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={supplier._id}
                                      checked={selectedSuppliers.includes(supplier._id)}
                                      onCheckedChange={() => handleSupplierChange(supplier._id)}
                                    />
                                    <label
                                      htmlFor={supplier._id}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                      {supplier.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}

                    {selectedReportType === 'stock' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Store <span className="text-red-500">*</span></label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <Users className="mr-2 h-4 w-4" />
                              {selectedStores.length === 0 ? (
                                <span className="text-gray-400">Select stores</span>
                              ) : selectedStores.length === allStores.length ? (
                                'All stores selected'
                              ) : selectedStores.length === 1 ? (
                                allStores.find((s) => s._id === selectedStores[0])?.name
                              ) : (
                                `${selectedStores.length} stores selected`
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-64 p-0 [&[data-side=top]]:hidden" 
                            align="start" 
                            side="bottom" 
                            sideOffset={4} 
                            avoidCollisions={false}
                            collisionPadding={0}
                          >
                            <div className="p-3 space-y-2">
                              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                                <Checkbox
                                  id="select-all"
                                  checked={isAllStoresSelected}
                                  onCheckedChange={handleSelectAllStores}
                                  className={isStoreIndeterminate ? 'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600' : ''}
                                />
                                <label
                                  htmlFor="select-all"
                                  className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-blue-700"
                                >
                                  Select All
                                </label>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                {allStores.map((store) => (
                                  <div key={store._id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={store._id}
                                      checked={selectedStores.includes(store._id)}
                                      onCheckedChange={() => handleStoreChange(store._id)}
                                    />
                                    <label
                                      htmlFor={store._id}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                      {store.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        {/* Role-based store filtering indicator */}
                        {/* {userData && (
                          (() => {
                            const userRole = getUserRole();
                            
                            return userRole.toLowerCase() !== 'admin' && userRole.toLowerCase() !== 'superadmin' ? (
                              <div className="mt-2 text-sm font-medium text-blue-600">
                                Showing {userRole} stores only
                              </div>
                            ) : null;
                          })()
                        )} */}
                      </div>
                    )}

                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      onClick={handleGenerateReport}
                      disabled={!isFormValid || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        'Generate Report'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {isReportGenerated && selectedReportType && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        {selectedReportType === 'purchase-order' && <ShoppingCart className="h-6 w-6 text-blue-600" />}
                        {selectedReportType === 'sales' && <TrendingUp className="h-6 w-6 text-green-600" />}
                        {selectedReportType === 'stock' && <Package className="h-6 w-6 text-purple-600" />}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {reportData[selectedReportType as keyof typeof reportData]?.title}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {dateRange[0] && dateRange[1] ? (
                            `${format(dateRange[0], 'MMM dd, yyyy')} - ${format(dateRange[1], 'MMM dd, yyyy')}`
                          ) : (
                            'All time'
                          )}
                          {selectedSuppliers.length > 0 &&
                            ` • ${selectedSuppliers.length === suppliers.length ? 'All' : selectedSuppliers.length} supplier${selectedSuppliers.length > 1 ? 's' : ''} selected`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handlePrintPreview}
                        className="flex items-center space-x-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print Preview</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={exportToCSV}
                        className="flex items-center space-x-1 text-green-600 border-green-200 hover:bg-green-50"
                        disabled={isLoading || !isReportGenerated}
                      >
                        <Download className="h-4 w-4" />
                        <span>Export CSV</span>
                      </Button>
                    </div>
                  </div>

                  {selectedReportType === 'purchase-order' && (
                    <div className="mb-6 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by item name or supplier..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={handleFilterReset}
                            className="px-3 py-2 text-sm"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReportType === 'sales' && (
                    <div className="mb-6 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by invoice number..."
                            value={searchQuerySales}
                            onChange={(e) => {
                              setSearchQuerySales(e.target.value);
                              setCurrentPageSales(1);
                            }}
                            className="pl-10"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={handleFilterReset}
                            className="px-3 py-2 text-sm"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReportType === 'stock' && (
                    <div className="mb-6 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by Item ID or Item Name..."
                            value={searchQueryStock}
                            onChange={(e) => {
                              setSearchQueryStock(e.target.value);
                              setCurrentPageStock(1);
                            }}
                            className="pl-10"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={handleFilterReset}
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReportType === 'packing-list' && (
                    <div className="mb-6 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by box number, cargo number, or item..."
                            value={searchQueryPackingList}
                            onChange={(e) => {
                              setSearchQueryPackingList(e.target.value);
                              setCurrentPagePackingList(1);
                            }}
                            className="pl-10"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={handleFilterReset}
                            className="px-3 py-2 text-sm"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg overflow-hidden border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-gray-50 border-gray-200">
                          {selectedReportType === 'purchase-order' ? (
                            <>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center gap-1 font-semibold cursor-pointer hover:text-blue-600"
                                  onClick={() => handleSort('itemName')}
                                >
                                  Item Name
                                  {getSortIcon('itemName')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center gap-1 font-semibold cursor-pointer hover:text-blue-600"
                                  onClick={() => handleSort('supplier.name')}
                                >
                                  Supplier
                                  {getSortIcon('supplier.name')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center gap-1 font-semibold cursor-pointer hover:text-blue-600"
                                  onClick={() => handleSort('orderDate')}
                                >
                                  Order Date
                                  {getSortIcon('orderDate')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center justify-end gap-1 font-semibold cursor-pointer hover:text-blue-600"
                                  onClick={() => handleSort('quantity')}
                                >
                                  Quantity
                                  {getSortIcon('quantity')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center justify-end gap-1 font-semibold cursor-pointer hover:text-blue-600"
                                  onClick={() => handleSort('unitPrice')}
                                >
                                  Unit Price
                                  {getSortIcon('unitPrice')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center justify-end gap-1 font-semibold cursor-pointer hover:text-blue-600"
                                  onClick={() => handleSort('totalValue')}
                                >
                                  Total Value
                                  {getSortIcon('totalValue')}
                                </p>
                              </TableHead>
                            </>
                          ) : selectedReportType === 'stock' ? (
                            <>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center gap-1 font-semibold cursor-pointer hover:text-blue-600 ps-2"
                                  onClick={() => handleSortStock('itemId')}
                                >
                                  Item ID
                                  {getSortIconStock('itemId')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center gap-1 font-semibold cursor-pointer hover:text-blue-600 ps-2"
                                  onClick={() => handleSortStock('itemName')}
                                >
                                  Item Name
                                  {getSortIconStock('itemName')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center gap-1 font-semibold cursor-pointer hover:text-blue-600 ps-2"
                                  onClick={() => handleSortStock('storeName')}
                                >
                                  Store Name
                                  {getSortIconStock('storeName')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center justify-end gap-1 font-semibold cursor-pointer hover:text-blue-600 ps-2"
                                  onClick={() => handleSortStock('quantity')}
                                >
                                  Quantity
                                  {getSortIconStock('quantity')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center justify-end gap-1 font-semibold cursor-pointer hover:text-blue-600 ps-2"
                                  onClick={() => handleSortStock('unitPrice')}
                                >
                                  Unit Price
                                  {getSortIconStock('unitPrice')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold text-end"><p className='pe-2'>Total Value</p></TableHead>
                            </>
                          ) : selectedReportType === 'sales' ? (
                            <>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center gap-1 font-semibold cursor-pointer hover:text-blue-600 ps-2"
                                  onClick={() => handleSortSales('invoice_date')}
                                >
                                  Date
                                  {getSortIconSales('invoice_date')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center gap-1 font-semibold cursor-pointer hover:text-blue-600 ps-2"
                                  onClick={() => handleSortSales('invoice_number')}
                                >
                                  Invoice #
                                  {getSortIconSales('invoice_number')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center justify-end gap-1 font-semibold cursor-pointer hover:text-blue-600 text-end"
                                  onClick={() => handleSortSales('invoice_amount')}
                                >
                                  Gross Amount
                                  {getSortIconSales('invoice_amount')}
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold text-end">Discount</TableHead>
                              <TableHead className="font-semibold text-end">Tax Amount</TableHead>
                              <TableHead className="font-semibold">
                                <p
                                  className="flex items-center justify-end gap-1 font-semibold cursor-pointer hover:text-blue-600"
                                  onClick={() => handleSortSales('net_amount')}
                                >
                                  Net Amount
                                  {getSortIconSales('net_amount')}
                                </p>
                              </TableHead>
                            </>
                          ) : selectedReportType === 'packing-list' ? (
                            <>
                              <TableHead className="font-semibold">
                                <p className="flex items-center gap-1 font-semibold ps-2">
                                  Box/Bora Number
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p className="flex items-center gap-1 font-semibold ps-2">
                                  Item Description
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p className="flex items-center justify-end gap-1 font-semibold ps-2">
                                  Quantity
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p className="flex items-center gap-1 font-semibold ps-2">
                                  Size
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p className="flex items-center gap-1 font-semibold ps-2">
                                  Cargo Number
                                </p>
                              </TableHead>
                              <TableHead className="font-semibold">
                                <p className="flex items-center gap-1 font-semibold ps-2">
                                  Remarks
                                </p>
                              </TableHead>
                            </>
                          ) : (
                            reportData[selectedReportType as keyof typeof reportData]?.headers?.map((header: string) => (
                              <TableHead key={header} className="font-semibold text-gray-800 px-4 py-3 text-left">
                                <div className="flex items-center gap-1">
                                  {header}
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-gray-400"
                                  >
                                    <path d="m7 15 5 5 5-5"></path>
                                    <path d="m7 9 5-5 5 5"></path>
                                  </svg>
                                </div>
                              </TableHead>
                            ))
                          )}
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {selectedReportType === 'purchase-order' && (
                          isLoading ? (
                            Array(itemsPerPage).fill(0).map((_, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="py-3">
                                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                </TableCell>
                                <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              </TableRow>
                            ))
                          ) : purchaseOrders.length > 0 ? (
                            purchaseOrders.map((item, index) => (
                              <TableRow
                                key={item._id}
                                className={`hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                  }`}
                              >
                                <TableCell className="font-medium text-gray-900 py-3">{item.itemName}</TableCell>
                                <TableCell className="text-gray-700 py-3">{item.supplier?.name}</TableCell>
                                <TableCell className="text-gray-700 py-3">
                                  {item.orderDate ? format(new Date(item.orderDate), 'dd MMM yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell className="text-gray-700 py-3 text-end px-4">{item.quantity}</TableCell>
                                <TableCell className="text-gray-700 py-3 text-end px-4">₹{item.unitPrice.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="font-medium text-gray-900 py-3 text-end px-4">₹{item.totalValue.toLocaleString('en-IN')}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                <div className="flex flex-col items-center justify-center">
                                  <p className="text-base font-medium">No items found</p>
                                  <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                        {selectedReportType === 'sales' && (
                          isLoading ? (
                            Array(itemsPerPageSales).fill(0).map((_, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="py-3">
                                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                </TableCell>
                                <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              </TableRow>
                            ))
                          ) : paginatedSales.length > 0 ? (
                            paginatedSales.map((item, index) => (
                              <TableRow
                                key={item._id}
                                className={`hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                              >
                                <TableCell className="text-gray-700 px-4 py-3">{format(new Date(item.invoiceDate!), 'dd MMM yyyy')}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3 font-medium">{item.invoiceNumber}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3 text-end">{(item?.invoiceAmount ?? 0).toFixed(2)}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3 text-end">{(item?.discountAmount ?? 0).toFixed(2)}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3 text-end">{(item?.tax_amount ?? 0).toFixed(2)}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3 text-end font-medium">{(item?.net_amount ?? 0).toFixed(2)}</TableCell>
                              </TableRow>
                            ))) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                <div className="flex flex-col items-center justify-center">
                                  <p className="text-base font-medium">No sales invoices found</p>
                                  <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        {selectedReportType === 'stock' && (
                          isLoading ? (
                            Array(itemsPerPageStock).fill(0).map((_, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="py-3">
                                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                </TableCell>
                                <TableCell><div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              </TableRow>
                            ))
                          ) : paginatedStocks.length > 0 ? (
                            paginatedStocks.map((stock, index) => (
                              <TableRow
                                key={stock._id}
                                className={`hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                              >
                                <TableCell className="text-gray-700 px-4 py-3">{stock.itemId}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3 font-medium">{stock.itemName}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3">{stock.storeName}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3 text-end">{stock.quantity}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3 text-end">{(stock.unitPrice ?? 0).toFixed(2)}</TableCell>
                                <TableCell className="text-gray-700 px-4 py-3 text-end font-medium">{((stock.quantity ?? 0) * (stock.unitPrice ?? 0)).toFixed(2)}</TableCell>
                              </TableRow>
                            ))) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                <div className="flex flex-col items-center justify-center">
                                  <p className="text-base font-medium">No inventory stocks found</p>
                                  <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        {selectedReportType === 'packing-list' && (
                          isLoading ? (
                            Array(itemsPerPagePackingList).fill(0).map((_, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="py-3">
                                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                </TableCell>
                                <TableCell><div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell><div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              </TableRow>
                            ))
                          ) : paginatedPackingLists.length > 0 ? (
                            paginatedPackingLists.flatMap((packingList, packingIndex) =>
                              (packingList.items || []).map((item, itemIndex) => (
                                <TableRow
                                  key={`${packingList._id}-${itemIndex}`}
                                  className={`hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 ${(packingIndex + itemIndex) % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                >
                                  <TableCell className="text-gray-700 px-4 py-3 font-medium">
                                    {itemIndex === 0 ? (packingList.boxNumber || '-') : ''}
                                  </TableCell>
                                  <TableCell className="text-gray-700 px-4 py-3">
                                    <div>
                                      <div className="font-medium">{item.product?.name || 'Unknown Item'}</div>
                                      {item.description && (
                                        <div className="text-sm text-gray-500">{item.description}</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-700 px-4 py-3 text-end">{item.quantity || 0}</TableCell>
                                  <TableCell className="text-gray-700 px-4 py-3">
                                    {item.unitOfMeasure || '-'}
                                  </TableCell>
                                  <TableCell className="text-gray-700 px-4 py-3">
                                    {itemIndex === 0 ? (packingList.cargoNumber || '-') : ''}
                                  </TableCell>
                                  <TableCell className="text-gray-700 px-4 py-3">
                                    {itemIndex === 0 ? (packingList.description || '-') : ''}
                                  </TableCell>
                                </TableRow>
                              ))
                            )
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                <div className="flex flex-col items-center justify-center">
                                  <p className="text-base font-medium">No packing lists found</p>
                                  <p className="text-sm text-gray-500">Try adjusting your search or date range</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>

                  {selectedReportType === 'packing-list' && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-6 gap-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          Show
                        </p>
                        <Select
                          value={itemsPerPagePackingList.toString()}
                          onValueChange={(value) => {
                            setItemsPerPagePackingList(Number(value));
                            setCurrentPagePackingList(1);
                          }}
                        >
                          <SelectTrigger className="w-[70px]">
                            <SelectValue placeholder={itemsPerPagePackingList.toString()} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          entries
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground hidden sm:block">
                          Showing {packingListPagination.total > 0 ? ((currentPagePackingList - 1) * itemsPerPagePackingList) + 1 : 0} to {Math.min(currentPagePackingList * itemsPerPagePackingList, packingListPagination.total)} of {packingListPagination.total} entries
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPagePackingList(prev => Math.max(prev - 1, 1))}
                            disabled={currentPagePackingList === 1}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <div className="flex items-center justify-center text-sm font-medium bg-gray-100 px-3 py-1 rounded">
                            Page {currentPagePackingList} of {packingListPagination.totalPages || 1}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPagePackingList(prev => Math.min(prev + 1, packingListPagination.totalPages || 1))}
                            disabled={currentPagePackingList === packingListPagination.totalPages || packingListPagination.totalPages === 0}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReportType === 'packing-list' && (
                    <div className="grid gap-4 md:grid-cols-2 mt-6">
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-700">Total Packing Lists</p>
                              <h4 className="text-2xl font-bold text-blue-900 mt-1">{packingListSummaryStats.totalPackingLists}</h4>
                              <p className="text-xs text-blue-600 mt-1">In selected period</p>
                            </div>
                            <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-sm">
                              <Package className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-700">Total Items</p>
                              <h4 className="text-2xl font-bold text-green-900 mt-1">{packingListSummaryStats.totalItems}</h4>
                              <p className="text-xs text-green-600 mt-1">In selected period</p>
                            </div>
                            <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-sm">
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {selectedReportType === 'purchase-order' && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">Show</p>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder={itemsPerPage.toString()} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="-1">All</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">entries</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground hidden sm:block">
                          Showing {pagination.total > 0 ? ((currentPage - 1) * (itemsPerPage === -1 ? pagination.total : itemsPerPage) + 1) : 0} to {Math.min(currentPage * (itemsPerPage === -1 ? pagination.total : itemsPerPage), pagination.total)} of {pagination.total} entries
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentPage((prev) => Math.max(prev - 1, 1));
                            }}
                            disabled={!pagination.hasPrevPage || isLoading}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <div className="flex items-center justify-center text-sm font-medium bg-gray-100 px-3 py-1 rounded">
                            Page {currentPage} of {pagination.totalPages || 1}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentPage((prev) => prev + 1);
                            }}
                            disabled={!pagination.hasNextPage || isLoading}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReportType === 'purchase-order' && (
                    <div className="grid gap-4 md:grid-cols-2 mt-6">
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-700">Total Orders</p>
                              <h4 className="text-2xl font-bold text-blue-900 mt-1">{summaryStats.totalOrders}</h4>
                              <p className="text-xs text-blue-600 mt-1">In selected period</p>
                            </div>
                            <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-sm">
                              <ShoppingCart className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-700">Total Value</p>
                              <h4 className="text-2xl font-bold text-green-900 mt-1">{summaryStats.totalValue.toFixed(2)}</h4>
                              <p className="text-xs text-green-600 mt-1">In selected period</p>
                            </div>
                            <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-sm">
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {isReportGenerated && selectedReportType === 'sales' && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-6 gap-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Show
                    </p>
                    <Select
                      value={itemsPerPageSales.toString()}
                      onValueChange={(value) => {
                        setItemsPerPageSales(Number(value));
                        setCurrentPageSales(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px]">
                        <SelectValue placeholder={itemsPerPageSales.toString()} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      entries
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      Showing {salesPagination.total > 0 ? ((currentPageSales - 1) * itemsPerPageSales) + 1 : 0} to {Math.min(currentPageSales * itemsPerPageSales, salesPagination.total)} of {salesPagination.total} entries
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageSales(prev => Math.max(prev - 1, 1))}
                        disabled={currentPageSales === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center justify-center text-sm font-medium bg-gray-100 px-3 py-1 rounded">
                        Page {currentPageSales} of {salesPagination.totalPages || 1}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageSales(prev => Math.min(prev + 1, salesPagination.totalPages || 1))}
                        disabled={currentPageSales === salesPagination.totalPages || salesPagination.totalPages === 0}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isReportGenerated && selectedReportType === 'sales' && (
                <div className="grid gap-4 md:grid-cols-2 mt-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">Total Sales</p>
                          <h4 className="text-2xl font-bold text-blue-900 mt-1">{salesSummaryStats.totalSales}</h4>
                          <p className="text-xs text-blue-600 mt-1">In selected period</p>
                        </div>
                        <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-sm">
                          <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">Total Sales Value</p>
                          <h4 className="text-2xl font-bold text-green-900 mt-1">{salesSummaryStats.totalSalesValue.toFixed(2)}</h4>
                          <p className="text-xs text-green-600 mt-1">In selected period</p>
                        </div>
                        <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-sm">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isReportGenerated && selectedReportType === 'stock' && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-6 gap-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Show
                    </p>
                    <Select
                      value={itemsPerPageStock.toString()}
                      onValueChange={(value) => {
                        setItemsPerPageStock(Number(value));
                        setCurrentPageStock(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px]">
                        <SelectValue placeholder={itemsPerPageStock.toString()} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      entries
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      Showing {stockPagination.total > 0 ? ((currentPageStock - 1) * itemsPerPageStock) + 1 : 0} to {Math.min(currentPageStock * itemsPerPageStock, stockPagination.total)} of {stockPagination.total} entries
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageStock(prev => Math.max(prev - 1, 1))}
                        disabled={currentPageStock === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center justify-center text-sm font-medium bg-gray-100 px-3 py-1 rounded">
                        Page {currentPageStock} of {stockPagination.totalPages || 1}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageStock(prev => Math.min(prev + 1, stockPagination.totalPages || 1))}
                        disabled={currentPageStock === stockPagination.totalPages || stockPagination.totalPages === 0}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isReportGenerated && selectedReportType === 'stock' && (
                <div className="grid gap-4 md:grid-cols-2 mt-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">Total Inventory Stock</p>
                          <h4 className="text-2xl font-bold text-blue-900 mt-1">{stockSummaryStats.totalStock}</h4>
                          <p className="text-xs text-blue-600 mt-1">In selected period</p>
                        </div>
                        <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-sm">
                          <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">Total Stock Value</p>
                          <h4 className="text-2xl font-bold text-green-900 mt-1">{stockSummaryStats.totalStockValue.toFixed(2)}</h4>
                          <p className="text-xs text-green-600 mt-1">In selected period</p>
                        </div>
                        <div className="p-3 bg-white bg-opacity-70 rounded-lg shadow-sm">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Reports;