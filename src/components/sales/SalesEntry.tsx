"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Save,
  Search,
  Printer,
  User,
  X,
  Calendar,
  Package,
  CreditCard,
  Wallet,
  DollarSign,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calculator,
  Users,
  MapPin,
  Truck,
  Receipt,
  ShoppingCart,
  Sparkles,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Updated item names as per requirements
const DEFAULT_ITEMS = [
  "Awwal",
  "Doyam",
  "Number 3",
  "Seedha Chatka",
  "Talsa",
  "Peela",
  "Addha",
  "teda",
  "Ravas",
  "Malwa",
];

// Payment modes as per your vision
const PAYMENT_MODES = ["cash", "upi", "bank_transfer", "cheque"] as const;

// UPDATED: Add partial_cash to payment types
const PAYMENT_TYPES = [
  "full_cash",
  "partial_cash", // NEW: Partial payment option
  "full_advance",
  "advance_cash",
  "credit",
] as const;

const CUSTOMER_TYPES = [
  "retailer",
  "contractor",
  "builder",
  "individual",
] as const;

interface Customer {
  id: string;
  name: string;
  phone?: string;
  street?: string;
  city?: string;
  district?: string;
  pincode?: string;
  customerType: (typeof CUSTOMER_TYPES)[number];
  joiningDate: string;
  gstNumber?: string;
  status: "active" | "dormant" | "blocked";
  preferredContact: "call" | "whatsapp";
  notes?: string;
  totalLifetimeValue: number;
  dueAmount: number;
  lastPurchaseDate?: string;
  averageMonthlyPurchase: number;
  advanceBalance: number;
  loyaltyPoints?: number;
}

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export default function SalesEntry() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    district: "",
    pincode: "",
    customerType: "individual" as (typeof CUSTOMER_TYPES)[number],
    gstNumber: "",
    preferredContact: "call" as "call" | "whatsapp",
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([
    { id: "1", name: "", quantity: 1, price: 0, total: 0 },
  ]);
  const [paymentType, setPaymentType] =
    useState<(typeof PAYMENT_TYPES)[number]>("full_cash");
  const [paymentMode, setPaymentMode] =
    useState<(typeof PAYMENT_MODES)[number]>("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discountType, setDiscountType] = useState<
    "none" | "percentage" | "fixed"
  >("none");
  const [discountValue, setDiscountValue] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [isBackDate, setIsBackDate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    customer?: string;
    items?: string;
    payment?: string;
    dueDate?: string;
  }>({});
  const [success, setSuccess] = useState<string | null>(null);

  // Delivery management
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    district: "",
    pincode: "",
  });
  const [useDifferentDeliveryAddress, setUseDifferentDeliveryAddress] =
    useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<
    "pending" | "scheduled" | "delivered" | "partial"
  >("pending");

  // Payment reference fields
  const [paymentReference, setPaymentReference] = useState("");
  const [bankTransactionId, setBankTransactionId] = useState("");

  // Advance payment fields
  const [advancePayment, setAdvancePayment] = useState("");
  const [advanceUsed, setAdvanceUsed] = useState("");
  const [customerAdvanceBalance, setCustomerAdvanceBalance] = useState(0);

  // Animation states
  const [showSparkle, setShowSparkle] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sales summary stats
  const [salesStats, setSalesStats] = useState({
    totalItems: 0,
    subtotal: 0,
    discount: 0,
    grandTotal: 0,
    profitMargin: 0,
  });

  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token]);

  useEffect(() => {
    // Update sales stats when items change
    setIsCalculating(true);
    const subtotal = calculateTotal();
    const discountAmount = calculateDiscount();
    const grandTotal = calculateGrandTotal();
    const profitMargin = calculateProfitMargin(subtotal);

    setTimeout(() => {
      setSalesStats({
        totalItems: items.filter((item) => item.name).length,
        subtotal,
        discount: discountAmount,
        grandTotal,
        profitMargin,
      });
      setIsCalculating(false);
    }, 300);
  }, [items, discountType, discountValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        console.error("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone?.includes(customerSearch) ||
        customer.street?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.city?.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customerId);
      setCustomerSearch(customer.name);
      setShowCustomerDropdown(false);
      setCustomerAdvanceBalance(customer.advanceBalance || 0);

      if (!useDifferentDeliveryAddress) {
        setDeliveryAddress({
          street: customer.street || "",
          city: customer.city || "",
          district: customer.district || "",
          pincode: customer.pincode || "",
        });
      }
    }
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer("");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setCustomerAdvanceBalance(0);
    setAdvanceUsed("");
    setAdvancePayment("");
    setPaymentType("full_cash");
    setPaidAmount("");
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      setSuccess(null);
      setErrors({ ...errors, customer: "Please enter customer name" });
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim() || null,
          street: newCustomer.street.trim() || null,
          city: newCustomer.city.trim() || null,
          district: newCustomer.district.trim() || null,
          pincode: newCustomer.pincode.trim() || null,
          customerType: newCustomer.customerType,
          gstNumber: newCustomer.gstNumber.trim() || null,
          preferredContact: newCustomer.preferredContact,
          joiningDate: new Date().toISOString(),
          status: "active",
          totalLifetimeValue: 0,
          dueAmount: 0,
          averageMonthlyPurchase: 0,
          advanceBalance: 0,
        }),
      });

      if (response.ok) {
        const createdCustomer = await response.json();
        setCustomers([...customers, createdCustomer]);
        setSelectedCustomer(createdCustomer.id);
        setCustomerSearch(createdCustomer.name);
        setCustomerAdvanceBalance(0);
        setNewCustomer({
          name: "",
          phone: "",
          street: "",
          city: "",
          district: "",
          pincode: "",
          customerType: "individual",
          gstNumber: "",
          preferredContact: "call",
        });
        setShowNewCustomerForm(false);
        setShowCustomerDropdown(false);
        setSuccess("Customer created successfully!");
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 2000);
      } else {
        const errorData = await response.json();
        setErrors({
          ...errors,
          customer: errorData.error || "Failed to create customer",
        });
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
      setErrors({ ...errors, customer: "Failed to create customer" });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const addItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      name: "",
      quantity: 1,
      price: 0,
      total: 0,
    };
    setItems([...items, newItem]);
    setHighlightedItem(newItem.id);
    setTimeout(() => setHighlightedItem(null), 2000);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (
    id: string,
    field: keyof SaleItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "price") {
            updatedItem.total = updatedItem.quantity * updatedItem.price;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateTotal();
    if (discountType === "percentage") {
      const percentage = parseFloat(discountValue) || 0;
      return Math.min(subtotal * (percentage / 100), subtotal);
    } else if (discountType === "fixed") {
      const fixedAmount = parseFloat(discountValue) || 0;
      return Math.min(fixedAmount, subtotal);
    }
    return 0;
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateTotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
  };

  const calculateProfitMargin = (subtotal: number) => {
    // Simple profit margin calculation (assuming 20% profit)
    const cost = subtotal * 0.8;
    return ((subtotal - cost) / subtotal) * 100;
  };

  const calculateDue = () => {
    const grandTotal = calculateGrandTotal();
    const paid = parseFloat(paidAmount) || 0;
    const advance = parseFloat(advanceUsed) || 0;

    if (paymentType === "advance_cash") {
      return Math.max(0, grandTotal - (advance + paid));
    }

    if (paymentType === "full_advance") {
      return Math.max(0, grandTotal - advance);
    }

    return Math.max(0, grandTotal - paid);
  };

  const calculatePaymentBreakdown = () => {
    const grandTotal = calculateGrandTotal();
    const paid = parseFloat(paidAmount) || 0;
    const advance = parseFloat(advanceUsed) || 0;
    const extraAdvance = parseFloat(advancePayment) || 0;

    let totalPayment = 0;
    let due = 0;

    if (paymentType === "partial_cash") {
      totalPayment = paid;
      due = Math.max(0, grandTotal - paid);
    } else if (paymentType === "advance_cash") {
      totalPayment = paid + advance;
      due = Math.max(0, grandTotal - totalPayment);
    } else if (paymentType === "full_advance") {
      totalPayment = advance;
      due = Math.max(0, grandTotal - advance);
    } else {
      totalPayment = paid;
      due = Math.max(0, grandTotal - paid);
    }

    return {
      cashPaid: paid,
      advanceUsed: advance,
      extraAdvance: extraAdvance,
      totalPayment,
      due,
      newAdvanceBalance: customerAdvanceBalance - advance + extraAdvance,
    };
  };

  // UPDATED: Improved form validation with partial_cash
  const validateForm = () => {
    const newErrors: typeof errors = {};
    const grandTotal = calculateGrandTotal();

    if (!selectedCustomer) {
      newErrors.customer = "Please select a customer";
    }

    const hasInvalidItems = items.some((item) => !item.name || item.price <= 0);
    if (hasInvalidItems) {
      newErrors.items = "Please fill all item details with valid prices";
    }

    // Payment type specific validations
    if (paymentType === "partial_cash") {
      if (!paidAmount || parseFloat(paidAmount) <= 0) {
        newErrors.payment = "Please enter amount paid now";
      }
      if (parseFloat(paidAmount) >= grandTotal) {
        newErrors.payment =
          "Paid amount must be less than grand total for partial payment";
      }
      if (!dueDate) {
        newErrors.dueDate = "Due date is required for remaining balance";
      }
    }

    if (paymentType === "advance_cash") {
      if (!advanceUsed || parseFloat(advanceUsed) <= 0) {
        newErrors.payment = "Please enter advance amount to use";
      }
      if (!paidAmount || parseFloat(paidAmount) < 0) {
        newErrors.payment = "Please enter cash amount";
      }
      if (parseFloat(advanceUsed) > customerAdvanceBalance) {
        newErrors.payment = "Advance amount cannot exceed available balance";
      }
      const totalPayment =
        (parseFloat(advanceUsed) || 0) + (parseFloat(paidAmount) || 0);
      if (totalPayment < grandTotal && !dueDate) {
        newErrors.dueDate = "Due date is required for remaining balance";
      }
    }

    if (paymentType === "full_advance") {
      if (!advanceUsed || parseFloat(advanceUsed) <= 0) {
        newErrors.payment = "Please enter advance amount to use";
      }
      if (parseFloat(advanceUsed) > customerAdvanceBalance) {
        newErrors.payment = "Advance amount cannot exceed available balance";
      }
      if (parseFloat(advanceUsed) < grandTotal && !dueDate) {
        newErrors.dueDate = "Due date is required for remaining balance";
      }
    }

    if (paymentType === "credit" && !dueDate) {
      newErrors.dueDate = "Due date is required for credit payments";
    }

    // Validate payment reference for non-cash payments
    if (paymentMode !== "cash" && !paymentReference && !bankTransactionId) {
      newErrors.payment = "Payment reference is required for non-cash payments";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePrintBill = () => {
    if (!validateForm()) {
      setErrors({
        ...errors,
        payment: "Please complete the sale details before printing",
      });
      return;
    }

    const subtotal = calculateTotal();
    const discountAmount = calculateDiscount();
    const grandTotal = calculateGrandTotal();
    const due = calculateDue();
    const breakdown = calculatePaymentBreakdown();

    const customerData = customers.find((c) => c.id === selectedCustomer);
    const printContent = `
      <html>
        <head>
          <title>Sales Bill</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            .items { margin-bottom: 20px; }
            .items table { width: 100%; border-collapse: collapse; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
            .total { text-align: right; margin-top: 20px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            .advance-info { background-color: #f0f8ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SALES BILL</h2>
            <p>Sale Date: ${
              isBackDate && saleDate
                ? new Date(saleDate).toLocaleDateString()
                : new Date().toLocaleDateString()
            }</p>
            <p>${isBackDate ? "(Back Date Entry)" : ""}</p>
            <p>Bill Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${customerData?.name || "N/A"}</p>
            <p><strong>Phone:</strong> ${customerData?.phone || "N/A"}</p>
            <p><strong>Address:</strong> ${customerData?.street || "N/A"}, ${
      customerData?.city || ""
    }, ${customerData?.district || ""} - ${customerData?.pincode || ""}</p>
            <p><strong>Customer Type:</strong> ${
              customerData?.customerType
                ? customerData.customerType.charAt(0).toUpperCase() +
                  customerData.customerType.slice(1)
                : "N/A"
            }</p>
          </div>
          
          <div class="items">
            <h3>Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .filter((item) => item.name)
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${item.total.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <div class="total">
            <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
            ${
              discountType !== "none" && discountAmount > 0
                ? `
              <p><strong>Discount (${
                discountType === "percentage"
                  ? discountValue + "%"
                  : "₹" + discountValue
              }):</strong> -₹${discountAmount.toFixed(2)}</p>
            `
                : ""
            }
            <p><strong>Grand Total:</strong> ₹${grandTotal.toFixed(2)}</p>
            
            ${
              breakdown.advanceUsed > 0
                ? `
              <p><strong>Advance Used:</strong> -₹${breakdown.advanceUsed.toFixed(
                2
              )}</p>
            `
                : ""
            }
            ${
              breakdown.cashPaid > 0
                ? `
              <p><strong>Cash Paid:</strong> ₹${breakdown.cashPaid.toFixed(
                2
              )}</p>
            `
                : ""
            }
            ${
              breakdown.extraAdvance > 0
                ? `
              <p><strong>Extra Advance Paid:</strong> +₹${breakdown.extraAdvance.toFixed(
                2
              )}</p>
            `
                : ""
            }
            ${
              breakdown.due > 0
                ? `
              <p><strong>Due Amount:</strong> ₹${breakdown.due.toFixed(2)}</p>
            `
                : ""
            }
            
            <p><strong>Payment Type:</strong> ${
              paymentType === "full_cash"
                ? "Full Cash"
                : paymentType === "partial_cash"
                ? "Partial Cash"
                : paymentType === "full_advance"
                ? "Full Advance"
                : paymentType === "advance_cash"
                ? "Advance + Cash"
                : "Credit"
            }</p>
            <p><strong>Payment Mode:</strong> ${
              paymentMode.charAt(0).toUpperCase() +
              paymentMode.slice(1).replace("_", " ")
            }</p>
            ${
              dueDate
                ? `<p><strong>Due Date:</strong> ${new Date(
                    dueDate
                  ).toLocaleDateString()}</p>`
                : ""
            }
          </div>
          
          ${
            breakdown.advanceUsed > 0 || breakdown.extraAdvance > 0
              ? `
            <div class="advance-info">
              <h3>Advance Summary</h3>
              <p><strong>Previous Advance Balance:</strong> ₹${customerAdvanceBalance.toFixed(
                2
              )}</p>
              <p><strong>New Advance Balance:</strong> ₹${breakdown.newAdvanceBalance.toFixed(
                2
              )}</p>
            </div>
          `
              : ""
          }
          
          ${
            notes
              ? `
            <div class="notes">
              <h3>Notes</h3>
              <p>${notes}</p>
            </div>
          `
              : ""
          }
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated bill</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSaveSale = async () => {
    if (!validateForm()) {
      setErrors({ ...errors, payment: "Please fix the errors before saving" });
      return;
    }

    if (isBackDate && !saleDate) {
      setErrors({
        ...errors,
        payment: "Please select a sale date for back date entry",
      });
      return;
    }

    setIsLoading(true);
    try {
      const subtotal = calculateTotal();
      const discountAmount = calculateDiscount();
      const grandTotal = calculateGrandTotal();
      const breakdown = calculatePaymentBreakdown();

      // Determine final payment type with proper validation
      let finalPaymentType = paymentType;

      // If payment is fully settled (no due), mark as cash regardless of original type
      if (breakdown.due === 0) {
        if (paymentType === "full_advance" || paymentType === "advance_cash") {
          // Keep the original type for tracking, but backend will handle due=0
          finalPaymentType = paymentType;
        }
        // For full_cash and other types where due=0, keep original type
      } else if (breakdown.due > 0 && paymentType === "full_cash") {
        // This shouldn't happen, but if full_cash has due, something is wrong
        console.warn("Full cash payment has due amount, checking calculation");
      }

      const finalSaleDate =
        isBackDate && saleDate ? new Date(saleDate) : new Date();

      const saleData = {
        customerId: selectedCustomer,
        items: items
          .filter((item) => item.name)
          .map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        subtotal,
        discountType: discountType === "none" ? null : discountType,
        discountValue:
          discountType === "none" ? null : parseFloat(discountValue) || 0,
        discountAmount: discountType === "none" ? 0 : discountAmount,
        totalAmount: grandTotal,
        paidAmount: breakdown.cashPaid,
        paymentType: paymentType,
        paymentMode,
        paymentReference: paymentReference || null,
        bankTransactionId: bankTransactionId || null,
        dueDate: breakdown.due > 0 ? dueDate : null,
        notes: notes || null,
        saleDate: finalSaleDate.toISOString(),
        isBackDate,
        deliveryAddress: useDifferentDeliveryAddress ? deliveryAddress : null,
        deliveryDate: deliveryDate || null,
        deliveryStatus,
        advancePayment: parseFloat(advancePayment) || 0,
        advanceUsed: parseFloat(advanceUsed) || 0,
        originalPaymentType: paymentType,
      };

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        // Reset form
        setSelectedCustomer("");
        setCustomerSearch("");
        setItems([{ id: "1", name: "", quantity: 1, price: 0, total: 0 }]);
        setPaymentType("full_cash");
        setPaymentMode("cash");
        setPaidAmount("");
        setDueDate("");
        setNotes("");
        setDiscountType("none");
        setDiscountValue("");
        setSaleDate("");
        setIsBackDate(false);
        setErrors({});
        setDeliveryAddress({ street: "", city: "", district: "", pincode: "" });
        setUseDifferentDeliveryAddress(false);
        setDeliveryDate("");
        setDeliveryStatus("pending");
        setPaymentReference("");
        setBankTransactionId("");
        setAdvancePayment("");
        setAdvanceUsed("");
        setCustomerAdvanceBalance(0);
        setSuccess("Sale completed successfully! 🎉");
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 3000);
      } else {
        const errorData = await response.json();
        setErrors({
          ...errors,
          payment: errorData.error || "Failed to save sale",
        });
      }
    } catch (error) {
      console.error("Failed to save sale:", error);
      setErrors({ ...errors, payment: "Failed to save sale" });
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = calculateTotal();
  const discountAmount = calculateDiscount();
  const grandTotal = calculateGrandTotal();
  const breakdown = calculatePaymentBreakdown();

  // Format currency function
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Get badge variants
  const getPaymentBadgeVariant = (type: string) => {
    switch (type) {
      case "full_cash":
        return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white";
      case "partial_cash":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "full_advance":
        return "bg-gradient-to-r from-purple-500 to-indigo-500 text-white";
      case "advance_cash":
        return "bg-gradient-to-r from-indigo-500 to-purple-500 text-white";
      case "credit":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-gradient-to-r from-emerald-500 to-green-500 text-white";
      case "scheduled":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "partial":
        return "bg-gradient-to-r from-amber-500 to-yellow-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  // Sparkle effect component (simplified without animations)
  const SparkleEffect = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-yellow-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          <Sparkles className="h-6 w-6" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {/* Sparkle Animation */}
      {showSparkle && <SparkleEffect />}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            New Sales Entry
          </h1>
          <p className="text-gray-600">
            Create a new sales transaction with advanced payment options
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="bg-emerald-50 border-emerald-200 shadow-lg">
          <AlertCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {[
              {
                icon: Package,
                label: "Items",
                value: salesStats.totalItems,
                color: "from-blue-500 to-cyan-500",
                suffix: "",
              },
              {
                icon: TrendingUp,
                label: "Subtotal",
                value: salesStats.subtotal,
                color: "from-emerald-500 to-teal-500",
                suffix: "₹",
              },
              {
                icon: TrendingDown,
                label: "Discount",
                value: salesStats.discount,
                color: "from-amber-500 to-orange-500",
                suffix: "-₹",
              },
              {
                icon: DollarSign,
                label: "Total",
                value: salesStats.grandTotal,
                color: "from-purple-500 to-indigo-500",
                suffix: "₹",
              },
              {
                icon: BarChart3,
                label: "Margin",
                value: salesStats.profitMargin,
                color: "from-green-500 to-emerald-500",
                suffix: "%",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className="min-h-[100px] border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 bg-gradient-to-r ${stat.color} rounded-lg shadow`}
                    >
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{stat.label}</p>
                      <div className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        {isCalculating ? (
                          <div className="animate-spin">
                            <Zap className="h-4 w-4 text-amber-500" />
                          </div>
                        ) : (
                          `${stat.suffix}${
                            typeof stat.value === "number"
                              ? stat.value.toLocaleString("en-IN")
                              : stat.value
                          }${stat.suffix === "%" ? "" : ""}`
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Customer Selection */}
          <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center text-gray-900">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2" ref={dropdownRef}>
                <Label
                  htmlFor="customer-search"
                  className="text-gray-700 font-medium"
                >
                  Search Customer <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      id="customer-search"
                      placeholder="Type customer name or phone number..."
                      value={customerSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomerSearch(value);
                        setShowCustomerDropdown(true);
                        if (!value) {
                          setSelectedCustomer("");
                          setCustomerAdvanceBalance(0);
                        }
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className={`pl-10 pr-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        selectedCustomer
                          ? "bg-green-50 border-green-300 ring-1 ring-green-200"
                          : ""
                      }`}
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={clearCustomerSelection}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {showCustomerDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors duration-200 ${
                              selectedCustomer === customer.id
                                ? "bg-green-50 border-l-4 border-l-green-500"
                                : ""
                            }`}
                            onClick={() => handleCustomerSelect(customer.id)}
                          >
                            <div className="font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {customer.phone} • {customer.customerType}
                            </div>
                            <div className="text-xs mt-1 flex gap-2">
                              {customer.dueAmount > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Due: ₹{customer.dueAmount.toFixed(2)}
                                </Badge>
                              )}
                              {customer.advanceBalance > 0 && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                  Advance: ₹{customer.advanceBalance.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500">
                          <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          No customers found
                        </div>
                      )}

                      <div className="border-t p-3 bg-gray-50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start border-dashed"
                          onClick={() => {
                            setShowNewCustomerForm(true);
                            setShowCustomerDropdown(false);
                            if (customerSearch) {
                              setNewCustomer((prev) => ({
                                ...prev,
                                name: customerSearch,
                              }));
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Customer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {errors.customer && (
                <Alert
                  variant="destructive"
                  className="bg-rose-50 border-rose-200"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-rose-800">
                    {errors.customer}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-dashed text-gray-600 hover:text-gray-700 hover:border-gray-400"
                onClick={() => {
                  setShowNewCustomerForm(true);
                  setShowCustomerDropdown(false);
                  setCustomerSearch("");
                  setSelectedCustomer("");
                  setCustomerAdvanceBalance(0);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>

              {/* Enhanced New Customer Form */}
              {showNewCustomerForm && (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Add New Customer
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-gray-700">Customer Name *</Label>
                        <Input
                          placeholder="Enter customer name"
                          value={newCustomer.name}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              name: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-gray-700">Phone Number</Label>
                        <Input
                          placeholder="Enter phone number"
                          value={newCustomer.phone}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              phone: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-gray-700">Customer Type</Label>
                        <Select
                          value={newCustomer.customerType}
                          onValueChange={(
                            value: (typeof CUSTOMER_TYPES)[number]
                          ) =>
                            setNewCustomer({
                              ...newCustomer,
                              customerType: value,
                            })
                          }
                        >
                          <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">
                              Individual
                            </SelectItem>
                            <SelectItem value="retailer">Retailer</SelectItem>
                            <SelectItem value="contractor">
                              Contractor
                            </SelectItem>
                            <SelectItem value="builder">Builder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-gray-700">
                          Preferred Contact
                        </Label>
                        <Select
                          value={newCustomer.preferredContact}
                          onValueChange={(value: "call" | "whatsapp") =>
                            setNewCustomer({
                              ...newCustomer,
                              preferredContact: value,
                            })
                          }
                        >
                          <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">Phone Call</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-gray-700">Street Address</Label>
                      <Input
                        placeholder="Enter street address"
                        value={newCustomer.street}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            street: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-gray-700">City</Label>
                        <Input
                          placeholder="City"
                          value={newCustomer.city}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              city: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-gray-700">District</Label>
                        <Input
                          placeholder="District"
                          value={newCustomer.district}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              district: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-gray-700">Pincode</Label>
                        <Input
                          placeholder="Pincode"
                          value={newCustomer.pincode}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              pincode: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {newCustomer.customerType !== "individual" && (
                      <div className="space-y-1">
                        <Label className="text-gray-700">
                          GST Number (Optional)
                        </Label>
                        <Input
                          placeholder="Enter GST number"
                          value={newCustomer.gstNumber}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              gstNumber: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreateCustomer}
                        disabled={
                          isCreatingCustomer || !newCustomer.name.trim()
                        }
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {isCreatingCustomer ? (
                          <div className="animate-spin h-4 w-4 mr-2">
                            <Zap className="h-4 w-4" />
                          </div>
                        ) : null}
                        {isCreatingCustomer ? "Creating..." : "Create Customer"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewCustomerForm(false);
                          setNewCustomer({
                            name: "",
                            phone: "",
                            street: "",
                            city: "",
                            district: "",
                            pincode: "",
                            customerType: "individual",
                            gstNumber: "",
                            preferredContact: "call",
                          });
                        }}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {selectedCustomer && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-800 flex items-center">
                        <User className="h-4 w-4 mr-2" />✅ Selected:{" "}
                        {customers.find((c) => c.id === selectedCustomer)?.name}
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        Type:{" "}
                        {
                          customers.find((c) => c.id === selectedCustomer)
                            ?.customerType
                        }
                        {customers.find((c) => c.id === selectedCustomer)
                          ?.dueAmount ||
                          (0 > 0 &&
                            ` • Due: ₹${customers
                              .find((c) => c.id === selectedCustomer)
                              ?.dueAmount.toFixed(2)}`)}
                        {customerAdvanceBalance > 0 &&
                          ` • Advance: ₹${customerAdvanceBalance.toFixed(2)}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCustomerSelection}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
              <CardTitle className="flex items-center justify-between text-gray-900">
                <span className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-orange-600" />
                  Sale Items
                </span>
                <Button
                  onClick={addItem}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-4 border rounded-xl bg-white hover:shadow-md transition-all duration-300 ${
                    highlightedItem === item.id
                      ? "ring-2 ring-amber-300 border-amber-300"
                      : ""
                  }`}
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Item Name */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 font-medium">
                        Item Name{" "}
                        {!item.name && <span className="text-red-500">*</span>}
                      </Label>
                      <Select
                        value={item.name}
                        onValueChange={(value) =>
                          updateItem(item.id, "name", value)
                        }
                      >
                        <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue placeholder="Select brick type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_ITEMS.map((defaultItem) => (
                            <SelectItem key={defaultItem} value={defaultItem}>
                              {defaultItem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!item.name && (
                        <p className="text-xs text-red-500 mt-1">
                          Item name is required
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 font-medium">
                        Quantity
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="0"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="text-center border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 font-medium">
                        Price{" "}
                        {item.price <= 0 && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.price || ""}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {item.price <= 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Valid price is required
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 font-medium">
                        Total
                      </Label>
                      <Input
                        value={`₹${item.total.toFixed(2)}`}
                        readOnly
                        className="bg-gradient-to-r from-gray-50 to-gray-100 font-medium border-gray-200 text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="mt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      disabled={items.length === 1}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {errors.items && (
                <Alert
                  variant="destructive"
                  className="bg-rose-50 border-rose-200"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-rose-800">
                    {errors.items}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Payment Details Section */}
          <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center text-gray-900">
                <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Back Date Option */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="back-date"
                    checked={isBackDate}
                    onChange={(e) => setIsBackDate(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="back-date"
                    className="text-sm font-medium text-gray-700"
                  >
                    Back Date Entry (for missed entries)
                  </Label>
                </div>
                {isBackDate && (
                  <div className="space-y-1">
                    <Label htmlFor="sale-date" className="text-gray-700">
                      Sale Date *
                    </Label>
                    <Input
                      id="sale-date"
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      required={isBackDate}
                      className="border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-500">
                      Select the date when the actual sale occurred
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* UPDATED: Payment Type Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="payment-type"
                    className="text-gray-700 font-medium"
                  >
                    Payment Type *
                  </Label>
                  <Select
                    value={paymentType}
                    onValueChange={(value: (typeof PAYMENT_TYPES)[number]) => {
                      setPaymentType(value);
                      const grandTotal = calculateGrandTotal();

                      // Reset related fields when payment type changes
                      if (value === "full_cash") {
                        setPaidAmount(grandTotal.toString());
                        setAdvanceUsed("");
                      } else if (value === "partial_cash") {
                        // NEW: Set paid amount to 0 for partial payment, let user enter
                        setPaidAmount("0");
                        setAdvanceUsed("");
                      } else if (value === "full_advance") {
                        setPaidAmount("0");
                        setAdvanceUsed(
                          Math.min(
                            grandTotal,
                            customerAdvanceBalance
                          ).toString()
                        );
                      } else if (value === "advance_cash") {
                        setPaidAmount("0");
                        setAdvanceUsed("0");
                      } else if (value === "credit") {
                        setPaidAmount("0");
                        setAdvanceUsed("");
                      }
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_cash">
                        Full Cash Payment
                      </SelectItem>
                      <SelectItem value="partial_cash">
                        Partial Cash Payment
                      </SelectItem>
                      <SelectItem
                        value="full_advance"
                        disabled={customerAdvanceBalance <= 0}
                      >
                        Full Advance Payment{" "}
                        {customerAdvanceBalance > 0 &&
                          `(₹${customerAdvanceBalance.toFixed(2)} available)`}
                      </SelectItem>
                      <SelectItem
                        value="advance_cash"
                        disabled={customerAdvanceBalance <= 0}
                      >
                        Advance + Cash Combination
                      </SelectItem>
                      <SelectItem value="credit">Credit/Due Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="payment-mode"
                    className="text-gray-700 font-medium"
                  >
                    Payment Mode
                  </Label>
                  <Select
                    value={paymentMode}
                    onValueChange={(value: (typeof PAYMENT_MODES)[number]) =>
                      setPaymentMode(value)
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* NEW: Partial Cash Payment Fields */}
              {paymentType === "partial_cash" && (
                <div className="space-y-3 p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h4 className="font-medium text-blue-900 flex items-center">
                    <Calculator className="h-4 w-4 mr-2" />
                    Partial Cash Payment
                  </h4>

                  <div className="space-y-2">
                    <Label
                      htmlFor="paid-amount-partial"
                      className="text-blue-800"
                    >
                      Amount Paid Now *
                    </Label>
                    <Input
                      id="paid-amount-partial"
                      type="number"
                      placeholder="Enter amount paid now"
                      min="0"
                      max={grandTotal}
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => {
                        const paid = parseFloat(e.target.value) || 0;
                        if (paid <= grandTotal) {
                          setPaidAmount(e.target.value);
                        }
                      }}
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>Grand Total: {formatCurrency(grandTotal)}</span>
                      <span>
                        Remaining:{" "}
                        {formatCurrency(
                          grandTotal - (parseFloat(paidAmount) || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  {parseFloat(paidAmount) < grandTotal && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="due-date-partial"
                        className="text-blue-800"
                      >
                        Due Date for Remaining Amount *
                      </Label>
                      <Input
                        id="due-date-partial"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="text-xs text-orange-600 font-medium">
                        Remaining due:{" "}
                        {formatCurrency(
                          grandTotal - (parseFloat(paidAmount) || 0)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Advance + Cash Combination Fields */}
              {paymentType === "advance_cash" && (
                <div className="space-y-3 p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h4 className="font-medium text-blue-900 flex items-center">
                    <Wallet className="h-4 w-4 mr-2" />
                    Advance + Cash Payment
                  </h4>

                  {/* Advance Usage */}
                  <div className="space-y-2">
                    <Label htmlFor="advance-used" className="text-blue-800">
                      Amount from Advance *
                    </Label>
                    <Input
                      id="advance-used"
                      type="number"
                      placeholder="Enter amount from advance"
                      min="0"
                      max={Math.min(grandTotal, customerAdvanceBalance)}
                      step="0.01"
                      value={advanceUsed}
                      onChange={(e) => {
                        const advanceAmount = parseFloat(e.target.value) || 0;
                        const maxAllowed = Math.min(
                          grandTotal,
                          customerAdvanceBalance
                        );

                        if (advanceAmount <= maxAllowed) {
                          setAdvanceUsed(e.target.value);
                          // Auto-calculate remaining cash amount
                          const remaining = grandTotal - advanceAmount;
                          setPaidAmount(
                            remaining > 0 ? remaining.toString() : "0"
                          );
                        }
                      }}
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>
                        Available: {formatCurrency(customerAdvanceBalance)}
                      </span>
                      <span>
                        Max usable:{" "}
                        {formatCurrency(
                          Math.min(grandTotal, customerAdvanceBalance)
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Cash Payment */}
                  <div className="space-y-2">
                    <Label htmlFor="cash-paid" className="text-blue-800">
                      Cash Payment *
                    </Label>
                    <Input
                      id="cash-paid"
                      type="number"
                      placeholder="Enter cash amount"
                      min="0"
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => {
                        const cashAmount = parseFloat(e.target.value) || 0;
                        const remaining =
                          grandTotal - (parseFloat(advanceUsed) || 0);

                        if (cashAmount <= remaining) {
                          setPaidAmount(e.target.value);
                        }
                      }}
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="text-xs text-blue-600">
                      Remaining after advance:{" "}
                      {formatCurrency(
                        grandTotal - (parseFloat(advanceUsed) || 0)
                      )}
                    </div>
                  </div>

                  {/* Due Date for remaining balance if any */}
                  {parseFloat(advanceUsed) + parseFloat(paidAmount) <
                    grandTotal && (
                    <div className="space-y-2">
                      <Label htmlFor="due-date" className="text-blue-800">
                        Due Date for Remaining Balance *
                      </Label>
                      <Input
                        id="due-date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                        className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="text-xs text-orange-600 font-medium">
                        Remaining due:{" "}
                        {formatCurrency(
                          grandTotal -
                            (parseFloat(advanceUsed) + parseFloat(paidAmount))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full Advance Payment Fields */}
              {paymentType === "full_advance" && (
                <div className="space-y-3 p-4 border border-green-200 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
                  <h4 className="font-medium text-green-900 flex items-center">
                    <Wallet className="h-4 w-4 mr-2" />
                    Full Advance Payment
                  </h4>

                  <div className="space-y-2">
                    <Label
                      htmlFor="advance-used-full"
                      className="text-green-800"
                    >
                      Amount from Advance *
                    </Label>
                    <Input
                      id="advance-used-full"
                      type="number"
                      placeholder="Enter amount from advance"
                      min="0"
                      max={Math.min(grandTotal, customerAdvanceBalance)}
                      step="0.01"
                      value={advanceUsed}
                      onChange={(e) => {
                        const advanceAmount = parseFloat(e.target.value) || 0;
                        const maxAllowed = Math.min(
                          grandTotal,
                          customerAdvanceBalance
                        );

                        if (advanceAmount <= maxAllowed) {
                          setAdvanceUsed(e.target.value);
                        }
                      }}
                      className="border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                    <div className="flex justify-between text-xs text-green-600">
                      <span>
                        Available: {formatCurrency(customerAdvanceBalance)}
                      </span>
                      <span>Grand Total: {formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Show remaining balance if advance is less than grand total */}
                  {parseFloat(advanceUsed) < grandTotal && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="due-date-advance"
                        className="text-green-800"
                      >
                        Due Date for Remaining Balance *
                      </Label>
                      <Input
                        id="due-date-advance"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                        className="border-green-200 focus:border-green-500 focus:ring-green-500"
                      />
                      <div className="text-xs text-orange-600 font-medium">
                        Remaining due:{" "}
                        {formatCurrency(grandTotal - parseFloat(advanceUsed))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Credit Payment Fields */}
              {paymentType === "credit" && (
                <div className="space-y-2 p-4 border border-amber-200 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50">
                  <Label htmlFor="due-date-credit" className="text-amber-800">
                    Due Date *
                  </Label>
                  <Input
                    id="due-date-credit"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                  <div className="text-xs text-amber-600">
                    Total amount will be marked as due
                  </div>
                </div>
              )}

              {/* Payment Reference Fields */}
              {(paymentMode === "upi" ||
                paymentMode === "bank_transfer" ||
                paymentMode === "cheque") && (
                <div className="space-y-3 p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Reference Details
                  </h4>
                  <div className="space-y-2">
                    <Label
                      htmlFor="payment-reference"
                      className="text-gray-700"
                    >
                      {paymentMode === "upi"
                        ? "UPI Transaction ID"
                        : paymentMode === "bank_transfer"
                        ? "Bank Transaction ID"
                        : "Cheque Number"}{" "}
                      *
                    </Label>
                    <Input
                      id="payment-reference"
                      placeholder={`Enter ${
                        paymentMode === "upi"
                          ? "UPI Transaction ID"
                          : paymentMode === "bank_transfer"
                          ? "Bank Transaction ID"
                          : "Cheque Number"
                      }`}
                      value={
                        paymentMode === "bank_transfer"
                          ? bankTransactionId
                          : paymentReference
                      }
                      onChange={(e) => {
                        if (paymentMode === "bank_transfer") {
                          setBankTransactionId(e.target.value);
                        } else {
                          setPaymentReference(e.target.value);
                        }
                      }}
                      required
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Extra Advance Payment */}
              <div className="space-y-2">
                <Label
                  htmlFor="advance-payment"
                  className="text-gray-700 font-medium"
                >
                  Extra Advance Payment (Optional)
                </Label>
                <Input
                  id="advance-payment"
                  type="number"
                  placeholder="Enter extra amount to add as advance"
                  min="0"
                  step="0.01"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  This amount will be added to customer's advance balance after
                  the sale
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-700 font-medium">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this sale..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                />
              </div>

              {/* Error Display */}
              {errors.payment && (
                <Alert
                  variant="destructive"
                  className="bg-rose-50 border-rose-200"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-rose-800">
                    {errors.payment}
                  </AlertDescription>
                </Alert>
              )}

              {errors.dueDate && (
                <Alert
                  variant="destructive"
                  className="bg-rose-50 border-rose-200"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-rose-800">
                    {errors.dueDate}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Delivery Management Section */}
          <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <CardTitle className="flex items-center text-gray-900">
                <Truck className="h-5 w-5 mr-2 text-indigo-600" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="different-delivery"
                    checked={useDifferentDeliveryAddress}
                    onChange={(e) =>
                      setUseDifferentDeliveryAddress(e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="different-delivery"
                    className="text-sm font-medium text-gray-700"
                  >
                    Use different delivery address
                  </Label>
                </div>
              </div>

              {useDifferentDeliveryAddress && (
                <div className="space-y-3 p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Delivery Address
                  </h4>
                  <div className="space-y-1">
                    <Label className="text-gray-700">Street Address</Label>
                    <Input
                      placeholder="Enter delivery street address"
                      value={deliveryAddress.street}
                      onChange={(e) =>
                        setDeliveryAddress({
                          ...deliveryAddress,
                          street: e.target.value,
                        })
                      }
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-gray-700">City</Label>
                      <Input
                        placeholder="City"
                        value={deliveryAddress.city}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            city: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-700">District</Label>
                      <Input
                        placeholder="District"
                        value={deliveryAddress.district}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            district: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-700">Pincode</Label>
                      <Input
                        placeholder="Pincode"
                        value={deliveryAddress.pincode}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            pincode: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-date" className="text-gray-700">
                    Delivery Date (Optional)
                  </Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={
                      isBackDate
                        ? undefined
                        : new Date().toISOString().split("T")[0]
                    }
                    className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    {isBackDate
                      ? "Back date mode: Can select past delivery dates"
                      : "Normal mode: Can only select today or future delivery dates"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-status" className="text-gray-700">
                    Delivery Status
                  </Label>
                  <Select
                    value={deliveryStatus}
                    onValueChange={(
                      value: "pending" | "scheduled" | "delivered" | "partial"
                    ) => setDeliveryStatus(value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="partial">Partial Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Section */}
        <div className="space-y-6">
          <div className="sticky top-6">
            <Card className="border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center text-gray-900">
                  <Receipt className="h-5 w-5 mr-2 text-amber-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Back Date Indicator */}
                {isBackDate && (
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="text-sm font-medium text-orange-800">
                          Back Date Entry
                        </div>
                        <div className="text-xs text-orange-700">
                          Sale Date:{" "}
                          {saleDate
                            ? new Date(saleDate).toLocaleDateString()
                            : "Not selected"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Info in Summary */}
                {(useDifferentDeliveryAddress || deliveryDate) && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-blue-800">
                          Delivery Information
                        </div>
                        {deliveryDate && (
                          <div className="text-xs text-blue-700">
                            Date: {new Date(deliveryDate).toLocaleDateString()}
                          </div>
                        )}
                        {deliveryStatus !== "pending" && (
                          <div className="text-xs text-blue-700">
                            Status:{" "}
                            {deliveryStatus.charAt(0).toUpperCase() +
                              deliveryStatus.slice(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Advance Balance in Summary */}
                {selectedCustomer && customerAdvanceBalance > 0 && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-sm font-medium text-green-800">
                          Current Advance Balance
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          {formatCurrency(customerAdvanceBalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {items
                    .filter((item) => item.name)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  {/* Discount Section */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Discount (Optional)
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={discountType}
                        onValueChange={(
                          value: "none" | "percentage" | "fixed"
                        ) => {
                          setDiscountType(value);
                          if (value === "none") setDiscountValue("");
                        }}
                      >
                        <SelectTrigger className="w-32 border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Discount</SelectItem>
                          <SelectItem value="percentage">
                            Percentage %
                          </SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      {discountType !== "none" && (
                        <Input
                          type="number"
                          placeholder={
                            discountType === "percentage" ? "10" : "100"
                          }
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          min="0"
                          max={
                            discountType === "percentage" ? "100" : undefined
                          }
                          step={discountType === "percentage" ? "1" : "0.01"}
                          className="flex-1 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>
                    {discountType !== "none" && discountValue && (
                      <div className="text-xs text-gray-500">
                        {discountType === "percentage"
                          ? `Discount: ${discountValue}% of ${formatCurrency(
                              subtotal
                            )}`
                          : `Discount: ${formatCurrency(
                              parseFloat(discountValue)
                            )}`}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>

                    {discountType !== "none" && discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  {(breakdown.cashPaid > 0 ||
                    breakdown.advanceUsed > 0 ||
                    breakdown.extraAdvance > 0) && (
                    <div className="border-t pt-2 space-y-2">
                      {breakdown.advanceUsed > 0 && (
                        <div className="flex justify-between text-sm text-blue-600">
                          <span>Advance Used:</span>
                          <span>-{formatCurrency(breakdown.advanceUsed)}</span>
                        </div>
                      )}
                      {breakdown.cashPaid > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Cash Paid:</span>
                          <span>{formatCurrency(breakdown.cashPaid)}</span>
                        </div>
                      )}
                      {breakdown.extraAdvance > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Extra Advance:</span>
                          <span>+{formatCurrency(breakdown.extraAdvance)}</span>
                        </div>
                      )}
                      {breakdown.due > 0 && (
                        <div className="flex justify-between font-semibold text-red-600 border-t pt-1">
                          <span>Due Amount:</span>
                          <span>{formatCurrency(breakdown.due)}</span>
                        </div>
                      )}
                      {(breakdown.advanceUsed > 0 ||
                        breakdown.extraAdvance > 0) && (
                        <div className="flex justify-between text-sm border-t pt-1">
                          <span>New Advance Balance:</span>
                          <span className="font-medium">
                            {formatCurrency(breakdown.newAdvanceBalance)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-gray-700">Payment Type:</span>
                    <Badge className={getPaymentBadgeVariant(paymentType)}>
                      {paymentType === "full_cash"
                        ? "Full Cash"
                        : paymentType === "partial_cash"
                        ? "Partial Cash"
                        : paymentType === "full_advance"
                        ? "Full Advance"
                        : paymentType === "advance_cash"
                        ? "Advance + Cash"
                        : "Credit"}
                    </Badge>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Mode:</span>
                    <span className="text-gray-900 capitalize">
                      {paymentMode.replace("_", " ")}
                    </span>
                  </div>

                  {dueDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="text-gray-900">
                        {new Date(dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <div className="flex-1">
                    <Button
                      onClick={handleSaveSale}
                      disabled={isLoading || !selectedCustomer}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2">
                            <Zap className="h-4 w-4" />
                          </div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Complete Sale
                        </>
                      )}
                    </Button>
                  </div>
                  <div>
                    <Button
                      onClick={handlePrintBill}
                      disabled={
                        !selectedCustomer ||
                        items.some((item) => !item.name || item.price <= 0)
                      }
                      variant="outline"
                      className="px-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                      title="Print Bill (Optional)"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
