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

    // Fetch recent sales (last 20)
    const recentSales = await db.sale.findMany({
      where: { userId },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Fetch recent advance transactions (last 20)
    const recentAdvances = await db.advancePayment.findMany({
      where: { userId },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        sale: {
          select: {
            invoiceNo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Fetch recent payments (last 20)
    const recentPayments = await db.payment.findMany({
      where: { userId },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        sale: {
          select: {
            invoiceNo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Combine and format activities
    const activities = [];

    // Add sales activities
    for (const sale of recentSales) {
      activities.push({
        id: `sale-${sale.id}`,
        type: "sale" as const,
        title: `New Sale - ${sale.invoiceNo}`,
        description: `Sale created for ${sale.customer.name}`,
        amount: sale.totalAmount,
        timestamp: sale.createdAt,
        customerName: sale.customer.name,
      });
    }

    // Add advance activities
    for (const advance of recentAdvances) {
      const isAddition =
        advance.type === "ADVANCE_ADDED" || advance.type === "ADVANCE_PAYMENT";
      const typeLabel = isAddition ? "Added" : "Used";
      const saleRef = advance.sale ? ` (Sale: ${advance.sale.invoiceNo})` : "";

      activities.push({
        id: `advance-${advance.id}`,
        type: "advance" as const,
        title: `Advance ${typeLabel}`,
        description: `${advance.description}${saleRef}`,
        amount: Math.abs(advance.amount),
        timestamp: advance.createdAt,
        customerName: advance.customer.name,
      });
    }

    // Add payment activities
    for (const payment of recentPayments) {
      activities.push({
        id: `payment-${payment.id}`,
        type: "payment" as const,
        title: `Payment Received`,
        description: `Payment for ${payment.sale?.invoiceNo || "sale"}`,
        amount: payment.amount,
        timestamp: payment.createdAt,
        customerName: payment.customer.name,
      });
    }

    // Sort all activities by timestamp (newest first) and take top 15
    const sortedActivities = activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 15);

    return NextResponse.json({
      activities: sortedActivities,
    });
  } catch (error: any) {
    console.error("Dashboard activity fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}
