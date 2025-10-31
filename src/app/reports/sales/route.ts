import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly"; // daily, weekly, monthly, yearly
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range based on period
    const dateRange = getDateRange(period, startDate, endDate);

    // Fetch sales data with filters
    const sales = await db.sale.findMany({
      where: {
        userId: decoded.id,
        saleDate: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        customer: true,
      },
      orderBy: { saleDate: "asc" },
    });

    // Calculate KPIs
    const kpis = calculateKPIs(sales);
    const trends = calculateTrends(sales, period);
    const productSales = calculateProductSales(sales);
    const customerSales = calculateCustomerSales(sales);

    return NextResponse.json({
      kpis,
      trends,
      productSales,
      customerSales,
      period: dateRange,
      rawData: sales, // For detailed tables
    });
  } catch (error: any) {
    console.error("Sales report error:", error);
    return NextResponse.json(
      { error: "Failed to generate sales report" },
      { status: 500 }
    );
  }
}

function getDateRange(
  period: string,
  startDate?: string | null,
  endDate?: string | null
) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (startDate && endDate) {
    return {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  }

  switch (period) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      start.setDate(now.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(now.getMonth() - 1);
      break;
    case "yearly":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  return { start, end };
}

function calculateKPIs(sales: any[]) {
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalOrders = sales.length;
  const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);

  // Calculate total bricks sold from items array
  const totalBricks = sales.reduce((sum, sale) => {
    const saleBricks = sale.items.reduce(
      (itemSum: number, item: any) => itemSum + (item.quantity || 0),
      0
    );
    return sum + saleBricks;
  }, 0);

  const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
  const profitMargin = calculateProfitMargin(sales);

  return {
    totalSales,
    totalOrders,
    totalPaid,
    totalBricks,
    aov,
    profitMargin,
    conversionRate: 0, // You might track this separately
  };
}

function calculateTrends(sales: any[], period: string) {
  // Group sales by time period for trend analysis
  const trends = sales.reduce((acc: any, sale) => {
    const dateKey = getDateKey(sale.saleDate, period);
    if (!acc[dateKey]) {
      acc[dateKey] = { sales: 0, orders: 0, bricks: 0 };
    }
    acc[dateKey].sales += sale.totalAmount;
    acc[dateKey].orders += 1;
    acc[dateKey].bricks += sale.items.reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0
    );
    return acc;
  }, {});

  return Object.entries(trends).map(([date, data]: [string, any]) => ({
    date,
    ...data,
  }));
}

function calculateProductSales(sales: any[]) {
  const productMap = new Map();

  sales.forEach((sale) => {
    sale.items.forEach((item: any) => {
      const productName = item.name || item.product || "Unknown Product";
      if (!productMap.has(productName)) {
        productMap.set(productName, {
          name: productName,
          quantity: 0,
          revenue: 0,
          orders: 0,
        });
      }
      const product = productMap.get(productName);
      product.quantity += item.quantity || 0;
      product.revenue += (item.price || 0) * (item.quantity || 0);
      product.orders += 1;
    });
  });

  return Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
}

function calculateCustomerSales(sales: any[]) {
  const customerMap = new Map();

  sales.forEach((sale) => {
    const customerName = sale.customer?.name || "Unknown Customer";
    if (!customerMap.has(customerName)) {
      customerMap.set(customerName, {
        name: customerName,
        orders: 0,
        totalSpent: 0,
        lastOrder: sale.saleDate,
      });
    }
    const customer = customerMap.get(customerName);
    customer.orders += 1;
    customer.totalSpent += sale.totalAmount;
    if (new Date(sale.saleDate) > new Date(customer.lastOrder)) {
      customer.lastOrder = sale.saleDate;
    }
  });

  return Array.from(customerMap.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent
  );
}

function calculateProfitMargin(sales: any[]): number {
  // You'll need to implement this based on your cost data
  // For now, returning a placeholder calculation
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const estimatedCost = totalRevenue * 0.7; // Assuming 30% margin
  const profit = totalRevenue - estimatedCost;
  return totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
}

function getDateKey(date: Date, period: string): string {
  const d = new Date(date);
  switch (period) {
    case "daily":
      return d.toISOString().split("T")[0]; // YYYY-MM-DD
    case "weekly":
      return `Week ${Math.ceil(d.getDate() / 7)}`;
    case "monthly":
      return d.toLocaleString("default", { month: "short", year: "numeric" });
    case "yearly":
      return d.getFullYear().toString();
    default:
      return d.toISOString().split("T")[0];
  }
}
