import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const DashboardAlerts = ({
  fastMovingItems,
  slowMovingItems,
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Fast Moving Items */}
      <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Fast Moving Items
          </CardTitle>
          <p className="text-sm text-gray-500">Top 5 items by stock quantity</p>
        </CardHeader>
        <CardContent className="flex-1 max-h-70">
          <div className="h-full flex flex-col bg-green-50 rounded-lg border border-green-200 overflow-y-auto scrollbar-thin">
            {fastMovingItems.length > 0 ? ([...fastMovingItems]
                .sort((a, b) => b.avgQuantity - a.avgQuantity)
                .map((item, index) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center p-3 border-b border-green-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 min-w-[2rem] items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-700">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right font-bold text-green-700">{item.avgQuantity} units</div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No fast moving items data available</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slow Moving Items */}
      <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Slow Moving Items
          </CardTitle>
          <p className="text-sm text-gray-500">Bottom 5 items by stock quantity</p>
        </CardHeader>
        <CardContent className="flex-1 max-h-70">
          <div className="h-full flex flex-col bg-red-50 rounded-lg border border-red-200 overflow-y-auto scrollbar-thin">
            {slowMovingItems.length > 0 ? (
              [...slowMovingItems]
                .sort((a, b) => a.avgQuantity - b.avgQuantity)
                .map((item, index) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center p-3 border-b border-red-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 min-w-[2rem] items-center justify-center rounded-full bg-red-100 text-sm font-medium text-red-700">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-700">{item.avgQuantity} units</div>
                    <div className="text-xs text-red-600">Low stock</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No slow moving items data available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

