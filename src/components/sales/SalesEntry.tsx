"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Customer {
  id: string;
  name: string;
  phone?: string;
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
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCustomerDropdown) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCustomerDropdown]);

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
        customer.phone?.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomer(customerId);
    setShowCustomerDropdown(false);
    setCustomerSearch("");
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
        }),
      });

      if (response.ok) {
        const createdCustomer = await response.json();
        setCustomers([...customers, createdCustomer]);
        setSelectedCustomer(createdCustomer.id);
        setNewCustomer({ name: "", phone: "" });
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

  const calculateDue = () => {
    const total = calculateTotal();
    const paid = parseFloat(paidAmount) || 0;
    return Math.max(0, total - paid);
  };

  const handleSaveSale = async () => {
    if (
      !selectedCustomer ||
      items.some((item) => !item.name || item.price <= 0)
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if ((paymentType === "credit" || paymentType === "partial") && !dueDate) {
      alert("Please specify the due date for credit payment");
      return;
    }

    setIsLoading(true);
    try {
      const totalAmount = calculateTotal();
      let finalPaidAmount = 0;
      let finalPaymentType = paymentType;

      if (paymentType === "cash") {
        finalPaidAmount = totalAmount;
      } else if (paymentType === "partial") {
        finalPaidAmount = parseFloat(paidAmount) || 0;
        if (finalPaidAmount >= totalAmount) {
          finalPaymentType = "cash";
          finalPaidAmount = totalAmount;
        }
      } else if (paymentType === "credit") {
        finalPaidAmount = parseFloat(paidAmount) || 0;
      }

      const saleData = {
        customerId: selectedCustomer,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        totalAmount,
        paidAmount: finalPaidAmount,
        paymentType: finalPaymentType,
        dueDate:
          finalPaymentType === "credit" || finalPaymentType === "partial"
            ? dueDate
            : null,
        notes: notes || null,
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

  const total = calculateTotal();
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
              <div className="space-y-2">
                <Label htmlFor="customer-search">Search Customer *</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customer-search"
                      placeholder="Type customer name or phone number..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="pl-10"
                    />
                  </div>

                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {customerSearch && filteredCustomers.length > 0 && (
                        <>
                          {filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                              onClick={() => handleCustomerSelect(customer.id)}
                            >
                              <div className="font-medium">{customer.name}</div>
                              {customer.phone && (
                                <div className="text-sm text-gray-500">
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}

                      {customerSearch && filteredCustomers.length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          No customers found
                        </div>
                      )}

                      <div className="border-t p-2">
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
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowNewCustomerForm(true);
                    setShowCustomerDropdown(false);
                    setCustomerSearch("");
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Customer
                </Button>
              </div>

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
                          setNewCustomer({ name: "", phone: "" });
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
                  <div className="text-sm font-medium text-green-800">
                    Selected:{" "}
                    {customers.find((c) => c.id === selectedCustomer)?.name}
                    {customers.find((c) => c.id === selectedCustomer)?.phone &&
                      ` (${
                        customers.find((c) => c.id === selectedCustomer)?.phone
                      })`}
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
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`item-name-${item.id}`}
                        className="text-xs text-gray-600"
                      >
                        Item Name
                      </Label>
                      <Input
                        id={`item-name-${item.id}`}
                        placeholder="Enter item name"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.id, "name", e.target.value)
                        }
                      />
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
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{total.toFixed(2)}</span>
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

              <Button
                onClick={handleSaveSale}
                disabled={isLoading || !selectedCustomer}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? "Saving..." : "Save Sale"}
                <Save className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
