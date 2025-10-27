"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Archive,
  Calendar,
  Package,
  History,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface Delivery {
  id: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    city: string;
    district: string;
    pincode: string;
  } | null;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  totalAmount: number;
  deliveryDate: string | null;
  deliveryStatus: "pending" | "scheduled" | "delivered" | "partial";
  saleDate: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    changedBy: string;
  }>;
  notes?: string;
}

export default function DeliveryManagement() {
  const { token } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Load real deliveries data
  useEffect(() => {
    if (token) {
      fetchDeliveries();
    }
  }, [token]);

  // Filter deliveries based on search and status
  useEffect(() => {
    let filtered = deliveries;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (delivery) =>
          delivery.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          delivery.customerPhone.includes(searchTerm) ||
          delivery.items.some((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (delivery) => delivery.deliveryStatus === statusFilter
      );
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, searchTerm, statusFilter, selectedDate]);

  const fetchDeliveries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/deliveries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      } else {
        setDeliveries([]); // Empty array if no data
      }
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeliveryStatus = async (
    deliveryId: string,
    newStatus: Delivery["deliveryStatus"]
  ) => {
    try {
      console.log(`Updating delivery ${deliveryId} to status:`, newStatus);

      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deliveryStatus: newStatus,
          statusHistory: [
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              changedBy: "user",
            },
          ],
        }),
      });

      const result = await response.json();
      console.log("API Response:", response.status, result);

      if (response.ok) {
        console.log("Successfully updated delivery status:", result);

        // Update local state
        setDeliveries((prev) =>
          prev.map((delivery) =>
            delivery.id === deliveryId
              ? { ...delivery, deliveryStatus: newStatus }
              : delivery
          )
        );

        // Refresh the deliveries to ensure we have the latest data from database
        fetchDeliveries();
      } else {
        console.error("Failed to update delivery status:", result.error);
        alert(`Failed to update status: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to update delivery status:", error);
      alert("Failed to update delivery status. Please try again.");
    }
  };

  const archiveDeliveredOrders = async () => {
    try {
      const response = await fetch("/api/deliveries/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchDeliveries();
      }
    } catch (error) {
      console.error("Failed to archive orders:", error);
    }
  };

  const getStatusBadge = (status: Delivery["deliveryStatus"]) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, text: "Pending", icon: Clock },
      scheduled: {
        variant: "default" as const,
        text: "Scheduled",
        icon: Truck,
      },
      delivered: {
        variant: "default" as const,
        text: "Delivered",
        icon: CheckCircle,
      },
      partial: {
        variant: "outline" as const,
        text: "Partial",
        icon: AlertCircle,
      },
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  // Calculate dates for filtering
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getThreeDaysAgo = () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);
    return threeDaysAgo;
  };

  // Separate deliveries into sections
  const today = getToday();
  const threeDaysAgo = getThreeDaysAgo();

  // Active deliveries (all non-delivered orders regardless of date)
  const activeDeliveries = filteredDeliveries.filter(
    (d) => d.deliveryStatus !== "delivered"
  );

  // Upcoming deliveries (only future dates - not today)
  const upcomingDeliveries = deliveries.filter((d) => {
    if (!d.deliveryDate) return false;
    const deliveryDate = new Date(d.deliveryDate);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate > today; // Only future dates (not today)
  });

  // Recent delivered history (last 3 days)
  const recentDelivered = deliveries.filter((d) => {
    if (d.deliveryStatus !== "delivered") return false;
    if (!d.deliveryDate) return false;

    const deliveryDate = new Date(d.deliveryDate);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate >= threeDaysAgo && deliveryDate <= today;
  });

  // Stats for header badges
  const pendingCount = deliveries.filter(
    (d) => d.deliveryStatus === "pending"
  ).length;
  const scheduledCount = deliveries.filter(
    (d) => d.deliveryStatus === "scheduled"
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Delivery Management
          </h1>
          <p className="text-gray-600">Track and manage all your deliveries</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={archiveDeliveredOrders}
            className="flex items-center gap-2"
            disabled={recentDelivered.length === 0}
          >
            <Archive className="h-4 w-4" />
            Archive Delivered
          </Button>
          <Button onClick={fetchDeliveries} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {deliveries.length === 0 && !isLoading && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="h-10 w-10 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Deliveries Yet
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              When you create sales with delivery information, they will appear
              here for tracking.
              <br />
              You can update delivery status as orders progress from pending to
              delivered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Link href="/sales">Create Your First Sale</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/customers">View Customers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {deliveries.length > 0 && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search customer or items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Delivery Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quick Stats</Label>
                  <div className="flex gap-2 text-sm">
                    <Badge variant="secondary">{pendingCount} Pending</Badge>
                    <Badge>{scheduledCount} Scheduled</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deliveries Section - Only future dates (not today) */}
          {upcomingDeliveries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Deliveries (Future Dates)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingDeliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {delivery.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {delivery.customerPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {delivery.items.map((item, index) => (
                              <div key={index}>
                                {item.name} × {item.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {delivery.deliveryDate
                            ? new Date(
                                delivery.deliveryDate
                              ).toLocaleDateString()
                            : "Not set"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(delivery.deliveryStatus)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={delivery.deliveryStatus}
                            onValueChange={(
                              value: Delivery["deliveryStatus"]
                            ) => updateDeliveryStatus(delivery.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="scheduled">
                                Scheduled
                              </SelectItem>
                              <SelectItem value="delivered">
                                Delivered
                              </SelectItem>
                              <SelectItem value="partial">Partial</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Active Deliveries - All non-delivered orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Active Deliveries ({activeDeliveries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                  <p>No active deliveries - all orders are delivered!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDeliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {delivery.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {delivery.customerPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {delivery.deliveryAddress ? (
                            <div className="text-sm">
                              <div>{delivery.deliveryAddress.street}</div>
                              <div>
                                {delivery.deliveryAddress.city},{" "}
                                {delivery.deliveryAddress.district}
                              </div>
                              <div>{delivery.deliveryAddress.pincode}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No address</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {delivery.items.map((item, index) => (
                              <div key={index}>
                                {item.name} × {item.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{delivery.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {delivery.deliveryDate
                            ? new Date(
                                delivery.deliveryDate
                              ).toLocaleDateString()
                            : "Not set"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(delivery.deliveryStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Select
                              value={delivery.deliveryStatus}
                              onValueChange={(
                                value: Delivery["deliveryStatus"]
                              ) => updateDeliveryStatus(delivery.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="scheduled">
                                  Scheduled
                                </SelectItem>
                                <SelectItem value="delivered">
                                  Delivered
                                </SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Delivery History (Last 3 Days) */}
          {recentDelivered.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Delivery History (Last 3 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDelivered.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {delivery.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {delivery.customerPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {delivery.items.map((item, index) => (
                              <div key={index}>
                                {item.name} × {item.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {delivery.deliveryDate
                            ? new Date(
                                delivery.deliveryDate
                              ).toLocaleDateString()
                            : "Not set"}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{delivery.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(delivery.deliveryStatus)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
