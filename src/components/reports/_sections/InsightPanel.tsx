"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Lightbulb, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const businessInsights = [
  {
    type: "warning",
    icon: Clock,
    message: "₹30,000 short of monthly target with 10 days remaining",
    action: "Boost sales push for high-margin products",
    impact: "High",
    timeframe: "Urgent",
  },
  {
    type: "alert",
    icon: AlertTriangle,
    message: "3 customers have overdue payments totaling ₹45,200",
    action: "Assign collection follow-up — priority: High",
    impact: "Medium",
    timeframe: "This week",
  },
  {
    type: "opportunity",
    icon: TrendingUp,
    message: "Product A has 3x higher margin than category average",
    action: "Increase inventory allocation by 40%",
    impact: "High",
    timeframe: "Next order cycle",
  },
];

export default function InsightsPanel() {
  return (
    <Card className="border shadow-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Business Intelligence</CardTitle>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Live Analysis
          </Badge>
        </div>
        <CardDescription>
          AI-powered insights for immediate action
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {businessInsights.map((insight, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border-l-4 ${
              insight.type === "warning"
                ? "border-l-amber-400 bg-amber-50"
                : insight.type === "alert"
                ? "border-l-red-400 bg-red-50"
                : "border-l-green-400 bg-green-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <insight.icon
                  className={`h-4 w-4 ${
                    insight.type === "warning"
                      ? "text-amber-600"
                      : insight.type === "alert"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                />
              </div>

              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {insight.message}
                </p>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Action:</span>{" "}
                    {insight.action}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {insight.impact} Impact
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {insight.timeframe}
                    </Badge>
                  </div>
                </div>

                <Button size="sm" variant="outline" className="w-full text-xs">
                  Take Action
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
