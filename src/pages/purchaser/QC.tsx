import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, Loader2, Edit, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { inventoryService } from '@/services/inventoryService';
import { qualityCheckService } from '@/services/qualityCheckService';
import { supplierService } from '@/services/supplierService';
import type { Item } from '@/types/backend';

// Extended Supplier interface to include selectedSupplies
interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  selectedSupplies?: string[];
}

const QualityControlPage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogItem, setDialogItem] = useState<Item | null>(null);
  const [dialogStatus, setDialogStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [dialogRemarks, setDialogRemarks] = useState('');
  const [dialogDamagedQuantity, setDialogDamagedQuantity] = useState('0');
  const [dialogInspectorName, setDialogInspectorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [supplierMap, setSupplierMap] = useState<Record<string, { name: string; contactPerson?: string }>>({});
  const [totalPendingCount, setTotalPendingCount] = useState(0);

  const getItemId = (item: Item) => item.id ?? (item as { _id?: string })._id ?? '';

  const hydrateSupplierNames = async (fetchedItems: Item[]) => {
    const missingItems = fetchedItems.filter((item) => !item.vendor?.name);
    if (missingItems.length === 0) {
      setSupplierMap({});
      return;
    }

    try {
      const missingIds = new Set(
        missingItems
          .map((item) => getItemId(item))
          .filter((id): id is string => Boolean(id))
      );
      const response = await supplierService.listSuppliers({ limit: 200, status: 'approved' });
      const lookup: Record<string, { name: string; contactPerson?: string }> = {};
      response.data.forEach((supplier: Supplier) => {
        supplier.selectedSupplies?.forEach((supplyId: string) => {
          if (missingIds.has(supplyId)) {
            lookup[supplyId] = { name: supplier.name, contactPerson: supplier.contactPerson };
          }
        });
      });
      setSupplierMap(lookup);
    } catch (error) {
      console.error('Failed to load supplier data', error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getItems({ qcStatus: 'pending', isActive: true, limit: 50 });
      setItems(response.data);
      const pendingItems = response.data.filter(item => item.qcStatus === 'pending');
      setTotalPendingCount(pendingItems.length);
      await hydrateSupplierNames(response.data);
    } catch (error) {
      console.error('Failed to load QC items', error);
      toast.error('Unable to load quality check queue');
      setItems([]);
      setSupplierMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);



  const openDialog = (item: Item) => {
    setDialogItem(item);
    setDialogStatus(item.qcStatus ?? 'pending');
    setDialogRemarks(item.qcRemarks ?? '');
    setDialogDamagedQuantity(String(item.damagedQuantity ?? 0));
    setDialogInspectorName(item.inspectorName ?? '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
    setDialogItem(null);
    setDialogRemarks('');
    setDialogInspectorName('');
  };

  const handleDialogSubmit = async () => {
    if (!dialogItem) return;
    const productId = getItemId(dialogItem);
    if (!productId) {
      toast.error('Item identifier missing');
      return;
    }
    setSubmitting(true);
    const parsedDamage =
      dialogDamagedQuantity.trim() === '' ? 0 : Number(dialogDamagedQuantity);
    if (Number.isNaN(parsedDamage) || parsedDamage < 0) {
      toast.error('Damaged quantity must be zero or greater');
      return;
    }
    try {
      await qualityCheckService.submit({
        productId,
        status: dialogStatus,
        remarks: dialogRemarks,
        damagedQuantity: parsedDamage,
        inspectorName: dialogInspectorName
      });
      toast.success('Quality check updated successfully');
      closeDialog();
      fetchItems();
    } catch (error) {
      console.error('Failed to submit QC result', error);
      toast.error('Unable to submit quality check');
    } finally {
      setSubmitting(false);
    }
  };

  const criticalItems = useMemo(() => items.filter((item) => (item.quantity ?? 0) === 0).length, [items]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Quality Control Queue
          </CardTitle>
          <CardDescription>Validate inbound products before they reach packing and store operations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Pending QC Items</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalPendingCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Items Without Stock</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : criticalItems}
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Damaged Qty</TableHead>
                  <TableHead>QC Status</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading pending items...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      All caught up! No items awaiting quality check.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const itemId = getItemId(item);
                    const supplierFallback = itemId ? supplierMap[itemId] : undefined;
                    const vendorName = item.vendor?.name ?? supplierFallback?.name ?? 'Unassigned';
                    const statusColor =
                      item.qcStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.qcStatus === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900';
                    return (
                      <TableRow key={itemId || item.code}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">Code: {item.code}</div>
                        </TableCell>
                        <TableCell>{vendorName}</TableCell>
                        <TableCell>{typeof item.damagedQuantity === 'number' ? item.damagedQuantity : '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColor}>
                            {item.qcStatus ?? 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-sm text-sm text-muted-foreground">
                          {item.qcRemarks?.length ? item.qcRemarks : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openDialog(item)}
                            disabled={item.qcStatus === 'approved'}
                            title={item.qcStatus === 'approved' ? 'Approved items cannot be edited' : 'Edit QC details'}
                          >
                            {item.qcStatus === 'approved' ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
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
      </Card >

      <Dialog open={dialogOpen} onOpenChange={(next) => (next ? setDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Quality Check</DialogTitle>
            <DialogDescription>
              {dialogItem ? `${dialogItem.name} • ${dialogItem.code}` : 'Select an item to continue.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="qc-status">QC Status</Label>
              <Select value={dialogStatus} onValueChange={(value) => setDialogStatus(value as 'pending' | 'approved' | 'rejected')}>
                <SelectTrigger id="qc-status">
                  <SelectValue placeholder="Select QC status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="damaged-qty">Damaged Quantity</Label>
              <Input
                id="damaged-qty"
                type="number"
                min={0}
                value={dialogDamagedQuantity}
                onChange={(event) => setDialogDamagedQuantity(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspector-name">Inspector Name</Label>
              <Input
                id="inspector-name"
                placeholder="Enter inspector name"
                value={dialogInspectorName}
                onChange={(event) => setDialogInspectorName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qc-remarks">Remarks</Label>
              <Textarea
                id="qc-remarks"
                rows={4}
                placeholder="Add your inspection notes..."
                value={dialogRemarks}
                onChange={(event) => setDialogRemarks(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleDialogSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};
export default QualityControlPage;
