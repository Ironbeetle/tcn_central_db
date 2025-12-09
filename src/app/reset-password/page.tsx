"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requestPasswordReset, verifyPINAndResetPassword } from "@/lib/auth-actions";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [developmentPin, setDevelopmentPin] = useState("");

  const [requestData, setRequestData] = useState({ email: "" });
  const [resetData, setResetData] = useState({
    email: "",
    pin: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await requestPasswordReset(requestData);
      
      if (result.success) {
        setMessage(result.message || "Reset PIN generated");
        setStep("confirm");
        setResetData(prev => ({ ...prev, email: requestData.email }));
        
        // Show PIN in development
        if (result.pin) {
          setDevelopmentPin(result.pin);
          setResetData(prev => ({ ...prev, pin: result.pin || "" }));
        }
      } else {
        setError(result.error || "Failed to request reset");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyPINAndResetPassword({
        email: resetData.email,
        pin: resetData.pin,
        newPassword: resetData.newPassword
      });
      
      if (result.success) {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => router.push("/"), 2000);
      } else {
        setError(result.error || "Failed to reset password");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {step === "request" 
              ? "Enter your email to receive a reset PIN" 
              : "Enter the PIN and your new password"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={requestData.email}
                  onChange={(e) => setRequestData({ email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Generating PIN..." : "Generate Reset PIN"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => router.push("/")}
              >
                Back to Login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Reset PIN</Label>
                <Input
                  id="pin"
                  type="text"
                  value={resetData.pin}
                  onChange={(e) => setResetData(prev => ({ ...prev, pin: e.target.value }))}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  required
                  disabled={loading}
                />
                {developmentPin && (
                  <p className="text-sm text-gray-600">Development PIN: {developmentPin}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={resetData.newPassword}
                  onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={resetData.confirmPassword}
                  onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep("request")}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}