import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Edit, Plus, Minus, AlertTriangle, Wallet, DollarSign, ArrowUpDown, Search } from "lucide-react";
import AddTransactionModal from "@/components/modals/add-transaction-modal";
import EditAssetModal from "@/components/modals/edit-asset-modal";
import BuyTransactionModal from "@/components/modals/buy-transaction-modal";
import SellTransactionModal from "@/components/modals/sell-transaction-modal";
import AddPriceModal from "@/components/modals/add-price-modal";
import { getAssetIcon, getCategoryColor } from "@/utils/asset-icons";
import TickerBadge from "@/components/ui/ticker-badge";
import MiniSparkline from "@/components/ui/mini-sparkline";
import ClosedPositions from "@/components/closed-positions";
import { categoryDisplayNames, type AssetCategory } from "@shared/schema";
import { useLocation } from "wouter";

export default function Holdings() {
  const [location, navigate] = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['stocks', 'etf', 'crypto', 'bonds']));
  const [expandedClosedPositions, setExpandedClosedPositions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'marketValue' | 'percentage' | 'quantity'>('marketValue');

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
  });

  const { data: transactions } = useQuery<Array<{
    id: number;
    type: 'buy' | 'sell';
    assetId: number;
    quantity: number;
    unitPrice: number;
    fees: number;
    date: string;
    asset: any;
  }>>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const holdings = portfolioOverview?.holdings || [];
  const hasHoldings = holdings.length > 0;

  // Helper functions

  // Generate mini sparkline data based on asset performance
  const generateSparklineData = (holding: any) => {
    const baseValue = holding.avgPrice * holding.quantity;
    const currentValue = holding.marketValue;
    const plPercent = holding.unrealizedPLPercent || 0;
    
    // Generate 7 data points showing the progression from buy price to current
    const points = [];
    for (let i = 0; i < 7; i++) {
      const progress = i / 6; // 0 to 1
      const value = baseValue + (currentValue - baseValue) * progress;
      // Add some randomness to make it look more realistic
      const randomFactor = 1 + (Math.random() - 0.5) * 0.1 * progress;
      points.push(value * randomFactor);
    }
    
    return points;
  };

  const getTotalFeesForAsset = (assetId: number) => {
    const total = (transactions || [])
      .filter(t => t.assetId === assetId)
      .reduce((total, t) => total + (Number(t.fees) || 0), 0);
    return isNaN(total) ? 0 : total;
  };

  const sortHoldings = (holdings: any[]) => {
    return [...holdings].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.asset.name.localeCompare(b.asset.name);
        case 'marketValue':
          return b.marketValue - a.marketValue;
        case 'percentage':
          return b.unrealizedPLPercent - a.unrealizedPLPercent;
        case 'quantity':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });
  };

  // Group holdings by standardized categories
  const groupedHoldings = holdings.reduce((acc, holding) => {
    let category = holding.asset.category.toLowerCase();
    // Normalize category names to standard 4 categories
    if (category === 'stock') category = 'stocks';
    if (category === 'fund') category = 'bonds';
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(holding);
    return acc;
  }, {} as Record<string, any[]>);

  // Define category order for consistent display
  const categoryOrder: AssetCategory[] = ['stocks', 'etf', 'crypto', 'bonds'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="rounded-lg w-10 h-10 flex items-center justify-center" style={{backgroundColor: '#10B981'}}>
              <Wallet className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Holdings</h1>
              <p className="text-sm text-gray-600">Your investment positions and portfolio holdings</p>
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
              Add Asset
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Sorting Controls */}
        {hasHoldings && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Portfolio Holdings</h2>
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary"
              >
                <option value="marketValue">Market Value</option>
                <option value="percentage">% Return</option>
                <option value="name">Asset Name</option>
                <option value="quantity">Quantity</option>
              </select>
            </div>
          </div>
        )}

      {hasHoldings ? (
        <div className="space-y-6">
          <Accordion type="multiple" value={Array.from(expandedCategories)} onValueChange={(value) => setExpandedCategories(new Set(value))}>
            {categoryOrder.map((categoryKey) => {
              const categoryHoldings = groupedHoldings[categoryKey] || [];
              if (categoryHoldings.length === 0) return null;

              const sortedHoldings = sortHoldings(categoryHoldings);

              return (
                <AccordionItem key={categoryKey} value={categoryKey}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="rounded-lg w-8 h-8 flex items-center justify-center"
                        style={{
                          backgroundColor: categoryKey === 'stocks' ? '#3B82F6' :
                                         categoryKey === 'etf' ? '#22C55E' :
                                         categoryKey === 'crypto' ? '#F97316' :
                                         categoryKey === 'bonds' ? '#A855F7' : '#6B7280'
                        }}
                      >
                        {(() => {
                          const IconComponent = getAssetIcon(categoryKey).icon;
                          return <IconComponent className="text-white h-4 w-4" />;
                        })()}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {categoryDisplayNames[categoryKey]} ({categoryHoldings.length})
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card className="shadow-sm border border-gray-200 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {sortedHoldings.map((holding: any) => {
                              const totalCost = holding.quantity * holding.avgPrice;
                              const totalFees = getTotalFeesForAsset(holding.asset.id);
                              
                              return (
                                <tr key={holding.asset.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-3">
                                      <TickerBadge 
                                        ticker={holding.asset.ticker} 
                                        category={holding.asset.category} 
                                      />
                                      <div>
                                        <div className="flex items-center space-x-2">
                                          <div className="text-sm font-medium text-gray-900">{holding.asset.name}</div>
                                          {totalFees > 0 && (
                                            <div className="relative group">
                                              <DollarSign className="h-3 w-3 text-orange-500" />
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                Total fees: €{totalFees.toFixed(2)}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <div className={`text-sm ${getCategoryColor(holding.asset.category)}`}>
                                            {holding.asset.ticker}
                                          </div>
                                          <MiniSparkline 
                                            data={generateSparklineData(holding)}
                                            width={50}
                                            height={16}
                                            className="opacity-75"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                      {holding.quantity.toFixed(3)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                      €{holding.avgPrice.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                      {holding.currentPrice > 0 ? (
                                        <button 
                                          onClick={() => {
                                            setSelectedAsset(holding.asset);
                                            setShowPriceModal(true);
                                          }}
                                          className="text-gray-900 hover:text-blue-600 hover:underline"
                                        >
                                          €{holding.currentPrice.toFixed(2)}
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => {
                                            setSelectedAsset(holding.asset);
                                            setShowPriceModal(true);
                                          }}
                                          className="flex items-center justify-end text-orange-600 hover:text-orange-700 text-xs"
                                        >
                                          <AlertTriangle className="h-4 w-4 mr-1" />
                                          Add Price
                                        </button>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                      €{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                      €{holding.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                      {holding.currentPrice > 0 ? (
                                        <>
                                          <div className={`font-medium ${holding.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {holding.unrealizedPL >= 0 ? '+' : '–'}€{Math.abs(holding.unrealizedPL).toFixed(2)}
                                          </div>
                                          <div className={`text-xs ${holding.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {holding.unrealizedPLPercent >= 0 ? '+' : '–'}{Math.abs(holding.unrealizedPLPercent).toFixed(2)}%
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                      )}
                                    </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    <div className="flex justify-center space-x-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-green-600 hover:text-green-700"
                                        onClick={() => {
                                          setSelectedAsset(holding.asset);
                                          setShowBuyModal(true);
                                        }}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => {
                                          setSelectedAsset(holding.asset);
                                          setShowSellModal(true);
                                        }}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-gray-600 hover:text-gray-700"
                                        onClick={() => {
                                          setSelectedAsset(holding.asset);
                                          setSelectedHolding(holding);
                                          setShowEditModal(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-blue-600 hover:text-blue-700"
                                        onClick={() => navigate(`/asset/${holding.asset.ticker}`)}
                                      >
                                        <Search className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      ) : (
        <Card className="shadow-sm border border-gray-200 overflow-hidden">
          <CardContent className="p-8 text-center text-gray-500">
            No holdings yet. Add some transactions to get started.
          </CardContent>
        </Card>
      )}

      {/* Closed Positions Section with Accordion Style */}
      <div className="mt-8">
        <Accordion type="multiple" value={expandedClosedPositions} onValueChange={setExpandedClosedPositions}>
          <AccordionItem value="closed-positions">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg w-8 h-8 flex items-center justify-center bg-gray-600">
                  <Wallet className="text-white h-4 w-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Closed Positions
                </h3>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ClosedPositions />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      </main>

      {/* Modals */}
      <AddTransactionModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
      
      <EditAssetModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        asset={selectedAsset}
        holdingData={selectedHolding ? {
          quantity: selectedHolding.quantity,
          avgPrice: selectedHolding.avgPrice,
          currentPrice: selectedHolding.currentPrice,
          marketValue: selectedHolding.marketValue,
        } : undefined}
      />
      
      <BuyTransactionModal 
        open={showBuyModal} 
        onOpenChange={setShowBuyModal}
        asset={selectedAsset}
      />
      
      <SellTransactionModal 
        open={showSellModal} 
        onOpenChange={setShowSellModal}
        asset={selectedAsset}
        currentQuantity={holdings.find((h: any) => h.asset.id === selectedAsset?.id)?.quantity}
        currentPrice={holdings.find((h: any) => h.asset.id === selectedAsset?.id)?.currentPrice}
      />
      
      <AddPriceModal 
        open={showPriceModal} 
        onOpenChange={setShowPriceModal}
        asset={selectedAsset}
      />
    </div>
  );
}