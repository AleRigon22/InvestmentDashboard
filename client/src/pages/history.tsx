import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ChartLine, TrendingUp, TrendingDown, Calendar, Edit, Trash2, ChevronRight, ChevronDown, Check, X, Eye, BarChart3, PieChart, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS, getAssetIcon } from "@/utils/asset-icons";
import { categoryDisplayNames } from "@shared/schema";
import React, { useState, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);
  const [expandedSnapshots, setExpandedSnapshots] = useState<Set<number>>(new Set());
  const [editingCategories, setEditingCategories] = useState<{[key: number]: any}>({});
  const [editingCategoryRow, setEditingCategoryRow] = useState<{snapshotId: number, category: string} | null>(null);
  const [timeRange, setTimeRange] = useState("Max");
  const [viewMode, setViewMode] = useState<'total' | 'by-type' | 'by-class'>('total');
  const [editForm, setEditForm] = useState({
    month: 1,
    year: 2025,
    totalValue: '',
    totalInvested: ''
  });
  
  const { data: snapshots, isLoading } = useQuery<Array<{
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
    categoryDetails?: string;
  }>>({
    queryKey: ["/api/portfolio/snapshots"],
    enabled: !!user,
  });

  const { data: cashMovements } = useQuery({
    queryKey: ["/api/cash-movements"],
    enabled: !!user,
  });

  const { data: portfolioOverview } = useQuery({
    queryKey: ["/api/portfolio/overview"],
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  const { data: dividends } = useQuery({
    queryKey: ["/api/dividends"],
    enabled: !!user,
  });

  // Process snapshots into chart data
  // Filter snapshots by time range (improved logic)
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

  // Calculate net deposits (cumulative cash flow)
  const calculateNetDeposits = useMemo(() => {
    if (!cashMovements || !snapshots) return {};
    
    const netDepositsByMonth: {[key: string]: number} = {};
    let cumulativeDeposits = 0;
    
    const sortedSnapshots = [...getFilteredSnapshots()].sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1);
      const dateB = new Date(b.year, b.month - 1);
      return dateA.getTime() - dateB.getTime();
    });
    
    sortedSnapshots.forEach((snapshot) => {
      const snapshotDate = new Date(snapshot.year, snapshot.month - 1, 1);
      const monthKey = `${snapshot.year}-${snapshot.month}`;
      
      // Calculate deposits up to this snapshot
      const depositsUpToThisMonth = (cashMovements as any[])
        .filter((cm: any) => {
          const cmDate = new Date(cm.date);
          return cmDate <= snapshotDate;
        })
        .reduce((sum: number, cm: any) => {
          return sum + (cm.type === 'deposit' ? parseFloat(cm.amount) : -parseFloat(cm.amount));
        }, 0);
      
      netDepositsByMonth[monthKey] = depositsUpToThisMonth;
    });
    
    return netDepositsByMonth;
  }, [cashMovements, snapshots, timeRange]);

  const chartData = getFilteredSnapshots().map(snapshot => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const monthKey = `${snapshot.year}-${snapshot.month}`;
    const netDeposits = calculateNetDeposits[monthKey] || parseFloat(snapshot.totalInvested);
    const totalValue = parseFloat(snapshot.totalValue);
    const totalInvested = parseFloat(snapshot.totalInvested);
    const monthlyPL = totalValue - totalInvested;
    
    return {
      period: `${monthNames[snapshot.month - 1]} ${snapshot.year}`,
      totalValue,
      totalInvested,
      netDeposits,
      monthlyPL,
      stocksValue: parseFloat(snapshot.stocksValue || '0'),
      etfValue: parseFloat(snapshot.etfValue || '0'),
      cryptoValue: parseFloat(snapshot.cryptoValue || '0'),
      bondsValue: parseFloat(snapshot.bondsValue || '0'),
      snapshotId: snapshot.id,
      month: snapshot.month,
      year: snapshot.year
    };
  }).reverse();



  // Delete snapshot mutation
  const deleteSnapshotMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/portfolio/snapshots/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete snapshot');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/snapshots"] });
      toast({
        title: "Success",
        description: "Portfolio snapshot deleted successfully",
      });
      setShowDeleteDialog(false);
      setSelectedSnapshot(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete portfolio snapshot",
        variant: "destructive",
      });
    },
  });

  // Update snapshot mutation
  const updateSnapshotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/portfolio/snapshots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update snapshot');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/snapshots"] });
      toast({
        title: "Success",
        description: "Portfolio snapshot updated successfully",
      });
      setShowEditDialog(false);
      setSelectedSnapshot(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update portfolio snapshot",
        variant: "destructive",
      });
    },
  });

  // Category values mutation
  const updateCategoryValuesMutation = useMutation({
    mutationFn: async ({ id, categoryData }: { id: number, categoryData: any }) => {
      const response = await fetch(`/api/portfolio/snapshots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) {
        throw new Error('Failed to update category values');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/snapshots"] });
      toast({
        title: "Success",
        description: "Category values updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category values",
        variant: "destructive",
      });
    },
  });

  const toggleSnapshotExpansion = (snapshotId: number) => {
    setExpandedSnapshots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(snapshotId)) {
        newSet.delete(snapshotId);
      } else {
        newSet.add(snapshotId);
      }
      return newSet;
    });
  };

  const handleCategoryEdit = (snapshotId: number, category: string, field: string, value: string) => {
    setEditingCategories(prev => ({
      ...prev,
      [snapshotId]: {
        ...prev[snapshotId],
        [`${category}${field}`]: value
      }
    }));
  };

  const saveCategoryChanges = (snapshot: any) => {
    const categoryData = editingCategories[snapshot.id];
    if (!categoryData) return;

    // Get updated values for all categories
    const stocksValue = parseFloat(categoryData.stocksTotalValue || snapshot.stocksValue || '0');
    const etfValue = parseFloat(categoryData.etfTotalValue || snapshot.etfValue || '0');
    const cryptoValue = parseFloat(categoryData.cryptoTotalValue || snapshot.cryptoValue || '0');
    const bondsValue = parseFloat(categoryData.bondsTotalValue || snapshot.bondsValue || '0');
    
    // Get invested amounts from editing data
    const stocksInvested = parseFloat(categoryData.stocksInvested || '0');
    const etfInvested = parseFloat(categoryData.etfInvested || '0');
    const cryptoInvested = parseFloat(categoryData.cryptoInvested || '0');
    const bondsInvested = parseFloat(categoryData.bondsInvested || '0');
    
    // Calculate P&L values for each category
    const stocksPL = stocksValue - stocksInvested;
    const etfPL = etfValue - etfInvested;
    const cryptoPL = cryptoValue - cryptoInvested;
    const bondsPL = bondsValue - bondsInvested;
    
    const stocksPLPercent = stocksInvested > 0 ? (stocksPL / stocksInvested) * 100 : 0;
    const etfPLPercent = etfInvested > 0 ? (etfPL / etfInvested) * 100 : 0;
    const cryptoPLPercent = cryptoInvested > 0 ? (cryptoPL / cryptoInvested) * 100 : 0;
    const bondsPLPercent = bondsInvested > 0 ? (bondsPL / bondsInvested) * 100 : 0;
    
    // Calculate new totals
    const newTotalValue = stocksValue + etfValue + cryptoValue + bondsValue;
    const newTotalInvested = stocksInvested + etfInvested + cryptoInvested + bondsInvested;
    const newTotalPL = newTotalValue - newTotalInvested;
    const newTotalPLPercent = newTotalInvested > 0 ? (newTotalPL / newTotalInvested) * 100 : 0;

    // Create updated category details JSON
    const updatedCategoryDetails = {
      stocks: {},
      etf: {},
      crypto: {},
      bonds: {},
      invested: {
        stocks: stocksInvested,
        etf: etfInvested,
        crypto: cryptoInvested,
        bonds: bondsInvested
      },
      pl: {
        stocks: stocksPL,
        etf: etfPL,
        crypto: cryptoPL,
        bonds: bondsPL
      },
      plPercent: {
        stocks: stocksPLPercent,
        etf: etfPLPercent,
        crypto: cryptoPLPercent,
        bonds: bondsPLPercent
      }
    };

    updateCategoryValuesMutation.mutate({
      id: snapshot.id,
      categoryData: {
        stocksValue: stocksValue.toString(),
        etfValue: etfValue.toString(),
        cryptoValue: cryptoValue.toString(),
        bondsValue: bondsValue.toString(),
        totalValue: newTotalValue.toString(),
        totalInvested: newTotalInvested.toString(),
        totalPL: newTotalPL.toString(),
        totalPLPercent: newTotalPLPercent.toString(),
        categoryDetails: JSON.stringify(updatedCategoryDetails)
      }
    });

    // Clear editing state
    setEditingCategories(prev => {
      const newState = { ...prev };
      delete newState[snapshot.id];
      return newState;
    });
    setEditingCategoryRow(null);
  };

  const handleEditSnapshot = (snapshot: any) => {
    setSelectedSnapshot(snapshot);
    setEditForm({
      month: snapshot.month,
      year: snapshot.year,
      totalValue: snapshot.totalValue,
      totalInvested: snapshot.totalInvested,
    });
    setShowEditDialog(true);
  };

  const handleDeleteSnapshot = (snapshot: any) => {
    setSelectedSnapshot(snapshot);
    setShowDeleteDialog(true);
  };

  const handleSaveEdit = () => {
    if (!selectedSnapshot) return;
    
    const totalValue = parseFloat(editForm.totalValue);
    const totalInvested = parseFloat(editForm.totalInvested);
    const totalPL = totalValue - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    updateSnapshotMutation.mutate({
      id: selectedSnapshot.id,
      data: {
        month: editForm.month,
        year: editForm.year,
        totalValue: editForm.totalValue,
        totalInvested: editForm.totalInvested,
        totalPL: totalPL.toString(),
        totalPLPercent: totalPLPercent.toString(),
      }
    });
  };

  // Get monthly transactions and dividends for expansion
  const getMonthlyData = (snapshotId: number, month: number, year: number) => {
    const monthlyTransactions = (transactions as any[])?.filter((t: any) => {
      try {
        const tDate = new Date(t.date);
        return tDate.getMonth() + 1 === month && tDate.getFullYear() === year;
      } catch (error) {
        console.warn('Error parsing transaction date:', t.date, error);
        return false;
      }
    }) || [];
    
    const monthlyDividends = (dividends as any[])?.filter((d: any) => {
      try {
        const dDate = new Date(d.paymentDate);
        return dDate.getMonth() + 1 === month && dDate.getFullYear() === year;
      } catch (error) {
        console.warn('Error parsing dividend date:', d.paymentDate, error);
        return false;
      }
    }) || [];
    
    const monthlyDeposits = (cashMovements as any[])?.filter((cm: any) => {
      try {
        const cmDate = new Date(cm.date);
        return cmDate.getMonth() + 1 === month && cmDate.getFullYear() === year;
      } catch (error) {
        console.warn('Error parsing cash movement date:', cm.date, error);
        return false;
      }
    }) || [];
    
    return { monthlyTransactions, monthlyDividends, monthlyDeposits };
  };

  // Get breakdown by asset category from current portfolio
  const categoryBreakdown = (portfolioOverview as any)?.allocationByCategory || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="rounded-lg w-10 h-10 flex items-center justify-center" style={{backgroundColor: '#EF4444'}}>
              <Calendar className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Portfolio History</h1>
              <p className="text-sm text-gray-600">Monthly snapshots and performance tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Action button would go here if needed */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">


        {/* View Options */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">View Options</h2>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'total' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('total')}
                  className="text-xs"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Total Portfolio
                </Button>
                <Button
                  variant={viewMode === 'by-type' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('by-type')}
                  className="text-xs"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  By Asset Type
                </Button>
                <Button
                  variant={viewMode === 'by-class' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('by-class')}
                  className="text-xs"
                >
                  <PieChart className="h-4 w-4 mr-1" />
                  By Asset Class
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Performance Chart */}
        <Card className="shadow-sm border border-gray-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Historical Performance</h3>
              <div className="flex items-center space-x-4">
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
                <div className="text-sm text-gray-500">
                  {chartData.length} data points
                </div>
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="period" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      domain={chartData.length > 0 ? [0, 'dataMax + 100'] : [0, 100]}
                      tickFormatter={(value) => value >= 1000 ? `€${(value / 1000).toFixed(0)}k` : `€${value}`}
                    />
                    <Tooltip 
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg min-w-64">
                              <p className="font-semibold text-gray-900 mb-3">{label}</p>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Total Portfolio Value:</span>
                                  <span className="font-mono font-medium">€{data.totalValue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Cost Basis (Invested):</span>
                                  <span className="font-mono font-medium">€{data.totalInvested.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Net Deposits:</span>
                                  <span className="font-mono font-medium">€{data.netDeposits.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Monthly P&L:</span>
                                  <span className={`font-mono font-medium ${data.monthlyPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {data.monthlyPL >= 0 ? '+' : ''}€{data.monthlyPL.toLocaleString()}
                                  </span>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                  <p className="text-xs text-gray-500 mb-2">Portfolio Breakdown:</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between">
                                      <span style={{color: CATEGORY_COLORS.stocks}}>● Stocks:</span>
                                      <span>€{data.stocksValue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{color: CATEGORY_COLORS.etf}}>● ETFs:</span>
                                      <span>€{data.etfValue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{color: CATEGORY_COLORS.crypto}}>● Crypto:</span>
                                      <span>€{data.cryptoValue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{color: CATEGORY_COLORS.bonds}}>● Bonds:</span>
                                      <span>€{data.bondsValue.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    
                    {/* Net Deposits Line - Always shown */}
                    <Line 
                      type="monotone" 
                      dataKey="netDeposits" 
                      stroke="#9CA3AF" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Net Deposits"
                      dot={{ fill: '#9CA3AF', strokeWidth: 2 }}
                    />
                    
                    {/* Conditional rendering based on view mode */}
                    {viewMode === 'total' && (
                      <>
                        <Line 
                          type="monotone" 
                          dataKey="totalValue" 
                          stroke="#1f2937" 
                          strokeWidth={3}
                          name="Total Portfolio"
                          dot={{ fill: '#1f2937', strokeWidth: 2, r: 5 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="totalInvested" 
                          stroke="#6b7280" 
                          strokeWidth={2}
                          name="Cost Basis"
                          dot={{ fill: '#6b7280', strokeWidth: 2 }}
                        />
                      </>
                    )}
                    
                    {(viewMode === 'by-type' || viewMode === 'by-class') && (
                      <>
                        <Line 
                          type="monotone" 
                          dataKey="stocksValue" 
                          stroke={CATEGORY_COLORS.stocks} 
                          strokeWidth={2}
                          name={categoryDisplayNames.stocks}
                          dot={{ fill: CATEGORY_COLORS.stocks, strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="etfValue" 
                          stroke={CATEGORY_COLORS.etf} 
                          strokeWidth={2}
                          name={categoryDisplayNames.etf}
                          dot={{ fill: CATEGORY_COLORS.etf, strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cryptoValue" 
                          stroke={CATEGORY_COLORS.crypto} 
                          strokeWidth={2}
                          name={categoryDisplayNames.crypto}
                          dot={{ fill: CATEGORY_COLORS.crypto, strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bondsValue" 
                          stroke={CATEGORY_COLORS.bonds} 
                          strokeWidth={2}
                          name={categoryDisplayNames.bonds}
                          dot={{ fill: CATEGORY_COLORS.bonds, strokeWidth: 2 }}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <ChartLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm">No historical data yet</p>
                  <p className="text-sm text-gray-400">Save portfolio snapshots from the Dashboard to build your history</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Snapshots Table */}
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">All Snapshots</h3>
            
            {snapshots && snapshots.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Total Value</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Invested</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Net Deposits</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Monthly P&L</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Return %</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((snapshot, index) => {
                      const monthNames = [
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ];
                      const totalPL = parseFloat(snapshot.totalPL);
                      const totalPLPercent = parseFloat(snapshot.totalPLPercent);
                      const monthKey = `${snapshot.year}-${snapshot.month}`;
                      const netDeposits = calculateNetDeposits[monthKey] || parseFloat(snapshot.totalInvested);
                      
                      // Get monthly data with proper error handling
                      let monthlyData = { monthlyTransactions: [], monthlyDividends: [], monthlyDeposits: [] };
                      try {
                        monthlyData = getMonthlyData(snapshot.id, snapshot.month, snapshot.year);
                      } catch (error) {
                        console.warn('Error getting monthly data:', error);
                      }
                      
                      return (
                        <React.Fragment key={snapshot.id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSnapshotExpansion(snapshot.id)}
                                  className="p-1 mr-2"
                                >
                                  {expandedSnapshots.has(snapshot.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                {monthNames[snapshot.month - 1]} {snapshot.year}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              €{parseFloat(snapshot.totalValue).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              €{parseFloat(snapshot.totalInvested).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-gray-600">
                              €{netDeposits.toLocaleString()}
                            </td>
                            <td className={`py-3 px-4 text-right font-mono ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {totalPL >= 0 ? '+' : '–'}€{Math.abs(totalPL).toLocaleString()}
                            </td>
                            <td className={`py-3 px-4 text-right font-mono ${totalPLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {totalPLPercent >= 0 ? '+' : '–'}{Math.abs(totalPLPercent).toFixed(2)}%
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => handleEditSnapshot(snapshot)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteSnapshot(snapshot)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {expandedSnapshots.has(snapshot.id) && (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 bg-gray-50">
                              <div className="space-y-6">
                                {/* Monthly Activity Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Transactions */}
                                  <div className="bg-white rounded-lg p-4 border">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                      <Activity className="h-4 w-4 mr-2 text-blue-600" />
                                      Transactions ({monthlyData.monthlyTransactions.length})
                                    </h4>
                                    {monthlyData.monthlyTransactions.length > 0 ? (
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {monthlyData.monthlyTransactions.map((transaction: any) => (
                                          <div key={transaction.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                              {(() => {
                                                const iconData = getAssetIcon(transaction.asset?.category || 'stocks');
                                                const IconComponent = iconData.icon;
                                                return <IconComponent className="h-4 w-4 text-gray-600" />;
                                              })()}
                                              <span className="text-gray-700">{transaction.asset?.name || 'Unknown Asset'}</span>
                                              <span className={`text-xs px-2 py-1 rounded ${
                                                transaction.type === 'buy' 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-red-100 text-red-800'
                                              }`}>
                                                {transaction.type?.toUpperCase() || 'UNKNOWN'}
                                              </span>
                                            </div>
                                            <span className="font-mono text-gray-900">
                                              €{(parseFloat(transaction.amount) || 0).toLocaleString()}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">No transactions this month</p>
                                    )}
                                  </div>

                                  {/* Dividends */}
                                  <div className="bg-white rounded-lg p-4 border">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                      <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                                      Dividends ({monthlyData.monthlyDividends.length})
                                    </h4>
                                    {monthlyData.monthlyDividends.length > 0 ? (
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {monthlyData.monthlyDividends.map((dividend: any) => (
                                          <div key={dividend.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                              {(() => {
                                                const iconData = getAssetIcon(dividend.asset?.category || 'stocks');
                                                const IconComponent = iconData.icon;
                                                return <IconComponent className="h-4 w-4 text-gray-600" />;
                                              })()}
                                              <span className="text-gray-700">{dividend.asset?.name || 'Unknown Asset'}</span>
                                            </div>
                                            <span className="font-mono text-green-600">
                                              €{(Number(dividend.amount) || 0).toLocaleString()}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">No dividends this month</p>
                                    )}
                                  </div>

                                  {/* Cash Movements */}
                                  <div className="bg-white rounded-lg p-4 border">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                      <TrendingDown className="h-4 w-4 mr-2 text-gray-600" />
                                      Cash Movements ({monthlyData.monthlyDeposits.length})
                                    </h4>
                                    {monthlyData.monthlyDeposits.length > 0 ? (
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {monthlyData.monthlyDeposits.map((deposit: any) => (
                                          <div key={deposit.id} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700 capitalize">{deposit.type || 'movement'}</span>
                                            <span className={`font-mono ${
                                              deposit.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                              {deposit.type === 'deposit' ? '+' : '-'}€{(parseFloat(deposit.amount) || 0).toLocaleString()}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">No cash movements this month</p>
                                    )}
                                  </div>
                                </div>

                                {/* Category Breakdown */}
                                <div className="bg-white rounded-lg p-4 border">
                                  <h4 className="font-medium text-gray-900 mb-4">Asset Category Breakdown</h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-gray-200">
                                          <th className="text-left py-2 font-medium text-gray-600">Category</th>
                                          <th className="text-right py-2 font-medium text-gray-600">Market Value</th>
                                          <th className="text-right py-2 font-medium text-gray-600">Invested</th>
                                          <th className="text-right py-2 font-medium text-gray-600">P&L</th>
                                          <th className="text-right py-2 font-medium text-gray-600">P&L %</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(() => {
                                          // Parse category details to get invested amounts and P&L
                                          let categoryDetails: any = {};
                                          try {
                                            categoryDetails = snapshot.categoryDetails ? JSON.parse(snapshot.categoryDetails) : {};
                                          } catch (e) {
                                            console.warn('Failed to parse category details:', e);
                                          }

                                          const investedData = categoryDetails.invested || {};
                                          const plData = categoryDetails.pl || {};
                                          const plPercentData = categoryDetails.plPercent || {};

                                          return [
                                            { 
                                              key: 'stocks', 
                                              name: categoryDisplayNames.stocks, 
                                              value: snapshot.stocksValue || '0', 
                                              invested: investedData.stocks?.toString() || '0', 
                                              pl: plData.stocks || 0,
                                              plPercent: plPercentData.stocks || 0,
                                              color: CATEGORY_COLORS.stocks 
                                            },
                                            { 
                                              key: 'etf', 
                                              name: categoryDisplayNames.etf, 
                                              value: snapshot.etfValue || '0', 
                                              invested: investedData.etf?.toString() || '0', 
                                              pl: plData.etf || 0,
                                              plPercent: plPercentData.etf || 0,
                                              color: CATEGORY_COLORS.etf 
                                            },
                                            { 
                                              key: 'crypto', 
                                              name: categoryDisplayNames.crypto, 
                                              value: snapshot.cryptoValue || '0', 
                                              invested: investedData.crypto?.toString() || '0', 
                                              pl: plData.crypto || 0,
                                              plPercent: plPercentData.crypto || 0,
                                              color: CATEGORY_COLORS.crypto 
                                            },
                                            { 
                                              key: 'bonds', 
                                              name: categoryDisplayNames.bonds, 
                                              value: snapshot.bondsValue || '0', 
                                              invested: investedData.bonds?.toString() || '0', 
                                              pl: plData.bonds || 0,
                                              plPercent: plPercentData.bonds || 0,
                                              color: CATEGORY_COLORS.bonds 
                                            }
                                          ];
                                        })().map(category => {
                                          const totalValue = parseFloat(category.value);
                                          const invested = parseFloat(category.invested);
                                          const pl = category.pl !== undefined && category.pl !== null ? category.pl : (totalValue - invested);
                                          const plPercent = category.plPercent !== undefined && category.plPercent !== null ? category.plPercent : (invested > 0 ? (pl / invested) * 100 : 0);
                                          
                                          if (totalValue === 0 && invested === 0) return null;
                                          
                                          return (
                                            <tr key={category.key} className="border-b border-gray-100">
                                              <td className="py-2">
                                                <div className="flex items-center">
                                                  <span className="inline-block w-3 h-3 rounded-full mr-3" style={{ backgroundColor: category.color }}></span>
                                                  {category.name}
                                                </div>
                                              </td>
                                              <td className="py-2 text-right font-mono">€{totalValue.toLocaleString()}</td>
                                              <td className="py-2 text-right font-mono">€{invested.toLocaleString()}</td>
                                              <td className={`py-2 text-right font-mono ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {pl >= 0 ? '+' : '–'}€{Math.abs(pl).toLocaleString()}
                                              </td>
                                              <td className={`py-2 text-right font-mono ${plPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {plPercent >= 0 ? '+' : '–'}{Math.abs(plPercent).toFixed(2)}%
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm">No snapshots saved yet</p>
                <p className="text-sm text-gray-400">Use the "Save Snapshot" button on the Dashboard to record your portfolio history</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portfolio Snapshot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this portfolio snapshot? This action cannot be undone.
              {selectedSnapshot && (
                <div className="mt-2 text-sm">
                  <strong>Period:</strong> {new Date(selectedSnapshot.year, selectedSnapshot.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSnapshot && deleteSnapshotMutation.mutate(selectedSnapshot.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Snapshot Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Portfolio Snapshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month">Month</Label>
                <Select value={editForm.month.toString()} onValueChange={(value) => setEditForm(prev => ({ ...prev, month: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Gennaio</SelectItem>
                    <SelectItem value="2">Febbraio</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Aprile</SelectItem>
                    <SelectItem value="5">Maggio</SelectItem>
                    <SelectItem value="6">Giugno</SelectItem>
                    <SelectItem value="7">Luglio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Settembre</SelectItem>
                    <SelectItem value="10">Ottobre</SelectItem>
                    <SelectItem value="11">Novembre</SelectItem>
                    <SelectItem value="12">Dicembre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={editForm.year}
                  onChange={(e) => setEditForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="totalValue">Total Portfolio Value (€)</Label>
              <Input
                id="totalValue"
                type="number"
                step="0.01"
                value={editForm.totalValue}
                onChange={(e) => setEditForm(prev => ({ ...prev, totalValue: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="totalInvested">Total Invested (€)</Label>
              <Input
                id="totalInvested"
                type="number"
                step="0.01"
                value={editForm.totalInvested}
                onChange={(e) => setEditForm(prev => ({ ...prev, totalInvested: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateSnapshotMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}