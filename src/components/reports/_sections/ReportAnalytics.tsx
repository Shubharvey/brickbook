"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";

export default function ReportAnalytics() {
  const stats = [
    { label: "Total Reports", value: "24", Icon: FileText, hint: "" },
    { label: "Downloads", value: "156", Icon: Download, hint: "" },
    { label: "This Month", value: "8", Icon: Calendar, hint: "" },
    { label: "Growth", value: "+12%", Icon: TrendingUp, hint: "" },
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Report Analytics</CardTitle>
        <CardDescription>
          Overview of report usage and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="text-center p-4 bg-slate-50 rounded-lg"
            >
              <s.Icon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
