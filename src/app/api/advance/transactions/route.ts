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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Build where clause
    const whereClause: any = {
      userId: decoded.id,
    };

    if (type && type !== "all") {
      whereClause.type = type;
    }

    // Fetch advance payments with customer and sale info
    const transactions = await db.advancePayment.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        sale: {
          select: {
            invoiceNo: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate summary
    const summary = {
      totalAdded: transactions
        .filter((t) => t.type === "ADVANCE_ADDED")
        .reduce((sum, t) => sum + t.amount, 0),
      totalUsed: Math.abs(
        transactions
          .filter((t) => t.type === "ADVANCE_USED")
          .reduce((sum, t) => sum + t.amount, 0)
      ),
      totalPayments: transactions
        .filter((t) => t.type === "ADVANCE_PAYMENT")
        .reduce((sum, t) => sum + t.amount, 0),
      netAdvance: transactions.reduce((sum, t) => {
        if (t.type === "ADVANCE_USED") {
          return sum + t.amount; // amount is negative for ADVANCE_USED
        }
        return sum + t.amount;
      }, 0),
    };

    return NextResponse.json({
      transactions,
      summary,
    });
  } catch (error) {
    console.error("Advance transactions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch advance transactions" },
      { status: 500 }
    );
  }
}
