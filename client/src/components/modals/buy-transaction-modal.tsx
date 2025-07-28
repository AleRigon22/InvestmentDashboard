import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BuyTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
}

export default function BuyTransactionModal({ open, onOpenChange, asset }: BuyTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    quantity: "",
    unitPrice: "",
    fees: "0",
    date: new Date().toISOString().split('T')[0],
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({ title: "Buy transaction added successfully!" });
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
    
    createTransactionMutation.mutate({
      assetId: asset.id,
      type: "buy",
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
          <DialogTitle>Buy {asset?.name || "Asset"}</DialogTitle>
        </DialogHeader>
        
        {asset && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="text-sm font-medium text-blue-900">{asset.name}</div>
            <div className="text-sm text-blue-700">{asset.ticker} • {asset.category}</div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              step="0.001"
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
              {createTransactionMutation.isPending ? "Adding..." : "Add Buy Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}