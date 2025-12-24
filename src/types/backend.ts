export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface Vendor {
  id?: string;
  _id?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditReport?: string;
  status?: 'pending' | 'approved' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id?: string;
  _id?: string;
  company?: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  subCategory?: string | null;
  createdAt?: string;
  updatedAt?: string;
  itemsCount?: number;
}

export interface Item {
  maxLevel: null;
  reorderLevel: null;
  _id: string;
  id: string;
  name: string;
  code: string;
  billNumber: string; // Changed from category to billNumber
  description?: string;
  unitOfMeasure?: string;
  vendor?: Vendor;
  unitPrice?: number;
  currency?: 'INR' | 'AED';
  quantity?: number;
  totalPrice?: number;
  purchaseDate?: string;
  status: string;
  qcStatus?: 'pending' | 'approved' | 'rejected';
  damagedQuantity?: number;
  qcRemarks?: string;
  qcCheckedByName?: string | null;
  inspectorName?: string | null;
  qcSubmittedByName?: string | null;
  availableQuantity?: number;
  availableStock?: number;
  additionalAttributes?: Record<string, unknown>;
  videoType?: 'upload' | 'youtube';
  youtubeLink?: string | null;
  videoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  _id: string;
  id?: string;
  company: string;
  name: string;
  code: string;
  type: 'Central Store' | 'Branch Store';
  parent?: {
    _id: string;
    name: string;
    code: string;
    type: 'Central Store' | 'Branch Store';
  } | null;
  manager?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreStock {
  id: string;
  product: Item;
  store?: Store;
  quantity: number;
  margin: number;
  currency: 'INR' | 'AED';
  unitPrice: number;
  updatedAt: string;
  transmissionData?: {
    originalPriceINR?: number;
    marginPercent?: number;
    unitPriceINR?: number;
    dpPriceAED?: number;
    maxMRPAED?: number;
    exchangeRate?: number;
    transmissionDate?: string;
    fromStoreId?: string;
    packingListId?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string | { name?: string; permissions?: string[] };
  permissions: string[];
  companyId?: string;
  company?: {
    id?: string;
    name?: string;
    code?: string;
    currency?: string;
  } | null;
  status?: string | null;
  isActive?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Supplier {
  _id: string;
  name: string;
  registrationNumber?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  bankName?: string;
  bank_account_number?: string;
  ifscCode?: string;
  ibanCode?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  rating?: number;
  createdAt: string;
  updatedAt: string;
}