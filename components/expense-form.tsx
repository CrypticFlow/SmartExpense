"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface ExpenseFormProps {
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

export default function ExpenseForm({ onClose, onSuccess }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const createExpense = useMutation(api.expenses.create);
  const uploadAndProcessReceipt = useAction(api.receipts.uploadAndProcessReceipt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.amount || !formData.description || !formData.category) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await createExpense({
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to create expense:", error);
      setError("Failed to create expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReceiptUpload = async (file: File) => {
    setIsProcessingReceipt(true);
    setError("");
    
    try {
      setReceiptFile(file);
      
      // Upload and process with OpenAI Vision API
      const extractedData = await uploadAndProcessReceipt({ file });
      
      // Auto-fill form with extracted data
      setFormData(prev => ({
        ...prev,
        amount: extractedData.amount.toString(),
        description: extractedData.description,
        category: extractedData.category,
        date: extractedData.date
      }));
      
    } catch (error) {
      console.error("Receipt processing failed:", error);
      setError("Failed to process receipt. Please try again.");
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add New Expense</CardTitle>
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
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
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
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="What was this expense for?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Image
              </label>
              <input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleReceiptUpload(file);
                  }
                }}
                disabled={isProcessingReceipt}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {isProcessingReceipt ? (
                <p className="text-sm text-blue-600 mt-1 flex items-center">
                  <span className="animate-spin mr-2">🔄</span>
                  Processing receipt with AI...
                </p>
              ) : receiptFile ? (
                <p className="text-sm text-green-600 mt-1">
                  ✅ Receipt processed: {receiptFile.name}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">Upload a receipt image to auto-fill expense details</p>
              )}
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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Expense"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}