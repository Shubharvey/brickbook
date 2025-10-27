"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export default function CustomerList() {
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

  const handleImportContacts = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".vcf,.csv,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const contacts = parseContactsFile(text, file.name);

          let importedCount = 0;
          for (const contact of contacts) {
            const success = await importContact(contact);
            if (success) importedCount++;
          }

          await fetchCustomers();
          setSuccess(`Successfully imported ${importedCount} contacts`);
        } catch (error) {
          console.error("Failed to import contacts:", error);
          setError("Failed to import contacts. Please check the file format.");
        }
      }
    };
    input.click();
  };

  const parseContactsFile = (content: string, filename: string) => {
    try {
      if (filename.endsWith(".json")) {
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [data];
      }
      return [];
    } catch (error) {
      console.error("Error parsing contacts file:", error);
      return [];
    }
  };

  const importContact = async (contact: any) => {
    try {
      if (!contact.name && !contact.firstName) return false;

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:
            contact.name ||
            `${contact.firstName} ${contact.lastName || ""}`.trim(),
          phone: contact.phone || contact.mobile || contact.phoneNumber,
          email: contact.email,
          address: contact.address || contact.street,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to import contact:", error);
      return false;
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-orange-600 hover:bg-orange-700"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
          <Button
            onClick={handleImportContacts}
            variant="outline"
            disabled={isSubmitting}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Contacts
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search customers by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Customer Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
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
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
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
          <Card>
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
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  editingCustomer === customer.id
                    ? "ring-2 ring-orange-500"
                    : ""
                }`}
                onClick={() => handleCustomerClick(customer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-600" />
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
                            className="h-8 text-sm font-semibold"
                            disabled={isSubmitting}
                          />
                        ) : (
                          <h3 className="font-semibold text-gray-900 truncate">
                            {customer.name}
                          </h3>
                        )}
                        <p className="text-sm text-gray-500">
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
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
                            className="h-6 text-sm flex-1"
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
                            className="h-6 text-sm flex-1"
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
                            className="h-6 text-sm flex-1"
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
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <Badge variant="secondary" className="text-xs">
                      ID: {customer.id.slice(-6).toUpperCase()}
                    </Badge>
                    <div className="flex space-x-1">
                      {editingCustomer === customer.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
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
                            className="h-8 w-8 p-0"
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
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
