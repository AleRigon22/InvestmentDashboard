import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Wallet, TrendingUp, Plus, ArrowUp, ArrowDown, ChartLine, Coins, Edit, Save, DollarSign, PiggyBank, Target, Users, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import AllocationChart from "@/components/charts/allocation-chart";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PortfolioSnapshotModal } from "@/components/modals/PortfolioSnapshotModal";
import { CATEGORY_COLORS } from "@/utils/asset-icons";
import { categoryDisplayNames } from "@shared/schema";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("Max");
  
  const currentPortfolioName = user?.portfolioName || `Portafoglio di ${user?.username || 'User'}`;
  
  const updatePortfolioMutation = useMutation({
    mutationFn: (portfolioName: string) => apiRequest("PUT", "/api/auth/portfolio-name", { portfolioName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Portfolio name updated successfully!" });
      setIsEditingTitle(false);
    },
    onError: () => {
      toast({ title: "Failed to update portfolio name", variant: "destructive" });
    },
  });

  const { data: portfolioOverview, isLoading } = useQuery<{
    totalValue: number;
    totalInvested: number;
    totalPL: number;
    totalPLPercent: number;
    ytdDividends: number;
    holdings: Array<{
      asset: any;
      quantity: number;
      avgPrice: number;
      currentPrice: number;
      marketValue: number;
      unrealizedPL: number;
      unrealizedPLPercent: number;
    }>;
    allocationByCategory: Array<{ category: string; value: number; percentage: number }>;
  }>({
    queryKey: ["/api/portfolio/overview"],
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  const { data: snapshots } = useQuery<Array<{
    id: number;
    month: number;
    year: number;
    totalValue: string;
    totalInvested: string;
    totalPL: string;
    totalPLPercent: string;
    stocksValue?: string;
    etfValue?: string;
    cryptoValue?: string;
    bondsValue?: string;
  }>>({
    queryKey: ["/api/portfolio/snapshots"],
    enabled: !!user,
  });

  const { data: closedPositions } = useQuery<Array<{
    asset: any;
    totalBought: number;
    totalSold: number;
    avgBuyPrice: number;
    avgSellPrice: number;
    realizedPL: number;
    realizedPLPercent: number;
    holdingPeriod: number;
    firstBuyDate: string;
    lastSellDate: string;
    cycleId: string;
  }>>({
    queryKey: ["/api/portfolio/closed-positions"],
    enabled: !!user,
  });

  const { data: dividendsSummary } = useQuery<{
    ytd: number;
    thisMonth: number;
    avgMonthly: number;
  }>({
    queryKey: ["/api/dividends/summary"],
    enabled: !!user,
  });

  const { data: cashMovements } = useQuery<Array<{
    id: number;
    type: 'deposit' | 'withdrawal';
    amount: string;
    date: string;
    description?: string;
  }>>({
    queryKey: ["/api/cash-movements"],
    enabled: !!user,
  });

  const recentTransactions = Array.isArray(transactions) ? transactions.slice(0, 3) : [];

  // Calculate enhanced metrics
  const unrealizedPL = portfolioOverview?.holdings?.reduce((sum, holding) => sum + holding.unrealizedPL, 0) || 0;
  const realizedPL = closedPositions?.reduce((sum, position) => sum + position.realizedPL, 0) || 0;
  const totalPL = unrealizedPL + realizedPL;
  
  // Calculate total deposited from cash movements
  const totalDeposited = cashMovements?.reduce((sum, movement) => {
    return movement.type === 'deposit' ? sum + Number(movement.amount) : sum - Number(movement.amount);
  }, 0) || 0;
  
  // Calculate total fees from transactions
  const totalFees = Array.isArray(transactions) ? transactions.reduce((sum: number, t: any) => sum + Number(t.fees || 0), 0) : 0;
  
  // Net Worth calculation (Portfolio Value + Available Cash - for now just portfolio value)
  const netWorth = (portfolioOverview?.totalValue || 0);
  
  // Performance analysis
  const holdings = portfolioOverview?.holdings || [];
  const assetsUp = holdings.filter(h => h.unrealizedPL > 0).length;
  const assetsDown = holdings.filter(h => h.unrealizedPL < 0).length;
  
  // Top and bottom performers
  const sortedByPL = [...holdings].sort((a, b) => b.unrealizedPL - a.unrealizedPL);
  const topPerformers = sortedByPL.slice(0, 2);
  const bottomPerformers = sortedByPL.slice(-2).reverse();

  // Prepare donut chart data - Fixed color mapping
  const assetTypeAllocation = portfolioOverview?.allocationByCategory?.map(cat => {
    const colorKey = cat.category as keyof typeof CATEGORY_COLORS;
    const assignedColor = CATEGORY_COLORS[colorKey];
    
    return {
      name: categoryDisplayNames[cat.category as keyof typeof categoryDisplayNames] || cat.category,
      value: cat.value,
      percentage: cat.percentage,
      color: assignedColor || '#6B7280'
    };
  }) || [];

  // Generate dynamic colors for individual assets
  const generateAssetColors = (assets: any[], baseColor: string) => {
    return assets.map((asset, index) => {
      // Convert base color to HSL and generate variations
      const hue = baseColor === CATEGORY_COLORS.stocks ? 220 : // Blue base
                  baseColor === CATEGORY_COLORS.etf ? 142 : // Green base  
                  baseColor === CATEGORY_COLORS.crypto ? 25 : // Orange base
                  baseColor === CATEGORY_COLORS.bonds ? 270 : // Purple base
                  200; // Default fallback
      
      // Generate different shades/tints for each asset
      const saturation = Math.max(40, 70 - (index * 8)); // Vary saturation
      const lightness = Math.max(35, Math.min(65, 50 + (index * 5))); // Vary lightness
      const adjustedHue = (hue + (index * 15)) % 360; // Slightly adjust hue for variety
      
      return `hsl(${adjustedHue}, ${saturation}%, ${lightness}%)`;
    });
  };

  // Stocks/ETFs/Bonds individual holdings with dynamic colors
  const stocksEtfsBonds = holdings.filter(h => 
    h.asset.category === 'stock' || h.asset.category === 'etf' || h.asset.category === 'bonds' || h.asset.category === 'bond'
  );
  const totalStocksEtfsBondsValue = stocksEtfsBonds.reduce((sum, h) => sum + h.marketValue, 0);
  const stocksEtfsBondsColors = generateAssetColors(stocksEtfsBonds, CATEGORY_COLORS.stocks);
  
  const stocksEtfsBondsData = stocksEtfsBonds.map((h, index) => ({
    name: h.asset.name,
    ticker: h.asset.ticker,
    value: h.marketValue,
    percentage: totalStocksEtfsBondsValue > 0 ? (h.marketValue / totalStocksEtfsBondsValue) * 100 : 0,
    color: stocksEtfsBondsColors[index]
  }));

  // Crypto individual holdings with dynamic colors
  const cryptoHoldings = holdings.filter(h => h.asset.category === 'crypto');
  const totalCryptoValue = cryptoHoldings.reduce((sum, h) => sum + h.marketValue, 0);
  const cryptoColors = generateAssetColors(cryptoHoldings, CATEGORY_COLORS.crypto);
  
  const cryptoData = cryptoHoldings.map((h, index) => ({
    name: h.asset.name,
    ticker: h.asset.ticker,
    value: h.marketValue,
    percentage: totalCryptoValue > 0 ? (h.marketValue / totalCryptoValue) * 100 : 0,
    color: cryptoColors[index]
  }));

  // Process snapshots into chart data (same as History page)
  // Filter snapshots by time range
  const getFilteredSnapshots = () => {
    if (!snapshots || snapshots.length === 0) return [];
    
    const now = new Date();
    
    switch (timeRange) {
      case "3M": {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        threeMonthsAgo.setDate(1); // Start from first day of month
        return snapshots.filter(snapshot => {
          const snapshotDate = new Date(snapshot.year, snapshot.month - 1, 1);
          return snapshotDate >= threeMonthsAgo;
        });
      }
      case "6M": {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        sixMonthsAgo.setDate(1); // Start from first day of month
        return snapshots.filter(snapshot => {
          const snapshotDate = new Date(snapshot.year, snapshot.month - 1, 1);
          return snapshotDate >= sixMonthsAgo;
        });
      }
      case "YTD": {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return snapshots.filter(snapshot => {
          const snapshotDate = new Date(snapshot.year, snapshot.month - 1, 1);
          return snapshotDate >= yearStart;
        });
      }
      case "Max":
      default:
        return snapshots;
    }
  };

  const chartData = getFilteredSnapshots().map(snapshot => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return {
      period: `${monthNames[snapshot.month - 1]} ${snapshot.year}`,
      totalValue: parseFloat(snapshot.totalValue),
      totalInvested: parseFloat(snapshot.totalInvested),
      stocksValue: parseFloat(snapshot.stocksValue || '0'),
      etfValue: parseFloat(snapshot.etfValue || '0'),
      cryptoValue: parseFloat(snapshot.cryptoValue || '0'),
      bondsValue: parseFloat(snapshot.bondsValue || '0'),
    };
  }).reverse();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="rounded-lg w-10 h-10 flex items-center justify-center" style={{backgroundColor: '#3B82F6'}}>
              <ChartLine className="text-white" size={20} />
            </div>
            <div>
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={portfolioTitle}
                    onChange={(e) => setPortfolioTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        updatePortfolioMutation.mutate(portfolioTitle);
                      }
                    }}
                    onBlur={() => {
                      if (portfolioTitle.trim()) {
                        updatePortfolioMutation.mutate(portfolioTitle);
                      } else {
                        setIsEditingTitle(false);
                      }
                    }}
                    className="font-bold text-lg"
                    autoFocus
                  />
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setIsEditingTitle(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="font-bold text-lg text-gray-900">{currentPortfolioName}</h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPortfolioTitle(currentPortfolioName);
                      setIsEditingTitle(true);
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Edit size={14} />
                  </Button>
                </div>
              )}
              <p className="text-sm text-gray-600">Welcome back, {user?.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {portfolioOverview && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsSnapshotModalOpen(true)}
                className="text-primary border-primary hover:bg-primary hover:text-white"
              >
                <Save size={16} className="mr-2" />
                Save Snapshot
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-600 hover:text-gray-900">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <TooltipProvider>
          {/* KPI Cards - Row 1: Total Value, Cost Basis, Total Dividends */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Total Value */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-gray-400 ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Current market value of your open positions</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="bg-primary-50 rounded-full p-3">
                    <Wallet className="text-primary h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  €{(portfolioOverview?.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-sm text-gray-500 mt-3 block">Current market value</span>
              </CardContent>
            </Card>

            {/* Cost Basis */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-600">Cost Basis</p>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-gray-400 ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Total capital invested in active holdings</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="bg-blue-50 rounded-full p-3">
                    <PiggyBank className="text-blue-600 h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  €{(portfolioOverview?.totalInvested || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-sm text-gray-500 mt-3 block">Total invested amount</span>
              </CardContent>
            </Card>

            {/* Total Dividends */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-600">Total Dividends</p>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-gray-400 ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Sum of all dividends received</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="bg-green-50 rounded-full p-3">
                    <Coins className="text-green-600 h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{(dividendsSummary?.ytd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-sm text-gray-500 mt-3 block">Dividends received</span>
              </CardContent>
            </Card>
          </div>

          {/* KPI Cards - Row 2: Total P&L, Realized P&L, Unrealized P&L */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Total P&L */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-600">Total P&L</p>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-gray-400 ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Realized + Unrealized P&L – Fees + Dividends</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className={`rounded-full p-3 ${totalPL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <TrendingUp className={`h-5 w-5 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold mt-2 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPL >= 0 ? '+' : '–'}€{Math.abs(totalPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="mt-3">
                  <span className={`text-sm font-medium ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(portfolioOverview?.totalPLPercent || 0) >= 0 ? '+' : ''}{(portfolioOverview?.totalPLPercent || 0).toFixed(2)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-2">return</span>
                </div>
              </CardContent>
            </Card>

            {/* Realized P&L */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-600">Realized P&L</p>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-gray-400 ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Profit from assets you sold</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className={`rounded-full p-3 ${realizedPL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <Target className={`h-5 w-5 ${realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold mt-2 ${realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {realizedPL >= 0 ? '+' : '–'}€{Math.abs(realizedPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-sm text-gray-500 mt-3 block">From sell transactions</span>
              </CardContent>
            </Card>

            {/* Unrealized P&L */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-600">Unrealized P&L</p>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-gray-400 ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Gain/loss from current open positions</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className={`rounded-full p-3 ${unrealizedPL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <TrendingUp className={`h-5 w-5 ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold mt-2 ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {unrealizedPL >= 0 ? '+' : '–'}€{Math.abs(unrealizedPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-sm text-gray-500 mt-3 block">Open positions</span>
              </CardContent>
            </Card>
          </div>
        </TooltipProvider>

        {/* Portfolio Performance Chart - Full Width */}
        <Card className="shadow-sm border border-gray-200 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
              <div className="flex items-center space-x-3">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="mr-2"
                    defaultChecked={true}
                    onChange={(e) => {
                      // This could control whether to show only active holdings
                      // For now, we'll implement the basic functionality
                    }}
                  />
                  Active Holdings Only
                </label>
                <select 
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary" 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="3M">3M</option>
                  <option value="6M">6M</option>
                  <option value="YTD">YTD</option>
                  <option value="Max">Max</option>
                </select>
              </div>
            </div>
            {chartData && chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="period" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      domain={chartData.length > 0 ? [0, 'dataMax'] : [0, 100]}
                      tickFormatter={(value) => value >= 1000 ? `€${(value / 1000).toFixed(0)}k` : `€${value}`}
                    />
                    <ChartTooltip 
                      formatter={(value: any, name: string) => [
                        `€${Number(value).toLocaleString()}`,
                        name
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
                      dataKey="stocksValue" 
                      stroke={CATEGORY_COLORS.stocks} 
                      strokeWidth={2}
                      name={categoryDisplayNames.stocks}
                      dot={{ fill: CATEGORY_COLORS.stocks, strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="etfValue" 
                      stroke={CATEGORY_COLORS.etf} 
                      strokeWidth={2}
                      name={categoryDisplayNames.etf}
                      dot={{ fill: CATEGORY_COLORS.etf, strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cryptoValue" 
                      stroke={CATEGORY_COLORS.crypto} 
                      strokeWidth={2}
                      name={categoryDisplayNames.crypto}
                      dot={{ fill: CATEGORY_COLORS.crypto, strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bondsValue" 
                      stroke={CATEGORY_COLORS.bonds} 
                      strokeWidth={2}
                      name={categoryDisplayNames.bonds}
                      dot={{ fill: CATEGORY_COLORS.bonds, strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalValue" 
                      stroke="#1f2937" 
                      strokeWidth={3}
                      name="Total Portfolio"
                      dot={{ fill: '#1f2937', strokeWidth: 2, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ChartLine className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No historical data available</p>
                  <p className="text-sm mt-2">Save snapshots to see performance over time</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Asset Allocation */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h3>
              {assetTypeAllocation.length > 0 ? (
                <div className="relative">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assetTypeAllocation}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {assetTypeAllocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip formatter={(value: any) => [`€${Number(value).toLocaleString()}`, 'Value']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Total Portfolio</p>
                      <p className="text-lg font-bold text-gray-900">€{(portfolioOverview?.totalValue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No data available</p>
                </div>
              )}
              <div className="mt-4 space-y-2">
                {assetTypeAllocation.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stocks/ETFs/Bonds Allocation */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stocks / ETFs / Bonds Allocation</h3>
              {stocksEtfsBondsData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stocksEtfsBondsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stocksEtfsBondsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value: any) => [`€${Number(value).toLocaleString()}`, 'Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No stocks, ETFs, or bonds held</p>
                </div>
              )}
              <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                {stocksEtfsBondsData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-700">{item.ticker}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Crypto Allocation */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Crypto Allocation</h3>
              {cryptoData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cryptoData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {cryptoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value: any) => [`€${Number(value).toLocaleString()}`, 'Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No crypto assets held</p>
                </div>
              )}
              <div className="mt-4 space-y-2">
                {cryptoData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-700">{item.ticker}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analysis Section */}
        {holdings.length > 0 && (
          <Card className="shadow-sm border border-gray-200 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top & Bottom Performers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div>
                  <h4 className="text-md font-medium text-green-600 mb-3 flex items-center">
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Top Performers
                  </h4>
                  <div className="space-y-3">
                    {topPerformers.map((holding, index) => (
                      <div key={holding.asset.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 rounded-full px-2 py-1 text-xs font-bold text-green-700">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{holding.asset.name}</p>
                            <p className="text-sm text-gray-600">{holding.asset.ticker}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +€{holding.unrealizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-green-600">
                            +{holding.unrealizedPLPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))}
                    {topPerformers.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No profitable assets yet</p>
                    )}
                  </div>
                </div>

                {/* Bottom Performers */}
                <div>
                  <h4 className="text-md font-medium text-red-600 mb-3 flex items-center">
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Bottom Performers
                  </h4>
                  <div className="space-y-3">
                    {bottomPerformers.map((holding, index) => (
                      <div key={holding.asset.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-100 rounded-full px-2 py-1 text-xs font-bold text-red-700">
                            #{bottomPerformers.length - index}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{holding.asset.name}</p>
                            <p className="text-sm text-gray-600">{holding.asset.ticker}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            –€{Math.abs(holding.unrealizedPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-red-600">
                            {holding.unrealizedPLPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))}
                    {bottomPerformers.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No losing assets yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Recent Transactions */}
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary-700 font-medium"
                onClick={() => setLocation('/transactions')}
              >
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transactions yet</p>
              ) : (
                recentTransactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-4">
                      <div className={`rounded-full p-2 ${
                        transaction.type === "buy" ? "bg-green-50" : "bg-red-50"
                      }`}>
                        {transaction.type === "buy" ? (
                          <Plus className="text-green-600 h-4 w-4" />
                        ) : (
                          <ArrowDown className="text-red-600 h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.asset?.name}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.type} • {transaction.quantity} shares • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${(Number(transaction.quantity) * Number(transaction.unitPrice)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-600">@${Number(transaction.unitPrice).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Portfolio Snapshot Modal */}
      {portfolioOverview && (
        <PortfolioSnapshotModal
          isOpen={isSnapshotModalOpen}
          onClose={() => setIsSnapshotModalOpen(false)}
          portfolioData={{
            totalValue: portfolioOverview.totalValue,
            totalInvested: portfolioOverview.totalInvested,
            totalPL: portfolioOverview.totalPL,
            totalPLPercent: portfolioOverview.totalPLPercent,
          }}
        />
      )}
    </div>
  );
}
