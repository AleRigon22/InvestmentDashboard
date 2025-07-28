import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
  holdingData?: {
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    marketValue: number;
  };
}

export default function EditAssetModal({ open, onOpenChange, asset, holdingData }: EditAssetModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    ticker: "",
    category: "stock",
    sector: "",
    region: "",
    currency: "USD",
    notes: "",
    currentPrice: "",
  });

  // Update form data when asset or holdingData changes
  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || "",
        ticker: asset.ticker || "",
        category: asset.category || "stock",
        sector: asset.sector || "",
        region: asset.region || "",
        currency: asset.currency || "USD",
        notes: asset.notes || "",
        currentPrice: holdingData?.currentPrice?.toString() || "",
      });
    }
  }, [asset, holdingData]);

  const updateAssetMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/assets/${asset?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
      toast({ title: "Asset updated successfully!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update asset", variant: "destructive" });
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: (priceData: any) => apiRequest("POST", "/api/prices", priceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/overview"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update asset information
    const assetData = {
      name: formData.name,
      ticker: formData.ticker,
      category: formData.category,
      sector: formData.sector,
      region: formData.region,
      currency: formData.currency,
      notes: formData.notes,
    };
    
    try {
      await updateAssetMutation.mutateAsync(assetData);
      
      // Update current price if it was changed
      if (formData.currentPrice && holdingData && formData.currentPrice !== holdingData.currentPrice.toString()) {
        await updatePriceMutation.mutateAsync({
          assetId: asset.id,
          closePrice: formData.currentPrice,
          date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      // Error handling is managed by mutation onError callbacks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[75vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Asset Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Apple Inc."
              required
            />
          </div>
          
          <div>
            <Label>Ticker</Label>
            <Input
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
              placeholder="e.g., AAPL"
              required
            />
          </div>
          
          <div>
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
            <Label>Sector</Label>
            <Select value={formData.sector || ""} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
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
            <Label>Region</Label>
            <Select value={formData.region || ""} onValueChange={(value) => setFormData({ ...formData, region: value })}>
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
          
          <div>
            <Label>Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this asset"
              rows={3}
            />
          </div>

          {/* Financial Information Section */}
          {holdingData && (
            <>
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Current Position</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      value={holdingData.quantity.toFixed(6)}
                      disabled
                      className="bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <Label>Average Price</Label>
                    <Input
                      value={`$${holdingData.avgPrice.toFixed(2)}`}
                      disabled
                      className="bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <Label>Current Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.currentPrice}
                      onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label>Market Value</Label>
                    <Input
                      value={`$${holdingData.marketValue.toFixed(2)}`}
                      disabled
                      className="bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateAssetMutation.isPending}>
              {updateAssetMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}