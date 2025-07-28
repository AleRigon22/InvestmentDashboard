import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PortfolioChartProps {
  data?: any;
}

export default function PortfolioChart({ data }: PortfolioChartProps) {
  // For now, return a simple chart showing current portfolio value vs invested
  const chartData = data ? [
    { 
      month: 'Current', 
      portfolioValue: data.totalValue || 0, 
      totalInvested: data.totalInvested || 0 
    }
  ] : [];
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            formatter={(value: any, name: string) => [
              `$${Number(value).toLocaleString()}`,
              name === 'portfolioValue' ? 'Portfolio Value' : 'Total Invested'
            ]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="portfolioValue" 
            stroke="hsl(207, 90%, 54%)" 
            strokeWidth={2}
            name="Portfolio Value"
            dot={{ fill: "hsl(207, 90%, 54%)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "hsl(207, 90%, 54%)" }}
          />
          <Line 
            type="monotone" 
            dataKey="deposits" 
            stroke="hsl(142, 76%, 36%)" 
            strokeWidth={2}
            name="Cumulative Deposits"
            dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "hsl(142, 76%, 36%)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
