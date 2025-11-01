"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

/* ----------------------------- Enhanced Types ----------------------------- */

interface SalesReportData {
  kpis: {
    totalSales: number;
    totalOrders: number;
    totalBricks: number;
    aov: number;
    profitMargin: number;
  };
  trends: Array<{ date: string; sales: number; orders?: number }>;
  productSales: Array<{
    id?: string | number;
    name: string;
    quantity: number;
    revenue: number;
    orders?: number;
    profitMargin?: number;
  }>;
  customerSales: Array<{
    id?: string | number;
    name: string;
    totalSpent: number;
    orders: number;
    lastOrder: string;
    avgOrderValue: number;
  }>;
  period: {
    start: string;
    end: string;
  };
  rawData: any[];
}

interface BusinessInsight {
  type: "opportunity" | "warning" | "alert" | "success";
  message: string;
  action: string;
  impact: "high" | "medium" | "low";
  timeframe: string;
  metric?: string;
  value?: number;
}

interface DetailModalState {
  open: boolean;
  type: string | null;
}

/* ----------------------------- Enhanced Helpers ----------------------------- */

const currency = (val: number) => `₹${Math.round(val).toLocaleString()}`;
const percent = (val: number) => `${val.toFixed(1)}%`;

/* Enhanced CSV exporter with business context */
function downloadCSV(filename: string, rows: any[], context?: string) {
  if (!rows || rows.length === 0) {
    const blob = new Blob([""], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(",") +
    "\n" +
    rows
      .map((row) =>
        keys
          .map((k) => {
            const v =
              row[k] === null || row[k] === undefined ? "" : `${row[k]}`;
            const escaped = v.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      )
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ----------------------------- Business Intelligence Engine ----------------------------- */

function generateBusinessInsights(
  data: SalesReportData | null
): BusinessInsight[] {
  if (!data) return [];

  const insights: BusinessInsight[] = [];
  const { kpis, trends, customerSales, productSales } = data;

  // 1. Revenue Performance Analysis
  if (trends?.length >= 7) {
    const last7Days = trends.slice(-7);
    const prev7Days = trends.slice(-14, -7);

    const currentAvg = last7Days.reduce((sum, day) => sum + day.sales, 0) / 7;
    const previousAvg = prev7Days.reduce((sum, day) => sum + day.sales, 0) / 7;

    const growthRate = ((currentAvg - previousAvg) / previousAvg) * 100;

    if (growthRate < -15) {
      insights.push({
        type: "alert",
        message: `Revenue declined ${Math.abs(growthRate).toFixed(
          1
        )}% compared to previous week`,
        action: "Analyze recent sales patterns and check inventory levels",
        impact: "high",
        timeframe: "Immediate",
        metric: "revenue_growth",
        value: growthRate,
      });
    } else if (growthRate > 20) {
      insights.push({
        type: "success",
        message: `Strong revenue growth of ${growthRate.toFixed(
          1
        )}% week-over-week`,
        action: "Capitalize on momentum with targeted promotions",
        impact: "high",
        timeframe: "This week",
        metric: "revenue_growth",
        value: growthRate,
      });
    }
  }

  // 2. Customer Value Analysis
  const highValueCustomers = customerSales.filter((c) => c.totalSpent > 50000);
  const repeatCustomers = customerSales.filter((c) => c.orders >= 3);

  if (highValueCustomers.length > 0) {
    insights.push({
      type: "opportunity",
      message: `${highValueCustomers.length} high-value customers (₹50k+ spending) identified`,
      action: "Create exclusive offers to increase retention",
      impact: "high",
      timeframe: "Next 30 days",
      metric: "high_value_customers",
      value: highValueCustomers.length,
    });
  }

  // 3. Product Portfolio Analysis
  if (productSales.length > 0) {
    const totalRevenue = kpis.totalSales;
    const topProduct = productSales[0];
    const contribution = (topProduct.revenue / totalRevenue) * 100;

    if (contribution > 40) {
      insights.push({
        type: "warning",
        message: `${topProduct.name} contributes ${contribution.toFixed(
          1
        )}% of total revenue`,
        action: "Diversify product portfolio to reduce dependency",
        impact: "medium",
        timeframe: "Next quarter",
        metric: "product_concentration",
        value: contribution,
      });
    }

    // Identify slow-moving products
    const slowProducts = productSales.filter(
      (p) => p.quantity < 10 && p.revenue < totalRevenue * 0.02
    );

    if (slowProducts.length > 0) {
      insights.push({
        type: "alert",
        message: `${slowProducts.length} underperforming products identified`,
        action: "Review pricing, marketing, or consider discontinuation",
        impact: "medium",
        timeframe: "Next 30 days",
        metric: "slow_products",
        value: slowProducts.length,
      });
    }
  }

  // 4. Profitability Analysis
  if (kpis.profitMargin < 15) {
    insights.push({
      type: "warning",
      message: `Low profit margin of ${kpis.profitMargin.toFixed(1)}%`,
      action: "Review cost structure and pricing strategy",
      impact: "high",
      timeframe: "Immediate",
      metric: "profit_margin",
      value: kpis.profitMargin,
    });
  }

  // 5. Order Volume Health
  const avgOrdersPerDay = kpis.totalOrders / (trends?.length || 1);
  if (avgOrdersPerDay < 2) {
    insights.push({
      type: "alert",
      message: `Low order volume: ${avgOrdersPerDay.toFixed(1)} orders per day`,
      action: "Implement customer acquisition campaigns",
      impact: "high",
      timeframe: "This month",
      metric: "order_volume",
      value: avgOrdersPerDay,
    });
  }

  // 6. Customer Retention Analysis
  const retentionRate = (repeatCustomers.length / customerSales.length) * 100;
  if (retentionRate < 30 && customerSales.length > 10) {
    insights.push({
      type: "warning",
      message: `Low customer retention rate: ${retentionRate.toFixed(1)}%`,
      action: "Implement loyalty program and follow-up system",
      impact: "medium",
      timeframe: "Next quarter",
      metric: "retention_rate",
      value: retentionRate,
    });
  }

  // Fallback insight
  if (insights.length === 0) {
    insights.push({
      type: "success",
      message: "Business performance is stable across key metrics",
      action: "Focus on incremental growth opportunities",
      impact: "low",
      timeframe: "Ongoing",
      metric: "overall_health",
      value: 100,
    });
  }

  return insights.slice(0, 6); // Return top 6 insights
}

/* ----------------------------- Business Intelligence Components ----------------------------- */

function BusinessHealthScore({ data }: { data: SalesReportData }) {
  const calculateHealthScore = () => {
    let score = 0;
    const { kpis, trends, customerSales } = data;

    // Revenue growth (25 points)
    if (trends.length >= 2) {
      const growth =
        ((trends[trends.length - 1].sales - trends[0].sales) /
          trends[0].sales) *
        100;
      score += Math.min(25, Math.max(0, growth * 0.5));
    }

    // Profit margin (25 points)
    score += Math.min(25, kpis.profitMargin * 1.5);

    // Customer base (25 points)
    const customerScore = Math.min(25, customerSales.length * 2);
    score += customerScore;

    // Order volume (25 points)
    const orderScore = Math.min(25, kpis.totalOrders * 0.5);
    score += orderScore;

    return Math.round(Math.min(100, score));
  };

  const score = calculateHealthScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4" />
          Business Health Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full border-4 border-gray-200 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {score}
              </span>
            </div>
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-blue-500 -rotate-90"></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {score >= 80
              ? "Excellent"
              : score >= 60
              ? "Good"
              : "Needs Attention"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceForecast({ data }: { data: SalesReportData }) {
  const forecast = useMemo(() => {
    if (!data.trends || data.trends.length < 7) return null;

    const recentSales = data.trends.slice(-7).map((t) => t.sales);
    const avgDaily = recentSales.reduce((a, b) => a + b, 0) / 7;
    const monthlyProjection = avgDaily * 30;
    const growthRate = 0.1; // Assume 10% growth

    return {
      currentMonthly: data.kpis.totalSales,
      projectedMonthly: monthlyProjection,
      growthPotential: monthlyProjection - data.kpis.totalSales,
      growthRate: growthRate,
    };
  }, [data]);

  if (!forecast) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4" />
          30-Day Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Current</span>
          <span className="font-semibold">
            {currency(forecast.currentMonthly)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Projected</span>
          <span className="font-semibold text-green-600">
            {currency(forecast.projectedMonthly)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Growth Potential</span>
          <span className="font-semibold text-blue-600">
            +{currency(forecast.growthPotential)}
          </span>
        </div>
        <Progress value={60} className="h-2" />
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Helper Components ----------------------------- */

function KPICard({
  title,
  value,
  format,
  Icon,
  description,
  trend,
  onClick,
}: {
  title: string;
  value: number;
  format: "currency" | "number" | "percentage";
  Icon: any;
  description: string;
  trend: number;
  onClick: () => void;
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return currency(val);
      case "percentage":
        return percent(val);
      case "number":
        return val.toLocaleString();
      default:
        return String(val);
    }
  };

  const isPositive = trend >= 0;

  return (
    <Card
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200 bg-gradient-to-br from-white to-gray-50"
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-xl font-bold text-gray-900">
                {formatValue(value)}
              </p>
            </div>
          </div>
          <div
            className={`text-right ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <p className="text-sm font-medium">
              {isPositive ? (
                <ArrowUpRight className="inline-block h-4 w-4" />
              ) : (
                <ArrowDownRight className="inline-block h-4 w-4" />
              )}{" "}
              {isPositive ? "+" : ""}
              {Math.abs(Number(trend)).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">vs last period</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">{description}</p>
      </CardContent>
    </Card>
  );
}

function SummaryTile({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <p className={`text-2xl font-bold ${color || "text-gray-900"}`}>
        {value}
      </p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function DetailModal({
  isOpen,
  type,
  data,
  onClose,
}: {
  isOpen: boolean;
  type: string | null;
  data: any;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const renderContent = () => {
    if (!data) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    switch (type) {
      case "customers":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              All Customers ({data.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.map((customer: any, idx: number) => (
                <div
                  key={customer.id ?? idx}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-green-600">
                        {idx + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {customer.orders} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      {currency(customer.totalSpent)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Last: {new Date(customer.lastOrder).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "products":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              All Products ({data.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.map((p: any, idx: number) => (
                <div
                  key={p.id ?? idx}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {p.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {p.quantity.toLocaleString()} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      {currency(p.revenue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {p.orders ?? 0} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "sales":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sales Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currency(data.kpis.totalSales)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currency(data.kpis.aov)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Sales Trend</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.trends.map((t: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 border-b"
                  >
                    <span className="text-sm">{t.date}</span>
                    <span className="font-semibold">{currency(t.sales)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "profit":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profit Analysis</h3>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className="text-3xl font-bold text-orange-600">
                {percent(data.profitMargin || 0)}
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                This represents the gross profit margin based on your sales
                data.
              </p>
            </div>
          </div>
        );

      case "bricks":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Bricks Sold: {data.bricks?.toLocaleString()}
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.productSales.map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="font-semibold">
                    {p.quantity.toLocaleString()} units
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "orders":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Orders</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-gray-500">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Invoice</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="py-3">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        {r.invoice ?? `INV-${1000 + idx}`}
                      </td>
                      <td className="py-3">{r.customer ?? "-"}</td>
                      <td className="py-3">{currency(r.amount ?? 0)}</td>
                      <td className="py-3 text-sm text-green-600">
                        {r.status ?? "Paid"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Detailed view for {type}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {type === "customers" && "All Customers"}
            {type === "products" && "All Products"}
            {type === "sales" && "Sales Details"}
            {type === "profit" && "Profit Analysis"}
            {type === "bricks" && "Bricks Sold Details"}
            {type === "orders" && "Order Details"}
          </h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            ✕
          </Button>
        </div>

        <div className="p-4 md:p-6 overflow-auto">{renderContent()}</div>
      </div>
    </div>
  );
}

function SalesReportSkeleton() {
  return (
    <div className="space-y-6 p-4">
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

      {/* Business Intelligence Overview Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ----------------------------- Utilities ----------------------------- */

function calcRecentTrend(trends: any[], key: "sales" | "orders" = "sales") {
  if (!trends || trends.length < 2) return 0;
  const last = trends[trends.length - 1][key] ?? 0;
  const prev = trends[trends.length - 2][key] ?? 0;
  if (prev === 0) return last === 0 ? 0 : 100;
  return ((last - prev) / Math.abs(prev)) * 100;
}

/* ----------------------------- Main Component ----------------------------- */

export default function SalesReport() {
  const { token } = useAuth();
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    open: false,
    type: null,
  });

  useEffect(() => {
    if (token) fetchSalesReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, period]);

  async function fetchSalesReport() {
    try {
      setLoading(true);
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

      if (response.ok) {
        const reportData = await response.json();
        setData(reportData);
      } else {
        console.error(
          "API returned error:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to fetch sales report:", error);
    } finally {
      setLoading(false);
    }
  }

  const businessInsights = useMemo(
    () => generateBusinessInsights(data),
    [data]
  );

  function handleCardClick(type: string) {
    setDetailModal({ open: true, type });
  }

  const getModalData = (type: string | null) => {
    if (!data) return null;

    switch (type) {
      case "customers":
        return data.customerSales;
      case "products":
        return data.productSales;
      case "sales":
        return { kpis: data.kpis, trends: data.trends };
      case "orders":
        return data.rawData;
      case "profit":
        return data.kpis;
      case "bricks":
        return {
          bricks: data.kpis.totalBricks,
          productSales: data.productSales,
        };
      default:
        return null;
    }
  };

  function handleExportCSV() {
    if (!data) return;
    const rows = data.rawData.length ? data.rawData : [];
    downloadCSV(`sales-intelligence-${period}.csv`, rows);
  }

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
  const PIE_COLORS = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
  ];

  return (
    <div className="space-y-6 p-4 max-w-full">
      {/* Enhanced Header with Business Context */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Sales Intelligence
          </h2>
          <p className="text-gray-600 text-sm">
            Advanced analytics for revenue optimization & growth strategy
          </p>
          <p className="text-xs text-gray-500">
            {new Date(data.period.start).toLocaleDateString()} —{" "}
            {new Date(data.period.end).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
            aria-label="Select period"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>

          <Button
            variant="outline"
            className="whitespace-nowrap"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Business Intelligence Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <BusinessHealthScore data={data} />
        <PerformanceForecast data={data} />

        {/* Quick Stats Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Customer Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <span className="font-semibold">{customerSales.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Repeat Rate</span>
                <span className="font-semibold">
                  {Math.round(
                    (customerSales.filter((c) => c.orders > 1).length /
                      customerSales.length) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              Product Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active SKUs</span>
                <span className="font-semibold">{productSales.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Top Seller</span>
                <span className="font-semibold text-sm">
                  {productSales[0]?.name?.substring(0, 12)}...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenue Intelligence"
          value={kpis.totalSales}
          format="currency"
          Icon={DollarSign}
          description="Total revenue with trend analysis"
          trend={calcRecentTrend(trends, "sales")}
          onClick={() => handleCardClick("sales")}
        />
        <KPICard
          title="Order Velocity"
          value={kpis.totalOrders}
          format="number"
          Icon={ShoppingCart}
          description="Transaction volume & frequency"
          trend={calcRecentTrend(trends, "orders")}
          onClick={() => handleCardClick("orders")}
        />
        <KPICard
          title="Customer Value"
          value={kpis.aov}
          format="currency"
          Icon={TrendingUp}
          description="Average revenue per customer"
          trend={kpis.aov ? (kpis.aov / Math.max(1, kpis.aov) - 1) * 100 : 0}
          onClick={() => handleCardClick("aov")}
        />
        <KPICard
          title="Margin Health"
          value={kpis.profitMargin}
          format="percentage"
          Icon={PieChartIcon}
          description="Gross profit percentage"
          trend={0}
          onClick={() => handleCardClick("profit")}
        />
      </div>

      {/* Business Intelligence Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Business Intelligence
          </CardTitle>
          <CardDescription>
            AI-powered insights for strategic decision making
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businessInsights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === "alert"
                    ? "border-l-red-400 bg-red-50"
                    : insight.type === "warning"
                    ? "border-l-amber-400 bg-amber-50"
                    : insight.type === "success"
                    ? "border-l-green-400 bg-green-50"
                    : "border-l-blue-400 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    {insight.type === "alert" ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : insight.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : insight.type === "success" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      {insight.message}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Action:</span>{" "}
                      {insight.action}
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-xs">
                        {insight.impact} Impact
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {insight.timeframe}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Revenue Trend Analysis
            </CardTitle>
            <CardDescription>
              Daily revenue patterns with 7-day moving average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <SummaryTile
                value={currency(kpis.totalSales)}
                label="Total Revenue"
                color="text-green-600"
              />
              <SummaryTile
                value={kpis.totalOrders.toString()}
                label="Total Orders"
                color="text-blue-600"
              />
              <SummaryTile
                value={percent(kpis.profitMargin)}
                label="Profit Margin"
                color="text-orange-600"
              />
              <SummaryTile
                value={currency(kpis.aov)}
                label="Avg Order Value"
                color="text-purple-600"
              />
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Key Business Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue per Customer</span>
                  <span className="font-medium">
                    {currency(
                      kpis.totalSales / Math.max(1, customerSales.length)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Orders per Day</span>
                  <span className="font-medium">
                    {(kpis.totalOrders / (trends?.length || 1)).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer & Product Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Top Customers
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCardClick("customers")}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(customerSales || []).slice(0, 5).map((c, i) => (
                <div
                  key={c.id ?? i}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {i + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.orders} orders</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {currency(c.totalSpent)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Last: {new Date(c.lastOrder).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(customerSales || []).length === 0 && (
                <p className="text-sm text-gray-500">
                  No customers in this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Top Products
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCardClick("products")}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(productSales || []).slice(0, 6).map((p, i) => (
                <div
                  key={p.id ?? i}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {p.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {p.quantity.toLocaleString()} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {currency(p.revenue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {p.orders ?? 0} orders
                    </p>
                  </div>
                </div>
              ))}

              {(productSales || []).length === 0 && (
                <p className="text-sm text-gray-500">
                  No products sold in this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Revenue Contribution */}
      <Card>
        <CardHeader>
          <CardTitle>Product Revenue Contribution</CardTitle>
          <CardDescription>Top 6 products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div style={{ width: 220, height: 220 }} className="mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productSales.slice(0, 6)}
                    dataKey="revenue"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={35}
                    paddingAngle={3}
                    label={(entry) => `${entry.name}`}
                  >
                    {productSales.slice(0, 6).map((_, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1">
              {(productSales || []).slice(0, 6).map((p, i) => (
                <div
                  key={p.id ?? i}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        background: PIE_COLORS[i % PIE_COLORS.length],
                        borderRadius: 4,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.quantity.toLocaleString()} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{currency(p.revenue)}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round(
                        (p.revenue / Math.max(1, kpis.totalSales)) * 100
                      )}
                      %
                    </p>
                  </div>
                </div>
              ))}

              {(productSales || []).length === 0 && (
                <p className="text-sm text-gray-500">
                  No product data available
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <DetailModal
        isOpen={detailModal.open}
        type={detailModal.type}
        data={getModalData(detailModal.type)}
        onClose={() => setDetailModal({ open: false, type: null })}
      />
    </div>
  );
}
