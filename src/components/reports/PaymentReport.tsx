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
  TrendingUp,
  Calendar,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
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

interface PaymentReportData {
  summary: {
    totalCollections: number;
    pendingDues: number;
    advancePayments: number;
    collectionEfficiency: number;
    avgCollectionDays: number;
    cashFlow: number;
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  dueAnalysis: Array<{
    period: string;
    amount: number;
    customers: number;
    avgDelay: number;
  }>;
  topDues: Array<{
    id: string;
    customerName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    contact: string;
    status: "overdue" | "due_soon" | "paid";
  }>;
  cashFlowTrends: Array<{
    period: string;
    incoming: number;
    outgoing: number;
    netFlow: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

interface PaymentInsight {
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

function generatePaymentInsights(
  data: PaymentReportData | null
): PaymentInsight[] {
  if (!data) return [];

  const insights: PaymentInsight[] = [];
  const { summary, topDues, dueAnalysis } = data;

  // 1. High Pending Dues Alert
  const dueToCollectionRatio =
    (summary.pendingDues / summary.totalCollections) * 100;
  if (dueToCollectionRatio > 30) {
    insights.push({
      type: "alert",
      message: `High pending dues: ${dueToCollectionRatio.toFixed(
        1
      )}% of total collections`,
      action: "Implement aggressive collection strategy for overdue payments",
      impact: "high",
      metric: "due_ratio",
      value: dueToCollectionRatio,
    });
  }

  // 2. Collection Efficiency Warning
  if (summary.collectionEfficiency < 70) {
    insights.push({
      type: "warning",
      message: `Low collection efficiency: ${summary.collectionEfficiency}%`,
      action: "Review payment terms and follow-up procedures",
      impact: "high",
      metric: "collection_efficiency",
      value: summary.collectionEfficiency,
    });
  }

  // 3. Long Collection Cycles
  if (summary.avgCollectionDays > 45) {
    insights.push({
      type: "warning",
      message: `Long collection cycle: ${summary.avgCollectionDays} days average`,
      action: "Offer early payment discounts and streamline invoicing",
      impact: "medium",
      metric: "collection_days",
      value: summary.avgCollectionDays,
    });
  }

  // 4. High-Value Overdue Payments
  const highValueOverdue = topDues.filter(
    (due) => due.amount > 50000 && due.daysOverdue > 30
  );
  if (highValueOverdue.length > 0) {
    insights.push({
      type: "alert",
      message: `${highValueOverdue.length} high-value payments overdue >30 days`,
      action: "Priority follow-up required for large overdue amounts",
      impact: "high",
      metric: "high_value_overdue",
      value: highValueOverdue.length,
    });
  }

  // 5. Positive Cash Flow Opportunity
  if (summary.cashFlow > 0) {
    insights.push({
      type: "opportunity",
      message: `Positive cash flow: ${currency(summary.cashFlow)}`,
      action: "Consider strategic investments or debt reduction",
      impact: "medium",
      metric: "cash_flow",
      value: summary.cashFlow,
    });
  }

  // Fallback insight
  if (insights.length === 0) {
    insights.push({
      type: "success",
      message: "Payment collections and cash flow are healthy",
      action: "Focus on maintaining current collection efficiency",
      impact: "low",
      metric: "overall_health",
      value: 90,
    });
  }

  return insights.slice(0, 5);
}

/* ----------------------------- Components ----------------------------- */

function PaymentMethodsChart({
  methods,
}: {
  methods: PaymentReportData["paymentMethods"];
}) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <PieChart className="h-4 w-4" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={methods}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="amount"
                nameKey="method"
                label={({ method, percent }) =>
                  `${method} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {methods.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [currency(Number(value)), "Amount"]}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function CashFlowTrendsChart({
  trends,
}: {
  trends: PaymentReportData["cashFlowTrends"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4" />
          Cash Flow Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                formatter={(value) => [currency(Number(value)), "Amount"]}
              />
              <Legend />
              <Bar dataKey="incoming" name="Incoming" fill="#10b981" />
              <Bar dataKey="outgoing" name="Outgoing" fill="#ef4444" />
              <Bar dataKey="netFlow" name="Net Flow" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Main Component ----------------------------- */

export default function PaymentReport() {
  const { token } = useAuth();
  const [data, setData] = useState<PaymentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly">(
    "monthly"
  );

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          throw new Error("No authentication token available");
        }

        const response = await fetch(`/api/reports/payments?period=${period}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`API returned error: ${response.status}`);
        }

        const reportData = await response.json();
        setData(reportData);
      } catch (err: any) {
        console.error("Failed to fetch payment report:", err);
        setError(err.message || "Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [period, token]);

  const paymentInsights = useMemo(() => generatePaymentInsights(data), [data]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleExport = () => {
    // Implement export functionality
    console.log("Export payment data");
  };

  if (loading) {
    return <PaymentReportSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">Failed to load payment report</p>
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
        <p className="text-gray-500">No payment data available</p>
        <Button onClick={handleRetry} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const { summary, dueAnalysis, topDues, period: dataPeriod } = data;

  return (
    <div className="space-y-6 p-4 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Payment Intelligence
          </h2>
          <p className="text-gray-600 text-sm">
            Cash flow analysis and collection efficiency optimization
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
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
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
            <p className="text-sm font-medium text-gray-600">
              Total Collections
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {currency(summary.totalCollections)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Pending Dues</p>
            <p className="text-2xl font-bold text-red-600">
              {currency(summary.pendingDues)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">
              Advance Payments
            </p>
            <p className="text-2xl font-bold text-green-600">
              {currency(summary.advancePayments)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">
              Collection Efficiency
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {percent(summary.collectionEfficiency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">
              Avg Collection Days
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.avgCollectionDays}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
            <p className="text-2xl font-bold text-blue-600">
              {currency(summary.cashFlow)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Intelligence Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Payment Intelligence
          </CardTitle>
          <CardDescription>
            Strategic insights for cash flow optimization and collection
            efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentInsights.map((insight, idx) => (
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
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-blue-600" />
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
                        {insight.metric.includes("ratio") ||
                        insight.metric.includes("efficiency")
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
        <PaymentMethodsChart methods={data.paymentMethods} />
        <CashFlowTrendsChart trends={data.cashFlowTrends} />
      </div>

      {/* Due Analysis & Top Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Due Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dueAnalysis.map((due, index) => (
                <div
                  key={due.period}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        due.period === "Current"
                          ? "bg-green-500"
                          : due.period === "1-30 days"
                          ? "bg-amber-500"
                          : due.period === "31-60 days"
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm font-medium">{due.period}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{currency(due.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {due.customers} customers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Dues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Priority Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDues.map((due) => (
                <div
                  key={due.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {due.customerName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(due.dueDate).toLocaleDateString()} •{" "}
                      {due.daysOverdue} days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {currency(due.amount)}
                    </p>
                    <Badge
                      variant={
                        due.status === "overdue" ? "destructive" : "outline"
                      }
                      className="text-xs"
                    >
                      {due.status === "overdue" ? "Overdue" : "Due Soon"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ----------------------------- Skeleton ----------------------------- */

function PaymentReportSkeleton() {
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
