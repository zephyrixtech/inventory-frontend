import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  Download,
  Eye,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from 'react-hot-toast';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { inventoryService } from '@/services/inventoryService';
import type { Item, PaginationMeta } from '@/types/backend';

interface PaginationState extends PaginationMeta {}

type SortOrder = 'asc' | 'desc' | null;
interface SortConfig {
  field: string | null;
  order: SortOrder;
}

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export const Inventory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', order: 'asc' });
  const [inventory, setInventory] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const fetchInventory = useCallback(async (page?: number) => {
    setLoading(true);
    try {
      const currentPage = page ?? pagination.page;
      const response = await inventoryService.getItems({
        page: currentPage,
        limit: pagination.limit,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: sortConfig.field ?? undefined,
        sortOrder: sortConfig.order ?? undefined,
      });

      setInventory(response.data);
      setPagination({
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
        hasNextPage: response.meta.hasNextPage,
        hasPrevPage: response.meta.hasPrevPage,
      });
    } catch (error) {
      console.error('Error fetching inventory', error);
      toast.error('Failed to fetch inventory');
      setInventory([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, searchQuery, statusFilter, sortConfig.field, sortConfig.order]);

  // Initial load
  useEffect(() => {
    fetchInventory(1);
  }, []);

  useEffect(() => {
    fetchInventory(1);
  }, [statusFilter, sortConfig]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInventory(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        const nextOrder = prev.order === 'asc' ? 'desc' : prev.order === 'desc' ? null : 'asc';
        return { field: nextOrder ? field : null, order: nextOrder };
      }
      return { field, order: 'asc' };
    });
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    const targetPage = direction === 'next' ? pagination.page + 1 : pagination.page - 1;
    if (targetPage < 1 || targetPage > pagination.totalPages) return;
    fetchInventory(targetPage);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      const itemId = selectedItem.id || selectedItem._id;
      if (!itemId) {
        toast.error('Invalid item ID');
        return;
      }
      await inventoryService.deactivateItem(itemId);
      toast.success('Item deactivated successfully');
      setIsDialogOpen(false);
      fetchInventory(pagination.page);
    } catch (error) {
      console.error('Failed to delete item', error);
      toast.error('Failed to deactivate item');
    }
  };

  const exportItemsToCSV = useCallback(() => {
    if (inventory.length === 0) {
      toast.error('No items to export');
      return;
    }

    try {
      const headers = ['Item Code', 'Item Name', 'Bill Number', 'Vendor', 'Unit Price', 'Quantity', 'Damaged Qty', 'Available Qty', 'Currency', 'Status'];
      const rows = inventory.map((item) => [
        item.code || '',
        item.name || '',
        item.billNumber || '',
        item.vendor?.name ?? 'No Vendor',
        item.unitPrice ?? 0,
        item.quantity ?? 0,
        item.damagedQuantity ?? 0,
        item.availableQuantity ?? 0,
        item.currency ?? 'INR',
        item.qcStatus?.replace(/_/g, ' ') ?? 'Unknown',
      ]);

      // Escape CSV values properly
      const escapeCsvValue = (value: unknown): string => {
        const stringValue = String(value ?? '');
        // If value contains comma, newline, or quote, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCsvValue).join(','))
        .join('\n');

      // Add BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  }, [inventory]);

  const sortedInventory = useMemo(() => {
    if (!sortConfig.field || !sortConfig.order) return inventory;
    const sorted = [...inventory].sort((a, b) => {
      const valueA = (a as unknown as Record<string, unknown>)[sortConfig.field!];
      const valueB = (b as unknown as Record<string, unknown>)[sortConfig.field!];

      if (valueA === valueB) return 0;
      if (valueA == null || valueB == null) return valueA == null ? -1 : 1;
      const comparator = valueA > valueB ? 1 : -1;
      return sortConfig.order === 'asc' ? comparator : -comparator;
    });
    return sorted;
  }, [inventory, sortConfig]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Inventory Items
            </CardTitle>
            <CardDescription>Manage your product catalog and track stock levels.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportItemsToCSV}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => navigate('/dashboard/item-master/add')}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative col-span-1 md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    fetchInventory(1);
                  }
                }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_qc">Pending QC</SelectItem>
                <SelectItem value="qc_passed">QC Passed</SelectItem>
                <SelectItem value="store_approved">Store Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('code')} className="cursor-pointer">
                    <div className="flex items-center gap-1">Item Code {sortConfig.field === 'code' ? (sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />) : <ArrowUpDown className="h-4 w-4" />}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                    <div className="flex items-center gap-1">Item Name {sortConfig.field === 'name' ? (sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />) : <ArrowUpDown className="h-4 w-4" />}</div>
                  </TableHead>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Damaged Qty</TableHead>
                  <TableHead>Available Qty</TableHead>
                  <TableHead>QC Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Loading inventory...
                    </TableCell>
                  </TableRow>
                ) : sortedInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedInventory.map((item) => {
                    const itemId = item.id || item._id;
                    return (
                    <TableRow key={itemId}>
                      <TableCell>{item.code}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.billNumber || '-'}</TableCell>
                      <TableCell>{item.vendor?.name ?? 'No Vendor'}</TableCell>
                      <TableCell>{item.unitPrice ?? '-'}</TableCell>
                      <TableCell>{item.quantity ?? 0}</TableCell>
                      <TableCell>{item.damagedQuantity ?? 0}</TableCell>
                      <TableCell>{item.availableQuantity ?? 0}</TableCell>
                      <TableCell>{item.qcStatus?.replace(/_/g, ' ') ?? 'Unknown'}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => {
                                const itemId = item.id || item._id;
                                if (itemId) {
                                  navigate(`/dashboard/item-master/view/${itemId}`);
                                } else {
                                  toast.error('Invalid item ID');
                                }
                              }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => {
                                const itemId = item.id || item._id;
                                if (itemId) {
                                  navigate(`/dashboard/item-master/edit/${itemId}`);
                                } else {
                                  toast.error('Invalid item ID');
                                }
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Deactivate</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
              Showing page {pagination.page} of {pagination.totalPages} · Total {pagination.total} items
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePageChange('prev')} disabled={!pagination.hasPrevPage}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePageChange('next')} disabled={!pagination.hasNextPage}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              This will mark the item as inactive. You can re-enable it later from the edit screen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};