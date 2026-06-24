import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Login } from '@/pages/auth/login';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { InventoryDashboard } from '@/pages/dashboard/inventory-dashboard';
import { UsersManagement } from '@/pages/user/list/users';
import { UserForm } from '@/pages/user/config/user-form';
import { Inventory } from '@/pages/inventory/list/inventory';
import { ItemConfigurator } from '@/pages/management/itemManagement/config/item-configurator';
import WarehouseManagement from '@/pages/management/WarehouseManagement';
import Notifications from '@/pages/Notifications/notifications';
import UserProfile from '@/pages/Profile/user-profile';
import SalesInvoiceList from '@/pages/invocie/list/InvoiceManagement';
import InvoiceView from '@/pages/invocie/config/InvoiceView';
import InvoiceEdit from '@/pages/invocie/config/InvoiceEdit';
import Reports from '@/pages/Reports/Reports';
import ItemManagement from '@/pages/management/itemManagement/list/ItemManagement';
import SupplierManagement from '@/pages/management/supplierManagement/list/SupplierManagement';
import ItemConfigForm from '@/pages/management/itemManagement/config/ItemConfigForm';
import AddStoreForm from '@/pages/management/storeManagement/config/AddStoreForm';
import SupplierForm from '@/pages/management/supplierManagement/config/SupplierForm';
import { StoreManagement } from '@/pages/management/storeManagement/list/StoreManagement';
import InventoryForm from '@/pages/inventory/config/inventory-form';
import PrintPreview from '@/pages/Reports/PrintPreview';
import CompanyAdministration from '@/pages/administration/CompanyAdministration';
import NotificationForm from '@/pages/Notifications/config/NotificationForm';
import { CategoryManagement } from '@/pages/category/list/CategoryManagement';
import CategoryForm from '@/pages/category/config/CategoryForm';
import AuditTrial from '@/pages/Audit/auditTrial';
import CustomerForm from '@/pages/customer/config/CustomerForm';
import { CustomerManagement } from '@/pages/customer/list/CustomerManagement';
import CustomerView from '@/pages/customer/config/CustomerView';
import NotFoundPage from '@/pages/alert/NotFoundPage';
import AuthRedirectPage from '@/pages/auth/authRedirect';
import CurrencyRatesPage from '@/pages/administration/CurrencyRatesPage';
import QualityControlPage from '@/pages/purchaser/QC';
import { PackingListsPage } from '@/pages/purchaser/PackingLists';
import { PackingListView } from '@/pages/purchaser/PackingListView';
import { DailyExpensesPage } from "@/pages/purchaser/DailyExpenses";
import { OpeningBalancePage } from "@/pages/purchaser/OpeningBalance";
import { StoreStockPage } from "@/pages/store/StoreStock";
import { StockTransferPage } from "@/pages/store/StockTransfer";
import ProductTransmissionPage from '@/pages/administration/ProductTransmissionPage';
import PurchaseEntries from '@/pages/purchaser/PurchaseEntries';
import PurchaseEntryForm from '@/pages/purchaser/PurchaseEntryForm';
// import InventoryManagement from '@/pages/management/inventoryManagement/list/InventoryManagement';
// import InventoryItemForm from '@/pages/management/inventoryManagement/config/InventoryItemForm';


const protectedRoutes = [
  { path: '', element: <InventoryDashboard />, module: 'Dashboard' },
  { path: 'users', element: <UsersManagement />, module: 'Users' },
  { path: 'users/add', element: <UserForm />, module: 'Users' },
  { path: 'users/edit/:id', element: <UserForm />, module: 'Users' },
  { path: 'item-master', element: <Inventory />, module: 'Item Master' },
  { path: 'item-master/add', element: <InventoryForm />, module: 'Item Master' },
  { path: 'item-master/edit/:id', element: <InventoryForm />, module: 'Item Master' },
  { path: 'item-master/view/:id', element: <InventoryForm />, module: 'Item Master' },
  { path: 'supplierManagement', element: <SupplierManagement />, module: 'Supplier Management' },
  { path: 'supplier/add', element: <SupplierForm />, module: 'Supplier Management' },
  { path: 'supplier/edit/:id', element: <SupplierForm />, module: 'Supplier Management' },
  { path: 'supplier/view/:id', element: <SupplierForm />, module: 'Supplier Management' },
  { path: 'itemConfigurator', element: <ItemConfigurator />, module: 'Item Configurator' },
  { path: 'itemConfig/add', element: <ItemConfigForm />, module: 'Item Configurator' },
  { path: 'itemConfig/edit/:id', element: <ItemConfigForm />, module: 'Item Configurator' },
  { path: 'storeManagement', element: <StoreManagement />, module: 'Store Management' },
  { path: 'store/add', element: <AddStoreForm />, module: 'Store Management' },
  { path: 'store/edit/:id', element: <AddStoreForm />, module: 'Store Management' },
  { path: 'store/stock', element: <StoreStockPage />, module: 'Store Stock' },
  { path: 'store/transfer', element: <StockTransferPage />, module: 'Stock Transfer' },
  { path: 'customer-management', element: <CustomerManagement />, module: 'Customer Master' },
  { path: 'customer-management/add', element: <CustomerForm />, module: 'Customer Master' },
  { path: 'customer-management/edit/:id', element: <CustomerForm />, module: 'Customer Master' },
  { path: 'customer-management/view/:id', element: <CustomerView />, module: 'Customer Master' },
  { path: 'purchaser/qc', element: <QualityControlPage />, module: 'Quality Control' },
  { path: 'purchaser/packing-lists', element: <PackingListsPage />, module: 'Packing Lists' },
  { path: 'purchaser/packing-lists/view/:id', element: <PackingListView />, module: 'Packing Lists' },
  { path: 'purchaser/expenses', element: <DailyExpensesPage />, module: 'Daily Expenses' },
  { path: 'purchaser/opening-balance', element: <OpeningBalancePage />, module: 'Opening Balance' },
  { path: 'purchase-entries', element: <PurchaseEntries />, module: 'Purchase Entries' },
  { path: 'purchase-entries/add', element: <PurchaseEntryForm />, module: 'Purchase Entries' },
  { path: 'purchase-entries/edit/:id', element: <PurchaseEntryForm />, module: 'Purchase Entries' },
  { path: 'purchase-entries/view/:id', element: <PurchaseEntryForm />, module: 'Purchase Entries' },
  { path: 'administration', element: <CompanyAdministration />, module: 'Administration' },
  { path: 'administration/currency', element: <CurrencyRatesPage />, module: 'Administration' },
  { path: 'category-master', element: <CategoryManagement />, module: 'Category Master' },
  { path: 'category-master/add', element: <CategoryForm />, module: 'Category Master' },
  { path: 'category-master/edit/:id', element: <CategoryForm />, module: 'Category Master' },
  { path: 'audit-trial', element: <AuditTrial />, module: 'Audit Trail' },
  { path: 'administration/product-transmission', element: <ProductTransmissionPage />, module: 'Product Transmission' },
  { path: 'reports', element: <Reports /> },
  { path: 'print-preview/:id', element: <PrintPreview /> },
  { path: 'print-preview', element: <PrintPreview /> },
  { path: 'report/preview', element: <PrintPreview />, module: 'Reports' },
  { path: 'stock', element: <StoreStockPage /> },
  { path: 'stock-transfer', element: <StockTransferPage /> },
  { path: 'transfer', element: <StockTransferPage /> },
  { path: 'qc', element: <QualityControlPage /> },
  { path: 'qc/add', element: <QualityControlPage /> },
  { path: 'qc/edit/:id', element: <QualityControlPage /> },
  { path: 'qc/view/:id', element: <QualityControlPage /> },
  { path: 'warehouseManagement', element: <WarehouseManagement />, module: 'Inventory Management' },
  { path: 'items', element: <ItemManagement />, module: 'Item Master' },
  { path: 'invoice', element: <SalesInvoiceList />, module: 'Sales Invoice' },
  { path: 'invoice/view/:id', element: <InvoiceView />, module: 'Sales Invoice' },
  { path: 'invoice/edit/:id', element: <InvoiceEdit />, module: 'Sales Invoice' },
  { path: 'invoice/add', element: <InvoiceEdit />, module: 'Sales Invoice' },
  // { path: 'inventoryManagement', element: <InventoryManagement />, module: 'Inventory Management' },
  // { path: 'inventory/add', element: <InventoryItemForm />, module: 'Inventory Management' },
  // { path: 'inventory/edit/:id', element: <InventoryItemForm />, module: 'Inventory Management' },
  { path: 'administration', element: <CompanyAdministration />, module: 'Administration' },
  { path: 'administration/currency', element: <CurrencyRatesPage />, module: 'Administration' },
  { path: 'category-master', element: <CategoryManagement />, module: 'Category Master' },
  { path: 'category-master/add', element: <CategoryForm />, module: 'Category Master' },
  { path: 'category-master/edit/:id', element: <CategoryForm />, module: 'Category Master' },
  { path: 'audit-trial', element: <AuditTrial />, module: 'Audit Trail' },

];

const unprotectedRoutes = [
  { path: 'notifications', element: <Notifications /> },
  { path: 'notifications/create', element: <NotificationForm /> },
  { path: 'userProfile', element: <UserProfile /> },
  { path: 'auth-redirect', element: <AuthRedirectPage /> }
];

export const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      ...protectedRoutes.map(route => ({
        path: route.path,
        element: <ProtectedRoute module={route.module} />,
        children: [{ index: true, element: route.element }],
      })),
      ...unprotectedRoutes.map(route => ({
        path: route.path,
        element: route.element,
      })),
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
