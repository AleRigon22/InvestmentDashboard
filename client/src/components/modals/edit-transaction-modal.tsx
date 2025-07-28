import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: any;
}

export default function EditTransactionModal({ open, onOpenChange, transaction }: EditTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    date: "",
    type: "buy",
    quantity: "",
    unitPrice: "",
    fees: "0",
  });

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        type: transaction.type,
        quantity: transaction.quantity.toString(),
        unitPrice: transaction.unitPrice.toString(),
        fees: transaction.fees?.toString() || "0",
      });
    }
  }, [transaction]);

  const updateTransactionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/transactions/${transaction?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({ title: "Transaction updated successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to update transaction";
      toast({ title: message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    
    updateTransactionMutation.mutate({
      date: formData.date,
      type: formData.type,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      fees: formData.fees || "0",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              step="any"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0.000"
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
            <Label>Fees (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.fees}
              onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateTransactionMutation.isPending}
              className="flex-1"
            >
              {updateTransactionMutation.isPending ? "Updating..." : "Update Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}