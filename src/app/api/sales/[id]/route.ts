// src/app/api/customers/[id]/stats/route.ts

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

    // Fetch customer with all related sales
    const customer = await db.customer.findUnique({
      where: { id: params.id, userId: decoded.id },
      include: {
        sales: {
          include: { payments: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Aggregate totals
    const totalSales = customer.sales.reduce(
      (sum, s) => sum + s.totalAmount,
      0
    );
    const totalItems = customer.sales.reduce((count, s) => {
      try {
        const items = Array.isArray(s.items)
          ? s.items
          : JSON.parse(s.items as any);
        return count + items.length;
      } catch {
        return count;
      }
    }, 0);
    const totalDue = customer.sales.reduce((sum, s) => sum + s.dueAmount, 0);

    const transactions = customer.sales.map((s) => ({
      id: s.id,
      date: s.createdAt,
      invoiceNo: s.invoiceNo,
      amount: s.totalAmount,
      paid: s.paidAmount,
      due: s.dueAmount,
      status: s.status,
    }));

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      totalSales,
      totalItems,
      totalDue,
      transactions,
    });
  } catch (error) {
    console.error("Customer stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer stats" },
      { status: 500 }
    );
  }
}
