import { useCallback, useEffect, useState } from 'react';
import { Warehouse, RefreshCcw, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { storeStockService } from '@/services/storeStockService';
import { getItems } from '@/services/itemService';
import { storeService } from '@/services/storeService';
import type { StoreStock, PaginationMeta } from '@/types/backend';

// Define the item type based on the actual API response
interface ItemType {
  id: string;
  name?: string;
  code?: string;
  item_name?: string;
  [key: string]: any; // Allow other properties
}

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

interface Store {
  _id: string;
  name: string;
  code: string;
}

export const StoreStockPage = () => {
  const [records, setRecords] = useState<StoreStock[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [editingQuantity, setEditingQuantity] = useState<Record<string, number>>({});
  
  // Add stock modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [items, setItems] = useState<ItemType[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [addItemForm, setAddItemForm] = useState({
    productId: '',
    storeId: '',
    quantity: 1,
    margin: 0,
    currency: 'INR'
  });
  const [itemLoading, setItemLoading] = useState(false);
  const [storeLoading, setStoreLoading] = useState(false);

  const fetchStock = useCallback(async (page?: number) => {
    setLoading(true);
    try {
      const response = await storeStockService.list({ page: page ?? pagination.page, limit: pagination.limit });
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

  // Fetch items and stores for the add modal
  const fetchItemsAndStores = async () => {
    setItemLoading(true);
    setStoreLoading(true);
    
    try {
      // Fetch items with 'approved' QC status
      const itemsResponse = await getItems(1, 100, { qcStatus: 'approved' });
      // Map the items to our ItemType interface
      const mappedItems = itemsResponse.data.map(item => ({
        ...item,
        id: item.id
      }));
      setItems(mappedItems);
    } catch (error) {
      console.error('Failed to load items', error);
      toast.error('Unable to load items');
    } finally {
      setItemLoading(false);
    }
    
    try {
      // Fetch active stores
      const storesResponse = await storeService.listStores({ type: 'all' });
      setStores(storesResponse.data);
    } catch (error) {
      console.error('Failed to load stores', error);
      toast.error('Unable to load stores');
    } finally {
      setStoreLoading(false);
    }
  };

  const handleAdjustQuantity = async (stock: StoreStock) => {
    const newQuantity = editingQuantity[stock.id];
    if (newQuantity == null || Number.isNaN(newQuantity)) {
      toast.error('Enter a valid quantity');
      return;
    }
    try {
      await storeStockService.adjustQuantity(stock.id, newQuantity);
      toast.success('Stock updated');
      setEditingQuantity((prev) => {
        const next = { ...prev };
        delete next[stock.id];
        return next;
      });
      fetchStock(pagination.page);
    } catch (error) {
      console.error('Failed to update quantity', error);
      toast.error('Unable to update quantity');
    }
  };

  const handleAddStock = async () => {
    if (!addItemForm.productId || !addItemForm.storeId) {
      toast.error('Please select both item and store');
      return;
    }
    
    if (addItemForm.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    try {
      await storeStockService.save({
        productId: addItemForm.productId,
        quantity: addItemForm.quantity,
        margin: addItemForm.margin,
        currency: addItemForm.currency as 'INR' | 'AED'
      });
      
      toast.success('Stock added successfully');
      setIsAddModalOpen(false);
      setAddItemForm({
        productId: '',
        storeId: '',
        quantity: 1,
        margin: 0,
        currency: 'INR'
      });
      fetchStock(pagination.page);
    } catch (error) {
      console.error('Failed to add stock', error);
      toast.error('Unable to add stock');
    }
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
            <CardDescription>Monitor approved products and apply margin adjustments before billing.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              setIsAddModalOpen(true);
              fetchItemsAndStores();
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add Stock
            </Button>
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
                  <TableHead>Item</TableHead>
                  <TableHead>Margin %</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Price After Margin</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Adjust Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading store stock...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No stock available. Approve items from quality control to populate store stock.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.product?.name ?? 'Unnamed Item'}</div>
                        <div className="text-xs text-muted-foreground">Code: {record.product?.code}</div>
                      </TableCell>
                      <TableCell>{record.margin}%</TableCell>
                      <TableCell>{record.currency}</TableCell>
                      <TableCell>{record.priceAfterMargin.toFixed(2)}</TableCell>
                      <TableCell>{record.quantity}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Input
                          type="number"
                          min={0}
                          className="w-24 inline-flex"
                          value={editingQuantity[record.id] ?? record.quantity}
                          onChange={(event) => setEditingQuantity((prev) => ({ ...prev, [record.id]: Number(event.target.value) }))}
                        />
                        <Button size="sm" onClick={() => handleAdjustQuantity(record)}>
                          Update
                        </Button>
                      </TableCell>
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

      {/* Add Stock Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              Add new stock to a store by selecting an item and specifying quantity.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item" className="text-right">
                Item
              </Label>
              <Select 
                value={addItemForm.productId} 
                onValueChange={(value) => setAddItemForm({...addItemForm, productId: value})}
                disabled={itemLoading}
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
                value={addItemForm.storeId} 
                onValueChange={(value) => setAddItemForm({...addItemForm, storeId: value})}
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
                value={addItemForm.quantity}
                onChange={(e) => setAddItemForm({...addItemForm, quantity: parseInt(e.target.value) || 1})}
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
                value={addItemForm.margin}
                onChange={(e) => setAddItemForm({...addItemForm, margin: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <Select 
                value={addItemForm.currency} 
                onValueChange={(value) => setAddItemForm({...addItemForm, currency: value})}
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
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStock}>Add Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};