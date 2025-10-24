import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
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

    // Get total customers
    const totalCustomers = await db.customer.count({
      where: { userId },
    });

    // Get total sales
    const totalSales = await db.sale.count({
      where: { userId },
    });

    // Get total revenue
    const salesRevenue = await db.sale.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
    });

    // Get total dues
    const duesData = await db.sale.aggregate({
      where: {
        userId,
        OR: [{ status: "pending" }, { status: "partial" }],
      },
      _sum: { dueAmount: true },
    });

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await db.sale.count({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get today's revenue
    const todayRevenue = await db.sale.aggregate({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: { totalAmount: true },
    });

    // Get pending dues count
    const pendingDues = await db.sale.count({
      where: {
        userId,
        OR: [{ status: "pending" }, { status: "partial" }],
      },
    });

    const stats = {
      totalCustomers,
      totalSales,
      totalRevenue: salesRevenue._sum.totalAmount || 0,
      totalDues: duesData._sum.dueAmount || 0,
      todaySales,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      pendingDues,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
