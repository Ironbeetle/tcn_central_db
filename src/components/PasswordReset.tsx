"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2 } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth-actions";
import type { PasswordResetRequestInput } from "@/lib/validations/auth-schemas";

export default function PasswordReset() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<PasswordResetRequestInput>({
    email: "",
  });
  
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await requestPasswordReset(formData);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Password reset request failed. Please try again.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleVerifyPIN = () => {
    router.push("/verify-pin");
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md mx-auto p-6 shadow-lg">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Reset PIN Generated
            </h1>
            <p className="text-gray-600 mb-6">
              A 6-digit PIN has been generated for your password reset. 
              Contact your IT administrator to obtain the PIN.
            </p>
            <div className="space-y-3">
              <Button onClick={handleVerifyPIN} className="w-full">
                I Have My PIN
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBackToLogin} 
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md mx-auto p-6 shadow-lg">
        <div className="mb-6">
          <button
            onClick={handleBackToLogin}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4"
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">
            Reset Password
          </h1>
          <p className="text-gray-600 mt-2">
            Enter your email address to request a password reset PIN
          </p>
        </div>

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !formData.email}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting PIN...
              </>
            ) : (
              "Request Reset PIN"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>The reset PIN will be provided by your IT administrator</p>
          <p>PINs expire after 15 minutes for security</p>
        </div>
      </Card>
    </div>
  );
}