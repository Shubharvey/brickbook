import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    console.log("=== DEBUG PAYMENT TEST ===");

    // Auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Step 1: Check database state
    console.log("1. Checking database state...");
    const sales = await db.sale.findMany({
      where: { userId: decoded.id },
      take: 5,
      select: { id: true, invoiceNo: true, dueAmount: true, customerId: true },
    });

    const customers = await db.customer.findMany({
      where: { userId: decoded.id },
      take: 5,
      select: { id: true, name: true, dueAmount: true },
    });

    console.log("Sales sample:", sales);
    console.log("Customers sample:", customers);

    if (sales.length === 0) {
      return NextResponse.json({ error: "No sales found for user" });
    }

    // Step 2: Try to create a payment
    const testSale = sales.find((s) => s.dueAmount > 0) || sales[0];
    console.log("2. Using sale for test:", testSale);

    console.log("3. Creating payment...");
    const payment = await db.payment.create({
      data: {
        saleId: testSale.id,
        customerId: testSale.customerId,
        userId: decoded.id,
        amount: 1,
        method: "cash",
        referenceNumber: `DEBUG-${Date.now()}`,
        notes: "Debug test payment",
      },
    });
    console.log("Payment created:", payment.id);

    // Step 3: Verify payment was created
    console.log("4. Verifying payment...");
    const verifyPayment = await db.payment.findUnique({
      where: { id: payment.id },
      include: { sale: true, customer: true },
    });
    console.log("Verified payment:", verifyPayment);

    return NextResponse.json({
      success: true,
      steps: {
        databaseCheck: "passed",
        paymentCreation: "passed",
        verification: "passed",
      },
      payment: verifyPayment,
    });
  } catch (error) {
    console.error("=== DEBUG PAYMENT TEST FAILED ===");
    console.error("Error:", error);

    // Detailed error analysis
    let errorDetails = "Unknown error";

    if (error instanceof Error) {
      errorDetails = error.message;

      if (error.message.includes("prisma")) {
        console.error("Prisma-related error");
      }
      if (error.message.includes("connection")) {
        console.error("Database connection error");
      }
      if (error.message.includes("constraint")) {
        console.error("Database constraint error");
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorDetails,
        type: error instanceof Error ? error.name : "Unknown",
      },
      { status: 500 }
    );
  }
}
