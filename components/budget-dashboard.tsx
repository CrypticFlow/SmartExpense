"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertTriangle, CheckCircle, XCircle, Bell } from "lucide-react";
import BudgetForm from "./budget-form";

export default function BudgetDashboard() {
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const budgets = useQuery(api.budgets.getActive);
  const alerts = useQuery(api.budgets.getBudgetAlerts);
  const currentUser = useQuery(api.users.getCurrentUser);
  const markAlertAsRead = useMutation(api.budgets.markAlertAsRead);
  const deactivateBudget = useMutation(api.budgets.deactivate);

  const canCreateBudgets = currentUser?.role === "admin" || currentUser?.role === "manager";

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await markAlertAsRead({ alertId: alertId as any });
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    }
  };

  const handleDeactivateBudget = async (budgetId: string) => {
    if (window.confirm("Are you sure you want to deactivate this budget?")) {
      try {
        await deactivateBudget({ budgetId: budgetId as any });
      } catch (error) {
        console.error("Failed to deactivate budget:", error);
      }
    }
  };

  const getBudgetStatus = (spent: number, amount: number, threshold: number) => {
    const percentage = (spent / amount) * 100;
    if (percentage >= 100) return { status: "exceeded", color: "red", icon: XCircle };
    if (percentage >= threshold) return { status: "warning", color: "yellow", icon: AlertTriangle };
    return { status: "good", color: "green", icon: CheckCircle };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const unreadAlerts = alerts?.filter(alert => !alert.isRead) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Management</h2>
          <p className="text-gray-600 mt-1">Track team spending limits and get alerts</p>
        </div>
        {canCreateBudgets && (
          <Button 
            onClick={() => setShowBudgetForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        )}
      </div>

      {/* Alerts Section */}
      {unreadAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-orange-600 mr-2" />
              <CardTitle className="text-orange-800">Budget Alerts ({unreadAlerts.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadAlerts.map((alert) => (
                <div 
                  key={alert._id} 
                  className="flex items-start justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.createdAt).toLocaleDateString()} at {new Date(alert.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAlertRead(alert._id)}
                    className="ml-3"
                  >
                    Mark Read
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets?.map((budget) => {
          const spent = budget.spent || 0;
          const percentage = (spent / budget.amount) * 100;
          const { status, color, icon: StatusIcon } = getBudgetStatus(spent, budget.amount, budget.alertThreshold);
          
          return (
            <Card key={budget._id} className={`border-${color}-200`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {budget.category || "All Categories"} • {budget.period}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created by {(budget as any).creatorName || currentUser?.name}
                    </p>
                  </div>
                  <StatusIcon className={`h-5 w-5 text-${color}-600`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Spent</span>
                      <span>{Math.round(percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          percentage >= 100 ? 'bg-red-500' : 
                          percentage >= budget.alertThreshold ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spent:</span>
                      <span className="font-medium">{formatCurrency(spent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">{formatCurrency(budget.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className={`font-medium ${budget.amount - spent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(budget.amount - spent)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Period:</span>
                      <span className="font-medium">
                        {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {canCreateBudgets && (
                    <div className="pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivateBudget(budget._id)}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Deactivate Budget
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {budgets?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                {canCreateBudgets 
                  ? "Create your first team budget to start tracking spending limits and get alerts when approaching limits."
                  : "No team budgets have been created yet. Ask your manager or admin to create budgets."
                }
              </p>
              {canCreateBudgets && (
                <Button 
                  onClick={() => setShowBudgetForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Budget
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Form Modal */}
      {showBudgetForm && (
        <BudgetForm
          onClose={() => setShowBudgetForm(false)}
          onSuccess={() => {
            setShowBudgetForm(false);
          }}
        />
      )}
    </div>
  );
}