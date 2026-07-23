import { useCallback, useEffect, useState } from 'react';
import { Warehouse, RefreshCcw, Search, X, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [records, setRecords] = useState<StoreStock[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

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

  const fetchStock = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      search: string = '',
      mode: SearchMode = 'all'
    ) => {
      setLoading(true);
      try {
        const styleOnly = mode === 'style';
        const response = await storeStockService.list({
          page,
          limit,
          search: search || undefined,
          styleOnly
        });
        setRecords(response.data);
        setPagination(response.meta);
      } catch (error) {
        console.error('Failed to load store stock', error);
        toast.error('Unable to load store stock');
        setRecords([]);
        setPagination(DEFAULT_PAGINATION);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStock(1, pagination.limit, debouncedSearch, searchMode);
  }, [debouncedSearch, searchMode, fetchStock, pagination.limit]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const handlePageChange = (newPage: number) => {
    fetchStock(newPage, pagination.limit, debouncedSearch, searchMode);
  };

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
              onClick={() => fetchStock(pagination.page, pagination.limit, debouncedSearch, searchMode)}
              disabled={loading}
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
              <span className="font-semibold">{pagination.total} item{pagination.total !== 1 ? 's' : ''} found</span>
            </div>
          )}

          {loading ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              Loading store stock...
            </div>
          ) : userRole === 'admin' || userRole === 'superadmin' ? (
            <Tabs defaultValue="biller" className="w-full">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.filter(r => (r.store as any)?.biller === 'ROLE_BILLER').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                        records.filter(r => (r.store as any)?.biller === 'ROLE_BILLER').map((record) => (
                          <TableRow key={record.id}>
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
                              {record.styleNumber || record.packingListDetails?.styleNumber || '-'}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.filter(r => (r.store as any)?.biller !== 'ROLE_BILLER').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                        records.filter(r => (r.store as any)?.biller !== 'ROLE_BILLER').map((record) => (
                          <TableRow key={record.id}>
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
                              {record.styleNumber || record.packingListDetails?.styleNumber || '-'}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                    records.map((record) => (
                      <TableRow key={record.id}>
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
                          {record.styleNumber || record.packingListDetails?.styleNumber || '-'}
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing page {pagination.page} of {pagination.totalPages || 1}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};