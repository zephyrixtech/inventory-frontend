import { Card, CardContent } from '@/components/ui/card';
import { Package, FileText } from 'lucide-react'; // Changed icon from FileCheck to FileText

export const DashboardMetrics = ({ metrics, currencySymbol }) => {
  // Get user role from localStorage
  const getUserRole = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (typeof userData.role === 'string') {
        return userData.role.toLowerCase();
      } else if (userData.role && typeof userData.role === 'object') {
        return (userData.role.name || userData.role.role_name || 'biller').toLowerCase();
      } else if (userData.role_name) {
        return userData.role_name.toLowerCase();
      }
      return 'biller'; // default fallback
    } catch (err) {
      console.error('Error getting user role:', err);
      return 'biller';
    }
  };

  const userRole = getUserRole();
  
  // Role-based visibility logic
  const shouldShowInventoryCard = userRole !== 'biller'; // Hide for biller
  const shouldShowInvoicesCard = userRole !== 'purchaser'; // Hide for purchaser
  return (
    <div className={`grid gap-6 ${
      shouldShowInventoryCard && shouldShowInvoicesCard 
        ? 'md:grid-cols-2' 
        : 'md:grid-cols-1 max-w-md mx-auto'
    }`}>
      {/* Total Inventory Card - Hidden for biller role */}
      {shouldShowInventoryCard && (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="px-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="rounded-full bg-blue-100 p-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Inventory Overview</p>
                <p className="text-2xl font-bold text-gray-900">Total Items & Value</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.totalItems.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-green-600">₹{metrics.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Invoices Card - Hidden for purchaser role */}
      {shouldShowInvoicesCard && (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="px-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="rounded-full bg-orange-100 p-3">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Sales Invoices</p> {/* Changed from Purchase Orders */}
                <p className="text-2xl font-bold text-gray-900">Invoices & Value</p> {/* Updated text */}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Invoices</p> {/* Changed from Total Orders */}
                <p className="text-2xl font-bold text-orange-600">{metrics.totalSalesInvoices}</p> {/* Changed property */}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">AED {metrics.totalSalesInvoiceValue.toLocaleString()}</p> {/* Changed property */}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};