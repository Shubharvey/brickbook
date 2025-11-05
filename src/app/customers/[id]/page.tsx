"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Simple loading component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 py-6">
    <div className="max-w-7xl mx-auto px-4">
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-9 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Wallet Card Skeleton */}
        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>

        {/* Tabs Skeleton */}
        <div className="h-10 bg-gray-200 rounded mb-6"></div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Lazy load the heavy customer profile component
const CustomerProfileContent = dynamic(
  () => import("./CustomerProfileContent"),
  {
    loading: () => <LoadingFallback />,
  }
);

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CustomerProfileContent />
    </Suspense>
  );
}
