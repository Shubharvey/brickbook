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
  Wallet,
  TrendingUp,
  ArrowUpRight,
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
  // NEW: Advance statistics
  totalAdvance: number;
  customersWithAdvance: number;
  todayAdvanceAdded: number;
  todayAdvanceUsed: number;
}

interface RecentActivity {
  id: string;
  type: "sale" | "advance" | "payment";
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  customerName: string;
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
    totalAdvance: 0,
    customersWithAdvance: 0,
    todayAdvanceAdded: 0,
    todayAdvanceUsed: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboardStats();
      fetchRecentActivity();
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

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/dashboard/activity", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
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
      title: "Manage Advance",
      description: "View advance balances",
      icon: Wallet,
      href: "/advance",
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      title: "View Dues",
      description: "Manage pending payments",
      icon: DollarSign,
      href: "/dues",
      color: "bg-red-500 hover:bg-red-600",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "sale":
        return ShoppingCart;
      case "advance":
        return Wallet;
      case "payment":
        return DollarSign;
      default:
        return TrendingUp;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "sale":
        return "text-green-600 bg-green-100";
      case "advance":
        return "text-blue-600 bg-blue-100";
      case "payment":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
      {/* Recent Activity & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-lg ${getActivityColor(
                          activity.type
                        )}`}
                      >
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.customerName} •{" "}
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      {activity.amount && (
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(activity.amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm mt-1">Activities will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Total Revenue
                  </p>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-green-600" />
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Total Advance
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(stats.totalAdvance)}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Pending Dues
                  </p>
                  <p className="text-lg font-bold text-red-900">
                    {formatCurrency(stats.totalDues)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Net Cash Flow
                  </p>
                  <p className="text-lg font-bold text-purple-900">
                    {formatCurrency(stats.totalRevenue - stats.totalDues)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-gray-900">
                    {stats.customersWithAdvance}
                  </p>
                  <p className="text-gray-600">With Advance</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">
                    {stats.todaySales}
                  </p>
                  <p className="text-gray-600">Today's Sales</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(stats.todayAdvanceAdded)}
                  </p>
                  <p className="text-gray-600">Advance Added</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">
                    {stats.pendingDues}
                  </p>
                  <p className="text-gray-600">Pending Dues</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Mobile Quick Actions */}
      <div className="md:hidden">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer p-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
