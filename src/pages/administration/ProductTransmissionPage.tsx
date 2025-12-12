import { useCallback, useEffect, useState } from 'react';
import { ArrowRightLeft, Package, Calculator, DollarSign, TrendingUp, Save, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';
import { packingListService, type PackingList } from '@/services/packingListService';
import { storeStockService } from '@/services/storeStockService';
import { currencyService, type CurrencyRate } from '@/services/currencyService';
import { storeService, type Store } from '@/services/storeService';
import type { PaginationMeta } from '@/types/backend';

interface TransmissionItem {
  packingListId: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  originalPrice: number; // INR price from purchaser store
  margin: string; // Percentage as string
  unitPrice: number; // INR unit price after margin
  dpPrice: string; // Dealer Price in AED as string
  maxMRP: string; // Maximum MRP in AED as string
  finalPrice: number; // Final price in AED
}

interface TransmissionFormState {
  packingListId: string;
  fromStoreId: string;
  toStoreId: string;
  exchangeRate: string;
  items: TransmissionItem[];
}

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const ProductTransmissionPage = () => {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stores
  const [purchaserStores, setPurchaserStores] = useState<Store[]>([]);
  const [billerStores, setBillerStores] = useState<Store[]>([]);
  
  // Currency rates
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [customExchangeRate, setCustomExchangeRate] = useState<string>('');
  
  // Transmission dialog
  const [showTransmissionDialog, setShowTransmissionDialog] = useState(false);
  const [transmissionForm, setTransmissionForm] = useState<TransmissionFormState>({
    packingListId: '',
    fromStoreId: '',
    toStoreId: '',
    exchangeRate: '',
    items: []
  });
  const [transmissionLoading, setTransmissionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load approved packing lists from purchaser stores (status: 'india', approvalStatus: 'approved')
  const loadPackingLists = useCallback(async (page?: number) => {
    setLoading(true);
    try {
      const response = await packingListService.list({
        page: page ?? pagination.page,
        limit: pagination.limit,
        status: 'india', // Only show packing lists from India (purchaser stores)
        approvalStatus: 'approved', // Only show approved packing lists
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
  }, [pagination.page, pagination.limit, searchQuery]);

  // Load stores
  const loadStores = useCallback(async () => {
    try {
      const response = await storeService.listStores();
      const allStores = response.data || [];
      
      // Filter stores with ROLE_PURCHASER for "From Store"
      const purchaserFilteredStores = allStores.filter(store => store.purchaser === 'ROLE_PURCHASER');
      setPurchaserStores(purchaserFilteredStores);
      
      // Filter stores with ROLE_BILLER for "To Store"
      const billerFilteredStores = allStores.filter(store => store.biller === 'ROLE_BILLER');
      setBillerStores(billerFilteredStores);
    } catch (error) {
      console.error('Failed to load stores', error);
      toast.error('Unable to load stores');
    }
  }, []);

  // Load currency rates
  const loadCurrencyRates = useCallback(async () => {
    try {
      const response = await currencyService.list();
      setCurrencyRates(response.data);
      
      // Set default exchange rate (INR to AED)
      const inrToAedRate = response.data.find(rate => 
        rate.fromCurrency === 'INR' && rate.toCurrency === 'AED'
      );
      if (inrToAedRate) {
        setCustomExchangeRate(inrToAedRate.rate.toString());
      }
    } catch (error) {
      console.error('Failed to load currency rates', error);
      toast.error('Unable to load currency rates');
    }
  }, []);

  useEffect(() => {
    loadPackingLists(1);
    loadStores();
    loadCurrencyRates();
  }, [loadPackingLists, loadStores, loadCurrencyRates]);

  const handlePageChange = (direction: 'next' | 'prev') => {
    const targetPage = direction === 'next' ? pagination.page + 1 : pagination.page - 1;
    if (targetPage < 1 || targetPage > pagination.totalPages) return;
    loadPackingLists(targetPage);
  };

  const handleSearch = () => {
    loadPackingLists(1);
  };

  // Open transmission dialog for a packing list
  const handleTransmit = async (packingList: PackingList) => {
    setTransmissionLoading(true);
    try {
      // Get store stock for the packing list items
      const storeId = packingList.store?._id;
      if (!storeId) {
        toast.error('Store information not available for this packing list');
        return;
      }

      const storeStockResponse = await storeStockService.list({ storeId, limit: 1000 });
      const storeStock = storeStockResponse.data || [];

      // Create transmission items from packing list
      const transmissionItems: TransmissionItem[] = packingList.items.map(item => {
        const stockItem = storeStock.find(stock => {
          const stockProductId = (stock.product as any)?._id || (stock.product as any)?.id || stock.product;
          const itemProductId = item.product._id;
          return stockProductId === itemProductId;
        });

        const originalPrice = stockItem?.unitPrice || 0;
        const margin = ''; // Default margin as empty string
        const unitPrice = originalPrice;
        const dpPrice = ''; // Manual entry - no auto calculation
        const maxMRP = ''; // Default value as empty string
        const finalPrice = 0; // Will be set when DP price is entered

        return {
          packingListId: packingList._id,
          productId: item.product._id,
          productName: item.product.name,
          productCode: item.product.code,
          quantity: item.quantity,
          originalPrice,
          margin,
          unitPrice,
          dpPrice,
          maxMRP,
          finalPrice
        };
      });

      setTransmissionForm({
        packingListId: packingList._id,
        fromStoreId: storeId,
        toStoreId: '',
        exchangeRate: customExchangeRate,
        items: transmissionItems
      });

      setShowTransmissionDialog(true);
    } catch (error) {
      console.error('Failed to prepare transmission', error);
      toast.error('Unable to prepare transmission');
    } finally {
      setTransmissionLoading(false);
    }
  };

  // Update exchange rate - no automatic DP price calculation
  const handleExchangeRateChange = (newRate: string) => {
    setTransmissionForm(prev => ({
      ...prev,
      exchangeRate: newRate,
      items: prev.items.map(item => {
        // Keep existing DP price, only update finalPrice if DP price exists
        const finalPrice = item.dpPrice ? parseFloat(item.dpPrice) : 0;
        return {
          ...item,
          finalPrice
        };
      })
    }));
  };

  // Update item margin and recalculate unit price only
  const handleItemMarginChange = (index: number, margin: string) => {
    setTransmissionForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const marginNum = parseFloat(margin) || 0;
          const unitPrice = item.originalPrice * (1 + marginNum / 100);
          // Keep existing DP price, only update finalPrice if DP price exists
          const finalPrice = item.dpPrice ? parseFloat(item.dpPrice) : 0;
          return {
            ...item,
            margin,
            unitPrice,
            finalPrice
          };
        }
        return item;
      })
    }));
  };

  // Update item DP price
  const handleItemDPPriceChange = (index: number, dpPrice: string) => {
    setTransmissionForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const dpPriceNum = parseFloat(dpPrice) || 0;
          return {
            ...item,
            dpPrice,
            finalPrice: dpPriceNum
          };
        }
        return item;
      })
    }));
  };

  // Update item Max MRP
  const handleItemMaxMRPChange = (index: number, maxMRP: string) => {
    setTransmissionForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            maxMRP
          };
        }
        return item;
      })
    }));
  };

  // Save currency rate
  const handleSaveCurrencyRate = async () => {
    try {
      await currencyService.upsert({
        fromCurrency: 'INR',
        toCurrency: 'AED',
        rate: parseFloat(customExchangeRate) || 0
      });
      toast.success('Currency rate saved');
      loadCurrencyRates();
    } catch (error) {
      console.error('Failed to save currency rate', error);
      toast.error('Unable to save currency rate');
    }
  };

  // Execute transmission
  const handleExecuteTransmission = async () => {
    if (!transmissionForm.toStoreId) {
      toast.error('Please select a destination store');
      return;
    }

    try {
      setTransmissionLoading(true);

      // Create store stock entries for each item in the biller store
      for (const item of transmissionForm.items) {
        // Check if product already exists in the destination store
        const existingStockResponse = await storeStockService.list({ 
          storeId: transmissionForm.toStoreId,
          limit: 1000 
        });
        
        const existingStock = existingStockResponse.data.find(stock => {
          const stockProductId = (stock.product as any)?._id || (stock.product as any)?.id || stock.product;
          return stockProductId === item.productId;
        });

        const transmissionData = {
          productId: item.productId,
          storeId: transmissionForm.toStoreId || '',
          quantity: item.quantity,
          margin: parseFloat(item.margin) || 0,
          currency: 'AED' as const,
          // Additional transmission data - we'll store these in a metadata object
          unitPrice: item.finalPrice, // Use final AED price as unit price
          transmissionData: {
            originalPriceINR: item.originalPrice,
            marginPercent: parseFloat(item.margin) || 0,
            unitPriceINR: item.unitPrice,
            dpPriceAED: parseFloat(item.dpPrice) || 0,
            maxMRPAED: parseFloat(item.maxMRP) || 0,
            exchangeRate: parseFloat(transmissionForm.exchangeRate) || 0,
            transmissionDate: new Date().toISOString(),
            fromStoreId: transmissionForm.fromStoreId,
            packingListId: transmissionForm.packingListId
          }
        };

        if (existingStock) {
          // Update existing stock - add to existing quantity
          const newQuantity = existingStock.quantity + item.quantity;
          await storeStockService.update(existingStock.id, {
            ...transmissionData,
            quantity: newQuantity
          });
        } else {
          // Create new stock entry
          await storeStockService.save(transmissionData);
        }
      }

      // Update packing list status to 'uae' and set destination store
      await packingListService.update(transmissionForm.packingListId, {
        status: 'uae',
        toStoreId: transmissionForm.toStoreId || undefined
      });

      toast.success(`Products transmitted successfully! ${transmissionForm.items.length} items added to ${billerStores.find(s => s._id === transmissionForm.toStoreId)?.name || 'destination store'}`);
      setShowTransmissionDialog(false);
      setTransmissionForm({
        packingListId: '',
        fromStoreId: '',
        toStoreId: '',
        exchangeRate: '',
        items: []
      });
      loadPackingLists(pagination.page);
    } catch (error) {
      console.error('Failed to execute transmission', error);
      toast.error('Unable to execute transmission. Please check if all required fields are filled.');
    } finally {
      setTransmissionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Currency Rate Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Currency Exchange Rate
          </CardTitle>
          <CardDescription>
            Set manual INR to AED conversion rate for product transmission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>1 INR =</Label>
              <Input
                type="text"
                value={customExchangeRate}
                onChange={(e) => {
                  setCustomExchangeRate(e.target.value);
                }}
                className="w-32"
                placeholder="0.0000"
              />

              <Label>AED</Label>
            </div>
            <Button onClick={handleSaveCurrencyRate} size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Rate
            </Button>
          </div>
          {currencyRates.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Current saved rate: 1 INR = {currencyRates.find(r => r.fromCurrency === 'INR' && r.toCurrency === 'AED')?.rate || 'Not set'} AED
            </div>
          )}
        </CardContent>
      </Card>

      {/* Packing Lists for Transmission */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Product Transmission
            </CardTitle>
            <CardDescription>
              Transmit approved products from purchaser stores (INR) to biller stores (AED) with margin calculations
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => loadPackingLists(pagination.page)} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by box number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Filter Applied:</strong> Showing only approved packing lists from India (purchaser stores) that are ready for transmission to UAE (biller stores).
              </p>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Box Number</TableHead>
                  <TableHead>From Store</TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead>Packing Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading packing lists...
                    </TableCell>
                  </TableRow>
                ) : packingLists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No approved packing lists available for transmission.
                    </TableCell>
                  </TableRow>
                ) : (
                  packingLists.map((packingList) => (
                    <TableRow key={packingList._id}>
                      <TableCell className="font-medium">{packingList.boxNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{packingList.store?.name}</div>
                        <div className="text-xs text-muted-foreground">{packingList.store?.code}</div>
                      </TableCell>
                      <TableCell>{packingList.items?.length || 0}</TableCell>
                      <TableCell>
                        {packingList.packingDate 
                          ? new Date(packingList.packingDate).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {packingList.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTransmit(packingList)}
                            disabled={transmissionLoading}
                            title="Transmit to Biller Store"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                        </div>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange('prev')} 
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange('next')} 
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transmission Dialog */}
      <Dialog open={showTransmissionDialog} onOpenChange={setShowTransmissionDialog}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Product Transmission Setup
            </DialogTitle>
            <DialogDescription>
              Configure margins, pricing, and destination store for product transmission. DP Price must be entered manually.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Store Selection and Exchange Rate */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>From Store (Purchaser)</Label>
                <Select value={transmissionForm.fromStoreId} disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="From store" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaserStores.map((store) => (
                      <SelectItem key={store._id || store.id} value={store._id || store.id || ''}>
                        {store.name} ({store.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>To Store (Biller) *</Label>
                <Select 
                  value={transmissionForm.toStoreId} 
                  onValueChange={(value) => setTransmissionForm(prev => ({ ...prev, toStoreId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination store" />
                  </SelectTrigger>
                  <SelectContent>
                    {billerStores.map((store) => (
                      <SelectItem key={store._id || store.id} value={store._id || store.id || ''}>
                        {store.name} ({store.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Exchange Rate (INR to AED)</Label>
                <Input
                  type="text"
                  value={transmissionForm.exchangeRate}
                  onChange={(e) => {
                    handleExchangeRateChange(e.target.value);
                  }}
                  placeholder="0.0000"
                />
              </div>
            </div>

            <Separator />

            {/* Transmission Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Transmission Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Items:</span>
                  <div className="font-medium">{transmissionForm.items.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Quantity:</span>
                  <div className="font-medium">{transmissionForm.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Value (INR):</span>
                  <div className="font-medium">₹{transmissionForm.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Value (AED):</span>
                  <div className="font-medium">د.إ{transmissionForm.items.reduce((sum, item) => sum + ((parseFloat(item.dpPrice) || 0) * item.quantity), 0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Items Table */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Product Pricing Configuration
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Note:</strong> DP Price (AED) must be entered manually for each product. Margin % will only affect the Unit Price (INR).
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Original Price (INR)</TableHead>
                      <TableHead>Margin %</TableHead>
                      <TableHead>Unit Price (INR)</TableHead>
                      <TableHead>DP Price (AED) *</TableHead>
                      <TableHead>Max MRP (AED)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transmissionForm.items.map((item, index) => (
                      <TableRow key={`${item.productId}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">{item.productCode}</div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.originalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={item.margin}
                            onChange={(e) => {
                              handleItemMarginChange(index, e.target.value);
                            }}
                            className="w-20"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={item.dpPrice}
                            onChange={(e) => {
                              handleItemDPPriceChange(index, e.target.value);
                            }}
                            className="w-24 border-blue-300 focus:border-blue-500"
                            placeholder="Enter manually"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={item.maxMRP}
                            onChange={(e) => {
                              handleItemMaxMRPChange(index, e.target.value);
                            }}
                            className="w-24"
                            placeholder="0.00"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            {/* Validation Summary */}
            <div className="text-sm text-muted-foreground">
              {!transmissionForm.toStoreId && (
                <div className="text-red-600">⚠ Please select a destination store</div>
              )}
              {!transmissionForm.exchangeRate && (
                <div className="text-red-600">⚠ Please set an exchange rate</div>
              )}
              {transmissionForm.items.some(item => !item.dpPrice || parseFloat(item.dpPrice) <= 0) && (
                <div className="text-amber-600">⚠ Some items have missing or zero DP prices</div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowTransmissionDialog(false)}
                disabled={transmissionLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setShowConfirmDialog(true)}
                disabled={transmissionLoading || !transmissionForm.toStoreId || !transmissionForm.exchangeRate}
              >
                {transmissionLoading ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Transmitting...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Execute Transmission ({transmissionForm.items.length} items)
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Product Transmission</DialogTitle>
            <DialogDescription>
              Are you sure you want to transmit these products? This action will:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Add {transmissionForm.items.length} products to {billerStores.find(s => s._id === transmissionForm.toStoreId)?.name || 'the selected store'}</li>
              <li>Update the packing list status to "UAE"</li>
              <li>Convert prices from INR to AED using rate: {transmissionForm.exchangeRate}</li>
              <li>Apply the configured margins and pricing</li>
            </ul>
            
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> If products already exist in the destination store, the quantities will be added to existing stock.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowConfirmDialog(false);
                handleExecuteTransmission();
              }}
              disabled={transmissionLoading}
            >
              Confirm Transmission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductTransmissionPage;