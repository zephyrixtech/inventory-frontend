import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, Calendar, Package, User, CheckCircle, XCircle, Clock, Truck, Store, FileText, Image as ImageIcon, Hash, Shirt } from 'lucide-react';
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
    const fetchPackingList = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await packingListService.get(id);
        setPackingList(response.data);
      } catch (error) {
        console.error('Failed to fetch packing list', error);
        toast.error('Failed to load packing list details');
      } finally {
        setLoading(false);
      }
    };

    fetchPackingList();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!packingList) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Box className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Packing list not found</h3>
        <p className="text-muted-foreground">The requested packing list could not be found.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const renderImage = (src: string, alt: string) => {
    // Check if it's a data URL
    if (src?.startsWith('data:image')) {
      return <img src={src} alt={alt} className="max-w-full h-auto rounded-lg border" />;
    }
    
    // Check if it's a URL
    if (src?.startsWith('http')) {
      return <img src={src} alt={alt} className="max-w-full h-auto rounded-lg border" />;
    }
    
    // If it's neither, show a placeholder
    return (
      <div className="bg-muted border rounded-lg w-full h-48 flex items-center justify-center">
        <p className="text-muted-foreground">No image available</p>
      </div>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Box };
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Packing List Details</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                {packingList.boxNumber}
              </CardTitle>
              <CardDescription>Shipment details and item information</CardDescription>
            </div>
            <StatusBadge status={packingList.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Created By</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {packingList.createdBy?.firstName} {packingList.createdBy?.lastName}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Packing Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {packingList.packingDate 
                    ? new Date(packingList.packingDate).toLocaleDateString() 
                    : 'Not set'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Shipment Date</p>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>
                  {packingList.shipmentDate 
                    ? new Date(packingList.shipmentDate).toLocaleDateString() 
                    : 'Not scheduled'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{packingList.totalQuantity}</span>
              </div>
            </div>

            {/* New fields */}
            {packingList.cargoNumber && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cargo Number</p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>{packingList.cargoNumber}</span>
                </div>
              </div>
            )}

            {packingList.fabricDetails && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fabric Details</p>
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-muted-foreground" />
                  <span>{packingList.fabricDetails}</span>
                </div>
              </div>
            )}
          </div>

          {packingList.store && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Store Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">From Store</p>
                  <p className="font-medium">{packingList.store.name} ({packingList.store.code})</p>
                </div>
                {packingList.toStore && typeof packingList.toStore === 'object' && (
                  <div>
                    <p className="text-sm text-muted-foreground">To Store</p>
                    <p className="font-medium">{packingList.toStore.name} ({packingList.toStore.code})</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Items ({packingList.items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {packingList.items?.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{item.product?.name || 'Unknown Product'}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Code: {item.product?.code || 'N/A'}</p>
                      {item.description && <p>Description: {item.description}</p>}
                      {item.unitOfMeasure && <p>Size: {item.unitOfMeasure}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="text-lg font-bold">{item.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

      {/* Images Section */}
      {(packingList as any).image1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              {renderImage((packingList as any).image1, "Packing list image")}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};