import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import AddCashModal from "@/components/modals/add-cash-modal";

export default function Cash() {
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: cashMovements, isLoading } = useQuery({
    queryKey: ["/api/cash-movements"],
  });

  // Calculate totals
  const totalDeposits = cashMovements?.filter((m: any) => m.type === 'deposit')
    .reduce((sum: number, m: any) => sum + Number(m.amount), 0) || 0;
  
  const totalWithdrawals = cashMovements?.filter((m: any) => m.type === 'withdraw')
    .reduce((sum: number, m: any) => sum + Number(m.amount), 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Cash Movements</h2>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-700 text-white font-medium"
        >
          <Plus className="mr-2" size={16} />
          Add Movement
        </Button>
      </div>

      {/* Cash Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deposits</p>
                <p className="text-2xl font-bold text-success">
                  ${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-success-50 rounded-full p-3">
                <ArrowDown className="text-success h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
                <p className="text-2xl font-bold text-danger">
                  ${totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-danger-50 rounded-full p-3">
                <ArrowUp className="text-danger h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Movement History */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Movement History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!cashMovements || cashMovements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No cash movements yet. Add your first deposit or withdrawal to get started.
                    </td>
                  </tr>
                ) : (
                  cashMovements.map((movement: any) => (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge 
                          variant={movement.type === 'deposit' ? 'default' : 'destructive'}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            movement.type === 'deposit' 
                              ? 'bg-success text-white' 
                              : 'bg-danger text-white'
                          }`}
                        >
                          {movement.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${Number(movement.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex justify-center space-x-2">
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddCashModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
