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
  // Get all payments within date range
  const payments = await db.payment.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    include: {
      sale: {
        include: {
          customer: true,
          payments: true, // Include all payments for this sale
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // ✅ FIXED: Get ALL sales (not filtered by date) to calculate accurate dues
  // We need all sales to properly calculate pending dues, even if they're from previous periods
  const allSalesWithDues = await db.sale.findMany({
    where: {
      userId: userId,
      // Only include sales that have actual dues
      OR: [
        { dueAmount: { gt: 0 } },
        { status: "pending" },
        { status: "partial" },
      ],
    },
    include: {
      payments: true,
      customer: true,
    },
  });

  // Calculate advanced payment metrics
  const paymentMetrics = calculatePaymentMetrics(payments, allSalesWithDues);
  const dueAnalysis = analyzeDues(allSalesWithDues);
  const cashFlowTrends = await getCashFlowTrends(userId, dateRange);
  const topDues = identifyTopDues(allSalesWithDues);

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

  // ✅ FIXED: Calculate pending dues from ALL sales with actual dues
  const pendingDues = sales.reduce((sum, sale) => {
    // Use the dueAmount field directly from the database
    // This is the most reliable since it's calculated during sale creation
    return sum + sale.dueAmount;
  }, 0);

  // ✅ FIXED: Calculate advance payments correctly
  const advancePayments = payments
    .filter((p) => {
      // Payments without sales are advances
      if (!p.saleId) return true;

      // If payment has sale, check if it's an advance payment
      const sale = sales.find((s) => s.id === p.saleId);
      if (!sale) return true;

      return false;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Collection efficiency (collected vs total amount that should be collected)
  const totalAmountToCollect = sales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const totalCollected = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  const collectionEfficiency =
    totalAmountToCollect > 0
      ? (totalCollected / totalAmountToCollect) * 100
      : 0;

  // Average collection days (only for paid/partially paid sales with payments)
  const avgCollectionDays = calculateAverageCollectionDays(sales);

  // Net cash flow (collections minus advances)
  const cashFlow = totalCollections - advancePayments;

  return {
    totalCollections,
    pendingDues,
    advancePayments,
    collectionEfficiency: Math.round(collectionEfficiency * 100) / 100, // Round to 2 decimal places
    avgCollectionDays,
    cashFlow,
  };
}

function calculateAverageCollectionDays(sales: any[]) {
  let totalDays = 0;
  let count = 0;

  sales.forEach((sale) => {
    // Only consider sales that have payments and are paid/partial
    if (
      sale.payments.length > 0 &&
      (sale.status === "paid" || sale.status === "partial")
    ) {
      const firstPayment = sale.payments.reduce(
        (earliest: any, payment: any) => {
          return !earliest ||
            new Date(payment.createdAt) < new Date(earliest.createdAt)
            ? payment
            : earliest;
        },
        null
      );

      if (firstPayment) {
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        const paymentDate = new Date(firstPayment.createdAt);
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
      // Skip sales without dues
      if (sale.dueAmount <= 0) return false;

      const saleDate = new Date(sale.saleDate || sale.createdAt);
      const daysSinceSale = Math.floor(
        (new Date().getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (period.period === "Current") {
        return daysSinceSale <= 0;
      } else {
        const prevPeriodMax =
          duePeriods[duePeriods.indexOf(period) - 1]?.maxDays || 0;
        return daysSinceSale > prevPeriodMax && daysSinceSale <= period.maxDays;
      }
    });

    const totalAmount = dueSales.reduce((sum, sale) => sum + sale.dueAmount, 0);

    const avgDelay =
      dueSales.length > 0
        ? dueSales.reduce((sum, sale) => {
            const saleDate = new Date(sale.saleDate || sale.createdAt);
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
      // Skip sales without dues
      if (sale.dueAmount <= 0) return null;

      const saleDate = new Date(sale.saleDate || sale.createdAt);
      const daysSinceSale = Math.floor(
        (new Date().getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let status: "overdue" | "due_soon" | "paid" = "due_soon";
      if (daysSinceSale > 30) status = "overdue";
      if (sale.dueAmount === 0) status = "paid";

      return {
        id: sale.id,
        customerName: sale.customer?.name || "Unknown Customer",
        amount: sale.dueAmount, // Use the direct dueAmount field
        dueDate: sale.dueDate || sale.saleDate || sale.createdAt,
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
    const method = payment.method || "Unknown";
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
  // Get actual payment data for cash flow trends
  const payments = await db.payment.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: new Date(dateRange.start.getFullYear(), 0, 1), // Start of year
        lte: dateRange.end,
      },
    },
    select: {
      amount: true,
      createdAt: true,
      method: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by month for trends
  const monthlyData = new Map();

  payments.forEach((payment) => {
    const month = payment.createdAt.toLocaleString("default", {
      month: "short",
    });
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { incoming: 0, outgoing: 0, netFlow: 0 });
    }

    const data = monthlyData.get(month);
    data.incoming += payment.amount;
    data.netFlow += payment.amount;
  });

  // Convert to array format
  const cashFlowTrends = Array.from(monthlyData.entries()).map(
    ([period, data]) => ({
      period,
      incoming: data.incoming,
      outgoing: data.outgoing,
      netFlow: data.netFlow,
    })
  );

  return cashFlowTrends.length > 0
    ? cashFlowTrends
    : [
        { period: "Jan", incoming: 0, outgoing: 0, netFlow: 0 },
        { period: "Feb", incoming: 0, outgoing: 0, netFlow: 0 },
        { period: "Mar", incoming: 0, outgoing: 0, netFlow: 0 },
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
