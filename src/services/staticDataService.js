// Static Data Service - Replaces all API calls with static mock data (JavaScript version)

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ==================== MOCK DATA ====================

// Users Data
const mockUsers = [
	{
		id: 'user-001',
		first_name: 'John',
		last_name: 'Doe',
		email: 'john.doe@example.com',
		phone: '+1234567890',
		role_id: 'role-001',
		status: 'active',
		is_active: true,
		failed_attempts: 0,
		image: null,
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
	{
		id: 'user-002',
		first_name: 'Jane',
		last_name: 'Smith',
		email: 'jane.smith@example.com',
		phone: '+1234567891',
		role_id: 'role-002',
		status: 'active',
		is_active: true,
		failed_attempts: 0,
		image: null,
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
	{
		id: 'user-003',
		first_name: 'Admin',
		last_name: 'User',
		email: 'admin@example.com',
		phone: '+1234567892',
		role_id: 'role-003',
		status: 'active',
		is_active: true,
		failed_attempts: 0,
		image: null,
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
];

// Roles Data
const mockRoles = [
	{ id: 'role-001', name: 'admin', permissions: ['manage_users', 'view_reports'] },
	{ id: 'role-002', name: 'purchaser', permissions: ['manage_purchases'] },
	{ id: 'role-003', name: 'biller', permissions: ['manage_sales'] },
];

// Suppliers Data
const mockSuppliers = [
	{
		id: 'supplier-001',
		supplier_id: 'SUP001',
		supplier_name: 'ABC Electronics',
		contact_person: 'John Smith',
		email: 'john@abcelectronics.com',
		phone: '+1234567890',
		address: '123 Main St, City, State 12345',
		status: 'Active',
		is_active: true,
		credit_report: 'Good standing',
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
	{
		id: 'supplier-002',
		supplier_id: 'SUP002',
		supplier_name: 'XYZ Manufacturing',
		contact_person: 'Jane Doe',
		email: 'jane@xyzmanufacturing.com',
		phone: '+1234567891',
		address: '456 Oak Ave, Town, State 67890',
		status: 'Active',
		is_active: true,
		credit_report: 'Excellent standing',
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
];

// Categories Data
const mockCategories = [
	{ id: 'cat-001', name: 'Electronics', description: 'Electronic devices and components', is_active: true },
	{ id: 'cat-002', name: 'Office Supplies', description: 'Stationery and office equipment', is_active: true },
	{ id: 'cat-003', name: 'Furniture', description: 'Office furniture and fixtures', is_active: true },
];

// Items Data
const mockItems = [
	{
		id: 'item-001',
		item_code: 'ITEM001',
		item_name: 'Laptop Computer',
		category_id: 'cat-001',
		description: 'High-performance laptop for business use',
		unit_of_measure: 'pcs',
		vendor_id: 'supplier-001',
		unit_price: 1200.00,
		currency: 'USD',
		quantity: 10,
		total_price: 12000.00,
		purchase_date: new Date().toISOString(),
		status: 'Available',
		qc_status: 'approved',
		is_active: true,
		additional_attributes: {},
		video_type: 'upload',
		youtube_link: null,
		video_url: null,
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
	{
		id: 'item-002',
		item_code: 'ITEM002',
		item_name: 'Office Chair',
		category_id: 'cat-003',
		description: 'Ergonomic office chair with lumbar support',
		unit_of_measure: 'pcs',
		vendor_id: 'supplier-002',
		unit_price: 250.00,
		currency: 'USD',
		quantity: 25,
		total_price: 6250.00,
		purchase_date: new Date().toISOString(),
		status: 'Available',
		qc_status: 'approved',
		is_active: true,
		additional_attributes: {},
		video_type: 'upload',
		youtube_link: null,
		video_url: null,
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
];

// Inventory Data
const mockInventory = [
	{
		id: 'inv-001',
		product_id: 'item-001',
		store_id: 'store-001',
		quantity: 5,
		damaged_quantity: 0,
		available_quantity: 5,
		last_updated: new Date().toISOString(),
	},
	{
		id: 'inv-002',
		product_id: 'item-002',
		store_id: 'store-001',
		quantity: 15,
		damaged_quantity: 1,
		available_quantity: 14,
		last_updated: new Date().toISOString(),
	},
];

// Stores Data
const mockStores = [
	{
		id: 'store-001',
		store_code: 'STORE001',
		store_name: 'Main Warehouse',
		store_address: '789 Warehouse Blvd, Industrial Area',
		store_city: 'Metropolis',
		store_state: 'State',
		store_postal_code: '54321',
		store_country: 'USA',
		store_phone: '+1234567892',
		store_email: 'warehouse@company.com',
		store_type: 'Central Store',
		parent_store_id: null,
		manager_id: 'user-001',
		bank_name: 'Bank of America',
		bank_account_number: '123456789012',
		bank_ifsc_code: 'BOFAUS12345',
		bank_iban_code: null,
		tax_code: 'TAX001',
		is_active: true,
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
	{
		id: 'store-002',
		store_code: 'STORE002',
		store_name: 'Retail Branch',
		store_address: '101 Retail St, Downtown',
		store_city: 'Metropolis',
		store_state: 'State',
		store_postal_code: '54322',
		store_country: 'USA',
		store_phone: '+1234567893',
		store_email: 'branch@company.com',
		store_type: 'Branch Store',
		parent_store_id: 'store-001',
		manager_id: 'user-002',
		bank_name: 'Bank of America',
		bank_account_number: '234567890123',
		bank_ifsc_code: 'BOFAUS23456',
		bank_iban_code: null,
		tax_code: 'TAX002',
		is_active: true,
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
];

// Purchase Orders Data
const mockPurchaseOrders = [
	{
		id: 'po-001',
		po_number: 'PO-2023-001',
		supplier_id: 'supplier-001',
		order_date: new Date().toISOString(),
		expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		status: 'Pending',
		total_amount: 12000.00,
		currency: 'USD',
		created_by: 'user-001',
		approved_by: null,
		approved_at: null,
		items: [
			{
				item_id: 'item-001',
				quantity: 10,
				unit_price: 1200.00,
				total_price: 12000.00,
			}
		],
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
];

// Sales Invoices Data
const mockSalesInvoices = [
	{
		id: 'si-001',
		invoice_number: 'INV-2023-001',
		customer_id: 'customer-001',
		invoice_date: new Date().toISOString(),
		due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
		status: 'Pending',
		total_amount: 2500.00,
		currency: 'USD',
		store_id: 'store-002',
		created_by: 'user-002',
		items: [
			{
				item_id: 'item-002',
				quantity: 10,
				unit_price: 250.00,
				total_price: 2500.00,
			}
		],
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
];

// Customers Data
const mockCustomers = [
	{
		id: 'customer-001',
		customer_id: 'CUST001',
		customer_name: 'Tech Solutions Inc.',
		email: 'contact@techsolutions.com',
		phone: '+1234567894',
		contact_person: 'Michael Johnson',
		status: 'Active',
		is_active: true,
		tax_number: 'TAX-12345',
		billing_address: '321 Business Park, Corporate City',
		shipping_address: '321 Business Park, Corporate City',
		created_at: new Date().toISOString(),
		modified_at: new Date().toISOString(),
	},
];

// Delay utility for simulating API calls
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== CRUD OPERATIONS ====================

// Generic list function
const listItems = (items, filters = {}, pagination = {}) => {
	const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
	let filtered = [...items];
	
	// Apply filters
	if (filters.status && filters.status !== 'all') {
		filtered = filtered.filter(item => item.status === filters.status);
	}
	
	if (filters.search) {
		const searchTerm = filters.search.toLowerCase();
		filtered = filtered.filter(item => 
			(item.name && item.name.toLowerCase().includes(searchTerm)) ||
			(item.email && item.email.toLowerCase().includes(searchTerm)) ||
			(item.item_name && item.item_name.toLowerCase().includes(searchTerm)) ||
			(item.supplier_name && item.supplier_name.toLowerCase().includes(searchTerm)) ||
			(item.customer_name && item.customer_name.toLowerCase().includes(searchTerm))
		);
	}
	
	// Apply sorting
	filtered.sort((a, b) => {
		const aVal = a[sortBy];
		const bVal = b[sortBy];
		if (sortOrder === 'asc') {
			return aVal > bVal ? 1 : -1;
		} else {
			return aVal < bVal ? 1 : -1;
		}
	});
	
	// Apply pagination
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	const paginated = filtered.slice(startIndex, endIndex);
	
	return {
		data: paginated,
		meta: {
			page,
			limit,
			total: filtered.length,
			totalPages: Math.ceil(filtered.length / limit)
		}
	};
};

// Generic get by ID function
const getItemById = (items, id) => {
	const item = items.find(i => i.id === id);
	return item ? { data: item } : { data: null, error: { message: 'Item not found' } };
};

// ==================== SERVICE METHODS ====================

// Users
export const listUsers = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockUsers, filters, pagination);
};

export const getUser = async (id) => {
	await delay();
	return getItemById(mockUsers, id);
};

// Roles
export const listRoles = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockRoles, filters, pagination);
};

export const getRole = async (id) => {
	await delay();
	return getItemById(mockRoles, id);
};

// Suppliers
export const listSuppliers = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockSuppliers, filters, pagination);
};

export const getSupplier = async (id) => {
	await delay();
	return getItemById(mockSuppliers, id);
};

// Categories
export const listCategories = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockCategories, filters, pagination);
};

export const getCategory = async (id) => {
	await delay();
	return getItemById(mockCategories, id);
};

// Items
export const listItemsService = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockItems, filters, pagination);
};

export const getItem = async (id) => {
	await delay();
	return getItemById(mockItems, id);
};

// Inventory
export const listInventory = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockInventory, filters, pagination);
};

export const getInventoryItem = async (id) => {
	await delay();
	return getItemById(mockInventory, id);
};

// Stores
export const listStores = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockStores, filters, pagination);
};

export const getStore = async (id) => {
	await delay();
	return getItemById(mockStores, id);
};

// Purchase Orders
export const listPurchaseOrders = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockPurchaseOrders, filters, pagination);
};

export const getPurchaseOrder = async (id) => {
	await delay();
	return getItemById(mockPurchaseOrders, id);
};

// Sales Invoices
export const listSalesInvoices = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockSalesInvoices, filters, pagination);
};

export const getSalesInvoice = async (id) => {
	await delay();
	return getItemById(mockSalesInvoices, id);
};

// Customers
export const listCustomers = async (filters = {}, pagination = {}) => {
	await delay();
	return listItems(mockCustomers, filters, pagination);
};

export const getCustomer = async (id) => {
	await delay();
	return getItemById(mockCustomers, id);
};

// ==================== AUTHENTICATION (STATIC) ====================

export const authenticateUser = async (email, password) => {
	await delay(500);
	const user = mockUsers.find(u => u.email === email && u.is_active);
	if (!user) return { data: null, error: { message: 'Invalid email or password' } };
	const userData = {
		...user,
	};
	return { data: { user: userData, session: { access_token: `mock-token-${Date.now()}`, user: userData } }, error: null };
};

export const getSession = async () => {
	await delay();
	const storedUserData = localStorage.getItem('userData');
	if (!storedUserData) return { data: { session: null }, error: null };
	const userData = JSON.parse(storedUserData);
	return { data: { session: { access_token: 'mock-token', user: userData } }, error: null };
};

// Export mocks (optional)
export { mockUsers, mockRoles, mockSuppliers, mockItems, mockInventory, mockStores, mockPurchaseOrders, mockSalesInvoices, mockCustomers };


