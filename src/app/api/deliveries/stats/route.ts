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

    // Fetch sales with delivery status counts
    const sales = await db.sale.findMany({
      where: {
        userId: decoded.id,
        // Only count active delivery statuses
        OR: [
          { deliveryStatus: "pending" },
          { deliveryStatus: "scheduled" },
          { deliveryStatus: "partial" },
        ],
      },
      select: {
        deliveryStatus: true,
      },
    });

    // Calculate real stats from actual sales data
    const pendingCount = sales.filter(
      (s) => s.deliveryStatus === "pending"
    ).length;
    const scheduledCount = sales.filter(
      (s) => s.deliveryStatus === "scheduled"
    ).length;

    // Total notifications = pending + scheduled
    const totalNotifications = pendingCount + scheduledCount;

    const stats = {
      pendingCount,
      scheduledCount,
      totalNotifications,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch delivery stats:", error);
    return NextResponse.json({
      pendingCount: 0,
      scheduledCount: 0,
      totalNotifications: 0,
    });
  }
}
