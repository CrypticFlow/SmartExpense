/**
 * Dynamic color utilities based on budget usage percentage
 * Colors get progressively redder as budget usage increases
 */

export interface BudgetColorScheme {
  // Background colors
  cardBg: string;
  alertBg: string;
  
  // Text colors
  primary: string;
  secondary: string;
  accent: string;
  
  // UI elements
  progressBar: string;
  border: string;
  button: string;
  buttonHover: string;
  
  // Status indicators
  status: "healthy" | "warning" | "danger" | "critical";
}

/**
 * Calculate budget usage percentage
 */
export function calculateBudgetUsage(spent: number, budget: number): number {
  return budget > 0 ? Math.min((spent / budget) * 100, 150) : 0; // Cap at 150% for extreme cases
}

/**
 * Get overall team budget health (average of all active budgets)
 */
export function getTeamBudgetHealth(budgets: any[]): number {
  if (!budgets || budgets.length === 0) return 0;
  
  const totalUsage = budgets.reduce((sum, budget) => {
    const usage = calculateBudgetUsage(budget.spent || 0, budget.amount);
    return sum + usage;
  }, 0);
  
  return totalUsage / budgets.length;
}

/**
 * Get dynamic color scheme based on budget usage percentage
 */
export function getBudgetColorScheme(usagePercentage: number): BudgetColorScheme {
  // Healthy: 0-60% (Green/Blue tones)
  if (usagePercentage <= 60) {
    return {
      cardBg: "bg-gradient-to-br from-blue-50 to-green-50",
      alertBg: "bg-green-50 border-green-200",
      primary: "text-slate-800",
      secondary: "text-slate-600",
      accent: "text-green-700",
      progressBar: "bg-gradient-to-r from-green-400 to-blue-500",
      border: "border-green-200",
      button: "bg-green-600 hover:bg-green-700",
      buttonHover: "hover:bg-green-700",
      status: "healthy"
    };
  }
  
  // Warning: 60-80% (Yellow/Orange tones)
  if (usagePercentage <= 80) {
    return {
      cardBg: "bg-gradient-to-br from-yellow-50 to-orange-50",
      alertBg: "bg-yellow-50 border-yellow-200",
      primary: "text-slate-800",
      secondary: "text-slate-600",
      accent: "text-yellow-700",
      progressBar: "bg-gradient-to-r from-yellow-400 to-orange-500",
      border: "border-yellow-200",
      button: "bg-yellow-600 hover:bg-yellow-700",
      buttonHover: "hover:bg-yellow-700",
      status: "warning"
    };
  }
  
  // Danger: 80-100% (Orange/Red tones)
  if (usagePercentage <= 100) {
    return {
      cardBg: "bg-gradient-to-br from-orange-50 to-red-50",
      alertBg: "bg-orange-50 border-orange-200",
      primary: "text-slate-800",
      secondary: "text-slate-700",
      accent: "text-orange-700",
      progressBar: "bg-gradient-to-r from-orange-500 to-red-500",
      border: "border-orange-200",
      button: "bg-orange-600 hover:bg-orange-700",
      buttonHover: "hover:bg-orange-700",
      status: "danger"
    };
  }
  
  // Critical: 100%+ (Deep Red tones)
  return {
    cardBg: "bg-gradient-to-br from-red-100 to-red-200",
    alertBg: "bg-red-100 border-red-300",
    primary: "text-red-900",
    secondary: "text-red-800",
    accent: "text-red-700",
    progressBar: "bg-gradient-to-r from-red-600 to-red-800",
    border: "border-red-300",
    button: "bg-red-700 hover:bg-red-800",
    buttonHover: "hover:bg-red-800",
    status: "critical"
  };
}

/**
 * Get status message based on budget health
 */
export function getBudgetHealthMessage(usagePercentage: number): string {
  if (usagePercentage <= 60) {
    return "Budget on track! 📈";
  }
  if (usagePercentage <= 80) {
    return "Approaching budget limit ⚠️";
  }
  if (usagePercentage <= 100) {
    return "Near budget limit! 🚨";
  }
  return "Budget exceeded! 🔥";
}

/**
 * Get dynamic styles for progress bars
 */
export function getProgressBarStyle(percentage: number): string {
  if (percentage <= 60) {
    return "bg-gradient-to-r from-green-400 to-blue-500";
  }
  if (percentage <= 80) {
    return "bg-gradient-to-r from-yellow-400 to-orange-500";
  }
  if (percentage <= 100) {
    return "bg-gradient-to-r from-orange-500 to-red-500";
  }
  return "bg-gradient-to-r from-red-600 to-red-800";
}

/**
 * Get dynamic text color for amounts
 */
export function getAmountTextColor(percentage: number): string {
  if (percentage <= 60) {
    return "text-green-700";
  }
  if (percentage <= 80) {
    return "text-yellow-700";
  }
  if (percentage <= 100) {
    return "text-orange-700";
  }
  return "text-red-700";
}

/**
 * Get status icon based on budget health
 */
export function getBudgetStatusIcon(percentage: number): string {
  if (percentage <= 60) {
    return "✅";
  }
  if (percentage <= 80) {
    return "⚠️";
  }
  if (percentage <= 100) {
    return "🚨";
  }
  return "🔥";
}