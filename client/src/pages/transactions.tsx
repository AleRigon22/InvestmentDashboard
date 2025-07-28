import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, ArrowUpDown, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Banknote } from "lucide-react";
import AddTransactionModal from "@/components/modals/add-transaction-modal";
import EditTransactionModal from "@/components/modals/edit-transaction-modal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import TickerBadge from "@/components/ui/ticker-badge";
import { getAssetIcon } from "@/utils/asset-icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Transactions() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  
  // Filter and sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: closedPositions } = useQuery<any[]>({
    queryKey: ["/api/portfolio/closed-positions"],
  });

  // Calculate realized P&L for sell transactions
  const calculateRealizedPL = (transaction: any) => {
    if (transaction.type !== 'sell') return null;
    
    // Find the corresponding closed position for this transaction
    const closedPosition = closedPositions?.find(pos => 
      pos.asset.id === transaction.assetId && 
      new Date(pos.sellDate).toDateString() === new Date(transaction.date).toDateString()
    );
    
    if (closedPosition) {
      const realizedPL = closedPosition.realizedPL;
      const realizedPLPercent = closedPosition.realizedPLPercent;
      return { realizedPL, realizedPLPercent };
    }
    
    return null;
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = transactions.filter((transaction: any) => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        transaction.asset?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.asset?.ticker?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || transaction.asset?.category === categoryFilter;
      
      return matchesSearch && matchesType && matchesCategory;
    });
    
    // Sort transactions
    filtered.sort((a: any, b: any) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case "date":
          compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          const totalA = Number(a.quantity) * Number(a.unitPrice) + Number(a.fees);
          const totalB = Number(b.quantity) * Number(b.unitPrice) + Number(b.fees);
          compareValue = totalA - totalB;
          break;
        case "quantity":
          compareValue = Number(a.quantity) - Number(b.quantity);
          break;
        case "asset":
          compareValue = (a.asset?.name || '').localeCompare(b.asset?.name || '');
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === "asc" ? compareValue : -compareValue;
    });
    
    return filtered;
  }, [transactions, searchQuery, typeFilter, categoryFilter, sortBy, sortOrder]);

  // Get unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    if (!transactions) return [];
    const categories = new Set(transactions.map((t: any) => t.asset?.category).filter(Boolean));
    return Array.from(categories);
  }, [transactions]);

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({ title: "Transaction deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete transaction", variant: "destructive" });
    },
  });

  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDelete = (transaction: any) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteTransactionMutation.mutate(transactionToDelete.id);
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

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
            <div className="rounded-lg w-10 h-10 flex items-center justify-center" style={{backgroundColor: '#F59E0B'}}>
              <Plus className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Transactions</h1>
              <p className="text-sm text-gray-600">Buy and sell transaction history</p>
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
              Add Transaction
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 space-y-6">

      {/* Filters and Search */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy Only</SelectItem>
                <SelectItem value="sell">Sell Only</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Asset Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="asset">Asset Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            <div className="text-sm text-gray-500">
              {filteredAndSortedTransactions.length} of {transactions?.length || 0} transactions
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {getSortIcon("date")}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("asset")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Asset</span>
                      {getSortIcon("asset")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Quantity</span>
                      {getSortIcon("quantity")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fees</th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Total</span>
                      {getSortIcon("amount")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Realized P&L</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!filteredAndSortedTransactions || filteredAndSortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery || typeFilter !== "all" || categoryFilter !== "all" 
                        ? "No transactions match your current filters."
                        : "No transactions yet. Add your first transaction to get started."
                      }
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTransactions.map((transaction: any) => {
                    const total = Number(transaction.quantity) * Number(transaction.unitPrice) + Number(transaction.fees);
                    const fees = Number(transaction.fees);
                    const realizedPLData = calculateRealizedPL(transaction);
                    const assetIconData = getAssetIcon(transaction.asset?.category || 'stock');
                    const AssetIcon = assetIconData.icon;
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="flex items-center space-x-2">
                                <AssetIcon className="h-5 w-5 text-gray-400" />
                                <TickerBadge 
                                  ticker={transaction.asset?.ticker || 'N/A'} 
                                  category={transaction.asset?.category || 'stock'} 
                                  size="sm" 
                                />
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.asset?.name || 'Unknown Asset'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transaction.asset?.ticker || ''} • {transaction.asset?.category || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge 
                            variant={transaction.type === 'buy' ? 'default' : 'destructive'}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'buy' 
                                ? 'bg-green-500 hover:bg-green-600 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            {transaction.type === 'buy' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {transaction.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {Number(transaction.quantity).toFixed(3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          <div className="relative group">
                            €{Number(transaction.unitPrice).toFixed(2)}
                            <div className="absolute bottom-full right-0 mb-2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              Unit price: €{Number(transaction.unitPrice).toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {fees > 0 ? (
                            <div className="flex items-center justify-end space-x-1">
                              <Banknote className="h-3 w-3 text-orange-500" />
                              <span>€{fees.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">–</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          €{total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {realizedPLData ? (
                            <div className="space-y-1">
                              <div className={`font-medium ${realizedPLData.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {realizedPLData.realizedPL >= 0 ? '+' : ''}€{realizedPLData.realizedPL.toFixed(2)}
                              </div>
                              <div className={`text-xs ${realizedPLData.realizedPLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {realizedPLData.realizedPLPercent >= 0 ? '+' : ''}{realizedPLData.realizedPLPercent.toFixed(2)}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">–</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-700"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(transaction)}
                              disabled={deleteTransactionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
      </main>

      {/* Modals */}
      <AddTransactionModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
      
      <EditTransactionModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        transaction={selectedTransaction}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTransactionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message={transactionToDelete ? 
          `Are you sure you want to delete this ${transactionToDelete.type} transaction for ${transactionToDelete.asset?.name || 'Unknown Asset'}?` :
          'Are you sure you want to delete this transaction?'}
        isLoading={deleteTransactionMutation.isPending}
      />
    </div>
  );
}
