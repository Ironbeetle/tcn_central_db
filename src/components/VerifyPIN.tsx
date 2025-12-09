"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { verifyPINAndResetPassword } from "@/lib/auth-actions";
import type { PasswordResetVerifyInput } from "@/lib/validations/auth-schemas";

export default function VerifyPIN() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<PasswordResetVerifyInput>({
    email: "",
    pin: "",
    newPassword: "",
    confirmPassword: "",
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
      const result = await verifyPINAndResetPassword(formData);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Password reset failed. Please try again.");
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleBackToReset = () => {
    router.push("/reset-password");
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
              Password Reset Successful
            </h1>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <Button onClick={handleBackToLogin} className="w-full">
              Back to Login
            </Button>
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
            onClick={handleBackToReset}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4"
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reset Request
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">
            Verify PIN & Reset Password
          </h1>
          <p className="text-gray-600 mt-2">
            Enter your PIN and new password
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

          <div className="space-y-2">
            <Label htmlFor="pin">Reset PIN</Label>
            <Input
              id="pin"
              name="pin"
              type="text"
              value={formData.pin}
              onChange={handleInputChange}
              placeholder="Enter 6-digit PIN"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              disabled={loading}
              className="w-full text-center text-lg tracking-widest"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Enter new password"
                required
                disabled={loading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm new password"
                required
                disabled={loading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !formData.email || !formData.pin || !formData.newPassword || !formData.confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            disabled={loading}
          >
            Back to Login
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>PIN expires after 15 minutes</p>
          <p>Password must be at least 8 characters with uppercase, lowercase, and numbers</p>
        </div>
      </Card>
    </div>
  );
}