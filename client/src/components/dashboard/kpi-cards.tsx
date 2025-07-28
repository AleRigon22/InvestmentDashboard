import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Plus, TrendingUp, Coins, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioOverview {
  totalValue: number;
  totalInvested: number;
  totalPL: number;
  totalPLPercent: number;
  ytdDividends: number;
}

interface KPICardsProps {
  data: PortfolioOverview | undefined;
  isLoading: boolean;
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No portfolio data available
      </div>
    );
  }

  const isPositivePL = data.totalPL >= 0;
  const dailyChange = 2.4; // This would come from daily price changes in a real app

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-primary/10 rounded-full p-3">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+{dailyChange}%</span>
            <span className="text-sm text-gray-500 ml-2">today</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invested</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-blue-50 rounded-full p-3">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Cost basis</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">P&L</p>
              <p className={cn(
                "text-2xl font-bold",
                isPositivePL ? "text-green-600" : "text-red-600"
              )}>
                {isPositivePL ? '+' : ''}${data.totalPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className={cn(
              "rounded-full p-3",
              isPositivePL ? "bg-green-50" : "bg-red-50"
            )}>
              <TrendingUp className={cn(
                "h-6 w-6",
                isPositivePL ? "text-green-600" : "text-red-600"
              )} />
            </div>
          </div>
          <div className="mt-4">
            <span className={cn(
              "text-sm font-medium",
              isPositivePL ? "text-green-600" : "text-red-600"
            )}>
              {isPositivePL ? '+' : ''}{data.totalPLPercent.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-500 ml-2">return</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">YTD Dividends</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.ytdDividends.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-green-50 rounded-full p-3">
              <Coins className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600 font-medium">+18.7%</span>
            <span className="text-sm text-gray-500 ml-2">vs last year</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
