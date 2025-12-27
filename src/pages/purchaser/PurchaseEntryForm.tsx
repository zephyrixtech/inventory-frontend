import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Save,
  Package,
  DollarSign,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { purchaseEntryService } from '@/services/purchaseEntryService';
import { supplierService } from '@/services/supplierService';
import { inventoryService } from '@/services/inventoryService';

// Validation schema
const purchaseEntryItemSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  description: z.string().optional(),
});

const purchaseEntrySchema = z.object({
  billNumber: z.string().min(1, 'Bill number is required'),
  date: z.string().min(1, 'Date is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  items: z.array(purchaseEntryItemSchema).min(1, 'At least one item is required'),
  totalAmount: z.number().min(0.01, 'Total amount must be greater than 0'),
  discount: z.number().min(0, 'Discount cannot be negative'),
  paidAmount: z.number().min(0, 'Paid amount cannot be negative'),
  notes: z.string().optional(),
});

type PurchaseEntryFormValues = z.infer<typeof purchaseEntrySchema>;

interface Supplier {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  code: string;
  description: string;
  unitPrice?: number;
  quantity?: number;
  totalPrice?: number;
  vendor?: {
    _id?: string;
    id?: string;
    name: string;
  };
}

const PurchaseEntryForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id) && location.pathname.includes('edit');
  const isViewing = Boolean(id) && location.pathname.includes('view');
  
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [billNumberItems, setBillNumberItems] = useState<Item[]>([]);
  const [fetchingBillItems, setFetchingBillItems] = useState(false);
  const [isBillSummaryCollapsed, setIsBillSummaryCollapsed] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedBillNumber = useRef<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue,
    control,
  } = useForm<PurchaseEntryFormValues>({
    resolver: zodResolver(purchaseEntrySchema),
    defaultValues: {
      billNumber: '',
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      items: [{ item: '', description: '' }],
      totalAmount: 0,
      discount: 0,
      paidAmount: 0,
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedTotalAmount = watch('totalAmount');
  const watchedDiscount = watch('discount');
  const paidAmount = watch('paidAmount');
  const watchedBillNumber = watch('billNumber');

  // Manual refresh function for bill items
  const handleRefreshBillItems = () => {
    if (watchedBillNumber) {
      lastFetchedBillNumber.current = ''; // Reset to force refresh
      fetchItemsByBillNumber(watchedBillNumber);
    }
  };

  // Function to toggle bill summary collapse
  const toggleBillSummaryCollapse = () => {
    setIsBillSummaryCollapsed(!isBillSummaryCollapsed);
  };

  // Helper function to get unique vendors from bill items
  const getUniqueVendors = (items: Item[]) => {
    const vendors = items
      .filter(item => item.vendor)
      .map(item => item.vendor!.name);
    return [...new Set(vendors)];
  };

  // Helper function to check if supplier should be auto-populated and disabled
  const shouldDisableSupplierField = () => {
    if (isViewing || isEditing) return false;
    const uniqueVendors = getUniqueVendors(billNumberItems);
    return billNumberItems.length > 0 && uniqueVendors.length === 1;
  };

  // Helper function to get auto-selected supplier info
  const getAutoSelectedSupplierInfo = () => {
    if (!shouldDisableSupplierField()) return null;
    const uniqueVendors = getUniqueVendors(billNumberItems);
    return uniqueVendors.length === 1 ? uniqueVendors[0] : null;
  };

  // Calculate final amount and balance
  const finalAmount = watchedTotalAmount - watchedDiscount;
  const balanceAmount = finalAmount - paidAmount;

  // Function to calculate total amount from items
  const calculateTotalAmountFromItems = (itemsData: any[]) => {
    let totalAmount = 0;
    
    itemsData.forEach((item: any) => {
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 0;
      const itemTotal = unitPrice * quantity;
      totalAmount += itemTotal;
    });
    
    return totalAmount;
  };

  // Function to fetch items by bill number
  const fetchItemsByBillNumber = async (billNumber: string) => {
    if (!billNumber || billNumber.trim() === '') {
      setBillNumberItems([]);
      return;
    }

    setFetchingBillItems(true);
    try {
      // Try the dedicated bill number endpoint first
      let response;
      try {
        response = await inventoryService.getItemsByBillNumber(billNumber);
      } catch (err) {
        // Fallback to search if dedicated endpoint doesn't exist
        response = await inventoryService.getItems({ 
          search: billNumber,
          limit: 1000 
        });
      }
      
      const itemsData = response.data || [];
      // Filter items that have the exact bill number match
      const filteredItems = itemsData.filter((item: any) => 
        item.billNumber && item.billNumber.toLowerCase().includes(billNumber.toLowerCase())
      );
      
      const mappedItems = filteredItems.map((item: any) => ({
        id: item._id || item.id,
        name: item.name,
        code: item.code,
        description: item.description,
        billNumber: item.billNumber,
        unitPrice: item.unitPrice || 0,
        quantity: item.quantity || 0,
        totalPrice: (item.unitPrice || 0) * (item.quantity || 0),
        vendor: item.vendor ? {
          _id: item.vendor._id || item.vendor.id,
          id: item.vendor._id || item.vendor.id,
          name: item.vendor.name
        } : undefined
      }));
      
      setBillNumberItems(mappedItems);
      
      // Auto-populate items if found (only for new entries and if no items are already selected)
      if (mappedItems.length > 0 && !isEditing && !isViewing) {
        const hasSelectedItems = fields.some(field => watch(`items.${fields.indexOf(field)}.item`));
        
        if (!hasSelectedItems) {
          // Clear existing empty items safely
          const currentFieldsLength = fields.length;
          for (let i = currentFieldsLength - 1; i >= 0; i--) {
            remove(i);
          }
          
          // Add the found items
          mappedItems.forEach((item) => {
            append({ 
              item: item.id, 
              description: item.description || '' 
            });
          });
          
          // Note: Total amount will be automatically calculated by the useEffect
          toast.success(`Found ${mappedItems.length} item(s) with bill number: ${billNumber}`);
        }
      }
    } catch (err: any) {
      console.error('Error fetching items by bill number:', err);
      setBillNumberItems([]);
    } finally {
      setFetchingBillItems(false);
    }
  };

  // Watch for bill number changes and fetch items
  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Don't fetch if it's the same bill number we just fetched
    if (watchedBillNumber === lastFetchedBillNumber.current) {
      return;
    }

    fetchTimeoutRef.current = setTimeout(() => {
      if (watchedBillNumber && watchedBillNumber.length >= 2) {
        lastFetchedBillNumber.current = watchedBillNumber;
        fetchItemsByBillNumber(watchedBillNumber);
      } else {
        setBillNumberItems([]);
        lastFetchedBillNumber.current = '';
      }
    }, 500); // Debounce for 500ms

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [watchedBillNumber, isEditing, isViewing]);

  // Auto-sync bill items total to form total amount
  useEffect(() => {
    if (billNumberItems.length > 0 && !isEditing && !isViewing) {
      const calculatedTotal = calculateTotalAmountFromItems(billNumberItems);
      const currentTotal = watch('totalAmount');
      
      // Always update the total amount when bill items change
      // This ensures the total is always in sync with the bill items
      if (calculatedTotal !== currentTotal) {
        setValue('totalAmount', calculatedTotal);
        
        // Show a subtle notification that the total was auto-calculated
        if (calculatedTotal > 0) {
          toast.success(`Total amount auto-calculated: ₹${calculatedTotal.toFixed(2)}`, {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      }
    }
    
    // Clear total amount when no bill items are found
    if (billNumberItems.length === 0 && !isEditing && !isViewing) {
      const currentTotal = watch('totalAmount');
      if (currentTotal > 0) {
        setValue('totalAmount', 0);
      }
    }
  }, [billNumberItems, isEditing, isViewing, setValue, watch]);

  // Auto-populate supplier based on bill items vendor information
  useEffect(() => {
    if (billNumberItems.length > 0 && !isEditing && !isViewing) {
      const uniqueVendors = getUniqueVendors(billNumberItems);
      
      // If all items come from the same vendor, auto-select that vendor as supplier
      if (uniqueVendors.length === 1) {
        const vendorName = uniqueVendors[0];
        
        // Find the supplier that matches the vendor name
        const matchingSupplier = suppliers.find(supplier => 
          supplier.name.toLowerCase() === vendorName.toLowerCase()
        );
        
        if (matchingSupplier) {
          const currentSupplier = watch('supplier');
          if (currentSupplier !== matchingSupplier.id) {
            setValue('supplier', matchingSupplier.id);
            toast.success(`Supplier auto-selected: ${vendorName}`, {
              duration: 2000,
              position: 'bottom-right'
            });
          }
        }
      }
    }
    
    // Clear supplier when no bill items or multiple vendors
    if ((billNumberItems.length === 0 || getUniqueVendors(billNumberItems).length !== 1) && !isEditing && !isViewing) {
      const currentSupplier = watch('supplier');
      if (currentSupplier) {
        setValue('supplier', '');
      }
    }
  }, [billNumberItems, suppliers, isEditing, isViewing, setValue, watch]);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setSuppliersLoading(true);
      try {
        const response = await supplierService.listSuppliers({ limit: 1000 });
        const suppliersData = response.data || [];
        const mappedSuppliers = suppliersData.map((s: any) => ({
          id: s._id || s.id,
          name: s.name
        }));
        setSuppliers(mappedSuppliers);
      } catch (err: any) {
        console.error('Error fetching suppliers:', err);
        toast.error('Failed to load suppliers.');
      } finally {
        setSuppliersLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch purchase entry for editing/viewing
  useEffect(() => {
    if (!((isEditing || isViewing) && id)) {
      return;
    }

    setIsLoading(true);
    const fetchPurchaseEntry = async () => {
      try {
        const response = await purchaseEntryService.getPurchaseEntryById(id);
        const entryData = response.data;

        const formValues: PurchaseEntryFormValues = {
          billNumber: entryData.billNumber,
          date: new Date(entryData.date).toISOString().split('T')[0],
          supplier: (entryData.supplier as any)?._id || (entryData.supplier as any)?.id || entryData.supplier,
          items: entryData.items.map(item => ({
            item: (item.item as any)?._id || (item.item as any)?.id || item.item,
            description: item.description || '',
          })),
          totalAmount: entryData.totalAmount,
          discount: entryData.discount,
          paidAmount: entryData.paidAmount,
          notes: entryData.notes || '',
        };

        reset(formValues);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching purchase entry:', err);
        toast.error('Failed to load purchase entry data.');
        setIsLoading(false);
      }
    };

    fetchPurchaseEntry();
  }, [id, isEditing, isViewing, reset]);

  // Form submission
  const onSubmit: SubmitHandler<PurchaseEntryFormValues> = async (data) => {
    if (isViewing) return;

    setIsLoading(true);
    try {
      const payload = {
        ...data,
        items: data.items.map(item => ({
          item: item.item,
          description: item.description
        }))
      };

      if (isEditing && id) {
        await purchaseEntryService.updatePurchaseEntry(id, payload);
        toast.success('Purchase entry updated successfully!');
      } else {
        await purchaseEntryService.createPurchaseEntry(payload);
        toast.success('Purchase entry created successfully!');
      }

      setTimeout(() => navigate('/dashboard/purchase-entries'), 1000);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      toast.error(err.message || 'Failed to save purchase entry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isViewing) {
      navigate('/dashboard/purchase-entries');
      return;
    }
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      navigate('/dashboard/purchase-entries');
    }
  };

  // Add new item row
  // const addItem = () => {
  //   append({ item: '', description: '' });
  // };

  // // Remove item row
  // const removeItem = (index: number) => {
  //   if (fields.length > 1) {
  //     remove(index);
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="hover:bg-blue-100 transition-colors duration-200 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-blue-600" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isViewing ? 'View Purchase Entry' : isEditing ? 'Edit Purchase Entry' : 'New Purchase Entry'}
              </h1>
              <p className="text-gray-600">
                {isViewing ? 'View purchase entry details' : 'Create or edit purchase entry with items and pricing'}
              </p>
            </div>
          </div>
        </div>

        <form className="grid gap-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Basic Information */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
                <FileText className="h-5 w-5" /> Purchase Information
              </CardTitle>
              <CardDescription className="text-blue-600">
                Basic purchase entry details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="billNumber" className="flex items-center gap-1 font-medium">
                    <FileText className="h-4 w-4" /> Bill Number <span className="text-red-500">*</span>
                    {fetchingBillItems && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500 ml-1" />
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="billNumber"
                      placeholder="Enter bill number to auto-fetch items"
                      {...register('billNumber')}
                      disabled={isViewing}
                      className={`${errors.billNumber ? 'border-red-300' : 'border-gray-200'} ${
                        fetchingBillItems ? 'pr-8' : ''
                      }`}
                    />
                    {billNumberItems.length > 0 && watchedBillNumber && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {billNumberItems.length} found
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.billNumber && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.billNumber.message}
                    </p>
                  )}
                  {billNumberItems.length > 0 && watchedBillNumber && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Found {billNumberItems.length} item(s) with this bill number
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-1 font-medium">
                    <Calendar className="h-4 w-4" /> Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                    disabled={isViewing}
                    className={`${errors.date ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier" className="flex items-center gap-1 font-medium">
                    <Package className="h-4 w-4" /> Supplier <span className="text-red-500">*</span>
                    {shouldDisableSupplierField() && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                        Auto-selected: {getAutoSelectedSupplierInfo()}
                      </span>
                    )}
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('supplier', value)}
                    value={watch('supplier')}
                    disabled={isViewing || suppliersLoading || shouldDisableSupplierField()}
                  >
                    <SelectTrigger className={`${errors.supplier ? 'border-red-300' : 'border-gray-200'} ${
                      shouldDisableSupplierField() ? 'bg-blue-50 border-blue-200' : ''
                    }`}>
                      <SelectValue placeholder={
                        suppliersLoading 
                          ? 'Loading suppliers...' 
                          : shouldDisableSupplierField()
                            ? `Auto-selected from bill items: ${getAutoSelectedSupplierInfo()}`
                            : 'Select supplier'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.supplier.message}
                    </p>
                  )}
                  {shouldDisableSupplierField() && (
                    <p className="text-sm text-blue-600 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Supplier automatically selected based on bill items vendor
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bill Items Summary */}
          {billNumberItems.length > 0 && watchedBillNumber && (
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-green-50">
              <CardHeader className="hover:bg-green-100 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div 
                    className="cursor-pointer flex-1"
                    onClick={toggleBillSummaryCollapse}
                  >
                    <CardTitle className="text-xl text-green-800 flex items-center gap-2">
                      <Package className="h-5 w-5" /> Bill Items Summary
                      <span className="text-sm bg-green-200 text-green-800 px-2 py-1 rounded-full">
                        {billNumberItems.length} items
                      </span>
                    </CardTitle>
                    <CardDescription className="text-green-600">
                      Items found for bill number: {watchedBillNumber} • Total: ₹{calculateTotalAmountFromItems(billNumberItems).toFixed(2)}
                      {(() => {
                        const uniqueVendors = getUniqueVendors(billNumberItems);
                        if (uniqueVendors.length === 1) {
                          return ` • Vendor: ${uniqueVendors[0]} (Auto-selected as supplier)`;
                        } else if (uniqueVendors.length > 1) {
                          return ` • ${uniqueVendors.length} vendors (Manual supplier selection required)`;
                        }
                        return '';
                      })()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {watchedBillNumber && !isViewing && (
                      <Button 
                        type="button" 
                        onClick={handleRefreshBillItems} 
                        variant="outline" 
                        size="sm"
                        disabled={fetchingBillItems}
                        className="text-green-700 hover:text-green-800 border-green-200 hover:bg-green-100"
                      >
                        {fetchingBillItems ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Package className="h-4 w-4 mr-2" />
                        )}
                        Refresh Bill Items
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleBillSummaryCollapse}
                      className="text-green-700 hover:text-green-800 hover:bg-green-200"
                    >
                      {isBillSummaryCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {!isBillSummaryCollapsed && (
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {billNumberItems.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">Code: {item.code}</p>
                            {item.vendor && (
                              <p className="text-xs text-blue-600 font-medium">
                                Vendor: {item.vendor.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {(item.quantity ?? 0) > 0 && (item.unitPrice ?? 0) > 0 ? (
                            <>
                              <p className="text-sm text-gray-600">
                                Qty: {item.quantity} × ₹{(item.unitPrice ?? 0).toFixed(2)}
                              </p>
                              <p className="font-semibold text-green-700">
                                ₹{(item.totalPrice ?? 0).toFixed(2)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No pricing data</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-green-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-800">Total Amount:</span>
                        <span className="font-bold text-green-800 text-lg">
                          ₹{calculateTotalAmountFromItems(billNumberItems).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

         
          {/* Pricing Summary */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount" className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-4 w-4" /> Total Amount <span className="text-red-500">*</span>
                      {billNumberItems.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                          Auto-calculated: ₹{calculateTotalAmountFromItems(billNumberItems).toFixed(2)}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('totalAmount', { valueAsNumber: true })}
                      disabled={isViewing}
                      className={`${errors.totalAmount ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    {errors.totalAmount && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.totalAmount.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-4 w-4" /> Discount
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('discount', { valueAsNumber: true })}
                      disabled={isViewing}
                    />
                  </div>

                  <div className="flex justify-between text-lg font-bold">
                    <span>Final Amount:</span>
                    <span>₹{finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paidAmount" className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-4 w-4" /> Paid Amount
                    </Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('paidAmount', { valueAsNumber: true })}
                      disabled={isViewing}
                    />
                  </div>

                  <div className="flex justify-between text-lg">
                    <span>Balance Amount:</span>
                    <span className={`font-semibold ${balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{balanceAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-1 font-medium">
                  <FileText className="h-4 w-4" /> Notes
                </Label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  disabled={isViewing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-200 focus:ring-4 transition-all duration-200"
                  placeholder="Additional notes or comments..."
                />
              </div>
            </CardContent>
          </Card>

          {!isViewing && (
            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || isLoading}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {isSubmitting || isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEditing ? 'Update Entry' : 'Create Entry'}
              </Button>
            </div>
          )}
        </form>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
              <DialogDescription>
                You have unsaved changes. Are you sure you want to cancel and discard them?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Stay
              </Button>
              <Button variant="destructive" onClick={() => navigate('/dashboard/purchase-entries')}>
                Discard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PurchaseEntryForm;