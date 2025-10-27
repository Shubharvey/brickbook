"use client";

import { useState, useEffect } from "react";
import { Menu, X, Truck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface DeliveryStats {
  pendingCount: number;
  scheduledCount: number;
  totalNotifications: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({
    pendingCount: 0,
    scheduledCount: 0,
    totalNotifications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  // Fetch real delivery stats
  useEffect(() => {
    if (token) {
      fetchDeliveryStats();
    }
  }, [token]);

  const fetchDeliveryStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/deliveries/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveryStats(data);
      } else {
        // If no data, set all to zero
        setDeliveryStats({
          pendingCount: 0,
          scheduledCount: 0,
          totalNotifications: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch delivery stats:", error);
      setDeliveryStats({
        pendingCount: 0,
        scheduledCount: 0,
        totalNotifications: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to handle hover effects only on non-touch devices
  const getHoverClasses = (baseClasses: string, hoverClasses: string) => {
    return `${baseClasses} hover:${hoverClasses}`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            {/* Left side - Menu button for mobile + Desktop branding */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden active:bg-gray-200 active:scale-95 transition-all duration-150"
              >
                <Menu className="h-6 w-6" />
              </Button>

              {/* Mobile logo */}
              <div className="flex items-center space-x-2 lg:hidden">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center active:bg-orange-600 transition-colors duration-150">
                  <span className="text-white font-bold text-sm">BB</span>
                </div>
                <span className="font-bold text-gray-900">BrickBook</span>
              </div>

              {/* Desktop branding - hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BB</span>
                </div>
                <span className="font-bold text-gray-900 text-xl">
                  BrickBook
                </span>
              </div>
            </div>

            {/* Right side - Delivery Status & Notifications */}
            <div className="flex items-center space-x-3">
              {/* Delivery Status Button */}
              <Link href="/deliveries">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white border-gray-300 lg:hover:bg-orange-50 lg:hover:border-orange-300 lg:hover:text-orange-600 lg:hover:shadow-md active:bg-orange-100 active:border-orange-400 active:scale-95 transition-all duration-150"
                >
                  <Truck className="h-4 w-4" />
                  <span className="hidden sm:inline">Delivery Status</span>
                  {/* Real notification badge - only show if there are pending deliveries */}
                  {!isLoading && deliveryStats.pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {deliveryStats.pendingCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Notifications Bell - Only show if there are notifications */}
              {!isLoading && deliveryStats.totalNotifications > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative lg:hover:bg-orange-50 lg:hover:text-orange-600 active:bg-orange-100 active:scale-95 transition-all duration-150"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {deliveryStats.totalNotifications}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
