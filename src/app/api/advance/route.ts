import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// GET: Fetch all customers with advance balance
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

    // Fetch customers with advance balance
    const customersWithAdvance = await db.customer.findMany({
      where: {
        userId: decoded.id,
        advanceBalance: {
          gt: 0, // Only customers with positive advance balance
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        advanceBalance: true,
        lastPurchaseDate: true,
        createdAt: true,
      },
      orderBy: {
        advanceBalance: "desc", // Highest advance first
      },
    });

    // Calculate totals
    const totalAdvance = customersWithAdvance.reduce(
      (sum, customer) => sum + customer.advanceBalance,
      0
    );

    return NextResponse.json({
      customers: customersWithAdvance,
      summary: {
        totalAdvance,
        totalCustomers: customersWithAdvance.length,
      },
    });
  } catch (error) {
    console.error("Advance fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch advance data" },
      { status: 500 }
    );
  }
}

// POST: Add advance payment to customer
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
    const { customerId, amount, description, reference, notes } = body;

    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Customer ID and valid amount are required" },
        { status: 400 }
      );
    }

    // Verify customer exists and belongs to user
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

    // Create advance payment record
    const advancePayment = await db.advancePayment.create({
      data: {
        customerId,
        userId: decoded.id,
        amount,
        type: "advance_added",
        description: description || "Manual advance payment",
        reference: reference || null,
        notes: notes || null,
      },
    });

    // Update customer's advance balance
    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: {
        advanceBalance: customer.advanceBalance + amount,
        lastPurchaseDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      advancePayment,
      customer: updatedCustomer,
      message: `Advance of ₹${amount} added successfully to ${customer.name}`,
    });
  } catch (error) {
    console.error("Advance payment error:", error);
    return NextResponse.json(
      { error: "Failed to add advance payment" },
      { status: 500 }
    );
  }
}
