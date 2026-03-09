import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { storeService, type Store } from '@/services/storeService';
import { storeStockService } from '@/services/storeStockService';
import { stockTransferService } from '@/services/stockTransferService';
import type { StockTransfer, StoreStock } from '@/types/backend';

const isIndian = (country?: string) => {
  const value = (country || '').trim().toLowerCase();
  if (!value) return false;
  return value === 'india' || value === 'ind' || value === 'in' || value.includes('india');
};

const getRole = (): string => {
  try {
    const raw = localStorage.getItem('userData');
    if (!raw) return '';
    const user = JSON.parse(raw);
    if (typeof user.role === 'string') return user.role.toLowerCase();
    if (user.role && typeof user.role === 'object') return (user.role.name || user.role.role_name || '').toLowerCase();
    return (user.role_name || '').toLowerCase();
  } catch {
    return '';
  }
};

export const StockTransferPage = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [indianStores, setIndianStores] = useState<Store[]>([]);
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [sourceStocks, setSourceStocks] = useState<StoreStock[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [qtyByStockId, setQtyByStockId] = useState<Record<string, string>>({});
  const [notesByStockId, setNotesByStockId] = useState<Record<string, string>>({});
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [approvingFor, setApprovingFor] = useState<string | null>(null);

  const role = useMemo(() => getRole(), []);
  const canApprove = role === 'superadmin' || role === 'admin' || role === 'purchaser';

  const fetchStores = useCallback(async () => {
    try {
      const response = await storeService.listStores();
      const all = response.data || [];
      setStores(all);
      setIndianStores(all.filter((store) => isIndian(store.country)));
    } catch (error) {
      console.error('Failed to load stores', error);
      toast.error('Unable to load stores');
    }
  }, []);

  const fetchSourceStock = useCallback(async () => {
    if (!fromStoreId) {
      setSourceStocks([]);
      return;
    }

    setLoadingStocks(true);
    try {
      const response = await storeStockService.list({ page: 1, limit: 200, storeId: fromStoreId });
      const availableStocks = (response.data || []).filter((entry) => (entry.quantity || 0) > 0);
      setSourceStocks(availableStocks);
    } catch (error) {
      console.error('Failed to load source store stock', error);
      toast.error('Unable to load source store stock');
      setSourceStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  }, [fromStoreId]);

  const fetchTransfers = useCallback(async () => {
    setLoadingTransfers(true);
    try {
      const response = await stockTransferService.list({ page: 1, limit: 100 });
      setTransfers(response.data || []);
    } catch (error) {
      console.error('Failed to load stock transfers', error);
      toast.error('Unable to load stock transfers');
      setTransfers([]);
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    fetchTransfers();
  }, [fetchStores, fetchTransfers]);

  useEffect(() => {
    fetchSourceStock();
  }, [fetchSourceStock]);

  const handleCreateTransfer = async (stock: StoreStock) => {
    if (!fromStoreId) {
      toast.error('Select a source store');
      return;
    }

    if (!toStoreId) {
      toast.error('Select a destination store');
      return;
    }

    if (fromStoreId === toStoreId) {
      toast.error('Source and destination stores cannot be the same');
      return;
    }

    const stockId = (stock as any)._id || stock.id;
    const qty = Number.parseInt(qtyByStockId[stockId] || '0', 10);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error('Enter a valid transfer quantity');
      return;
    }

    if (qty > stock.quantity) {
      toast.error(`Quantity exceeds available stock (${stock.quantity})`);
      return;
    }

    const productId = (stock.product as any)?._id || stock.product?.id;
    if (!productId) {
      toast.error('Invalid stock product');
      return;
    }

    setCreatingFor(stockId);
    try {
      await stockTransferService.create({
        fromStoreId,
        toStoreId,
        productId,
        quantity: qty,
        notes: notesByStockId[stockId] || undefined
      });
      toast.success('Transfer request created with pending status');
      setQtyByStockId((prev) => ({ ...prev, [stockId]: '' }));
      setNotesByStockId((prev) => ({ ...prev, [stockId]: '' }));
      await Promise.all([fetchTransfers(), fetchSourceStock()]);
    } catch (error) {
      console.error('Failed to create stock transfer', error);
      toast.error((error as Error).message || 'Unable to create stock transfer');
    } finally {
      setCreatingFor(null);
    }
  };

  const handleApprove = async (transfer: StockTransfer) => {
    const transferId = transfer._id || transfer.id;
    if (!transferId) {
      toast.error('Invalid transfer id');
      return;
    }
    setApprovingFor(transferId);
    try {
      await stockTransferService.approve(transferId);
      toast.success('Transfer approved and stock moved');
      await Promise.all([fetchTransfers(), fetchSourceStock()]);
    } catch (error) {
      console.error('Failed to approve transfer', error);
      toast.error((error as Error).message || 'Unable to approve transfer');
    } finally {
      setApprovingFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Stock Transfer
            </CardTitle>
            <CardDescription>
              Create pending transfer requests from Indian stores. Approving a request reduces source stock and adds stock to destination store.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => { fetchStores(); fetchTransfers(); fetchSourceStock(); }}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">From Store (India only)</p>
              <Select value={fromStoreId} onValueChange={setFromStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Indian source store" />
                </SelectTrigger>
                <SelectContent>
                  {indianStores.map((store) => (
                    <SelectItem key={store._id} value={store._id}>
                      {store.name} ({store.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">To Store</p>
              <Select value={toStoreId} onValueChange={setToStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination store" />
                </SelectTrigger>
                <SelectContent>
                  {stores
                    .filter((store) => store._id !== fromStoreId)
                    .map((store) => (
                      <SelectItem key={store._id} value={store._id}>
                        {store.name} ({store.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Available Qty</TableHead>
                  <TableHead>Transfer Qty</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fromStoreId ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Select an Indian source store to load stock.
                    </TableCell>
                  </TableRow>
                ) : loadingStocks ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading source stock...
                    </TableCell>
                  </TableRow>
                ) : sourceStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No available stock in selected source store.
                    </TableCell>
                  </TableRow>
                ) : (
                  sourceStocks.map((stock) => {
                    const stockId = (stock as any)._id || stock.id;
                    return (
                      <TableRow key={stockId}>
                        <TableCell>
                          <div className="font-medium">{stock.product?.name || 'Unnamed Item'}</div>
                          <div className="text-xs text-muted-foreground">{stock.product?.code || '-'}</div>
                        </TableCell>
                        <TableCell>{stock.quantity}</TableCell>
                        <TableCell className="w-40">
                          <Input
                            type="number"
                            min="1"
                            max={stock.quantity}
                            value={qtyByStockId[stockId] || ''}
                            onChange={(e) => setQtyByStockId((prev) => ({ ...prev, [stockId]: e.target.value }))}
                            placeholder="Qty"
                          />
                        </TableCell>
                        <TableCell className="w-60">
                          <Input
                            value={notesByStockId[stockId] || ''}
                            onChange={(e) => setNotesByStockId((prev) => ({ ...prev, [stockId]: e.target.value }))}
                            placeholder="Optional note"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleCreateTransfer(stock)}
                            disabled={creatingFor === stockId}
                          >
                            {creatingFor === stockId ? 'Creating...' : 'Transfer'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Requests</CardTitle>
          <CardDescription>Pending requests can be approved to move stock from source store to destination store.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTransfers ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading transfer requests...
                    </TableCell>
                  </TableRow>
                ) : transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No transfer requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((transfer) => {
                    const transferId = transfer._id || transfer.id || '';
                    return (
                      <TableRow key={transferId}>
                        <TableCell>{transfer.createdAt ? format(new Date(transfer.createdAt), 'dd MMM yyyy HH:mm') : '-'}</TableCell>
                        <TableCell>{transfer.fromStore?.name || '-'}</TableCell>
                        <TableCell>{transfer.toStore?.name || '-'}</TableCell>
                        <TableCell>{transfer.product?.name || '-'}</TableCell>
                        <TableCell>{transfer.quantity}</TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${transfer.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : transfer.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {transfer.status}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">{transfer.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          {transfer.status === 'pending' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(transfer)}
                              disabled={!canApprove || approvingFor === transferId}
                            >
                              {approvingFor === transferId ? 'Approving...' : 'Approve'}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {!canApprove && (
            <p className="text-xs text-muted-foreground mt-3">
              You can create transfer requests, but approval requires purchaser/admin access.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
