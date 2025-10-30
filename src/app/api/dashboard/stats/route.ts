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

    const userId = decoded.id;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all stats in parallel for better performance
    const [
      totalCustomers,
      customersWithAdvance,
      totalSales,
      todaySales,
      salesRevenue,
      todaySalesRevenue,
      duesData,
      advanceStats,
      todayAdvanceStats,
    ] = await Promise.all([
      // Total customers
      db.customer.count({
        where: { userId },
      }),

      // Customers with advance balance
      db.customer.count({
        where: {
          userId,
          advanceBalance: { gt: 0 },
        },
      }),

      // Total sales count
      db.sale.count({
        where: { userId },
      }),

      // Today's sales count
      db.sale.count({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // Sales revenue data
      db.sale.aggregate({
        where: { userId },
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),

      // Today's sales revenue
      db.sale.aggregate({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),

      // Dues data
      db.sale.aggregate({
        where: {
          userId,
          dueAmount: { gt: 0 },
        },
        _sum: {
          dueAmount: true,
        },
        _count: {
          id: true,
        },
      }),

      // Total advance statistics
      db.customer.aggregate({
        where: { userId },
        _sum: {
          advanceBalance: true,
        },
      }),

      // Today's advance transactions
      db.advancePayment.aggregate({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Calculate total advance
    const totalAdvance = advanceStats._sum.advanceBalance || 0;

    // Calculate today's advance added and used
    const todayAdvanceTransactions = await db.advancePayment.findMany({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        amount: true,
        type: true,
      },
    });

    const todayAdvanceAdded = todayAdvanceTransactions
      .filter((t) => t.type === "ADVANCE_ADDED" || t.type === "ADVANCE_PAYMENT")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const todayAdvanceUsed = Math.abs(
      todayAdvanceTransactions
        .filter((t) => t.type === "ADVANCE_USED")
        .reduce((sum, t) => sum + (t.amount || 0), 0)
    );

    const stats = {
      totalCustomers,
      customersWithAdvance,
      totalSales,
      totalRevenue: salesRevenue._sum.totalAmount || 0,
      totalDues: duesData._sum.dueAmount || 0,
      todaySales,
      todayRevenue: todaySalesRevenue._sum.totalAmount || 0,
      pendingDues: duesData._count.id || 0,
      // NEW: Advance statistics
      totalAdvance,
      todayAdvanceAdded,
      todayAdvanceUsed,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
