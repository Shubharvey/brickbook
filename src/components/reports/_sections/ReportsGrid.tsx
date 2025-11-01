"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Filter,
  FileText,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";

type ReportItem = {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  period: string;
  status: "active" | "coming-soon";
};

const reports: ReportItem[] = [
  {
    id: "sales",
    title: "Sales Report",
    description: "Are sales growing or declining? What's causing it?",
    icon: ShoppingCart,
    color: "bg-blue-500",
    period: "Monthly",
    status: "active",
  },
  {
    id: "customer",
    title: "Customer Report",
    description: "Who pays? Who delays payments? Who buys repeatedly?",
    icon: Users,
    color: "bg-green-500",
    period: "Quarterly",
    status: "active",
  },
  {
    id: "payment",
    title: "Payment Report",
    description: "How much money actually reached the bank?",
    icon: DollarSign,
    color: "bg-purple-500",
    period: "Weekly",
    status: "active",
  },
  {
    id: "profit",
    title: "Profit & Loss",
    description: "Are we making real money or just doing sales?",
    icon: TrendingUp,
    color: "bg-orange-500",
    period: "Monthly",
    status: "coming-soon",
  },
  {
    id: "inventory",
    title: "Inventory Report",
    description: "What's moving fast? What's dead stock?",
    icon: FileText,
    color: "bg-yellow-500",
    period: "Daily",
    status: "coming-soon",
  },
  {
    id: "tax",
    title: "Tax Report",
    description: "How much tax to file? Month-wise summary.",
    icon: Calendar,
    color: "bg-red-500",
    period: "Yearly",
    status: "coming-soon",
  },
];

export default function ReportsGrid({
  setActiveReport,
}: {
  setActiveReport: (id: string | null) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Business Reports
          </h2>
          <p className="text-gray-600">
            Detailed analytics across all business functions
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card
            key={report.id}
            className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() =>
              report.status === "active" && setActiveReport(report.id)
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div
                  className={`p-3 rounded-lg ${report.color} group-hover:scale-105 transition-transform`}
                >
                  <report.icon className="h-6 w-6 text-white" />
                </div>

                {report.status === "coming-soon" && (
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-600 hover:bg-slate-100"
                  >
                    Coming Soon
                  </Badge>
                )}
              </div>

              <CardTitle className="text-lg mt-4 group-hover:text-blue-600 transition-colors">
                {report.title}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {report.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  {report.period}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={report.status === "coming-soon"}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-3 w-3" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
