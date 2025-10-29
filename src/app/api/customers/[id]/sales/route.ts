import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
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

    // Fetch customer sales with payments
    const sales = await db.sale.findMany({
      where: {
        customerId: params.id,
        userId: decoded.id,
      },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform sales data with proper item structure
    const transformedSales = sales.map((sale) => {
      // Parse items if they're stored as JSON string
      let items = [];
      try {
        if (typeof sale.items === "string") {
          items = JSON.parse(sale.items);
        } else if (Array.isArray(sale.items)) {
          items = sale.items;
        }
      } catch (error) {
        console.error("Error parsing sale items:", error);
        items = [];
      }

      return {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        items: items, // This now contains proper brick types, quantities, and pricing
        totalAmount: sale.totalAmount,
        paidAmount: sale.paidAmount,
        dueAmount: sale.dueAmount,
        status: sale.status,
        paymentType: sale.paymentType,
        createdAt: sale.createdAt.toISOString(),
        saleDate: sale.saleDate?.toISOString() || sale.createdAt.toISOString(),
        notes: sale.notes,
        payments: sale.payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          referenceNumber: payment.referenceNumber,
          notes: payment.notes,
          createdAt: payment.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json(transformedSales);
  } catch (error) {
    console.error("Customer sales fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer sales" },
      { status: 500 }
    );
  }
}
