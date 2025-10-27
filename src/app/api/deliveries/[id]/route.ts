import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { deliveryStatus, statusHistory } = body;

    if (!deliveryStatus) {
      return NextResponse.json(
        { error: "Delivery status is required" },
        { status: 400 }
      );
    }

    console.log(
      `Updating sale ${params.id} delivery status to:`,
      deliveryStatus
    );

    // Update the sale's delivery status in the database
    const updatedSale = await db.sale.update({
      where: {
        id: params.id,
        userId: decoded.id, // Ensure user owns this sale
      },
      data: {
        deliveryStatus,
        // You can also update status history if needed
        // deliveryStatusHistory: statusHistory || undefined
      },
      include: {
        customer: true,
      },
    });

    console.log(
      "Successfully updated delivery status:",
      updatedSale.deliveryStatus
    );

    return NextResponse.json({
      success: true,
      deliveryStatus: updatedSale.deliveryStatus,
    });
  } catch (error: any) {
    console.error("Failed to update delivery status:", error);

    // Check if it's a "record not found" error
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Sale not found or you don't have permission" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update delivery status" },
      { status: 500 }
    );
  }
}
