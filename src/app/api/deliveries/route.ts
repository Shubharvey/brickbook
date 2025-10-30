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

    // Fetch ALL sales that have delivery information (including delivered ones)
    const sales = await db.sale.findMany({
      where: {
        userId: decoded.id,
        // Remove the status filter to get ALL delivery statuses including delivered
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Fetched ${sales.length} sales for user ${decoded.id}`);

    // Transform sales data into delivery format
    const deliveries = sales.map((sale: any) => {
      // Log each sale's delivery status for debugging
      console.log(
        `Sale ${sale.id}: ${sale.deliveryStatus}, Customer: ${sale.customer?.name}`
      );

      return {
        id: sale.id,
        saleId: sale.id,
        customerName: sale.customer?.name || "Unknown Customer",
        customerPhone: sale.customer?.phone || "No phone",
        deliveryAddress: sale.deliveryAddress || null,
        items: sale.items || [],
        totalAmount: sale.totalAmount || 0,
        deliveryDate: sale.deliveryDate || null,
        deliveryStatus: sale.deliveryStatus || "pending",
        saleDate: sale.saleDate || sale.createdAt,
        statusHistory: [
          {
            status: sale.deliveryStatus || "pending",
            timestamp: sale.saleDate || sale.createdAt,
            changedBy: "system",
          },
        ],
        notes: sale.deliveryNotes || sale.notes || null,
      };
    });

    // Log delivery status counts for debugging
    const statusCounts = deliveries.reduce((acc: any, delivery) => {
      acc[delivery.deliveryStatus] = (acc[delivery.deliveryStatus] || 0) + 1;
      return acc;
    }, {});

    console.log("Delivery status counts:", statusCounts);

    return NextResponse.json(deliveries);
  } catch (error) {
    console.error("Failed to fetch deliveries:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliveries" },
      { status: 500 }
    );
  }
}
