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

export async function POST(request: NextRequest) {
  try {
    console.log("=== PAYMENT API CALLED ===");

    const body = await request.json();
    console.log("Payment request body:", body);

    const { saleId, amount, method, paymentMode, referenceNumber, notes } =
      body;

    // Authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Authentication failed: No valid auth header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("Authentication failed: Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("User authenticated:", decoded.id);

    // Validation
    if (!saleId || !amount || amount <= 0) {
      console.log("Validation failed: Missing saleId or amount");
      return NextResponse.json(
        { error: "Valid Sale ID and amount are required" },
        { status: 400 }
      );
    }

    const paymentMethod = method || paymentMode || "cash";
    console.log("Payment method:", paymentMethod);

    // Get sale info
    console.log("Fetching sale:", saleId);
    const sale = await db.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      console.log("Sale not found:", saleId);
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    console.log("Sale found:", {
      invoiceNo: sale.invoiceNo,
      dueAmount: sale.dueAmount,
      customerId: sale.customerId,
    });

    if (amount > sale.dueAmount) {
      console.log("Payment amount exceeds due:", amount, ">", sale.dueAmount);
      return NextResponse.json(
        {
          error: `Payment amount cannot exceed due amount of ₹${sale.dueAmount}`,
        },
        { status: 400 }
      );
    }

    // Create payment
    console.log("Creating payment...");
    const payment = await db.payment.create({
      data: {
        saleId,
        customerId: sale.customerId,
        userId: decoded.id,
        amount,
        method: paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
      },
    });

    console.log("Payment created:", payment.id);

    // Update sale
    const newPaidAmount = sale.paidAmount + amount;
    const newDueAmount = sale.dueAmount - amount;
    const newStatus =
      newDueAmount <= 0 ? "paid" : newPaidAmount > 0 ? "partial" : "pending";

    console.log("Updating sale:", {
      newPaidAmount,
      newDueAmount,
      newStatus,
    });

    await db.sale.update({
      where: { id: saleId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: Math.max(0, newDueAmount),
        status: newStatus,
      },
    });

    console.log("Sale updated successfully");

    return NextResponse.json(
      {
        success: true,
        payment: payment,
        message: "Payment recorded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("=== PAYMENT CREATION ERROR ===");
    console.error("Full error:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      // Specific error handling
      if (error.message.includes("Foreign key constraint")) {
        console.error("Foreign key constraint violation");
        return NextResponse.json(
          {
            error:
              "Invalid sale or customer reference. Please refresh and try again.",
          },
          { status: 400 }
        );
      }
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Payment reference already exists" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to record payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
