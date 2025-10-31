"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import SalesReport from "./SalesReport";

export default function ReportsManagement() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const reports = [
    {
      id: "sales",
      title: "Sales Report",
      description: "Detailed sales transactions and revenue analysis",
      icon: ShoppingCart,
      color: "bg-blue-500",
      period: "Monthly",
    },
    {
      id: "customer",
      title: "Customer Report",
      description: "Customer demographics and purchase history",
      icon: Users,
      color: "bg-green-500",
      period: "Quarterly",
    },
    {
      id: "payment",
      title: "Payment Report",
      description: "Payment status and outstanding dues",
      icon: DollarSign,
      color: "bg-red-500",
      period: "Weekly",
    },
    {
      id: "profit",
      title: "Profit & Loss",
      description: "Financial performance and profitability",
      icon: TrendingUp,
      color: "bg-purple-500",
      period: "Monthly",
    },
    {
      id: "inventory",
      title: "Inventory Report",
      description: "Stock levels and product performance",
      icon: FileText,
      color: "bg-orange-500",
      period: "Daily",
    },
    {
      id: "tax",
      title: "Tax Report",
      description: "Tax calculations and compliance reports",
      icon: Calendar,
      color: "bg-indigo-500",
      period: "Yearly",
    },
  ];

  // If a report is active, show that report
  if (activeReport === "sales") {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setActiveReport(null)}
          className="mb-4"
        >
          ← Back to Reports
        </Button>
        <SalesReport />
      </div>
    );
  }

  // Handle other reports when they're implemented
  if (activeReport) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setActiveReport(null)}
          className="mb-4"
        >
          ← Back to Reports
        </Button>
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {reports.find((r) => r.id === activeReport)?.title}
          </h2>
          <p className="text-gray-600 mb-4">
            This report is coming soon. We're working on implementing it.
          </p>
          <Button onClick={() => setActiveReport(null)}>
            Return to Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and download business reports</p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center`}
                >
                  <report.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <p className="text-sm text-gray-500">{report.period}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setActiveReport(report.id)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Downloaded</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Growth</p>
                <p className="text-2xl font-bold text-gray-900">+12%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
