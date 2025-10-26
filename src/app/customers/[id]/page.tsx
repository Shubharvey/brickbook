// src/app/customers/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Edit,
  Download,
  User,
  FileText,
  MessageCircle,
  Star,
  CreditCard,
  PieChart,
  MoreHorizontal,
  RefreshCw,
  Menu,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Helper functions
const safeGet = (obj: any, path: string, defaultValue: any = "") => {
  return (
    path.split(".").reduce((acc, part) => acc && acc[part], obj) || defaultValue
  );
};

const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const safeString = (value: any, defaultValue: string = ""): string => {
  return value ? String(value) : defaultValue;
};

const safeDate = (value: any): string => {
  if (!value) return "Unknown";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "Invalid Date";
  }
};

const formatCurrency = (value: any): string => {
  return `₹${safeNumber(value).toLocaleString()}`;
};

// Mock data for fallback
const mockCustomerData = {
  id: "loading",
  name: "Loading Customer...",
  phone: "+91 XXXXX XXXXX",
  email: "loading@example.com",
  address: {
    street: "Loading address...",
    city: "Loading city...",
    district: "Loading district...",
    pincode: "XXXXXX",
  },
  createdAt: new Date().toISOString(),
  customerType: "individual",
  status: "active",
  preferredContact: "call",
  stats: {
    totalSales: 0,
    totalAmount: 0,
    totalPaid: 0,
    dueAmount: 0,
    purchaseCount: 0,
    paidSalesCount: 0,
    pendingSalesCount: 0,
    partialSalesCount: 0,
    averageSaleValue: 0,
    monthlyAverage: 0,
    lifetimeValue: 0,
    averageDelayDays: 0,
  },
  sales: [],
  paymentHistory: [],
};

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [customer, setCustomer] = useState<any>(mockCustomerData);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (token && params.id) {
      fetchCustomerData();
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setIsError(true);
        setErrorMessage(
          "Authentication required. Please check if you are logged in."
        );
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [token, params.id, retryCount]);

  const fetchCustomerData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`/api/customers/${params.id}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setIsError(false);

        // Debug: Log sales data to check what's coming from API
        console.log("Customer data:", data);
        console.log("Sales data:", data.sales);
        if (data.sales && data.sales.length > 0) {
          console.log("First sale items:", data.sales[0].items);
        }
      } else {
        setIsError(true);
        setErrorMessage(`Failed to load customer data: ${response.status}`);
      }
    } catch (error: any) {
      setIsError(true);
      if (error.name === "AbortError") {
        setErrorMessage("Request timeout. Please check your connection.");
      } else {
        setErrorMessage("Failed to connect to server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Safe data access
  const customerStatus = safeString(customer?.status, "active");
  const customerType = safeString(customer?.customerType, "individual");
  const stats = safeGet(customer, "stats", {});
  const sales = safeGet(customer, "sales", []);
  const address = safeGet(customer, "address", {});

  // Safe numeric values
  const totalPaid = safeNumber(stats.totalPaid);
  const totalAmount = safeNumber(stats.totalAmount);
  const dueAmount = safeNumber(stats.dueAmount);
  const purchaseCount = safeNumber(stats.purchaseCount);
  const paidSalesCount = safeNumber(stats.paidSalesCount);
  const partialSalesCount = safeNumber(stats.partialSalesCount);
  const pendingSalesCount = safeNumber(stats.pendingSalesCount);
  const averageSaleValue = safeNumber(stats.averageSaleValue);
  const monthlyAverage = safeNumber(stats.monthlyAverage);
  const lifetimeValue = safeNumber(stats.lifetimeValue);
  const averageDelayDays = safeNumber(stats.averageDelayDays);
  const creditLimit = safeNumber(customer?.creditLimit);

  // Bottom Navigation Items
  const bottomNavItems = [
    {
      id: "overview",
      label: "Overview",
      icon: TrendingUp,
      activeIcon: TrendingUp,
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: ShoppingCart,
      activeIcon: ShoppingCart,
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      activeIcon: CreditCard,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: PieChart,
      activeIcon: PieChart,
    },
  ];

  // Sidebar Content Component (Customer Information Only)
  const SidebarContent = () => (
    <div className="space-y-6 h-full overflow-y-auto pb-6">
      {/* Customer Header in Sidebar */}
      <div className="text-center border-b pb-6">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="h-10 w-10 text-orange-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {safeString(customer?.name, "Unknown Customer")}
        </h2>
        <div className="flex justify-center gap-2 mt-2">
          <Badge
            variant={
              customerStatus === "active"
                ? "default"
                : customerStatus === "dormant"
                ? "secondary"
                : "destructive"
            }
            className="text-xs"
          >
            {customerStatus.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {customerType}
          </Badge>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-4 w-4" />
          Basic Information
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Customer ID</span>
            <Badge variant="secondary" className="text-xs">
              {customer?.id ? customer.id.slice(-6).toUpperCase() : "N/A"}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Member Since</span>
            <span className="text-gray-600 text-xs">
              {safeDate(customer?.createdAt)}
            </span>
          </div>

          {customer?.phone && (
            <div className="flex items-center gap-3 py-2">
              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-900">{customer.phone}</span>
            </div>
          )}

          {customer?.email && (
            <div className="flex items-center gap-3 py-2">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 text-sm truncate">
                {customer.email}
              </span>
            </div>
          )}

          {(address.street ||
            address.city ||
            address.district ||
            address.pincode) && (
            <div className="space-y-2 py-2">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-900">
                  {address.street && (
                    <p className="font-medium">{address.street}</p>
                  )}
                  {(address.city || address.district) && (
                    <p className="text-gray-600">
                      {address.city}
                      {address.city && address.district && ", "}
                      {address.district}
                    </p>
                  )}
                  {address.pincode && (
                    <p className="text-gray-500 text-xs">
                      PIN: {address.pincode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {customer?.referredBy && (
            <div className="flex justify-between items-center py-2">
              <span className="font-medium text-gray-600">Referred by</span>
              <span className="text-gray-900 text-sm">
                {customer.referredBy}
              </span>
            </div>
          )}

          {creditLimit > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="font-medium text-gray-600">Credit Limit</span>
              <span className="text-gray-900 text-sm">
                {formatCurrency(creditLimit)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 py-2">
            <MessageCircle className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 text-sm">
              Prefers {customer?.preferredContact || "call"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Quick Stats
        </h3>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-bold text-gray-900 text-lg">{purchaseCount}</p>
            <p className="text-gray-600 text-xs">Total Visits</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-bold text-gray-900 text-lg">
              {formatCurrency(monthlyAverage)}
            </p>
            <p className="text-gray-600 text-xs">Monthly Avg</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-bold text-gray-900 text-lg">
              {formatCurrency(lifetimeValue)}
            </p>
            <p className="text-gray-600 text-xs">Lifetime Value</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-bold text-gray-900 text-lg">
              {averageDelayDays}
            </p>
            <p className="text-gray-600 text-xs">Avg Delay Days</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {customer?.notes && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 leading-relaxed">
              {customer.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Tab Content Component
  const TabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4">
            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-green-50 to-green-25 border-green-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-green-600 truncate">
                        {formatCurrency(totalPaid)}
                      </p>
                      <p className="text-xs text-green-600 truncate">
                        Total Paid
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-25 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-blue-600 truncate">
                        {formatCurrency(totalAmount)}
                      </p>
                      <p className="text-xs text-blue-600 truncate">
                        Total Sales
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-25 border-red-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-red-600 truncate">
                        {formatCurrency(dueAmount)}
                      </p>
                      <p className="text-xs text-red-600 truncate">Total Due</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-25 border-purple-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <Star className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-purple-600 truncate">
                        {formatCurrency(averageSaleValue)}
                      </p>
                      <p className="text-xs text-purple-600 truncate">
                        Avg Order
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Status */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-green-700 text-sm">
                    {paidSalesCount}
                  </p>
                  <p className="text-xs text-green-600 truncate">Paid Orders</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Clock className="h-5 w-5 text-orange-600 mr-3 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-orange-700 text-sm">
                    {partialSalesCount}
                  </p>
                  <p className="text-xs text-orange-600 truncate">
                    Partial Payments
                  </p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-red-700 text-sm">
                    {pendingSalesCount}
                  </p>
                  <p className="text-xs text-red-600 truncate">
                    Pending Orders
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3 px-4 pb-4">
                  {sales.length > 0 ? (
                    sales.slice(0, 3).map((sale: any) => {
                      const saleFinalAmount = safeNumber(sale.finalAmount);
                      const saleDueAmount = safeNumber(sale.dueAmount);
                      const saleStatus = safeString(sale.status, "pending");

                      return (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-white"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                saleStatus === "paid"
                                  ? "bg-green-100"
                                  : saleStatus === "partial"
                                  ? "bg-orange-100"
                                  : "bg-red-100"
                              }`}
                            >
                              {saleStatus === "paid" ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : saleStatus === "partial" ? (
                                <Clock className="h-3 w-3 text-orange-600" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {safeString(sale.invoiceNo, "N/A")}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {safeDate(sale.date)} •{" "}
                                {safeNumber(sale.items?.length, 0)} items
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="font-semibold text-sm">
                              {formatCurrency(saleFinalAmount)}
                            </p>
                            <p
                              className={`text-xs ${
                                saleDueAmount > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {saleDueAmount > 0
                                ? `Due: ${formatCurrency(saleDueAmount)}`
                                : "Paid"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">
                        {isError ? "Data unavailable" : "No transactions found"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "transactions":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Transactions</h2>
              <Badge variant="outline">{sales.length} transactions</Badge>
            </div>

            {sales.length > 0 ? (
              <div className="space-y-4">
                {sales.map((sale: any) => {
                  const saleFinalAmount = safeNumber(sale.finalAmount);
                  const saleDueAmount = safeNumber(sale.dueAmount);
                  const saleStatus = safeString(sale.status, "pending");

                  return (
                    <Card key={sale.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Sale Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                saleStatus === "paid"
                                  ? "bg-green-100"
                                  : saleStatus === "partial"
                                  ? "bg-orange-100"
                                  : "bg-red-100"
                              }`}
                            >
                              {saleStatus === "paid" ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : saleStatus === "partial" ? (
                                <Clock className="h-5 w-5 text-orange-600" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{sale.invoiceNo}</p>
                              <p className="text-sm text-gray-600">
                                {safeDate(sale.date)} • {sale.paymentType}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {formatCurrency(saleFinalAmount)}
                            </p>
                            <Badge
                              variant={
                                saleStatus === "paid"
                                  ? "default"
                                  : saleStatus === "partial"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {saleStatus}
                            </Badge>
                          </div>
                        </div>

                        {/* Sale Items */}
                        <div className="p-4 border-b">
                          <p className="font-medium text-sm mb-2">Items:</p>
                          <div className="space-y-2">
                            {sale.items &&
                              sale.items.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {item.name}
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                      ({item.brickType} - {item.size})
                                    </span>
                                    <p className="text-gray-500 text-xs">
                                      {item.quantity} units @{" "}
                                      {formatCurrency(item.ratePerThousand)}
                                      /1000
                                    </p>
                                  </div>
                                  <span className="font-medium">
                                    {formatCurrency(item.total)}
                                  </span>
                                </div>
                              ))}
                            {(!sale.items || sale.items.length === 0) && (
                              <p className="text-sm text-gray-500 text-center py-2">
                                No items details available
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Sale Summary */}
                        <div className="p-4 bg-gray-50">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(sale.totalAmount)}</span>
                          </div>
                          {sale.discount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Discount:</span>
                              <span className="text-green-600">
                                -{formatCurrency(sale.discount)}
                              </span>
                            </div>
                          )}
                          {sale.transportCharges > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Transport:</span>
                              <span>
                                +{formatCurrency(sale.transportCharges)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                            <span>Total:</span>
                            <span>{formatCurrency(saleFinalAmount)}</span>
                          </div>
                          {saleDueAmount > 0 && (
                            <div className="flex justify-between text-sm text-red-600 mt-1">
                              <span>Due Amount:</span>
                              <span>{formatCurrency(saleDueAmount)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4" />
                <p className="text-sm">
                  No transactions found for this customer
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Sales recorded for this customer will appear here
                </p>
              </div>
            )}
          </div>
        );

      case "payments":
        return (
          <div className="text-center py-12 text-gray-500">
            <CreditCard className="h-16 w-16 mx-auto mb-4" />
            <p className="text-sm">Payment history will be displayed here</p>
            <p className="text-xs text-gray-400 mt-1">
              All payment records will appear in this section
            </p>
          </div>
        );

      case "analytics":
        return (
          <div className="text-center py-12 text-gray-500">
            <PieChart className="h-16 w-16 mx-auto mb-4" />
            <p className="text-sm">Analytics will be displayed here</p>
            <p className="text-xs text-gray-400 mt-1">
              Customer analytics and insights coming soon
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading && retryCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50/30 pb-20">
        <div className="space-y-4 p-4 max-w-4xl mx-auto">
          {/* Loading Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl p-4 shadow-sm border animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-20 h-9 bg-gray-200 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 bg-gray-200 rounded w-20"></div>
              <div className="h-9 bg-gray-200 rounded w-24"></div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      <div className="space-y-4 p-4 max-w-4xl mx-auto">
        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{errorMessage}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-4"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Mobile Menu Button for Customer Info */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 sm:w-96 overflow-y-auto"
              >
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/customers")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {safeString(customer?.name, "Unknown Customer")}
              </h1>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge
                  variant={
                    customerStatus === "active"
                      ? "default"
                      : customerStatus === "dormant"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {customerStatus.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {customerType}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="hidden sm:flex gap-2">
            {isError && (
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Main Content Area - Full width since sidebar is now in drawer */}
        <div className="space-y-4 lg:space-y-6">
          <TabContent />
        </div>
      </div>

      {/* Bottom Navigation Bar - Like WhatsApp */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-4 h-16 max-w-4xl mx-auto">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  isActive
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 bg-orange-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
