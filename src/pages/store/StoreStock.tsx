import { useCallback, useEffect, useState } from 'react';
import { Warehouse, RefreshCcw, Search, X, Filter, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import toast from 'react-hot-toast';
import { storeStockService } from '@/services/storeStockService';
import type { StoreStock, PaginationMeta } from '@/types/backend';

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

type SearchMode = 'all' | 'style' | 'name';

export const StoreStockPage = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'biller' | 'other'>('biller');

  // Separate states for Biller stores stock
  const [billerRecords, setBillerRecords] = useState<StoreStock[]>([]);
  const [billerPagination, setBillerPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [billerLoading, setBillerLoading] = useState(true);

  // Separate states for Other stores stock
  const [otherRecords, setOtherRecords] = useState<StoreStock[]>([]);
  const [otherPagination, setOtherPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [otherLoading, setOtherLoading] = useState(true);

  // Separate states for general/non-admin store stock
  const [generalRecords, setGeneralRecords] = useState<StoreStock[]>([]);
  const [generalPagination, setGeneralPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [generalLoading, setGeneralLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  // Detail modal state
  const [detailRecord, setDetailRecord] = useState<StoreStock | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Custom Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Get user role on component mount
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        const role = user.role_name || user.role || null;
        setUserRole(role);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStockData = useCallback(
    async (
      type: 'biller' | 'other' | 'general',
      page: number = 1,
      limit: number = 10,
      search: string = '',
      mode: SearchMode = 'all'
    ) => {
      if (type === 'biller') setBillerLoading(true);
      else if (type === 'other') setOtherLoading(true);
      else setGeneralLoading(true);

      try {
        const styleOnly = mode === 'style';
        const response = await storeStockService.list({
          page,
          limit,
          search: search || undefined,
          styleOnly,
          storeType: type === 'general' ? undefined : type
        });
        
        if (type === 'biller') {
          setBillerRecords(response.data);
          setBillerPagination(response.meta);
        } else if (type === 'other') {
          setOtherRecords(response.data);
          setOtherPagination(response.meta);
        } else {
          setGeneralRecords(response.data);
          setGeneralPagination(response.meta);
        }
      } catch (error) {
        console.error(`Failed to load ${type} store stock`, error);
        toast.error(`Unable to load ${type} store stock`);
        if (type === 'biller') {
          setBillerRecords([]);
          setBillerPagination(DEFAULT_PAGINATION);
        } else if (type === 'other') {
          setOtherRecords([]);
          setOtherPagination(DEFAULT_PAGINATION);
        } else {
          setGeneralRecords([]);
          setGeneralPagination(DEFAULT_PAGINATION);
        }
      } finally {
        if (type === 'biller') setBillerLoading(false);
        else if (type === 'other') setOtherLoading(false);
        else setGeneralLoading(false);
      }
    },
    []
  );

  // Trigger data fetching when search or tab switches
  useEffect(() => {
    if (userRole === null) return;
    
    if (userRole === 'admin' || userRole === 'superadmin') {
      if (activeTab === 'biller') {
        fetchStockData('biller', 1, billerPagination.limit, debouncedSearch, searchMode);
      } else {
        fetchStockData('other', 1, otherPagination.limit, debouncedSearch, searchMode);
      }
    } else {
      fetchStockData('general', 1, generalPagination.limit, debouncedSearch, searchMode);
    }
  }, [userRole, activeTab, debouncedSearch, searchMode, fetchStockData]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const handlePageChange = (newPage: number) => {
    if (userRole === 'admin' || userRole === 'superadmin') {
      if (activeTab === 'biller') {
        fetchStockData('biller', newPage, billerPagination.limit, debouncedSearch, searchMode);
      } else {
        fetchStockData('other', newPage, otherPagination.limit, debouncedSearch, searchMode);
      }
    } else {
      fetchStockData('general', newPage, generalPagination.limit, debouncedSearch, searchMode);
    }
  };

  const handleRefresh = () => {
    if (userRole === 'admin' || userRole === 'superadmin') {
      if (activeTab === 'biller') {
        fetchStockData('biller', billerPagination.page, billerPagination.limit, debouncedSearch, searchMode);
      } else {
        fetchStockData('other', otherPagination.page, otherPagination.limit, debouncedSearch, searchMode);
      }
    } else {
      fetchStockData('general', generalPagination.page, generalPagination.limit, debouncedSearch, searchMode);
    }
  };

  const handleDeleteClick = (id: string, productName: string) => {
    setRecordToDelete({ id, name: productName });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    try {
      await storeStockService.delete(recordToDelete.id);
      toast.success('Store stock deleted successfully');
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
      handleRefresh();
    } catch (error: any) {
      console.error('Failed to delete store stock', error);
      toast.error(error.response?.data?.message || 'Failed to delete store stock');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetailRecord(null);
    try {
      const response = await storeStockService.get(id);
      setDetailRecord(response.data);
    } catch (error) {
      console.error('Failed to load store stock details', error);
      toast.error('Unable to fetch store stock details');
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const truncateStyleNumber = (style: string | undefined | null, length = 30) => {
    if (!style) return '-';
    if (style.length <= length) return style;
    return style.substring(0, length) + '...';
  };

  const isCurrentlyLoading =
    (userRole === 'admin' || userRole === 'superadmin')
      ? (activeTab === 'biller' ? billerLoading : otherLoading)
      : generalLoading;

  const currentPagination =
    (userRole === 'admin' || userRole === 'superadmin')
      ? (activeTab === 'biller' ? billerPagination : otherPagination)
      : generalPagination;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              Store Stock
            </CardTitle>
            <CardDescription>
              Monitor approved products and apply margin adjustments before billing.
              Items are automatically added to stores when QC status becomes "approved".
              {userRole && userRole !== 'admin' && userRole !== 'superadmin' && (
                <div className="mt-2 text-sm font-medium text-blue-600">
                  Showing {userRole} store stock only
                </div>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isCurrentlyLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Controls Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  searchMode === 'style'
                    ? 'Search by style number...'
                    : searchMode === 'name'
                    ? 'Search by item name or code...'
                    : 'Search by style number, item name, or code...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select value={searchMode} onValueChange={(val) => setSearchMode(val as SearchMode)}>
                <SelectTrigger className="w-[170px] h-10">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Search Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="style">Style Number Only</SelectItem>
                  <SelectItem value="name">Item Name Only</SelectItem>
                </SelectContent>
              </Select>

              {debouncedSearch && (
                <Button variant="ghost" size="sm" onClick={handleClearSearch} className="h-10 text-muted-foreground hover:text-foreground">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Search Results Notification */}
          {debouncedSearch && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 dark:bg-blue-950 dark:border-blue-900 px-3 py-2 rounded-md text-xs sm:text-sm text-blue-900 dark:text-blue-100">
              <span>
                Showing results for <span className="font-semibold">"{debouncedSearch}"</span>
                {searchMode === 'style' ? ' (Style Number only)' : searchMode === 'name' ? ' (Item Name only)' : ''}
              </span>
              <span className="font-semibold">{currentPagination.total} item{currentPagination.total !== 1 ? 's' : ''} found</span>
            </div>
          )}

          {isCurrentlyLoading ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              Loading store stock...
            </div>
          ) : userRole === 'admin' || userRole === 'superadmin' ? (
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'biller' | 'other')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                <TabsTrigger value="biller">Biller Stores Stock</TabsTrigger>
                <TabsTrigger value="other">Other Stores Stock</TabsTrigger>
              </TabsList>
              
              <TabsContent value="biller" className="space-y-4">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Style Number</TableHead>
                        <TableHead>Margin %</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billerRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            {debouncedSearch ? (
                              <div className="space-y-2">
                                <div>No biller store stock found matching "{debouncedSearch}".</div>
                                <Button variant="outline" size="sm" onClick={handleClearSearch}>
                                  Clear Search
                                </Button>
                              </div>
                            ) : (
                              'No biller store stock found on this page.'
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        billerRecords.map((record) => (
                          <TableRow key={record._id || record.id}>
                            <TableCell>
                              <div className="font-medium">{record.store?.name ?? 'N/A'}</div>
                              <div className="text-xs text-muted-foreground">
                                {record.store?.code}
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Biller
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{record.product?.name ?? 'Unnamed Item'}</div>
                              <div className="text-xs text-muted-foreground">Code: {record.product?.code}</div>
                            </TableCell>
                            <TableCell className="font-semibold text-blue-600">
                              {truncateStyleNumber(record.styleNumber || record.packingListDetails?.styleNumber)}
                            </TableCell>
                            <TableCell>{record.margin}%</TableCell>
                            <TableCell>{record.currency}</TableCell>
                            <TableCell>{record.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>{record.quantity}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-850">
                                Transmitted
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(record._id || record.id)}
                                  className="text-primary hover:text-primary/90 hover:bg-primary/10"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(record._id || record.id, record.product?.name ?? 'Unnamed Item')}
                                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="other" className="space-y-4">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Style Number</TableHead>
                        <TableHead>Margin %</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            {debouncedSearch ? (
                              <div className="space-y-2">
                                <div>No other store stock found matching "{debouncedSearch}".</div>
                                <Button variant="outline" size="sm" onClick={handleClearSearch}>
                                  Clear Search
                                </Button>
                              </div>
                            ) : (
                              'No other store stock found on this page.'
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        otherRecords.map((record) => (
                          <TableRow key={record._id || record.id}>
                            <TableCell>
                              <div className="font-medium">{record.store?.name ?? 'N/A'}</div>
                              <div className="text-xs text-muted-foreground">
                                {record.store?.code}
                                {(record.store as any)?.purchaser && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Purchaser
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{record.product?.name ?? 'Unnamed Item'}</div>
                              <div className="text-xs text-muted-foreground">Code: {record.product?.code}</div>
                            </TableCell>
                            <TableCell className="font-semibold text-blue-600">
                              {truncateStyleNumber(record.styleNumber || record.packingListDetails?.styleNumber)}
                            </TableCell>
                            <TableCell>{record.margin}%</TableCell>
                            <TableCell>{record.currency}</TableCell>
                            <TableCell>{record.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>{record.quantity}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Auto QC
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(record._id || record.id)}
                                  className="text-primary hover:text-primary/90 hover:bg-primary/10"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(record._id || record.id, record.product?.name ?? 'Unnamed Item')}
                                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Style Number</TableHead>
                    <TableHead>Margin %</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generalRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {debouncedSearch ? (
                          <div className="space-y-2">
                            <div>No store stock found matching "{debouncedSearch}".</div>
                            <Button variant="outline" size="sm" onClick={handleClearSearch}>
                              Clear Search
                            </Button>
                          </div>
                        ) : (
                          'No stock available. Items will automatically appear here when they pass Quality Control (QC status = "approved").'
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    generalRecords.map((record) => (
                      <TableRow key={record._id || record.id}>
                        <TableCell>
                          <div className="font-medium">{record.store?.name ?? 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.store?.code}
                            {(record.store as any)?.biller && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Biller
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.product?.name ?? 'Unnamed Item'}</div>
                          <div className="text-xs text-muted-foreground">Code: {record.product?.code}</div>
                        </TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          {truncateStyleNumber(record.styleNumber || record.packingListDetails?.styleNumber)}
                        </TableCell>
                        <TableCell>{record.margin}%</TableCell>
                        <TableCell>{record.currency}</TableCell>
                        <TableCell>{record.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{record.quantity}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {(record.store as any)?.biller ? 'Transmitted' : 'Auto QC'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(record._id || record.id)}
                              className="text-primary hover:text-primary/90 hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(record._id || record.id, record.product?.name ?? 'Unnamed Item')}
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing page {currentPagination.page} of {currentPagination.totalPages || 1}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPagination.page - 1)}
                disabled={!currentPagination.hasPrevPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPagination.page + 1)}
                disabled={!currentPagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Stock Details Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Warehouse className="h-5 w-5 text-primary" />
              Store Stock Details
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <RefreshCcw className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Loading stock details...</span>
            </div>
          ) : detailRecord ? (
            <div className="space-y-6 py-2">
              {/* Product & Store Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Product Details</h3>
                  <div className="font-bold text-base text-foreground">{detailRecord.product?.name ?? 'Unnamed Item'}</div>
                  <div className="text-sm text-muted-foreground">Code: {detailRecord.product?.code ?? 'N/A'}</div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border">
                      Status: {detailRecord.product?.status ?? 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Store Details</h3>
                  <div className="font-bold text-base text-foreground">{detailRecord.store?.name ?? 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Code: {detailRecord.store?.code ?? 'N/A'}</div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      detailRecord.store?.biller === 'ROLE_BILLER'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200'
                        : 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200'
                    }`}>
                      {detailRecord.store?.biller === 'ROLE_BILLER' ? 'Biller Store' : 'Purchaser/Other Store'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Quantity and Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-xs font-medium text-muted-foreground mb-1">Current Stock</span>
                  <span className="text-xl font-bold text-foreground">{detailRecord.quantity} pcs</span>
                </div>
                <div className="border p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-xs font-medium text-muted-foreground mb-1">Margin Percentage</span>
                  <span className="text-xl font-bold text-foreground">{detailRecord.margin}%</span>
                </div>
                <div className="border p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-xs font-medium text-muted-foreground mb-1">Unit Price ({detailRecord.currency})</span>
                  <span className="text-xl font-bold text-primary">{detailRecord.unitPrice.toFixed(2)}</span>
                </div>
                <div className="border p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-xs font-medium text-muted-foreground mb-1">Total Value</span>
                  <span className="text-xl font-bold text-foreground">
                    {((detailRecord.unitPrice ?? 0) * (detailRecord.quantity ?? 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Dynamic pricing details (DP Price, Final Price, Exchange Rate) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground block mb-0.5">DP Price (AED)</span>
                  <span className="text-sm font-semibold text-foreground">{detailRecord.dpPrice?.toFixed(2) ?? '-'}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground block mb-0.5">Exchange Rate</span>
                  <span className="text-sm font-semibold text-foreground">{detailRecord.exchangeRate?.toFixed(4) ?? '-'}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground block mb-0.5">Final Price</span>
                  <span className="text-sm font-semibold text-foreground">{detailRecord.finalPrice?.toFixed(2) ?? '-'}</span>
                </div>
              </div>

              {/* Style Numbers Scroll Area */}
              <div className="border-t pt-4">
                <span className="text-xs font-medium text-muted-foreground block mb-2 font-bold">Style Numbers</span>
                {detailRecord.styleNumber ? (
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-3 border rounded-lg bg-muted/20">
                    {detailRecord.styleNumber.split(',').map((style, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                        {style.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground block border p-3 rounded-lg bg-muted/20 text-center">No styles associated</span>
                )}
              </div>

              {/* Additional Information (Shipment Date, Cargo Number, Vendor) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">Cargo Number</span>
                    <span className="font-semibold text-foreground">{detailRecord.cargoNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">Shipment Date</span>
                    <span className="font-semibold text-foreground">
                      {detailRecord.shipmentDate ? new Date(detailRecord.shipmentDate).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">Vendor / Supplier</span>
                    <span className="font-semibold text-foreground">{detailRecord.product?.vendor?.name ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">Last Updated By</span>
                    <span className="font-semibold text-foreground">
                      {detailRecord.lastUpdatedBy 
                        ? `${detailRecord.lastUpdatedBy.firstName ?? ''} ${detailRecord.lastUpdatedBy.lastName ?? ''}`.trim() || 'System'
                        : '-'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end pt-4 border-t gap-2">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 font-bold text-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-3 text-sm leading-relaxed">
              Are you sure you want to delete the store stock record for <span className="font-semibold text-foreground">"{recordToDelete?.name}"</span>? 
              This action will permanently delete the stock entry from the database and log the activity. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4 border-t gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};