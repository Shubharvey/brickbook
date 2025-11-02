"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Zap,
  Star,
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

  // Animation states
  const [showSparkle, setShowSparkle] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
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
    if (balance > 50000)
      return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white";
    if (balance > 10000)
      return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
    if (balance > 0)
      return "bg-gradient-to-r from-cyan-400 to-sky-500 text-white";
    return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700";
  };

  const getDueBadgeVariant = (amount: number) => {
    if (amount > 50000)
      return "bg-gradient-to-r from-rose-500 to-pink-500 text-white";
    if (amount > 10000)
      return "bg-gradient-to-r from-orange-500 to-amber-500 text-white";
    if (amount > 0)
      return "bg-gradient-to-r from-amber-400 to-yellow-500 text-white";
    return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700";
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
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 2000);
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

  const handleEditCustomer = (customer: Customer, index: number) => {
    setEditingCustomer(customer.id);
    setEditForm({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setError(null);
    setHighlightIndex(index);
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
        setHighlightIndex(null);
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
    customerName: string,
    index: number
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
        setHighlightIndex(index);
        setTimeout(() => setHighlightIndex(null), 1000);
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
    setHighlightIndex(null);
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

  const handleImportContacts = async () => {
    try {
      setError(null);
      const contacts = await (navigator as any).contacts.select(
        ["name", "email", "tel", "address"],
        { multiple: true }
      );

      if (contacts && contacts.length > 0) {
        const formattedContacts: ContactData[] = contacts.map(
          (contact: any) => ({
            name: contact.name?.[0] || "Unknown Contact",
            phones: contact.tel || [],
            emails: contact.email || [],
            addresses: contact.address?.[0] ? [contact.address[0]] : [],
          })
        );

        setSelectedContacts(formattedContacts);
        setShowImportDialog(true);
      }
    } catch (error) {
      console.error("Error accessing contacts:", error);
      setError("Could not access contacts. Please check browser support.");
    }
  };

  const handleFileImport = () => {
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

  const handleBulkImport = async () => {
    if (selectedContacts.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < selectedContacts.length; i++) {
      const contact = selectedContacts[i];

      if (!contact.name || contact.name === "Unknown Contact") {
        skippedCount++;
        continue;
      }

      const isDuplicate = customers.some(
        (customer) =>
          customer.name.toLowerCase() === contact.name.toLowerCase() ||
          (contact.phones[0] && customer.phone === contact.phones[0])
      );

      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      try {
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: contact.name,
            phone: contact.phones[0] || undefined,
            email: contact.emails[0] || undefined,
            address: contact.addresses[0] || undefined,
          }),
        });

        if (response.ok) {
          importedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error("Failed to import contact:", error);
        skippedCount++;
      }

      setImportProgress(((i + 1) / selectedContacts.length) * 100);
    }

    setIsImporting(false);
    setShowImportDialog(false);
    setSelectedContacts([]);

    await fetchCustomers();

    let message = `Successfully imported ${importedCount} contacts`;
    if (skippedCount > 0) {
      message += ` (${skippedCount} skipped due to duplicates or errors)`;
    }
    setSuccess(message);
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

  // Sparkle effect component
  const SparkleEffect = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            y: [null, -100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 1.5,
            delay: Math.random() * 0.5,
          }}
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>
      ))}
    </div>
  );

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
      {/* Sparkle Animation */}
      <AnimatePresence>{showSparkle && <SparkleEffect />}</AnimatePresence>

      {/* Header with floating animation */}
      <motion.div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-1">
          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Customer Management
          </motion.h1>
          <motion.p
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Manage your customer relationships
          </motion.p>
        </div>
        <motion.div
          className="flex flex-col sm:flex-row gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            disabled={isSubmitting}
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Plus className="h-4 w-4 mr-2" />
            </motion.div>
            Add Customer
          </Button>
          <Button
            onClick={handleImportContacts}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow hover:shadow-md transition-all duration-300"
            disabled={isSubmitting}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Contacts
          </Button>
        </motion.div>
      </motion.div>

      {/* Wallet Summary Stats with staggered animation */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {[
          {
            icon: Wallet,
            label: "Total Advance",
            value: formatCurrency(walletStats.totalAdvance),
            color: "from-emerald-500 to-teal-500",
          },
          {
            icon: Users,
            label: "With Advance",
            value: walletStats.customersWithAdvance,
            color: "from-blue-500 to-cyan-500",
          },
          {
            icon: TrendingUp,
            label: "Highest Advance",
            value: formatCurrency(walletStats.highestAdvance),
            color: "from-purple-500 to-indigo-500",
          },
          {
            icon: TrendingDown,
            label: "Total Due",
            value: formatCurrency(walletStats.totalDue),
            color: "from-rose-500 to-pink-500",
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="min-h-[100px] border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 bg-gradient-to-r ${stat.color} rounded-lg shadow`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{stat.label}</p>
                    <p className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search with pulse animation */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search customers by name, phone, email, advance, or due amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
        {searchTerm && (
          <motion.div
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Zap className="h-4 w-4 text-amber-500" />
          </motion.div>
        )}
      </motion.div>

      {/* Success Message with floating animation */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Alert className="bg-emerald-50 border-emerald-200 shadow-lg">
              <AlertCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                {success}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message with shake animation */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 500, damping: 30 },
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Alert
              variant="destructive"
              className="bg-rose-50 border-rose-200 shadow-lg"
            >
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-rose-800">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Customer Form with slide-in animation */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">
                  Add New Customer
                </CardTitle>
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
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all duration-300"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer List with staggered animations */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border border-gray-200 shadow-sm">
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
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Customer
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            layout
          >
            <AnimatePresence>
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.05,
                    },
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                  className={`relative ${
                    highlightIndex === index ? "z-10" : ""
                  }`}
                >
                  <Card
                    className={`border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
                      ${
                        editingCustomer === customer.id
                          ? "ring-2 ring-blue-500 border-blue-500"
                          : ""
                      } ${
                      highlightIndex === index ? "ring-4 ring-yellow-400" : ""
                    }`}
                    onClick={() => handleCustomerClick(customer)}
                  >
                    {/* Loyalty indicator */}
                    {customer.loyaltyPoints && customer.loyaltyPoints > 100 && (
                      <motion.div
                        className="absolute top-2 right-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ rotate: 20 }}
                      >
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      </motion.div>
                    )}

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <motion.div
                            className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <Users className="h-5 w-5 text-blue-600" />
                          </motion.div>
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
                              {new Date(
                                customer.createdAt
                              ).toLocaleDateString()}
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
                                <span className="truncate">
                                  {customer.phone}
                                </span>
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                <span className="truncate">
                                  {customer.email}
                                </span>
                              </div>
                            )}
                            {customer.address && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                                <span className="truncate">
                                  {customer.address}
                                </span>
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
                                  handleEditCustomer(customer, index);
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
                                  handleDeleteCustomer(
                                    customer.id,
                                    customer.name,
                                    index
                                  );
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
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Contact Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Contact className="h-5 w-5 text-blue-600" />
              Import Contacts
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Select contacts to import. Duplicates will be skipped
              automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto space-y-3">
            {selectedContacts.map((contact, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Contact className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {contact.name}
                  </p>
                  {contact.phones[0] && (
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <Smartphone className="h-3 w-3" />
                      {contact.phones[0]}
                    </p>
                  )}
                  {contact.emails[0] && (
                    <p className="text-xs text-gray-600 truncate mt-1">
                      {contact.emails[0]}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setSelectedContacts([]);
              }}
              disabled={isImporting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={isImporting || selectedContacts.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isImporting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-4 w-4 mr-2"
                  >
                    <Zap className="h-4 w-4" />
                  </motion.div>
                  Importing... ({Math.round(importProgress)}%)
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {selectedContacts.length} Contacts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
