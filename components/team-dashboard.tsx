"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Mail, Crown, Shield, User, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import TeamInviteForm from "./team-invite-form";

export default function TeamDashboard() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const teamMembers = useQuery(api.users.getTeamMembers, 
    currentUser?.teamId ? { teamId: currentUser.teamId } : "skip"
  );
  const teamInvitations = useQuery(api.teams.getTeamInvitations);
  const pendingExpenses = useQuery(api.expenses.getPendingExpenses);
  
  const updateMemberRole = useMutation(api.teams.updateMemberRole);
  const removeTeamMember = useMutation(api.teams.removeTeamMember);
  const cancelInvitation = useMutation(api.teams.cancelInvitation);
  const approveExpense = useMutation(api.expenses.approve);
  const rejectExpense = useMutation(api.expenses.reject);

  const isAdmin = currentUser?.role === "admin";
  const canManage = currentUser?.role === "admin" || currentUser?.role === "manager";

  const handleRoleChange = async (userId: string, newRole: "admin" | "manager" | "employee") => {
    if (!isAdmin) return;
    
    try {
      await updateMemberRole({ userId: userId as any, role: newRole });
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!isAdmin) return;
    
    if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      try {
        await removeTeamMember({ userId: userId as any });
      } catch (error) {
        console.error("Failed to remove member:", error);
      }
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!canManage) return;
    
    try {
      await cancelInvitation({ invitationId: invitationId as any });
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    }
  };

  const handleExpenseAction = async (expenseId: string, action: "approve" | "reject") => {
    if (!canManage) return;
    
    try {
      if (action === "approve") {
        await approveExpense({ expenseId: expenseId as any });
      } else {
        await rejectExpense({ expenseId: expenseId as any });
      }
    } catch (error) {
      console.error(`Failed to ${action} expense:`, error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="h-4 w-4 text-yellow-600" />;
      case "manager": return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-yellow-100 text-yellow-800";
      case "manager": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!canManage) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Team Management</h3>
        <p className="text-gray-600">You need manager or admin permissions to access team management features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600 mt-1">Manage team members and approve expenses</p>
        </div>
        {canManage && (
          <Button 
            onClick={() => setShowInviteForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Pending Expenses */}
      {pendingExpenses && pendingExpenses.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              <CardTitle className="text-orange-800">Pending Approvals ({pendingExpenses.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingExpenses.slice(0, 5).map((expense: any) => (
                <div 
                  key={expense._id} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{expense.description}</h4>
                      <span className="font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {expense.submitterName} • {expense.category} • {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExpenseAction(expense._id, "approve")}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExpenseAction(expense._id, "reject")}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {pendingExpenses.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  And {pendingExpenses.length - 5} more pending...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>Team Members ({teamMembers?.length || 0})</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers?.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {getRoleIcon(member.role)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAdmin && member._id !== currentUser?._id ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member._id, e.target.value as any)}
                          className="text-xs px-2 py-1 border rounded"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveMember(member._id, member.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-orange-600 mr-2" />
              <CardTitle>Pending Invitations ({teamInvitations?.filter(inv => inv.status === "pending").length || 0})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamInvitations?.filter(inv => inv.status === "pending").map((invitation) => (
                <div key={invitation._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-600">
                      Role: {invitation.role} • Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelInvitation(invitation._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
              
              {(!teamInvitations || teamInvitations.filter(inv => inv.status === "pending").length === 0) && (
                <p className="text-gray-500 text-center py-4">No pending invitations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <TeamInviteForm
          onClose={() => setShowInviteForm(false)}
          onSuccess={() => {
            // Invitations will automatically refresh due to Convex reactivity
          }}
        />
      )}
    </div>
  );
}