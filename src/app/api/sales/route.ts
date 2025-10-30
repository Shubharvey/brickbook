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
    const {
      customerId,
      items,
      totalAmount,
      paidAmount,
      paymentType,
      dueDate,
      notes,
      // DELIVERY FIELDS
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
      // NEW: Advance payment fields
      advancePayment = 0, // Extra amount paid as advance
      useAdvance = false, // Whether to use existing advance
      advanceUsed = 0, // Amount of advance to use
    } = body;

    if (!customerId || !items || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get customer current advance balance
    const customer = await db.customer.findFirst({
      where: {
        id: customerId,
        userId: decoded.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Validate advance usage
    if (useAdvance && advanceUsed > customer.advanceBalance) {
      return NextResponse.json(
        { error: "Insufficient advance balance" },
        { status: 400 }
      );
    }

    // Calculate payment amounts with advance logic
    let finalPaidAmount = paidAmount || 0;
    let finalAdvancePayment = advancePayment || 0;
    let finalAdvanceUsed = useAdvance ? advanceUsed : 0;

    // If using advance, add it to paid amount
    if (useAdvance && advanceUsed > 0) {
      finalPaidAmount += advanceUsed;
    }

    // Calculate due amount
    const dueAmount = Math.max(0, totalAmount - finalPaidAmount);

    // Determine if there's extra payment that should go to advance
    const extraPayment = Math.max(0, finalPaidAmount - totalAmount);
    if (extraPayment > 0) {
      finalAdvancePayment += extraPayment;
      finalPaidAmount = totalAmount; // Cap paid amount at total
    }

    let status = "pending";
    if (dueAmount === 0) {
      status = "paid";
    } else if (finalPaidAmount > 0) {
      status = "partial";
    }

    // Generate invoice number
    const invoiceNo = `INV-${Date.now()}`;

    // Use back date if provided, otherwise current date
    const finalSaleDate =
      isBackDate && saleDate ? new Date(saleDate) : new Date();

    // Create sale transaction
    const sale = await db.sale.create({
      data: {
        invoiceNo,
        customerId,
        userId: decoded.id,
        items,
        totalAmount,
        paidAmount: finalPaidAmount,
        dueAmount,
        paymentType,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        deliveryStatus,
        deliveryAddress,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        saleDate: finalSaleDate,
        paymentMode,
        paymentReference,
        bankTransactionId,
        discountType: discountType === "none" ? null : discountType,
        discountValue,
        discountAmount,
        isBackDate,
        deliveryNotes: notes,
      },
      include: {
        customer: true,
      },
    });

    // Handle advance transactions
    const advanceTransactions = [];

    // 1. Create advance payment record if customer paid extra
    if (finalAdvancePayment > 0) {
      const advancePaymentRecord = await db.advancePayment.create({
        data: {
          customerId,
          userId: decoded.id,
          amount: finalAdvancePayment,
          type: "ADVANCE_PAYMENT",
          description: `Extra payment from sale ${invoiceNo}`,
          reference: invoiceNo,
          saleId: sale.id,
          notes: `Extra payment of ₹${finalAdvancePayment} from sale transaction`,
        },
      });
      advanceTransactions.push(advancePaymentRecord);
    }

    // 2. Create advance used record if customer used existing advance
    if (finalAdvanceUsed > 0) {
      const advanceUsedRecord = await db.advancePayment.create({
        data: {
          customerId,
          userId: decoded.id,
          amount: -finalAdvanceUsed, // Negative amount for usage
          type: "ADVANCE_USED",
          description: `Advance used for sale ${invoiceNo}`,
          reference: invoiceNo,
          saleId: sale.id,
          notes: `Used ₹${finalAdvanceUsed} advance for sale payment`,
        },
      });
      advanceTransactions.push(advanceUsedRecord);
    }

    // Update customer's advance balance
    const advanceBalanceChange = finalAdvancePayment - finalAdvanceUsed;
    if (advanceBalanceChange !== 0) {
      await db.customer.update({
        where: { id: customerId },
        data: {
          advanceBalance: customer.advanceBalance + advanceBalanceChange,
          lastPurchaseDate: new Date(),
        },
      });
    }

    return NextResponse.json({
      ...sale,
      advanceTransactions,
      advanceBalanceChange,
      message: `Sale created successfully. ${
        finalAdvancePayment > 0
          ? `₹${finalAdvancePayment} added to advance. `
          : ""
      }${
        finalAdvanceUsed > 0 ? `₹${finalAdvanceUsed} used from advance. ` : ""
      }`,
    });
  } catch (error: any) {
    console.error("Sale creation error:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
