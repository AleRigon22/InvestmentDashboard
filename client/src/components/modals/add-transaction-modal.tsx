import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedAsset?: any;
}

export default function AddTransactionModal({ open, onOpenChange, preSelectedAsset }: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    assetId: preSelectedAsset?.id?.toString() || "",
    type: "buy",
    quantity: "",
    unitPrice: "",
    fees: "0",
    date: new Date().toISOString().split('T')[0],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets } = useQuery({
    queryKey: ["/api/assets"],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      onOpenChange(false);
      setFormData({
        assetId: preSelectedAsset?.id?.toString() || "",
        type: "buy",
        quantity: "",
        unitPrice: "",
        fees: "0",
        date: new Date().toISOString().split('T')[0],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/assets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Success",
        description: "Asset created successfully",
      });
    },
  });

  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetFormData, setAssetFormData] = useState({
    name: "",
    ticker: "",
    category: "stock",
    sector: "",
    region: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransactionMutation.mutate({
      ...formData,
      assetId: parseInt(formData.assetId),
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      fees: formData.fees || "0",
    });
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    createAssetMutation.mutate(assetFormData);
    setShowAssetForm(false);
    setAssetFormData({
      name: "",
      ticker: "",
      category: "stock",
      sector: "",
      region: "",
    });
  };

  if (showAssetForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div>
              <Label>Asset Name</Label>
              <Input
                value={assetFormData.name}
                onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
                placeholder="e.g., Apple Inc."
                required
              />
            </div>
            <div>
              <Label>Ticker</Label>
              <Input
                value={assetFormData.ticker}
                onChange={(e) => setAssetFormData({ ...assetFormData, ticker: e.target.value.toUpperCase() })}
                placeholder="e.g., AAPL"
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={assetFormData.category} onValueChange={(value) => setAssetFormData({ ...assetFormData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                  <SelectItem value="fund">Fund</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sector (Optional)</Label>
              <Select value={assetFormData.sector} onValueChange={(value) => setAssetFormData({ ...assetFormData, sector: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Energia">Energia</SelectItem>
                  <SelectItem value="Materiali">Materiali</SelectItem>
                  <SelectItem value="Industria">Industria</SelectItem>
                  <SelectItem value="Consumi discrezionali">Consumi discrezionali</SelectItem>
                  <SelectItem value="Consumi di base">Consumi di base</SelectItem>
                  <SelectItem value="Assistenza sanitaria">Assistenza sanitaria</SelectItem>
                  <SelectItem value="Finanza">Finanza</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Servizi di comunicazione">Servizi di comunicazione</SelectItem>
                  <SelectItem value="Servizi di pubblica utilità">Servizi di pubblica utilità</SelectItem>
                  <SelectItem value="Immobili">Immobili</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Region (Optional)</Label>
              <Select value={assetFormData.region} onValueChange={(value) => setAssetFormData({ ...assetFormData, region: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stati Uniti">Stati Uniti</SelectItem>
                  <SelectItem value="Europa">Europa</SelectItem>
                  <SelectItem value="Asia">Asia</SelectItem>
                  <SelectItem value="Mercati Emergenti">Mercati Emergenti</SelectItem>
                  <SelectItem value="Globale / Multinazionale">Globale / Multinazionale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowAssetForm(false)}>
                Back
              </Button>
              <Button type="submit" disabled={createAssetMutation.isPending}>
                {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a buy or sell transaction for your portfolio. Select an existing asset or create a new one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Asset</Label>
            <div className="flex space-x-2">
              <Select 
                value={formData.assetId} 
                onValueChange={(value) => setFormData({ ...formData, assetId: value })}
                disabled={!!preSelectedAsset}
              >
                <SelectTrigger className="flex-1">
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
              {!preSelectedAsset && (
                <Button type="button" variant="outline" onClick={() => setShowAssetForm(true)}>
                  New
                </Button>
              )}
            </div>
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
            <Label>Fees</Label>
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
              {createTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
