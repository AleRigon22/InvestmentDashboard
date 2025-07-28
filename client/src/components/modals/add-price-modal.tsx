import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddPriceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
}

export default function AddPriceModal({ open, onOpenChange, asset }: AddPriceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    closePrice: "",
  });

  const createPriceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/prices", data),
    onSuccess: () => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/snapshots"] });
      toast({ title: "Price updated successfully!" });
      onOpenChange(false);
      setFormData({
        closePrice: "",
      });
    },
    onError: (error: any) => {
      console.error('Price update error:', error);
      const message = error?.response?.data?.message || error?.message || "Failed to update price";
      toast({ title: message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    
    createPriceMutation.mutate({
      assetId: asset.id,
      closePrice: formData.closePrice.toString(),
      date: new Date().toISOString().split('T')[0], // Always use current date
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Current Price</DialogTitle>
          <DialogDescription>
            Set the current market price for this asset. This will immediately update your portfolio calculations.
          </DialogDescription>
        </DialogHeader>
        
        {asset && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="text-sm font-medium text-blue-900">{asset.name}</div>
            <div className="text-sm text-blue-700">{asset.ticker} • {asset.category}</div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Current Price per Share</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.closePrice}
              onChange={(e) => setFormData({ ...formData, closePrice: e.target.value })}
              placeholder="0.00"
              required
              autoFocus
            />
            <div className="text-xs text-gray-500 mt-1">
              This will update the current market price for portfolio calculations
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPriceMutation.isPending || !formData.closePrice}>
              {createPriceMutation.isPending ? "Updating..." : "Update Price"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}