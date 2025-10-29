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

    // Log for debugging
    console.log(
      `Fetching payments for customerId: ${params.id}, userId: ${decoded.id}`
    );

    // Fetch sales for this customer (including payments)
    const customerSales = await db.sale.findMany({
      where: {
        customerId: params.id,
        userId: decoded.id,
      },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    console.log(`Fetched ${customerSales.length} sales for customer`);

    const allPayments = customerSales.flatMap((sale) =>
      sale.payments.map((payment) => ({
        ...payment,
        invoiceNo: sale.invoiceNo,
        saleId: sale.id,
        type: "sale_payment",
      }))
    );

    // Fetch due payments recorded separately, linked via sale relation
    const duePayments = await db.payment.findMany({
      where: {
        sale: {
          customerId: params.id,
          userId: decoded.id,
        },
      },
      include: {
        sale: {
          select: {
            invoiceNo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(`Fetched ${duePayments.length} due payments`);

    const transformedDuePayments = duePayments.map((payment) => ({
      id: payment.id,
      saleId: payment.saleId,
      invoiceNo: payment.sale.invoiceNo,
      amount: payment.amount,
      method: payment.method,
      referenceNumber: payment.referenceNumber,
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
      type: "due_payment",
    }));

    // Combine all payment records
    const allCombinedPayments = [
      ...allPayments,
      ...transformedDuePayments,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Log total count of combined payments
    console.log(`Total combined payments: ${allCombinedPayments.length}`);

    return NextResponse.json(allCombinedPayments);
  } catch (error) {
    console.error("Customer payments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer payments" },
      { status: 500 }
    );
  }
}
