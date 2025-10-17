"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, DollarSign, Clock, CheckCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ExpenseForm from "@/components/expense-form";
export default function Dashboard() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const myExpenses = useQuery(api.expenses.getMyExpenses);
  const myTeam = useQuery(api.teams.getMyTeam);
  const router = useRouter();
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return <div>Please sign in</div>;
  }
  
  if (currentUser === undefined) return <div>Loading...</div>;
  
  if (currentUser === null) {
    router.push("/onboarding");
    return <div>Setting up your account...</div>;
  }

  const totalExpenses = myExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const pendingCount = myExpenses?.filter(e => e.status === "pending").length || 0;
  const approvedCount = myExpenses?.filter(e => e.status === "approved").length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Smart<span className="text-blue-600">Expense</span>
            </h1>
            <p className="text-gray-600">Welcome back, {user.firstName || user.emailAddresses[0].emailAddress}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              className="bg-red-300 text-black hover:shadow-[0_0_15px_rgba(220,38,38,0.8)] hover:-translate-y-1 transition-all duration-200"
              onClick={() => setShowExpenseForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
            <div className="flex items-center gap-3">
              <SignOutButton>
                <Button variant="outline">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </SignOutButton>
              <img 
                src={user.imageUrl} 
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-300">${totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {myExpenses?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expenses yet. Add your first expense!</p>
            ) : (
              <div className="space-y-4">
                {myExpenses?.slice(0, 10).map((expense) => (
                  <div key={expense._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium text-black">{expense.description}</h3>
                      <p className="text-sm text-black">{expense.category} • {expense.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">${expense.amount.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        expense.status === "approved" ? "bg-green-100 text-green-800" :
                        expense.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Form Modal */}
        {showExpenseForm && (
          <ExpenseForm
            onClose={() => setShowExpenseForm(false)}
            onSuccess={() => {
              // Expenses will automatically refresh due to Convex reactivity
            }}
          />
        )}
      </div>
    </div>
  );
}