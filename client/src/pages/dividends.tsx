import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Coins, Calendar, BarChart3, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import DividendChart from "@/components/charts/dividend-chart";
import AddDividendModal from "@/components/modals/add-dividend-modal";
import EditDividendModal from "@/components/modals/edit-dividend-modal";
import TickerBadge from "@/components/ui/ticker-badge";
import { getAssetIcon } from "@/utils/asset-icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Dividends() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDividend, setSelectedDividend] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'asset' | 'total' | 'lastDate'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteDividendMutation = useMutation({
    mutationFn: async (dividendId: number) => {
      const response = await apiRequest("DELETE", `/api/dividends/${dividendId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dividends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dividends/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({
        title: "Success",
        description: "Dividend deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete dividend",
        variant: "destructive",
      });
    },
  });

  const handleDeleteDividend = (dividendId: number) => {
    if (window.confirm('Are you sure you want to delete this dividend? This action cannot be undone.')) {
      deleteDividendMutation.mutate(dividendId);
    }
  };

  const { data: dividends, isLoading } = useQuery<any[]>({
    queryKey: ["/api/dividends"],
  });

  const { data: dividendsSummary } = useQuery<{
    ytd: number;
    thisMonth: number;
    avgMonthly: number;
  }>({
    queryKey: ["/api/dividends/summary"],
  });

  // Calculate dividend totals per asset
  const dividendTotalsByAsset = useMemo(() => {
    if (!dividends) return [];
    
    const assetTotals = new Map();
    
    dividends.forEach((dividend: any) => {
      const assetId = dividend.asset?.id;
      const assetName = dividend.asset?.name || 'Unknown Asset';
      const assetTicker = dividend.asset?.ticker || 'N/A';
      const assetCategory = dividend.asset?.category || 'stock';
      const amount = Number(dividend.amount);
      const paymentDate = new Date(dividend.paymentDate);
      
      if (assetTotals.has(assetId)) {
        const existing = assetTotals.get(assetId);
        existing.total += amount;
        if (paymentDate > existing.lastDate) {
          existing.lastDate = paymentDate;
        }
      } else {
        assetTotals.set(assetId, {
          asset: { id: assetId, name: assetName, ticker: assetTicker, category: assetCategory },
          total: amount,
          lastDate: paymentDate
        });
      }
    });
    
    return Array.from(assetTotals.values());
  }, [dividends]);

  // Sort dividend totals
  const sortedDividendTotals = useMemo(() => {
    const sorted = [...dividendTotalsByAsset].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'asset':
          compareValue = a.asset.name.localeCompare(b.asset.name);
          break;
        case 'total':
          compareValue = a.total - b.total;
          break;
        case 'lastDate':
          compareValue = a.lastDate.getTime() - b.lastDate.getTime();
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    return sorted;
  }, [dividendTotalsByAsset, sortBy, sortOrder]);

  const handleSort = (field: 'asset' | 'total' | 'lastDate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: 'asset' | 'total' | 'lastDate') => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Filter and paginate dividend records
  const filteredDividends = useMemo(() => {
    if (!dividends) return [];
    
    return dividends.filter((dividend: any) => {
      const assetName = dividend.asset?.name?.toLowerCase() || '';
      const assetTicker = dividend.asset?.ticker?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return assetName.includes(searchLower) || assetTicker.includes(searchLower);
    });
  }, [dividends, searchTerm]);

  const sortedFilteredDividends = useMemo(() => {
    return [...filteredDividends].sort((a, b) => {
      const aDate = new Date(a.paymentDate);
      const bDate = new Date(b.paymentDate);
      return bDate.getTime() - aDate.getTime(); // Most recent first
    });
  }, [filteredDividends]);

  const paginatedDividends = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedFilteredDividends.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedFilteredDividends, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedFilteredDividends.length / itemsPerPage);

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
            <div className="rounded-lg w-10 h-10 flex items-center justify-center" style={{backgroundColor: '#8B5CF6'}}>
              <Coins className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Dividends</h1>
              <p className="text-sm text-gray-600">Dividend payments and income tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddModal(true)}
              className="text-primary border-primary hover:bg-primary hover:text-white"
            >
              <Plus size={16} className="mr-2" />
              Add Dividend
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 space-y-6">

      {/* Dividend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">YTD Dividends</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{dividendsSummary?.ytd?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-green-50 rounded-full p-3">
                <Coins className="text-green-600 h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{dividendsSummary?.thisMonth?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-blue-50 rounded-full p-3">
                <Calendar className="text-blue-600 h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Monthly</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{dividendsSummary?.avgMonthly?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-purple-50 rounded-full p-3">
                <BarChart3 className="text-purple-600 h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dividend Chart */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Dividend Flow</h3>
          <DividendChart dividends={dividends} />
        </CardContent>
      </Card>

      {/* Total Dividends per Asset */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Dividends by Asset</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('asset')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Asset</span>
                      {getSortIcon('asset')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Total Received</span>
                      {getSortIcon('total')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastDate')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Last Dividend Date</span>
                      {getSortIcon('lastDate')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDividendTotals.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No dividend data available.
                    </td>
                  </tr>
                ) : (
                  sortedDividendTotals.map((assetTotal: any) => {
                    const assetIconData = getAssetIcon(assetTotal.asset.category);
                    const AssetIcon = assetIconData.icon;
                    
                    return (
                      <tr key={assetTotal.asset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <AssetIcon className="h-5 w-5 text-gray-400" />
                            <TickerBadge 
                              ticker={assetTotal.asset.ticker || 'N/A'} 
                              category={assetTotal.asset.category} 
                              size="sm" 
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assetTotal.asset.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {assetTotal.asset.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          €{assetTotal.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {assetTotal.lastDate.toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Dividends */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Dividend Payments</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by asset name or ticker..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-10 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDividends.length > 0 ? (
                  paginatedDividends.map((dividend: any) => {
                    const assetIconData = getAssetIcon(dividend.asset?.category);
                    const AssetIcon = assetIconData.icon;
                    
                    return (
                      <tr key={dividend.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <AssetIcon className="h-5 w-5 text-gray-400" />
                            <TickerBadge 
                              ticker={dividend.asset?.ticker || 'N/A'} 
                              category={dividend.asset?.category} 
                              size="sm" 
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {dividend.asset?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {dividend.asset?.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {new Date(dividend.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          €{Number(dividend.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-left text-sm text-gray-500 max-w-32 truncate">
                          {dividend.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-700"
                              onClick={() => {
                                setSelectedDividend(dividend);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteDividend(dividend.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? (
                        <div>
                          <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          No dividend payments found for "{searchTerm}".
                        </div>
                      ) : (
                        <div>
                          <Coins className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          No dividend payments recorded yet.
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedFilteredDividends.length)} of {sortedFilteredDividends.length} dividends
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </main>

      {/* Modals */}
      <AddDividendModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
      
      <EditDividendModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        dividend={selectedDividend}
      />
    </div>
  );
}
