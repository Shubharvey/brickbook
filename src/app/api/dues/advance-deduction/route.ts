import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    console.log("🟢 Advance Deduction API called");

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No auth header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("❌ Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📦 Request body:", body);

    const { saleId, customerId, amount, description, date } = body;

    // Validation
    if (!saleId || !customerId || !amount || amount <= 0) {
      console.log("❌ Validation failed:", { saleId, customerId, amount });
      return NextResponse.json(
        { error: "Sale ID, Customer ID and valid amount are required" },
        { status: 400 }
      );
    }

    // Validate and parse date
    let deductionDate;
    if (date) {
      deductionDate = new Date(date);
      if (isNaN(deductionDate.getTime())) {
        console.log("❌ Invalid date format:", date);
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
    } else {
      deductionDate = new Date(); // Default to current date
    }

    console.log("📅 Using deduction date:", deductionDate);

    // Verify sale exists and belongs to user
    console.log("🔍 Verifying sale:", saleId);
    const sale = await db.sale.findFirst({
      where: {
        id: saleId,
        userId: decoded.id,
        customerId: customerId,
      },
      include: {
        customer: true,
      },
    });

    if (!sale) {
      console.log("❌ Sale not found:", saleId);
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    console.log("✅ Sale found:", sale.invoiceNo);

    // Verify customer exists and has sufficient advance balance
    console.log("🔍 Verifying customer advance balance:", customerId);
    const customer = await db.customer.findFirst({
      where: {
        id: customerId,
        userId: decoded.id,
      },
    });

    if (!customer) {
      console.log("❌ Customer not found:", customerId);
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    console.log("✅ Customer found:", customer.name);
    console.log("💰 Customer advance balance:", customer.advanceBalance);

    // Check if customer has sufficient advance balance
    if (customer.advanceBalance < amount) {
      console.log("❌ Insufficient advance balance");
      return NextResponse.json(
        {
          error: "Insufficient advance balance",
          availableBalance: customer.advanceBalance,
          requiredAmount: amount,
        },
        { status: 400 }
      );
    }

    // Check if due amount is sufficient
    if (sale.dueAmount < amount) {
      console.log("❌ Payment amount exceeds due amount");
      return NextResponse.json(
        {
          error: "Payment amount exceeds due amount",
          dueAmount: sale.dueAmount,
          paymentAmount: amount,
        },
        { status: 400 }
      );
    }

    // Start transaction for atomic operations
    console.log("🔄 Starting database transaction...");

    // 1. Create advance payment record for deduction
    console.log("💾 Creating advance deduction record...");
    const advancePayment = await db.advancePayment.create({
      data: {
        customerId,
        userId: decoded.id,
        amount: -amount, // Negative amount for deduction
        type: "ADVANCE_USED",
        description:
          description ||
          `Advance used for payment - Invoice: ${sale.invoiceNo}`,
        reference: `SALE_${saleId}`,
        notes: `Advance deduction of ₹${amount} for due payment`,
        date: deductionDate,
        saleId: saleId,
      },
    });

    console.log("✅ Advance deduction record created:", advancePayment.id);

    // 2. Update customer's advance balance
    console.log("🔄 Updating customer advance balance...");
    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: {
        advanceBalance: customer.advanceBalance - amount,
      },
    });

    console.log(
      "✅ Customer advance balance updated:",
      updatedCustomer.advanceBalance
    );

    // 3. Update sale payment details
    console.log("🔄 Updating sale payment details...");
    const newPaidAmount = sale.paidAmount + amount;
    const newDueAmount = sale.dueAmount - amount;
    const newStatus = newDueAmount === 0 ? "paid" : "partial";

    const updatedSale = await db.sale.update({
      where: { id: saleId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: newStatus,
      },
    });

    console.log(
      "✅ Sale updated - Paid:",
      newPaidAmount,
      "Due:",
      newDueAmount,
      "Status:",
      newStatus
    );

    // 4. Create payment record
    console.log("💾 Creating payment record...");
    const paymentRecord = await db.payment.create({
      data: {
        saleId: saleId,
        customerId: customerId,
        userId: decoded.id,
        amount: amount,
        method: "advance_deduction",
        notes: `Paid from advance balance - ${description || "Due payment"}`,
        referenceNumber: `ADV_${advancePayment.id.slice(-8)}`,
      },
    });

    console.log("✅ Payment record created:", paymentRecord.id);

    return NextResponse.json({
      success: true,
      message: `₹${amount} deducted from advance and applied to due payment successfully`,
      data: {
        advancePayment,
        customer: updatedCustomer,
        sale: updatedSale,
        payment: paymentRecord,
      },
      summary: {
        amountDeducted: amount,
        remainingAdvance: updatedCustomer.advanceBalance,
        remainingDue: newDueAmount,
        newStatus: newStatus,
      },
    });
  } catch (error: any) {
    console.error("❌ Advance deduction error:", error);
    console.error("📝 Error details:", error.message);
    console.error("🔧 Error stack:", error.stack);

    return NextResponse.json(
      {
        error: "Failed to process advance deduction",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
