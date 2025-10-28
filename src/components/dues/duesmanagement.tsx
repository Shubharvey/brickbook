"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Search,
  Calendar,
  User,
  AlertCircle,
  Phone,
  MessageSquare,
  CheckCircle,
  X,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Due {
  id: string;
  invoiceNo: string;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: "pending" | "partial" | "paid";
  createdAt: string;
  daysOverdue: number;
  saleId: string;
}

export default function DuesManagement() {
  const { token } = useAuth();
  const [dues, setDues] = useState<Due[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "partial"
  >("all");

  // Payment recording state
  const [selectedDue, setSelectedDue] = useState<Due | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<
    "cash" | "upi" | "bank_transfer" | "cheque"
  >("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      fetchDues();
    }
  }, [token]);

  const fetchDues = async () => {
    try {
      const response = await fetch("/api/dues", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDues(data);
      }
    } catch (error) {
      console.error("Failed to fetch dues:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDues = dues.filter((due) => {
    const matchesSearch =
      due.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      due.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || due.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const calculateDaysOverdue = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOverdueColor = (days: number) => {
    if (days > 30) return "text-red-600 font-semibold";
    if (days > 7) return "text-orange-600";
    return "text-gray-600";
  };

  const openPaymentDialog = (due: Due) => {
    setSelectedDue(due);
    setPaymentAmount(due.dueAmount.toString());
    setPaymentMode("cash");
    setReferenceNumber("");
    setPaymentNotes("");
    setShowPaymentDialog(true);
  };

  const closePaymentDialog = () => {
    setShowPaymentDialog(false);
    setSelectedDue(null);
    setPaymentAmount("");
    setIsProcessing(false);
  };

  const handleRecordPayment = async () => {
    if (!selectedDue || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    const paymentAmountNum = parseFloat(paymentAmount);
    if (paymentAmountNum > selectedDue.dueAmount) {
      alert(
        `Payment amount cannot exceed due amount of ₹${selectedDue.dueAmount}`
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Updated payment data to match backend expectations
      const paymentData = {
        saleId: selectedDue.saleId,
        customerId: selectedDue.customer.id, // Added customerId
        amount: paymentAmountNum,
        method: paymentMode, // Using 'method' instead of 'paymentMode'
        referenceNumber: referenceNumber || undefined,
        notes: paymentNotes || undefined,
      };

      console.log("Sending payment data:", paymentData); // For debugging

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Refresh the dues list
        await fetchDues();
        closePaymentDialog();

        // Show success message
        alert(
          `Payment of ₹${paymentAmountNum.toLocaleString(
            "en-IN"
          )} recorded successfully for ${selectedDue.customer.name}!`
        );
      } else {
        console.error("Payment failed:", responseData);
        alert(responseData.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Failed to record payment:", error);
      alert("Failed to record payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendPaymentReminder = async (due: Due) => {
    try {
      const response = await fetch("/api/dues/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: due.customer.id,
          dueId: due.id,
          amount: due.dueAmount,
          invoiceNo: due.invoiceNo,
        }),
      });

      if (response.ok) {
        alert(`Payment reminder sent to ${due.customer.name}`);
      } else {
        alert("Failed to send reminder");
      }
    } catch (error) {
      console.error("Failed to send reminder:", error);
      alert("Failed to send reminder");
    }
  };

  const totalDues = filteredDues.reduce((sum, due) => sum + due.dueAmount, 0);
  const overdueCount = filteredDues.filter(
    (due) => calculateDaysOverdue(due.createdAt) > 7
  ).length;

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

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Dues Management
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Track and manage pending payments
          </p>
        </div>
      </div>

      {/* Stats Cards - 2 columns on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="min-h-[100px]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Dues</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  ₹
                  {totalDues.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[100px]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">Overdue</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {overdueCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[100px] md:col-span-1 col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">
                  Customers with Dues
                </p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {filteredDues.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Stack on mobile */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer name or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            size="sm"
            className="whitespace-nowrap"
          >
            All ({dues.length})
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            onClick={() => setFilterStatus("pending")}
            size="sm"
            className="whitespace-nowrap"
          >
            Pending ({dues.filter((d) => d.status === "pending").length})
          </Button>
          <Button
            variant={filterStatus === "partial" ? "default" : "outline"}
            onClick={() => setFilterStatus("partial")}
            size="sm"
            className="whitespace-nowrap"
          >
            Partial ({dues.filter((d) => d.status === "partial").length})
          </Button>
        </div>
      </div>

      {/* Dues List */}
      <div className="space-y-4">
        {filteredDues.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No dues found" : "No pending dues"}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "Try a different search term"
                  : "All payments have been cleared!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDues.map((due) => {
            const daysOverdue = calculateDaysOverdue(due.createdAt);
            return (
              <Card key={due.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Customer Name and Status - Stack on mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 break-words">
                          {due.customer.name}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            className={`text-xs ${getStatusColor(due.status)}`}
                          >
                            {due.status}
                          </Badge>
                          {daysOverdue > 7 && (
                            <Badge variant="destructive" className="text-xs">
                              {daysOverdue}d overdue
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Due Details - Stack on mobile */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              Invoice: {due.invoiceNo}
                            </span>
                          </div>
                          {due.customer.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">
                                {due.customer.phone}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 text-left md:text-right">
                          <div className="text-sm text-gray-600">
                            Total: ₹{due.totalAmount.toLocaleString("en-IN")}
                          </div>
                          <div className="text-sm text-gray-600">
                            Paid: ₹{due.paidAmount.toLocaleString("en-IN")}
                          </div>
                          <div
                            className={`text-base md:text-lg font-bold ${getOverdueColor(
                              daysOverdue
                            )}`}
                          >
                            Due: ₹{due.dueAmount.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Stack on mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-sm text-gray-500">
                          Created {new Date(due.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none"
                            onClick={() =>
                              window.open(`tel:${due.customer.phone}`)
                            }
                            disabled={!due.customer.phone}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Call</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none"
                            onClick={() => sendPaymentReminder(due)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Remind</span>
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                            onClick={() => openPaymentDialog(due)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">
                              Record Payment
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Payment Recording Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Record Payment
            </DialogTitle>
          </DialogHeader>

          {selectedDue && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900">
                  {selectedDue.customer.name}
                </h4>
                <p className="text-sm text-gray-600">
                  Invoice: {selectedDue.invoiceNo}
                </p>
                <p className="text-sm text-gray-600">
                  Due Amount: ₹{selectedDue.dueAmount.toLocaleString("en-IN")}
                </p>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedDue.dueAmount}
                  min="1"
                  step="0.01"
                />
                <p className="text-xs text-gray-500">
                  Maximum: ₹{selectedDue.dueAmount.toLocaleString("en-IN")}
                </p>
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode *</Label>
                <Select
                  value={paymentMode}
                  onValueChange={(value: any) => setPaymentMode(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference Number (for non-cash payments) */}
              {paymentMode !== "cash" && (
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">
                    {paymentMode === "upi"
                      ? "UPI Transaction ID"
                      : paymentMode === "bank_transfer"
                      ? "Bank Transaction ID"
                      : "Cheque Number"}{" "}
                    *
                  </Label>
                  <Input
                    id="referenceNumber"
                    placeholder={`Enter ${
                      paymentMode === "upi"
                        ? "UPI Transaction ID"
                        : paymentMode === "bank_transfer"
                        ? "Bank Transaction ID"
                        : "Cheque Number"
                    }`}
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Input
                  id="paymentNotes"
                  placeholder="Add any notes about this payment..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              {/* Payment Summary */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Payment Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Due:</span>
                    <span className="font-medium">
                      ₹{selectedDue.dueAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Payment:</span>
                    <span className="font-medium text-green-600">
                      ₹
                      {parseFloat(paymentAmount || "0").toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-gray-600">Remaining Due:</span>
                    <span className="font-medium text-red-600">
                      ₹
                      {(
                        selectedDue.dueAmount - parseFloat(paymentAmount || "0")
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={closePaymentDialog}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={
                isProcessing || !paymentAmount || parseFloat(paymentAmount) <= 0
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
