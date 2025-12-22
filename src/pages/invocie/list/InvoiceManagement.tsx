import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Filter,
  BadgeDollarSign,
  Edit,
  Download,
  Trash2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { salesInvoiceService, type SalesInvoice } from "@/services/salesInvoiceService";
import generateInvoicePDF from "../config/InvoicePrintTemplate";
import { format } from "date-fns";

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

type SortOrder = 'asc' | 'desc' | null;
interface SortConfig {
  field: string | null;
  order: SortOrder;
}

export default function SalesInvoiceList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'invoiceDate', order: 'desc' });
  const [dateFilter, setDateFilter] = useState<[string, string]>(["", ""]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<SalesInvoice | null>(null);

  // Format date to "MMM DD, YYYY"
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Fetch invoices from API
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await salesInvoiceService.listInvoices({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        dateFrom: dateFilter[0] || undefined,
        dateTo: dateFilter[1] || undefined,
        sortBy: sortConfig.field || undefined,
        sortOrder: sortConfig.order || undefined,
      });

      if (response.data) {
        setInvoices(response.data);
        if (response.meta) {
          setPagination({
            total: response.meta.total,
            totalPages: response.meta.totalPages,
            currentPage: response.meta.page,
            hasNextPage: response.meta.hasNextPage,
            hasPrevPage: response.meta.hasPrevPage,
          });
        }
      }
    } catch (err: any) {
      toast.error(`Failed to fetch invoices: ${err.message || 'Unknown error'}`);
      console.error('Error fetching invoices:', err);
      setInvoices([]);
      setPagination({
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchInvoices();
  }, [searchQuery, dateFilter, currentPage, itemsPerPage, sortConfig]);

  // Export invoices data to CSV
  const exportInvoicesToCSV = async () => {
    try {
      // Fetch all invoices for export
      const response = await salesInvoiceService.listInvoices({
        page: 1,
        limit: 10000, // Large limit to get all
        search: searchQuery || undefined,
        dateFrom: dateFilter[0] || undefined,
        dateTo: dateFilter[1] || undefined,
        sortBy: sortConfig.field || undefined,
        sortOrder: sortConfig.order || undefined,
      });

      if (!response.data || response.data.length === 0) {
        toast.error('No invoices to export');
        return;
      }

      // Prepare CSV headers
      const headers = ['Invoice Number', 'Customer Name', 'Invoice Date', 'Total Amount', 'Sub Total', 'Discount', 'Tax'];
      
      // Convert invoices to CSV rows
      const csvRows = response.data.map((invoice) => {
        const customerName = typeof invoice.customer === 'object' && invoice.customer !== null
          ? invoice.customer.name
          : 'N/A';
        
        return [
          `"${invoice.invoiceNumber}"`,
          `"${customerName}"`,
          `"${format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}"`,
          `"${invoice.netAmount}"`,
          `"${invoice.subTotal}"`,
          `"${invoice.discountTotal || 0}"`,
          `"${invoice.taxAmount || 0}"`,
        ];
      });

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Invoices exported successfully');
    } catch (err: any) {
      toast.error(`Failed to export invoices: ${err.message || 'Unknown error'}`);
      console.error('Export error:', err);
    }
  };

  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    try {
      const invoiceId = invoiceToDelete._id || invoiceToDelete.id;
      if (!invoiceId) {
        toast.error('Invalid invoice ID');
        return;
      }

      await salesInvoiceService.deleteInvoice(invoiceId);
      toast.success('Invoice deleted successfully');
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (err: any) {
      toast.error(`Failed to delete invoice: ${err.message || 'Unknown error'}`);
      console.error('Delete error:', err);
    }
  };

  const handleViewDetails = (invoice: SalesInvoice) => {
    const invoiceId = invoice._id || invoice.id;
    if (invoiceId) {
      navigate(`/dashboard/invoice/view/${invoiceId}`);
    }
  };

  const handleEditInvoice = (invoice: SalesInvoice) => {
    const invoiceId = invoice._id || invoice.id;
    if (invoiceId) {
      navigate(`/dashboard/invoice/edit/${invoiceId}`);
    }
  };

  const handleDeleteClick = (invoice: SalesInvoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handlePrintInvoice = (invoice: SalesInvoice) => {
    if (!invoice) return;

    const customerName = typeof invoice.customer === 'object' && invoice.customer !== null
      ? invoice.customer.name
      : 'N/A';
    const customerPhone = typeof invoice.customer === 'object' && invoice.customer !== null
      ? invoice.customer.phone || 'N/A'
      : 'N/A';
    // const customerEmail = typeof invoice.customer === 'object' && invoice.customer !== null
    //   ? invoice.customer.email || ''
    //   : '';

    const storeName = typeof invoice.store === 'object' && invoice.store !== null
      ? invoice.store.name
      : 'N/A';
    const storeCode = typeof invoice.store === 'object' && invoice.store !== null
      ? invoice.store.code || ''
      : '';

    const invoiceData = {
      id: invoice._id || invoice.id || '',
      invoiceNumber: invoice.invoiceNumber,
      customer: {
        name: customerName,
        contact: customerPhone,
        address: '',
      },
      store: {
        name: storeName,
        contact: storeCode,
      },
      items: invoice.items.map((item, index) => {
        const itemName = typeof item.item === 'object' && item.item !== null
          ? item.item.name
          : 'Unknown Item';
        const grossAmount = item.quantity * item.unitPrice;
        const discount = item.discount || 0;
        const discountAmount = (discount / 100) * grossAmount;
        const netAmount = grossAmount - discountAmount;

        return {
          id: typeof item.item === 'object' && item.item !== null ? item.item._id : String(index),
          itemNumber: typeof item.item === 'object' && item.item !== null ? item.item.code || '' : '',
          name: itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: discountAmount,
          vat: item.vat || 0,
          vatAmount: item.vatAmount || 0,
          grossAmount: grossAmount,
          netAmount: netAmount,
        };
      }),
      date: invoice.invoiceDate,
      status: 'pending' as const,
    };

    generateInvoicePDF(invoiceData);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        if (prev.order === 'asc') {
          return { field, order: 'desc' };
        } else if (prev.order === 'desc') {
          return { field: null, order: null };
        } else {
          return { field, order: 'asc' };
        }
      } else {
        return { field, order: 'asc' };
      }
    });
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field || !sortConfig.order) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortConfig.order === 'asc') {
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  // Render action buttons for an invoice row
  const renderActionButtons = (invoice: SalesInvoice) => {
    return (
      <div className="flex justify-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleViewDetails(invoice)}
                aria-label={`View invoice ${invoice.invoiceNumber}`}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              View Invoice Details
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEditInvoice(invoice)}
                aria-label={`Edit invoice ${invoice.invoiceNumber}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Edit Invoice
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePrintInvoice(invoice)}
                aria-label={`Print invoice ${invoice.invoiceNumber}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-6 0v4m0 0h4m-4 0H8" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Print Invoice
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDeleteClick(invoice)}
                aria-label={`Delete invoice ${invoice.invoiceNumber}`}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Delete Invoice
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="min-h-[85vh] shadow-sm">
          <CardHeader className="rounded-t-lg border-b pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-blue-100 shadow-sm">
                  <BadgeDollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    Sales Invoices
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Manage your sales invoices and transactions
                  </CardDescription>
                </div>
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={exportInvoicesToCSV}
                  className="transition-colors me-2"
                  disabled={invoices.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span>Export CSV</span>
                </Button>
                <Button
                  onClick={() => navigate('/dashboard/invoice/add')}
                  className="transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Invoice
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by invoice number, customer, or contact number..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    className="w-[150px]"
                    value={dateFilter[0]}
                    onChange={(e) => {
                      setDateFilter([e.target.value, dateFilter[1]]);
                      setCurrentPage(1);
                    }}
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="date"
                    className="w-[150px]"
                    value={dateFilter[1]}
                    onChange={(e) => {
                      setDateFilter([dateFilter[0], e.target.value]);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter(["", ""]);
                    setCurrentPage(1);
                  }}
                  className="transition-colors"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-gray-50 border-gray-200">
                    <TableHead className="font-semibold w-1/4">
                      <button
                        type="button"
                        onClick={() => handleSort('invoiceNumber')}
                        className="h-8 flex items-center gap-1 font-semibold cursor-pointer w-auto ps-2 hover:text-blue-600"
                        aria-label={`Sort by Invoice Number ${sortConfig.field === 'invoiceNumber' ? sortConfig.order : 'asc'}`}
                      >
                        Invoice #
                        {getSortIcon('invoiceNumber')}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <button
                        type="button"
                        onClick={() => handleSort('customer')}
                        className="h-8 flex items-center gap-1 font-semibold cursor-pointer w-auto hover:text-blue-600"
                        aria-label={`Sort by Customer ${sortConfig.field === 'customer' ? sortConfig.order : 'asc'}`}
                      >
                        Customer
                        {getSortIcon('customer')}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <button
                        type="button"
                        onClick={() => handleSort('invoiceDate')}
                        className="h-8 flex items-center gap-1 font-semibold cursor-pointer w-auto hover:text-blue-600"
                        aria-label={`Sort by Date ${sortConfig.field === 'invoiceDate' ? sortConfig.order : 'asc'}`}
                      >
                        Date
                        {getSortIcon('invoiceDate')}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('netAmount')}
                        className="h-8 flex items-center gap-1 font-semibold cursor-pointer w-full justify-end hover:text-blue-600"
                        aria-label={`Sort by Total Amount ${sortConfig.field === 'netAmount' ? sortConfig.order : 'asc'}`}
                      >
                        Total Amount
                        {getSortIcon('netAmount')}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-left pr-2">Store</TableHead>
                    <TableHead className="text-center font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(itemsPerPage).fill(0).map((_, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="py-3">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse ms-auto"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div></TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : invoices.length > 0 ? (
                    invoices.map((invoice) => {
                      const customerName = typeof invoice.customer === 'object' && invoice.customer !== null
                        ? invoice.customer.name
                        : 'N/A';
                      const storeName = typeof invoice.store === 'object' && invoice.store !== null
                        ? invoice.store.name
                        : 'N/A';
                      const invoiceId = invoice._id || invoice.id || '';

                      return (
                        <TableRow key={invoiceId} className="hover:bg-gray-50">
                          <TableCell className="font-medium py-3 ps-4">
                            <a
                              href="#"
                              onClick={e => {
                                e.preventDefault();
                                handleViewDetails(invoice);
                              }}
                              className="text-blue-600 underline hover:text-blue-800 transition-colors"
                              title="View Invoice Details"
                            >
                              {invoice.invoiceNumber}
                            </a>
                          </TableCell>
                          <TableCell>{customerName}</TableCell>
                          <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                          <TableCell className="text-right">{invoice.netAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-left pr-2">{storeName}</TableCell>
                          <TableCell className="text-center">
                            {renderActionButtons(invoice)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow className="hover:bg-gray-50">
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center py-6">
                          <FileText className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-base font-medium">No invoices found for selected criteria.</p>
                          <p className="text-sm text-gray-500">Try adjusting your search or filter</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-6 gap-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Show
                </p>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder={itemsPerPage.toString()} />
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
                  Showing {pagination.total > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} entries
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={!pagination.hasPrevPage || loading}
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
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNextPage || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}