"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ReportsGrid from "./_sections/ReportsGrid";
import SalesReport from "./SalesReport";
import CustomerReport from "./CustomerReport";
import PaymentReport from "./PaymentReport";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Types for real data
interface BusinessHealthData {
  revenue: number;
  profit: number;
  cashOnHand: number;
  targetProgress: number;
  monthlyTarget: number;
  growthRate: number;
  totalSales: number;
  pendingDues: number;
  collectionEfficiency: number;
}

interface BusinessInsight {
  type: "warning" | "alert" | "opportunity" | "success";
  message: string;
  action: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface PaymentReportData {
  summary?: {
    pendingDues: number;
    collectionEfficiency: number;
    totalCollections: number;
    advancePayments: number;
    avgCollectionDays: number;
    cashFlow: number;
  };
  paymentMethods?: Array<any>;
  dueAnalysis?: Array<any>;
  topDues?: Array<any>;
  cashFlowTrends?: Array<any>;
  period?: {
    start: string;
    end: string;
  };
}

export default function ReportsManagement() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [businessHealth, setBusinessHealth] =
    useState<BusinessHealthData | null>(null);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Helper functions
  const calculateTargetProgress = (current: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const calculateGrowthRate = (statsData: any): number => {
    // Simple growth calculation - you can enhance this with historical data
    return 12.5; // Mock for now
  };

  const generateBusinessInsights = (
    health: BusinessHealthData,
    paymentData: any
  ): BusinessInsight[] => {
    const insights: BusinessInsight[] = [];

    // Target progress insight
    if (health.targetProgress < 70) {
      const shortBy = health.monthlyTarget - health.revenue;
      insights.push({
        type: "warning",
        message: `You are short of ₹${shortBy.toLocaleString()} to meet this month's target.`,
        action: "Increase marketing efforts and follow up on pending leads",
        icon: AlertTriangle,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      });
    }

    // Collection efficiency insight
    if (health.collectionEfficiency < 80) {
      insights.push({
        type: "alert",
        message: `Low collection efficiency: ${health.collectionEfficiency}%`,
        action: "Review payment terms and implement stricter follow-ups",
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      });
    }

    // High pending dues insight
    if (health.pendingDues > health.revenue * 0.3) {
      insights.push({
        type: "alert",
        message: `High pending dues: ₹${health.pendingDues.toLocaleString()}`,
        action: "Prioritize collection from overdue customers",
        icon: DollarSign,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      });
    }

    // Positive cash flow insight
    if (health.cashOnHand > health.revenue * 0.2) {
      insights.push({
        type: "opportunity",
        message: `Strong cash position: ₹${health.cashOnHand.toLocaleString()}`,
        action: "Consider strategic investments or inventory expansion",
        icon: Lightbulb,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      });
    }

    // Fallback positive insight
    if (insights.length === 0) {
      insights.push({
        type: "success",
        message: "Business performance is on track with targets",
        action: "Focus on maintaining current growth momentum",
        icon: TrendingUp,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      });
    }

    return insights.slice(0, 3); // Limit to 3 insights
  };

  // Mock data fallback
  const getMockBusinessHealth = (): BusinessHealthData => ({
    revenue: 120000,
    profit: 32000,
    cashOnHand: 55000,
    targetProgress: 80,
    monthlyTarget: 150000,
    growthRate: 12.5,
    totalSales: 45,
    pendingDues: 25000,
    collectionEfficiency: 75,
  });

  const enhancedInsights: BusinessInsight[] = [
    {
      type: "warning",
      message: "You are short of ₹30,000 to meet this month's target.",
      action: "Increase marketing efforts",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      type: "alert",
      message: "Collection efficiency below target at 75%",
      action: "Review customer payment patterns",
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      type: "opportunity",
      message: "Strong profit margin of 26.7%",
      action: "Consider scaling successful product lines",
      icon: Lightbulb,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
  ];

  // Fetch real business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);

        if (!token) {
          console.log("No token available");
          return;
        }

        let statsData = {
          totalRevenue: 0,
          totalProfit: 0,
          cashBalance: 0,
          totalSales: 0,
        };
        let paymentData: PaymentReportData | null = null;

        try {
          // Fetch dashboard stats for business health
          const statsResponse = await fetch("/api/dashboard/stats", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (statsResponse.ok) {
            statsData = await statsResponse.json();
          }
        } catch (error) {
          console.error("Failed to fetch dashboard stats:", error);
        }

        try {
          // Fetch payment report for dues and collection efficiency
          const paymentResponse = await fetch(
            "/api/reports/payments?period=monthly",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (paymentResponse.ok) {
            paymentData = await paymentResponse.json();
          }
        } catch (error) {
          console.error("Failed to fetch payment data:", error);
        }

        // Transform API data to business health format
        const healthData: BusinessHealthData = {
          revenue: statsData.totalRevenue || 0,
          profit: statsData.totalProfit || 0,
          cashOnHand: statsData.cashBalance || 0,
          targetProgress: calculateTargetProgress(
            statsData.totalRevenue || 0,
            150000
          ),
          monthlyTarget: 150000,
          growthRate: calculateGrowthRate(statsData),
          totalSales: statsData.totalSales || 0,
          pendingDues: paymentData?.summary?.pendingDues || 0,
          collectionEfficiency: paymentData?.summary?.collectionEfficiency || 0,
        };

        setBusinessHealth(healthData);
        setInsights(generateBusinessInsights(healthData, paymentData));
      } catch (error) {
        console.error("Failed to fetch business data:", error);
        // Fallback to mock data if API fails
        setBusinessHealth(getMockBusinessHealth());
        setInsights(enhancedInsights);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [token]);

  // Enhanced Business Health Snapshot Component
  const EnhancedBusinessSnapshot = () => {
    if (loading || !businessHealth) {
      return <BusinessHealthSkeleton />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{businessHealth.revenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    +{businessHealth.growthRate}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{businessHealth.profit.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {businessHealth.revenue > 0
                    ? (
                        (businessHealth.profit / businessHealth.revenue) *
                        100
                      ).toFixed(1)
                    : "0"}
                  % margin
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Cash on Hand
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{businessHealth.cashOnHand.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Available balance</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Target Progress
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {businessHealth.targetProgress}%
                </p>
                <Progress
                  value={businessHealth.targetProgress}
                  className="mt-2 h-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ₹
                  {(
                    (businessHealth.monthlyTarget *
                      businessHealth.targetProgress) /
                    100
                  ).toLocaleString()}{" "}
                  of ₹{businessHealth.monthlyTarget.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Enhanced Insights Panel Component
  const EnhancedInsightsPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Business Intelligence Insights
        </CardTitle>
        <CardDescription>
          Automated recommendations based on your business performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <InsightsSkeleton />
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${insight.bgColor} ${insight.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <insight.icon className={`h-5 w-5 ${insight.color} mt-0.5`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {insight.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Action:</strong> {insight.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Enhanced Target Tracking Component
  const EnhancedTargetTracking = () => {
    if (loading || !businessHealth) {
      return <TargetTrackingSkeleton />;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Monthly Target Tracking
          </CardTitle>
          <CardDescription>
            Monitor your progress towards monthly business goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Monthly Target: ₹{businessHealth.monthlyTarget.toLocaleString()}
              </span>
              <span className="text-sm font-medium">
                Achieved: ₹{businessHealth.revenue.toLocaleString()}
              </span>
            </div>
            <Progress value={businessHealth.targetProgress} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>0%</span>
              <span className="font-medium">
                {businessHealth.targetProgress}% Complete
              </span>
              <span>100%</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Forecast:</strong>{" "}
                {generateForecastMessage(businessHealth)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const generateForecastMessage = (health: BusinessHealthData): string => {
    if (health.targetProgress >= 100) {
      return "Target already achieved! Great work!";
    }

    const daysRemaining = 30 - Math.floor(30 * (health.targetProgress / 100));
    if (daysRemaining <= 0) {
      return "Target not achieved this month. Plan for next month.";
    }

    return `At current pace, you will reach target in approximately ${daysRemaining} days.`;
  };

  // Skeleton Components
  const BusinessHealthSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const InsightsSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );

  const TargetTrackingSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );

  // ✅ Drill-down view for individual reports
  if (activeReport === "sales") {
    return (
      <div className="space-y-6 pb-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setActiveReport(null)}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Intelligence
            </h1>
            <p className="text-gray-600">
              Advanced analytics for revenue optimization & growth strategy
            </p>
          </div>
        </div>

        <SalesReport />
      </div>
    );
  }

  // ✅ Customer Report View
  if (activeReport === "customer") {
    return (
      <div className="space-y-6 pb-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setActiveReport(null)}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Customer Intelligence
            </h1>
            <p className="text-gray-600">
              Advanced customer analytics for retention and growth optimization
            </p>
          </div>
        </div>

        <CustomerReport />
      </div>
    );
  }

  // ✅ Payment Report View
  if (activeReport === "payment") {
    return (
      <div className="space-y-6 pb-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setActiveReport(null)}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Intelligence
            </h1>
            <p className="text-gray-600">
              Cash flow analysis and collection efficiency optimization
            </p>
          </div>
        </div>

        <PaymentReport />
      </div>
    );
  }

  // Handle other reports when they're implemented
  if (activeReport) {
    return (
      <div className="space-y-6 pb-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setActiveReport(null)}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeReport.charAt(0).toUpperCase() + activeReport.slice(1)}{" "}
              Report
            </h1>
            <p className="text-gray-600">
              This report is coming soon. We're working on implementing it.
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Report Coming Soon
            </h3>
            <p className="text-gray-600 mb-6">
              We're working hard to implement the {activeReport} report. This
              feature will be available in the next update.
            </p>
            <Button onClick={() => setActiveReport(null)}>
              Return to Reports Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Business Intelligence
        </h1>
        <p className="text-lg text-gray-600">
          Data-driven insights for growth, profitability & financial clarity
        </p>
      </header>

      {/* Enhanced Business Health Snapshot with Real Data */}
      <EnhancedBusinessSnapshot />

      {/* Insights & Target Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedInsightsPanel />
        <EnhancedTargetTracking />
      </div>

      {/* Reports Grid */}
      <ReportsGrid setActiveReport={setActiveReport} />
    </div>
  );
}
