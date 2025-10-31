"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  Calendar,
  Download,
} from "lucide-react";

interface SalesReportData {
  kpis: {
    totalSales: number;
    totalOrders: number;
    totalBricks: number;
    aov: number;
    profitMargin: number;
  };
  trends: any[];
  productSales: any[];
  customerSales: any[];
  period: {
    start: string;
    end: string;
  };
}

export default function SalesReport() {
  const { token } = useAuth(); // Get token from auth context
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    if (token) {
      fetchSalesReport();
    }
  }, [token, period]);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);

      console.log(
        "Fetching sales report with token:",
        token ? "Found" : "Not found"
      );

      if (!token) {
        console.error("No authentication token available");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/reports/sales?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API Response status:", response.status);

      if (response.ok) {
        const reportData = await response.json();
        console.log("Sales report data received:", reportData);
        setData(reportData);
      } else {
        console.error(
          "API returned error:",
          response.status,
          response.statusText
        );
        const errorData = await response.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch sales report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SalesReportSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load sales report</p>
        <Button onClick={fetchSalesReport} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const { kpis, trends, productSales, customerSales } = data;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sales Report</h2>
          <p className="text-gray-600">
            {new Date(data.period.start).toLocaleDateString()} -{" "}
            {new Date(data.period.end).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Sales"
          value={kpis.totalSales}
          format="currency"
          icon={DollarSign}
          description="Total revenue"
          trend={12.5}
        />
        <KPICard
          title="Total Orders"
          value={kpis.totalOrders}
          format="number"
          icon={ShoppingCart}
          description="Number of transactions"
          trend={8.2}
        />
        <KPICard
          title="Avg Order Value"
          value={kpis.aov}
          format="currency"
          icon={TrendingUp}
          description="Average per order"
          trend={4.1}
        />
        <KPICard
          title="Bricks Sold"
          value={kpis.totalBricks}
          format="number"
          icon={Package}
          description="Total units sold"
          trend={15.7}
        />
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Profit Margin"
          value={kpis.profitMargin}
          format="percentage"
          icon={TrendingUp}
          description="Gross profit percentage"
          trend={2.3}
        />
        <KPICard
          title="Top Customers"
          value={customerSales.length}
          format="number"
          icon={Users}
          description="Active buyers"
          trend={5.6}
        />
        <KPICard
          title="Products Sold"
          value={productSales.length}
          format="number"
          icon={Package}
          description="Unique products"
          trend={3.4}
        />
      </div>

      {/* Quick Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                ₹{kpis.totalSales.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {kpis.totalOrders}
              </p>
              <p className="text-sm text-gray-600">Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {kpis.totalBricks.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Bricks Sold</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {kpis.profitMargin.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Margin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: number;
  format: "currency" | "number" | "percentage";
  icon: any;
  description: string;
  trend: number;
}

function KPICard({
  title,
  value,
  format,
  icon: Icon,
  description,
  trend,
}: KPICardProps) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case "currency":
        return `₹${val.toLocaleString()}`;
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "number":
        return val.toLocaleString();
      default:
        return val.toString();
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value, format)}</p>
            </div>
          </div>
          <div
            className={`text-right ${
              trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            <p className="text-sm font-medium">
              {trend >= 0 ? "+" : ""}
              {trend}%
            </p>
            <p className="text-xs text-gray-500">vs last period</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}

function SalesReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
