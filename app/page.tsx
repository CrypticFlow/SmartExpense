"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  useEffect(() => {
    if (user && currentUser) {
      router.push("/dashboard");
    } else if (user && currentUser === null) {
      // User exists but no currentUser record, go to dashboard
      router.push("/dashboard");
    }
  }, [user, currentUser, router]);

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting to dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Smart<span className="text-blue-600">Expense</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-powered team expense management that makes tracking receipts, approvals, and budgets effortless.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <SignUpButton mode="modal">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Started Free
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </SignInButton>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">📷 AI Receipt Scanning</h3>
            <p className="text-gray-600">Snap a photo and let AI extract all the details automatically.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">⚡ Real-time Collaboration</h3>
            <p className="text-gray-600">Team updates happen instantly across all devices.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">🔒 Smart Approvals</h3>
            <p className="text-gray-600">Automated policy checks and streamlined approval workflows.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
