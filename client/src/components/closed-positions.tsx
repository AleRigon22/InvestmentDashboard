import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
import TickerBadge from "@/components/ui/ticker-badge";
import { getCategoryColor, getAssetIcon } from "@/utils/asset-icons";
import { categoryDisplayNames, type AssetCategory } from "@shared/schema";
import { useLocation } from "wouter";

interface ClosedPosition {
  asset: any;
  totalBought: number;
  totalSold: number;
  avgBuyPrice: number;
  avgSellPrice: number;
  realizedPL: number;
  realizedPLPercent: number;
  holdingPeriod: number; // days
  firstBuyDate: string;
  lastSellDate: string;
}

export default function ClosedPositions() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();

  const { data: closedPositions, isLoading } = useQuery<ClosedPosition[]>({
    queryKey: ["/api/portfolio/closed-positions"],
  });

  const deletePositionMutation = useMutation({
    mutationFn: (cycleId: string) => apiRequest("DELETE", `/api/portfolio/closed-positions/${cycleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/closed-positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({ title: "Closed position deleted successfully!" });
      setShowDeleteDialog(false);
      setSelectedPosition(null);
    },
    onError: () => {
      toast({ title: "Failed to delete closed position", variant: "destructive" });
    },
  });

  const handleDeletePosition = (position: ClosedPosition) => {
    setSelectedPosition(position);
    setShowDeleteDialog(true);
  };

  const positions = closedPositions || [];

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="pb-2">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-48"></div>
        </CardHeader>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="shadow-sm border border-gray-200 overflow-hidden">
        <CardContent className="p-8 text-center text-gray-500">
          No closed positions yet. Complete some trades to see your trading history here.
        </CardContent>
      </Card>
    );
  }

  // Group positions by standardized categories
  const groupedPositions = positions.reduce((acc, position) => {
    let category = position.asset.category.toLowerCase();
    // Normalize category names to standard 4 categories
    if (category === 'stock') category = 'stocks';
    if (category === 'fund') category = 'bonds';
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(position);
    return acc;
  }, {} as Record<string, any[]>);

  // Define category order for consistent display
  const categoryOrder: AssetCategory[] = ['stocks', 'etf', 'crypto', 'bonds'];

  return (
    <div className="space-y-4">
      <Accordion type="multiple" value={Array.from(expandedCategories)} onValueChange={(value) => setExpandedCategories(new Set(value))}>
        {categoryOrder.map((categoryKey) => {
          const categoryPositions = groupedPositions[categoryKey] || [];
          if (categoryPositions.length === 0) return null;

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
                  <h4 className="text-md font-semibold text-gray-900">
                    {categoryDisplayNames[categoryKey]} ({categoryPositions.length})
                  </h4>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="shadow-sm border border-gray-200 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bought</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Buy</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Sell</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Realized P&L</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categoryPositions.map((position, index) => (
                            <tr key={`${categoryKey}-${index}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <TickerBadge 
                                    ticker={position.asset.ticker} 
                                    category={position.asset.category} 
                                    size="sm"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{position.asset.name}</div>
                                    <div className="flex items-center space-x-2">
                                      <div className={`text-sm ${getCategoryColor(position.asset.category)}`}>
                                        {position.asset.ticker}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                {position.totalBought.toFixed(3)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                {position.totalSold.toFixed(3)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                €{position.avgBuyPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                €{position.avgSellPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <div className={`flex items-center justify-end space-x-1 ${position.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {position.realizedPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                  <div>
                                    <div className="font-medium">
                                      {position.realizedPL >= 0 ? '+' : '–'}€{Math.abs(position.realizedPL).toFixed(2)}
                                    </div>
                                    <div className="text-xs">
                                      {position.realizedPLPercent >= 0 ? '+' : '–'}{Math.abs(position.realizedPLPercent).toFixed(2)}%
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                <div>
                                  <div className="font-medium">{position.holdingPeriod} days</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(position.firstBuyDate).toLocaleDateString()} - {new Date(position.lastSellDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/asset/${position.asset.ticker}?closed=${position.cycleId}`)}
                                    title="View Asset Details"
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Search className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePosition(position)}
                                    title="Delete Position"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
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
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Closed Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this closed position for {selectedPosition?.asset?.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedPosition && deletePositionMutation.mutate(selectedPosition.cycleId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}