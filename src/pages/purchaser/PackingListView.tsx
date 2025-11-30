import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, Calendar, MapPin, Package, User, CheckCircle, XCircle, Clock, Truck, Store, DollarSign, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { packingListService, type PackingList } from '@/services/packingListService';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800', icon: Truck },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  shipped: { label: 'Shipped', color: 'bg-blue-100 text-blue-800', icon: Truck },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export const PackingListView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPackingList = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await packingListService.get(id);
        setPackingList(response.data);
      } catch (error) {
        console.error('Failed to load packing list', error);
        toast.error('Unable to load packing list');
        navigate('/dashboard/purchaser/packing-lists');
      } finally {
        setLoading(false);
      }
    };

    loadPackingList();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!packingList) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Packing list not found</p>
            <Button onClick={() => navigate('/dashboard/purchaser/packing-lists')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Packing Lists
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusConfig[packingList.status as string]?.icon || Clock;
  const statusInfo = statusConfig[packingList.status as string] || statusConfig.pending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard/purchaser/packing-lists')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Packing List Details</h1>
            <p className="text-muted-foreground">View packing list information</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Box Number</label>
              <p className="text-base font-semibold">{packingList.boxNumber}</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <p className="text-base">{packingList.location}</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                Status
              </label>
              <Badge className={`w-fit ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
            </div>
            {packingList.packingDate && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Packing Date
                </label>
                <p className="text-base">
                  {new Date(packingList.packingDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
            {packingList.shipmentDate && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Shipment Date
                </label>
                <p className="text-base">
                  {new Date(packingList.shipmentDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Created By
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {packingList.createdBy && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground">Created By</label>
                <p className="text-base">
                  {packingList.createdBy.firstName} {packingList.createdBy.lastName}
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <p className="text-base">
                {new Date(packingList.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {packingList.approvedBy && (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Approved By</label>
                  <p className="text-base">
                    {packingList.approvedBy.firstName} {packingList.approvedBy.lastName}
                  </p>
                </div>
                {packingList.approvedAt && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Approved At</label>
                    <p className="text-base">
                      {new Date(packingList.approvedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Store & Financial Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {packingList.store && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground">From Store</label>
                <p className="text-base">
                  {packingList.store.name} ({packingList.store.code})
                </p>
              </div>
            )}
            {packingList.toStore && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground">To Store</label>
                <p className="text-base">
                  {(packingList.toStore as any).name} ({(packingList.toStore as any).code})
                </p>
              </div>
            )}
            {!packingList.store && !packingList.toStore && (
              <p className="text-sm text-muted-foreground">No store information available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Currency</label>
              <p className="text-base font-semibold">{packingList.currency || 'INR'}</p>
            </div>
            {packingList.exchangeRate && packingList.currency === 'AED' && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground">Exchange Rate (to INR)</label>
                <p className="text-base">{packingList.exchangeRate}</p>
              </div>
            )}
            {!packingList.exchangeRate && packingList.currency === 'INR' && (
              <p className="text-sm text-muted-foreground">No exchange rate applicable for INR</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Items ({packingList.items?.length || 0})
          </CardTitle>
          <CardDescription>Total Quantity: {packingList.totalQuantity || 0} units</CardDescription>
        </CardHeader>
        <CardContent>
          {packingList.items && packingList.items.length > 0 ? (
            <div className="space-y-2">
              {packingList.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.product?.name || 'Unknown Product'}
                    </p>
                    {item.product?.code && (
                      <p className="text-sm text-muted-foreground">Code: {item.product.code}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Quantity: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No items in this packing list</p>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      {(packingList as any).notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{(packingList as any).notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Reference Image */}
      {packingList.image && (
        <Card>
          <CardHeader>
            <CardTitle>Reference Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={packingList.image}
              alt="Packing list reference"
              className="max-w-full h-auto rounded-lg border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

