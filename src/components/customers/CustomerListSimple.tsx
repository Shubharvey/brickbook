"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Users,
  Upload,
  Eye,
  AlertCircle,
  Save,
  X,
  Contact,
  Smartphone,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  loyaltyPoints?: number;
}

interface ContactData {
  name: string;
  phones: string[];
  emails: string[];
  addresses: string[];
}

export default function CustomerListSimple() {
  const { token } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contact import states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<ContactData[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Wallet summary stats
  const [walletStats, setWalletStats] = useState({
    totalAdvance: 0,
    customersWithAdvance: 0,
    highestAdvance: 0,
    totalDue: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token]);

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
        calculateWalletStats(data);
      } else {
        setError("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setError("Failed to fetch customers. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateWalletStats = (customerData: Customer[]) => {
    const totalAdvance = customerData.reduce(
      (sum, customer) => sum + customer.advanceBalance,
      0
    );
    const customersWithAdvance = customerData.filter(
      (customer) => customer.advanceBalance > 0
    ).length;
    const highestAdvance = Math.max(
      ...customerData.map((customer) => customer.advanceBalance)
    );
    const totalDue = customerData.reduce(
      (sum, customer) => sum + customer.dueAmount,
      0
    );

    setWalletStats({
      totalAdvance,
      customersWithAdvance,
      highestAdvance,
      totalDue,
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getWalletBadgeVariant = (balance: number) => {
    if (balance > 50000) return "bg-emerald-500 text-white";
    if (balance > 10000) return "bg-blue-500 text-white";
    if (balance > 0) return "bg-cyan-500 text-white";
    return "bg-gray-300 text-gray-700";
  };

  const getDueBadgeVariant = (amount: number) => {
    if (amount > 50000) return "bg-rose-500 text-white";
    if (amount > 10000) return "bg-orange-500 text-white";
    if (amount > 0) return "bg-amber-500 text-white";
    return "bg-gray-300 text-gray-700";
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!newCustomer.name.trim()) {
      setError("Customer name is required");
      setIsSubmitting(false);
      return;
    }

    const duplicate = customers.find(
      (c) =>
        c.name.toLowerCase() === newCustomer.name.toLowerCase().trim() ||
        (newCustomer.phone && c.phone === newCustomer.phone.trim()) ||
        (newCustomer.email &&
          c.email?.toLowerCase() === newCustomer.email.toLowerCase().trim())
    );

    if (duplicate) {
      setError("Customer with this name, phone, or email already exists");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim() || undefined,
          email: newCustomer.email.trim() || undefined,
          address: newCustomer.address.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchCustomers();
        setNewCustomer({ name: "", phone: "", email: "", address: "" });
        setShowAddForm(false);
        setSuccess("Customer added successfully");
      } else {
        setError(data.error || "Failed to add customer");
      }
    } catch (error) {
      console.error("Failed to add customer:", error);
      setError("Failed to add customer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer.id);
    setEditForm({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setError(null);
  };

  const handleUpdateCustomer = async (customerId: string) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!editForm.name.trim()) {
      setError("Customer name is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          phone: editForm.phone.trim() || undefined,
          email: editForm.email.trim() || undefined,
          address: editForm.address.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchCustomers();
        setEditingCustomer(null);
        setEditForm({ name: "", phone: "", email: "", address: "" });
        setSuccess("Customer updated successfully");
      } else {
        setError(data.error || "Failed to update customer");
      }
    } catch (error) {
      console.error("Failed to update customer:", error);
      setError("Failed to update customer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (
    customerId: string,
    customerName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${customerName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        await fetchCustomers();
        setSuccess("Customer deleted successfully");
      } else {
        setError(data.error || "Failed to delete customer");
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
      setError("Failed to delete customer. Please try again.");
    }
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setEditForm({ name: "", phone: "", email: "", address: "" });
    setError(null);
  };

  const handleCustomerClick = (customer: Customer) => {
    if (!editingCustomer) {
      router.push(`/customers/${customer.id}`);
    }
  };

  const handleWalletClick = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/advance?customer=${customer.id}`);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.advanceBalance.toString().includes(searchTerm) ||
      customer.dueAmount.toString().includes(searchTerm)
  );

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Wallet Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            icon: Wallet,
            label: "Total Advance",
            value: formatCurrency(walletStats.totalAdvance),
            color: "bg-emerald-500",
          },
          {
            icon: Users,
            label: "With Advance",
            value: walletStats.customersWithAdvance,
            color: "bg-blue-500",
          },
          {
            icon: TrendingUp,
            label: "Highest Advance",
            value: formatCurrency(walletStats.highestAdvance),
            color: "bg-purple-500",
          },
          {
            icon: TrendingDown,
            label: "Total Due",
            value: formatCurrency(walletStats.totalDue),
            color: "bg-rose-500",
          },
        ].map((stat, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${stat.color} rounded-lg text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search customers by name, phone, email, advance, or due amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <AlertCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertDescription className="text-rose-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Customer Form */}
      {showAddForm && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Add New Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    disabled={isSubmitting}
                    className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "Adding..." : "Add Customer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                    setNewCustomer({
                      name: "",
                      phone: "",
                      email: "",
                      address: "",
                    });
                  }}
                  disabled={isSubmitting}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No customers found" : "No customers yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "Try a different search term"
                  : "Add your first customer to get started"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Customer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className={`border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden
                  ${
                    editingCustomer === customer.id
                      ? "ring-2 ring-blue-500 border-blue-500"
                      : ""
                  }`}
                onClick={() => handleCustomerClick(customer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingCustomer === customer.id ? (
                          <Input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 text-sm font-semibold border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isSubmitting}
                          />
                        ) : (
                          <h3 className="font-semibold text-gray-900 truncate">
                            {customer.name}
                          </h3>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Since{" "}
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCustomerClick(customer);
                      }}
                      disabled={isSubmitting}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Wallet and Due Balance */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge
                      className={`${getWalletBadgeVariant(
                        customer.advanceBalance
                      )} text-xs font-medium border cursor-pointer hover:shadow-md transition-all duration-200`}
                      onClick={(e) => handleWalletClick(customer, e)}
                    >
                      <Wallet className="h-3 w-3 mr-1" />
                      Advance: {formatCurrency(customer.advanceBalance)}
                    </Badge>
                    {customer.dueAmount > 0 && (
                      <Badge
                        className={`${getDueBadgeVariant(
                          customer.dueAmount
                        )} text-xs font-medium border`}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Due: {formatCurrency(customer.dueAmount)}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {editingCustomer === customer.id ? (
                      <>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-2 text-gray-400 shrink-0" />
                          <Input
                            value={editForm.phone}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 text-sm flex-1 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Phone"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-2 text-gray-400 shrink-0" />
                          <Input
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 text-sm flex-1 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Email"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-3 w-3 mr-2 text-gray-400 shrink-0" />
                          <Input
                            value={editForm.address}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 text-sm flex-1 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Address"
                            disabled={isSubmitting}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-2 text-gray-400" />
                            <span className="truncate">{customer.phone}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-2 text-gray-400" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-700"
                    >
                      ID: {customer.id.slice(-6).toUpperCase()}
                    </Badge>
                    <div className="flex space-x-1">
                      {editingCustomer === customer.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateCustomer(customer.id);
                            }}
                            disabled={isSubmitting}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEdit();
                            }}
                            disabled={isSubmitting}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCustomer(customer);
                            }}
                            disabled={isSubmitting}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomer(customer.id, customer.name);
                            }}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
