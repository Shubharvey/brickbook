"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Users,
  ShoppingCart,
  DollarSign,
  FileText,
  Truck,
  Settings,
  LogOut,
} from "lucide-react";

export default function BottomNavigation() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/",
    },
    {
      title: "Customers",
      icon: Users,
      href: "/customers",
    },
    {
      title: "Sales",
      icon: ShoppingCart,
      href: "/sales",
    },
    {
      title: "Dues",
      icon: DollarSign,
      href: "/dues",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item, index) => {
          const active = isActive(item.href);
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors ${
                active ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <item.icon
                className={`h-5 w-5 mb-1 ${
                  active ? "text-blue-600" : "text-gray-600"
                }`}
              />
              <span
                className={`text-xs text-center truncate w-full ${
                  active ? "text-blue-600 font-medium" : "text-gray-600"
                }`}
              >
                {item.title}
              </span>
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center p-2 min-w-0 flex-1 text-gray-600 transition-colors hover:text-red-600"
        >
          <LogOut className="h-5 w-5 mb-1" />
          <span className="text-xs text-center truncate w-full">Logout</span>
        </button>
      </div>
    </div>
  );
}
