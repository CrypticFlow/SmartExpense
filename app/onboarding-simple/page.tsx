"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SimpleOnboarding() {
  const [teamName, setTeamName] = useState("");
  const router = useRouter();

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    
    // For now, just redirect to dashboard
    localStorage.setItem("teamName", teamName);
    router.push("/dashboard-simple");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to SmartExpense!</CardTitle>
          <p className="text-center text-gray-600">Let's set up your team to get started.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!teamName.trim()}
            >
              Create Team & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}