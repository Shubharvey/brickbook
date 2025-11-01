"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart,
  Wallet,
} from "lucide-react";

export default function BusinessSnapshot() {
  // Real business metrics that matter for growth
  const metrics = [
    {
      title: "Revenue (MTD)",
      value: "₹1,24,920",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Monthly revenue growth",
      trend: "positive",
    },
    {
      title: "Cash Flow",
      value: "₹68,450",
      change: "Healthy",
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Available cash balance",
      trend: "stable",
    },
    {
      title: "Profit Margin",
      value: "32%",
      change: "+4.2%",
      icon: PieChart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Net profit percentage",
      trend: "positive",
    },
    {
      title: "Collection Rate",
      value: "87%",
      change: "-2.1%",
      icon: BarChart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Payment collection efficiency",
      trend: "warning",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            <div className="flex items-center justify-between">
              <p
                className={`text-xs ${
                  metric.trend === "positive"
                    ? "text-green-600"
                    : metric.trend === "warning"
                    ? "text-orange-600"
                    : "text-gray-600"
                } flex items-center gap-1`}
              >
                {metric.trend === "positive" && (
                  <TrendingUp className="h-3 w-3" />
                )}
                {metric.change}
              </p>
              <p className="text-xs text-gray-500">{metric.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
