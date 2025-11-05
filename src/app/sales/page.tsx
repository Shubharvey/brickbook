import DashboardLayout from "@/components/layout/DashboardLayout";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Simple loading component
const LoadingFallback = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header Skeleton */}
    <div className="space-y-2">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>

    {/* Stats Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg p-4 h-24"></div>
      ))}
    </div>

    {/* Main Form Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg p-6 h-64"></div>
        ))}
      </div>
      <div className="bg-gray-200 rounded-lg p-6 h-96"></div>
    </div>
  </div>
);

// Lazy load the heavy SalesEntry component
const SalesEntry = dynamic(() => import("@/components/sales/SalesEntry"), {
  loading: () => <LoadingFallback />,
});

export default function SalesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingFallback />}>
        <SalesEntry />
      </Suspense>
    </DashboardLayout>
  );
}
