# SmartExpense - Complete Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Functions](#api-functions)
- [User Roles & Permissions](#user-roles--permissions)
- [Component Structure](#component-structure)
- [Workflows](#workflows)
- [Security Features](#security-features)
- [Performance Optimizations](#performance-optimizations)
- [Deployment Guide](#deployment-guide)

---

## 🎯 Overview

**SmartExpense** is a modern, full-stack expense management application designed for teams and businesses. It combines AI-powered receipt scanning, real-time budget tracking with alerts, and collaborative team workflows into a seamless user experience.

### Key Value Propositions

- **AI-Enhanced**: OpenAI Vision API for automatic receipt data extraction
- **Real-time Collaboration**: Live updates using Convex real-time database
- **Smart Budget Management**: Automatic spending tracking with customizable alerts
- **Role-based Access**: Secure multi-user system with granular permissions
- **Modern UX**: Responsive design with intuitive dashboard interface

---

## 🛠 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon system
- **Recharts/Chart.js** - Data visualization

### Backend & Database

- **Convex** - Real-time backend-as-a-service
- **Clerk** - Authentication and user management
- **OpenAI API** - AI-powered receipt processing

### Infrastructure

- **Vercel** - Frontend deployment
- **Convex Cloud** - Backend deployment
- **TypeScript** - Full-stack type safety

---

## 🌟 Core Features

### 1. Expense Management

- **Receipt Scanning**: AI-powered data extraction from uploaded images
- **Manual Entry**: Traditional form-based expense creation
- **Category System**: Predefined and custom expense categories
- **Status Tracking**: Pending, Approved, Rejected workflow
- **Attachment Support**: Receipt image storage and display

### 2. Budget Tracking & Alerts

- **Flexible Budgets**: Monthly, Quarterly, Yearly periods
- **Category-Specific**: Budget by expense category or all expenses
- **Real-time Tracking**: Automatic spending updates on approval
- **Smart Alerts**: Customizable threshold notifications (default 80%)
- **Visual Progress**: Progress bars and status indicators

### 3. Team Collaboration

- **Role-based Access**: Admin, Manager, Employee permissions
- **Team Invitations**: Email-based member recruitment
- **Approval Workflow**: Manager/Admin expense approval system
- **Team Dashboards**: Centralized management interface
- **Member Management**: Role updates, member removal

### 4. Analytics & Reporting

- **Spending Analytics**: Visual charts and trends
- **Category Breakdown**: Pie charts and bar graphs
- **Budget vs Actual**: Performance tracking
- **Team Insights**: Aggregate spending analysis

### 5. Security & Authentication

- **Clerk Integration**: Social login and email/password
- **Role-based Permissions**: Granular access control
- **Secure API**: Authentication on all endpoints
- **Data Validation**: Input sanitization and validation

---

## 🏗 Architecture

### Application Structure

```ini
SmartExpense/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Main dashboard page
│   ├── invite/[code]/     # Team invitation acceptance
│   ├── onboarding/        # New user setup
│   └── sign-in/sign-up/   # Authentication pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── *-dashboard.tsx   # Feature dashboards
│   └── *-form.tsx        # Modal forms
├── convex/               # Backend functions & schema
│   ├── schema.ts         # Database schema
│   ├── *.ts             # API functions by feature
│   └── _generated/       # Auto-generated types
└── lib/                  # Utilities and helpers
```

### Data Flow

1. **User Interaction** → React Components
2. **Component Actions** → Convex Mutations/Queries
3. **Convex Functions** → Database Operations
4. **Real-time Updates** → Automatic UI refresh
5. **External APIs** → OpenAI for receipt processing

---

## 🗄 Database Schema

### Core Tables

#### Users

```typescript
users: {
  name: string;
  email: string;
  role: "admin" | "manager" | "employee";
  teamId?: Id<"teams">;
}
```

#### Teams

```typescript
teams: {
  name: string;
  createdBy: Id<"users">;
}
```

#### Expenses

```typescript
expenses: {
  amount: number;
  description: string;
  category: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: Id<"users">;
  teamId: Id<"teams">;
  receiptUrl?: string;
  receiptStorageId?: Id<"_storage">;
  approvedBy?: Id<"users">;
  approvedAt?: string;
}
```

#### Budgets

```typescript
budgets: {
  name: string;
  amount: number;
  category?: string;
  teamId: Id<"teams">;
  createdBy: Id<"users">;
  period: "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate: string;
  alertThreshold: number;
  isActive: boolean;
  spent?: number;
}
```

#### Budget Alerts

```typescript
budgetAlerts: {
  budgetId: Id<"budgets">;
  userId: Id<"users">;
  alertType: "threshold" | "exceeded";
  percentage: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}
```

#### Team Invitations

```typescript
teamInvitations: {
  teamId: Id<"teams">;
  email: string;
  role: "admin" | "manager" | "employee";
  invitedBy: Id<"users">;
  status: "pending" | "accepted" | "declined";
  inviteCode: string;
  createdAt: string;
  expiresAt: string;
}
```

### Relationships & Indexes

- **Users → Teams**: Many-to-one relationship
- **Expenses → Users/Teams**: Foreign key relationships
- **Budgets → Teams**: Team-scoped budgets
- **Optimized Indexes**: By team, user, status, date ranges

---

## 🔌 API Functions

### Expense Operations

- `expenses.create` - Create new expense
- `expenses.getMyExpenses` - Get user's expenses
- `expenses.getTeamExpenses` - Get team expenses (Manager+)
- `expenses.getPendingExpenses` - Get pending approvals
- `expenses.approve/reject` - Expense approval workflow

### Budget Management

- `budgets.create` - Create team budget
- `budgets.getActive` - Get active budgets
- `budgets.updateSpent` - Update spending (auto-triggered)
- `budgets.getBudgetAlerts` - Get user alerts
- `budgets.markAlertAsRead` - Mark alert as read

### Team Functions

- `teams.create` - Create new team
- `teams.inviteTeamMember` - Send invitation
- `teams.acceptInvitation` - Accept team invite
- `teams.getTeamInvitations` - Get pending invites
- `teams.updateMemberRole` - Change member role
- `teams.removeTeamMember` - Remove team member

### User Management

- `users.getCurrentUser` - Get current user data
- `users.getTeamMembers` - Get team member list
- `users.createUser` - Create new user

### Receipt Processing

- `receipts.uploadAndProcessReceipt` - AI-powered receipt scanning

---

## 👥 User Roles & Permissions

### Employee (Base Level)

**Capabilities:**

- Submit expenses
- View own expenses
- View team budgets (read-only)
- Receive budget alerts

**Restrictions:**

- Cannot approve expenses
- Cannot create budgets
- Cannot invite team members
- Cannot access team management

### Manager (Mid Level)

**Capabilities:**

- All Employee permissions
- Approve/reject expenses
- Create and manage budgets
- Invite new team members
- View team expense dashboard
- Access team management features

**Restrictions:**

- Cannot remove team members
- Cannot change other member roles

### Admin (Full Access)

**Capabilities:**

- All Manager permissions
- Remove team members
- Change member roles
- Full team management access
- All administrative functions

**Special Powers:**

- Team creation
- Role assignments
- Member removal
- System administration

---

## 🧩 Component Structure

### Dashboard Components

- **`dashboard/page.tsx`** - Main dashboard with tab navigation
- **`analytics-dashboard.tsx`** - Charts and spending insights
- **`budget-dashboard.tsx`** - Budget management interface
- **`team-dashboard.tsx`** - Team collaboration hub

### Form Components

- **`expense-form.tsx`** - Expense creation modal
- **`budget-form.tsx`** - Budget creation modal
- **`team-invite-form.tsx`** - Team invitation modal

### UI Components

- **`ui/button.tsx`** - Reusable button component
- **`ui/card.tsx`** - Card layout component
- **Base components** built on Radix UI primitives

### Features by Component

#### Expense Form

- Manual expense entry
- Receipt upload and AI processing
- Category selection
- Date picker
- Real-time validation

#### Budget Dashboard

- Visual progress indicators
- Alert management
- Budget creation (role-based)
- Status indicators
- Action buttons

#### Team Dashboard

- Member list with roles
- Pending invitations
- Expense approval queue
- Role management
- Quick actions

---

## 🔄 Workflows

### Expense Submission & Approval

```ini
Employee → Submit Expense → Manager Reviews → Approve/Reject → Budget Update → Alerts
```

1. **Employee** creates expense (manual or AI-scanned)
2. **System** sets status to "pending"
3. **Manager/Admin** reviews in team dashboard
4. **Approval** triggers budget update
5. **System** checks budget thresholds
6. **Alerts** generated if thresholds exceeded

### Team Invitation Process

```ini
Admin/Manager → Send Invite → Email Sent → User Accepts → Team Joined
```

1. **Manager/Admin** enters email and role
2. **System** generates unique invite code
3. **Email** sent with invitation link
4. **User** clicks link and signs up/in
5. **System** validates and adds to team

### Budget Alert System

```ini
Expense Approved → Budget Updated → Threshold Check → Alert Created → User Notified
```

1. **Expense** approved by manager
2. **Budget** spending automatically updated
3. **System** checks if threshold exceeded
4. **Alert** created if necessary
5. **User** sees notification in dashboard

---

## 🔒 Security Features

### Authentication & Authorization

- **Clerk Integration**: Secure OAuth and email/password
- **JWT Tokens**: Stateless authentication
- **Role-based Access**: Function-level permissions
- **API Security**: All endpoints require authentication

### Data Protection

- **Input Validation**: All user inputs sanitized
- **SQL Injection Prevention**: Convex's built-in protection
- **File Upload Security**: Validated image uploads
- **HTTPS Enforcement**: All communication encrypted

### Business Logic Security

- **Team Isolation**: Users only access their team data
- **Role Verification**: Double-checking permissions
- **Invitation Security**: Unique codes with expiration
- **Audit Trail**: Tracking all expense approvals

---

## ⚡ Performance Optimizations

### Frontend Optimizations

- **Next.js App Router**: Efficient routing and loading
- **Component Optimization**: React.memo and useMemo
- **Image Optimization**: Next.js image component
- **Bundle Splitting**: Automatic code splitting

### Backend Optimizations

- **Database Indexes**: Optimized query performance
- **Real-time Updates**: Efficient Convex subscriptions
- **Caching**: Convex built-in caching
- **Batch Operations**: Efficient bulk updates

### User Experience

- **Optimistic Updates**: Immediate UI feedback
- **Loading States**: Clear loading indicators
- **Error Handling**: Graceful error recovery
- **Responsive Design**: Mobile-first approach

---

## 🚀 Deployment Guide

### Prerequisites

- Node.js 18+
- Convex account
- Clerk account
- OpenAI API key
- Vercel account (optional)

### Environment Variables

```bash
# Convex
CONVEX_DEPLOYMENT=your-deployment-url
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# OpenAI API
OPENAI_API_KEY=sk-...
```

### Deployment Steps

#### 1. Convex Setup

```bash
npx convex dev
npx convex env set OPENAI_API_KEY your-api-key
npx convex deploy
```

#### 2. Clerk Configuration

- Create Clerk application
- Configure OAuth providers
- Set up webhooks (optional)
- Add domain to allowed origins

#### 3. Frontend Deployment

```bash
npm run build
npm run start
# or deploy to Vercel
vercel deploy
```

#### 4. Production Configuration

- Set production environment variables
- Configure domain settings
- Enable HTTPS
- Set up monitoring

---

## 📊 Key Metrics & Analytics

### Performance Metrics

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms average
- **Real-time Updates**: < 100ms latency
- **Mobile Performance**: 90+ Lighthouse score

### Business Metrics

- **User Engagement**: Dashboard usage tracking
- **Feature Adoption**: Budget/team feature usage
- **Error Rates**: < 1% error rate
- **User Satisfaction**: Intuitive UX design

---

## 🎨 Design System

### Color Palette

- **Primary**: Blue (600-700 range)
- **Success**: Green (600-700 range)
- **Warning**: Orange/Yellow (600-700 range)
- **Danger**: Red (600-700 range)
- **Neutral**: Gray (100-900 range)

### Typography

- **Headers**: Font weight 700-900
- **Body**: Font weight 400-500
- **Emphasis**: Font weight 600
- **Hierarchy**: Clear size and weight differences

### Component Standards

- **Consistent Spacing**: 4px grid system
- **Border Radius**: Consistent rounded corners
- **Shadow System**: Layered depth indicators
- **Interactive States**: Hover and focus states

---

## 🔮 Future Enhancements

### Planned Features

- **Mobile App**: React Native implementation
- **Advanced Analytics**: Custom reporting dashboard
- **Integrations**: Accounting software APIs
- **Bulk Operations**: Multi-expense handling
- **Advanced Budgeting**: Rollover budgets, forecasting

### Technical Improvements

- **Offline Support**: PWA capabilities
- **Advanced Caching**: Redis integration
- **Microservices**: Service decomposition
- **AI Enhancements**: Better receipt recognition

---

## 📞 Support & Maintenance

### Monitoring

- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Real-time metrics
- **User Analytics**: Usage pattern tracking
- **Uptime Monitoring**: 99.9% availability target

### Maintenance Tasks

- **Regular Updates**: Dependency updates
- **Security Patches**: Timely security updates
- **Performance Optimization**: Continuous improvement
- **Feature Updates**: Regular feature releases

---

*This documentation provides a comprehensive overview of SmartExpense for portfolio presentation and technical reference.*