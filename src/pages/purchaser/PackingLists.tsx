import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { packingListService, type PackingList } from '@/services/packingListService';
import { storeStockService } from '@/services/storeStockService';
import { storeService, type Store } from '@/services/storeService';
import toast from 'react-hot-toast';
import type { PaginationMeta, StoreStock } from '@/types/backend';

interface PackingListFormState {
  storeId: string;
  location: string;
  boxNumber: string;
  shipmentDate?: string;
  packingDate?: string;
  image?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    availableQuantity: number;
    productName?: string;
    productCode?: string;
  }[];
}

type SortOrder = 'asc' | 'desc' | null;

interface SortConfig {
  field: string | null;
  order: SortOrder;
}

const DEFAULT_FORM: PackingListFormState = {
  storeId: '',
  location: '',
  boxNumber: '',
  shipmentDate: '',
  packingDate: '',
  image: '',
  notes: '',
  items: []
};

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export const PackingListsPage = () => {
  const navigate = useNavigate();
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, order: null });
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PackingListFormState>(DEFAULT_FORM);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeStock, setStoreStock] = useState<StoreStock[]>([]);
  const [loadingStoreStock, setLoadingStoreStock] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [packingListToDelete, setPackingListToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPackingLists = useCallback(async (page?: number) => {
    setLoading(true);
    try {
      const response = await packingListService.list({
        page: page ?? pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        search: searchQuery || undefined
      });
      setPackingLists(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error('Failed to load packing lists', error);
      toast.error('Unable to load packing lists');
      setPackingLists([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  const loadStores = useCallback(async () => {
    try {
      const response = await storeService.listStores({ type: 'all' });
      setStores(response.data || []);
    } catch (error) {
      console.error('Failed to load stores', error);
      toast.error('Unable to load stores');
    }
  }, []);

  const loadStoreStock = useCallback(async (storeId: string) => {
    if (!storeId) {
      setStoreStock([]);
      return;
    }
    setLoadingStoreStock(true);
    try {
      const response = await storeStockService.list({ storeId, limit: 1000 });
      setStoreStock(response.data || []);
    } catch (error) {
      console.error('Failed to load store stock', error);
      toast.error('Unable to load store stock');
      setStoreStock([]);
    } finally {
      setLoadingStoreStock(false);
    }
  }, []);

  useEffect(() => {
    loadPackingLists(1);
    loadStores();
  }, [loadPackingLists, loadStores]);

  useEffect(() => {
    if (formState.storeId) {
      loadStoreStock(formState.storeId);
      // Only reset items when store changes in create mode (not edit mode)
      if (!editingId) {
        setFormState((prev) => ({ ...prev, items: [] }));
      }
    } else {
      setStoreStock([]);
    }
  }, [formState.storeId, loadStoreStock, editingId]);

  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        const nextOrder = prev.order === 'asc' ? 'desc' : prev.order === 'desc' ? null : 'asc';
        return { field: nextOrder ? field : null, order: nextOrder };
      }
      return { field, order: 'asc' };
    });
  };

  const sortedLists = useMemo(() => {
    if (!sortConfig.field || !sortConfig.order) return packingLists;
    const sorted = [...packingLists].sort((a, b) => {
      const valueA = (a as unknown as Record<string, unknown>)[sortConfig.field!];
      const valueB = (b as unknown as Record<string, unknown>)[sortConfig.field!];

      if (valueA === valueB) return 0;
      if (valueA == null || valueB == null) return valueA == null ? -1 : 1;
      const comparator = valueA > valueB ? 1 : -1;
      return sortConfig.order === 'asc' ? comparator : -comparator;
    });
    return sorted;
  }, [packingLists, sortConfig]);

  const handlePageChange = (direction: 'next' | 'prev') => {
    const targetPage = direction === 'next' ? pagination.page + 1 : pagination.page - 1;
    if (targetPage < 1 || targetPage > pagination.totalPages) return;
    loadPackingLists(targetPage);
  };

  const handleAddItemToForm = () => {
    setFormState((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, availableQuantity: 0 }]
    }));
  };

  const handleUpdateItem = (index: number, key: 'productId' | 'quantity', value: string | number) => {
    setFormState((prev) => {
      const updated = [...prev.items];
      const stockItem = storeStock.find((s) => {
        const productId = (s.product as any)?._id || (s.product as any)?.id || s.product;
        return productId === value && key === 'productId';
      });

      if (key === 'productId' && stockItem) {
        updated[index] = {
          productId: value as string,
          quantity: 1,
          availableQuantity: stockItem.quantity || 0
        };
      } else {
        updated[index] = { ...updated[index], [key]: value };
      }
      return { ...prev, items: updated };
    });
  };

  const handleStoreChange = (storeId: string) => {
    setFormState((prev) => ({ ...prev, storeId, items: [] }));
  };

  const handleView = (id: string) => {
    navigate(`/dashboard/purchaser/packing-lists/view/${id}`);
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await packingListService.get(id);
      const packingList = response.data;

      // Extract product IDs from packing list items
      const productIds = packingList.items?.map((item: any) => {
        const productId = (item.product as any)?._id || (item.product as any)?.id || item.product;
        return typeof productId === 'string' ? productId : productId?.toString();
      }).filter(Boolean) || [];

      // Find the store that has stock for these products
      let foundStoreId = '';
      if (productIds.length > 0) {
        // Check each store to find which one has stock for these products
        for (const store of stores) {
          const storeId = store._id || store.id;
          if (!storeId) continue;

          try {
            const stockResponse = await storeStockService.list({ storeId, limit: 1000 });
            const stockItems = stockResponse.data || [];

            // Check if all products in packing list exist in this store's stock
            const hasAllProducts = productIds.every((pid: string) =>
              stockItems.some((stock: StoreStock) => {
                const stockProductId = (stock.product as any)?._id || (stock.product as any)?.id || stock.product;
                return stockProductId?.toString() === pid;
              })
            );

            if (hasAllProducts) {
              foundStoreId = storeId;
              break;
            }
          } catch (err) {
            // Continue to next store if this one fails
            continue;
          }
        }
      }

      // Extract items with product information from the populated response
      const itemsWithProductInfo = packingList.items?.map((item: any) => {
        const product = item.product;
        const productId = product?._id || product?.id || product;
        const productIdStr = typeof productId === 'string' ? productId : productId?.toString();
        const productName = product?.name || '';
        const productCode = product?.code || '';

        return {
          productId: productIdStr || '',
          quantity: item.quantity,
          availableQuantity: 0, // Will be loaded when store stock is loaded
          productName,
          productCode
        };
      }) || [];

      // Set form state with found store or empty
      const formData: PackingListFormState = {
        storeId: foundStoreId,
        location: packingList.location,
        boxNumber: packingList.boxNumber,
        shipmentDate: packingList.shipmentDate ? new Date(packingList.shipmentDate).toISOString().split('T')[0] : '',
        packingDate: packingList.packingDate ? new Date(packingList.packingDate).toISOString().split('T')[0] : '',
        image: packingList.image || '',
        notes: '',
        items: itemsWithProductInfo
      };

      setFormState(formData);
      setEditingId(id);
      setShowDialog(true);

      // Load store stock if store was found and update available quantities
      if (foundStoreId) {
        try {
          const stockResponse = await storeStockService.list({ storeId: foundStoreId, limit: 1000 });
          const stockData = stockResponse.data || [];
          setStoreStock(stockData);

          // Update available quantities in form state
          setFormState((prev) => ({
            ...prev,
            items: prev.items.map((item) => {
              const stockItem = stockData.find((s: StoreStock) => {
                const productId = (s.product as any)?._id || (s.product as any)?.id || s.product;
                return productId?.toString() === item.productId;
              });
              return {
                ...item,
                availableQuantity: stockItem?.quantity || item.availableQuantity || 0
              };
            })
          }));
        } catch (err) {
          console.error('Failed to load store stock for edit', err);
        }
      }
    } catch (error) {
      console.error('Failed to load packing list for edit', error);
      toast.error('Unable to load packing list');
    }
  };

  const handleDeleteClick = (id: string) => {
    setPackingListToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!packingListToDelete) return;

    setIsDeleting(true);
    try {
      await packingListService.delete(packingListToDelete);
      toast.success('Packing list deleted successfully');
      setShowDeleteDialog(false);
      setPackingListToDelete(null);
      loadPackingLists(pagination.page);
    } catch (error: any) {
      console.error('Failed to delete packing list', error);
      const errorMessage = error?.message || 'Unable to delete packing list';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePackingList = async () => {
    if (!editingId && !formState.storeId) {
      toast.error('Please select a store');
      return;
    }

    // Validate quantities (only for create mode or when store is selected in edit mode)
    if (formState.storeId) {
      const invalidItems = formState.items.filter(
        (item) => item.productId && item.quantity > item.availableQuantity
      );
      if (invalidItems.length > 0) {
        toast.error('Some items exceed available stock quantity');
        return;
      }
    }

    const validItems = formState.items.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      if (editingId) {
        await packingListService.update(editingId, {
          location: formState.location,
          boxNumber: formState.boxNumber,
          shipmentDate: formState.shipmentDate || undefined,
          packingDate: formState.packingDate || undefined,
          image: formState.image || undefined,
          notes: formState.notes?.trim() ? formState.notes.trim() : undefined,
          items: validItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          storeId: formState.storeId
        });
        toast.success('Packing list updated successfully');
      } else {
        await packingListService.create({
          storeId: formState.storeId,
          location: formState.location,
          boxNumber: formState.boxNumber,
          shipmentDate: formState.shipmentDate || undefined,
          packingDate: formState.packingDate || undefined,
          image: formState.image || undefined,
          notes: formState.notes?.trim() ? formState.notes.trim() : undefined,
          items: validItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
        });
        toast.success('Packing list created and stock updated');
        // Reload store stock to reflect updated quantities
        if (formState.storeId) {
          loadStoreStock(formState.storeId);
        }
      }
      setShowDialog(false);
      setFormState(DEFAULT_FORM);
      setEditingId(null);
      // Reload the list to show updated data with populated product information
      await loadPackingLists(pagination.page);
    } catch (error: any) {
      console.error(`Failed to ${editingId ? 'update' : 'create'} packing list`, error);
      const errorMessage = error?.message || `Unable to ${editingId ? 'update' : 'create'} packing list`;
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              Packing Lists
            </CardTitle>
            <CardDescription>Convert approved inventory into shipment-ready packing lists.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Packing List
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by box number or location"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    loadPackingLists(1);
                  }
                }}
              />
            </div>
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="shipped">Shipped</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('boxNumber')} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      Box
                      {sortConfig.field === 'boxNumber'
                        ? sortConfig.order === 'asc'
                          ? <ArrowUp className="h-4 w-4" />
                          : <ArrowDown className="h-4 w-4" />
                        : <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Packing Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading packing lists...
                    </TableCell>
                  </TableRow>
                ) : sortedLists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No packing lists found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLists.map((packing, index) => {
                    const packingId = packing.id ?? packing._id ?? `packing-${index}`;
                    return (
                      <TableRow key={packingId}>
                        <TableCell className="font-medium">{packing.boxNumber}</TableCell>
                        <TableCell>{packing.location}</TableCell>
                        <TableCell className="capitalize">{packing.status}</TableCell>
                        <TableCell>{packing.packingDate ? new Date(packing.packingDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          {packing.items?.map((item: any, itemIndex: number) => {
                            const itemKey =
                              item.id ??
                              item._id ??
                              item.productId ??
                              item.product?._id ??
                              `${packingId}-item-${itemIndex}`;
                            return (
                              <div key={itemKey} className="text-sm text-muted-foreground">
                                {item.product?.name ?? 'Unknown'} × {item.quantity}
                              </div>
                            );
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(packingId)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(packingId)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(packingId)}
                              title="Delete"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePageChange('prev')} disabled={!pagination.hasPrevPage}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePageChange('next')} disabled={!pagination.hasNextPage}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setFormState(DEFAULT_FORM);
          setStoreStock([]);
          setEditingId(null);
        }
      }}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b mb-6">
            <DialogTitle className="text-2xl font-semibold">{editingId ? 'Edit Packing List' : 'Create Packing List'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {editingId ? 'Update packing list information.' : 'Bundle approved inventory into shipment-ready boxes.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Box className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Packing Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeId" className="text-sm font-medium">
                    {!editingId ? 'Store *' : 'Store'}
                  </Label>
                  <select
                    id="storeId"
                    className="border rounded-md px-3 py-2 text-sm bg-background h-10 w-full focus:ring-2 focus:ring-primary/20"
                    value={formState.storeId}
                    onChange={(e) => handleStoreChange(e.target.value)}
                  >
                    <option value="">Select store</option>
                    {stores.map((store) => (
                      <option key={store._id || store.id} value={store._id || store.id}>
                        {store.name} ({store.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boxNumber" className="text-sm font-medium">Box Number *</Label>
                  <Input
                    id="boxNumber"
                    value={formState.boxNumber}
                    onChange={(e) => setFormState(prev => ({ ...prev, boxNumber: e.target.value }))}
                    className="h-10 focus-visible:ring-primary/20"
                    placeholder="Enter box number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
                  <Input
                    id="location"
                    value={formState.location}
                    onChange={(e) => setFormState(prev => ({ ...prev, location: e.target.value }))}
                    className="h-10 focus-visible:ring-primary/20"
                    placeholder="Enter location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packingDate" className="text-sm font-medium">Packing Date</Label>
                  <Input
                    id="packingDate"
                    type="date"
                    value={formState.packingDate}
                    onChange={(e) => setFormState(prev => ({ ...prev, packingDate: e.target.value }))}
                    className="h-10 focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipmentDate" className="text-sm font-medium">Shipment Date</Label>
                  <Input
                    id="shipmentDate"
                    type="date"
                    value={formState.shipmentDate}
                    onChange={(e) => setFormState(prev => ({ ...prev, shipmentDate: e.target.value }))}
                    className="h-10 focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image" className="text-sm font-medium">Reference Image URL</Label>
                  <Input
                    id="image"
                    value={formState.image}
                    onChange={(e) => setFormState(prev => ({ ...prev, image: e.target.value }))}
                    className="h-10 focus-visible:ring-primary/20"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold">Items *</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddItemToForm}
                  disabled={!formState.storeId && !editingId}
                  className="h-9"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>

              {/* Status Messages */}
              {!formState.storeId && !editingId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">Please select a store first to view available items.</p>
                </div>
              )}
              {formState.storeId && storeStock.length === 0 && !loadingStoreStock && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">No items available in this store.</p>
                </div>
              )}
              {loadingStoreStock && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading store stock...</span>
                </div>
              )}

              {/* Items Table */}
              {formState.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden bg-white">
                  {/* Table Header */}
                  <div className="grid grid-cols-[minmax(300px,1fr)_150px_150px_80px] gap-4 bg-muted/50 px-6 py-4 border-b">
                    <div className="font-semibold text-sm">Product</div>
                    <div className="font-semibold text-sm text-center">Available Stock</div>
                    <div className="font-semibold text-sm text-center">Quantity</div>
                    <div className="font-semibold text-sm text-center">Action</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {formState.items.map((item, index) => {
                      const stockItem = storeStock.find(s => {
                        const productId = (s.product as any)?._id || (s.product as any)?.id || s.product;
                        return productId?.toString() === item.productId;
                      });
                      const availableQty = stockItem?.quantity || item.availableQuantity || 0;
                      const exceedsStock = !editingId && item.quantity > availableQty && formState.storeId;
                      const selectedProduct = stockItem?.product as any;
                      const productName = selectedProduct?.name || item.productName || '';
                      const productCode = selectedProduct?.code || item.productCode || '';

                      return (
                        <div
                          key={index}
                          className="grid grid-cols-[minmax(300px,1fr)_150px_150px_80px] gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors border-b last:border-0"
                        >
                          {/* Product Column */}
                          <div className="min-w-0">
                            {editingId && !formState.storeId ? (
                              <div className="space-y-1">
                                <Input
                                  value={productName || item.productId || 'Product'}
                                  disabled
                                  className="bg-muted h-10 text-sm"
                                />
                                {productCode && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    Code: {productCode}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <select
                                className="border rounded-md px-3 py-2 text-sm bg-background w-full h-10"
                                value={item.productId}
                                onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                              >
                                <option value="">Select Product</option>
                                {storeStock.map((stock) => {
                                  const productId = (stock.product as any)?._id || (stock.product as any)?.id || stock.product;
                                  const prodName = (stock.product as any)?.name || 'Unknown';
                                  const prodCode = (stock.product as any)?.code || '';
                                  return (
                                    <option key={productId} value={productId}>
                                      {prodName} {prodCode && `(${prodCode})`}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </div>

                          {/* Available Stock Column */}
                          <div className="flex justify-center">
                            <Input
                              type="number"
                              value={item.productId && formState.storeId ? availableQty : (editingId && !formState.storeId ? '' : '')}
                              disabled
                              className="bg-muted text-center font-medium w-28 h-10 text-sm"
                              readOnly
                              placeholder={editingId && !formState.storeId ? 'N/A' : '-'}
                            />
                          </div>

                          {/* Quantity Column */}
                          <div className="flex justify-center">
                            <div className="space-y-1 w-28">
                              <Input
                                type="number"
                                min={1}
                                max={formState.storeId ? availableQty : undefined}
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  handleUpdateItem(index, 'quantity', val);
                                }}
                                className={`w-full h-10 text-sm text-center ${exceedsStock ? 'border-red-500 focus:border-red-500' : ''}`}
                                placeholder="0"
                                disabled={!item.productId}
                              />
                              {exceedsStock && (
                                <p className="text-xs text-red-500 text-center">Exceeds stock</p>
                              )}
                              {!exceedsStock && item.quantity > 0 && availableQty > 0 && item.productId && formState.storeId && (
                                <p className="text-xs text-muted-foreground text-center">
                                  {availableQty - item.quantity} remaining
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Column */}
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormState(prev => ({
                                  ...prev,
                                  items: prev.items.filter((_, i) => i !== index)
                                }));
                              }}
                              className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Notes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Box className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Additional Notes</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  value={formState.notes}
                  onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add packing instructions or handling notes."
                  className="text-sm resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-6 mt-8 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setFormState(DEFAULT_FORM);
                setEditingId(null);
              }}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePackingList}
              disabled={
                (!editingId && !formState.storeId) ||
                !formState.boxNumber ||
                !formState.location ||
                formState.items.length === 0 ||
                (!editingId && formState.items.some(item => item.productId && item.quantity > item.availableQuantity && formState.storeId))
              }
              className="min-w-[160px]"
            >
              {editingId ? 'Update Packing List' : 'Create Packing List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this packing list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setPackingListToDelete(null)} disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

