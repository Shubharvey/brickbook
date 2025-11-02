import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    const sales = await db.sale.findMany({
      where: { userId: decoded.id },
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sales);
  } catch (error: any) {
    console.error("Sales fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🟢 Starting sale creation...");

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
    console.log("📦 Received sale data:", body);

    // Basic validation
    if (!body.customerId || !body.items || !body.totalAmount) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const {
      customerId,
      items,
      totalAmount,
      paidAmount = 0,
      paymentType = "full_cash",
      dueDate,
      notes,
      deliveryStatus = "pending",
      deliveryAddress,
      deliveryDate,
      isBackDate = false,
      saleDate,
      paymentMode = "cash",
      paymentReference,
      bankTransactionId,
      discountType = "none",
      discountValue = 0,
      discountAmount = 0,
      advancePayment = 0,
      advanceUsed = 0,
      originalPaymentType,
    } = body;

    console.log("🔍 Validating customer...");

    // Get customer
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

    // Payment processing logic
    const finalPaidAmount = parseFloat(paidAmount) || 0;
    const finalAdvancePayment = parseFloat(advancePayment) || 0;
    const finalAdvanceUsed = parseFloat(advanceUsed) || 0;
    const actualPaymentType = originalPaymentType || paymentType;

    console.log("💰 Payment Summary:", {
      actualPaymentType,
      paidAmount: finalPaidAmount,
      advanceUsed: finalAdvanceUsed,
      advancePayment: finalAdvancePayment,
      customerAdvance: customer.advanceBalance,
      totalAmount,
    });

    // Validate advance usage
    if (finalAdvanceUsed > customer.advanceBalance) {
      console.log("❌ Insufficient advance balance");
      return NextResponse.json(
        { error: "Insufficient advance balance" },
        { status: 400 }
      );
    }

    // Calculate due amount based on payment type
    let totalPayment = 0;
    let dueAmount = 0;

    if (actualPaymentType === "partial_cash") {
      // For partial cash: only cash payment is considered
      totalPayment = finalPaidAmount;
      dueAmount = Math.max(0, totalAmount - totalPayment);
      console.log("💰 Partial Cash Payment:", {
        paid: finalPaidAmount,
        due: dueAmount,
        total: totalAmount,
      });
    } else if (actualPaymentType === "advance_cash") {
      // For advance + cash: both advance and cash are considered
      totalPayment = finalPaidAmount + finalAdvanceUsed;
      dueAmount = Math.max(0, totalAmount - totalPayment);
      console.log("💰 Advance + Cash Payment:", {
        advanceUsed: finalAdvanceUsed,
        cashPaid: finalPaidAmount,
        totalPayment,
        due: dueAmount,
        total: totalAmount,
      });
    } else if (actualPaymentType === "full_advance") {
      // For full advance: only advance is considered
      totalPayment = finalAdvanceUsed;
      dueAmount = Math.max(0, totalAmount - totalPayment);
      console.log("💰 Full Advance Payment:", {
        advanceUsed: finalAdvanceUsed,
        totalPayment,
        due: dueAmount,
        total: totalAmount,
      });
    } else {
      // For full_cash and credit
      totalPayment = finalPaidAmount;
      dueAmount = Math.max(0, totalAmount - totalPayment);
      console.log("💰 Standard Payment:", {
        paid: finalPaidAmount,
        due: dueAmount,
        total: totalAmount,
      });
    }

    console.log("🧮 Final Amounts calculated:", {
      totalPayment,
      dueAmount,
      totalAmount,
    });

    // Determine sale status based on payment
    let saleStatus: "paid" | "partial" | "pending" = "pending";

    if (dueAmount === 0) {
      saleStatus = "paid";
    } else if (totalPayment > 0) {
      saleStatus = "partial";
    } else {
      saleStatus = "pending";
    }

    console.log("📊 Sale Status:", saleStatus);

    // Generate invoice number
    const invoiceNo = `INV-${Date.now()}`;
    const finalSaleDate =
      isBackDate && saleDate ? new Date(saleDate) : new Date();

    console.log("💾 Creating sale record...");

    // Create sale
    const sale = await db.sale.create({
      data: {
        invoiceNo,
        customerId,
        userId: decoded.id,
        items,
        totalAmount,
        paidAmount: finalPaidAmount,
        dueAmount,
        paymentType: actualPaymentType, // Store the actual payment type
        status: saleStatus,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        deliveryStatus,
        deliveryAddress,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        saleDate: finalSaleDate,
        paymentMode,
        paymentReference: paymentReference || null,
        bankTransactionId: bankTransactionId || null,
        discountType: discountType === "none" ? null : discountType,
        discountValue,
        discountAmount,
        isBackDate,
        deliveryNotes: notes || null,
      },
    });

    console.log("✅ Sale created:", sale.id);

    // Handle advance balance updates
    const advanceBalanceChange = finalAdvancePayment - finalAdvanceUsed;

    if (advanceBalanceChange !== 0) {
      console.log("🔄 Updating customer advance balance...");

      await db.customer.update({
        where: { id: customerId },
        data: {
          advanceBalance: {
            increment: advanceBalanceChange,
          },
          lastPurchaseDate: new Date(),
        },
      });

      console.log("✅ Customer advance balance updated");
    } else {
      // Still update last purchase date even if no advance change
      await db.customer.update({
        where: { id: customerId },
        data: {
          lastPurchaseDate: new Date(),
        },
      });
      console.log("📅 Customer last purchase date updated");
    }

    // Update customer due amount if there's a due
    if (dueAmount > 0) {
      console.log("📈 Updating customer due amount...");

      await db.customer.update({
        where: { id: customerId },
        data: {
          dueAmount: {
            increment: dueAmount,
          },
        },
      });

      console.log("✅ Customer due amount updated");
    }

    console.log("🎉 Sale completed successfully!");

    return NextResponse.json({
      success: true,
      sale,
      paymentSummary: {
        paymentType: actualPaymentType,
        totalAmount,
        paidAmount: finalPaidAmount,
        advanceUsed: finalAdvanceUsed,
        advancePayment: finalAdvancePayment,
        dueAmount,
        totalPayment,
        advanceBalanceChange,
        newAdvanceBalance: customer.advanceBalance + advanceBalanceChange,
      },
      message: `Sale created successfully. ${
        advanceBalanceChange > 0
          ? `Advance balance increased by ₹${advanceBalanceChange}`
          : advanceBalanceChange < 0
          ? `Advance balance decreased by ₹${Math.abs(advanceBalanceChange)}`
          : "Advance balance unchanged"
      }`,
    });
  } catch (error: any) {
    console.error("❌ SALE CREATION FAILED:", error);
    console.error("📝 Error message:", error.message);
    console.error("🔧 Error stack:", error.stack);

    return NextResponse.json(
      {
        error: "Failed to create sale",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
