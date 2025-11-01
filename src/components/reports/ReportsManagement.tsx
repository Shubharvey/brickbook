"use client";

import { useState } from "react";
import BusinessSnapshot from "./_sections/BusinessSnapshot";
import InsightsPanel from "./_sections/InsightPanel";
import TargetTracking from "./_sections/TargetTracking";
import ReportsGrid from "./_sections/ReportsGrid";
import SalesReport from "./SalesReport";
import CustomerReport from "./CustomerReport"; // ✅ ADD THIS IMPORT
import PaymentReport from "./PaymentReport"; // ✅ ADD THIS IMPORT
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ReportsManagement() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

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

  // ✅ ADD Customer Report View
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

  // ✅ ADD Payment Report View
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

  return (
    <div className="space-y-10 pb-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Business Intelligence
        </h1>
        <p className="text-lg text-gray-600">
          Data-driven insights for growth, profitability & financial clarity
        </p>
      </header>

      <BusinessSnapshot />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightsPanel />
        <TargetTracking />
      </div>

      <ReportsGrid setActiveReport={setActiveReport} />
    </div>
  );
}
