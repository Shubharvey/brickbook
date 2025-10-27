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

    // Fetch sales that have delivery information and are not delivered
    const sales = await db.sale.findMany({
      where: {
        userId: decoded.id,
        // Only show sales that have delivery info and are not delivered
        OR: [
          { deliveryStatus: "pending" },
          { deliveryStatus: "scheduled" },
          { deliveryStatus: "partial" },
        ],
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform sales data into delivery format
    const deliveries = sales.map((sale: any) => ({
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
    }));

    return NextResponse.json(deliveries);
  } catch (error) {
    console.error("Failed to fetch deliveries:", error);
    return NextResponse.json([]); // Return empty array on error
  }
}
