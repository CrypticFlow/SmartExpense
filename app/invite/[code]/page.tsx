"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const acceptInvitation = useMutation(api.teams.acceptInvitation);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      // Redirect to sign in with the invite code preserved
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const handleInvitation = async () => {
      try {
        const inviteCode = params.code as string;
        if (!inviteCode) {
          setStatus("error");
          setMessage("Invalid invitation link");
          return;
        }

        await acceptInvitation({ inviteCode });
        setStatus("success");
        setMessage("Successfully joined the team!");
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Failed to accept invitation");
      }
    };

    handleInvitation();
  }, [user, isLoaded, params.code, acceptInvitation, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center">
            {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-blue-600" />}
            {status === "success" && <CheckCircle className="h-8 w-8 text-green-600" />}
            {status === "error" && <XCircle className="h-8 w-8 text-red-600" />}
          </div>
          <CardTitle className="text-center">
            {status === "loading" && "Processing Invitation..."}
            {status === "success" && "Welcome to the Team!"}
            {status === "error" && "Invitation Error"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">{message}</p>
          
          {status === "success" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Redirecting to dashboard in a moment...
              </p>
              <Button 
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
          
          {status === "error" && (
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}