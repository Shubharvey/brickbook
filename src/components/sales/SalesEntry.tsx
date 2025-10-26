"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Minus,
  Trash2,
  Save,
  ShoppingCart,
  DollarSign,
  Receipt,
  Search,
  Printer,
  Truck,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  // Enhanced address fields
  street?: string;
  city?: string;
  district?: string;
  pincode?: string;
  // New fields
  customerType: (typeof CUSTOMER_TYPES)[number];
  joiningDate: string;
  gstNumber?: string;
  status: "active" | "dormant" | "blocked";
  preferredContact: "call" | "whatsapp";
  notes?: string;
  // Auto-calculated fields
  totalLifetimeValue: number;
  dueAmount: number;
  lastPurchaseDate?: string;
  averageMonthlyPurchase: number;
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
  const [paymentType, setPaymentType] = useState<"cash" | "credit" | "partial">(
    "cash"
  );
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

  // NEW: Delivery management
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

  // NEW: Payment reference fields
  const [paymentReference, setPaymentReference] = useState("");
  const [bankTransactionId, setBankTransactionId] = useState("");

  // ---------- FIX: ref to dropdown wrapper so outside clicks can be detected ----------
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token]);

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
      const response = await fetch("/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
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
    setSelectedCustomer(customerId);
    setShowCustomerDropdown(false);
    const selectedCustomerData = customers.find((c) => c.id === customerId);
    if (selectedCustomerData) {
      setCustomerSearch(selectedCustomerData.name);

      // Auto-fill delivery address with customer's address
      if (!useDifferentDeliveryAddress) {
        setDeliveryAddress({
          street: selectedCustomerData.street || "",
          city: selectedCustomerData.city || "",
          district: selectedCustomerData.district || "",
          pincode: selectedCustomerData.pincode || "",
        });
      }
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert("Please enter customer name");
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
        }),
      });

      if (response.ok) {
        const createdCustomer = await response.json();
        setCustomers([...customers, createdCustomer]);
        setSelectedCustomer(createdCustomer.id);
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
        setCustomerSearch("");
        alert("Customer created successfully!");
      } else {
        alert("Failed to create customer");
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
      alert("Failed to create customer");
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

  const calculateDue = () => {
    const grandTotal = calculateGrandTotal();
    const paid = parseFloat(paidAmount) || 0;
    return Math.max(0, grandTotal - paid);
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!selectedCustomer) newErrors.customer = "Please select a customer";
    const hasInvalidItems = items.some((item) => !item.name || item.price <= 0);
    if (hasInvalidItems)
      newErrors.items = "Please fill all item details with valid prices";
    if ((paymentType === "credit" || paymentType === "partial") && !dueDate) {
      newErrors.dueDate = "Due date is required for credit/partial payments";
    }
    if (
      paymentType === "partial" &&
      (!paidAmount || parseFloat(paidAmount) <= 0)
    ) {
      newErrors.payment = "Paid amount is required for partial payments";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePrintBill = () => {
    if (
      !selectedCustomer ||
      items.some((item) => !item.name || item.price <= 0)
    ) {
      alert("Please complete the sale details before printing");
      return;
    }

    // compute totals for print output
    const subtotal = calculateTotal();
    const discountAmount = calculateDiscount();
    const grandTotal = calculateGrandTotal();
    const due = calculateDue();

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
              (paymentType === "partial" || paymentType === "credit") &&
              paidAmount
                ? `
              <p><strong>${
                paymentType === "partial" ? "Paid Amount:" : "Advance Amount:"
              }</strong> ₹${parseFloat(paidAmount).toFixed(2)}</p>
              <p><strong>Due Amount:</strong> ₹${due.toFixed(2)}</p>
            `
                : ""
            }
            <p><strong>Payment Type:</strong> ${
              paymentType === "cash"
                ? "Full Cash"
                : paymentType === "partial"
                ? "Partial"
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
      alert("Please fix the errors before saving");
      return;
    }

    if (isBackDate && !saleDate) {
      alert("Please select a sale date for back date entry");
      return;
    }

    setIsLoading(true);
    try {
      const subtotal = calculateTotal();
      const discountAmount = calculateDiscount();
      const grandTotal = calculateGrandTotal();
      let finalPaidAmount = 0;
      let finalPaymentType = paymentType;

      if (paymentType === "cash") {
        finalPaidAmount = grandTotal;
      } else if (paymentType === "partial") {
        finalPaidAmount = parseFloat(paidAmount) || 0;
        if (finalPaidAmount >= grandTotal) {
          finalPaymentType = "cash";
          finalPaidAmount = grandTotal;
        }
      } else if (paymentType === "credit") {
        finalPaidAmount = parseFloat(paidAmount) || 0;
      }

      const finalSaleDate =
        isBackDate && saleDate ? new Date(saleDate) : new Date();

      const saleData = {
        customerId: selectedCustomer,
        items: items.map((item) => ({
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
        paidAmount: finalPaidAmount,
        paymentType: finalPaymentType,
        paymentMode,
        paymentReference: paymentReference || null,
        bankTransactionId: bankTransactionId || null,
        dueDate:
          finalPaymentType === "credit" || finalPaymentType === "partial"
            ? dueDate
            : null,
        notes: notes || null,
        saleDate: finalSaleDate.toISOString(),
        isBackDate,
        // NEW: Delivery information
        deliveryAddress: useDifferentDeliveryAddress ? deliveryAddress : null,
        deliveryDate: deliveryDate || null,
        deliveryStatus,
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
        setPaymentType("cash");
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
        alert("Sale saved successfully!");
      } else {
        alert("Failed to save sale");
      }
    } catch (error) {
      console.error("Failed to save sale:", error);
      alert("Failed to save sale");
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = calculateTotal();
  const discountAmount = calculateDiscount();
  const grandTotal = calculateGrandTotal();
  const due = calculateDue();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
          <p className="text-gray-600">Create a new sales transaction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2" ref={dropdownRef}>
                <Label htmlFor="customer-search">
                  Search Customer <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customer-search"
                      placeholder="Type customer name or phone number..."
                      value={customerSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomerSearch(value);
                        setShowCustomerDropdown(true);
                        if (
                          value === "" ||
                          (selectedCustomer &&
                            !customers
                              .find((c) => c.id === selectedCustomer)
                              ?.name.toLowerCase()
                              .includes(value.toLowerCase()))
                        ) {
                          setSelectedCustomer("");
                        }
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className={`pl-10 pr-10 ${
                        selectedCustomer ? "bg-green-50 border-green-300" : ""
                      }`}
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearch("");
                          setSelectedCustomer("");
                          setShowCustomerDropdown(false);
                        }}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {showCustomerDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 ${
                              selectedCustomer === customer.id
                                ? "bg-green-100"
                                : ""
                            }`}
                            onClick={() => handleCustomerSelect(customer.id)}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">
                              {customer.phone} • {customer.customerType}
                            </div>
                            {customer.dueAmount > 0 && (
                              <div className="text-xs text-red-600">
                                Due: ₹{customer.dueAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-gray-500">
                          No customers found
                        </div>
                      )}

                      <div className="border-t p-2 bg-gray-50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
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
                <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.customer}</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setShowNewCustomerForm(true);
                  setShowCustomerDropdown(false);
                  setCustomerSearch("");
                  setSelectedCustomer("");
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>

              {/* Enhanced New Customer Form */}
              {showNewCustomerForm && (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Add New Customer
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Customer Name *</Label>
                        <Input
                          placeholder="Enter customer name"
                          value={newCustomer.name}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Phone Number</Label>
                        <Input
                          placeholder="Enter phone number"
                          value={newCustomer.phone}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Customer Type</Label>
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
                          <SelectTrigger>
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
                        <Label>Preferred Contact</Label>
                        <Select
                          value={newCustomer.preferredContact}
                          onValueChange={(value: "call" | "whatsapp") =>
                            setNewCustomer({
                              ...newCustomer,
                              preferredContact: value,
                            })
                          }
                        >
                          <SelectTrigger>
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
                      <Label>Street Address</Label>
                      <Input
                        placeholder="Enter street address"
                        value={newCustomer.street}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            street: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>City</Label>
                        <Input
                          placeholder="City"
                          value={newCustomer.city}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              city: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>District</Label>
                        <Input
                          placeholder="District"
                          value={newCustomer.district}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              district: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Pincode</Label>
                        <Input
                          placeholder="Pincode"
                          value={newCustomer.pincode}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              pincode: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {newCustomer.customerType !== "individual" && (
                      <div className="space-y-1">
                        <Label>GST Number (Optional)</Label>
                        <Input
                          placeholder="Enter GST number"
                          value={newCustomer.gstNumber}
                          onChange={(e) =>
                            setNewCustomer({
                              ...newCustomer,
                              gstNumber: e.target.value,
                            })
                          }
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
                      >
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
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {selectedCustomer && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-800">
                        ✅ Selected:{" "}
                        {customers.find((c) => c.id === selectedCustomer)?.name}
                      </div>
                      <div className="text-xs text-green-700">
                        Type:{" "}
                        {
                          customers.find((c) => c.id === selectedCustomer)
                            ?.customerType
                        }
                        {customers.find((c) => c.id === selectedCustomer)
                          ?.dueAmount > 0 &&
                          ` • Due: ₹${customers
                            .find((c) => c.id === selectedCustomer)
                            ?.dueAmount.toFixed(2)}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer("");
                        setCustomerSearch("");
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Section - UPDATED: Removed custom input field */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
                  Sale Items
                </span>
                <Button onClick={addItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-3 border rounded-lg bg-white"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    {/* Item Name - UPDATED: Full width without custom input */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">
                        Item Name{" "}
                        {!item.name && <span className="text-red-500">*</span>}
                      </Label>
                      <Select
                        value={item.name}
                        onValueChange={(value) =>
                          updateItem(item.id, "name", value)
                        }
                      >
                        <SelectTrigger>
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
                        <p className="text-xs text-red-500">
                          Item name is required
                        </p>
                      )}
                    </div>

                    {/* Quantity - UPDATED: Better placeholder with 30% opacity */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Quantity</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1000"
                        min="1"
                        value={item.quantity === 1 ? "" : item.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty for easy typing
                          if (value === "") {
                            updateItem(item.id, "quantity", 1);
                          } else {
                            const numValue = parseInt(value);
                            // Only accept positive numbers
                            if (!isNaN(numValue) && numValue > 0) {
                              updateItem(item.id, "quantity", numValue);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // Set to 1 if empty or invalid
                          if (!e.target.value || parseInt(e.target.value) < 1) {
                            updateItem(item.id, "quantity", 1);
                          }
                        }}
                        className="text-center placeholder:opacity-30"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">
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
                      />
                      {item.price <= 0 && (
                        <p className="text-xs text-red-500">
                          Valid price is required
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Total</Label>
                      <Input
                        value={`₹${item.total.toFixed(2)}`}
                        readOnly
                        className="bg-gray-50 font-medium"
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="mt-6 text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {errors.items && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.items}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* NEW: Delivery Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="different-delivery"
                    checked={useDifferentDeliveryAddress}
                    onChange={(e) =>
                      setUseDifferentDeliveryAddress(e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <Label
                    htmlFor="different-delivery"
                    className="text-sm font-medium"
                  >
                    Use different delivery address
                  </Label>
                </div>
              </div>

              {useDifferentDeliveryAddress && (
                <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900">
                    Delivery Address
                  </h4>
                  <div className="space-y-1">
                    <Label>Street Address</Label>
                    <Input
                      placeholder="Enter delivery street address"
                      value={deliveryAddress.street}
                      onChange={(e) =>
                        setDeliveryAddress({
                          ...deliveryAddress,
                          street: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>City</Label>
                      <Input
                        placeholder="City"
                        value={deliveryAddress.city}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>District</Label>
                      <Input
                        placeholder="District"
                        value={deliveryAddress.district}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            district: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Pincode</Label>
                      <Input
                        placeholder="Pincode"
                        value={deliveryAddress.pincode}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            pincode: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-date">
                    Delivery Date (Optional)
                  </Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-status">Delivery Status</Label>
                  <Select
                    value={deliveryStatus}
                    onValueChange={(
                      value: "pending" | "scheduled" | "delivered" | "partial"
                    ) => setDeliveryStatus(value)}
                  >
                    <SelectTrigger>
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

          {/* Enhanced Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Back Date Option */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="back-date"
                    checked={isBackDate}
                    onChange={(e) => setIsBackDate(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="back-date" className="text-sm font-medium">
                    Back Date Entry (for missed entries)
                  </Label>
                </div>
                {isBackDate && (
                  <div className="space-y-1">
                    <Label htmlFor="sale-date">Sale Date *</Label>
                    <Input
                      id="sale-date"
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      required={isBackDate}
                      className="border-orange-300 focus:border-orange-500"
                    />
                    <p className="text-xs text-gray-500">
                      Select the date when the actual sale occurred
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-type">Payment Type</Label>
                  <Select
                    value={paymentType}
                    onValueChange={(value: "cash" | "credit" | "partial") =>
                      setPaymentType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Full Cash Payment</SelectItem>
                      <SelectItem value="partial">Partial Payment</SelectItem>
                      <SelectItem value="credit">Credit/Due Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-mode">Payment Mode</Label>
                  <Select
                    value={paymentMode}
                    onValueChange={(value: (typeof PAYMENT_MODES)[number]) =>
                      setPaymentMode(value)
                    }
                  >
                    <SelectTrigger>
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

              {(paymentType === "partial" || paymentType === "credit") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="paid-amount">
                      {paymentType === "partial"
                        ? "Paid Amount *"
                        : "Advance Amount (Optional)"}
                    </Label>
                    <Input
                      id="paid-amount"
                      type="number"
                      placeholder="Enter amount paid"
                      min="0"
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      required={paymentType === "partial"}
                    />
                  </div>

                  {errors.payment && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{errors.payment}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due Date *</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  {errors.dueDate && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{errors.dueDate}</p>
                    </div>
                  )}
                </>
              )}

              {/* Payment Reference Fields */}
              {(paymentMode === "upi" ||
                paymentMode === "bank_transfer" ||
                paymentMode === "cheque") && (
                <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-blue-50">
                  <h4 className="font-medium text-gray-900">
                    Payment Reference Details
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="payment-reference">
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
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this sale..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Section */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Back Date Indicator */}
              {isBackDate && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="text-sm font-medium text-orange-800">
                    📅 Back Date Entry
                  </div>
                  <div className="text-xs text-orange-700">
                    Sale Date:{" "}
                    {saleDate
                      ? new Date(saleDate).toLocaleDateString()
                      : "Not selected"}
                  </div>
                </div>
              )}

              {/* Delivery Info in Summary */}
              {(useDifferentDeliveryAddress || deliveryDate) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm font-medium text-blue-800">
                    🚚 Delivery Information
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
              )}

              <div className="space-y-2">
                {items
                  .filter((item) => item.name)
                  .map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span>₹{item.total.toFixed(2)}</span>
                    </div>
                  ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                {/* Discount Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
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
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Discount</SelectItem>
                        <SelectItem value="percentage">Percentage %</SelectItem>
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
                        max={discountType === "percentage" ? "100" : undefined}
                        step={discountType === "percentage" ? "1" : "0.01"}
                        className="flex-1"
                      />
                    )}
                  </div>
                  {discountType !== "none" && discountValue && (
                    <div className="text-xs text-gray-500">
                      {discountType === "percentage"
                        ? `Discount: ${discountValue}% of ₹${subtotal.toFixed(
                            2
                          )}`
                        : `Discount: ₹${parseFloat(discountValue).toFixed(2)}`}
                    </div>
                  )}
                </div>

                <div className="border-t pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  {discountType !== "none" && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {(paymentType === "partial" || paymentType === "credit") &&
                  paidAmount && (
                    <>
                      <div className="flex justify-between">
                        <span>
                          {paymentType === "partial"
                            ? "Paid Amount:"
                            : "Advance Amount:"}
                        </span>
                        <span>₹{parseFloat(paidAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-red-600">
                        <span>Due Amount:</span>
                        <span>₹{due.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                <div className="flex justify-between">
                  <span>Payment Type:</span>
                  <Badge
                    variant={
                      paymentType === "cash"
                        ? "default"
                        : paymentType === "partial"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {paymentType === "cash"
                      ? "Full Cash"
                      : paymentType === "partial"
                      ? "Partial"
                      : "Credit"}
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Payment Mode:</span>
                  <span className="capitalize">
                    {paymentMode.replace("_", " ")}
                  </span>
                </div>

                {(paymentType === "partial" || paymentType === "credit") &&
                  dueDate && (
                    <div className="flex justify-between text-sm">
                      <span>Due Date:</span>
                      <span>{new Date(dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveSale}
                  disabled={isLoading || !selectedCustomer}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isLoading ? "Saving..." : "Save Sale"}
                  <Save className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={handlePrintBill}
                  disabled={
                    !selectedCustomer ||
                    items.some((item) => !item.name || item.price <= 0)
                  }
                  variant="outline"
                  className="px-3"
                  title="Print Bill (Optional)"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
