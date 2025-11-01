"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CreditCard,
  RefreshCw,
  Search,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Plus,
  History,
  AlertCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Utility functions
const safeNumber = (value: any, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const safeString = (value: any, defaultValue = "") => {
  return value ? String(value) : defaultValue;
};

const safeDate = (value: string) => {
  if (!value) return "Unknown";
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

const formatCurrency = (amount: number) => {
  const safeAmount = safeNumber(amount, 0);
  return `₹${safeAmount.toLocaleString("en-IN")}`;
};

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  advanceBalance: number;
  dueAmount: number;
  lastPurchaseDate?: string;
}

interface Sale {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  paymentType: string;
  createdAt: string;
  items?: any[];
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  referenceNumber?: string;
  createdAt: string;
  invoiceNo?: string;
  notes?: string;
}

interface AdvanceTransaction {
  id: string;
  amount: number;
  type: "ADVANCE_ADDED" | "ADVANCE_PAYMENT" | "ADVANCE_USED";
  description: string;
  reference?: string;
  saleId?: string;
  createdAt: string;
  sale?: {
    invoiceNo: string;
  };
}

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [advanceTransactions, setAdvanceTransactions] = useState<
    AdvanceTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Add Advance Modal States
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceDescription, setAdvanceDescription] = useState("");
  const [advanceReference, setAdvanceReference] = useState("");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [isAddingAdvance, setIsAddingAdvance] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [advanceSuccess, setAdvanceSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (token && params.id) {
      fetchCustomerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

  // Clear success message
  useEffect(() => {
    if (advanceSuccess) {
      const timer = setTimeout(() => setAdvanceSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [advanceSuccess]);

  const fetchCustomerData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const customerRes = await fetch(`/api/customers/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!customerRes.ok) throw new Error("Failed to fetch customer data");

      const customerData = await customerRes.json();
      setCustomer(customerData);

      try {
        const salesRes = await fetch(`/api/customers/${params.id}/sales`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (salesRes.ok) {
          const salesData = await salesRes.json();
          console.log("Fetched sales data:", salesData);
          setSales(salesData || []);
        }
      } catch (salesError) {
        console.log("Sales API error:", salesError);
      }

      try {
        const paymentsRes = await fetch(
          `/api/customers/${params.id}/payments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          console.log("Fetched payments data:", paymentsData);
          setPayments(paymentsData || []);
        }
      } catch (paymentsError) {
        console.log("Payments API error:", paymentsError);
      }

      try {
        const advanceRes = await fetch(
          `/api/advance/transactions?customerId=${params.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (advanceRes.ok) {
          const advanceData = await advanceRes.json();
          setAdvanceTransactions(advanceData.transactions || []);
        }
      } catch (advanceError) {
        console.log("Advance transactions API error:", advanceError);
      }
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
      setIsError(true);
      setErrorMessage("Failed to load customer data");
    } finally {
      setIsLoading(false);
    }
  };

  // Add Advance Functions
  const handleAddAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!advanceAmount || parseFloat(advanceAmount) <= 0) {
      setAdvanceError("Please enter a valid amount");
      return;
    }

    try {
      setIsAddingAdvance(true);
      setAdvanceError(null);

      const response = await fetch("/api/advance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: params.id,
          amount: parseFloat(advanceAmount),
          description: advanceDescription || "Manual advance payment",
          reference: advanceReference || undefined,
          notes: advanceNotes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdvanceSuccess(data.message || "Advance added successfully");
        setShowAddAdvanceModal(false);
        resetAdvanceForm();
        // Refresh customer data
        fetchCustomerData();
      } else {
        setAdvanceError(data.error || "Failed to add advance");
      }
    } catch (error) {
      console.error("Failed to add advance:", error);
      setAdvanceError("Failed to add advance. Please try again.");
    } finally {
      setIsAddingAdvance(false);
    }
  };

  const resetAdvanceForm = () => {
    setAdvanceAmount("");
    setAdvanceDescription("");
    setAdvanceReference("");
    setAdvanceNotes("");
    setAdvanceError(null);
  };

  const handleModalClose = () => {
    setShowAddAdvanceModal(false);
    resetAdvanceForm();
  };

  const handleRetry = () => {
    fetchCustomerData();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "bg-green-100 text-green-800",
      partial: "bg-orange-100 text-orange-800",
      pending: "bg-red-100 text-red-800",
    };

    return (
      <Badge
        className={`text-xs ${
          variants[status as keyof typeof variants] ||
          "bg-gray-100 text-gray-800"
        }`}
      >
        {safeString(status).toUpperCase()}
      </Badge>
    );
  };

  const getTransactionTypeInfo = (type: string) => {
    switch (type) {
      case "ADVANCE_ADDED":
        return {
          label: "Manual Addition",
          color: "bg-blue-100 text-blue-800",
          icon: ArrowDownLeft,
        };
      case "ADVANCE_PAYMENT":
        return {
          label: "Extra Payment",
          color: "bg-green-100 text-green-800",
          icon: ArrowDownLeft,
        };
      case "ADVANCE_USED":
        return {
          label: "Advance Used",
          color: "bg-orange-100 text-orange-800",
          icon: ArrowUpRight,
        };
      default:
        return {
          label: type,
          color: "bg-gray-100 text-gray-800",
          icon: CreditCard,
        };
    }
  };

  const handleViewAdvanceHistory = () => {
    router.push(`/advance?customer=${customer?.id}&tab=transactions`);
  };

  // Safe item data access
  const getItemRate = (item: any) => {
    return item?.ratePerThousand || item?.rate || item?.price || 0;
  };

  const getItemTotal = (item: any) => {
    return (
      item?.total ||
      item?.amount ||
      (getItemRate(item) * safeNumber(item?.quantity)) / 1000
    );
  };

  const downloadReceipt = async (sale: Sale) => {
    try {
      // Generate items HTML content properly
      const itemsHtml = (sale.items || [])
        .map(
          (item: any) => `
            <tr>
              <td>${safeString(item.name)}</td>
              <td>${safeString(item.brickType)} - ${safeString(item.size)}</td>
              <td>${safeNumber(item.quantity)} units</td>
              <td>${formatCurrency(getItemRate(item))}/1000</td>
              <td>${formatCurrency(getItemTotal(item))}</td>
            </tr>
          `
        )
        .join("");

      // Create PDF content
      const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${safeString(sale.invoiceNo)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { text-align: center; background: #1a237e; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .receipt-title { font-size: 18px; margin-bottom: 10px; }
            .customer-info { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .info-label { font-weight: bold; color: #666; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background: #1a237e; color: white; padding: 10px; text-align: left; }
            .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total-section { margin-top: 20px; padding-top: 15px; border-top: 2px solid #1a237e; }
            .amount-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            .status-badge { 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-weight: bold; 
              font-size: 12px;
              ${
                sale.status === "paid"
                  ? "background: #d4edda; color: #155724;"
                  : sale.status === "partial"
                  ? "background: #fff3cd; color: #856404;"
                  : "background: #f8d7da; color: #721c24;"
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">BRICK BUSINESS</div>
            <div class="receipt-title">OFFICIAL SALES RECEIPT</div>
          </div>

          <div class="customer-info">
            <div class="info-row">
              <span class="info-label">Customer:</span>
              <span>${customer?.name || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Invoice No:</span>
              <span>${safeString(sale.invoiceNo)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${safeDate(sale.createdAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="status-badge">${safeString(
                sale.status
              ).toUpperCase()}</span>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Type & Size</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-section">
            <div class="amount-row">
              <span class="info-label">Total Amount:</span>
              <span style="font-weight: bold; font-size: 16px;">${formatCurrency(
                sale.totalAmount
              )}</span>
            </div>
            <div class="amount-row">
              <span class="info-label">Paid Amount:</span>
              <span style="color: #28a745; font-weight: bold;">${formatCurrency(
                sale.paidAmount
              )}</span>
            </div>
            <div class="amount-row">
              <span class="info-label">Due Amount:</span>
              <span style="color: #dc3545; font-weight: bold;">${formatCurrency(
                sale.dueAmount
              )}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated receipt. No signature required.</p>
            <p>Generated on: ${new Date().toLocaleDateString("en-IN")}</p>
          </div>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([receiptContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${safeString(sale.invoiceNo)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating receipt:", error);
      // Fallback to text receipt if HTML generation fails
      const receiptContent = `
INVOICE: ${safeString(sale.invoiceNo)}
Date: ${safeDate(sale.createdAt)}
Customer: ${customer?.name || "N/A"}

ITEMS:
${(sale.items || [])
  .map(
    (item: any) =>
      `${safeString(item.name)} (${safeString(item.brickType)} - ${safeString(
        item.size
      )}): ${safeNumber(item.quantity)} units @ ${formatCurrency(
        getItemRate(item)
      )}/1000 = ${formatCurrency(getItemTotal(item))}`
  )
  .join("\n")}

TOTAL: ${formatCurrency(sale.totalAmount)}
PAID: ${formatCurrency(sale.paidAmount)}  
DUE: ${formatCurrency(sale.dueAmount)}
STATUS: ${safeString(sale.status).toUpperCase()}
      `;

      const blob = new Blob([receiptContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${safeString(sale.invoiceNo)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Calculate overview stats from sales data
  const totalSales = sales.length;
  const totalSaleAmount = sales.reduce(
    (sum, sale) => sum + safeNumber(sale.totalAmount),
    0
  );
  const totalPaidAmount = sales.reduce(
    (sum, sale) => sum + safeNumber(sale.paidAmount),
    0
  );
  const totalDueAmount = sales.reduce(
    (sum, sale) => sum + safeNumber(sale.dueAmount),
    0
  );

  // Calculate advance stats
  const totalAdvanceAdded = advanceTransactions
    .filter((t) => t.type === "ADVANCE_ADDED" || t.type === "ADVANCE_PAYMENT")
    .reduce((sum, t) => sum + safeNumber(t.amount), 0);

  const totalAdvanceUsed = advanceTransactions
    .filter((t) => t.type === "ADVANCE_USED")
    .reduce((sum, t) => sum + Math.abs(safeNumber(t.amount)), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{errorMessage}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-0 md:pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Success Message for Advance */}
        {advanceSuccess && (
          <Alert className="bg-green-50 border-green-200 mb-6">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {advanceSuccess}
            </AlertDescription>
          </Alert>
        )}

        {/* Header - Optimized */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 min-w-0">
              {/* Customer Name with Since Date inline */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                  {customer?.name || "Customer Not Found"}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1 sm:mt-0">
                  <User className="h-4 w-4" />
                  <span>Customer since {safeDate(customer?.createdAt)}</span>
                </div>
              </div>

              {/* Phone and Email in compact row */}
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {customer?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <a
                      href={`tel:${customer.phone}`}
                      className="hover:text-blue-600 transition-colors font-medium"
                    >
                      {customer.phone}
                    </a>
                  </div>
                )}

                {customer?.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a
                      href={`mailto:${customer.email}`}
                      className="hover:text-blue-600 transition-colors truncate max-w-[200px]"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => router.push("/customers")}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Customers</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>

          {/* Address Card - Only if address exists */}
          {customer?.address && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Address
                    </p>
                    <p className="text-gray-900 break-words">
                      {customer.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wallet Balance Card - Optimized for mobile */}
          <Card className="mb-6 border-l-4 border-l-green-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                  <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 mr-3 sm:mr-4" />
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Wallet Balance
                    </h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {formatCurrency(customer?.advanceBalance || 0)}
                      </p>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Available
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col xs:flex-row gap-2">
                  <Button
                    onClick={() => setShowAddAdvanceModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-sm"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Advance
                  </Button>
                  <Button
                    onClick={handleViewAdvanceHistory}
                    variant="outline"
                    size="sm"
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </div>
              </div>

              {/* Advance Summary - Optimized grid */}
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 sm:gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Total Added
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-green-600">
                    {formatCurrency(totalAdvanceAdded)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600">Total Used</p>
                  <p className="text-sm sm:text-lg font-bold text-orange-600">
                    {formatCurrency(totalAdvanceUsed)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Current Balance
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-blue-600">
                    {formatCurrency(customer?.advanceBalance || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600">Due Amount</p>
                  <p className="text-sm sm:text-lg font-bold text-red-600">
                    {formatCurrency(customer?.dueAmount || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="hidden md:grid grid-cols-4 w-full">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="flex items-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Transactions</span>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger
              value="advance"
              className="flex items-center space-x-2"
            >
              <Wallet className="h-4 w-4" />
              <span>Advance</span>
            </TabsTrigger>
          </TabsList>

          {/* UPDATED BOTTOM NAVIGATION */}
          <div
            className="
              fixed bottom-0 inset-x-0
              bg-white border-t border-gray-200 flex justify-around
              md:hidden z-50
              pb-[env(safe-area-inset-bottom)]
              shadow
            "
            style={{
              marginBottom: 0,
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors ${
                activeTab === "overview" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs text-center truncate w-full">
                Overview
              </span>
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors ${
                activeTab === "transactions" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <ShoppingCart className="h-5 w-5 mb-1" />
              <span className="text-xs text-center truncate w-full">
                Transactions
              </span>
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors ${
                activeTab === "payments" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs text-center truncate w-full">
                Payments
              </span>
            </button>
            <button
              onClick={() => setActiveTab("advance")}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors ${
                activeTab === "advance" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <Wallet className="h-5 w-5 mb-1" />
              <span className="text-xs text-center truncate w-full">
                Advance
              </span>
            </button>
          </div>
          {/* END UPDATED NAV */}

          {/* Search */}
          <div className="relative max-w-md mt-2 md:mt-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 pb-24 md:pb-6">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Sales
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalSaleAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {totalSales} transactions
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Paid
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalPaidAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {totalSaleAmount > 0
                          ? Math.round(
                              (totalPaidAmount / totalSaleAmount) * 100
                            )
                          : 0}
                        % paid
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Due
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(totalDueAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sales.filter((s) => s.status !== "paid").length}{" "}
                        pending
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sales.slice(0, 5).map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-semibold">{sale.invoiceNo}</p>
                          <p className="text-sm text-gray-500">
                            {safeDate(sale.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(sale.totalAmount)}
                        </p>
                        {getStatusBadge(sale.status)}
                      </div>
                    </div>
                  ))}
                  {sales.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No transactions found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6 pb-24 md:pb-6">
            {sales.length > 0 ? (
              sales.map((sale) => (
                <Card key={sale.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-lg font-semibold">
                          {sale.invoiceNo}
                        </p>
                        <p className="text-sm text-gray-500">
                          {safeDate(sale.createdAt)} • {sale.paymentType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {formatCurrency(sale.totalAmount)}
                        </p>
                        {getStatusBadge(sale.status)}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                      <p className="font-semibold mb-2">Items:</p>
                      <div className="space-y-2">
                        {(sale.items || []).map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm"
                          >
                            <div>
                              <span className="font-medium">
                                {safeString(item.name)}
                              </span>
                              <span className="text-gray-600 ml-2">
                                ({safeString(item.brickType)} -{" "}
                                {safeString(item.size)})
                              </span>
                              <p className="text-gray-500 text-xs">
                                {safeNumber(item.quantity)} units @{" "}
                                {formatCurrency(getItemRate(item))}/1000
                              </p>
                            </div>
                            <span className="font-medium">
                              {formatCurrency(getItemTotal(item))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">
                          Paid: {formatCurrency(sale.paidAmount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Due: {formatCurrency(sale.dueAmount)}
                        </p>
                      </div>
                      <Button
                        onClick={() => downloadReceipt(sale)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    No transactions found
                  </p>
                  <p className="text-gray-600">
                    No transactions recorded for this customer
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6 pb-24 md:pb-6">
            {payments.length > 0 ? (
              payments
                .filter(
                  (payment, index, self) =>
                    // Remove duplicates based on payment ID
                    index === self.findIndex((p) => p.id === payment.id)
                )
                .map((payment) => (
                  <Card
                    key={payment.id}
                    className="border-l-4 border-l-green-500"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <CreditCard className="h-10 w-10 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-lg text-gray-900">
                                  {payment.invoiceNo}
                                </p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {payment.method}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {payment.type?.replace("_", " ") ||
                                      "payment"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-green-600">
                                  {formatCurrency(payment.amount)}
                                </p>
                              </div>
                            </div>

                            {/* Payment Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-600">
                                    Payment Date:
                                  </span>
                                  <span className="text-gray-900">
                                    {safeDate(payment.createdAt)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-600">
                                    Time:
                                  </span>
                                  <span className="text-gray-900">
                                    {new Date(
                                      payment.createdAt
                                    ).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {payment.referenceNumber && (
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">
                                      Reference:
                                    </span>
                                    <span className="text-gray-900 font-mono text-xs">
                                      {payment.referenceNumber}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-600">
                                    Payment ID:
                                  </span>
                                  <span className="text-gray-900 font-mono text-xs">
                                    {payment.id.slice(-8)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {payment.notes && (
                              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-medium text-blue-800 mb-1">
                                  Payment Notes:
                                </p>
                                <p className="text-sm text-blue-700">
                                  {payment.notes}
                                </p>
                              </div>
                            )}

                            {/* Full timestamp for debugging */}
                            <div className="mt-2">
                              <p className="text-xs text-gray-400">
                                Recorded:{" "}
                                {new Date(payment.createdAt).toLocaleString(
                                  "en-IN"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    No payments found
                  </p>
                  <p className="text-gray-600">
                    No payment records for this customer
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* NEW: Advance Tab */}
          <TabsContent value="advance" className="space-y-6 pb-24 md:pb-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Add Advance
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Manually add advance to customer's wallet
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowAddAdvanceModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Advance
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        View History
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        See all advance transactions
                      </p>
                    </div>
                    <Button
                      onClick={handleViewAdvanceHistory}
                      variant="outline"
                    >
                      <History className="h-4 w-4 mr-2" />
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Advance Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Recent Advance Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {advanceTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {advanceTransactions.slice(0, 10).map((transaction) => {
                      const typeInfo = getTransactionTypeInfo(transaction.type);
                      const IconComponent = typeInfo.icon;

                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold">{typeInfo.label}</p>
                              <p className="text-sm text-gray-500">
                                {transaction.description}
                              </p>
                              {transaction.sale?.invoiceNo && (
                                <p className="text-xs text-blue-600">
                                  Sale: {transaction.sale.invoiceNo}
                                </p>
                              )}
                              <p className="text-xs text-gray-400">
                                {safeDate(transaction.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`text-lg font-bold ${
                              transaction.type === "ADVANCE_USED"
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {transaction.type === "ADVANCE_USED" ? "-" : "+"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      No advance transactions
                    </p>
                    <p className="text-gray-600 mb-4">
                      No advance transactions recorded for this customer
                    </p>
                    <Button
                      onClick={() => setShowAddAdvanceModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Advance
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Advance Modal */}
      <Dialog open={showAddAdvanceModal} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Add Advance Payment
            </DialogTitle>
            <DialogDescription>
              Add advance amount to {customer?.name}'s wallet balance
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAdvanceSubmit} className="space-y-4">
            {/* Customer Info (Read-only) */}
            <div className="space-y-2">
              <Label>Customer</Label>
              <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
                <p className="font-medium">{customer?.name}</p>
                <p className="text-sm text-gray-600">
                  Current Balance:{" "}
                  {formatCurrency(customer?.advanceBalance || 0)}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={advanceDescription}
                onChange={(e) => setAdvanceDescription(e.target.value)}
                placeholder="e.g., Manual advance payment"
              />
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={advanceReference}
                onChange={(e) => setAdvanceReference(e.target.value)}
                placeholder="e.g., Bank transaction ID"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                placeholder="Additional notes..."
                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>

            {/* Error Message */}
            {advanceError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{advanceError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
                disabled={isAddingAdvance}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAddingAdvance}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAddingAdvance ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Advance
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
