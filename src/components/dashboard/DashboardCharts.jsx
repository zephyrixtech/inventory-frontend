import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';

export const DashboardCharts = ({ itemStockData, salesData, purchaseEntryData, currencySymbol }) => {
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

  // Transform item stock data to match chart expectations
  const transformedItemStockData = itemStockData.map(item => ({
    name: item.name,
    count: item.stock, // Backend returns "stock", frontend chart expects "count"
    fill: item.fill
  }));

  // Transform sales data to match chart expectations
  const transformedSalesData = salesData.map(item => ({
    day: item.day,
    sales: item.sales
  }));

  // Transform purchase entry data to match chart expectations
  const transformedPurchaseEntryData = purchaseEntryData ? purchaseEntryData.map(item => ({
    day: item.day,
    purchases: item.purchases
  })) : [];

  // Get chart title based on user role
  const getChartTitle = () => {
    switch (userRole) {
      case 'purchaser':
        return 'Stock by Item (Store Stock)'; // Changed from Purchase Inventory to Store Stock
      case 'biller':
        return 'Stock by Item (Store Stock)';
      default:
        return 'Stock by Item (Combined)';
    }
  };

  // Role-based visibility for charts
  const shouldShowSalesChart = userRole !== 'purchaser'; // Hide sales chart for purchaser
  const shouldShowPurchaseEntryChart = userRole === 'purchaser' || userRole === 'admin' || userRole === 'superadmin'; // Show for purchaser, admin, superadmin

  // Calculate grid layout based on visible charts
  const getGridLayout = () => {
    if (userRole === 'purchaser') {
      // Purchaser: Stock + Purchase Entry (2 charts)
      return 'md:grid-cols-2';
    } else if (userRole === 'biller') {
      // Biller: Stock + Sales (2 charts)
      return 'md:grid-cols-2';
    } else {
      // Admin/SuperAdmin: Stock + Sales + Purchase Entry (3 charts)
      return 'md:grid-cols-3';
    }
  };

  return (
    <div className={`grid gap-6 ${getGridLayout()}`}>
      {/* Stock by Item Bar Chart */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle>{getChartTitle()}</CardTitle>
          <p className="text-sm text-gray-500">Top 10 Items by Stock Count</p>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            {transformedItemStockData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transformedItemStockData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis
                    label={{
                      value: 'Stock Count',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#374151', fontSize: 14, fontWeight: 500 }
                    }}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => [value, 'Stock Count']}
                    labelFormatter={(label) => `Item: ${label}`}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No stock data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Turnover Line Chart - Hidden for purchaser role */}
      {shouldShowSalesChart && (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Sales Turnover</CardTitle>
            <p className="text-sm text-gray-500">Last Month</p>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {transformedSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transformedSalesData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      label={{
                        value: 'Day of Month',
                        position: 'insideBottom',
                        offset: -10,
                        style: { textAnchor: 'middle', fill: '#374151', fontSize: 14, fontWeight: 500 }
                      }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                      label={{
                        value: `Sales (AED)`,
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#374151', fontSize: 14, fontWeight: 500 }
                      }}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip
                      labelFormatter={(iso) => {
                        try {
                          const d = new Date(iso);
                          return d.toLocaleDateString();
                        } catch (e) {
                          return iso;
                        }
                      }}
                      formatter={(value) => [`AED ${value}`, 'Sales']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No sales data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Entry Turnover Line Chart - Show for purchaser, admin, superadmin */}
      {shouldShowPurchaseEntryChart && (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Purchase Entry Turnover</CardTitle>
            <p className="text-sm text-gray-500">Last Month</p>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {transformedPurchaseEntryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transformedPurchaseEntryData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      label={{
                        value: 'Day of Month',
                        position: 'insideBottom',
                        offset: -10,
                        style: { textAnchor: 'middle', fill: '#374151', fontSize: 14, fontWeight: 500 }
                      }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                      label={{
                        value: `Purchases (INR)`,
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#374151', fontSize: 14, fontWeight: 500 }
                      }}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip
                      labelFormatter={(iso) => {
                        try {
                          const d = new Date(iso);
                          return d.toLocaleDateString();
                        } catch (e) {
                          return iso;
                        }
                      }}
                      formatter={(value) => [`AED ${value}`, 'Purchases']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="purchases"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No purchase entry data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};