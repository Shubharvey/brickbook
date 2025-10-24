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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_ITEMS = ["Awwal", "2 number", "Peera", "Chatka", "Addha"];

interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
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
    address: "",
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([
    { id: "1", name: "", quantity: 1, price: 0, total: 0 },
  ]);
  const [paymentType, setPaymentType] = useState<"cash" | "credit" | "partial">(
    "cash"
  );
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

  // ---------- FIX: ref to dropdown wrapper so outside clicks can be detected ----------
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // only close if click was outside the dropdownRef element
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
        customer.address?.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const handleCustomerSelect = (customerId: string) => {
    console.log("Selecting customer:", customerId);
    setSelectedCustomer(customerId);
    setShowCustomerDropdown(false);
    const selectedCustomerData = customers.find((c) => c.id === customerId);
    if (selectedCustomerData) {
      setCustomerSearch(selectedCustomerData.name);
      console.log("Customer selected successfully:", selectedCustomerData);
    } else {
      console.error("Customer not found:", customerId);
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
          address: newCustomer.address.trim() || null,
        }),
      });

      if (response.ok) {
        const createdCustomer = await response.json();
        setCustomers([...customers, createdCustomer]);
        setSelectedCustomer(createdCustomer.id);
        setNewCustomer({ name: "", phone: "", address: "" });
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
            <p><strong>Address:</strong> ${customerData?.address || "N/A"}</p>
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
    console.log("Save sale clicked. Selected customer:", selectedCustomer);
    console.log("Items:", items);
    console.log("Customers available:", customers);

    if (
      !selectedCustomer ||
      items.some((item) => !item.name || item.price <= 0)
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (isBackDate && !saleDate) {
      alert("Please select a sale date for back date entry");
      return;
    }

    if ((paymentType === "credit" || paymentType === "partial") && !dueDate) {
      alert("Please specify the due date for credit payment");
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

      // Determine the sale date
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
        dueDate:
          finalPaymentType === "credit" || finalPaymentType === "partial"
            ? dueDate
            : null,
        notes: notes || null,
        saleDate: finalSaleDate.toISOString(),
        isBackDate,
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
        setPaidAmount("");
        setDueDate("");
        setNotes("");
        setDiscountType("none");
        setDiscountValue("");
        setSaleDate("");
        setIsBackDate(false);
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
                <ShoppingCart className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2" ref={dropdownRef}>
                <Label htmlFor="customer-search">Search Customer *</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customer-search"
                      placeholder={
                        selectedCustomer
                          ? "Customer selected..."
                          : "Type customer name or phone number..."
                      }
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                        // Clear selection if search is cleared
                        if (e.target.value === "") {
                          setSelectedCustomer("");
                        }
                      }}
                      onFocus={() => {
                        if (customerSearch) {
                          setShowCustomerDropdown(true);
                        }
                      }}
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
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 ${
                            selectedCustomer === customer.id
                              ? "bg-green-100"
                              : ""
                          }`}
                          onClick={() => {
                            console.log("Customer clicked:", customer);
                            handleCustomerSelect(customer.id);
                          }}
                        >
                          <div className="font-medium">{customer.name}</div>
                          {customer.phone && (
                            <div className="text-sm text-gray-500">
                              {customer.phone}
                            </div>
                          )}
                          {customer.address && (
                            <div className="text-xs text-gray-400 truncate">
                              {customer.address}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Always show "Add New Customer" option at the bottom */}
                      <div className="border-t p-2 bg-gray-50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setShowNewCustomerForm(true);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Customer
                        </Button>
                      </div>
                    </div>
                  )}

                  {showCustomerDropdown &&
                    customerSearch &&
                    filteredCustomers.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                        <div className="px-3 py-4 text-center text-gray-500">
                          <div className="mb-2">No customers found</div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              setShowNewCustomerForm(true);
                              setShowCustomerDropdown(false);
                              // Pre-fill the new customer form with search text
                              setNewCustomer({
                                ...newCustomer,
                                name: customerSearch,
                              });
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add "{customerSearch}" as new customer
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Add New Customer Button (always visible) */}
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

              {/* New Customer Form */}
              {showNewCustomerForm && (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Add New Customer
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="new-customer-name">Customer Name *</Label>
                      <Input
                        id="new-customer-name"
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
                      <Label htmlFor="new-customer-phone">Phone Number</Label>
                      <Input
                        id="new-customer-phone"
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
                    <div className="space-y-1">
                      <Label htmlFor="new-customer-address">Address</Label>
                      <Textarea
                        id="new-customer-address"
                        placeholder="Enter customer address"
                        value={newCustomer.address}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            address: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>
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
                          setNewCustomer({ name: "", phone: "", address: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Customer Display */}
              {selectedCustomer && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-800">
                        ✅ Selected:{" "}
                        {customers.find((c) => c.id === selectedCustomer)?.name}
                        {customers.find((c) => c.id === selectedCustomer)
                          ?.phone &&
                          ` (${
                            customers.find((c) => c.id === selectedCustomer)
                              ?.phone
                          })`}
                      </div>
                      {customers.find((c) => c.id === selectedCustomer)
                        ?.address && (
                        <div className="text-xs text-green-700 mt-1">
                          📍{" "}
                          {
                            customers.find((c) => c.id === selectedCustomer)
                              ?.address
                          }
                        </div>
                      )}
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
          {/* Items */}
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
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="space-y-1 md:col-span-2">
                      <Label
                        htmlFor={`item-name-${item.id}`}
                        className="text-xs text-gray-600"
                      >
                        Item Name
                      </Label>
                      <div className="flex gap-1">
                        <Select
                          value={item.name}
                          onValueChange={(value) =>
                            updateItem(item.id, "name", value)
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select or type item name" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_ITEMS.map((defaultItem) => (
                              <SelectItem key={defaultItem} value={defaultItem}>
                                {defaultItem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Or type custom..."
                          value={
                            item.name && !DEFAULT_ITEMS.includes(item.name)
                              ? item.name
                              : ""
                          }
                          onChange={(e) =>
                            updateItem(item.id, "name", e.target.value)
                          }
                          className="w-24"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`item-qty-${item.id}`}
                        className="text-xs text-gray-600"
                      >
                        Quantity
                      </Label>
                      <Input
                        id={`item-qty-${item.id}`}
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`item-price-${item.id}`}
                        className="text-xs text-gray-600"
                      >
                        Unit Price
                      </Label>
                      <Input
                        id={`item-price-${item.id}`}
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`item-total-${item.id}`}
                        className="text-xs text-gray-600"
                      >
                        Total
                      </Label>
                      <Input
                        id={`item-total-${item.id}`}
                        placeholder="Total"
                        value={`₹${item.total.toFixed(2)}`}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Payment */}
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
                </>
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

        {/* Summary */}
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
                        if (value === "none") {
                          setDiscountValue("");
                        }
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
