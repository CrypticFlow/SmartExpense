# SmartExpense - AI-Powered Team Expense Management

> A modern, full-stack expense management application with AI receipt scanning, real-time budget tracking, and collaborative team workflows.

## 🎯 **Portfolio Highlights**

### **Technical Excellence**
- **Full-Stack TypeScript** - End-to-end type safety
- **Real-time Architecture** - Live updates using Convex
- **AI Integration** - OpenAI Vision API for receipt processing
- **Modern React** - Next.js 15 with App Router
- **Responsive Design** - Mobile-first Tailwind CSS

### **Complex Business Logic**
- **Multi-tenant Architecture** - Team-based data isolation
- **Role-based Access Control** - 3-tier permission system
- **Real-time Budget Tracking** - Automatic spending updates
- **Smart Alert System** - Threshold-based notifications
- **Approval Workflows** - Manager/Admin expense approval

## 🏗 **Architecture Overview**

```
Frontend (Next.js + TypeScript)
    ↓ Real-time Queries/Mutations
Backend (Convex + Functions)
    ↓ Schema & Relationships
Database (Convex DB)
    ↓ External APIs
AI Services (OpenAI Vision)
```

## 🌟 **Key Features Demonstrated**

### **1. AI-Powered Receipt Scanning**
```typescript
// Automatic data extraction from receipt images
const extractedData = await uploadAndProcessReceipt({ file });
setFormData({
  amount: extractedData.amount.toString(),
  description: extractedData.description,
  category: extractedData.category,
  date: extractedData.date
});
```

### **2. Real-time Budget Tracking**
```typescript
// Automatic budget updates on expense approval
export const approve = mutation({
  handler: async (ctx, args) => {
    // Update expense status
    await ctx.db.patch(expenseId, { status: "approved" });
    
    // Update relevant budgets
    const newSpent = (budget.spent || 0) + expense.amount;
    await ctx.db.patch(budget._id, { spent: newSpent });
    
    // Check and create alerts
    await checkAndCreateBudgetAlerts(ctx, budget, newSpent);
  }
});
```

### **3. Role-Based Access Control**
```typescript
// Granular permissions throughout the application
const canManage = currentUser?.role === "admin" || currentUser?.role === "manager";
const canCreateBudgets = currentUser?.role === "admin" || currentUser?.role === "manager";

// Protected API endpoints
if (!user || (user.role !== "admin" && user.role !== "manager")) {
  throw new Error("Only admins and managers can invite team members");
}
```

### **4. Team Collaboration System**
```typescript
// Email-based team invitations with secure codes
export const inviteTeamMember = mutation({
  handler: async (ctx, args) => {
    const inviteCode = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    return await ctx.db.insert("teamInvitations", {
      teamId: user.teamId,
      email: args.email,
      role: args.role,
      inviteCode,
      expiresAt: expiresAt.toISOString()
    });
  }
});
```

## 🛠 **Tech Stack**

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, Radix UI |
| **Backend** | Convex (BaaS), Real-time functions |
| **Database** | Convex DB with indexes and relationships |
| **Authentication** | Clerk (OAuth + Email/Password) |
| **AI Services** | OpenAI Vision API |
| **Deployment** | Vercel + Convex Cloud |

## 📊 **Database Schema Design**

### **Core Relationships**
```typescript
// Multi-tenant architecture with proper isolation
Users → Teams (Many-to-One)
Expenses → Users + Teams (Foreign Keys)
Budgets → Teams (Team-scoped)
BudgetAlerts → Users + Budgets (Notifications)
TeamInvitations → Teams (Invitation system)
```

### **Optimized Indexes**
- By team for data isolation
- By user for personal queries
- By status for workflow management
- By date ranges for reporting

## 🔐 **Security Implementation**

### **Authentication & Authorization**
- **Clerk Integration** - Production-ready auth
- **JWT Validation** - Secure API endpoints
- **Role-based Permissions** - Function-level security
- **Team Data Isolation** - Users only see their team data

### **Input Validation & Security**
- **TypeScript Schemas** - Compile-time type checking
- **Runtime Validation** - Convex value validation
- **File Upload Security** - Image validation and storage
- **Invitation Security** - Unique codes with expiration

## ⚡ **Performance Features**

### **Frontend Optimizations**
- **Next.js App Router** - Efficient routing and SSR
- **Real-time Updates** - Optimistic UI updates
- **Component Optimization** - React.memo and efficient re-renders
- **Bundle Splitting** - Automatic code splitting

### **Backend Optimizations**
- **Database Indexes** - Query optimization
- **Real-time Subscriptions** - Efficient data syncing
- **Batch Operations** - Efficient bulk updates
- **Caching Layer** - Built-in Convex caching

## 🎨 **User Experience Design**

### **Responsive Dashboard**
- **Tab-based Navigation** - Clean interface organization
- **Role-based UI** - Dynamic component rendering
- **Real-time Notifications** - Live budget alerts
- **Mobile-first Design** - Responsive across devices

### **Intuitive Workflows**
- **AI-Enhanced Forms** - Automatic data population
- **Visual Progress Indicators** - Budget spending visualization
- **One-click Actions** - Streamlined approval process
- **Contextual Permissions** - Role-appropriate interfaces

## 📈 **Business Logic Complexity**

### **Budget Alert System**
```typescript
// Intelligent threshold monitoring
const percentage = (newSpent / budget.amount) * 100;
if (percentage >= thresholdPercentage && !hasRecentAlert) {
  await ctx.db.insert("budgetAlerts", {
    alertType: percentage >= 100 ? "exceeded" : "threshold",
    message: `Budget "${budget.name}" has ${
      percentage >= 100 ? 'been exceeded' : 'reached threshold'
    }`
  });
}
```

### **Multi-level Approval Workflow**
- **Employee** submits expense → **Pending** status
- **Manager/Admin** reviews → **Approved/Rejected**
- **Automatic** budget updates → **Alert generation**
- **Real-time** notifications → **Dashboard updates**

## 🚀 **Deployment & DevOps**

### **Production Architecture**
- **Vercel Frontend** - Global CDN deployment
- **Convex Backend** - Serverless functions
- **Real-time Database** - Global data replication
- **Environment Management** - Secure secrets handling

### **CI/CD Pipeline**
- **Git-based Deployment** - Automatic deployments
- **Type Checking** - Pre-deployment validation
- **Performance Monitoring** - Real-time metrics
- **Error Tracking** - Comprehensive logging

## 💡 **Key Learning Outcomes**

### **Technical Skills Demonstrated**
- **Full-stack TypeScript** development
- **Real-time application** architecture
- **AI API integration** and processing
- **Complex state management** with real-time updates
- **Security-first** development approach

### **Business Problem Solving**
- **Multi-tenant** application design
- **Role-based access** implementation
- **Workflow automation** and business logic
- **User experience** optimization
- **Performance** and scalability considerations

---

## 🎥 **Demo Flow for Portfolio**

### **1. AI Receipt Scanning** (30 seconds)
- Upload receipt image
- Watch AI extract data automatically
- Show form auto-population

### **2. Budget Management** (45 seconds)
- Create team budget with threshold
- Submit expense and approve
- Show real-time budget update and alert

### **3. Team Collaboration** (60 seconds)
- Invite team member with role
- Show role-based dashboard differences
- Demonstrate approval workflow

### **4. Real-time Features** (30 seconds)
- Show multiple user sessions
- Demonstrate live updates across browsers
- Highlight real-time notifications

---

**Total Demo Time: ~3 minutes**
**GitHub Repository**: [SmartExpense](https://github.com/yourusername/smartexpense)
**Live Demo**: [smartexpense.vercel.app](https://smartexpense.vercel.app)

---

*SmartExpense showcases modern full-stack development with real-world business logic, demonstrating proficiency in TypeScript, React, real-time systems, AI integration, and complex application architecture.*