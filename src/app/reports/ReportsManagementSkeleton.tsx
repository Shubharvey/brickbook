export default function ReportsManagementSkeleton() {
  return (
    <div className="space-y-8 pb-10 animate-pulse">
      {/* Header Skeleton */}
      <header className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </header>

      {/* Business Health Snapshot Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg p-4 h-24"></div>
        ))}
      </div>

      {/* Insights & Target Tracking Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-200 rounded-lg p-6 h-64"></div>
        <div className="bg-gray-200 rounded-lg p-6 h-64"></div>
      </div>

      {/* Reports Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg p-6 h-48"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
