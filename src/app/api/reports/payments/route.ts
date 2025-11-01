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
    const period = searchParams.get("period") || "monthly";

    // Calculate date range based on period
    const dateRange = getDateRange(period);

    // Fetch payment data with advanced analytics
    const paymentData = await generatePaymentIntelligence(
      decoded.id,
      dateRange
    );

    return NextResponse.json(paymentData);
  } catch (error: any) {
    console.error("Payment report error:", error);
    return NextResponse.json(
      { error: "Failed to generate payment intelligence report" },
      { status: 500 }
    );
  }
}

async function generatePaymentIntelligence(
  userId: string,
  dateRange: { start: Date; end: Date }
) {
  // Get all payments with related data
  const payments = await db.payment.findMany({
    where: {
      userId: userId,
      paymentDate: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    include: {
      sale: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });

  // Get all sales to calculate dues
  const sales = await db.sale.findMany({
    where: {
      userId: userId,
      saleDate: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    include: {
      payments: true,
      customer: true,
    },
  });

  // Calculate advanced payment metrics
  const paymentMetrics = calculatePaymentMetrics(payments, sales);
  const dueAnalysis = analyzeDues(sales);
  const cashFlowTrends = await getCashFlowTrends(userId, dateRange);
  const topDues = identifyTopDues(sales);

  return {
    summary: paymentMetrics,
    paymentMethods: analyzePaymentMethods(payments),
    dueAnalysis,
    topDues,
    cashFlowTrends,
    period: dateRange,
  };
}

function calculatePaymentMetrics(payments: any[], sales: any[]) {
  const totalCollections = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Calculate pending dues
  const pendingDues = sales.reduce((sum, sale) => {
    const paidAmount = sale.payments.reduce(
      (paid: number, payment: any) => paid + payment.amount,
      0
    );
    return sum + Math.max(0, sale.totalAmount - paidAmount);
  }, 0);

  // Calculate advance payments (payments without linked sales or exceeding sale amount)
  const advancePayments = payments
    .filter((p) => !p.saleId || p.amount > (p.sale?.totalAmount || 0))
    .reduce((sum, p) => sum + p.amount, 0);

  // Collection efficiency (collected vs total invoiced)
  const totalInvoiced = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const collectionEfficiency =
    totalInvoiced > 0 ? (totalCollections / totalInvoiced) * 100 : 0;

  // Average collection days (simplified)
  const avgCollectionDays = calculateAverageCollectionDays(sales);

  // Net cash flow
  const cashFlow = totalCollections - advancePayments; // Simplified

  return {
    totalCollections,
    pendingDues,
    advancePayments,
    collectionEfficiency,
    avgCollectionDays,
    cashFlow,
  };
}

function calculateAverageCollectionDays(sales: any[]) {
  let totalDays = 0;
  let count = 0;

  sales.forEach((sale) => {
    if (sale.payments.length > 0) {
      const firstPayment = sale.payments.reduce(
        (earliest: any, payment: any) => {
          return !earliest ||
            new Date(payment.paymentDate) < new Date(earliest.paymentDate)
            ? payment
            : earliest;
        },
        null
      );

      if (firstPayment) {
        const saleDate = new Date(sale.saleDate);
        const paymentDate = new Date(firstPayment.paymentDate);
        const daysDiff = Math.floor(
          (paymentDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += Math.max(0, daysDiff);
        count++;
      }
    }
  });

  return count > 0 ? Math.round(totalDays / count) : 0;
}

function analyzeDues(sales: any[]) {
  const duePeriods = [
    { period: "Current", maxDays: 0 },
    { period: "1-30 days", maxDays: 30 },
    { period: "31-60 days", maxDays: 60 },
    { period: "60+ days", maxDays: Infinity },
  ];

  return duePeriods.map((period) => {
    const dueSales = sales.filter((sale) => {
      const paidAmount = sale.payments.reduce(
        (paid: number, payment: any) => paid + payment.amount,
        0
      );
      const dueAmount = sale.totalAmount - paidAmount;

      if (dueAmount <= 0) return false;

      const saleDate = new Date(sale.saleDate);
      const daysSinceSale = Math.floor(
        (new Date().getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (period.period === "Current") {
        return daysSinceSale <= 0;
      } else {
        return (
          daysSinceSale >
            (duePeriods[duePeriods.indexOf(period) - 1]?.maxDays || 0) &&
          daysSinceSale <= period.maxDays
        );
      }
    });

    const totalAmount = dueSales.reduce((sum, sale) => {
      const paidAmount = sale.payments.reduce(
        (paid: number, payment: any) => paid + payment.amount,
        0
      );
      return sum + (sale.totalAmount - paidAmount);
    }, 0);

    const avgDelay =
      dueSales.length > 0
        ? dueSales.reduce((sum, sale) => {
            const saleDate = new Date(sale.saleDate);
            const daysSinceSale = Math.floor(
              (new Date().getTime() - saleDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + daysSinceSale;
          }, 0) / dueSales.length
        : 0;

    return {
      period: period.period,
      amount: totalAmount,
      customers: dueSales.length,
      avgDelay: Math.round(avgDelay),
    };
  });
}

function identifyTopDues(sales: any[]) {
  return sales
    .map((sale) => {
      const paidAmount = sale.payments.reduce(
        (paid: number, payment: any) => paid + payment.amount,
        0
      );
      const dueAmount = sale.totalAmount - paidAmount;

      if (dueAmount <= 0) return null;

      const saleDate = new Date(sale.saleDate);
      const daysSinceSale = Math.floor(
        (new Date().getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let status: "overdue" | "due_soon" | "paid" = "due_soon";
      if (daysSinceSale > 30) status = "overdue";
      if (dueAmount === 0) status = "paid";

      return {
        id: sale.id,
        customerName: sale.customer?.name || "Unknown Customer",
        amount: dueAmount,
        dueDate: sale.saleDate,
        daysOverdue: Math.max(0, daysSinceSale),
        contact: sale.customer?.phone || "N/A",
        status,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 10);
}

function analyzePaymentMethods(payments: any[]) {
  const methodMap = new Map();

  payments.forEach((payment) => {
    const method = payment.paymentMethod || "Unknown";
    if (!methodMap.has(method)) {
      methodMap.set(method, { count: 0, amount: 0 });
    }
    const data = methodMap.get(method);
    data.count++;
    data.amount += payment.amount;
  });

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return Array.from(methodMap.entries()).map(
    ([method, data]: [string, any]) => ({
      method,
      count: data.count,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    })
  );
}

async function getCashFlowTrends(
  userId: string,
  dateRange: { start: Date; end: Date }
) {
  // This would query your database for historical cash flow data
  // For now, returning mock data structure
  return [
    { period: "Jan", incoming: 185000, outgoing: 145000, netFlow: 40000 },
    { period: "Feb", incoming: 210000, outgoing: 168000, netFlow: 42000 },
    { period: "Mar", incoming: 198000, outgoing: 172000, netFlow: 26000 },
    { period: "Apr", incoming: 235000, outgoing: 189000, netFlow: 46000 },
    { period: "May", incoming: 252000, outgoing: 201000, netFlow: 51000 },
    { period: "Jun", incoming: 265000, outgoing: 208000, netFlow: 57000 },
  ];
}

// Helper function
function getDateRange(period: string) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (period) {
    case "weekly":
      start.setDate(now.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(now.getMonth() - 1);
      break;
    case "quarterly":
      start.setMonth(now.getMonth() - 3);
      break;
    case "yearly":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  return { start, end };
}
