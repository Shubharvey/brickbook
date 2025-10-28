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

    // Get customer's sales with payments
    const sales = await db.sale.findMany({
      where: {
        customerId: customerId,
        userId: decoded.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        payments: true,
      },
    });

    // Calculate statistics
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const dueAmount = totalAmount - totalPaid;

    // Calculate paid, pending, and partial sales
    const paidSales = sales.filter((sale) => sale.status === "paid");
    const pendingSales = sales.filter((sale) => sale.status === "pending");
    const partialSales = sales.filter((sale) => sale.status === "partial");

    // Format recent purchases with detailed payment info
    const recentPurchases = sales.map((sale) => {
      const totalPayments = sale.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      return {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        items: sale.items as any[],
        totalAmount: sale.totalAmount,
        paidAmount: totalPayments,
        dueAmount: sale.totalAmount - totalPayments,
        status: sale.status,
        paymentType: sale.paymentType,
        createdAt: sale.createdAt.toISOString(),
        dueDate: sale.dueDate?.toISOString(),
        notes: sale.notes,
        payments: sale.payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          notes: payment.notes,
          createdAt: payment.createdAt.toISOString(),
        })),
      };
    });

    const stats = {
      totalSales,
      totalAmount,
      totalPaid,
      dueAmount,
      purchaseCount: totalSales,
      paidSalesCount: paidSales.length,
      pendingSalesCount: pendingSales.length,
      partialSalesCount: partialSales.length,
      recentPurchases,
      summary: {
        totalRevenue: totalAmount,
        totalCollected: totalPaid,
        totalPending: dueAmount,
        averageSaleValue: totalSales > 0 ? totalAmount / totalSales : 0,
      },
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Customer stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer statistics", details: error.message },
      { status: 500 }
    );
  }
}
