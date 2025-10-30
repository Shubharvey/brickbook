"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Filter,
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

interface AdvancePayment {
  id: string;
  customerId: string;
  amount: number;
  type: "ADVANCE_ADDED" | "ADVANCE_PAYMENT" | "ADVANCE_USED";
  description: string;
  reference?: string;
  saleId?: string;
  createdAt: string;
  customer?: {
    name: string;
    phone?: string;
  };
  sale?: {
    invoiceNo: string;
  };
}

interface AdvanceData {
  customers: CustomerWithAdvance[];
  summary: {
    totalAdvance: number;
    totalCustomers: number;
  };
}

interface AdvanceTransactionsResponse {
  transactions: AdvancePayment[];
  summary: {
    totalAdded: number;
    totalUsed: number;
    totalPayments: number;
    netAdvance: number;
  };
}

export default function AdvancePage() {
  const { token } = useAuth();
  const [advanceData, setAdvanceData] = useState<AdvanceData | null>(null);
  const [transactions, setTransactions] = useState<AdvancePayment[]>([]);
  const [transactionsSummary, setTransactionsSummary] = useState({
    totalAdded: 0,
    totalUsed: 0,
    totalPayments: 0,
    netAdvance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"customers" | "transactions">(
    "customers"
  );

  useEffect(() => {
    if (token) {
      fetchAdvanceData();
      fetchAdvanceTransactions();
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

  const fetchAdvanceTransactions = async (filter?: string) => {
    try {
      setIsLoadingTransactions(true);
      const url =
        filter && filter !== "all"
          ? `/api/advance/transactions?type=${filter}`
          : "/api/advance/transactions";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: AdvanceTransactionsResponse = await response.json();
        setTransactions(data.transactions);
        setTransactionsSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch advance transactions:", error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const filteredCustomers = advanceData?.customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter((transaction) => {
    if (transactionFilter === "all") return true;
    return transaction.type === transactionFilter;
  });

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

  const handleTransactionFilterChange = (value: string) => {
    setTransactionFilter(value);
    fetchAdvanceTransactions(value);
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("customers")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "customers"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Customers ({customerCount})
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "transactions"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Receipt className="h-4 w-4 inline mr-2" />
            Transactions ({transactions.length})
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
        <Card className="min-h-[100px]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowDownLeft className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Added</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    transactionsSummary.totalAdded +
                      transactionsSummary.totalPayments
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[100px]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Used</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {formatCurrency(transactionsSummary.totalUsed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Tab Content */}
      {activeTab === "customers" && (
        <>
          {/* Filters */}
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
                        {/* Customer Name and Status */}
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

                        {/* Customer Details */}
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
                                <span className="truncate">
                                  {customer.phone}
                                </span>
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

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-sm text-gray-500">
                            ID: {customer.id.slice(-6).toUpperCase()}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 sm:flex-none"
                              onClick={() =>
                                window.open(`tel:${customer.phone}`)
                              }
                              disabled={!customer.phone}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Call</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 sm:flex-none"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Message</span>
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
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
        </>
      )}

      {/* Transactions Tab Content */}
      {activeTab === "transactions" && (
        <>
          {/* Transaction Filters */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={transactionFilter}
                onValueChange={handleTransactionFilterChange}
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="ADVANCE_ADDED">
                    Manual Additions
                  </SelectItem>
                  <SelectItem value="ADVANCE_PAYMENT">
                    Extra Payments
                  </SelectItem>
                  <SelectItem value="ADVANCE_USED">Advance Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-4">
            {isLoadingTransactions ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {transactionFilter !== "all"
                      ? "No transactions found"
                      : "No transactions"}
                  </h3>
                  <p className="text-gray-600">
                    {transactionFilter !== "all"
                      ? `No ${transactionFilter
                          .toLowerCase()
                          .replace("_", " ")} transactions found`
                      : "Advance transactions will appear here"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map((transaction) => {
                const typeInfo = getTransactionTypeInfo(transaction.type);
                const IconComponent = typeInfo.icon;

                return (
                  <Card
                    key={transaction.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {transaction.customer?.name || "Customer"}
                            </h3>
                            <Badge
                              className={`${typeInfo.color} text-xs w-fit`}
                            >
                              <IconComponent className="h-3 w-3 mr-1" />
                              {typeInfo.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                {transaction.description}
                              </p>
                              {transaction.reference && (
                                <p className="text-xs text-gray-500">
                                  Ref: {transaction.reference}
                                </p>
                              )}
                              {transaction.sale?.invoiceNo && (
                                <p className="text-xs text-blue-600">
                                  Sale: {transaction.sale.invoiceNo}
                                </p>
                              )}
                            </div>
                            <div className="text-left md:text-right space-y-1">
                              <div
                                className={`text-lg font-bold ${
                                  transaction.type === "ADVANCE_USED"
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }`}
                              >
                                {transaction.type === "ADVANCE_USED"
                                  ? "-"
                                  : "+"}
                                {formatCurrency(Math.abs(transaction.amount))}
                              </div>
                              <div className="text-xs text-gray-500">
                                {safeDate(transaction.createdAt)}
                              </div>
                            </div>
                          </div>

                          {transaction.customer?.phone && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {transaction.customer.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
