// Role-based module access control
export type UserRole = 'superadmin' | 'admin' | 'purchaser' | 'biller' | 'store';

export type ModuleKey = 
  | 'Dashboard'
  | 'Users'
  | 'Category Master'
  | 'Customer Master'
  | 'Item Configurator'
  | 'Item Master'
  | 'Quality Control'
  | 'Supplier Management'
  | 'Store Management'
  | 'Store Stock'
  | 'Packing Lists'
  | 'Daily Expenses'
  | 'Opening Balance'
  | 'Purchase Entries'
  | 'Purchase Order Management'
  | 'Inventory Management'
  | 'Sales Invoice'
  | 'Reports'
  | 'Purchase Order Approvals'
  | 'Returns Management'
  | 'Returns Eligible'
  | 'Workflow Configuration'
  | 'Audit Trail'
  | 'Role Management'
  | 'Administration'
  | 'Purchase Return Requests'
  | 'Product Transmission';

// Define which roles have access to which modules
export const ROLE_MODULE_ACCESS: Record<UserRole, ModuleKey[]> = {
  superadmin: [
    'Dashboard',
    'Users',
    'Category Master',
    'Customer Master',
    'Item Configurator',
    'Item Master',
    'Quality Control',
    'Supplier Management',
    'Store Management',
    'Store Stock',
    'Packing Lists',
    'Daily Expenses',
    'Opening Balance',
    'Purchase Entries',
    'Purchase Order Management',
    'Inventory Management',
    'Sales Invoice',
    'Reports',
    'Purchase Order Approvals',
    'Returns Management',
    'Returns Eligible',
    'Workflow Configuration',
    'Audit Trail',
    'Role Management',
    'Administration',
    'Purchase Return Requests',
    'Product Transmission'
  ],
  admin: [
   'Dashboard',
    'Users',
    'Category Master',
    'Customer Master',
    'Item Configurator',
    'Item Master',
    'Quality Control',
    'Supplier Management',
    'Store Management',
    'Store Stock',
    'Packing Lists',
    'Daily Expenses',
    'Opening Balance',
    'Purchase Entries',
    'Purchase Order Management',
    'Inventory Management',
    'Sales Invoice',
    'Reports',
    'Purchase Order Approvals',
    'Returns Management',
    'Returns Eligible',
    'Workflow Configuration',
    'Audit Trail',
    'Role Management',
    'Administration',
    'Purchase Return Requests',
    'Product Transmission'
  ],
  purchaser: [
    'Dashboard',
    'Item Master',
    'Quality Control',
    'Supplier Management',
    'Store Management',
    'Packing Lists',
    'Daily Expenses',
    'Opening Balance',
    'Purchase Entries',
    'Purchase Order Management',
    'Category Master',
    'Store Stock',
    'Reports',
  ],
  biller: [
    'Dashboard',
    'Customer Master',
    'Store Management',
    'Store Stock',
    'Daily Expenses',
    'Opening Balance',
    'Sales Invoice',
    'Reports',
  ],
  store: [
    'Dashboard',
    'Store Management',
    'Store Stock',
    'Packing Lists'
  ]
};

// Utility function to check if a user has access to a module
export const hasModuleAccess = (userRole: string, module: ModuleKey): boolean => {
  const normalizedRole = userRole.toLowerCase() as UserRole;
  
  // Superadmin has access to everything
  if (normalizedRole === 'superadmin') {
    return true;
  }
  
  // Check if the role exists and has access to the module
  const allowedModules = ROLE_MODULE_ACCESS[normalizedRole];
  return allowedModules ? allowedModules.includes(module) : false;
};

// Get all modules accessible by a role
export const getAccessibleModules = (userRole: string): ModuleKey[] => {
  const normalizedRole = userRole.toLowerCase() as UserRole;
  return ROLE_MODULE_ACCESS[normalizedRole] || [];
};