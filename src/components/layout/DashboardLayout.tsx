"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, Truck, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import BottomNavigation from "./BottomNavigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface DeliveryStats {
  pendingCount: number;
  scheduledCount: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({
    pendingCount: 0,
    scheduledCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout, token } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        setDeliveryStats({
          pendingCount: 0,
          scheduledCount: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch delivery stats:", error);
      setDeliveryStats({
        pendingCount: 0,
        scheduledCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
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

            {/* Right side - Delivery Status & User Menu */}
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

              {/* User Menu Dropdown - Visible on ALL devices */}
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all duration-150"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  {/* Show user name on desktop, just icon on mobile */}
                  <span className="hidden sm:block text-sm font-medium max-w-32 truncate">
                    {user?.name || user?.email}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || user?.email}
                      </p>
                      {user?.company && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {user.company}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Logged in</p>
                    </div>

                    {/* Settings Link */}
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-400" />
                      Settings
                    </Link>

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="p-4 lg:p-6">{children}</div>
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
}
