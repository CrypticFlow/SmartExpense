"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, DollarSign, Clock, CheckCircle, LogOut, BarChart3, Target, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ExpenseForm from "@/components/expense-form";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import BudgetDashboard from "@/components/budget-dashboard";
import TeamDashboard from "@/components/team-dashboard";
import { getBudgetColorScheme, getTeamBudgetHealth, getBudgetHealthMessage } from "@/lib/budget-colors";
export default function Dashboard() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const myExpenses = useQuery(api.expenses.getMyExpenses);
  const myTeam = useQuery(api.teams.getMyTeam);
  const activeBudgets = useQuery(api.budgets.getActive);
  const router = useRouter();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "budgets" | "team">("overview");

  // Calculate team budget health for dynamic colors
  const teamBudgetHealth = getTeamBudgetHealth(activeBudgets || []);
  const colorScheme = getBudgetColorScheme(teamBudgetHealth);
  const healthMessage = getBudgetHealthMessage(teamBudgetHealth);

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
    <div className={`min-h-screen transition-all duration-500 p-6 ${colorScheme.cardBg}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold transition-colors duration-500 ${colorScheme.primary}`}>
              Smart<span className={colorScheme.accent}>Expense</span>
            </h1>
            <p className={`transition-colors duration-500 ${colorScheme.secondary}`}>
              Welcome back, {user.firstName || user.emailAddresses[0].emailAddress}
            </p>
            {activeBudgets && activeBudgets.length > 0 && (
              <p className={`text-sm mt-1 font-medium transition-colors duration-500 ${colorScheme.accent}`}>
                {healthMessage}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button 
              className={`${colorScheme.button} text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "overview"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${
              activeTab === "analytics"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("budgets")}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${
              activeTab === "budgets"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Target className="h-4 w-4" />
            Budgets
          </button>
          {(currentUser?.role === "admin" || currentUser?.role === "manager") && (
            <button
              onClick={() => setActiveTab("team")}
              className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${
                activeTab === "team"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="h-4 w-4" />
              Team
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
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
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <AnalyticsDashboard />
        )}

        {/* Budgets Tab */}
        {activeTab === "budgets" && (
          <BudgetDashboard />
        )}

        {/* Team Tab */}
        {activeTab === "team" && (
          <TeamDashboard />
        )}

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