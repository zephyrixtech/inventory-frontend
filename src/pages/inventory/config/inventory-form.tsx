import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
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
  Target,
  DollarSign,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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



// Import our new services
import { inventoryService } from '@/services/inventoryService';
import { supplierService } from '@/services/supplierService';

// Interfaces for types
// interface IUser {
//   id: string;
//   first_name: string | null;
//   last_name: string | null;
// }



// Base schema for static fields
const baseInventoryFormSchema = z.object({
  item_id: z
    .string()
    .max(50, 'Item ID must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Item ID must be alphanumeric with underscores or hyphens')
    .optional()
    .or(z.literal('')), // Allow empty string as well
  item_name: z
    .string()
    .min(1, 'Item Name is required')
    .max(100, 'Item Name must be less than 100 characters'),
  bill_number: z.string().min(1, 'Bill Number is required'),
  description: z
    .string()
    .min(1, 'Description is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'), // NEW FIELD
  damagedQuantity: z.number().min(0, 'Damaged quantity cannot be negative').optional(), // NEW FIELD
  availableQuantity: z.number().min(0, 'Available quantity cannot be negative').optional(), // NEW FIELD
  selling_price: z.number().min(0, 'Unit price cannot be negative').nullable(),
  vendorId: z.string().optional(), // NEW FIELD - Vendor/Supplier selection
  image_1: z
    .any()
    .optional()
    .refine(
      (file: File) => !file || (file instanceof File && ['image/jpeg', 'image/png'].includes(file.type)),
      'Image 1 must be a JPG or PNG file'
    )
    .refine((file: File) => !file || file.size <= 5 * 1024 * 1024, 'Image 1 must be less than 5MB'),
  image_2: z
    .any()
    .optional()
    .refine(
      (file: File) => !file || (file instanceof File && ['image/jpeg', 'image/png'].includes(file.type)),
      'Image 2 must be a JPG or PNG file'
    )
    .refine((file: File) => !file || file.size <= 5 * 1024 * 1024, 'Image 2 must be less than 5MB'),
  video: z
    .any()
    .optional()
    .refine(
      (file: File) => !file || (file instanceof File && file.type === 'video/mp4'),
      'Video must be an MP4 file'
    )
    .refine((file: File) => !file || file.size <= 50 * 1024 * 1024, 'Video must be less than 50MB'),
  youtube_link: z
    .string()
    .nullable()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      try {
        const normalizedVal = val.startsWith('http') ? val : `https://${val}`;
        const url = new URL(normalizedVal);
        const hostname = url.hostname.toLowerCase();
        const pathname = url.pathname;

        if (hostname.endsWith('youtube.com')) {
          return url.searchParams.has('v') || pathname.startsWith('/shorts/');
        }
        if (hostname.endsWith('youtu.be')) {
          return pathname.length > 1;
        }

        return false;
      } catch {
        return false;
      }
    }, 'Must be a valid YouTube link'),
});

// Form values type
type InventoryFormValues = z.infer<typeof baseInventoryFormSchema>;

let sequenceCounter = 1;

// Helper function to generate item ID based on current date with sequential numbering
const generateItemID = () => {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const sequence = sequenceCounter.toString().padStart(2, '0');

  // Format: ITMYYYYMMDD___NN (e.g., ITM20251207___01)
  // Note: The actual sequence number will be determined by the backend
  // This is just a placeholder format for display purposes with local increment
  return `ITM${year}${month}${day}___${sequence}`;
};

const InventoryForm = () => {
  // NOTE: This form has been refactored to use the backend API instead of Supabase.
  // The following features still need to be implemented in the backend:
  // 1. File upload endpoints for images and videos
  // 2. Category fetching endpoints
  // 3. Collections fetching for dropdowns
  // 4. Units fetching
  // 5. Alternative items search and fetch
  // 6. Duplicate item ID checking
  // 7. Force fetch missing category
  // These features have been temporarily disabled with console.log messages.
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id) && location.pathname.includes('edit');
  const isViewing = Boolean(id) && location.pathname.includes('view');
  const [isLoading, setIsLoading] = useState(false);
  const [_, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]); // NEW: Suppliers state
  const [suppliersLoading, setSuppliersLoading] = useState(false); // NEW: Suppliers loading state
  const [formSchema] = useState<z.ZodType<any>>(baseInventoryFormSchema);
  const [image1Preview, setImage1Preview] = useState<string | null>(null);
  const [image2Preview, setImage2Preview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [initialVideoPreview, setInitialVideoPreview] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [initialFormValues, setInitialFormValues] = useState<InventoryFormValues | null>(null);
  const [initialImage1Preview, setInitialImage1Preview] = useState<string | null>(null);
  const [initialImage2Preview, setInitialImage2Preview] = useState<string | null>(null);
  const [videoType, setVideoType] = useState('upload'); // 'upload' or 'youtube'
  // const [youtubeUrl, setYoutubeUrl] = useState('');
  // const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  // const [showZoom, setShowZoom] = useState(false);
  // const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  // Initialize form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue,
    trigger,
    setFocus,
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      item_id: '',
      item_name: '',
      bill_number: '',
      description: '',
      quantity: 0,
      damagedQuantity: 0,
      availableQuantity: 0,
      selling_price: null,
      vendorId: undefined,
      image_1: null,
      image_2: null,
      video: null,
      youtube_link: null,
    },
  });

  const watchedFields = watch();
  console.log('Watched fields:', watchedFields);

  // Watch item_id specifically to ensure it updates properly
  const itemIdValue = watch('item_id');

  // Watch quantity and selling_price to calculate total amount
  const quantity = watch('quantity');
  const sellingPrice = watch('selling_price');
  const totalAmount = (quantity && sellingPrice) ? (quantity * sellingPrice) : 0;

  // Monitor bill_number changes
  const billNumberValue = watch('bill_number');
  useEffect(() => {
    console.log('Bill Number changed to:', billNumberValue);
    console.log('Bill Number type:', typeof billNumberValue);
  }, [billNumberValue]);

  // Monitor vendorId changes for debugging
  const vendorIdValue = watch('vendorId');
  useEffect(() => {
    console.log('🎯 VendorId changed to:', vendorIdValue);
    console.log('🎯 VendorId type:', typeof vendorIdValue);
    console.log('📋 Current suppliers:', suppliers.length);
    if (suppliers.length > 0) {
      const matchingSupplier = suppliers.find(s => s.id === vendorIdValue);
      console.log('🔍 Matching supplier:', matchingSupplier);
    }
  }, [vendorIdValue, suppliers]);

  // Ensure vendor ID is set correctly when both suppliers and initial form values are available
  useEffect(() => {
    if (initialFormValues && suppliers.length > 0 && initialFormValues.vendorId && !vendorIdValue) {
      console.log('🔄 Setting vendorId from initial form values:', initialFormValues.vendorId);
      console.log('📋 Available supplier IDs:', suppliers.map(s => s.id));
      
      // Check if the vendor ID exists in the suppliers list
      const matchingSupplier = suppliers.find(s => s.id === initialFormValues.vendorId);
      if (matchingSupplier) {
        console.log('✅ Found matching supplier:', matchingSupplier);
        setValue('vendorId', initialFormValues.vendorId, { shouldValidate: true });
      } else {
        console.log('⚠️ No matching supplier found for ID:', initialFormValues.vendorId);
      }
    }
  }, [initialFormValues, suppliers, vendorIdValue, setValue]);

  // const extractVideoId = (url: string) => {
  //   try {
  //     const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  //     const parsedUrl = new URL(normalizedUrl);
  //     const hostname = parsedUrl.hostname.toLowerCase();
  //     const pathname = parsedUrl.pathname;

  //     if (hostname.endsWith('youtu.be')) {
  //       return pathname.slice(1);
  //     }

  //     if (hostname.endsWith('youtube.com')) {
  //       const v = parsedUrl.searchParams.get('v');
  //       if (v) return v;

  //       const shortsMatch = pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
  //       if (shortsMatch) return shortsMatch[1];
  //     }

  //     return null;
  //   } catch {
  //     return null;
  //   }
  // };

  // const handleYoutubeChange = (e: string | React.ChangeEvent<HTMLInputElement>) => {
  //   const url = typeof e === 'string' ? e : e.target.value;
  //   setYoutubeUrl(url);
  //   const id = url ? extractVideoId(url) : null;
  //   setYoutubeVideoId(id);
  //   setValue('youtube_link', url, { shouldValidate: true });
  // };

  // const handleMouseEnter = (imageSrc: string) => {
  //   setActiveZoomImage(imageSrc);
  //   setShowZoom(true);
  // };

  // const handleMouseLeave = () => {
  //   setShowZoom(false);
  //   setActiveZoomImage(null);
  // };


  useEffect(() => {
    // Do not reset defaults while editing or viewing an existing item
    if (isEditing || isViewing) return;

    // Generate and set the item ID for new items
    const newItemId = generateItemID();
    setValue('item_id', newItemId, { shouldValidate: false });

    // Set other default values
    const defaultValues: InventoryFormValues = {
      item_id: newItemId,
      item_name: '',
      bill_number: '',
      description: '',
      quantity: 0,
      damagedQuantity: 0,
      availableQuantity: 0,
      selling_price: null,
      // image_1: null,
      // image_2: null,
      // video: null,
      youtube_link: null,
    };

    reset(defaultValues);
  }, [isEditing, isViewing, reset, setValue]);

  // Handle media change (images and video)
  // const handleMediaChange = (
  //   e: React.ChangeEvent<HTMLInputElement>,
  //   field: 'image_1' | 'image_2' | 'video',
  //   setPreview: (value: string | null) => void
  // ) => {
  //   if (isViewing) return; // Prevent changes in view mode
  //   const file = e.target.files?.[0];
  //   setValue(field, file || null, { shouldDirty: true });
  //   if (file) {
  //     // For now, we'll just show a preview but won't actually upload
  //     // This would need to be implemented with proper backend file endpoints
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setPreview(reader.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   } else {
  //     setPreview(null);
  //   }
  // };


  // Fetch item details for editing or viewing
  useEffect(() => {
    if (!((isEditing || isViewing) && id)) {
      return;
    }

    setIsLoading(true);
    const fetchItem = async () => {
      try {
        // Use our new backend API service instead of Supabase
        const response = await inventoryService.getItem(id);
        const itemData = response.data || response;

        const formValues: InventoryFormValues = {
          item_id: itemData.code || '',
          item_name: itemData.name || '',
          bill_number: itemData.billNumber || '',
          description: itemData.description || '',
          quantity: itemData.quantity || 0,
          damagedQuantity: itemData.damagedQuantity || 0,
          availableQuantity: itemData.availableQuantity || 0,
          selling_price: itemData.unitPrice ?? null,
          vendorId: (() => {
            // Enhanced vendor ID extraction with debugging
            console.log('🔍 Raw itemData.vendor:', itemData.vendor);
            
            if (!itemData.vendor) {
              console.log('⚠️ No vendor found in itemData');
              return '';
            }
            
            // Try different possible vendor ID fields
            const vendorId = itemData.vendor._id || itemData.vendor.id || itemData.vendor;
            console.log('🎯 Extracted vendorId:', vendorId);
            console.log('🎯 VendorId type:', typeof vendorId);
            
            // Ensure we return a string
            return typeof vendorId === 'string' ? vendorId : String(vendorId || '');
          })(),
          image_1: null,
          image_2: null,
          video: null,
          youtube_link: null,
        };

        console.log('📋 Final form values:', formValues);
        console.log('🎯 Final vendorId value:', formValues.vendorId);



        // Set images - for now we'll skip this as it requires file handling
        // This would need to be implemented with proper backend file endpoints
        console.log('Skipping image/video handling - needs backend implementation');

        // Set video or YouTube link - for now we'll skip this as it requires file handling
        const youtubeLinkFromApi = (itemData as any).youtubeLink ?? null;
        const inferredVideoType = (itemData as any).videoType === 'youtube' || youtubeLinkFromApi ? 'youtube' : 'upload';
        formValues.youtube_link = youtubeLinkFromApi;
        formValues.video = null;
        setVideoType(inferredVideoType);

        // Alternative items functionality has been completely removed as per user request

        setInitialFormValues(formValues);
        reset(formValues);
        
        // Force set the vendorId after a short delay to ensure suppliers are loaded
        setTimeout(() => {
          if (formValues.vendorId) {
            console.log('🔄 Force setting vendorId after delay:', formValues.vendorId);
            setValue('vendorId', formValues.vendorId, { shouldValidate: true });
          }
        }, 100);
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching item:', err);
        toast.error('Failed to load item data.');
        setIsLoading(false);
      }
    };
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing, isViewing]);

  // Fetch suppliers (runs in all modes)
  useEffect(() => {
    const fetchSuppliers = async () => {
      console.log('🔄 Starting supplier fetch...');
      setSuppliersLoading(true);
      try {
        // Fetch suppliers for the vendor dropdown - fetch all suppliers (not just approved)
        const suppliersResponse = await supplierService.listSuppliers({ limit: 1000 });
        console.log('📦 Raw API Response:', suppliersResponse);

        // The API returns { data: [...], meta: {...} }, so we need to access response.data
        const suppliersData = suppliersResponse.data || [];
        console.log('📋 Suppliers Data Array:', suppliersData);
        console.log('📊 Suppliers Count:', suppliersData.length);

        if (suppliersData.length > 0) {
          console.log('✅ First Supplier Sample:', suppliersData[0]);
        } else {
          console.warn('⚠️ No suppliers found in API response');
        }

        const mappedSuppliers = suppliersData.map((s: any) => ({
          id: s._id || s.id,
          name: s.name
        }));
        console.log('🔄 Mapped Suppliers:', mappedSuppliers);

        setSuppliers(mappedSuppliers);
        console.log('✅ Suppliers state updated successfully');
      } catch (err: any) {
        console.error('❌ Error fetching suppliers:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response,
          stack: err.stack
        });
        toast.error('Failed to load suppliers.');
      } finally {
        setSuppliersLoading(false);
        console.log('🏁 Supplier fetch completed');
      }
    };

    fetchSuppliers();
  }, []);

  // Alternative items functionality has been completely removed as per user request

  // Check for unsaved changes
  const hasUnsavedChanges = (): boolean => {
    if (isViewing) return false; // No unsaved changes in view mode
    if (isDirty) return true;

    if (
      image1Preview !== initialImage1Preview ||
      image2Preview !== initialImage2Preview ||
      videoPreview !== initialVideoPreview
    ) return true;

    if (initialFormValues) {
      const currentValues = watchedFields;
      for (const key in initialFormValues) {
        const initialValue = initialFormValues[key as keyof InventoryFormValues];
        const currentValue = currentValues[key as keyof InventoryFormValues];
        const normalizedInitial = initialValue === null || initialValue === undefined ? '' : String(initialValue);
        const normalizedCurrent = currentValue === null || currentValue === undefined ? '' : String(currentValue);
        if (normalizedInitial !== normalizedCurrent) {
          return true;
        }
      }
    }

    return false;
  };

  // Form submission
  const onSubmit: SubmitHandler<InventoryFormValues> = async (data) => {
    if (isViewing) return; // Prevent submission in view mode
    console.log('Form data being submitted:', data);
    console.log('Selected bill number:', data.bill_number);
    console.log('Bill number type:', typeof data.bill_number);

    // Validate that bill_number is not empty
    if (!data.bill_number || data.bill_number.trim() === '') {
      console.error('Bill number is empty or undefined');
      toast.error('Please enter a bill number');
      return;
    }

    setFormStatus('submitting');
    setIsLoading(true);

    try {
      // Prepare the payload for the backend API
      const payload: any = {
        code: data.item_id || undefined, // Include item_id if provided
        name: data.item_name,
        billNumber: data.bill_number,
        description: data.description,
        quantity: data.quantity,
        // Note: damagedQuantity and availableQuantity are not sent during create/edit
        // They are managed by the backend (e.g., during QC process)
        unitPrice: data.selling_price ?? null,
        vendorId: data.vendorId || undefined, // NEW: Vendor field
      };

      console.log('Sending payload to backend:', payload);

      payload.videoType = videoType;
      const normalizedYoutubeLink =
        typeof data.youtube_link === 'string' ? data.youtube_link.trim() : '';
      payload.youtubeLink = videoType === 'youtube' ? (normalizedYoutubeLink || null) : null;

      // Remove null/undefined values to avoid validation issues
      const nullableFields = new Set(['youtubeLink', 'videoUrl', 'code', 'vendorId']);
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === '') {
          // Only delete if it's not in the nullableFields set
          if (!nullableFields.has(key)) {
            delete payload[key];
          }
        } else if (payload[key] === null && !nullableFields.has(key)) {
          delete payload[key];
        }
      });

      console.log('Final payload after cleanup:', payload);

      // Use our new backend API service instead of Supabase
      if (isEditing && id) {
        // Update existing item
        await inventoryService.updateItem(id, payload);
      } else {
        // Create new item
        if (!payload.name || !payload.billNumber || !payload.description) { // Changed from category to billNumber
          throw new Error('All mandatory fields are required');
        }
        await inventoryService.createItem(payload);
      }

      setFormStatus('success');
      if (!isEditing) {
        sequenceCounter++;
      }
      toast.success(isEditing ? 'Item updated successfully!' : 'Item created successfully!');
      setTimeout(() => navigate('/dashboard/item-master'), 1000);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setFormStatus('error');
      toast.error(err.message || 'Failed to save item.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: InventoryFormValues) => {
    if (isViewing) return; // Prevent submission in view mode
    const isValid = await trigger();
    if (!isValid) {
      const firstErrorField = Object.keys(errors)[0] as keyof InventoryFormValues;
      if (firstErrorField) {
        setFocus(firstErrorField);
        const errorElement = document.getElementById(firstErrorField as string);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    await onSubmit(data);
  };

  // Handle cancel
  const handleCancel = () => {
    if (isViewing) {
      navigate('/dashboard/item-master'); // Directly navigate back in view mode
      return;
    }
    if (hasUnsavedChanges()) {
      setShowCancelDialog(true);
    } else {
      clearFormAndNavigate();
    }
  };

  // Clear form and navigate
  const clearFormAndNavigate = () => {
    const newItemId = generateItemID(); // Generate new item ID when clearing form
    reset({
      item_id: newItemId,
      item_name: '',
      bill_number: '',
      description: '',
      quantity: 0,
      damagedQuantity: 0,
      availableQuantity: 0,
      selling_price: null,
      image_1: null,
      image_2: null,
      video: null,
      youtube_link: null,
    });
    setValue('item_id', newItemId, { shouldValidate: false });
    setInitialFormValues(null);
    setImage1Preview(null);
    setImage2Preview(null);
    setVideoPreview(null);
    setInitialImage1Preview(null);
    setInitialImage2Preview(null);
    setInitialVideoPreview(null);
    // setYoutubeUrl('');
    // setYoutubeVideoId(null);
    setVideoType('upload');
    setFormStatus('idle');
    navigate('/dashboard/item-master');
  };

  // Confirm cancel
  const confirmCancel = () => {
    setShowCancelDialog(false);
    clearFormAndNavigate();
  };

  // Stay on form
  const stayOnForm = () => {
    setShowCancelDialog(false);
    // Regenerate item ID when staying on the form
    if (!isEditing && !isViewing) {
      const newItemId = generateItemID();
      setValue('item_id', newItemId, { shouldValidate: false });
    }
  };



 

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
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isViewing ? 'View Item' : isEditing ? 'Update Item' : 'Add New Item'}
              </h1>
              <p className="text-gray-600">
                {isViewing ? 'View inventory item details' : 'Customize your inventory items and stock details'}
                {!isEditing && !isViewing && ' (Item ID format: ITMYYYYMMDDNNN)'}
              </p>
            </div>
          </div>
        </div>

        <form className="grid gap-y-5" onSubmit={handleSubmit(handleFormSubmit)}>
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-visible">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
                <Package className="h-5 w-5" /> Basic Information
              </CardTitle>
              <CardDescription className="text-blue-600">
                Essential item details and identification
                {!isEditing && !isViewing && ' (Item ID format: ITMYYYYMMDDNNN)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Item ID Field - Disabled for Editing/Viewing, Enabled for Creation */}
                <div className="space-y-2 group">
                  <Label
                    htmlFor="item_id"
                    className={`${errors.item_id ? 'text-red-500' : 'text-gray-700'} group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                  >
                    <Package className="h-4 w-4" /> Item ID {isEditing || isViewing ? '' : '(Auto-generated)'}
                  </Label>
                  <Input
                    id="item_id"
                    placeholder={isEditing || isViewing ? "Item ID" : "Auto-generated by system"}
                    {...register('item_id')}
                    value={itemIdValue || ''}
                    disabled={true} 
                    className={`${errors.item_id
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200 ${itemIdValue && !isViewing ? 'border-blue-300' : ''}`}
                  />
                  {errors.item_id?.message && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.item_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 group">
                  <Label
                    htmlFor="item_name"
                    className={`${errors.item_name ? 'text-red-500' : 'text-gray-700'} group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                  >
                    <Package className="h-4 w-4" /> Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="item_name"
                    placeholder="Enter descriptive item name"
                    {...register('item_name')}
                    disabled={isViewing}
                    className={`${errors.item_name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200 ${watchedFields.item_name && !isViewing ? 'border-blue-300' : ''}`}
                  />
                  {errors.item_name?.message && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.item_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 group">
                  <Label
                    htmlFor="bill_number"
                    className={`${errors.bill_number ? 'text-red-500' : 'text-gray-700'} group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                  >
                    <Package className="h-4 w-4" /> Bill Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bill_number"
                    placeholder="Enter bill number"
                    {...register('bill_number')}
                    disabled={isViewing}
                    className={`${errors.bill_number
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200 ${watchedFields.bill_number && !isViewing ? 'border-blue-300' : ''}`}
                  />
                  {errors.bill_number?.message && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.bill_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 group">
                  <Label
                    htmlFor="description"
                    className={`${errors.description ? 'text-red-500' : 'text-gray-700'} group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                  >
                    <Package className="h-4 w-4" /> Description <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="description"
                    placeholder="Detailed description of the item..."
                    {...register('description')}
                    disabled={isViewing}
                    rows={4}
                    className={`
                      pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200 resize-vertical min-h-[100px] w-full text-sm
                      ${errors.description
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}
                      ${watchedFields.description && !isViewing ? 'border-blue-300' : ''}
                      ${isViewing ? 'text-gray-400' : 'text-black'}
                    `}
                  />
                  {errors.description?.message && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
                <Target className="h-5 w-5" /> Stock, Pricing & Media
              </CardTitle>
              <CardDescription className="text-blue-600">
                Inventory levels and pricing configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                    {/* Alternative items functionality removed as per user request */}
                  </div>

                  {/* Quantity fields - show all 3 in view mode, only main quantity in add/edit mode */}
                  {isViewing ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2 group">
                        <Label
                          htmlFor="quantity"
                          className="text-gray-700 group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium"
                        >
                          <Package className="h-4 w-4" /> Quantity
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          {...register('quantity', { valueAsNumber: true })}
                          disabled={true}
                          className="pl-3 pr-3 py-2 rounded-md shadow-sm border-gray-200 bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2 group">
                        <Label
                          htmlFor="damagedQuantity"
                          className="text-gray-700 group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium"
                        >
                          <Package className="h-4 w-4" /> Damaged Qty
                        </Label>
                        <Input
                          id="damagedQuantity"
                          type="number"
                          {...register('damagedQuantity', { valueAsNumber: true })}
                          disabled={true}
                          className="pl-3 pr-3 py-2 rounded-md shadow-sm border-gray-200 bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2 group">
                        <Label
                          htmlFor="availableQuantity"
                          className="text-gray-700 group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium"
                        >
                          <Package className="h-4 w-4" /> Available Qty
                        </Label>
                        <Input
                          id="availableQuantity"
                          type="number"
                          {...register('availableQuantity', { valueAsNumber: true })}
                          disabled={true}
                          className="pl-3 pr-3 py-2 rounded-md shadow-sm border-gray-200 bg-gray-50"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 group">
                        <Label
                          htmlFor="quantity"
                          className={`${errors.quantity ? 'text-red-500' : 'text-gray-700'
                            } group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                        >
                          <Package className="h-4 w-4" /> Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Enter quantity (e.g., 100)"
                          {...register('quantity', { valueAsNumber: true })}
                          className={`${errors.quantity
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                            } pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200 ${watchedFields.quantity !== null && watchedFields.quantity !== undefined ? 'border-blue-300' : ''
                            }`}
                        />
                        {errors.quantity?.message && (
                          <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.quantity.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="selling_price"
                        className={`${errors.selling_price ? 'text-red-500' : 'text-gray-700'} group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                      >
                        <DollarSign className="h-4 w-4" /> Unit Price
                      </Label>
                      <Input
                        id="selling_price"
                        type="number"
                        step="0.01"
                        placeholder="299.99"
                        {...register('selling_price', { valueAsNumber: true })}
                        disabled={isViewing}
                        className={`${errors.selling_price
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                          } pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200 ${watchedFields.selling_price && !isViewing ? 'border-blue-300' : ''}`}
                      />
                      {errors.selling_price?.message && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.selling_price.message}
                        </p>
                      )}
                    </div>

                    {/* Total Amount - Calculated Field (UI Only) */}
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="total_amount"
                        className="text-gray-700 group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium"
                      >
                        <DollarSign className="h-4 w-4" /> Total Amount
                      </Label>
                      <Input
                        id="total_amount"
                        type="text"
                        value={totalAmount > 0 ? totalAmount.toFixed(2) : '0.00'}
                        disabled={true}
                        className="pl-3 pr-3 py-2 rounded-md shadow-sm border-gray-200 bg-gray-50 text-gray-700 font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-1">Calculated: Quantity × Unit Price</p>
                    </div>
                  </div>

                  {/* Vendor/Supplier Dropdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="vendorId"
                        className="text-gray-700 group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium"
                      >
                        <Package className="h-4 w-4" /> Vendor/Supplier
                      </Label>
                      <Select
                        onValueChange={(value) => {
                          console.log('🔄 Vendor selection changed to:', value);
                          setValue('vendorId', value, { shouldValidate: true, shouldDirty: true });
                        }}
                        value={(() => {
                          const currentValue = watchedFields.vendorId as string | undefined;
                          console.log('🎯 Current vendorId value in Select:', currentValue);
                          console.log('🎯 Current vendorId type:', typeof currentValue);
                          console.log('📋 Available suppliers:', suppliers.map(s => ({ id: s.id, name: s.name })));
                          return currentValue;
                        })()}
                        disabled={isViewing || suppliersLoading}
                      >
                        <SelectTrigger
                          id="vendorId"
                          className={`pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200 w-full border-gray-200 focus:border-blue-500 focus:ring-blue-200 ${watchedFields.vendorId && !isViewing ? 'border-blue-300' : ''}`}
                        >
                          {suppliersLoading && (
                            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400 animate-spin" />
                          )}
                          <SelectValue placeholder={suppliersLoading ? 'Loading suppliers...' : suppliers.length === 0 ? 'No suppliers available' : 'Select vendor/supplier'} />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliersLoading ? (
                            <div className="p-2 text-gray-500 text-sm flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                              Loading suppliers...
                            </div>
                          ) : suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-gray-500 text-sm">No suppliers available</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <Label
                        htmlFor="image_1"
                        className={`${errors.image_1 ? 'text-red-500' : 'text-gray-700'} group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                      >
                        <Package className="h-4 w-4" /> Image 1 (JPG/PNG, max 5MB)
                      </Label>
                      {!isViewing && (
                        <Input
                          id="image_1"
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleMediaChange(e, 'image_1', setImage1Preview)}
                          disabled={isViewing}
                          className={`${errors.image_1
                            ? 'text-red-500 border-red-300 focus:border-red-500 focus:ring-red-200'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                            } pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200`}
                        />
                      )}
                      {image1Preview && (
                        <div className="mt-2">
                          {isViewing ? (
                            <div className="relative">
                              <div
                                className="relative w-32 h-32 border border-gray-200 rounded-md overflow-hidden cursor-pointer"
                                onMouseEnter={() => handleMouseEnter(image1Preview)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <img
                                  src={image1Preview}
                                  alt="Image 1"
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {showZoom && activeZoomImage === image1Preview && (
                                <div className="absolute left-36 top-0 w-80 h-80 border-2 border-blue-500 rounded-lg overflow-hidden bg-white shadow-2xl z-50">
                                  <img
                                    src={image1Preview}
                                    alt="Image 1 Full View"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <img
                              src={image1Preview}
                              alt="Image 1 Preview"
                              className="h-32 w-32 object-cover rounded-md border border-gray-200"
                            />
                          )}
                        </div>
                      )}
                      {errors.image_1?.message && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.image_1.message as string}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 group">
                      <Label
                        htmlFor="image_2"
                        className={`${errors.image_2 ? 'text-red-500' : 'text-gray-700'} group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                      >
                        <Package className="h-4 w-4" /> Image 2 (JPG/PNG, max 5MB)
                      </Label>
                      {!isViewing && (
                        <Input
                          id="image_2"
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleMediaChange(e, 'image_2', setImage2Preview)}
                          disabled={isViewing}
                          className={`${errors.image_2
                            ? 'text-red-500 border-red-300 focus:border-red-500 focus:ring-red-200'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                            } pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200`}
                        />
                      )}
                      {image2Preview && (
                        <div className="mt-2">
                          {isViewing ? (
                            <div className="relative">
                              <div
                                className="relative w-32 h-32 border border-gray-200 rounded-md overflow-hidden cursor-pointer"
                                onMouseEnter={() => handleMouseEnter(image2Preview)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <img
                                  src={image2Preview}
                                  alt="Image 2"
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {showZoom && activeZoomImage === image2Preview && (
                                <div className="absolute left-36 top-0 w-80 h-80 border-2 border-blue-500 rounded-lg overflow-hidden bg-white shadow-2xl z-50">
                                  <img
                                    src={image2Preview}
                                    alt="Image 2 Full View"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <img
                              src={image2Preview}
                              alt="Image 2 Preview"
                              className="h-32 w-32 object-cover rounded-md border border-gray-200"
                            />
                          )}
                        </div>
                      )}
                      {errors.image_2?.message && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.image_2.message as string}
                        </p>
                      )}
                    </div>
                  </div> */}

                  {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="space-y-2 group">
                        <Label className='group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium'>
                          <Package className="h-4 w-4" /> Video Type
                        </Label>
                        <div className="flex items-center gap-5">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="uploadvideo"
                              value="upload"
                              checked={videoType === 'upload'}
                              onChange={() => setVideoType('upload')}
                              disabled={isViewing}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="uploadvideo" className="text-sm">Upload a Video</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="youtubevideo"
                              value="youtube"
                              checked={videoType === 'youtube'}
                              onChange={() => setVideoType('youtube')}
                              disabled={isViewing}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="youtubevideo" className="text-sm">YouTube Video Link</Label>
                          </div>
                        </div>
                      </div>

                      {videoType === 'upload' && (
                        <div className="space-y-2 group mt-4">
                          <Label
                            htmlFor="video"
                            className={`${errors.video ? 'text-red-500' : 'text-gray-700'} group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                          >
                            <Video className="h-4 w-4" /> Upload a Video (MP4, max 50MB)
                          </Label>
                          <Input
                            id="video"
                            type="file"
                            accept="video/mp4"
                            onChange={(e) => handleMediaChange(e, 'video', setVideoPreview)}
                            disabled={isViewing}
                            className={`${errors.video
                              ? 'text-red-500 border-red-300 focus:border-red-500 focus:ring-red-200'
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                              } pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200`}
                          />
                          {videoPreview ? (
                            <video
                              src={videoPreview}
                              controls={true}
                              className="mt-2 h-32 w-full max-w-md object-contain rounded-md border border-gray-200"
                            />
                          ) : (
                            <div className="mt-2 h-32 w-full max-w-md flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
                              <p className="text-gray-500 text-sm">No Video Available</p>
                            </div>
                          )}
                          {errors.video?.message && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.video.message as string}
                            </p>
                          )}
                        </div>
                      )}

                      {videoType === 'youtube' && (
                        <div className="space-y-2 group mt-4">
                          <Label
                            htmlFor="youtube"
                            className={`${errors.youtube_link ? 'text-red-500' : 'text-gray-700'} text-gray-700 group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium`}
                          >
                            <Youtube className="h-4 w-4" /> YouTube Video Link
                          </Label>
                          <Input
                            id="youtube"
                            type="text"
                            value={youtubeUrl}
                            onChange={handleYoutubeChange}
                            placeholder="Enter YouTube video link"
                            disabled={isViewing}
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-200 pl-3 pr-3 py-2 rounded-md shadow-sm focus:ring-4 transition-all duration-200"
                          />
                          {youtubeVideoId ? (
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                              <iframe
                                title="YouTube Video"
                                width="100%"
                                height="100%"
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          ) : (
                            youtubeUrl && (
                              <div className="mt-2 h-32 w-full max-w-md flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
                                <p className="text-red-500 text-sm">Invalid YouTube link</p>
                              </div>
                            )
                          )}
                          {errors.youtube_link?.message && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.youtube_link.message as string}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div> */}
                </div>

                {/* {!isViewing && ( 
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2 group relative">
                      <Label className="text-gray-700 group-hover:text-blue-700 transition-colors duration-200 flex items-center gap-1 font-medium">
                        <Search className="h-4 w-4" /> Search Alternative Items
                      </Label>
                      <div className="relative">
                        <Input
                          id="alternative_search"
                          placeholder="Search for alternative items by name or description..."
                          value={alternativeSearch}
                          onChange={(e) => setAlternativeSearch(e.target.value)}
                          onFocus={() => debouncedSearch.trim().length >= 3 && setShowAlternativesDropdown(true)}
                          disabled={isViewing}
                          className="pl-10 pr-4 py-2 rounded-lg shadow-sm border-blue-200 focus:border-blue-500 focus:ring-blue-200 focus:ring-4 transition-colors duration-200"
                        />
                        {isFetchingAlternatives ? (
                          <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400 animate-spin" />
                        ) : (
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      {showAlternativesDropdown && filteredAlternatives.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-xl flex flex-col max-h-80">
                          <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Available Alternatives ({filteredAlternatives.length})
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto min-h-0">
                            {filteredAlternatives.map((alternative, index) => (
                              <div
                                key={alternative.value}
                                className={`p-3 hover:bg-blue-50 transition-colors duration-200 ${index !== filteredAlternatives.length - 1 ? 'border-b border-blue-100' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        checked={
                                          tempSelectedAlternatives.includes(alternative.value) ||
                                          selectedAlternativesWithNames.some((s) => s.id === alternative.value)
                                        }
                                        onCheckedChange={() => {
                                          const syntheticEvent = { stopPropagation: () => {} } as React.MouseEvent;
                                          handleAlternativeToggle(alternative, syntheticEvent);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={isViewing}
                                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Package className="h-3 w-3 text-blue-400" />
                                          <p className="font-medium text-blue-900 text-sm">{alternative.label}</p>
                                        </div>
                                        <p className="text-xs text-blue-500 ml-5">{alternative.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-blue-600 text-sm">{formatCurrency(alternative.price ??0)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2 p-3 border-t border-blue-200 flex-shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTempSelectedAlternatives([]);
                                setAlternativeSearch('');
                                setShowAlternativesDropdown(false);
                              }}
                              disabled={isViewing}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleConfirmAlternatives}
                              disabled={isViewing || tempSelectedAlternatives.length === 0}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Confirm
                            </Button>
                          </div>
                        </div>
                      )}
                      {showAlternativesDropdown && filteredAlternatives.length === 0 && !isFetchingAlternatives && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-xl p-4">
                          <p className="text-gray-500 text-sm">No alternative items found</p>
                        </div>
                      )}
                    </div>

                    {selectedAlternativesWithNames.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-700 flex items-center gap-1 font-medium">
                            <Package className="h-4 w-4" /> Selected Alternatives
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSelectedAlternativesExpanded(!isSelectedAlternativesExpanded)}
                            disabled={isViewing}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {isSelectedAlternativesExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {isSelectedAlternativesExpanded && (
                          <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                            {selectedAlternativesWithNames.map((alternative) => (
                              <div
                                key={alternative.id}
                                className="flex items-center justify-between p-2 bg-white rounded-md mb-2 last:mb-0 shadow-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <Package className="h-3 w-3 text-blue-400" />
                                  <p className="text-sm text-blue-900">{alternative.item_name}</p>
                                </div>
                                {!isViewing && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleAlternativeRemove(alternative.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )} */}
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
                {isEditing ? 'Update Item' : 'Create Item'}
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
              <Button variant="outline" onClick={stayOnForm} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                Stay
              </Button>
              <Button variant="destructive" onClick={confirmCancel}>
                Discard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InventoryForm;