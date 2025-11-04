"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Mail, Copy, Check } from "lucide-react";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    setResetLink("");
    setCopied(false);

    try {
      console.log("🔄 Sending request to:", "/api/auth/forgot-password");
      console.log("📧 Email:", email);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("📊 Response status:", response.status);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (response.ok) {
        setMessage(data.message);
        setEmail("");
        // Show the reset link on screen for easy copying
        if (data.resetLink) {
          setResetLink(data.resetLink);
        }
      } else {
        setError(
          data.error || `Something went wrong (Status: ${response.status})`
        );
      }
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      setError(`Network error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
          <Mail className="text-white h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Reset Password
        </CardTitle>
        <CardDescription>
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {resetLink && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                <div className="font-semibold mb-2">Reset Link:</div>
                <div className="break-all text-sm bg-blue-100 p-2 rounded mb-2">
                  {resetLink}
                </div>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Reset Link
                    </>
                  )}
                </Button>
                <div className="text-xs text-blue-600 mt-2">
                  Click the link above or copy and paste it in your browser
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onBackToLogin}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              Remember your password?{" "}
              <Button
                type="button"
                variant="link"
                onClick={onBackToLogin}
                className="p-0 h-auto text-orange-600 hover:text-orange-700"
              >
                Sign in here
              </Button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
