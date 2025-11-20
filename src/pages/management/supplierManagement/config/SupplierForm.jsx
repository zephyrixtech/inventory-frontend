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
import { categoryService } from "@/services/categoryService";
import { getItems } from "@/services/itemService";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSupplies, setSelectedSupplies] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredSupplies, setFilteredSupplies] = useState([]);
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);
  const [tempSelectedSupplies, setTempSelectedSupplies] = useState([]);
  const [isSuppliesExpanded, setIsSuppliesExpanded] = useState(false);
  const [supplierData, setSupplierData] = useState(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSupplies, setIsLoadingSupplies] = useState(false);
  const [categorySubcategories, setCategorySubcategories] = useState({}); // { categoryId: [subcategories] }
  const [selectedSubcategories, setSelectedSubcategories] = useState({}); // { categoryId: subcategoryId }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      companyId: "",
      name: "",
      registrationNumber: "",
      taxId: "",
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
      creditLimit: 0,
      paymentTerms: "",
      description: "",
      status: "approved",
      rating: 0,
      notes: "",
      selectedBrands: [],
      selectedSupplies: [],
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
      
      setSupplierData(supplier);
      
      reset({
        companyId: supplier.supplierId,
        name: supplier.name,
        registrationNumber: supplier.registrationNumber || "",
        taxId: supplier.taxId || "",
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
        creditLimit: supplier.creditLimit || 0,
        paymentTerms: supplier.paymentTerms || "",
        description: supplier.description || "",
        status: supplier.status || "approved",
        rating: supplier.rating || 0,
        notes: supplier.notes || "",
        selectedBrands: supplier.selectedBrands || [],
        selectedSupplies: supplier.selectedSupplies || [],
      });

      // Set selected categories and supplies if they exist
      if (supplier.selectedBrands && supplier.selectedBrands.length > 0) {
        try {
          // Fetch category details for selected category IDs
          const categoryPromises = supplier.selectedBrands.map(catId => 
            categoryService.getCategory(catId).catch(() => null)
          );
          const categoryResults = await Promise.all(categoryPromises);
          const categories = categoryResults
            .filter(result => result && result.data)
            .map(result => ({ id: result.data.id || result.data._id, name: result.data.name }));
          setSelectedCategories(categories);
          
          // Load selected subcategories if they exist
          if (supplier.selectedSubcategories && Array.isArray(supplier.selectedSubcategories)) {
            const subcategoryMap = {};
            supplier.selectedSubcategories.forEach(sub => {
              if (sub.categoryId && sub.subcategoryId) {
                subcategoryMap[String(sub.categoryId)] = String(sub.subcategoryId);
              }
            });
            setSelectedSubcategories(subcategoryMap);
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      }
      
      if (supplier.selectedSupplies && supplier.selectedSupplies.length > 0) {
        try {
          // Fetch all items and filter by selected IDs
          const response = await getItems(1, 1000, {});
          const allItems = response.data || [];
          const selectedItemIds = supplier.selectedSupplies;
          const supplies = allItems
            .filter(item => {
              const itemId = item.id || item._id;
              return itemId && (selectedItemIds.includes(itemId) || selectedItemIds.includes(itemId.toString()));
            })
            .map(item => ({
              id: String(item.id || item._id),
              name: item.name,
              description: item.description || "",
              price: item.unitPrice || 0,
              category_id: item.categoryId
            }))
            .filter(item => item.id); // Filter out items without valid IDs
          setSelectedSupplies(supplies);
        } catch (error) {
          console.error("Error fetching supplies:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching supplier:", error);
      toast.error("Failed to load supplier data");
    }
  };

  // Fetch categories dynamically when typing
  useEffect(() => {
    const fetchCategories = async () => {
      if (categorySearchTerm.length < 1) {
        setFilteredCategories([]);
        return;
      }

      setIsLoadingCategories(true);
      try {
        const response = await categoryService.listCategories({
          search: categorySearchTerm,
          status: 'active',
          limit: 50
        });
        
        const categories = Array.isArray(response.data) 
          ? response.data.map(cat => ({ id: cat.id || cat._id, name: cat.name }))
          : [];
        setFilteredCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to fetch categories");
        setFilteredCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    const timeout = setTimeout(fetchCategories, 300);
    return () => clearTimeout(timeout);
  }, [categorySearchTerm]);

  // Fetch supplies dynamically - only show items for selected categories
  useEffect(() => {
    const fetchSupplies = async () => {
      if (searchTerm.length < 1 || selectedCategories.length === 0) {
        setFilteredSupplies([]);
        return;
      }

      setIsLoadingSupplies(true);
      try {
        const categoryIds = selectedCategories.map(c => c.id);
        
        // Fetch items for each selected category
        const itemPromises = categoryIds.map(categoryId =>
          getItems(1, 100, {
            categoryId: categoryId,
            search: searchTerm
          }).catch(() => ({ data: [], meta: null }))
        );
        
        const results = await Promise.all(itemPromises);
        const allItems = results.flatMap(result => result.data || []);
        
        // Filter by search term and map to supply format
        const filtered = allItems
          .filter(item => 
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(item => ({
            id: item.id || item._id,
            name: item.name,
            description: item.description || "",
            price: item.unitPrice || 0,
            category_id: item.categoryId
          }))
          .filter(item => item.id); // Filter out items without valid IDs
        
        setFilteredSupplies(filtered);
      } catch (error) {
        console.error("Error fetching supplies:", error);
        toast.error("Failed to fetch supplies");
        setFilteredSupplies([]);
      } finally {
        setIsLoadingSupplies(false);
      }
    };

    const timeout = setTimeout(fetchSupplies, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, selectedCategories]);

  const handleCategoryToggle = (category) => {
    const isSelected = tempSelectedCategories.includes(category.id);
    if (isSelected) {
      setTempSelectedCategories(tempSelectedCategories.filter(id => id !== category.id));
    } else {
      setTempSelectedCategories([...tempSelectedCategories, category.id]);
    }
  };

  const handleSupplyToggle = (supply) => {
    const isSelected = tempSelectedSupplies.includes(supply.id);
    if (isSelected) {
      setTempSelectedSupplies(tempSelectedSupplies.filter(id => id !== supply.id));
    } else {
      setTempSelectedSupplies([...tempSelectedSupplies, supply.id]);
    }
  };

  // Fetch subcategories for selected categories
  // Logic: for each selected category, read its own `subCategory` field
  // and treat it as a comma-separated list of subcategory names.
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedCategories.length === 0) {
        setCategorySubcategories({});
        return;
      }

      const subcategoryMap = {};
      try {
        // Fetch all active categories once so we can look up full records
        const response = await categoryService.listCategories({
          status: "active",
          limit: 1000,
        });

        const allCategories = Array.isArray(response.data) ? response.data : [];

        for (const category of selectedCategories) {
          const categoryIdStr = String(category.id);

          // Find the full category record that matches this selected category
          const fullCategory = allCategories.find((cat) => {
            const catId = String(cat.id || cat._id);
            return catId === categoryIdStr;
          });

          if (!fullCategory || !fullCategory.subCategory) {
            continue;
          }

          // Example: "sub-cat" OR "sub -cate 2, new one"
          // Split by comma into individual subcategory names
          const parts = fullCategory.subCategory
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);

          if (parts.length === 0) continue;

          const subcategories = parts.map((name, index) => ({
            id: `${categoryIdStr}-${index}`, // local ID for React key
            name,
            categoryId: categoryIdStr,
          }));

          subcategoryMap[categoryIdStr] = subcategories;
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }

      setCategorySubcategories(subcategoryMap);
    };

    fetchSubcategories();
  }, [selectedCategories]);

  const confirmCategories = () => {
    // Combine temp selected with already selected categories
    const newCategoryIds = [...new Set([
      ...tempSelectedCategories,
      ...selectedCategories.map(c => c.id)
    ])];
    
    // Get category objects from filtered categories
    const newCategories = filteredCategories.filter(c => 
      newCategoryIds.includes(c.id)
    );
    
    // Also keep already selected categories that might not be in filtered list
    const existingCategories = selectedCategories.filter(c => 
      newCategoryIds.includes(c.id) && !newCategories.some(nc => nc.id === c.id)
    );
    
    const allCategories = [...newCategories, ...existingCategories];
    setSelectedCategories(allCategories);
    setValue("selectedBrands", allCategories.map(c => c.id).filter(Boolean), { shouldValidate: true });
    setTempSelectedCategories([]);
    setCategorySearchTerm("");

    // Filter supplies to match selected categories
    const categoryIds = allCategories.map(c => c.id).filter(Boolean);
    const filtered = selectedSupplies.filter(s => s.id && categoryIds.includes(s.category_id));
    setSelectedSupplies(filtered);
    setValue("selectedSupplies", filtered.map(s => s.id).filter(Boolean), { shouldValidate: true });
  };

  const confirmSupplies = () => {
    // Combine temp selected with already selected supplies
    const newIds = [...new Set([...tempSelectedSupplies, ...selectedSupplies.map(s => s.id).filter(Boolean)])].filter(Boolean);
    
    // Get supply objects from filtered supplies
    const newSupplies = filteredSupplies.filter(s => s.id && newIds.includes(s.id));
    
    // Also keep already selected supplies that might not be in filtered list
    const existingSupplies = selectedSupplies.filter(s => 
      s.id && newIds.includes(s.id) && !newSupplies.some(ns => ns.id === s.id)
    );
    
    const allSupplies = [...newSupplies, ...existingSupplies].filter(s => s.id);
    setSelectedSupplies(allSupplies);
    setValue("selectedSupplies", allSupplies.map(s => s.id).filter(Boolean), { shouldValidate: true });
    setTempSelectedSupplies([]);
    setSearchTerm("");
  };

  const removeCategory = (id) => {
    const categoryIdStr = String(id);
    const updated = selectedCategories.filter(c => String(c.id) !== categoryIdStr);
    setSelectedCategories(updated);
    setValue("selectedBrands", updated.map(c => String(c.id)).filter(Boolean), { shouldValidate: true });

    // Remove subcategory selection for this category
    const newSubcategories = { ...selectedSubcategories };
    delete newSubcategories[categoryIdStr];
    setSelectedSubcategories(newSubcategories);

    const categoryIds = updated.map(c => String(c.id)).filter(Boolean);
    const filtered = selectedSupplies.filter(s => s.id && categoryIds.includes(String(s.category_id)));
    setSelectedSupplies(filtered);
    setValue("selectedSupplies", filtered.map(s => String(s.id)).filter(Boolean), { shouldValidate: true });
  };

  const removeSupply = (id) => {
    const updated = selectedSupplies.filter(s => s.id && s.id !== id);
    setSelectedSupplies(updated);
    setValue("selectedSupplies", updated.map(s => s.id).filter(Boolean), { shouldValidate: true });
  };

  const handleSubcategoryChange = (categoryId, subcategoryValue) => {
    const catIdStr = String(categoryId);
    // "__none" means clear the selection
    const subcatValue =
      !subcategoryValue || subcategoryValue === "__none" ? null : String(subcategoryValue);

    setSelectedSubcategories((prev) => ({
      ...prev,
      [catIdStr]: subcatValue,
    }));
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const supplierData = {
        supplierId: data.companyId,
        name: data.name,
        registrationNumber: data.registrationNumber,
        taxId: data.taxId,
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
        creditLimit: data.creditLimit,
        paymentTerms: data.paymentTerms,
        description: data.description,
        status: data.status,
        rating: data.rating,
        notes: data.notes,
        selectedBrands: selectedCategories.map(c => String(c.id)).filter(Boolean),
        selectedSupplies: selectedSupplies
          .map(s => s.id ? String(s.id) : null)
          .filter(Boolean),
        selectedSubcategories: Object.entries(selectedSubcategories)
          .filter(([_, subcatId]) => subcatId)
          .map(([categoryId, subcategoryId]) => ({
            categoryId: String(categoryId),
            subcategoryId: String(subcategoryId)
          })),
      };
      
      console.log("Submitting supplier data:", {
        ...supplierData,
        selectedSupplies: supplierData.selectedSupplies,
        selectedSuppliesCount: supplierData.selectedSupplies.length
      });

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
                    <Label>Company ID *</Label>
                    <Input {...register("companyId", { required: "Required" })} disabled={isViewMode} />
                    {errors.companyId && <p className="text-red-500 text-sm">{errors.companyId.message}</p>}
                  </div>
                  <div>
                    <Label>Company Name *</Label>
                    <Input {...register("name", { required: "Required" })} disabled={isViewMode} />
                  </div>
                  <div>
                    <Label>Registration Number *</Label>
                    <Input {...register("registrationNumber", { required: "Required" })} disabled={isViewMode} />
                  </div>
                  <div>
                    <Label>Tax ID *</Label>
                    <Input {...register("taxId", { required: "Required" })} disabled={isViewMode} />
                  </div>
                  <div>
                    <Label>Contact Person *</Label>
                    <Input {...register("contactPerson", { required: "Required" })} disabled={isViewMode} />
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
                    <Label>Email *</Label>
                    <Input type="email" {...register("email", { required: "Required" })} disabled={isViewMode} />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input {...register("phone", { required: "Required" })} disabled={isViewMode} />
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
                    <Label>Street Address *</Label>
                    <Input {...register("address", { required: "Required" })} disabled={isViewMode} />
                  </div>
                  <div><Label>City *</Label><Input {...register("city", { required: "Required" })} disabled={isViewMode} /></div>
                  <div><Label>State *</Label><Input {...register("state", { required: "Required" })} disabled={isViewMode} /></div>
                  <div><Label>Postal Code *</Label><Input {...register("postalCode", { required: "Required" })} disabled={isViewMode} /></div>
                  <div><Label>Country *</Label><Input {...register("country", { required: "Required" })} disabled={isViewMode} /></div>
                </div>
              </div>

              {/* Supplies */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Supplies</h3>
                </div>

                {/* Category Search */}
                <div className="space-y-3">
                  <Label>Search Category</Label>
                  <div className="relative">
                    <Input
                      placeholder="Type to search categories..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                      disabled={isViewMode}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    {isLoadingCategories && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 text-gray-400 animate-spin" />
                    )}
                    
                    {categorySearchTerm.length >= 1 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-10">
                        {isLoadingCategories ? (
                          <div className="border rounded-lg shadow-lg bg-white p-4 text-center text-gray-500">
                            Loading categories...
                          </div>
                        ) : filteredCategories.length > 0 ? (
                          <div className="border rounded-lg shadow-lg bg-white max-h-64 overflow-y-auto">
                            {filteredCategories.map(category => (
                              <div key={category.id} className="p-3 hover:bg-gray-50 flex items-center gap-3">
                                <Checkbox
                                  checked={tempSelectedCategories.includes(category.id) || selectedCategories.some(c => c.id === category.id)}
                                  onCheckedChange={() => handleCategoryToggle(category)}
                                  disabled={isViewMode}
                                />
                                <span>{category.name}</span>
                              </div>
                            ))}
                            <div className="p-2 border-t flex justify-end gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => { setTempSelectedCategories([]); setCategorySearchTerm(""); }}>
                                Cancel
                              </Button>
                              <Button type="button" size="sm" onClick={confirmCategories}>Confirm</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border rounded-lg shadow-lg bg-white p-4 text-center text-gray-500">
                            No categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Categories */}
                {selectedCategories.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Selected Categories ({selectedCategories.length})</Label>
                    </div>
                    <div className="space-y-4">
                      {selectedCategories.map((c) => {
                        const categoryId = String(c.id);
                        const subcategories = categorySubcategories[categoryId];
                        const hasSubcategories =
                          subcategories &&
                          Array.isArray(subcategories) &&
                          subcategories.length > 0;

                        return (
                          <div
                            key={c.id}
                            className="p-3 border rounded-lg bg-blue-50 space-y-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{c.name}</span>
                              {!isViewMode && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeCategory(c.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            {/* Subcategory Dropdown */}
                            {hasSubcategories && (
                              <div>
                                <Label className="text-sm">
                                  Subcategory (Optional)
                                </Label>
                                <Select
                                  value={selectedSubcategories[categoryId] || "__none"}
                                  onValueChange={(value) =>
                                    handleSubcategoryChange(categoryId, value)
                                  }
                                  disabled={isViewMode}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select subcategory" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none">None</SelectItem>
                                    {subcategories.map((subcat) => (
                                      <SelectItem
                                        key={subcat.id}
                                        value={subcat.name}
                                      >
                                        {subcat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Supply Search */}
                <div className="space-y-3">
                  <Label>Search Supplies</Label>
                  <div className="relative">
                    <Input
                      placeholder={selectedCategories.length === 0 ? "Select category first" : "Search items..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={selectedCategories.length === 0 || isViewMode}
                    />
                    {isLoadingSupplies && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 text-gray-400 animate-spin" />
                    )}
                    
                    {searchTerm.length >= 1 && selectedCategories.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-10">
                        {isLoadingSupplies ? (
                          <div className="border rounded-lg shadow-lg bg-white p-4 text-center text-gray-500">
                            Loading supplies...
                          </div>
                        ) : filteredSupplies.length > 0 ? (
                          <div className="border rounded-lg shadow-lg bg-white max-h-64 overflow-y-auto">
                            {filteredSupplies.map(supply => (
                              <div key={supply.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={tempSelectedSupplies.includes(supply.id) || selectedSupplies.some(s => s.id === supply.id)}
                                    onCheckedChange={() => handleSupplyToggle(supply)}
                                    disabled={isViewMode}
                                  />
                                  <div>
                                    <p className="font-medium">{supply.name}</p>
                                    <p className="text-xs text-gray-500">{supply.description}</p>
                                  </div>
                                </div>
                                <p className="font-semibold text-blue-600">{formatCurrency(supply.price)}</p>
                              </div>
                            ))}
                            <div className="p-2 border-t flex justify-end gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => { setTempSelectedSupplies([]); setSearchTerm(""); }}>
                                Cancel
                              </Button>
                              <Button type="button" size="sm" onClick={confirmSupplies}>Confirm</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border rounded-lg shadow-lg bg-white p-4 text-center text-gray-500">
                            No supplies found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Supplies */}
                {selectedSupplies.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Selected Supplies ({selectedSupplies.length})</Label>
                      <Button variant="ghost" size="sm" type="button" onClick={() => setIsSuppliesExpanded(!isSuppliesExpanded)}>
                        {isSuppliesExpanded ? <ChevronUp /> : <ChevronDown />} {isSuppliesExpanded ? "Collapse" : "Expand"}
                      </Button>
                    </div>
                    {isSuppliesExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedSupplies.map(s => (
                          <div key={s.id} className="p-3 border rounded-lg bg-blue-50 flex justify-between items-start">
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-sm text-gray-600">{s.description}</p>
                              <p className="font-semibold text-blue-600">{formatCurrency(s.price)}</p>
                            </div>
                            {!isViewMode && <Button type="button" size="sm" variant="ghost" onClick={() => removeSupply(s.id)}><X className="h-4 w-4" /></Button>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Financial */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Financial Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><Label>Bank Name *</Label><Input {...register("bankName", { required: "Required" })} disabled={isViewMode} /></div>
                  <div><Label>Account Number *</Label><Input {...register("bank_account_number", { required: "Required" })} disabled={isViewMode} /></div>
                  <div><Label>IFSC Code *</Label><Input {...register("ifscCode", { required: "Required" })} disabled={isViewMode} /></div>
                  <div><Label>IBAN Code *</Label><Input {...register("ibanCode", { required: "Required" })} disabled={isViewMode} /></div>
                  <div><Label>Credit Limit *</Label><Input type="number" {...register("creditLimit", { valueAsNumber: true, required: "Required" })} disabled={isViewMode} /></div>
                  <div><Label>Payment Terms *</Label><Input {...register("paymentTerms", { required: "Required" })} disabled={isViewMode} /></div>
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
                    <Label>Status *</Label>
                    <Select onValueChange={(v) => setValue("status", v)} defaultValue="approved" disabled={isViewMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Rating *</Label>
                    <StarRating rating={watched.rating || 0} onRatingChange={(r) => setValue("rating", r)} readonly={isViewMode} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea {...register("notes")} disabled={isViewMode} className="min-h-32" />
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