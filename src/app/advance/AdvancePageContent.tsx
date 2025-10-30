"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Search,
  User,
  Plus,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CustomerWithAdvance {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  advanceBalance: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

interface AdvanceData {
  customers: CustomerWithAdvance[];
  summary: {
    totalAdvance: number;
    totalCustomers: number;
  };
}

export default function AdvancePage() {
  const { token } = useAuth();
  const [advanceData, setAdvanceData] = useState<AdvanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (token) {
      fetchAdvanceData();
    }
  }, [token]);

  const fetchAdvanceData = async () => {
    try {
      const response = await fetch("/api/advance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdvanceData(data);
      }
    } catch (error) {
      console.error("Failed to fetch advance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = advanceData?.customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const safeDate = (value: string) => {
    if (!value) return "Never";
    try {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getAdvanceColor = (amount: number) => {
    if (amount > 50000) return "text-green-600 font-semibold";
    if (amount > 10000) return "text-blue-600";
    return "text-gray-600";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalAdvance = advanceData?.summary.totalAdvance || 0;
  const customerCount = advanceData?.summary.totalCustomers || 0;
  const averageAdvance = customerCount > 0 ? totalAdvance / customerCount : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Advance Management
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Track customer advance payments and credits
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Advance
        </Button>
      </div>

      {/* Stats Cards - 2 columns on mobile (same as dues page) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="min-h-[100px]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">
                  Total Advance
                </p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {formatCurrency(totalAdvance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[100px]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">
                  Customers with Advance
                </p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {customerCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[100px] md:col-span-1 col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">
                  Average Advance
                </p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {formatCurrency(averageAdvance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Stack on mobile (same as dues page) */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-4">
        {filteredCustomers?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No customers found" : "No advance records"}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "Try a different search term"
                  : "Customers with advance payments will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers?.map((customer) => (
            <Card
              key={customer.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Customer Name and Status - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 break-words">
                        {customer.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Advance: {formatCurrency(customer.advanceBalance)}
                        </Badge>
                      </div>
                    </div>

                    {/* Customer Details - Stack on mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            Customer Since: {safeDate(customer.createdAt)}
                          </span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{customer.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-left md:text-right">
                        <div className="text-sm text-gray-600">
                          Last Activity:{" "}
                          {safeDate(
                            customer.lastPurchaseDate || customer.createdAt
                          )}
                        </div>
                        <div
                          className={`text-base md:text-lg font-bold ${getAdvanceColor(
                            customer.advanceBalance
                          )}`}
                        >
                          Balance: {formatCurrency(customer.advanceBalance)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-sm text-gray-500">
                        ID: {customer.id.slice(-6).toUpperCase()}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none"
                          onClick={() => window.open(`tel:${customer.phone}`)}
                          disabled={!customer.phone}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Call</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none"
                          onClick={() => {
                            /* Add message functionality */
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Message</span>
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            /* Add adjust advance functionality */
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">
                            Adjust Advance
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
