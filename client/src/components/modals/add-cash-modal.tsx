import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddCashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCashModal({ open, onOpenChange }: AddCashModalProps) {
  const [formData, setFormData] = useState({
    type: "deposit",
    amount: "",
    date: new Date().toISOString().split('T')[0],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCashMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/cash-movements", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({
        title: "Success",
        description: "Cash movement added successfully",
      });
      onOpenChange(false);
      setFormData({
        type: "deposit",
        amount: "",
        date: new Date().toISOString().split('T')[0],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add cash movement",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCashMovementMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cash Movement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdraw">Withdraw</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount</Label>
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
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCashMovementMutation.isPending}>
              {createCashMovementMutation.isPending ? "Adding..." : "Add Movement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
