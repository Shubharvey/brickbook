"use client";

import { useAuth } from "../contexts/AuthContext";
import AuthForm from "../components/auth/LoginForm";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardPage from "../components/dashboard/DashboardPage";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
