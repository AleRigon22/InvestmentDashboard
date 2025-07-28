import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SellTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
  currentQuantity?: number;
  currentPrice?: number;
}

export default function SellTransactionModal({ open, onOpenChange, asset, currentQuantity, currentPrice }: SellTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    quantity: "",
    unitPrice: "",
    fees: "0",
    date: new Date().toISOString().split('T')[0],
  });

  const handleSellAll = () => {
    if (currentQuantity) {
      setFormData(prev => ({
        ...prev,
        quantity: currentQuantity.toString(),
        unitPrice: currentPrice ? currentPrice.toString() : prev.unitPrice
      }));
    }
  };

  const createTransactionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({ title: "Sell transaction added successfully!" });
      onOpenChange(false);
      setFormData({
        quantity: "",
        unitPrice: "",
        fees: "0",
        date: new Date().toISOString().split('T')[0],
      });
    },
    onError: () => {
      toast({ title: "Failed to add transaction", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    
    const sellQuantity = parseFloat(formData.quantity);
    if (currentQuantity && sellQuantity > currentQuantity) {
      toast({ 
        title: "Invalid quantity", 
        description: `You can only sell up to ${currentQuantity.toFixed(3)} shares`,
        variant: "destructive" 
      });
      return;
    }
    
    createTransactionMutation.mutate({
      assetId: asset.id,
      type: "sell",
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      fees: formData.fees || "0",
      date: formData.date,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sell {asset?.name || "Asset"}</DialogTitle>
          <DialogDescription>
            Record a sell transaction for your asset. You can sell all or part of your holdings.
          </DialogDescription>
        </DialogHeader>
        
        {asset && (
          <div className="bg-red-50 p-3 rounded-lg mb-4">
            <div className="text-sm font-medium text-red-900">{asset.name}</div>
            <div className="text-sm text-red-700">{asset.ticker} • {asset.category}</div>
            {currentQuantity && (
              <div className="text-sm text-red-600 mt-1">
                Available: {currentQuantity.toFixed(3)} shares
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Quantity</Label>
              {currentQuantity && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSellAll}
                  className="text-xs h-7 px-2"
                >
                  Sell All
                </Button>
              )}
            </div>
            <Input
              type="number"
              step="0.001"
              max={currentQuantity || undefined}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0"
              required
            />
          </div>
          
          <div>
            <Label>Unit Price</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label>Fees (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.fees}
              onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
              placeholder="0.00"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTransactionMutation.isPending}>
              {createTransactionMutation.isPending ? "Adding..." : "Add Sell Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}