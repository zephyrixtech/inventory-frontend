import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { packingListService, type PackingList } from '@/services/packingListService';
import { storeStockService } from '@/services/storeStockService';
import { storeService, type Store } from '@/services/storeService';
import toast from 'react-hot-toast';
import type { PaginationMeta, StoreStock } from '@/types/backend';

interface PackingListFormState {
  storeId: string;
  toStoreId: string;
  boxOrBora: 'box' | 'bora'; // New field to select box or bora
  boxNumber: string;
  boraNumber: string; // New field for bora number
  shipmentDate?: string;
  packingDate?: string;
  image1?: string;
  items: {
    productId: string;
    quantity: number;
    availableQuantity: number;
    productName?: string;
    productCode?: string;
    description?: string;
    unitOfMeasure?: string;
  }[];
  status: 'india' | 'uae';
  approvalStatus: 'draft' | 'approved';
  // New fields
  cargoNumber?: string;
  fabricDetails?: string;
  // Only needed fields
  size?: string; // Packing list level size
  description?: string; // Packing list level description
}

const DEFAULT_FORM: PackingListFormState = {
  storeId: '',
  toStoreId: '',
  boxOrBora: 'box', // Default to box
  boxNumber: '',
  boraNumber: '',
  shipmentDate: '',
  packingDate: '',
  image1: '',
  items: [],
  status: 'india',
  approvalStatus: 'draft', // Default to draft
  // New fields
  cargoNumber: '',
  fabricDetails: '',
  // Only needed fields
  size: '',
  description: ''
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
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ field: string | null; order: 'asc' | 'desc' | null }>({ field: null, order: null });
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PackingListFormState>(DEFAULT_FORM);
  const [stores, setStores] = useState<Store[]>([]);
  const [purchaserStores, setPurchaserStores] = useState<Store[]>([]); // Stores with ROLE_PURCHASER
  const [billerStores, setBillerStores] = useState<Store[]>([]); // Stores with ROLE_BILLER
  const [storeStock, setStoreStock] = useState<StoreStock[]>([]);
  const [loadingStoreStock, setLoadingStoreStock] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [packingListToDelete, setPackingListToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<{ image1?: string }>({ image1: '' });

  const loadPackingLists = useCallback(async (page?: number) => {
    setLoading(true);
    try {
      const response = await packingListService.list({
        page: page ?? pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        approvalStatus: approvalStatusFilter,
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
  }, [pagination.page, pagination.limit, searchQuery, statusFilter, approvalStatusFilter]);

  const loadStores = useCallback(async () => {
    try {
      // Load all stores
      const response = await storeService.listStores();
      const allStores = response.data || [];
      setStores(allStores);

      // Filter stores with ROLE_PURCHASER for "From Store"
      const purchaserFilteredStores = allStores.filter(store => store.purchaser);
      setPurchaserStores(purchaserFilteredStores);

      // Filter stores with ROLE_BILLER for "To Store"
      const billerFilteredStores = allStores.filter(store => store.biller);
      setBillerStores(billerFilteredStores);
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
      if (!editingId) {
        setFormState((prev) => ({ ...prev, items: [] }));
      }
    } else {
      setStoreStock([]);
    }
  }, [formState.storeId, loadStoreStock, editingId]);

  const handleSort = (field: string) => {
    setSortConfig((prev: { field: string | null; order: 'asc' | 'desc' | null }) => {
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
      items: [...prev.items, { productId: '', quantity: 1, availableQuantity: 0, description: '', unitOfMeasure: '' }]
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
          availableQuantity: stockItem.quantity || 0,
          description: stockItem.product.description || '',
          unitOfMeasure: stockItem.product.unitOfMeasure || ''
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


      const itemsWithProductInfo = packingList.items?.map((item: any) => {
        const product = item.product;
        const productId = product?._id || product?.id || product;
        const productIdStr = typeof productId === 'string' ? productId : productId?.toString();
        const productName = product?.name || '';
        const productCode = product?.code || '';
        // Get description and unitOfMeasure from the item itself, not the product
        const description = item.description || product?.description || '';
        const unitOfMeasure = item.unitOfMeasure || product?.unitOfMeasure || '';

        return {
          productId: productIdStr || '',
          quantity: item.quantity,
          availableQuantity: 0,
          productName,
          productCode,
          description,
          unitOfMeasure
        };
      }) || [];

      // Determine if the boxNumber is for a box or bora
      let boxOrBora: 'box' | 'bora' = 'box';
      let boxNumber = '';
      let boraNumber = '';

      if (packingList.boxNumber) {
        if (packingList.boxNumber.startsWith('BOX-')) {
          boxOrBora = 'box';
          boxNumber = packingList.boxNumber.replace('BOX-', '');
        } else if (packingList.boxNumber.startsWith('BORA-')) {
          boxOrBora = 'bora';
          boraNumber = packingList.boxNumber.replace('BORA-', '');
        } else {
          // Fallback for existing data that doesn't follow the pattern
          boxNumber = packingList.boxNumber;
        }
      }

      // Extract store IDs - handle both string and object formats
      // Extract store IDs - handle both string and object formats
      const extractedStoreId = typeof packingList.store === 'string' ? packingList.store :
        (packingList.store as any)?._id || (packingList.store as any)?.id || '';

      const extractedToStoreId = typeof packingList.toStore === 'string' ? packingList.toStore :
        (packingList.toStore as any)?._id || (packingList.toStore as any)?.id || '';

      const formData: PackingListFormState = {
        storeId: extractedStoreId,
        toStoreId: extractedToStoreId,
        boxOrBora, // New field
        boxNumber, // Box number without prefix
        boraNumber, // Bora number without prefix
        shipmentDate: packingList.shipmentDate ? new Date(packingList.shipmentDate).toISOString().split('T')[0] : '',
        packingDate: packingList.packingDate ? new Date(packingList.packingDate).toISOString().split('T')[0] : '',
        image1: (packingList as any).image1 || '',
        items: itemsWithProductInfo,
        status: (packingList.status === 'india' || packingList.status === 'uae') ? packingList.status : 'india' as 'india' | 'uae',
        approvalStatus: packingList.approvalStatus || 'draft',
        // New fields
        cargoNumber: (packingList as any).cargoNumber || '',
        fabricDetails: (packingList as any).fabricDetails || '',
        // Only needed fields
        size: (packingList as any).size || '',
        description: (packingList as any).description || ''
      };

      setFormState(formData);
      setImagePreviews({ image1: formData.image1 });
      setEditingId(id);
      setShowDialog(true);

      const storeIdToUse = formData.storeId;
      if (storeIdToUse) {
        try {
          const stockResponse = await storeStockService.list({ storeId: storeIdToUse, limit: 1000 });
          const stockData = stockResponse.data || [];
          setStoreStock(stockData);

          setFormState((prev) => ({
            ...prev,
            items: prev.items.map((item) => {
              const stockItem = stockData.find((s: StoreStock) => {
                const productId = (s.product as any)?._id || (s.product as any)?.id || s.product;
                return productId?.toString() === item.productId;
              });
              return {
                ...item,
                availableQuantity: stockItem?.quantity || item.availableQuantity || 0,
                description: stockItem?.product?.description || item.description || '',
                unitOfMeasure: stockItem?.product?.unitOfMeasure || item.unitOfMeasure || ''
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

  const handleApprove = async (id: string) => {
    try {
      await packingListService.approve(id);
      toast.success('Packing list approved successfully');
      loadPackingLists(pagination.page);
    } catch (error: any) {
      console.error('Failed to approve packing list', error);
      const errorMessage = error?.message || 'Unable to approve packing list';
      toast.error(errorMessage);
    }
  };

  const convertImageToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setFormState(prev => ({ ...prev, image1: '' }));
      setImagePreviews(prev => ({ ...prev, image1: '' }));
      return;
    }

    try {
      const dataURL = await convertImageToDataURL(file);
      setFormState(prev => ({ ...prev, image1: dataURL }));
      setImagePreviews(prev => ({ ...prev, image1: dataURL }));
    } catch (error) {
      toast.error('Failed to process image');
      console.error('Image processing error:', error);
    }
  };

  const handleSavePackingList = async () => {
    if (!editingId && !formState.storeId) {
      toast.error('Please select a store');
      return;
    }

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

    // Validate that either box or bora number is provided
    if (formState.boxOrBora === 'box' && !formState.boxNumber) {
      toast.error('Please enter a box number');
      return;
    }

    if (formState.boxOrBora === 'bora' && !formState.boraNumber) {
      toast.error('Please enter a bora number');
      return;
    }

    try {
      // Determine the boxNumber based on selection
      const boxNumber = formState.boxOrBora === 'box'
        ? `BOX-${formState.boxNumber}`
        : `BORA-${formState.boraNumber}`;

      if (editingId) {
        await packingListService.update(editingId, {
          boxNumber, // Send the formatted boxNumber
          shipmentDate: formState.shipmentDate || undefined,
          packingDate: formState.packingDate || undefined,
          image1: formState.image1 || undefined,
          items: validItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            description: item.description,
            unitOfMeasure: item.unitOfMeasure
          })),
          storeId: formState.storeId,
          toStoreId: formState.toStoreId || undefined,
          status: formState.status,
          approvalStatus: formState.approvalStatus,
          // New fields
          cargoNumber: formState.cargoNumber || undefined,
          fabricDetails: formState.fabricDetails || undefined,
          // Only needed fields
          size: formState.size || undefined,
          description: formState.description || undefined
        });
        toast.success('Packing list updated successfully');
      } else {
        await packingListService.create({
          storeId: formState.storeId,
          boxNumber, // Send the formatted boxNumber
          shipmentDate: formState.shipmentDate || undefined,
          packingDate: formState.packingDate || undefined,
          image1: formState.image1 || undefined,
          items: validItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            description: item.description,
            unitOfMeasure: item.unitOfMeasure
          })),
          toStoreId: formState.toStoreId || undefined,
          status: formState.status,
          approvalStatus: formState.approvalStatus,
          // New fields
          cargoNumber: formState.cargoNumber || undefined,
          fabricDetails: formState.fabricDetails || undefined,
          // Only needed fields
          size: formState.size || undefined,
          description: formState.description || undefined
        });
        toast.success('Packing list created and stock updated');
        if (formState.storeId) {
          loadStoreStock(formState.storeId);
        }
      }
      setShowDialog(false);
      setFormState(DEFAULT_FORM);
      setImagePreviews({ image1: '' });
      setEditingId(null);
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
            <CardDescription>
              Convert approved inventory into shipment-ready packing lists.
              Creating a packing list reduces stock from the source store. Items are considered shipped/in-transit.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Packing List
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by box number"
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
              <option value="india">India</option>
              <option value="uae">UAE</option>
            </select>
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={approvalStatusFilter}
              onChange={(event) => setApprovalStatusFilter(event.target.value)}
            >
              <option value="all">All Approval Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
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
                    const isDraft = packing.approvalStatus === 'draft';
                    return (
                      <TableRow key={packingId}>
                        <TableCell className="font-medium">{packing.boxNumber}</TableCell>
                        <TableCell className="capitalize">{packing.status}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${packing.approvalStatus === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {packing.approvalStatus === 'approved' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </>
                              ) : (
                                'Draft'
                              )}
                            </span>
                          </div>
                        </TableCell>
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
                            {isDraft && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(packingId)}
                                title="Approve"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(packingId)}
                              title="Edit"
                              disabled={!isDraft}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(packingId)}
                              title="Delete"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={!isDraft}
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

      {/* Add/Edit Dialog */}
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
              {editingId ? 'Update packing list information.' : 'Bundle approved inventory into shipment-ready boxes. Stock will be reduced from the source store and considered shipped.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Section 1: Packing Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Box className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Packing Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeId" className="text-sm font-medium">
                    {!editingId ? 'From Store *' : 'From Store'}
                  </Label>
                  <select
                    id="storeId"
                    className="border rounded-md px-3 py-2 text-sm bg-background h-10 w-full focus:ring-2 focus:ring-primary/20"
                    value={formState.storeId}
                    onChange={(e) => handleStoreChange(e.target.value)}
                  >
                    <option value="">Select store</option>
                    {purchaserStores.map((store) => (
                      <option key={store._id || store.id} value={store._id || store.id}>
                        {store.name} ({store.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toStoreId" className="text-sm font-medium">To Store</Label>
                  <select
                    id="toStoreId"
                    className="border rounded-md px-3 py-2 text-sm bg-background h-10 w-full focus:ring-2 focus:ring-primary/20"
                    value={formState.toStoreId}
                    onChange={(e) => setFormState(prev => ({ ...prev, toStoreId: e.target.value }))}
                  >
                    <option value="">Select destination store</option>
                    {billerStores
                      .filter(store => (store._id || store.id) !== formState.storeId)
                      .map((store) => (
                        <option key={store._id || store.id} value={store._id || store.id}>
                          {store.name} ({store.code})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Box/Bora Selection and Number Fields */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Box / Bora *</Label>
                  <div className="flex gap-2">
                    <select
                      className="border rounded-md px-3 py-2 text-sm bg-background h-10 w-full focus:ring-2 focus:ring-primary/20"
                      value={formState.boxOrBora}
                      onChange={(e) => setFormState(prev => ({ ...prev, boxOrBora: e.target.value as 'box' | 'bora' }))}
                    >
                      <option value="box">Box</option>
                      <option value="bora">Bora</option>
                    </select>
                    {formState.boxOrBora === 'box' ? (
                      <Input
                        value={formState.boxNumber}
                        onChange={(e) => setFormState(prev => ({ ...prev, boxNumber: e.target.value }))}
                        className="h-10 focus-visible:ring-primary/20"
                        placeholder="Enter box number"
                      />
                    ) : (
                      <Input
                        value={formState.boraNumber}
                        onChange={(e) => setFormState(prev => ({ ...prev, boraNumber: e.target.value }))}
                        className="h-10 focus-visible:ring-primary/20"
                        placeholder="Enter bora number"
                      />
                    )}
                  </div>
                </div>

                {/* New Cargo Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="cargoNumber" className="text-sm font-medium">Cargo Number</Label>
                  <Input
                    id="cargoNumber"
                    value={formState.cargoNumber || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, cargoNumber: e.target.value }))}
                    className="h-10 focus-visible:ring-primary/20"
                    placeholder="Enter cargo number"
                  />
                </div>

                {/* New Fabric Details Field */}
                <div className="space-y-2">
                  <Label htmlFor="fabricDetails" className="text-sm font-medium">Fabric Details</Label>
                  <Input
                    id="fabricDetails"
                    value={formState.fabricDetails || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, fabricDetails: e.target.value }))}
                    className="h-10 focus-visible:ring-primary/20"
                    placeholder="Enter fabric details"
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
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <select
                    id="status"
                    className="border rounded-md px-3 py-2 text-sm bg-background h-10 w-full focus:ring-2 focus:ring-primary/20"
                    value={formState.status}
                    onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <option value="india">India</option>
                    <option value="uae">UAE</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approvalStatus" className="text-sm font-medium">Approval Status</Label>
                  <select
                    id="approvalStatus"
                    className="border rounded-md px-3 py-2 text-sm bg-background h-10 w-full focus:ring-2 focus:ring-primary/20"
                    value={formState.approvalStatus}
                    onChange={(e) => setFormState(prev => ({ ...prev, approvalStatus: e.target.value as 'draft' | 'approved' }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Approving confirms the shipment. Stock remains reduced from source store.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Items */}
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

              {formState.items.length > 0 && (
                <>
                  {!editingId && formState.storeId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Stock Impact:</strong> Creating this packing list will immediately reduce the selected quantities from "{stores.find(s => (s._id || s.id) === formState.storeId)?.name}" store.
                        Items will be considered shipped/in-transit and won't be added to any destination store.
                      </p>
                    </div>
                  )}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="grid grid-cols-[minmax(300px,1fr)_150px_150px_80px] gap-4 bg-muted/50 px-6 py-4 border-b">
                      <div className="font-semibold text-sm">Product</div>
                      <div className="font-semibold text-sm text-center">Available Stock</div>
                      <div className="font-semibold text-sm text-center">Quantity</div>
                      <div className="font-semibold text-sm text-center">Action</div>
                    </div>

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
                        const description = selectedProduct?.description || item.description || '';
                        const unitOfMeasure = selectedProduct?.unitOfMeasure || item.unitOfMeasure || '';

                        return (
                          <div key={index} className="border-b last:border-0">
                            <div className="grid grid-cols-[minmax(300px,1fr)_150px_150px_80px] gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors">
                              <div className="min-w-0">
                                {editingId && !formState.storeId ? (
                                  <div className="space-y-1">
                                    <div className="font-medium">{productName || item.productId || 'Product'}</div>
                                    <div className="text-xs space-y-1">
                                      {productCode && (
                                        <div className="text-muted-foreground">
                                          Code: <span className="font-medium">{productCode}</span>
                                        </div>
                                      )}
                                      {description && (
                                        <div className="text-muted-foreground">
                                          Description: <span className="font-medium">{description}</span>
                                        </div>
                                      )}
                                      {unitOfMeasure && (
                                        <div className="text-muted-foreground">
                                          Size: <span className="font-medium">{unitOfMeasure}</span>
                                        </div>
                                      )}
                                    </div>
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
                                      const prodDesc = (stock.product as any)?.description || '';
                                      const prodSize = (stock.product as any)?.unitOfMeasure || '';
                                      return (
                                        <option key={productId} value={productId}>
                                          {prodName} {prodCode && `(${prodCode})`} {prodDesc && `- ${prodDesc}`} {prodSize && `[${prodSize}]`}
                                        </option>
                                      );
                                    })}
                                  </select>
                                )}
                              </div>

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
                                      {availableQty - item.quantity} will remain in store
                                    </p>
                                  )}
                                </div>
                              </div>

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

                            {/* Description and Size fields outside the grid row */}
                            {item.productId && (
                              <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`description-${index}`} className="text-sm font-medium">Description</Label>
                                  <Input
                                    id={`description-${index}`}
                                    value={item.description || ''}
                                    onChange={(e) => setFormState(prev => {
                                      const updated = [...prev.items];
                                      updated[index] = { ...updated[index], description: e.target.value };
                                      return { ...prev, items: updated };
                                    })}
                                    className="mt-1 h-10 text-sm"
                                    placeholder="Enter description"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`size-${index}`} className="text-sm font-medium">Size</Label>
                                  <Input
                                    id={`size-${index}`}
                                    value={item.unitOfMeasure || ''}
                                    onChange={(e) => setFormState(prev => {
                                      const updated = [...prev.items];
                                      updated[index] = { ...updated[index], unitOfMeasure: e.target.value };
                                      return { ...prev, items: updated };
                                    })}
                                    className="mt-1 h-10 text-sm"
                                    placeholder="Enter size"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Section 3: Images */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Box className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Image</h3>
              </div>

              {/* Single Image Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="image1" className="text-sm font-medium">Image</Label>
                <div className="space-y-2">
                  <input
                    type="file"
                    id="image1"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {(formState.image1 || imagePreviews.image1) && (
                    <div className="mt-2">
                      <img
                        src={formState.image1 || imagePreviews.image1}
                        alt="Preview"
                        className="max-w-full h-32 object-contain rounded border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleImageUpload(null)}
                        className="mt-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Remarks */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Box className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Remarks</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-sm font-medium">Remarks</Label>
                <textarea
                  id="remarks"
                  value={formState.description || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[100px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary resize-vertical"
                  placeholder="Enter any additional remarks or notes for this packing list..."
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
                (formState.boxOrBora === 'box' ? !formState.boxNumber : !formState.boraNumber) ||
                formState.items.length === 0 ||
                (!editingId && formState.items.some(item => item.productId && item.quantity > item.availableQuantity && formState.storeId))
              }
              className="min-w-[160px]"
            >              {editingId ? 'Update Packing List' : 'Create Packing List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Packing List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this packing list? The stock will be restored to the source store. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};