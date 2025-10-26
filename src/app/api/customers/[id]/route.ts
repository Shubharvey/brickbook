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

    const customerId = params.id;

    // Get customer's sales
    const sales = await db.sale.findMany({
      where: {
        customerId: customerId,
        userId: decoded.id,
      },
      orderBy: { createdAt: "desc" },
      take: 10, // Get recent 10 purchases
    });

    // Calculate statistics
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const dueAmount = totalAmount - totalPaid;

    // Format recent purchases
    const recentPurchases = sales.map((sale) => ({
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      items: sale.items as any[],
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      createdAt: sale.createdAt.toISOString(),
    }));

    const stats = {
      totalSales,
      totalAmount,
      dueAmount,
      purchaseCount: totalSales,
      recentPurchases,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Customer stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer statistics" },
      { status: 500 }
    );
  }
}
