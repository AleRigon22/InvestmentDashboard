import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddDividendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedAsset?: any;
}

export default function AddDividendModal({ open, onOpenChange, preSelectedAsset }: AddDividendModalProps) {
  const [formData, setFormData] = useState({
    assetId: preSelectedAsset?.id?.toString() || "",
    paymentDate: "",
    amount: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets } = useQuery({
    queryKey: ["/api/assets"],
  });

  const createDividendMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/dividends", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dividends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dividends/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({
        title: "Success",
        description: "Dividend added successfully",
      });
      onOpenChange(false);
      setFormData({
        assetId: preSelectedAsset?.id?.toString() || "",
        paymentDate: "",
        amount: "",
        notes: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add dividend",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDividendMutation.mutate({
      assetId: parseInt(formData.assetId),
      paymentDate: formData.paymentDate,
      amount: formData.amount,
      notes: formData.notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Dividend</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Asset</Label>
            <Select 
              value={formData.assetId} 
              onValueChange={(value) => setFormData({ ...formData, assetId: value })}
              disabled={!!preSelectedAsset}
            >
              <SelectTrigger>
                <SelectValue placeholder={preSelectedAsset ? `${preSelectedAsset.name} (${preSelectedAsset.ticker})` : "Select asset..."} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(assets) && assets.map((asset: any) => (
                  <SelectItem key={asset.id} value={asset.id.toString()}>
                    {asset.name} ({asset.ticker})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment Date</Label>
            <Input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Amount (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label>Notes (Optional)</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this dividend"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDividendMutation.isPending}>
              {createDividendMutation.isPending ? "Adding..." : "Add Dividend"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
