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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg p-4 h-24"></div>
      ))}
    </div>

    {/* Search Skeleton */}
    <div className="h-10 bg-gray-200 rounded"></div>

    {/* Customer Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg p-4 h-48"></div>
      ))}
    </div>
  </div>
);

// Lazy load the heavy CustomerList component with proper dynamic import
const CustomerList = dynamic(
  () => import("@/components/customers/CustomerListSimple"),
  {
    loading: () => <LoadingFallback />,
  }
);

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingFallback />}>
        <CustomerList />
      </Suspense>
    </DashboardLayout>
  );
}
