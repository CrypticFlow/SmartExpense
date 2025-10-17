"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsDashboard() {
  const myExpenses = useQuery(api.expenses.getMyExpenses);

  if (!myExpenses) {
    return <div>Loading analytics...</div>;
  }

  // Process data for charts
  const processExpenseData = () => {
    // Group expenses by month
    const monthlyData: { [key: string]: number } = {};
    const categoryData: { [key: string]: number } = {};
    
    myExpenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      monthlyData[month] = (monthlyData[month] || 0) + expense.amount;
      categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
    });

    return { monthlyData, categoryData };
  };

  const { monthlyData, categoryData } = processExpenseData();

  // Line chart for expense trends
  const lineChartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: Object.values(monthlyData),
        borderColor: '#ef4444', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Doughnut chart for category breakdown
  const doughnutChartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          '#fca5a5', // red-300
          '#f87171', // red-400
          '#ef4444', // red-500
          '#dc2626', // red-600
          '#b91c1c', // red-700
          '#991b1b', // red-800
          '#7f1d1d', // red-900
          '#fee2e2', // red-100
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Bar chart for status breakdown
  const statusData = myExpenses.reduce((acc, expense) => {
    acc[expense.status] = (acc[expense.status] || 0) + expense.amount;
    return acc;
  }, {} as { [key: string]: number });

  const barChartData = {
    labels: Object.keys(statusData),
    datasets: [
      {
        label: 'Amount by Status',
        data: Object.values(statusData),
        backgroundColor: [
          '#fca5a5', // pending - light red
          '#22c55e', // approved - green
          '#ef4444', // rejected - red
        ],
        borderColor: [
          '#f87171',
          '#16a34a',
          '#dc2626',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.label + ': $' + context.parsed.toFixed(2);
          }
        }
      }
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600">Track your spending patterns and trends</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${myExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              ${Object.values(monthlyData)[Object.values(monthlyData).length - 1]?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              ${(statusData.pending || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${(statusData.approved || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={lineChartData} options={chartOptions} />
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Doughnut data={doughnutChartData} options={doughnutOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar data={barChartData} options={chartOptions} />
        </CardContent>
      </Card>
    </div>
  );
}