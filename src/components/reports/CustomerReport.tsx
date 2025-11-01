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
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  Star,
  AlertTriangle,
  Clock,
  Target,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

/* ----------------------------- Types ----------------------------- */

interface CustomerReportData {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    repeatRate: number;
    avgOrderValue: number;
    totalRevenue: number;
  };
  customerSegments: Array<{
    segment: string;
    count: number;
    revenue: number;
    avgOrders: number;
    growth: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    orders: number;
    firstOrder: string;
    lastOrder: string;
    daysSinceLastOrder: number;
    avgOrderValue: number;
    segment: string;
  }>;
  retentionMetrics: {
    monthlyRetention: number;
    churnRate: number;
    customerLifetimeValue: number;
    acquisitionCost: number;
  };
  trends: Array<{
    period: string;
    newCustomers: number;
    returningCustomers: number;
    revenue: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

interface CustomerInsight {
  type: "opportunity" | "warning" | "alert" | "success";
  message: string;
  action: string;
  impact: "high" | "medium" | "low";
  metric: string;
  value: number;
}

/* ----------------------------- Helpers ----------------------------- */

const currency = (val: number) => `₹${Math.round(val).toLocaleString()}`;
const percent = (val: number) => `${val.toFixed(1)}%`;

/* ----------------------------- Business Intelligence Engine ----------------------------- */

function generateCustomerInsights(
  data: CustomerReportData | null
): CustomerInsight[] {
  if (!data) return [];

  const insights: CustomerInsight[] = [];
  const { summary, retentionMetrics, customerSegments, topCustomers } = data;

  // 1. Retention Analysis
  if (retentionMetrics.churnRate > 20) {
    insights.push({
      type: "alert",
      message: `High customer churn rate: ${retentionMetrics.churnRate}%`,
      action: "Implement customer retention program and follow-up system",
      impact: "high",
      metric: "churn_rate",
      value: retentionMetrics.churnRate,
    });
  }

  // 2. Customer Value Concentration
  const top5CustomersRevenue = topCustomers
    .slice(0, 5)
    .reduce((sum, cust) => sum + cust.totalSpent, 0);
  const revenueConcentration =
    (top5CustomersRevenue / summary.totalRevenue) * 100;

  if (revenueConcentration > 50) {
    insights.push({
      type: "warning",
      message: `Top 5 customers contribute ${revenueConcentration.toFixed(
        1
      )}% of total revenue`,
      action: "Diversify customer base to reduce dependency risk",
      impact: "high",
      metric: "revenue_concentration",
      value: revenueConcentration,
    });
  }

  // 3. New Customer Growth
  const newCustomerRatio =
    (summary.newCustomers / summary.totalCustomers) * 100;
  if (newCustomerRatio < 15) {
    insights.push({
      type: "warning",
      message: `Low new customer acquisition: ${newCustomerRatio.toFixed(
        1
      )}% of total base`,
      action: "Increase marketing efforts for new customer acquisition",
      impact: "medium",
      metric: "new_customer_ratio",
      value: newCustomerRatio,
    });
  }

  // 4. High-Value Segment Opportunity
  const highValueSegment = customerSegments.find(
    (seg) => seg.segment === "High Value"
  );
  if (highValueSegment && highValueSegment.count < 10) {
    insights.push({
      type: "opportunity",
      message: `Only ${highValueSegment.count} high-value customers identified`,
      action: "Create premium offerings to attract more high-value customers",
      impact: "high",
      metric: "high_value_count",
      value: highValueSegment.count,
    });
  }

  // 5. Repeat Customer Performance
  if (summary.repeatRate > 40) {
    insights.push({
      type: "success",
      message: `Strong repeat customer rate: ${summary.repeatRate}%`,
      action: "Leverage loyal customers for referrals and testimonials",
      impact: "medium",
      metric: "repeat_rate",
      value: summary.repeatRate,
    });
  }

  // Fallback insight
  if (insights.length === 0) {
    insights.push({
      type: "success",
      message: "Customer base shows healthy growth and retention patterns",
      action: "Focus on increasing customer lifetime value through upselling",
      impact: "low",
      metric: "overall_health",
      value: 85,
    });
  }

  return insights.slice(0, 5);
}

/* ----------------------------- Components ----------------------------- */

function CustomerSegmentationChart({
  segments,
}: {
  segments: CustomerReportData["customerSegments"];
}) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <PieChart className="h-4 w-4" />
          Customer Segmentation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                nameKey="segment"
                label={({ segment, percent }) =>
                  `${segment} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {segments.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {segments.map((segment, index) => (
            <div
              key={segment.segment}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{segment.segment}</span>
              </div>
              <span className="font-semibold">{segment.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RetentionMetricsCard({
  metrics,
}: {
  metrics: CustomerReportData["retentionMetrics"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4" />
          Customer Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {percent(metrics.monthlyRetention)}
            </p>
            <p className="text-xs text-gray-600">Retention Rate</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {percent(metrics.churnRate)}
            </p>
            <p className="text-xs text-gray-600">Churn Rate</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Lifetime Value</span>
            <span className="font-semibold">
              {currency(metrics.customerLifetimeValue)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Acquisition Cost</span>
            <span className="font-semibold">
              {currency(metrics.acquisitionCost)}
            </span>
          </div>
        </div>
        <Progress value={metrics.monthlyRetention} className="h-2" />
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Main Component ----------------------------- */

export default function CustomerReport() {
  const { token } = useAuth();
  const [data, setData] = useState<CustomerReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">(
    "monthly"
  );

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          throw new Error("No authentication token available");
        }

        const response = await fetch(
          `/api/reports/customers?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API returned error: ${response.status}`);
        }

        const reportData = await response.json();
        setData(reportData);
      } catch (err: any) {
        console.error("Failed to fetch customer report:", err);
        setError(err.message || "Failed to load customer data");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [period, token]);

  const customerInsights = useMemo(
    () => generateCustomerInsights(data),
    [data]
  );

  const handleRetry = () => {
    window.location.reload();
  };

  const handleExport = () => {
    // Implement export functionality
    console.log("Export customer data");
  };

  if (loading) {
    return <CustomerReportSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">Failed to load customer report</p>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <Button onClick={handleRetry} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No customer data available</p>
        <Button onClick={handleRetry} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const { summary, topCustomers, trends, period: dataPeriod } = data;

  return (
    <div className="space-y-6 p-4 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Customer Intelligence
          </h2>
          <p className="text-gray-600 text-sm">
            Advanced customer analytics for retention and growth optimization
          </p>
          <p className="text-xs text-gray-500">
            {new Date(dataPeriod.start).toLocaleDateString()} —{" "}
            {new Date(dataPeriod.end).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          <Button
            variant="outline"
            className="whitespace-nowrap"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.totalCustomers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Active</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.activeCustomers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">New</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.newCustomers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Repeat Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {percent(summary.repeatRate)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {currency(summary.avgOrderValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {currency(summary.totalRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Intelligence Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Customer Intelligence
          </CardTitle>
          <CardDescription>
            Strategic insights for customer retention and value optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerInsights.map((insight, idx) => (
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
                      <Star className="h-4 w-4 text-blue-600" />
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
                        {insight.metric}: {insight.value}
                        {insight.metric.includes("rate") ||
                        insight.metric.includes("percent")
                          ? "%"
                          : ""}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerSegmentationChart segments={data.customerSegments} />
        <RetentionMetricsCard metrics={data.retentionMetrics} />
      </div>

      {/* Customer Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-500" />
            Customer Growth Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="newCustomers"
                  name="New Customers"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="returningCustomers"
                  name="Returning Customers"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Top Value Customers
          </CardTitle>
          <CardDescription>
            Customers contributing the most to your revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-amber-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{customer.orders} orders</span>
                      <span>
                        Since{" "}
                        {new Date(customer.firstOrder).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">
                    {currency(customer.totalSpent)}
                  </p>
                  <div className="flex gap-2 text-sm">
                    <Badge variant="outline" className="bg-blue-50">
                      {customer.segment}
                    </Badge>
                    <span className="text-gray-500">
                      Last: {new Date(customer.lastOrder).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------- Skeleton ----------------------------- */

function CustomerReportSkeleton() {
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
