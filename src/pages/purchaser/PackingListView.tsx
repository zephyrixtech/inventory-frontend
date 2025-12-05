import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, Calendar, MapPin, Package, User, CheckCircle, XCircle, Clock, Truck, Store, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';
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

  // Helper function to render an image with error handling
  const renderImage = (imageSrc: string, alt: string) => {
    if (!imageSrc) return null;
    
    return (
      <img
        src={imageSrc}
        alt={alt}
        className="max-w-full h-auto rounded-lg border"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/purchaser/packing-lists')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Packing List Details</h1>
          <p className="text-muted-foreground">View and manage packing list information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Box Number</p>
                <p className="font-medium">{packingList.boxNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{packingList.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Packing Date</p>
                <p className="font-medium">
                  {packingList.packingDate ? new Date(packingList.packingDate).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shipment Date</p>
                <p className="font-medium">
                  {packingList.shipmentDate ? new Date(packingList.shipmentDate).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={`inline-flex items-center gap-1 ${statusInfo.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="font-medium">{packingList.totalQuantity}</p>
              </div>
              {packingList.currency && (
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{packingList.currency}</p>
                </div>
              )}
              {packingList.exchangeRate && (
                <div>
                  <p className="text-sm text-muted-foreground">Exchange Rate</p>
                  <p className="font-medium">{packingList.exchangeRate}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Items ({packingList.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {packingList.items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                        <p className="text-sm text-muted-foreground">Code: {item.product?.code || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.quantity}</p>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">From Store</p>
                <p className="font-medium">
                  {packingList.store ? `${packingList.store.name} (${packingList.store.code})` : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">To Store</p>
                <p className="font-medium">
                  {packingList.toStore 
                    ? typeof packingList.toStore === 'string' 
                      ? packingList.toStore 
                      : `${packingList.toStore.name} (${packingList.toStore.code})`
                    : 'Not specified'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Created By */}
          {packingList.createdBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Created By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {packingList.createdBy.firstName} {packingList.createdBy.lastName}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Approved By */}
          {packingList.approvedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Approved By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {packingList.approvedBy.firstName} {packingList.approvedBy.lastName}
                </p>
                {packingList.approvedAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(packingList.approvedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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

      {/* Images Section */}
      {((packingList as any).image1 || (packingList as any).image2) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(packingList as any).image1 && (
                <div>
                  <h3 className="font-medium mb-2">Image 1</h3>
                  {renderImage((packingList as any).image1, "Packing list image 1")}
                </div>
              )}
              {(packingList as any).image2 && (
                <div>
                  <h3 className="font-medium mb-2">Image 2</h3>
                  {renderImage((packingList as any).image2, "Packing list image 2")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};