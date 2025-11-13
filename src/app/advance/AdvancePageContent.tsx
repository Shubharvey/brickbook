"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  History,
  Filter,
  Download,
  AlertCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  advanceBalance: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

interface AdvanceTransaction {
  id: string;
  amount: number;
  type: "ADVANCE_ADDED" | "ADVANCE_PAYMENT" | "ADVANCE_USED";
  description: string;
  reference?: string;
  saleId?: string;
  date: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  sale?: {
    invoiceNo: string;
  };
}

interface AdvanceSummary {
  totalAdvance: number;
  totalCustomers: number;
}

export default function AdvancePageContent() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<AdvanceTransaction[]>([]);
  const [summary, setSummary] = useState<AdvanceSummary>({
    totalAdvance: 0,
    totalCustomers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add Advance Modal States
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceDescription, setAdvanceDescription] = useState("");
  const [advanceReference, setAdvanceReference] = useState("");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [advanceDate, setAdvanceDate] = useState<Date>(new Date()); // NEW: Date state
  const [isAddingAdvance, setIsAddingAdvance] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [advanceSuccess, setAdvanceSuccess] = useState<string | null>(null);

  // Filter states
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "ADVANCE_ADDED" | "ADVANCE_USED"
  >("all");

  useEffect(() => {
    if (token) {
      fetchAdvanceData();
    }
  }, [token]);

  // Clear success message
  useEffect(() => {
    if (advanceSuccess) {
      const timer = setTimeout(() => setAdvanceSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [advanceSuccess]);

  const fetchAdvanceData = async () => {
    try {
      setIsLoading(true);

      // Fetch advance summary and customers
      const advanceRes = await fetch("/api/advance", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (advanceRes.ok) {
        const advanceData = await advanceRes.json();
        setCustomers(advanceData.customers || []);
        setSummary(
          advanceData.summary || { totalAdvance: 0, totalCustomers: 0 }
        );
      }

      // Fetch advance transactions
      const transactionsRes = await fetch("/api/advance/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch advance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add Advance Functions
  const handleAddAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer || !advanceAmount || parseFloat(advanceAmount) <= 0) {
      setAdvanceError("Please select a customer and enter a valid amount");
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
          customerId: selectedCustomer.id,
          amount: parseFloat(advanceAmount),
          description: advanceDescription || "Manual advance payment",
          reference: advanceReference || undefined,
          notes: advanceNotes || undefined,
          date: advanceDate.toISOString(), // NEW: Include date in API call
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdvanceSuccess(data.message || "Advance added successfully");
        setShowAddAdvanceModal(false);
        resetAdvanceForm();
        // Refresh advance data
        fetchAdvanceData();
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
    setSelectedCustomer(null);
    setAdvanceAmount("");
    setAdvanceDescription("");
    setAdvanceReference("");
    setAdvanceNotes("");
    setAdvanceDate(new Date()); // NEW: Reset to current date
    setAdvanceError(null);
  };

  const handleModalClose = () => {
    setShowAddAdvanceModal(false);
    resetAdvanceForm();
  };

  const openAddAdvanceModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
    }
    setShowAddAdvanceModal(true);
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

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
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

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    const matchesSearch = transaction.customer.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    // Date filter
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    let matchesDate = true;

    if (dateFilter === "today") {
      matchesDate = transactionDate.toDateString() === now.toDateString();
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = transactionDate >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = transactionDate >= monthAgo;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Success Message for Advance */}
      {advanceSuccess && (
        <Alert className="bg-green-50 border-green-200 mb-6">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {advanceSuccess}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Advance Management
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage customer advance payments and balances
          </p>
        </div>
        <Button
          onClick={() => openAddAdvanceModal()}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Advance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Advance
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalAdvance)}
                </p>
                <p className="text-sm text-gray-500">Across all customers</p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Customers with Advance
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalCustomers}
                </p>
                <p className="text-sm text-gray-500">Active advance accounts</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Recent Transactions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </p>
                <p className="text-sm text-gray-500">All time transactions</p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="ADVANCE_ADDED">Advance Added</option>
            <option value="ADVANCE_USED">Advance Used</option>
          </select>
        </div>
      </div>

      {/* Customers with Advance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customers with Advance Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <div className="space-y-4">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {customer.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        {customer.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Last purchase:{" "}
                        {safeDate(
                          customer.lastPurchaseDate || customer.createdAt
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(customer.advanceBalance)}
                      </p>
                      <Badge className="bg-green-100 text-green-800">
                        Available
                      </Badge>
                    </div>
                    <Button
                      onClick={() => openAddAdvanceModal(customer)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                No advance balances
              </p>
              <p className="text-gray-600 mb-4">
                No customers have advance balances yet
              </p>
              <Button
                onClick={() => openAddAdvanceModal()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Advance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Recent Advance Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
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
                          {transaction.customer.name}
                        </p>
                        {transaction.sale?.invoiceNo && (
                          <p className="text-xs text-blue-600">
                            Sale: {transaction.sale.invoiceNo}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {safeDate(transaction.date)}
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
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                No transactions found
              </p>
              <p className="text-gray-600">
                {searchTerm || dateFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No advance transactions recorded yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Advance Modal */}
      <Dialog open={showAddAdvanceModal} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Add Advance Payment
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer
                ? `Add advance to ${selectedCustomer.name}'s wallet`
                : "Select a customer and add advance amount"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAdvanceSubmit} className="space-y-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <select
                id="customer"
                value={selectedCustomer?.id || ""}
                onChange={(e) => {
                  const customer = customers.find(
                    (c) => c.id === e.target.value
                  );
                  setSelectedCustomer(customer || null);
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({formatCurrency(customer.advanceBalance)})
                  </option>
                ))}
              </select>
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

            {/* NEW: Date Field */}
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !advanceDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {advanceDate ? (
                      format(advanceDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={advanceDate}
                    onSelect={(date) => date && setAdvanceDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                disabled={isAddingAdvance || !selectedCustomer}
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
