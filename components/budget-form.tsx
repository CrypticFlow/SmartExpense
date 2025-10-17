"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface BudgetFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = [
  "Office Supplies",
  "Travel",
  "Meals & Entertainment",
  "Software & Subscriptions",
  "Equipment",
  "Marketing",
  "Training",
  "Other"
];

export default function BudgetForm({ onClose, onSuccess }: BudgetFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category: "",
    period: "monthly" as "monthly" | "quarterly" | "yearly",
    startDate: new Date().toISOString().split('T')[0],
    alertThreshold: "80",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const createBudget = useMutation(api.budgets.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.name || !formData.amount || !formData.alertThreshold) {
      setError("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.alertThreshold) < 1 || parseFloat(formData.alertThreshold) > 100) {
      setError("Alert threshold must be between 1% and 100%");
      return;
    }

    setIsLoading(true);
    try {
      await createBudget({
        name: formData.name,
        amount: parseFloat(formData.amount),
        category: formData.category || undefined,
        period: formData.period,
        startDate: formData.startDate,
        alertThreshold: parseFloat(formData.alertThreshold),
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to create budget:", error);
      setError("Failed to create budget. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Create New Budget</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Budget Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Q1 Marketing Budget"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Budget Amount *
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category (Optional)
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Leave blank to track all expenses, or select a specific category
              </p>
            </div>

            <div>
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                Budget Period *
              </label>
              <select
                id="period"
                value={formData.period}
                onChange={(e) => handleInputChange("period", e.target.value as "monthly" | "quarterly" | "yearly")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="alertThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                Alert Threshold (%) *
              </label>
              <input
                id="alertThreshold"
                type="number"
                min="1"
                max="100"
                value={formData.alertThreshold}
                onChange={(e) => handleInputChange("alertThreshold", e.target.value)}
                placeholder="80"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Get alerted when spending reaches this percentage of the budget
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Budget"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}