import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      saleId,
      amount,
      method,
      paymentMode,
      referenceNumber,
      notes,
      customerId,
    } = body;

    // Use paymentMode if method is not provided (for backward compatibility)
    const paymentMethod = method || paymentMode || "cash";

    if (!saleId || !amount) {
      return NextResponse.json(
        { error: "Sale ID and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Create payment record with all fields
    const payment = await db.payment.create({
      data: {
        saleId,
        amount,
        method: paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
      },
    });

    // Update sale with new payment info
    const sale = await db.sale.findUnique({
      where: { id: saleId },
    });

    if (sale) {
      const newPaidAmount = sale.paidAmount + amount;
      const newDueAmount = sale.dueAmount - amount;
      const newStatus =
        newDueAmount <= 0 ? "paid" : newPaidAmount > 0 ? "partial" : "pending";

      await db.sale.update({
        where: { id: saleId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: Math.max(0, newDueAmount),
          status: newStatus,
          paymentType:
            newDueAmount === 0
              ? "cash"
              : newPaidAmount > 0
              ? "partial"
              : "credit",
        },
      });

      // Also update customer's due amount if customerId is provided
      if (customerId) {
        const customer = await db.customer.findUnique({
          where: { id: customerId },
        });

        if (customer) {
          const newCustomerDueAmount = Math.max(0, customer.dueAmount - amount);
          await db.customer.update({
            where: { id: customerId },
            data: {
              dueAmount: newCustomerDueAmount,
              lastPurchaseDate: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        payment: payment,
        message: "Payment recorded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to record payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
