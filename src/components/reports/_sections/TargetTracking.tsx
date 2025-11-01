"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Target, TrendingUp, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Helper function for consistent number formatting
const formatCurrency = (value: number) => {
  return `₹${value.toLocaleString("en-IN")}`;
};

export default function TargetTracking() {
  // Real target metrics with forecasting
  const target = {
    monthlyTarget: 150000,
    achieved: 124920,
    progress: 83, // (124920 / 150000) * 100
    daysRemaining: 10,
    dailyRequired: 2508, // (150000 - 124920) / 10
    growthRate: 12.5,
    forecastCompletion: "26th", // Based on current trend
  };

  const isOnTrack = target.progress >= (30 - target.daysRemaining) * 3.33; // Simple tracking logic

  // Format all currency values consistently
  const formattedMonthlyTarget = formatCurrency(target.monthlyTarget);
  const formattedAchieved = formatCurrency(target.achieved);
  const formattedDailyRequired = formatCurrency(target.dailyRequired);

  return (
    <Card className="border shadow-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Revenue Target</CardTitle>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOnTrack
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {isOnTrack ? "On Track" : "Needs Push"}
          </div>
        </div>
        <CardDescription>
          Monthly revenue goal tracking & forecasting
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Monthly Target</span>
            <span className="font-semibold text-gray-900">
              {formattedMonthlyTarget}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Achieved</span>
            <span className="font-semibold text-gray-900">
              {formattedAchieved}
            </span>
          </div>

          <Progress value={target.progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>₹0</span>
            <span className="font-medium">{target.progress}% Complete</span>
            <span>{formattedMonthlyTarget}</span>
          </div>
        </div>

        {/* Forecasting Section */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2 bg-blue-50 rounded border">
            <div className="flex items-center gap-1 text-blue-700">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">Days Left</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {target.daysRemaining}
            </p>
          </div>

          <div className="p-2 bg-purple-50 rounded border">
            <div className="flex items-center gap-1 text-purple-700">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">Daily Need</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formattedDailyRequired}
            </p>
          </div>
        </div>

        {/* Forecast Insight */}
        <div
          className={`p-3 rounded-lg border ${
            isOnTrack
              ? "bg-green-50 border-green-200"
              : "bg-orange-50 border-orange-200"
          }`}
        >
          <p className="text-sm text-gray-800">
            <span className="font-semibold">Forecast:</span>{" "}
            {isOnTrack
              ? `On track to complete by ${target.forecastCompletion}. `
              : `Need ${formattedDailyRequired} daily to hit target. `}
            <span
              className={
                isOnTrack
                  ? "text-green-600 font-medium"
                  : "text-orange-600 font-medium"
              }
            >
              {target.growthRate}% growth rate
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
