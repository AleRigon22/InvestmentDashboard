import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PortfolioSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: {
    totalValue: number;
    totalInvested: number;
    totalPL: number;
    totalPLPercent: number;
    allocationByCategory?: Array<{ category: string; value: number; percentage: number }>;
  };
}

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

export function PortfolioSnapshotModal({ isOpen, onClose, portfolioData }: PortfolioSnapshotModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSnapshotMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/portfolio/snapshots', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/overview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Success",
        description: "Portfolio snapshot saved successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save portfolio snapshot",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Calculate category values from allocation data
    const categoryBreakdown = {
      stocksValue: "0",
      etfsValue: "0", 
      cryptoValue: "0",
      bondsValue: "0"
    };

    if (portfolioData.allocationByCategory) {
      portfolioData.allocationByCategory.forEach(allocation => {
        const categoryValue = allocation.value.toString();
        switch (allocation.category.toLowerCase()) {
          case 'stock':
            categoryBreakdown.stocksValue = categoryValue;
            break;
          case 'etf':
            categoryBreakdown.etfsValue = categoryValue;
            break;
          case 'crypto':
            categoryBreakdown.cryptoValue = categoryValue;
            break;
          case 'fund':
          case 'bond':
            categoryBreakdown.bondsValue = categoryValue;
            break;
        }
      });
    }

    const snapshotData = {
      month: selectedMonth,
      year: selectedYear,
      totalValue: portfolioData.totalValue.toString(),
      totalInvested: portfolioData.totalInvested.toString(),
      totalPL: portfolioData.totalPL.toString(),
      totalPLPercent: portfolioData.totalPLPercent.toString(),
      ...categoryBreakdown
    };

    createSnapshotMutation.mutate(snapshotData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Portfolio Snapshot</DialogTitle>
          <DialogDescription>
            Capture your current portfolio performance as a historical data point for tracking progress over time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium mb-2">Snapshot Data</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-mono">€{portfolioData.totalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Invested:</span>
                <span className="font-mono">€{portfolioData.totalInvested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>P&L:</span>
                <span className={`font-mono ${portfolioData.totalPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  €{portfolioData.totalPL.toLocaleString()} ({portfolioData.totalPLPercent >= 0 ? '+' : ''}{portfolioData.totalPLPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={createSnapshotMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createSnapshotMutation.isPending}>
              {createSnapshotMutation.isPending ? "Saving..." : "Save Snapshot"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}