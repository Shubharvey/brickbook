"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  Calendar,
  Download,
} from "lucide-react";

interface SalesReportData {
  kpis: {
    totalSales: number;
    totalOrders: number;
    totalBricks: number;
    aov: number;
    profitMargin: number;
  };
  trends: any[];
  productSales: any[];
  customerSales: any[];
  period: {
    start: string;
    end: string;
  };
  rawData: any[];
}

interface DetailModalState {
  open: boolean;
  type: string | null;
}

export default function SalesReport() {
  const { token } = useAuth();
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    open: false,
    type: null,
  });

  useEffect(() => {
    if (token) {
      fetchSalesReport();
    }
  }, [token, period]);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);

      console.log(
        "Fetching sales report with token:",
        token ? "Found" : "Not found"
      );

      if (!token) {
        console.error("No authentication token available");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/reports/sales?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API Response status:", response.status);

      if (response.ok) {
        const reportData = await response.json();
        console.log("Sales report data received:", reportData);
        setData(reportData);
      } else {
        console.error(
          "API returned error:",
          response.status,
          response.statusText
        );
        const errorData = await response.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch sales report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (type: string) => {
    setDetailModal({ open: true, type });
  };

  const getModalData = (type: string | null) => {
    if (!data) return null;

    switch (type) {
      case "customers":
        return data.customerSales;
      case "products":
        return data.productSales;
      case "sales":
        return { kpis: data.kpis, trends: data.trends };
      case "orders":
        return data.rawData;
      case "profit":
        return data.kpis;
      case "bricks":
        return {
          bricks: data.kpis.totalBricks,
          productSales: data.productSales,
        };
      default:
        return null;
    }
  };

  if (loading) {
    return <SalesReportSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load sales report</p>
        <Button onClick={fetchSalesReport} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const { kpis, trends, productSales, customerSales } = data;

  return (
    <div className="space-y-6 p-4">
      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Report</h2>
          <p className="text-gray-600 text-sm">
            {new Date(data.period.start).toLocaleDateString()} -{" "}
            {new Date(data.period.end).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
          <Button variant="outline" className="whitespace-nowrap">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClickableKPICard
          title="Total Sales"
          value={kpis.totalSales}
          format="currency"
          icon={DollarSign}
          description="Total revenue generated"
          trend={12.5}
          onClick={() => handleCardClick("sales")}
        />
        <ClickableKPICard
          title="Total Orders"
          value={kpis.totalOrders}
          format="number"
          icon={ShoppingCart}
          description="Number of transactions"
          trend={8.2}
          onClick={() => handleCardClick("orders")}
        />
        <ClickableKPICard
          title="Avg Order Value"
          value={kpis.aov}
          format="currency"
          icon={TrendingUp}
          description="Average revenue per order"
          trend={4.1}
          onClick={() => handleCardClick("aov")}
        />
        <ClickableKPICard
          title="Bricks Sold"
          value={kpis.totalBricks}
          format="number"
          icon={Package}
          description="Total units sold"
          trend={15.7}
          onClick={() => handleCardClick("bricks")}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ClickableKPICard
          title="Profit Margin"
          value={kpis.profitMargin}
          format="percentage"
          icon={TrendingUp}
          description="Gross profit percentage"
          trend={2.3}
          onClick={() => handleCardClick("profit")}
        />
        <ClickableKPICard
          title="Top Customers"
          value={customerSales.length}
          format="number"
          icon={Users}
          description="Active buyers in period"
          trend={5.6}
          onClick={() => handleCardClick("customers")}
        />
        <ClickableKPICard
          title="Products Sold"
          value={productSales.length}
          format="number"
          icon={Package}
          description="Unique products sold"
          trend={3.4}
          onClick={() => handleCardClick("products")}
        />
      </div>

      {/* Performance Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <SummaryItem
              value={`₹${kpis.totalSales.toLocaleString()}`}
              label="Revenue"
              color="text-green-600"
            />
            <SummaryItem
              value={kpis.totalOrders.toString()}
              label="Orders"
              color="text-blue-600"
            />
            <SummaryItem
              value={kpis.totalBricks.toLocaleString()}
              label="Bricks Sold"
              color="text-purple-600"
            />
            <SummaryItem
              value={`${kpis.profitMargin.toFixed(1)}%`}
              label="Margin"
              color="text-orange-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Top 5 Customers
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCardClick("customers")}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerSales.slice(0, 5).map((customer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {customer.orders} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{customer.totalSpent.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Last: {new Date(customer.lastOrder).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Top Selling Products
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCardClick("products")}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productSales.slice(0, 5).map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.quantity.toLocaleString()} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{product.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {product.orders} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal for detailed views */}
      <DetailModal
        isOpen={detailModal.open}
        type={detailModal.type}
        data={getModalData(detailModal.type)}
        onClose={() => setDetailModal({ open: false, type: null })}
      />
    </div>
  );
}

interface ClickableKPICardProps {
  title: string;
  value: number;
  format: "currency" | "number" | "percentage";
  icon: any;
  description: string;
  trend: number;
  onClick: () => void;
}

function ClickableKPICard({
  title,
  value,
  format,
  icon: Icon,
  description,
  trend,
  onClick,
}: ClickableKPICardProps) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case "currency":
        return `₹${val.toLocaleString()}`;
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "number":
        return val.toLocaleString();
      default:
        return val.toString();
    }
  };

  return (
    <Card
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(value, format)}
              </p>
            </div>
          </div>
          <div
            className={`text-right ${
              trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            <p className="text-sm font-medium">
              {trend >= 0 ? "↗" : "↘"} {trend >= 0 ? "+" : ""}
              {trend}%
            </p>
            <p className="text-xs text-gray-500">vs last period</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">{description}</p>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function DetailModal({
  isOpen,
  type,
  data,
  onClose,
}: {
  isOpen: boolean;
  type: string | null;
  data: any;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case "customers":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              All Customers ({data?.length || 0})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data?.map((customer: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-green-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {customer.orders} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      ₹{customer.totalSpent.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Last: {new Date(customer.lastOrder).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "products":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              All Products ({data?.length || 0})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data?.map((product: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.quantity.toLocaleString()} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      ₹{product.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {product.orders} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "sales":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sales Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{data.kpis.totalSales.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{data.kpis.aov.toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Sales Trend</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.trends.map((trend: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 border-b"
                  >
                    <span className="text-sm font-medium">{trend.date}</span>
                    <span className="font-semibold">
                      ₹{trend.sales.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "profit":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profit Analysis</h3>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className="text-3xl font-bold text-orange-600">
                {data.profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                This represents the gross profit margin based on your sales
                data.
              </p>
            </div>
          </div>
        );

      case "bricks":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Bricks Sold: {data.bricks.toLocaleString()}
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.productSales.map((product: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="font-semibold">
                    {product.quantity.toLocaleString()} units
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Detailed view for {type}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {type === "customers" && "All Customers"}
            {type === "products" && "All Products"}
            {type === "sales" && "Sales Details"}
            {type === "profit" && "Profit Analysis"}
            {type === "bricks" && "Bricks Sold Details"}
            {type === "orders" && "Order Details"}
          </h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            ✕
          </Button>
        </div>
        <div className="p-6">
          {data ? (
            renderContent()
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SalesReportSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
