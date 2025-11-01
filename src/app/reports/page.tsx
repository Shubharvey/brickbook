import { Metadata } from "next";
import ReportsManagement from "@/components/reports/ReportsManagement";

export const metadata: Metadata = {
  title: "Business Intelligence Reports",
  description: "Actionable insights for business growth and profitability",
};

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Business Intelligence
            </h1>
            <p className="text-gray-600 mt-1">
              Actionable insights for growth, profitability, and cash flow
              optimization
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Data • Updated in real-time
          </div>
        </div>

        <ReportsManagement />
      </div>
    </div>
  );
}
