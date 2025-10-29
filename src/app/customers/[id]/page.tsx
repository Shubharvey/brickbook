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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Utility functions
const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const safeString = (value, defaultValue = "") => {
  return value ? String(value) : defaultValue;
};

const safeDate = (value) => {
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

const formatCurrency = (amount) => {
  const safeAmount = safeNumber(amount, 0);
  return `₹${safeAmount.toLocaleString("en-IN")}`;
};

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (token && params.id) {
      fetchCustomerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

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
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
      setIsError(true);
      setErrorMessage("Failed to load customer data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    fetchCustomerData();
  };

  const getStatusBadge = (status) => {
    const variants = {
      paid: "bg-green-100 text-green-800",
      partial: "bg-orange-100 text-orange-800",
      pending: "bg-red-100 text-red-800",
    };

    return (
      <Badge
        className={`text-xs ${variants[status] || "bg-gray-100 text-gray-800"}`}
      >
        {safeString(status).toUpperCase()}
      </Badge>
    );
  };

  // Safe item data access
  const getItemRate = (item) => {
    return item?.ratePerThousand || item?.rate || item?.price || 0;
  };

  const getItemTotal = (item) => {
    return (
      item?.total ||
      item?.amount ||
      (getItemRate(item) * safeNumber(item?.quantity)) / 1000
    );
  };

  const downloadReceipt = async (sale) => {
    try {
      // Generate items HTML content properly
      const itemsHtml = (sale.items || [])
        .map(
          (item) => `
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
    (item) =>
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
    // ----- MAIN OUTER CONTAINER: Critical for mobile nav flushness -----
    <div className="min-h-screen bg-gray-50 pt-6 pb-0 md:pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {customer?.name || "Customer Not Found"}
              </h1>
              <p className="text-gray-600 mt-1">Customer Profile</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/customers")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </div>

          {/* Customer Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Customer Since
                    </p>
                    <p className="text-lg font-semibold">
                      {safeDate(customer?.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {customer?.phone && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Phone className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="text-lg font-semibold">{customer.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {customer?.email && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Mail className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-lg font-semibold truncate">
                        {customer.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {customer?.address && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <MapPin className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Address
                      </p>
                      <p className="text-lg font-semibold truncate">
                        {customer.address}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="hidden md:grid grid-cols-3 w-full">
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
          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6 pb-24 md:pb-6">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <CreditCard className="h-10 w-10 text-green-600" />
                        <div>
                          <p className="font-semibold">
                            Invoice: {payment.invoiceNo}
                          </p>
                          <p className="text-sm text-gray-500">
                            {safeDate(payment.createdAt)} • {payment.method}
                          </p>
                          {payment.referenceNumber && (
                            <p className="text-xs text-gray-400">
                              Ref: {payment.referenceNumber}
                            </p>
                          )}
                          {payment.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {payment.notes}
                            </p>
                          )}
                          <p className="text-xs text-blue-600 capitalize">
                            {payment.type?.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <Badge variant="outline" className="capitalize">
                          {payment.method}
                        </Badge>
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
        </Tabs>
      </div>
    </div>
  );
}
