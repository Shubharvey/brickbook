import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Fetch all sales that have due amounts
    const dues = await db.sale.findMany({
      where: {
        dueAmount: {
          gt: 0, // Only get sales with due amount greater than 0
        },
      },
      select: {
        id: true, // This is the saleId
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
      id: sale.id, // Use sale.id as the due ID
      saleId: sale.id, // Make sure saleId is included
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
