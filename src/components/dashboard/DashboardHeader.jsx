import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Loader2 } from 'lucide-react';

export const DashboardHeader = ({ onRefresh, loading, lastUpdated }) => {
  const formatDate = (date) => {
    if (!date) return 'Never';
    if (date instanceof Date) {
      return date.toLocaleString();
    }
    try {
      return new Date(date).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
      <div className="flex items-center gap-4">
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          size="sm"
          disabled={loading}
          className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          Last updated: {formatDate(lastUpdated)}
        </div>
      </div>
    </div>
  );
};