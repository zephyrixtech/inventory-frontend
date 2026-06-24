// Export ModuleKey here to avoid circular imports. This is the canonical list
// of module keys used across the app.
export type ModuleKey =
  | 'Dashboard'
  | 'Supplier Management'
  | 'Store Management'
  | 'Store Stock'
  | 'Stock Transfer'
  | 'Purchase Order Management'
  | 'Inventory Management'
  | 'Sales Invoice'
  | 'Reports'
  | 'Purchase Order Approvals'
  | 'Returns Management'
  | 'Returns Eligible'
  | 'Category Master'
  | 'Customer Master'
  | 'Item Configurator'
  | 'Item Master'
  | 'Workflow Configuration'
  | 'Audit Trail'
  | 'Users'
  | 'Administration'
  | 'Role Management'
  | 'Purchase Return Requests'
  | 'Product Transmission'
  | 'Daily Expenses'
  | 'Opening Balance'
  | 'Quality Control'
  | 'Packing Lists'
  | 'All Modules';

export const ALL_MODULES: ModuleKey[] = [
  'Dashboard',
  'Supplier Management',
  'Store Management',
  'Store Stock',
  'Stock Transfer',
  'Purchase Order Management',
  'Inventory Management',
  'Sales Invoice',
  'Reports',
  'Purchase Order Approvals',
  'Returns Management',
  'Returns Eligible',
  'Category Master',
  'Customer Master',
  'Item Configurator',
  'Item Master',
  'Workflow Configuration',
  'Audit Trail',
  'Users',
  'Role Management',
  'Administration',
  'Purchase Return Requests',
  'Product Transmission',
  'Daily Expenses',
  'Opening Balance',
  'Quality Control',
  'Packing Lists',
  'All Modules',
];

export interface UserPermissions {
  roleId: string;
  permissions: Record<ModuleKey, boolean>;
}
