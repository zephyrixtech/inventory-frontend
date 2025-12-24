import { useCallback, useEffect, useState } from 'react';
import { Warehouse, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import toast from 'react-hot-toast';
import { storeStockService } from '@/services/storeStockService';
// import { getItems } from '@/services/itemService';
// import { storeService } from '@/services/storeService';
import type { StoreStock, PaginationMeta } from '@/types/backend';

// Define the item type based on the actual API response
// interface ItemType {
//   id: string;
//   name?: string;
//   code?: string;
//   item_name?: string;
//   [key: string]: any; // Allow other properties
// }

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

// interface Store {
//   _id: string;
//   name: string;
//   code: string;
// }

export const StoreStockPage = () => {
  const [records, setRecords] = useState<StoreStock[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Get user role on component mount
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        const role = user.role_name || user.role || null;
        setUserRole(role);
        console.log('User role:', role); // Debug log
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  const fetchStock = useCallback(async (page?: number) => {
    setLoading(true);
    try {
      const response = await storeStockService.list({ page: page ?? pagination.page, limit: pagination.limit });
      console.log('Store stock response:', response); // Debug log
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
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchStock(1);
  }, [fetchStock]);

  // const fetchItemsAndStores = async () => {
  //   setItemLoading(true);
  //   setStoreLoading(true);

  //   try {
  //     // Fetch items with 'approved' QC status
  //     const itemsResponse = await getItems(1, 100, { qcStatus: 'approved' });
  //     // Map the items to our ItemType interface
  //     const mappedItems = itemsResponse.data.map(item => ({
  //       ...item,
  //       id: item.id
  //     }));
  //     setItems(mappedItems);
  //   } catch (error) {
  //     console.error('Failed to load items', error);
  //     toast.error('Unable to load items');
  //   } finally {
  //     setItemLoading(false);
  //   }

  //   try {
  //     // Fetch active stores - filtered by user role
  //     const userData = localStorage.getItem('userData');
  //     const user = userData ? JSON.parse(userData) : null;

  //     const params: any = {};

  //     // If user has a specific role, pass it to filter stores
  //     const userRole = user?.role || user?.role_name; // Handle both possible field names
  //     if (user?.id && userRole) {
  //       params.userId = user.id;
  //       params.userRole = userRole;
  //     }

  //     const storesResponse = await storeService.listStores(params);
  //     setStores(storesResponse.data);
  //   } catch (error) {
  //     console.error('Failed to load stores', error);
  //     toast.error('Unable to load stores');
  //   } finally {
  //     setStoreLoading(false);
  //   }
  // };

  // const handleAdjustQuantity = async (stock: StoreStock) => {
  //   const newQuantity = editingQuantity[stock.id];
  //   if (newQuantity == null || Number.isNaN(newQuantity)) {
  //     toast.error('Enter a valid quantity');
  //     return;
  //   }
  //   try {
  //     await storeStockService.adjustQuantity(stock.id, newQuantity);
  //     toast.success('Stock updated');
  //     setEditingQuantity((prev) => {
  //       const next = { ...prev };
  //       delete next[stock.id];
  //       return next;
  //     });
  //     fetchStock(pagination.page);
  //   } catch (error) {
  //     console.error('Failed to update quantity', error);
  //     toast.error('Unable to update quantity');
  //   }
  // };

  // Open modal for adding new stock
  // const handleOpenAddModal = () => {
  //   setIsEditMode(false);
  //   setEditingStockId(null);
  //   setStockForm({
  //     productId: '',
  //     storeId: '',
  //     quantity: 1,
  //     margin: 0,
  //     currency: 'INR'
  //   });
  //   setIsModalOpen(true);
  //   fetchItemsAndStores();
  // };

  // Open modal for editing existing stock
  // const handleOpenEditModal = (stock: StoreStock) => {
  //   setIsEditMode(true);
  //   setEditingStockId(stock.id);
  //   setStockForm({
  //     productId: stock.product?.id || '',
  //     storeId: stock.store?._id || '',
  //     quantity: stock.quantity,
  //     margin: stock.margin,
  //     currency: stock.currency
  //   });
  //   setIsModalOpen(true);
  //   fetchItemsAndStores();
  // };

  // Handle submit for both add and edit
  // const handleSubmitStock = async () => {
  //   if (!stockForm.productId || !stockForm.storeId) {
  //     toast.error('Please select both item and store');
  //     return;
  //   }

  //   if (stockForm.quantity <= 0) {
  //     toast.error('Quantity must be greater than 0');
  //     return;
  //   }

  //   try {
  //     if (isEditMode && editingStockId) {
  //       // Update existing stock
  //       await storeStockService.update(editingStockId, {
  //         productId: stockForm.productId,
  //         storeId: stockForm.storeId,
  //         quantity: stockForm.quantity,
  //         margin: stockForm.margin,
  //         currency: stockForm.currency as 'INR' | 'AED'
  //       });
  //       toast.success('Stock updated successfully');
  //     } else {
  //       // Add new stock
  //       await storeStockService.save({
  //         productId: stockForm.productId,
  //         storeId: stockForm.storeId,
  //         quantity: stockForm.quantity,
  //         margin: stockForm.margin,
  //         currency: stockForm.currency as 'INR' | 'AED'
  //       });
  //       toast.success('Stock added successfully');
  //     }

  //     setIsModalOpen(false);
  //     setStockForm({
  //       productId: '',
  //       storeId: '',
  //       quantity: 1,
  //       margin: 0,
  //       currency: 'INR'
  //     });
  //     setIsEditMode(false);
  //     setEditingStockId(null);
  //     fetchStock(pagination.page);
  //   } catch (error) {
  //     console.error(`Failed to ${isEditMode ? 'update' : 'add'} stock`, error);
  //     toast.error(`Unable to ${isEditMode ? 'update' : 'add'} stock`);
  //   }
  // };

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
            <Button variant="outline" onClick={() => fetchStock(pagination.page)} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">


          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Margin %</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Source</TableHead>
                  {/* <TableHead className="text-right">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading store stock...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No stock available. Items will automatically appear here when they pass Quality Control (QC status = "approved").
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
                      <TableCell>{record.margin}%</TableCell>
                      <TableCell>{record.currency}</TableCell>
                      <TableCell>{record.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>{record.quantity}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Auto QC
                        </span>
                      </TableCell>
                      {/* <TableCell className="text-right space-x-2">

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditModal(record)}
                        >
                          <Pen className="h-4 w-4" />
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchStock(pagination.page - 1)} disabled={!pagination.hasPrevPage}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => fetchStock(pagination.page + 1)} disabled={!pagination.hasNextPage}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Stock Modal */}
      {/* <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Stock' : 'Add Stock'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update stock details including margin and currency.'
                : 'Manually add stock to a store. Note: Items are automatically added to purchaser stores when they pass QC.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item" className="text-right">
                Item
              </Label>
              <Select
                value={stockForm.productId}
                onValueChange={(value) => setStockForm({ ...stockForm, productId: value })}
                disabled={itemLoading || isEditMode}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={itemLoading ? "Loading..." : "Select item"} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {(item.name || item.item_name || 'Unnamed Item')} ({item.code || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="store" className="text-right">
                Store
              </Label>
              <Select
                value={stockForm.storeId}
                onValueChange={(value) => setStockForm({ ...stockForm, storeId: value })}
                disabled={storeLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={storeLoading ? "Loading..." : "Select store"} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store._id} value={store._id}>
                      {store.name} ({store.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                className="col-span-3"
                value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="margin" className="text-right">
                Margin (%)
              </Label>
              <Input
                id="margin"
                type="number"
                min="0"
                className="col-span-3"
                value={stockForm.margin}
                onChange={(e) => setStockForm({ ...stockForm, margin: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <Select
                value={stockForm.currency}
                onValueChange={(value) => setStockForm({ ...stockForm, currency: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitStock}>
              {isEditMode ? 'Update Stock' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  );
};