"use client";

import { useEffect, useState } from "react";
import DashboardStats from "./DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  ShoppingCart,
  DollarSign,
  FileText,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface DashboardData {
  totalCustomers: number;
  totalSales: number;
  totalRevenue: number;
  totalDues: number;
  todaySales: number;
  todayRevenue: number;
  pendingDues: number;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardData>({
    totalCustomers: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalDues: 0,
    todaySales: 0,
    todayRevenue: 0,
    pendingDues: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboardStats();
    }
  }, [token]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      title: "New Customer",
      description: "Add a new customer",
      icon: Users,
      href: "/customers?action=new",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "New Sale",
      description: "Create a new sale",
      icon: ShoppingCart,
      href: "/sales",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "View Dues",
      description: "Manage pending payments",
      icon: DollarSign,
      href: "/dues",
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      title: "Generate Report",
      description: "View business reports",
      icon: FileText,
      href: "/reports",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        {" "}
        {/* Added padding for bottom nav */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {" "}
      {/* Added padding for bottom nav */}
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || "User"}!
        </h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          Here's what's happening with your business today.
        </p>
      </div>
      {/* Dashboard Stats */}
      <DashboardStats stats={stats} />
      {/* Quick Actions - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div
                    className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <Clock className="h-5 w-5 mr-2" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No recent sales</p>
              <Link href="/sales">
                <Button variant="outline" size="sm" className="mt-3">
                  Create First Sale
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <DollarSign className="h-5 w-5 mr-2" />
              Pending Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No pending dues</p>
              <Link href="/dues">
                <Button variant="outline" size="sm" className="mt-3">
                  View All Dues
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* OLD BOTTOM NAVIGATION REMOVED FROM HERE */}
    </div>
  );
}
