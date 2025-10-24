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
    } = body;

    if (!customerId || !items || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNo = `INV-${Date.now()}`;

    const dueAmount = totalAmount - (paidAmount || 0);
    let status = "pending";

    if (dueAmount === 0) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    }

    const sale = await db.sale.create({
      data: {
        invoiceNo,
        customerId,
        userId: decoded.id,
        items,
        totalAmount,
        paidAmount: paidAmount || 0,
        dueAmount,
        paymentType,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(sale);
  } catch (error: any) {
    console.error("Sale creation error:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
