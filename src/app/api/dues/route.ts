import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth"; // Add this import

export async function GET(request: NextRequest) {
  try {
    // Add authentication check
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

    // Fetch all sales that have due amounts AND where customer exists AND belongs to user
    const dues = await db.sale.findMany({
      where: {
        dueAmount: {
          gt: 0, // Only get sales with due amount greater than 0
        },
        userId: userId, // Only get sales for this user
        customer: {
          // Ensure customer exists and belongs to user
          userId: userId,
        },
      },
      select: {
        id: true,
        invoiceNo: true,
        totalAmount: true,
        paidAmount: true,
        dueAmount: true,
        status: true,
        createdAt: true,
        paymentType: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match the Due interface
    const transformedDues = dues.map((sale) => ({
      id: sale.id,
      saleId: sale.id,
      invoiceNo: sale.invoiceNo || `INV-${sale.id.slice(-6)}`,
      customer: {
        id: sale.customer.id,
        name: sale.customer.name,
        phone: sale.customer.phone,
      },
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      status: sale.paymentType as "pending" | "partial" | "paid",
      createdAt: sale.createdAt.toISOString(),
      daysOverdue: Math.ceil(
        (new Date().getTime() - sale.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json(transformedDues);
  } catch (error) {
    console.error("Failed to fetch dues:", error);
    return NextResponse.json(
      { error: "Failed to fetch dues" },
      { status: 500 }
    );
  }
}
