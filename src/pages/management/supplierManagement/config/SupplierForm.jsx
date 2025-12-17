import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  CreditCard,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Truck,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  DollarSign,
  Save,
  Edit3,
  Package,
  Search,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { supplierService } from "@/services/supplierService";

const formatCurrency = (value) => `$${value.toLocaleString()}`;

const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const getRatingLabel = (r) => {
    if (r >= 4.5) return "Excellent";
    if (r >= 3.5) return "Good";
    if (r >= 2.5) return "Average";
    if (r >= 1.5) return "Poor";
    if (r > 0) return "Very Poor";
    return "";
  };
  

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating || rating) >= starValue;
        const isHalf = !isFilled && (hoverRating || rating) >= starValue - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => !readonly && onRatingChange(starValue)}
          >
            <Star
              className={`h-5 w-5 ${isFilled
                ? "fill-yellow-400 text-yellow-400"
                : isHalf
                  ? "fill-yellow-200 text-yellow-400"
                  : "fill-gray-200 text-gray-300"
                } transition-colors`}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="ml-2 text-sm text-gray-600 font-medium">
          {getRatingLabel(rating)}
        </span>
      )}
    </div>
  );
};

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);
  const isViewMode = location.pathname.includes("/view");

  const [isLoading, setIsLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      name: "",
      registrationNumber: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      bankName: "",
      bank_account_number: "",
      ifscCode: "",
      ibanCode: "",
      description: "",
      status: "pending",
      rating: 0,
    },
  });

  const watched = watch();

  // Load supplier data when editing
  useEffect(() => {
    if (isEditing) {
      fetchSupplierData();
    }
  }, [id, isEditing]);

  const fetchSupplierData = async () => {
    try {
      const response = await supplierService.getSupplier(id);
      console.log("Supplier data response:", response); // For debugging
      
      // Access the data correctly based on the actual API response structure
      const supplier = response.data;
      
      reset({
        name: supplier.name,
        registrationNumber: supplier.registrationNumber || "",
        contactPerson: supplier.contactPerson || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        website: supplier.website || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        postalCode: supplier.postalCode || "",
        country: supplier.country || "",
        bankName: supplier.bankName || "",
        bank_account_number: supplier.bank_account_number || "",
        ifscCode: supplier.ifscCode || "",
        ibanCode: supplier.ibanCode || "",
        description: supplier.description || "",
        status: supplier.status || "approved",
        rating: supplier.rating || 0,
      });
    } catch (error) {
      console.error("Error fetching supplier:", error);
      toast.error("Failed to load supplier data");
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const supplierData = {
        name: data.name,
        registrationNumber: data.registrationNumber,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        bankName: data.bankName,
        bank_account_number: data.bank_account_number,
        ifscCode: data.ifscCode,
        ibanCode: data.ibanCode,
        description: data.description,
        status: data.status,
        rating: data.rating,
      };
      
      console.log("Submitting supplier data:", supplierData);

      if (isEditing) {
        await supplierService.updateSupplier(id, supplierData);
        toast.success("Supplier updated successfully!");
      } else {
        await supplierService.createSupplier(supplierData);
        toast.success("Supplier created successfully!");
      }
      
      setTimeout(() => navigate("/dashboard/supplierManagement"), 1000);
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error(isEditing ? "Failed to update supplier" : "Failed to create supplier");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/supplierManagement")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-blue-600" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isViewMode ? "View Supplier" : isEditing ? "Update Supplier" : "Add New Supplier"}
              </h1>
              <p className="text-gray-600">
                {isViewMode ? "View details" : isEditing ? "Update info" : "Create new supplier"}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-blue-800">Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Company Name *</Label>
                    <Input {...register("name", { required: "Company name is required" })} disabled={isViewMode} />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label>GST Number</Label>
                    <Input {...register("registrationNumber")} disabled={isViewMode} />
                  </div>
                  <div>
                    <Label>Contact Person</Label>
                    <Input {...register("contactPerson")} disabled={isViewMode} />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" {...register("email")} disabled={isViewMode} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input {...register("phone")} disabled={isViewMode} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Website</Label>
                    <Input {...register("website")} disabled={isViewMode} />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Address</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label>Street Address</Label>
                    <Input {...register("address")} disabled={isViewMode} />
                  </div>
                  <div><Label>City</Label><Input {...register("city")} disabled={isViewMode} /></div>
                  <div><Label>State</Label><Input {...register("state")} disabled={isViewMode} /></div>
                  <div><Label>Postal Code</Label><Input {...register("postalCode")} disabled={isViewMode} /></div>
                  <div><Label>Country</Label><Input {...register("country")} disabled={isViewMode} /></div>
                </div>
              </div>

              {/* Financial */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Financial Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><Label>Bank Name</Label><Input {...register("bankName")} disabled={isViewMode} /></div>
                  <div><Label>Account Number</Label><Input {...register("bank_account_number")} disabled={isViewMode} /></div>
                  <div><Label>IFSC Code</Label><Input {...register("ifscCode")} disabled={isViewMode} /></div>
                  <div><Label>IBAN Code</Label><Input {...register("ibanCode")} disabled={isViewMode} /></div>
                </div>
              </div>

              {/* Additional */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Additional Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea {...register("description")} disabled={isViewMode} className="min-h-24" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Status</Label>
                    <Select 
                      onValueChange={(v) => setValue("status", v)} 
                      value={watched.status} 
                      disabled={isViewMode}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Rating</Label>
                    <StarRating rating={watched.rating || 0} onRatingChange={(r) => setValue("rating", r)} readonly={isViewMode} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!isViewMode && (
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => navigate("/dashboard/supplierManagement")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? "Update" : "Save"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierForm;