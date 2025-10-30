"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

interface DashboardStatsProps {
  stats: {
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
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const mainStatCards = [
    {
      title: "Total Customers",
      value: formatNumber(stats.totalCustomers),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: `${stats.customersWithAdvance} with advance`,
    },
    {
      title: "Total Sales",
      value: formatNumber(stats.totalSales),
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: `${stats.todaySales} today`,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: formatCurrency(stats.todayRevenue) + " today",
    },
    {
      title: "Total Advance",
      value: formatCurrency(stats.totalAdvance),
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      description: `${stats.customersWithAdvance} customers`,
    },
  ];

  const todayStats = [
    {
      title: "Today's Sales",
      value: formatNumber(stats.todaySales),
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Advance Added",
      value: formatCurrency(stats.todayAdvanceAdded),
      icon: ArrowDownLeft,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "positive" as const,
    },
    {
      title: "Advance Used",
      value: formatCurrency(stats.todayAdvanceUsed),
      icon: ArrowUpRight,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      trend: "negative" as const,
    },
  ];

  const financialStats = [
    {
      title: "Pending Dues",
      value: formatCurrency(stats.totalDues),
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: `${stats.pendingDues} pending payments`,
    },
    {
      title: "Net Cash Flow",
      value: formatCurrency(stats.totalRevenue - stats.totalDues),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      description: "Revenue minus dues",
    },
    {
      title: "Advance Utilization",
      value:
        stats.totalAdvance > 0
          ? `${Math.round(
              (stats.todayAdvanceUsed / stats.totalAdvance) * 100
            )}%`
          : "0%",
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Today's usage rate",
    },
    {
      title: "Customer Coverage",
      value:
        stats.totalCustomers > 0
          ? `${Math.round(
              (stats.customersWithAdvance / stats.totalCustomers) * 100
            )}%`
          : "0%",
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      description: "With advance balance",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {mainStatCards.map((stat, index) => (
          <Card
            key={index}
            className="min-h-[100px] hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              {stat.description && (
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Stats - 2 columns on mobile */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Today's Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {todayStats.map((stat, index) => (
            <Card
              key={index}
              className="min-h-[100px] hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon
                    className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div
                  className={`text-lg md:text-2xl font-bold ${
                    stat.trend === "positive"
                      ? "text-green-600"
                      : stat.trend === "negative"
                      ? "text-orange-600"
                      : "text-gray-900"
                  }`}
                >
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Financial Insights - 2 columns on mobile */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Financial Insights
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {financialStats.map((stat, index) => (
            <Card
              key={index}
              className="min-h-[100px] hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon
                    className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg md:text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
