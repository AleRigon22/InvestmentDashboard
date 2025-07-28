import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Target, 
  Wallet, 
  Calculator,
  Calendar,
  DollarSign,
  Save,
  X,
  InfoIcon,
  AlertTriangle,
  Percent,
  Euro,
  BarChart3,
  FileText,
  Tag
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { getAssetIcon, CATEGORY_COLORS } from "@/utils/asset-icons";
import { format, differenceInDays, parseISO } from "date-fns";
import EditAssetModal from "@/components/modals/edit-asset-modal";
import AddTransactionModal from "@/components/modals/add-transaction-modal";
import AddDividendModal from "@/components/modals/add-dividend-modal";

interface AssetDetail {
  id: number;
  name: string;
  ticker: string;
  category: string;
  sector?: string;
  region?: string;
  notes?: string;
}

interface AssetSnapshot {
  id: number;
  userId: number;
  assetId: number;
  date: string;
  quantity: string;
  averagePrice: string;
  currentPrice: string;
  totalCost: string;
  marketValue: string;
  unrealizedPL: string;
  unrealizedPLPercent: string;
}

interface Transaction {
  id: number;
  assetId: number;
  type: 'buy' | 'sell';
  quantity: number;
  unitPrice: number;
  fees: number;
  date: string;
  totalAmount: number;
}

interface Dividend {
  id: number;
  assetId: number;
  amount: number;
  paymentDate: string;
  notes?: string;
}

interface AssetPerformance {
  totalInvested: number;
  quantityHeld: number;
  marketValue: number;
  averagePrice: number;
  realizedPL: number;
  unrealizedPL: number;
  portfolioWeight: number;
  isActive: boolean;
  holdingDuration?: number;
  startDate?: string;
  endDate?: string;
}

export default function AssetDetail() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract asset ticker from URL
  const assetTicker = location.split('/asset/')[1]?.split('?')[0];
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const closedCycleId = urlParams.get('closed');
  const isClosedPosition = !!closedCycleId;
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const [strategyTag, setStrategyTag] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');
  const [showAllSnapshots, setShowAllSnapshots] = useState(false);
  const [editingSnapshotId, setEditingSnapshotId] = useState<number | null>(null);
  const [editingSnapshot, setEditingSnapshot] = useState<Partial<AssetSnapshot>>({});
  
  // Modal states
  const [showEditAssetModal, setShowEditAssetModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showAddDividendModal, setShowAddDividendModal] = useState(false);

  // Fetch asset details
  const { data: assets = [] } = useQuery<AssetDetail[]>({
    queryKey: ['/api/assets'],
    enabled: !!user
  });

  const asset = assets.find((a: AssetDetail) => a.ticker === assetTicker);

  // Fetch transactions for this asset
  const { data: allTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user
  });

  const assetTransactions = allTransactions.filter((t: Transaction) => t.assetId === asset?.id) || [];

  // Fetch dividends for this asset
  const { data: allDividends = [] } = useQuery<Dividend[]>({
    queryKey: ['/api/dividends'],
    enabled: !!user
  });

  const assetDividends = allDividends.filter((d: Dividend) => d.assetId === asset?.id) || [];

  // Fetch closed positions data if viewing a closed position
  const { data: closedPositions = [] } = useQuery<any[]>({
    queryKey: ['/api/portfolio/closed-positions'],
    enabled: !!user && isClosedPosition
  });

  const closedPositionData = closedPositions.find((cp: any) => cp.cycleId === closedCycleId);

  // Fetch current price
  const { data: prices = [] } = useQuery<any[]>({
    queryKey: ['/api/prices'],
    enabled: !!user
  });

  const currentPriceData = prices.find((p: any) => p.assetId === asset?.id);
  const currentPrice = Number(currentPriceData?.closePrice) || 0;

  // Fetch portfolio overview for portfolio weight calculation
  const { data: portfolioOverview } = useQuery<{
    totalValue: number;
    holdings: Array<{
      asset: any;
      marketValue: number;
    }>;
  }>({
    queryKey: ["/api/portfolio/overview"],
    enabled: !!user
  });

  // Calculate asset performance metrics
  const calculateAssetPerformance = (): AssetPerformance => {
    // If viewing a closed position, use closed position data
    if (isClosedPosition && closedPositionData) {
      return {
        totalInvested: closedPositionData.totalBought * closedPositionData.avgBuyPrice,
        quantityHeld: 0, // Closed position has no quantity held
        marketValue: closedPositionData.totalSold * closedPositionData.avgSellPrice, // Final realized value
        averagePrice: closedPositionData.avgBuyPrice,
        realizedPL: closedPositionData.realizedPL,
        unrealizedPL: 0, // No unrealized P&L for closed positions
        portfolioWeight: 0, // No weight in current portfolio
        isActive: false,
        holdingDuration: closedPositionData.holdingPeriod,
        startDate: closedPositionData.firstBuyDate,
        endDate: closedPositionData.lastSellDate
      };
    }

    if (!assetTransactions.length) {
      return {
        totalInvested: 0,
        quantityHeld: 0,
        marketValue: 0,
        averagePrice: 0,
        realizedPL: 0,
        unrealizedPL: 0,
        portfolioWeight: 0,
        isActive: false
      };
    }

    let totalQuantity = 0;
    let totalInvested = 0; // Total amount spent including fees
    let totalCostBasis = 0; // Cost basis without fees for calculation
    let realizedPL = 0;
    const sortedTransactions = [...assetTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const transaction of sortedTransactions) {
      const quantity = Number(transaction.quantity) || 0;
      const unitPrice = Number(transaction.unitPrice) || 0;
      const fees = Number(transaction.fees) || 0;
      const totalAmount = quantity * unitPrice;
      
      if (transaction.type === 'buy') {
        totalQuantity += quantity;
        totalInvested += totalAmount + fees; // Include fees in total invested
        totalCostBasis += totalAmount; // Cost basis without fees
      } else if (transaction.type === 'sell') {
        const soldQuantity = Math.min(quantity, totalQuantity);
        if (soldQuantity > 0) {
          const avgCostPerShare = totalQuantity > 0 ? totalCostBasis / totalQuantity : 0;
          const costOfSold = soldQuantity * avgCostPerShare;
          
          realizedPL += (totalAmount - fees) - costOfSold;
          totalQuantity -= soldQuantity;
          totalCostBasis -= costOfSold;
        }
      }
    }

    const safeCurrentPrice = Number(currentPrice) || 0;
    const marketValue = totalQuantity * safeCurrentPrice;
    const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0; // Include fees in average price
    const isActive = totalQuantity > 0;
    const unrealizedPL = isActive ? marketValue - totalCostBasis : 0;

    // Calculate portfolio weight
    const portfolioTotalValue = portfolioOverview?.totalValue || 0;
    const portfolioWeight = portfolioTotalValue > 0 ? (marketValue / portfolioTotalValue) * 100 : 0;

    const startDate = sortedTransactions[0]?.date;
    const endDate = totalQuantity === 0 ? sortedTransactions[sortedTransactions.length - 1]?.date : undefined;
    const holdingDuration = startDate && endDate ? differenceInDays(parseISO(endDate), parseISO(startDate)) : undefined;

    return {
      totalInvested: isNaN(totalInvested) ? 0 : totalInvested,
      quantityHeld: isNaN(totalQuantity) ? 0 : totalQuantity,
      marketValue: isNaN(marketValue) ? 0 : marketValue,
      averagePrice: isNaN(averagePrice) ? 0 : averagePrice,
      realizedPL: isNaN(realizedPL) ? 0 : realizedPL,
      unrealizedPL: isNaN(unrealizedPL) ? 0 : unrealizedPL,
      portfolioWeight: isNaN(portfolioWeight) ? 0 : portfolioWeight,
      isActive,
      holdingDuration,
      startDate,
      endDate
    };
  };

  const performance = calculateAssetPerformance();

  // Fetch asset snapshots for historical data
  const { data: assetSnapshots = [], isLoading: snapshotsLoading } = useQuery<AssetSnapshot[]>({
    queryKey: ['/api/assets', asset?.id, 'snapshots'],
    enabled: !!asset?.id
  });



  // Generate dividend chart data
  const generateDividendData = () => {
    const monthlyDividends = assetDividends.reduce((acc: Record<string, number>, dividend: Dividend) => {
      const monthKey = format(parseISO(dividend.paymentDate), 'yyyy-MM');
      acc[monthKey] = (acc[monthKey] || 0) + Number(dividend.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyDividends).map(([month, amount]) => ({
      month,
      amount,
      formattedMonth: format(parseISO(month + '-01'), 'MMM yyyy')
    }));
  };

  const dividendData = generateDividendData();

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await fetch(`/api/assets/${asset?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes })
      });
      if (!response.ok) throw new Error('Failed to update notes');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({ title: "Notes updated successfully" });
      setIsEditingNotes(false);
    },
    onError: () => {
      toast({ title: "Failed to update notes", variant: "destructive" });
    }
  });

  useEffect(() => {
    if (asset?.notes) {
      setNotesValue(asset.notes);
    }
  }, [asset?.notes]);

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Asset Not Found</h2>
          <Button onClick={() => navigate('/holdings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Holdings
          </Button>
        </div>
      </div>
    );
  }

  const assetIconData = getAssetIcon(asset.category);
  const AssetIcon = assetIconData.icon;
  const categoryColor = CATEGORY_COLORS[asset.category as keyof typeof CATEGORY_COLORS] || '#6B7280';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/holdings')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Holdings
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${categoryColor}20` }}>
                  <AssetIcon className="h-6 w-6" style={{ color: categoryColor }} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{asset.name}</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-600">{asset.ticker}</span>
                    <Badge variant="secondary" className="text-xs">
                      {asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}
                    </Badge>
                    <Badge variant={performance.isActive ? "default" : "outline"} className="text-xs">
                      {performance.isActive ? "Active" : "Closed"}
                    </Badge>
                    {!performance.isActive && performance.holdingDuration && (
                      <Badge variant="secondary" className="text-xs">
                        {performance.holdingDuration} days
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={() => setShowEditAssetModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Asset
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowAddTransactionModal(true)}
                disabled={isClosedPosition}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
              {!isClosedPosition && performance.isActive && (
                <Button size="sm" variant="outline" onClick={() => setShowAddDividendModal(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Dividend
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* KPI Overview - Mobile Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* Total Invested */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium text-gray-600">Total Invested</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Total amount invested including transaction fees</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-2 truncate">
                    €{performance.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {performance.portfolioWeight.toFixed(1)}% of portfolio
                  </p>
                </div>
                <div className="bg-blue-50 rounded-full p-2 lg:p-3 ml-2">
                  <PiggyBank className="text-blue-600 h-4 w-4 lg:h-5 lg:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Held */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Quantity Held</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-2 truncate">
                    {performance.quantityHeld.toLocaleString()}
                  </p>
                  {!performance.isActive && (
                    <p className="text-xs text-orange-600 mt-1">Position closed</p>
                  )}
                </div>
                <div className="bg-green-50 rounded-full p-2 lg:p-3 ml-2">
                  <Calculator className="text-green-600 h-4 w-4 lg:h-5 lg:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Value */}
          <Card className={`shadow-sm border border-gray-200 ${!performance.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Market Value</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-2 truncate">
                    {performance.isActive ? (
                      `€${performance.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    ) : (
                      '€0.00'
                    )}
                  </p>
                  {!performance.isActive && (
                    <p className="text-xs text-orange-600 mt-1">Asset fully sold</p>
                  )}
                </div>
                <div className="bg-primary-50 rounded-full p-2 lg:p-3 ml-2">
                  <Wallet className="text-primary h-4 w-4 lg:h-5 lg:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Overview - Row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* Average Buy Price */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium text-gray-600">Avg. Buy Price</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Average price per unit across all buy transactions</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-2 truncate">
                    €{performance.averagePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-full p-2 lg:p-3 ml-2">
                  <Target className="text-orange-600 h-4 w-4 lg:h-5 lg:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Realized P&L */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium text-gray-600">Realized P&L</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Profit/Loss from completed sell transactions</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className={`text-xl lg:text-2xl font-bold mt-2 truncate ${performance.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performance.realizedPL >= 0 ? '+' : ''}€{performance.realizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`rounded-full p-2 lg:p-3 ml-2 ${performance.realizedPL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <Target className={`h-4 w-4 lg:h-5 lg:w-5 ${performance.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unrealized P&L - Hidden for closed positions */}
          {!isClosedPosition && (
          <Card className={`shadow-sm border border-gray-200 ${!performance.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium text-gray-600">Unrealized P&L</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Current gain/loss on open positions</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className={`text-xl lg:text-2xl font-bold mt-2 truncate ${performance.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performance.isActive ? (
                      `${performance.unrealizedPL >= 0 ? '+' : ''}€${performance.unrealizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    ) : (
                      '€0.00'
                    )}
                  </p>
                  {!performance.isActive && (
                    <p className="text-xs text-orange-600 mt-1">No open positions</p>
                  )}
                </div>
                <div className={`rounded-full p-2 lg:p-3 ml-2 ${performance.unrealizedPL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  {performance.unrealizedPL >= 0 ? 
                    <TrendingUp className="text-green-600 h-4 w-4 lg:h-5 lg:w-5" /> : 
                    <TrendingDown className="text-red-600 h-4 w-4 lg:h-5 lg:w-5" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Closed Position Data */}
        {/* Asset Sold Status Banner */}
        {isClosedPosition && performance.endDate && (
          <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-400 mr-3" />
              <div>
                <p className="font-medium text-orange-800">
                  This position was closed on {format(parseISO(performance.endDate), 'MMMM dd, yyyy')}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  Holding period: {performance.holdingDuration} days ({format(parseISO(performance.startDate!), 'MMM dd, yyyy')} - {format(parseISO(performance.endDate), 'MMM dd, yyyy')})
                </p>
              </div>
            </div>
          </div>
        )}

        {!performance.isActive && performance.holdingDuration && (
          <Card className="shadow-sm border border-gray-200 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Closed Position Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Holding Duration</p>
                    <p className="font-semibold">{performance.holdingDuration} days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Period</p>
                    <p className="font-semibold">
                      {performance.startDate && format(parseISO(performance.startDate), 'MMM dd, yyyy')} - {performance.endDate && format(parseISO(performance.endDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Target className={`h-5 w-5 ${performance.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className="text-sm text-gray-600">Final Realized P&L</p>
                    <p className={`font-semibold ${performance.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {performance.realizedPL >= 0 ? '+' : ''}€{performance.realizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Tabs or Desktop Layout */}
        <div className="lg:hidden mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Investment Performance</h3>
                      <div className="flex items-center space-x-2 text-xs">
                        <Button
                          variant={chartViewMode === 'currency' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setChartViewMode('currency')}
                          className="h-7 px-2"
                          aria-pressed={chartViewMode === 'currency'}
                          aria-label="Show values in currency format"
                        >
                          <Euro className="h-3 w-3 mr-1" />
                          €
                        </Button>
                        <Button
                          variant={chartViewMode === 'percentage' ? "default" : "outline"}
                          size="sm"  
                          onClick={() => setChartViewMode('percentage')}
                          className="h-7 px-2"
                          aria-pressed={chartViewMode === 'percentage'}
                          aria-label="Show values as percentage growth"
                        >
                          <Percent className="h-3 w-3 mr-1" />
                          %
                        </Button>
                      </div>
                    </div>
                    {performanceData.length >= 2 && (
                      <div className="flex space-x-1 overflow-x-auto">
                        {['1M', '3M', '1Y', 'MAX'].map((range) => (
                          <Button
                            key={range}
                            variant={timeRange === range ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTimeRange(range)}
                            className="h-7 px-2 text-xs whitespace-nowrap"
                            aria-pressed={timeRange === range}
                            aria-label={`Show data for ${range === 'MAX' ? 'all time' : range.toLowerCase()}`}
                          >
                            {range}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  {performanceData.length >= 1 ? (
                    <>
                      {/* Always visible legend */}
                      <div className="flex items-center justify-center space-x-4 mb-4 text-xs">
                        {chartViewMode === 'percentage' ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-1 bg-green-500 rounded"></div>
                            <span className="text-gray-600">Performance (%)</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-1 bg-blue-500 rounded"></div>
                              <span className="text-gray-600">Invested Value</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-1 bg-green-500 rounded"></div>
                              <span className="text-gray-600">Market Value</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="h-64 overflow-x-auto">
                        <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                          <LineChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="formattedDate" 
                              stroke="#6b7280"
                              fontSize={10}
                              interval="preserveStartEnd"
                            />
                            <YAxis 
                              stroke="#6b7280"
                              fontSize={10}
                              domain={chartViewMode === 'percentage' ? ['dataMin - 5', 'dataMax + 5'] : [(dataMin: number) => Math.max(0, dataMin * 0.95), 'dataMax * 1.05']}
                              tickFormatter={(value) => 
                                chartViewMode === 'percentage' 
                                  ? `${value.toFixed(0)}%`
                                  : value >= 1000 ? `€${(value / 1000).toFixed(0)}k` : `€${value.toFixed(0)}`
                              }
                            />
                            <ChartTooltip 
                              formatter={(value: any, name: string) => {
                                if (chartViewMode === 'percentage') {
                                  return [`${Number(value).toFixed(2)}%`, 'Performance'];
                                } else {
                                  const formattedValue = `€${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  // Market Value should appear first in tooltip
                                  if (name === 'marketValue') {
                                    return [formattedValue, 'Market Value'];
                                  } else if (name === 'investedValue') {
                                    return [formattedValue, 'Invested Value'];
                                  }
                                  return [formattedValue, name];
                                }
                              }}
                              labelFormatter={(label) => label}
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            {chartViewMode === 'percentage' ? (
                              <Line 
                                type="monotone" 
                                dataKey="performance" 
                                stroke="#10B981" 
                                strokeWidth={2}
                                dot={false}
                                name="Performance"
                                animationDuration={300}
                              />
                            ) : (
                              <>
                                {/* Market Value line first for tooltip ordering */}
                                <Line 
                                  type="monotone" 
                                  dataKey="marketValue" 
                                  stroke="#10B981" 
                                  strokeWidth={2}
                                  dot={false}
                                  name="marketValue"
                                  animationDuration={300}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="investedValue" 
                                  stroke="#3B82F6" 
                                  strokeWidth={2}
                                  dot={false}
                                  name="investedValue"
                                  animationDuration={300}
                                />
                              </>
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <TrendingUp className="h-12 w-12 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {rawPerformanceData.length < 1 ? "No snapshots available" : `No data for ${timeRange}`}
                      </p>
                      <p className="text-sm text-center mt-2">
                        {assetSnapshots.length === 0 ? "No historical data available. Add at least one snapshot to view performance." : "Try a different time range"}
                      </p>
                    </div>
                  )}

                  {/* Asset Snapshots Table */}
                  {assetSnapshots.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Historical Snapshots</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Price</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              // Sort snapshots by date (newest first)
                              const sortedSnapshots = [...assetSnapshots].sort((a, b) => 
                                new Date(b.date).getTime() - new Date(a.date).getTime()
                              );
                              
                              // Show only last 3 months by default, unless "Show More" is clicked
                              const displaySnapshots = showAllSnapshots 
                                ? sortedSnapshots 
                                : sortedSnapshots.slice(0, 3);
                              
                              return displaySnapshots.map((snapshot) => {
                                const unrealizedPL = Number(snapshot.unrealizedPL);
                                const unrealizedPLPercent = Number(snapshot.unrealizedPLPercent);
                                const isEditing = editingSnapshotId === snapshot.id;
                                
                                return (
                                  <tr key={snapshot.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {format(parseISO(snapshot.date), 'MMM dd, yyyy')}
                                    </td>
                                    
                                    {/* Quantity */}
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          step="0.000001"
                                          className="w-20 px-2 py-1 text-right text-xs border border-gray-300 rounded"
                                          value={editingSnapshot.quantity || snapshot.quantity}
                                          onChange={(e) => setEditingSnapshot({...editingSnapshot, quantity: e.target.value})}
                                        />
                                      ) : (
                                        Number(snapshot.quantity).toLocaleString('en-US', { maximumFractionDigits: 6 })
                                      )}
                                    </td>
                                    
                                    {/* Average Price */}
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          step="0.01"
                                          className="w-20 px-2 py-1 text-right text-xs border border-gray-300 rounded"
                                          value={editingSnapshot.averagePrice || snapshot.averagePrice}
                                          onChange={(e) => setEditingSnapshot({...editingSnapshot, averagePrice: e.target.value})}
                                        />
                                      ) : (
                                        `€${Number(snapshot.averagePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      )}
                                    </td>
                                    
                                    {/* Current Price */}
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          step="0.01"
                                          className="w-20 px-2 py-1 text-right text-xs border border-gray-300 rounded"
                                          value={editingSnapshot.currentPrice || snapshot.currentPrice}
                                          onChange={(e) => setEditingSnapshot({...editingSnapshot, currentPrice: e.target.value})}
                                        />
                                      ) : (
                                        `€${Number(snapshot.currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      )}
                                    </td>
                                    
                                    {/* Total Cost */}
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          step="0.01"
                                          className="w-20 px-2 py-1 text-right text-xs border border-gray-300 rounded"
                                          value={editingSnapshot.totalCost || snapshot.totalCost}
                                          onChange={(e) => setEditingSnapshot({...editingSnapshot, totalCost: e.target.value})}
                                        />
                                      ) : (
                                        `€${Number(snapshot.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      )}
                                    </td>
                                    
                                    {/* Market Value - Auto-calculated */}
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                                      €{(Number(isEditing ? editingSnapshot.quantity || snapshot.quantity : snapshot.quantity) * 
                                          Number(isEditing ? editingSnapshot.currentPrice || snapshot.currentPrice : snapshot.currentPrice))
                                          .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    
                                    {/* P&L - Auto-calculated */}
                                    <td className={`px-4 py-2 whitespace-nowrap text-right text-sm font-medium`}>
                                      {(() => {
                                        const quantity = Number(isEditing ? editingSnapshot.quantity || snapshot.quantity : snapshot.quantity);
                                        const currentPrice = Number(isEditing ? editingSnapshot.currentPrice || snapshot.currentPrice : snapshot.currentPrice);
                                        const totalCost = Number(isEditing ? editingSnapshot.totalCost || snapshot.totalCost : snapshot.totalCost);
                                        const marketValue = quantity * currentPrice;
                                        const pl = marketValue - totalCost;
                                        const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;
                                        
                                        return (
                                          <div className={pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {pl >= 0 ? '+' : ''}€{pl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <div className="text-xs">
                                              ({pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%)
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </td>
                                    
                                    {/* Actions */}
                                    <td className="px-4 py-2 whitespace-nowrap text-center text-sm">
                                      {isEditing ? (
                                        <div className="flex items-center justify-center space-x-1">
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={async () => {
                                              try {
                                                // Update snapshot
                                                const response = await fetch(`/api/assets/${asset?.id}/snapshots/${snapshot.id}`, {
                                                  method: 'PUT',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify(editingSnapshot)
                                                });
                                                
                                                if (response.ok) {
                                                  queryClient.invalidateQueries({ queryKey: ['/api/assets', asset?.id, 'snapshots'] });
                                                  toast({ title: "Snapshot updated successfully" });
                                                  setEditingSnapshotId(null);
                                                  setEditingSnapshot({});
                                                } else {
                                                  throw new Error('Update failed');
                                                }
                                              } catch (error) {
                                                toast({ title: "Failed to update snapshot", variant: "destructive" });
                                              }
                                            }}
                                          >
                                            <Save className="h-3 w-3 text-green-600" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => {
                                              setEditingSnapshotId(null);
                                              setEditingSnapshot({});
                                            }}
                                          >
                                            <X className="h-3 w-3 text-red-600" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => {
                                            setEditingSnapshotId(snapshot.id);
                                            setEditingSnapshot(snapshot);
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Show More button */}
                      {assetSnapshots.length > 3 && !showAllSnapshots && (
                        <div className="flex justify-center mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowAllSnapshots(true)}
                          >
                            Show More ({assetSnapshots.length - 3} more)
                          </Button>
                        </div>
                      )}
                      
                      {/* Show Less button */}
                      {showAllSnapshots && assetSnapshots.length > 3 && (
                        <div className="flex justify-center mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowAllSnapshots(false)}
                          >
                            Show Less
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Performance Chart */}
        <div className="hidden lg:block">
          <Card className="shadow-sm border border-gray-200 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Investment Performance</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 mr-4">
                    <Button
                      variant={chartViewMode === 'currency' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartViewMode('currency')}
                      aria-pressed={chartViewMode === 'currency'}
                      aria-label="Show values in currency format"
                    >
                      <Euro className="h-4 w-4 mr-1" />
                      Currency
                    </Button>
                    <Button
                      variant={chartViewMode === 'percentage' ? "default" : "outline"}
                      size="sm"  
                      onClick={() => setChartViewMode('percentage')}
                      aria-pressed={chartViewMode === 'percentage'}
                      aria-label="Show values as percentage growth"
                    >
                      <Percent className="h-4 w-4 mr-1" />
                      Percentage
                    </Button>
                  </div>
                  {performanceData.length >= 2 && (
                    <div className="flex space-x-2">
                      {['1M', '3M', '1Y', 'MAX'].map((range) => (
                        <Button
                          key={range}
                          variant={timeRange === range ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTimeRange(range)}
                          aria-pressed={timeRange === range}
                          aria-label={`Show data for ${range === 'MAX' ? 'all time' : range.toLowerCase()}`}
                        >
                          {range}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {performanceData.length >= 1 ? (
                <>
                  {/* Always visible legend */}
                  <div className="flex items-center justify-center space-x-6 mb-4">
                    {chartViewMode === 'percentage' ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-1 bg-green-500 rounded"></div>
                        <span className="text-sm text-gray-600">Performance (%)</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-1 bg-blue-500 rounded"></div>
                          <span className="text-sm text-gray-600">Invested Value</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-1 bg-green-500 rounded"></div>
                          <span className="text-sm text-gray-600">Market Value</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="formattedDate" 
                          stroke="#6b7280"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          fontSize={12}
                          domain={chartViewMode === 'percentage' ? ['dataMin - 5', 'dataMax + 5'] : [(dataMin: number) => Math.max(0, dataMin * 0.95), 'dataMax * 1.05']}
                          tickFormatter={(value) => 
                            chartViewMode === 'percentage' 
                              ? `${value.toFixed(0)}%`
                              : value >= 1000 ? `€${(value / 1000).toFixed(0)}k` : `€${value.toFixed(0)}`
                          }
                        />
                        <ChartTooltip 
                          formatter={(value: any, name: string) => {
                            if (chartViewMode === 'percentage') {
                              return [`${Number(value).toFixed(2)}%`, 'Performance'];
                            } else {
                              const formattedValue = `€${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              // Market Value should appear first in tooltip
                              if (name === 'marketValue') {
                                return [formattedValue, 'Market Value'];
                              } else if (name === 'investedValue') {
                                return [formattedValue, 'Invested Value'];
                              }
                              return [formattedValue, name];
                            }
                          }}
                          labelFormatter={(label) => label}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        {chartViewMode === 'percentage' ? (
                          <Line 
                            type="monotone" 
                            dataKey="performance" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={false}
                            name="Performance"
                            animationDuration={300}
                          />
                        ) : (
                          <>
                            {/* Market Value line first for tooltip ordering */}
                            <Line 
                              type="monotone" 
                              dataKey="marketValue" 
                              stroke="#10B981" 
                              strokeWidth={2}
                              dot={false}
                              name="marketValue"
                              animationDuration={300}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="investedValue" 
                              stroke="#3B82F6" 
                              strokeWidth={2}
                              dot={false}
                              name="investedValue"
                              animationDuration={300}
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <TrendingUp className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    {rawPerformanceData.length < 1 ? "No snapshots available" : `No data for ${timeRange}`}
                  </p>
                  <p className="text-sm text-center mt-2">
                    {assetSnapshots.length === 0 ? "No historical data available. Add at least one snapshot to view performance." : "Try a different time range"}
                  </p>
                </div>
              )}

              {/* Mobile Asset Snapshots Table */}
              {assetSnapshots.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Historical Snapshots</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Price</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          // Sort snapshots by date (newest first)
                          const sortedSnapshots = [...assetSnapshots].sort((a, b) => 
                            new Date(b.date).getTime() - new Date(a.date).getTime()
                          );
                          
                          // Show only last 3 months by default, unless "Show More" is clicked
                          const displaySnapshots = showAllSnapshots 
                            ? sortedSnapshots 
                            : sortedSnapshots.slice(0, 3);
                          
                          return displaySnapshots.map((snapshot) => {
                            const unrealizedPL = Number(snapshot.unrealizedPL);
                            const unrealizedPLPercent = Number(snapshot.unrealizedPLPercent);
                            const isEditing = editingSnapshotId === snapshot.id;
                            
                            return (
                              <tr key={snapshot.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {format(parseISO(snapshot.date), 'MMM dd, yyyy')}
                                </td>
                                
                                {/* Quantity */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.000001"
                                      className="w-24 px-2 py-1 text-right text-sm border border-gray-300 rounded"
                                      value={editingSnapshot.quantity || snapshot.quantity}
                                      onChange={(e) => setEditingSnapshot({...editingSnapshot, quantity: e.target.value})}
                                    />
                                  ) : (
                                    Number(snapshot.quantity).toLocaleString('en-US', { maximumFractionDigits: 6 })
                                  )}
                                </td>
                                
                                {/* Average Price */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="w-24 px-2 py-1 text-right text-sm border border-gray-300 rounded"
                                      value={editingSnapshot.averagePrice || snapshot.averagePrice}
                                      onChange={(e) => setEditingSnapshot({...editingSnapshot, averagePrice: e.target.value})}
                                    />
                                  ) : (
                                    `€${Number(snapshot.averagePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  )}
                                </td>
                                
                                {/* Current Price */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="w-24 px-2 py-1 text-right text-sm border border-gray-300 rounded"
                                      value={editingSnapshot.currentPrice || snapshot.currentPrice}
                                      onChange={(e) => setEditingSnapshot({...editingSnapshot, currentPrice: e.target.value})}
                                    />
                                  ) : (
                                    `€${Number(snapshot.currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  )}
                                </td>
                                
                                {/* Total Cost */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="w-24 px-2 py-1 text-right text-sm border border-gray-300 rounded"
                                      value={editingSnapshot.totalCost || snapshot.totalCost}
                                      onChange={(e) => setEditingSnapshot({...editingSnapshot, totalCost: e.target.value})}
                                    />
                                  ) : (
                                    `€${Number(snapshot.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  )}
                                </td>
                                
                                {/* Market Value - Auto-calculated */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  €{(Number(isEditing ? editingSnapshot.quantity || snapshot.quantity : snapshot.quantity) * 
                                      Number(isEditing ? editingSnapshot.currentPrice || snapshot.currentPrice : snapshot.currentPrice))
                                      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                
                                {/* P&L - Auto-calculated */}
                                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium`}>
                                  {(() => {
                                    const quantity = Number(isEditing ? editingSnapshot.quantity || snapshot.quantity : snapshot.quantity);
                                    const currentPrice = Number(isEditing ? editingSnapshot.currentPrice || snapshot.currentPrice : snapshot.currentPrice);
                                    const totalCost = Number(isEditing ? editingSnapshot.totalCost || snapshot.totalCost : snapshot.totalCost);
                                    const marketValue = quantity * currentPrice;
                                    const pl = marketValue - totalCost;
                                    const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;
                                    
                                    return (
                                      <div className={pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {pl >= 0 ? '+' : ''}€{pl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        <div className="text-xs">
                                          ({pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%)
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </td>
                                
                                {/* Actions */}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                  {isEditing ? (
                                    <div className="flex items-center justify-center space-x-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            // Update snapshot
                                            const response = await fetch(`/api/assets/${asset?.id}/snapshots/${snapshot.id}`, {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify(editingSnapshot)
                                            });
                                            
                                            if (response.ok) {
                                              // Invalidate all related queries to refresh the chart and data
                                              queryClient.invalidateQueries({ queryKey: ['/api/assets', asset?.id, 'snapshots'] });
                                              queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
                                              queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
                                              toast({ title: "Snapshot updated successfully" });
                                              setEditingSnapshotId(null);
                                              setEditingSnapshot({});
                                            } else {
                                              throw new Error('Update failed');
                                            }
                                          } catch (error) {
                                            toast({ title: "Failed to update snapshot", variant: "destructive" });
                                          }
                                        }}
                                      >
                                        <Save className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setEditingSnapshotId(null);
                                          setEditingSnapshot({});
                                        }}
                                      >
                                        <X className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        setEditingSnapshotId(snapshot.id);
                                        setEditingSnapshot(snapshot);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Show More button */}
                  {assetSnapshots.length > 3 && !showAllSnapshots && (
                    <div className="flex justify-center mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAllSnapshots(true)}
                      >
                        Show More ({assetSnapshots.length - 3} more)
                      </Button>
                    </div>
                  )}
                  
                  {/* Show Less button */}
                  {showAllSnapshots && assetSnapshots.length > 3 && (
                    <div className="flex justify-center mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAllSnapshots(false)}
                      >
                        Show Less
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dividend Chart */}
        {dividendData.length > 0 && (
          <Card className="shadow-sm border border-gray-200 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dividend History</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dividendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="formattedMonth" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <ChartTooltip 
                      formatter={(value: any) => [`€${Number(value).toFixed(2)}`, 'Dividend']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Transaction History Tab */}
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="transactions" className="mt-4">
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
                  {assetTransactions.length > 0 ? (
                    <>
                      {/* Transaction Summary for Mobile */}
                      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Total Invested</p>
                          <p className="font-semibold text-green-600">
                            €{assetTransactions
                              .filter(t => t.type === 'buy')
                              .reduce((sum, t) => sum + (Number(t.quantity) * Number(t.unitPrice)) + Number(t.fees), 0)
                              .toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Total Sold</p>
                          <p className="font-semibold text-red-600">
                            €{assetTransactions
                              .filter(t => t.type === 'sell')
                              .reduce((sum, t) => sum + (Number(t.quantity) * Number(t.unitPrice)) - Number(t.fees), 0)
                              .toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Total Fees</p>
                          <p className="font-semibold text-orange-600">
                            €{assetTransactions
                              .reduce((sum, t) => sum + Number(t.fees), 0)
                              .toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Net P&L</p>
                          <p className={`font-semibold ${performance.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {performance.realizedPL >= 0 ? '+' : ''}€{performance.realizedPL.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {assetTransactions
                          .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((transaction: Transaction) => (
                          <div key={transaction.id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={transaction.type === 'buy' ? 'default' : 'destructive'} 
                                  className={`text-xs ${transaction.type === 'buy' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}
                                >
                                  {transaction.type.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <span className="font-semibold">
                                €{(transaction.type === 'buy' 
                                  ? (Number(transaction.quantity) * Number(transaction.unitPrice)) + Number(transaction.fees)
                                  : (Number(transaction.quantity) * Number(transaction.unitPrice)) - Number(transaction.fees)
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {Number(transaction.quantity).toLocaleString()} × €{Number(transaction.unitPrice).toFixed(2)}
                              {Number(transaction.fees) > 0 && (
                                <span className="text-red-600"> + €{Number(transaction.fees).toFixed(2)} fees</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No transactions found for this asset</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Transaction History */}
        <div className="hidden lg:block">
          <Card className="shadow-sm border border-gray-200 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
              {assetTransactions.length > 0 ? (
                <>
                  {/* Transaction Summary Row */}
                  <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Invested</p>
                      <p className="text-lg font-bold text-green-600">
                        €{assetTransactions
                          .filter(t => t.type === 'buy')
                          .reduce((sum, t) => sum + (Number(t.quantity) * Number(t.unitPrice)) + Number(t.fees), 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Sold</p>
                      <p className="text-lg font-bold text-red-600">
                        €{assetTransactions
                          .filter(t => t.type === 'sell')
                          .reduce((sum, t) => sum + (Number(t.quantity) * Number(t.unitPrice)) - Number(t.fees), 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Fees</p>
                      <p className="text-lg font-bold text-orange-600">
                        €{assetTransactions
                          .reduce((sum, t) => sum + Number(t.fees), 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 mb-1">Realized P&L</p>
                      <p className={`text-lg font-bold ${performance.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {performance.realizedPL >= 0 ? '+' : ''}€{performance.realizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Quantity</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Price</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Fees</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Net Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetTransactions
                          .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((transaction: Transaction) => (
                          <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant={transaction.type === 'buy' ? 'default' : 'destructive'} 
                                className={`text-xs ${transaction.type === 'buy' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                              >
                                {transaction.type.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {Number(transaction.quantity).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              €{Number(transaction.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              €{(Number(transaction.quantity) * Number(transaction.unitPrice)).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {Number(transaction.fees) > 0 ? `€${Number(transaction.fees).toFixed(2)}` : '–'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold">
                              €{(transaction.type === 'buy' 
                                ? (Number(transaction.quantity) * Number(transaction.unitPrice)) + Number(transaction.fees)
                                : (Number(transaction.quantity) * Number(transaction.unitPrice)) - Number(transaction.fees)
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions found for this asset</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile Notes Tab */}
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="notes" className="mt-4">
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Personal Notes</h3>
                    </div>
                    {!isEditingNotes ? (
                      <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(true)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          onClick={() => updateNotesMutation.mutate(notesValue)}
                          disabled={updateNotesMutation.isPending}
                          className="h-8 px-2"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingNotes(false);
                            setNotesValue(asset.notes || '');
                          }}
                          className="h-8 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {isEditingNotes && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-600 mb-2 block">Strategy Tag</label>
                      <Select value={strategyTag} onValueChange={setStrategyTag}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select investment strategy..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="long-term">🎯 Long-term</SelectItem>
                          <SelectItem value="growth">📈 Growth</SelectItem>
                          <SelectItem value="passive-income">💰 Passive Income</SelectItem>
                          <SelectItem value="speculative">🎲 Speculative</SelectItem>
                          <SelectItem value="diversification">🔄 Diversification</SelectItem>
                          <SelectItem value="hedge">🛡️ Hedge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {isEditingNotes ? (
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add your personal notes about this investment..."
                      rows={6}
                      className="w-full resize-none"
                    />
                  ) : (
                    <div className="min-h-[120px] p-3 bg-gray-50 rounded-lg border">
                      {strategyTag && (
                        <div className="mb-3 pb-2 border-b border-gray-200">
                          <Badge variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {strategyTag.charAt(0).toUpperCase() + strategyTag.slice(1).replace('-', ' ')}
                          </Badge>
                        </div>
                      )}
                      {asset.notes ? (
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{asset.notes}</p>
                      ) : (
                        <p className="text-gray-500 italic text-sm">No notes added yet. Click Edit to add your thoughts about this investment.</p>
                      )}
                      {asset.notes && (
                        <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-200">
                          Last updated: {new Date().toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Personal Notes Section */}
        <div className="hidden lg:block">
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Personal Notes</h3>
                  {asset.notes && !isEditingNotes && (
                    <span className="text-xs text-gray-500">
                      Last updated: {new Date().toLocaleDateString()}
                    </span>
                  )}
                </div>
                {!isEditingNotes ? (
                  <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateNotesMutation.mutate(notesValue)}
                      disabled={updateNotesMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingNotes(false);
                        setNotesValue(asset.notes || '');
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              
              {isEditingNotes && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Strategy Tag</label>
                  <Select value={strategyTag} onValueChange={setStrategyTag}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select investment strategy..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long-term">🎯 Long-term</SelectItem>
                      <SelectItem value="growth">📈 Growth</SelectItem>
                      <SelectItem value="passive-income">💰 Passive Income</SelectItem>
                      <SelectItem value="speculative">🎲 Speculative</SelectItem>
                      <SelectItem value="diversification">🔄 Diversification</SelectItem>
                      <SelectItem value="hedge">🛡️ Hedge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {isEditingNotes ? (
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add your personal notes about this investment..."
                  rows={6}
                  className="w-full resize-none"
                />
              ) : (
                <div className="min-h-[120px] p-4 bg-gray-50 rounded-lg border">
                  {strategyTag && (
                    <div className="mb-4 pb-3 border-b border-gray-200">
                      <Badge variant="outline" className="text-sm">
                        <Tag className="h-4 w-4 mr-2" />
                        {strategyTag.charAt(0).toUpperCase() + strategyTag.slice(1).replace('-', ' ')}
                      </Badge>
                    </div>
                  )}
                  {asset.notes ? (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{asset.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No notes added yet. Click Edit to add your thoughts about this investment.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modals */}
      <EditAssetModal 
        open={showEditAssetModal} 
        onOpenChange={setShowEditAssetModal}
        asset={asset}
        holdingData={{
          quantity: performance.quantityHeld,
          avgPrice: performance.averagePrice,
          currentPrice: Number(currentPrice),
          marketValue: performance.marketValue,
        }}
      />
      
      <AddTransactionModal 
        open={showAddTransactionModal} 
        onOpenChange={setShowAddTransactionModal}
        preSelectedAsset={asset}
      />
      
      <AddDividendModal 
        open={showAddDividendModal} 
        onOpenChange={setShowAddDividendModal}
        preSelectedAsset={asset}
      />
    </div>
  );
}