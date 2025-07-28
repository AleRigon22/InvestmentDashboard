import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CATEGORY_COLORS, CHART_COLORS } from '@/utils/asset-icons';

interface DividendChartProps {
  dividends?: any[];
}

type ChartView = 'grouped' | 'flat';

// Legacy colors (kept for fallback)
const ASSET_COLORS = [
  '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981',
  '#f97316', '#ec4899', '#6366f1', '#84cc16', '#06b6d4'
];

export default function DividendChart({ dividends = [] }: DividendChartProps) {
  const [chartView, setChartView] = useState<ChartView>('grouped');

  // Process real dividend data by month and asset
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  // Get unique assets with consistent colors
  const uniqueAssets = Array.from(new Set(dividends.map((d: any) => d.asset?.name || 'Unknown')));
  
  // Generate colors for assets using asset category colors or fallback
  const getAssetColor = (assetName: string) => {
    const asset = dividends.find((d: any) => (d.asset?.name || 'Unknown') === assetName);
    const category = asset?.asset?.category?.toLowerCase();
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CHART_COLORS[uniqueAssets.indexOf(assetName) % CHART_COLORS.length];
  };
  
  // Always initialize chart data for all 12 months
  const chartData = monthNames.map(month => {
    const monthData: any = { month, total: 0 };
    uniqueAssets.forEach(asset => {
      monthData[asset] = 0;
    });
    return monthData;
  });
  
  // Populate with actual dividend data grouped by asset
  dividends.forEach((dividend: any) => {
    const paymentDate = new Date(dividend.paymentDate);
    if (paymentDate.getFullYear() === currentYear) {
      const monthIndex = paymentDate.getMonth();
      const assetName = dividend.asset?.name || 'Unknown';
      const amount = Number(dividend.amount);
      
      chartData[monthIndex][assetName] += amount;
      chartData[monthIndex].total += amount;
    }
  });

  // Enhanced custom tooltip with asset breakdown and color indicators
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthData = payload[0].payload;
      const totalForMonth = monthData.total;
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg min-w-48">
          <p className="font-semibold text-gray-900 mb-2">{label} {currentYear}</p>
          <p className="text-sm text-gray-600 mb-3 border-b pb-2">Total: €{totalForMonth.toFixed(2)}</p>
          {chartView === 'grouped' && uniqueAssets.map((asset) => {
            const amount = monthData[asset] || 0;
            if (amount > 0) {
              const percentage = totalForMonth > 0 ? (amount / totalForMonth * 100).toFixed(1) : '0';
              return (
                <div key={asset} className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: getAssetColor(asset) }}
                    />
                    <span className="text-gray-700">{asset}</span>
                  </div>
                  <span className="text-gray-900 font-medium">€{amount.toFixed(2)} ({percentage}%)</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  // Show empty state only if no dividends at all
  if (!dividends || dividends.length === 0) {
    return (
      <div>
        {/* Toggle Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button
              variant={chartView === 'grouped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartView('grouped')}
            >
              Grouped by Asset
            </Button>
            <Button
              variant={chartView === 'flat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartView('flat')}
            >
              Flat Monthly Total
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Coins className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm">No dividends recorded yet. Add your first dividend to see the monthly flow.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toggle Buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant={chartView === 'grouped' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartView('grouped')}
          >
            Grouped by Asset
          </Button>
          <Button
            variant={chartView === 'flat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartView('flat')}
          >
            Flat Monthly Total
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          Year: {currentYear}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `€${value.toFixed(0)}`} 
            />
            <Tooltip content={<CustomTooltip />} />
            
            {chartView === 'grouped' ? (
              // Stacked bars grouped by asset
              uniqueAssets.map((asset) => (
                <Bar
                  key={asset}
                  dataKey={asset}
                  stackId="dividends"
                  fill={getAssetColor(asset)}
                  name={asset}
                  radius={[2, 2, 0, 0]}
                />
              ))
            ) : (
              // Single bar showing total only
              <Bar
                dataKey="total"
                fill="#8B5CF6"
                name="Total Dividends"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
