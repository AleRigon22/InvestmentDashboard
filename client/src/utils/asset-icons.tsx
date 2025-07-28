import { TrendingUp, PieChart, Coins, DollarSign, Wallet } from "lucide-react";

export const getAssetIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'stocks':
    case 'stock':
      return { icon: TrendingUp, color: 'bg-blue-100 text-blue-600' };
    case 'etf':
      return { icon: PieChart, color: 'bg-green-100 text-green-600' };
    case 'crypto':
      return { icon: Coins, color: 'bg-orange-100 text-orange-600' };
    case 'bonds':
    case 'fund':
      return { icon: DollarSign, color: 'bg-purple-100 text-purple-600' };
    default:
      return { icon: Wallet, color: 'bg-gray-100 text-gray-600' };
  }
};

export const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'stocks':
    case 'stock':
      return 'text-blue-600';
    case 'etf':
      return 'text-green-600';
    case 'crypto':
      return 'text-orange-600';
    case 'bonds':
    case 'fund':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
};

export const getCategoryChartColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'stocks':
    case 'stock':
      return '#2563eb'; // blue-600
    case 'etf':
      return '#16a34a'; // green-600
    case 'crypto':
      return '#ea580c'; // orange-600
    case 'bonds':
    case 'fund':
      return '#9333ea'; // purple-600
    default:
      return '#4b5563'; // gray-600
  }
};

// Standardized category colors for consistency
export const CATEGORY_COLORS = {
  stocks: '#3B82F6',    // blue-500
  stock: '#3B82F6',     // blue-500 (singular form from backend)
  etf: '#22C55E',       // green-500  
  crypto: '#F97316',    // orange-500
  bonds: '#8B5CF6',     // purple-500
  bond: '#8B5CF6',      // purple-500 (singular form from backend) 
  deposits: '#6b7280',  // gray-500
};

// Chart color palette for consistent visualization  
export const CHART_COLORS = [
  '#3B82F6', // blue-500 - stocks
  '#22C55E', // green-500 - etfs
  '#F97316', // orange-500 - crypto
  '#8B5CF6', // purple-500 - bonds/funds
  '#6b7280', // gray-500 - deposits
  '#06b6d4', // cyan-500
  '#ef4444', // red-500
  '#f59e0b', // amber-500
];